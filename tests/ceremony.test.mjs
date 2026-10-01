import test from 'node:test';
import assert from 'node:assert/strict';
import { rankAt, newDay, replay, shiftDay } from '../lib/game.ts';
import { entryReplay, advancePlayback, socketFrame, INTRO_MS, IMPACT_MS, TRANSFORM_MS, eventDuration } from '../lib/ceremony.ts';
const event = (before, after) => ({ before, after, delta: after > before ? 1 : -1, type: 'study', label: 'Synthetic study', promotion:rankAt(after).label !== rankAt(before).label && after>before, demotion:rankAt(after).label !== rankAt(before).label && after<before });
const frame = (e,t) => socketFrame(e,rankAt(e.before),rankAt(e.after),t);
test('entry replay selects exactly yesterday without inventing or settling a day',()=>{
 const d = {...newDay('2026-01-02'), settled:true, usageConfirmed:true, bedtime:'00:20'};
 const rs=replay([d]), saved=structuredClone(rs);
 assert.equal(entryReplay(rs,shiftDay('2026-01-03',-1)),rs[0]);
 assert.equal(entryReplay(rs,'2026-01-03'),null);
 assert.equal(entryReplay([], '2026-01-02'),null);
 assert.deepEqual(rs,saved);
});
test('automatic timeline visits every award and loss exactly once and ends on a summary',()=>{
 const events=[event(0,1), event(1,2),event(2,3),event(3,2),event(2,1)];
 let cursor={index:-1,elapsed:0}; const visited=[];
 for(let i=0;i<1000 && cursor.index<events.length;i++) {
  const previous=cursor.index;cursor=advancePlayback(cursor,50,events);
  if(cursor.index!==previous && cursor.index<events.length)visited.push(cursor.index);
 }
 assert.deepEqual(visited,[0,1,2,3,4]);
 assert.deepEqual(cursor,{index:events.length,elapsed:0});
 assert.equal(advancePlayback(cursor,500,events),cursor);
 assert.deepEqual(advancePlayback({index:-1,elapsed:0},INTRO_MS,[]),{index:0,elapsed:0});
});
test('star sockets commit on impact, fill the last slot before promotion, then reset for the new rank',()=>{
 const e=event(26,27);
 assert.deepEqual([frame(e,0).filled,frame(e,0).count],[2,3]);
 assert.equal(frame(e,IMPACT_MS-1).filled,2);
 assert.deepEqual([frame(e,IMPACT_MS).filled,frame(e,IMPACT_MS).count],[3,3]);
 assert.equal(frame(e,IMPACT_MS).target,2);
 assert.deepEqual([frame(e,TRANSFORM_MS).filled,frame(e,TRANSFORM_MS).count],[0,4]);
 assert.ok(eventDuration(e)>TRANSFORM_MS);
});
test('demotion crosses back into the prior division with correct sockets; floor still records a loss',()=>{
 const e=event(27,26);
 assert.equal(frame(e,0).count,4);
 assert.equal(frame(e,0).target,0);
 assert.deepEqual([frame(e,TRANSFORM_MS).count,frame(e,TRANSFORM_MS).filled],[3,2]);
 const floor={...event(1,0),before:0};
 assert.equal(frame(floor,IMPACT_MS).floor,true);
 assert.equal(frame(floor,IMPACT_MS).filled,0);
 assert.equal(frame(event(109,110),IMPACT_MS).filled,1);
 assert.equal(frame(event(209,208),TRANSFORM_MS).count,1);
 assert.equal(frame(event(109,108),IMPACT_MS).kingStars,0);
 assert.equal(frame(event(109,108),IMPACT_MS).filled,0);
 assert.equal(frame(event(108,109),TRANSFORM_MS).kingStars,0);
 assert.equal(frame(event(209,210),IMPACT_MS).kingStars,101);
});
