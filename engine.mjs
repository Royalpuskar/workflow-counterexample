// Explicit finite-state model checker: breadth-first search, no eval or scripts.
export function check(model,{maxStates=1000,maxDepth=50}={}) {
 if(!model||typeof model!=='object'||Array.isArray(model))throw new Error('Model must be an object.');
 if(!Number.isInteger(maxStates)||maxStates<1||maxStates>10000||!Number.isInteger(maxDepth)||maxDepth<0||maxDepth>200)throw new Error('Invalid exploration limits.');
 const {initial,transitions,unsafe,terminal=[]}=model;
 const valid=s=>typeof s==='string'&&s.length>0&&s.length<=120;
 if(!valid(initial)||!Array.isArray(transitions)||transitions.length>5000||!Array.isArray(unsafe)||unsafe.length>1000||!unsafe.every(valid)||!Array.isArray(terminal)||!terminal.every(valid))throw new Error('Expected initial state, transitions array, unsafe array, and optional terminal array.');
 const edges=new Map();
 for(const t of transitions){if(!t||![t.from,t.to,t.action].every(valid))throw new Error('Every transition needs nonempty from, to, and action strings (max 120 characters).'); if(!edges.has(t.from))edges.set(t.from,[]); edges.get(t.from).push(t);}
 const bad=new Set(unsafe),done=new Set(terminal),seen=new Set([initial]),queue=[{state:initial,trace:[]}],deadlocks=[]; let limited=false,explored=0;
 for(let i=0;i<queue.length;i++){
  const current=queue[i]; explored++;
  if(bad.has(current.state))return {status:'unsafe',explored,discovered:seen.size,trace:current.trace,state:current.state,deadlocks};
  const next=edges.get(current.state)||[];
  if(!next.length&&!done.has(current.state))deadlocks.push(current.state);
  for(const t of next){if(seen.has(t.to))continue; if(current.trace.length>=maxDepth||seen.size>=maxStates){limited=true;continue;} seen.add(t.to);queue.push({state:t.to,trace:[...current.trace,{from:t.from,action:t.action,to:t.to}]});}
 }
 return {status:limited?'inconclusive':'safe',explored,discovered:seen.size,trace:[],deadlocks};
}
