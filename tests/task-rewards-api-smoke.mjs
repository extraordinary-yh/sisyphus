// Run only against an explicitly selected disposable local checkout.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.SISYPHUS_TEST_URL;
assert.match(base||'',/^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const login=await fetch(base+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});
const cookie=login.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie);
async function call(method='GET',body){const r=await fetch(base+'/api/state',{method,headers:{Cookie:cookie,Origin:base,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
const original=await call();assert.equal(original.status,200);assert.equal(original.body.taskRewardsVersion,1);
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/pre-task-smoke-backup.json',JSON.stringify(original.body),{mode:0o600});
const id='action-hub-api-qa-fixture',date='2020-01-02';
assert.ok(!original.body.state.days.some(d=>d.date===date));assert.ok(!original.body.state.taskRewards?.some(r=>r.id===id));
try {
 const reward={id,source:'action-hub',taskId:'synthetic-task',title:'Synthetic API fixture',date,recordedAt:'2020-01-02T20:00:00Z',occurredAt:null,stars:1,active:true};
 const state={...original.body.state,taskRewards:[...(original.body.state.taskRewards||[]),reward]};
 const saved=await call('PUT',{state,version:original.body.version});assert.equal(saved.status,200);
 const read=await call();assert.deepEqual(read.body.state,state);
 const result=read.body.results.find(r=>r.date===date);assert.equal(result.taskOnly,true);assert.equal(result.events.length,1);assert.equal(result.events[0].type,'task');assert.equal(result.applied,1);
 assert.equal((await call('PUT',{state,version:original.body.version})).status,409);
 const duplicate={...state,taskRewards:[...state.taskRewards,reward]};assert.equal((await call('PUT',{state:duplicate,version:read.body.version})).status,400);
 reward.active=false;const reversed=await call('PUT',{state,version:read.body.version});assert.equal(reversed.status,200);assert.ok(!reversed.body.results.some(r=>r.date===date));
 assert.deepEqual(reversed.body.state.days,original.body.state.days);
 console.log('Task reward API smoke passed: round-trip, no daily settlement, duplicate rejection, stale-write protection and reversal.');
} finally {
 for(let n=0;n<3;n++){
  const current=await call();if(!current.body.state.taskRewards?.some(r=>r.id===id))break;
  const state={...current.body.state,taskRewards:current.body.state.taskRewards.filter(r=>r.id!==id)};
  if(!original.body.state.taskRewards&&state.taskRewards.length===0)delete state.taskRewards;
  const clean=await call('PUT',{state,version:current.body.version});
  if(clean.status===200){console.log('Removed only the synthetic reward; preserved existing records.');break;}
  if(n===2)throw Error('Concurrent writes prevented fixture cleanup; backup retained.');
 }
}
