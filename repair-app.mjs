import {planRepairs} from './repair.mjs';
const $=id=>document.getElementById(id);
let model={initial:'Draft',unsafe:['Unreviewed release'],terminal:['Published'],transitions:[{from:'Draft',to:'Review',action:'Submit for review'},{from:'Review',to:'Approved',action:'Approve'},{from:'Approved',to:'Published',action:'Release'},{from:'Draft',to:'Unreviewed release',action:'Legacy publish bypass'},{from:'Review',to:'Unreviewed release',action:'Emergency bypass'},{from:'Review',to:'Draft',action:'Request changes'}]},evidence=null;
const node=(tag,text,parent)=>{const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;};
const label=i=>{const e=model.transitions[i];return `#${i} ${e.from} → ${e.to} (${e.action})`;};
function invalidate(){evidence=null;$('export').disabled=true;$('repairs').replaceChildren();$('baseline').replaceChildren();$('status').textContent='Settings changed. Run the planner to produce fresh evidence.';}
function controls(){
 $('run').disabled=false;
 $('edges').replaceChildren();model.transitions.forEach((edge,i)=>{const row=node('label','',$('edges'));row.className='edge';const box=document.createElement('input');box.type='checkbox';box.value=i;box.checked=i<12;box.addEventListener('change',invalidate);row.append(box);const text=node('span',`#${i} ${edge.action}`,row);node('small',`${edge.from} → ${edge.to}`,text);});
 $('goal').replaceChildren();const none=node('option','No required goal',$('goal'));none.value='';[...new Set([model.initial,...model.transitions.flatMap(e=>[e.from,e.to])])].forEach(s=>{const o=node('option',s,$('goal'));o.value=s;});if((model.terminal||[])[0]&&[...$('goal').options].some(o=>o.value===model.terminal[0]))$('goal').value=model.terminal[0];$('model').value=JSON.stringify(model,null,2);invalidate();
}
function trace(indices){return indices.length?indices.map(label).join(' → '):`Initial state: ${model.initial}`;}
$('load').onclick=()=>{try{const raw=$('model').value;if(raw.length>200000)throw Error('Input exceeds 200000 characters.');const next=JSON.parse(raw);planRepairs(next,{editable:[],maxRemovals:0});model=next;controls();}catch(e){invalidate();$('status').textContent=`Cannot load model: ${e.message}`;}};
$('goal').onchange=invalidate;$('budget').oninput=invalidate;$('model').oninput=()=>{invalidate();$('run').disabled=true;$('status').textContent='Model text changed. Choose Load model before planning.';};
$('run').onclick=()=>{invalidate();try{
 const options={editable:[...$('edges').querySelectorAll('input:checked')].map(n=>Number(n.value)),goals:$('goal').value?[$('goal').value]:[],maxRemovals:Number($('budget').value)};
 const result=planRepairs(model,options);evidence={model,options,result};$('export').disabled=false;
 $('status').textContent=`${result.status} · ${result.checked} candidate sets checked · ${result.repairs.length} minimum repairs. ${result.reason||''}`;
 node('strong','Original failure witness',$('baseline'));node('p',result.baseline.unsafeWitness?trace(result.baseline.unsafeWitness.trace):'No unsafe state is reachable.',$('baseline')).className='trace';
 result.repairs.slice(0,30).forEach((r,i)=>{const card=node('article','',$('repairs'));node('h3',`Repair ${i+1} / remove ${r.disabled.length}`,card);const ul=node('ul','',card);r.disabled.forEach(e=>node('li',label(e),ul));if(!r.disabled.length)node('p','No changes required.',card);node('p',`Lost reachable states: ${r.lostStates.join(', ')||'none'}`,card);node('p',`Deadlocks after repair: ${r.deadlocks.join(', ')||'none'}`,card);r.goalWitnesses.forEach(g=>node('p',`Preserved ${g.state}: ${trace(g.trace)}`,card).className='trace');const detail=node('details','',card);node('summary','Why each removal is necessary',detail);r.necessity.forEach(n=>node('p',`Restore #${n.restoredEdge}: ${trace(n.unsafeWitness.trace)}`,detail));});
 if(result.repairs.length>30)node('p','Showing the first 30 alternatives. Export contains every minimum repair.',$('repairs'));
 }catch(e){$('status').textContent=`Cannot plan: ${e.message}`;}};
$('export').onclick=()=>{if(!evidence)return;const url=URL.createObjectURL(new Blob([JSON.stringify(evidence,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='counterfactual-repair-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
controls();$('run').click();
