// Optional live-local smoke test. Uses one explicitly synthetic old date and
// removes only its own fixture, preserving concurrent records with version checks.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {newDay} from '../lib/game.ts';
const base=process.env.SISYPHUS_TEST_URL||'http://127.0.0.1:5173';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw Error('Local preview only');
const login=await fetch(base+'/signin-with-chatgpt?return_to=%2F',{redirect:'manual'});
const cookie=login.headers.get('set-cookie')?.split(';')[0];
assert.ok(cookie,'Local sign-in did not set a cookie');
async function call(method='GET',data,extra={}){const r=await fetch(base+'/api/state',{method,headers:{Cookie:cookie,Origin:base,...extra,...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});const text=await r.text();let body;try{body=JSON.parse(text)}catch{body={error:text}}return {status:r.status,body}}
const original=await call();assert.equal(original.status,200);
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/pre-smoke-backup.json',JSON.stringify(original.body));
const date='2020-01-01',marker='SISYPHUS_API_QA_FIXTURE';
assert.ok(!original.body.state.days.some(d=>d.date===date),'Fixture date already exists; no changes made');
const d={...newDay(date),blocks:[1,2,3].map(n=>({id:'qa-'+n,title:'QA synthetic task '+n,minutes:1,done:true,firstAction:'Synthetic test fixture'})),bedtime:'00:30',usageConfirmed:true,settled:true,note:marker};
try{
 const state={...original.body.state,days:[...original.body.state.days,d]};
 const saved=await call('PUT',{version:original.body.version,state});assert.equal(saved.status,200);assert.equal(saved.body.results.find(r=>r.date===date).events.length,4);
 const read=await call();assert.equal(read.body.version,saved.body.version);assert.deepEqual(read.body.state,state);
 assert.equal((await call('PUT',{version:original.body.version,state})).status,409);
 const invalid=structuredClone(state);invalid.days.find(x=>x.date===date).usageConfirmed=false;assert.equal((await call('PUT',{version:read.body.version,state:invalid})).status,400);
 assert.equal((await call('PUT',{version:read.body.version,state},{Origin:'https://untrusted.example'})).status,403);
 const timed=structuredClone(state);const timedDay=timed.days.find(x=>x.date===date);
 timedDay.rules.studyReward='time-or-blocks';timedDay.productiveMinutes=240;timedDay.blocks=[];
 const timedSave=await call('PUT',{version:read.body.version,state:timed});assert.equal(timedSave.status,200);
 const timedRead=await call();assert.deepEqual(timedRead.body.state,timed);
 const timedResult=timedRead.body.results.find(x=>x.date===date);
 assert.equal(timedResult.events.filter(x=>x.type==='study').length,2);assert.equal(timedResult.perfect,false);
 const missingSleep=structuredClone(timed);missingSleep.days.find(x=>x.date===date).bedtime='';
 assert.equal((await call('PUT',{version:timedRead.body.version,state:missingSleep})).status,400);
 const badTime=structuredClone(timed);badTime.days.find(x=>x.date===date).productiveMinutes=1441;
 assert.equal((await call('PUT',{version:timedRead.body.version,state:badTime})).status,400);
 const badRule=structuredClone(timed);badRule.days.find(x=>x.date===date).rules.studyReward='unknown';
 assert.equal((await call('PUT',{version:timedRead.body.version,state:badRule})).status,400);
 const dupe=structuredClone(state);dupe.days.push(d);assert.equal((await call('PUT',{version:read.body.version,state:dupe})).status,400);
 const unauth=await fetch(base+'/api/state');assert.equal(unauth.status,401);
 console.log('API smoke passed: authenticated persistence, time-or-blocks round-trip/scoring, invalid time/rule rejection, per-star ledger, stale-write rejection, invalid settlement, duplicate date, cross-origin rejection, unauthenticated denial.');
}finally{
 for(let n=0;n<3;n++){const current=await call();const fixture=current.body.state.days.find(x=>x.date===date);if(!fixture)break;if(fixture.note!==marker)throw Error('Fixture ownership changed; cleanup stopped');const restored={...current.body.state,days:current.body.state.days.filter(x=>x.date!==date)};const clean=await call('PUT',{version:current.body.version,state:restored});if(clean.status===200){console.log('Synthetic fixture removed; existing records preserved.');break}if(n===2)throw Error('Concurrent changes prevented cleanup; retained backup in artifacts/.')}
}
