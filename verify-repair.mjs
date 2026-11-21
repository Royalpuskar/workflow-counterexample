// Independent finite-graph checker. Deliberately does not import the planner.
const fail=code=>{throw new Error(code);};
const label=x=>typeof x==='string'&&x.length>0&&x.length<=120;
const array=(x,max)=>Array.isArray(x)&&x.length<=max;
const sameSet=(actual,expected)=>Array.isArray(actual)&&actual.length===expected.size&&new Set(actual).size===actual.length&&actual.every(x=>expected.has(x));

export function verifyRepairEvidence(evidence){
 try {
  const {model:m,options:o,result:r}=evidence||{};
  if(!m||!o||!r||!label(m.initial)||!array(m.transitions,128)||!array(m.unsafe,1000)||!m.unsafe.every(label)||!array(m.terminal||[],1000)||!(m.terminal||[]).every(label))fail('invalid-model');
  const edges=m.transitions;
  if(edges.some(e=>!e||![e.from,e.to,e.action].every(label)))fail('invalid-transition');
  const states=new Set([m.initial,...m.unsafe,...edges.flatMap(e=>[e.from,e.to])]);
  if(states.size>128)fail('model-too-large');
  const editable=o.editable,goals=o.goals??[],budget=o.maxRemovals??4;
  if(!array(editable,12)||new Set(editable).size!==editable.length||editable.some(i=>!Number.isInteger(i)||i<0||i>=edges.length)||!array(goals,128)||goals.some(s=>!states.has(s))||!Number.isInteger(budget)||budget<0||budget>12)fail('invalid-options');
  if(!['repaired','already-safe'].includes(r.status))return {valid:false,code:'unsupported-status'};
  if(!array(r.repairs,4096)||r.repairs.length===0||!Number.isInteger(r.minimumRemovals)||r.minimumRemovals<0||r.minimumRemovals>budget)fail('invalid-repair-report');
  const unsafe=new Set(m.unsafe),terminal=new Set(m.terminal||[]);
  // Fixed-point scanning differs from the planner's adjacency-list BFS.
  function reach(disabled){
   const found=new Set([m.initial]);let changed=true;
   while(changed){changed=false;for(let i=0;i<edges.length;i++){const e=edges[i];if(!disabled.has(i)&&found.has(e.from)&&!found.has(e.to)){found.add(e.to);changed=true;}}}
   return found;
  }
  const satisfies=seen=>![...unsafe].some(s=>seen.has(s))&&goals.every(s=>seen.has(s));
  const baseline=reach(new Set());
  function replay(witness,disabled,target){
   if(!witness||!array(witness.trace,128)||witness.state!==target)return false;
   let state=m.initial;
   for(const i of witness.trace){if(!Number.isInteger(i)||i<0||i>=edges.length||disabled.has(i)||edges[i].from!==state)return false;state=edges[i].to;}
   return state===target;
  }
  const keys=new Set();
  for(const repair of r.repairs){
   if(!repair||!array(repair.disabled,12)||new Set(repair.disabled).size!==repair.disabled.length||repair.disabled.some(i=>!editable.includes(i))||repair.disabled.length!==r.minimumRemovals)fail('invalid-removal-set');
   const disabled=new Set(repair.disabled),key=[...disabled].sort((a,b)=>a-b).join(',');
   if(keys.has(key))fail('duplicate-repair');keys.add(key);
   const seen=reach(disabled);
   if(!satisfies(seen))fail('unsafe-or-goal-lost');
   if(!sameSet(repair.lostStates,new Set([...baseline].filter(s=>!seen.has(s)))))fail('incorrect-lost-states');
   const deadlocks=new Set([...seen].filter(s=>!terminal.has(s)&&!edges.some((e,i)=>e.from===s&&!disabled.has(i))));
   if(!sameSet(repair.deadlocks,deadlocks))fail('incorrect-deadlocks');
   if(!array(repair.goalWitnesses,128)||repair.goalWitnesses.length!==goals.length||!repair.goalWitnesses.every((w,i)=>replay(w,disabled,goals[i])))fail('invalid-goal-witness');
   if(!array(repair.necessity,12)||repair.necessity.length!==disabled.size||new Set(repair.necessity.map(n=>n?.restoredEdge)).size!==disabled.size)fail('invalid-necessity');
   for(const n of repair.necessity){
    if(!disabled.has(n.restoredEdge)||!unsafe.has(n.unsafeWitness?.state))fail('invalid-necessity');
    const restored=new Set(disabled);restored.delete(n.restoredEdge);
    if(!replay(n.unsafeWitness,restored,n.unsafeWitness.state))fail('invalid-necessity-witness');
   }
  }
  // Enumerate masks independently to check minimum size and completeness.
  let minimum=Infinity,expected=new Set(),checked=0;
  for(let mask=0;mask<2**editable.length;mask++){
   const removed=editable.filter((_,i)=>mask&(1<<i));
   if(removed.length>Math.min(budget,r.minimumRemovals))continue;
   checked++;
   if(!satisfies(reach(new Set(removed))))continue;
   if(removed.length<minimum){minimum=removed.length;expected.clear();}
   if(removed.length===minimum)expected.add(removed.sort((a,b)=>a-b).join(','));
  }
  if(minimum!==r.minimumRemovals)fail('not-minimum');
  if(!sameSet([...keys],expected))fail('missing-minimum-alternatives');
  if(r.status!==(minimum===0?'already-safe':'repaired'))fail('incorrect-status');
  return {valid:true,code:'verified',minimumRemovals:minimum,repairsVerified:keys.size,candidateSetsChecked:checked};
 }catch(error){return {valid:false,code:error instanceof Error?error.message:'invalid-evidence'};}
}
