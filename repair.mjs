import {check} from './engine.mjs';

// Exhaustive, minimum-cardinality edge removal on small explicit graphs.
export function planRepairs(model,{editable,goals=[],maxRemovals=4}={}) {
  check(model,{maxStates:1000,maxDepth:200});
  const states=new Set([model.initial,...model.unsafe,...model.transitions.flatMap(t=>[t.from,t.to])]);
  if(model.transitions.length>128||states.size>128)throw Error('Repair planning supports at most 128 edges and states.');
  if(!Array.isArray(editable)||editable.length>12||new Set(editable).size!==editable.length||editable.some(i=>!Number.isInteger(i)||i<0||i>=model.transitions.length))throw Error('Choose up to 12 unique editable edge indices.');
  if(!Array.isArray(goals)||goals.length>128||goals.some(g=>typeof g!=='string'||!states.has(g)))throw Error('Goals must be declared state names.');
  if(!Number.isInteger(maxRemovals)||maxRemovals<0||maxRemovals>12)throw Error('maxRemovals must be an integer from 0 to 12.');
  const outgoing=new Map();model.transitions.forEach((edge,index)=>{if(!outgoing.has(edge.from))outgoing.set(edge.from,[]);outgoing.get(edge.from).push({...edge,index});});
  const bad=new Set(model.unsafe);
  function explore(removed){
    const reached=new Map([[model.initial,[]]]),queue=[model.initial],deadlocks=[];let witness=null;
    for(let i=0;i<queue.length;i++){
      const state=queue[i],trace=reached.get(state);
      if(bad.has(state)&&witness===null)witness={state,trace};
      const next=(outgoing.get(state)||[]).filter(e=>!removed.has(e.index));
      if(!next.length&&!(model.terminal||[]).includes(state))deadlocks.push(state);
      for(const edge of next)if(!reached.has(edge.to)){reached.set(edge.to,[...trace,edge.index]);queue.push(edge.to);}
    }
    return {reached,witness,deadlocks};
  }
  const baseline=explore(new Set());
  const baselineInfo={unsafeWitness:baseline.witness,reachableStates:[...baseline.reached.keys()],deadlocks:baseline.deadlocks};
  if(bad.has(model.initial))return {status:'impossible',reason:'The initial state is unsafe; removing edges cannot repair it.',baseline:baselineInfo,checked:0,repairs:[]};
  const missing=goals.filter(g=>!baseline.reached.has(g));
  if(missing.length)return {status:'impossible',reason:'Required goals are unreachable before repair.',missingGoals:missing,baseline:baselineInfo,checked:0,repairs:[]};
  let checked=0;const edges=[...editable].sort((a,b)=>a-b);
  const cap=Math.min(maxRemovals,edges.length);
  for(let size=0;size<=cap;size++){
    const repairs=[];
    function enumerate(start,chosen){
      if(chosen.length===size){
        checked++;const disabled=new Set(chosen),result=explore(disabled);
        if(result.witness||goals.some(g=>!result.reached.has(g)))return;
        const necessity=chosen.map(index=>{const restored=new Set(disabled);restored.delete(index);return {restoredEdge:index,unsafeWitness:explore(restored).witness};});
        repairs.push({disabled:[...chosen],lostStates:[...baseline.reached.keys()].filter(s=>!result.reached.has(s)),deadlocks:result.deadlocks,goalWitnesses:goals.map(state=>({state,trace:result.reached.get(state)})),necessity});return;
      }
      for(let i=start;i<=edges.length-(size-chosen.length);i++)enumerate(i+1,[...chosen,edges[i]]);
    }
    enumerate(0,[]);
    if(repairs.length)return {status:size===0?'already-safe':'repaired',minimumRemovals:size,checked,baseline:baselineInfo,repairs};
  }
  return {status:cap===edges.length?'impossible':'budget-exhausted',reason:cap===edges.length?'No allowed removal set preserves all goals and eliminates unsafe reachability.':'No repair within the removal budget; larger repairs were not checked.',checked,baseline:baselineInfo,repairs:[]};
}
