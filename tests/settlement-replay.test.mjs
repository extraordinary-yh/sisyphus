import test from 'node:test';
import assert from 'node:assert/strict';
import { newDay, replay } from '../lib/game.ts';
import { settlementPlaylist, settlementFingerprint, readWatched } from '../lib/settlement-replay.ts';
const day = date => ({ ...newDay(date), settled:true, usageConfirmed:true, bedtime:'00:44' });
test('playlist keeps chronological daily results, gaps and zero-event days without modifying scores', () => {
 const results = replay([day('2026-01-01'), day('2026-01-03'), {...day('2026-01-04'), settled:false}]);
 const original=structuredClone(results);
 assert.deepEqual(settlementPlaylist([...results].reverse()).map(r=>r.date), ['2026-01-01','2026-01-03']);
 assert.deepEqual(settlementPlaylist(results,'2026-01-02','2026-01-03').map(r=>r.date),['2026-01-03']);
 assert.equal(settlementPlaylist(results,'2026-01-04').length,0);
 assert.equal(settlementPlaylist(results)[0].events.length,0);
 assert.deepEqual(results,original);
});
test('watched results stay skipped across reloads, while corrections become pending again', () => {
 const results=replay([day('2026-01-01'),day('2026-01-02')]);
 const watched=readWatched(JSON.stringify({[results[0].date]:settlementFingerprint(results[0])}));
 assert.deepEqual(settlementPlaylist(results,'','9999-12-31',watched).map(r=>r.date),['2026-01-02']);
 const corrected=replay([{...day('2026-01-01'),bedtime:'00:20'},day('2026-01-02')]);
 assert.deepEqual(settlementPlaylist(corrected,'','9999-12-31',watched).map(r=>r.date),['2026-01-01','2026-01-02']);
 for (const raw of ['broken','null','[]','42']) assert.deepEqual(readWatched(raw),{});
 assert.deepEqual(readWatched('{"bad":"x","2026-01-01":2}'),{});
});
