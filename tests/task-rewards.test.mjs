import test from 'node:test';
import assert from 'node:assert/strict';
import {replay,newDay} from '../lib/game.ts';
const reward=(id='task-one',date='2026-01-02')=>({id,source:'action-hub',taskId:id,title:'A meaningful output',date,recordedAt:`${date}T18:00:00Z`,occurredAt:null,stars:1,active:true});
test('task stars appear without complete usage, bedtime, or a settled day',()=>{
  const day=newDay('2026-01-02'),before=structuredClone(day),r=replay([day],[reward()])[0];
  assert.equal(r.after,1);assert.equal(r.taskOnly,true);assert.equal(r.perfect,false);assert.equal(r.streak,0);assert.equal(r.events[0].type,'task');assert.deepEqual(day,before);
});
test('task reward retries and correction cannot award twice',()=>{
  assert.equal(replay([],[reward(),reward()])[0].after,1);
  assert.deepEqual(replay([],[{...reward(),active:false}]),[]);
});
test('old history stays identical without task rewards; new rewards preserve earlier results',()=>{
  const old={...newDay('2026-01-01'),settled:true,usageConfirmed:true,bedtime:'00:20'};
  assert.deepEqual(replay([old],[]),replay([old]));
  assert.deepEqual(replay([old],[reward()])[0],replay([old])[0]);
  assert.equal(replay([old],[reward()])[1].after,replay([old])[0].after+1);
});
test('a task-only day does not fabricate a daily streak or shield',()=>{
  const a={...newDay('2026-01-01'),settled:true,usageConfirmed:true,bedtime:'00:45',blocks:[{id:'b',title:'Study',done:true,minutes:30,firstAction:''}]};
  const b={...a,date:'2026-01-03'};
  const results=replay([a,b],[reward()]);
  assert.equal(results[1].streak,1);assert.equal(results[1].perfect,false);assert.equal(results[2].streak,1);assert.equal(results[1].shields,0);
});
