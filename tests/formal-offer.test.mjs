import test from 'node:test';import assert from 'node:assert/strict';
import {newDay, nextTierScore, rankAt, replay, canSettle} from '../lib/game.ts';
const day=date=>({...newDay(date),settled:true,usageConfirmed:true,bedtime:'00:44'});
const offer={id:'confirmed-offer',title:'Synthetic formal offer',evidence:'Explicitly confirmed formal offer',kind:'formal-offer'};
test('formal offer reaches the next major tier entry at every boundary and stops at King',()=>{
 for(const [score,target] of [[0,9],[8,9],[9,18],[26,27],[27,43],[58,59],[59,84],[108,109],[109,109],[150,150]]) assert.equal(nextTierScore(score),target);
 const d={...day('2026-01-01'),usage:[{id:'qa-video',name:'Video',category:'video',seconds:30000}],interviewAdvances:[offer]};
 const source=structuredClone(d),r=replay([d])[0];assert.equal(r.after,9);assert.equal(rankAt(r.after).label,'青铜 Ⅲ');assert.equal(r.lost,32);assert.equal(r.events.filter(e=>e.type==='offer').length,9);assert.equal(r.perfect,false);assert.deepEqual(d,source);
});
test('oral notes give no offer reward; formal drafts wait for settlement and duplicate IDs award once',()=>{
 const a=day('2026-01-01'),b=day('2026-01-02');a.note='Oral offer only';assert.equal(replay([a])[0].after,0);
 a.interviewAdvances=[offer];b.interviewAdvances=[offer];assert.deepEqual(replay([a,b]).map(r=>r.after),[9,9]);
 assert.equal(replay([{...a,settled:false},b])[0].after,9);assert.equal(canSettle({...a,bedtime:''}),false);
 assert.equal(replay([{...a,interviewAdvances:[]}, {...b,interviewAdvances:[]}]).at(-1).after,0);
 const old={...day('2026-01-01'),interviewAdvances:[{id:'round',title:'Passed round',evidence:'Confirmed next round'}]};assert.equal(replay([old])[0].after,3);
});

test("formal offers follow interview advances regardless of their input order",()=>{
 const round={id:"round",title:"Passed round",evidence:"Confirmed"};
 const a={...day("2026-01-01"),interviewAdvances:[offer,round]};
 assert.equal(replay([a])[0].after,9);
 assert.deepEqual(replay([a]),replay([{...a,interviewAdvances:[round,offer]}]));
});
