import {check} from './engine.mjs';import {examples} from './examples.mjs';
const $=id=>document.getElementById(id);let report=null,model=null,index=0;
const item=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
function invalidate(){report=null;model=null;index=0;$('export').disabled=true;$('step').disabled=true;$('status').textContent='Model changed. Run a new analysis.';$('trace').replaceChildren();$('deadlocks').replaceChildren();$('explored').textContent='—';$('length').textContent='—';$('position').textContent='';}
function load(){invalidate();$('model').value=JSON.stringify(examples[$('example').value],null,2);}
function run(){invalidate();try{if($('model').value.length>200000)throw new Error('Model must be under 200000 characters.');model=JSON.parse($('model').value);const limits={maxDepth:Number($('depth').value),maxStates:Number($('limit').value)};report={...check(model,limits),limits};
 $('status').textContent={unsafe:'Unsafe state reachable — counterexample found.',safe:'Complete: no unsafe state reachable in this model.',inconclusive:'Inconclusive: exploration limit reached.'}[report.status];
 $('explored').textContent=report.explored;$('length').textContent=report.status==='unsafe'?`${report.trace.length} steps`:'—';
 $('trace').replaceChildren(...report.trace.map(t=>item('li',`${t.from} → [${t.action}] → ${t.to}`)));if(!report.trace.length)$('trace').append(item('li',report.status==='unsafe'?'The initial state is already unsafe.':'No counterexample returned.'));
 $('deadlocks').replaceChildren(...(report.deadlocks.length?report.deadlocks:['None encountered in explored states.']).map(t=>item('li',t)));
 $('position').textContent=`Replay starts at: ${model.initial}`;$('step').disabled=!report.trace.length;$('export').disabled=false;
 }catch(e){report=null;$('status').textContent=`Input error: ${e.message}`;}}
 $('example').onchange=load; for(const id of ['model','depth','limit'])$(id).oninput=invalidate;$('run').onclick=run;
 $('step').onclick=()=>{const t=report.trace[index++];$('position').textContent=`Step ${index}: ${t.action} → ${t.to}`;$('step').disabled=index>=report.trace.length;};
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({schema:1,model,report},null,2)],{type:'application/json'}));const a=item('a','');a.href=url;a.download='workflow-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};load();
