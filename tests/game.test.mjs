import test from "node:test";
import assert from "node:assert/strict";
import {
  rankAt,
  videoPenalty,
  sleepScore,
  replay,
  newDay,
  shiftDay,
  parseUsage,
  DEFAULT_RULES,
  today,
  dayVideoPenalty,
  daySleepScore,
  canSettle,
  blockDurationLabel,
} from "../lib/game.ts";
function day(date = "2026-01-01", count = 1) {
  return {
    ...newDay(date),
    blocks: Array.from({ length: count }, (_, i) => ({
      id: String(i),
      title: `Task ${i}`,
      minutes: 30,
      done: true,
      firstAction: "",
    })),
    usageConfirmed: true,
    bedtime: "00:45",
    settled: true,
  };
}
test("explicit reward-only day preserves evidence, waives losses and does not invent a perfect day", () => {
  const d = day("2026-01-01", 4);
  d.rewardOnlyReason = "Opening-day rewards only";
  d.usage = [{ id: "v", name: "Video", seconds: 19000, category: "video" }];
  d.usageConfirmed = false;
  d.bedtime = "";
  d.blocks[0].minutes = null;
  d.blocks[1].minutes = null;
  d.blocks[1].minutesRange = { min: 90, max: 120 };
  const original = structuredClone(d);
  const r = replay([d])[0];
  assert.deepEqual(d, original);
  assert.equal(canSettle(d), true);
  assert.equal(r.gained, 4);
  assert.equal(r.lost, 0);
  assert.equal(r.net, 4);
  assert.equal(r.after, 4);
  assert.equal(r.perfect, false);
  assert.equal(r.streak, 0);
  assert.equal(r.events.length, 4);
  assert.equal(rankAt(r.after).label, "废铁 Ⅱ");
  assert.equal(rankAt(r.after).filled, 1);
  assert.equal(dayVideoPenalty(d), 0);
  assert.equal(daySleepScore({ ...d, bedtime: "04:00" }), 0);
  assert.equal(daySleepScore({ ...d, bedtime: "00:20" }), 1);
  assert.equal(blockDurationLabel(d.blocks[0]), "实际时长未确认");
  assert.equal(blockDurationLabel(d.blocks[1]), "约 90–120 min");
  assert.equal(replay([d])[0].after, 4);
});
test("reward-only exception never carries to the next day", () => {
  const a = day("2026-01-01", 4);
  a.rewardOnlyReason = "Opening-day rewards only";
  const b = day("2026-01-02", 0);
  b.usage = [{ id: "v", name: "Video", seconds: 7201, category: "video" }];
  b.bedtime = "02:00";
  const r = replay([a, b])[1];
  assert.equal(r.lost, 4);
  assert.equal(r.after, 0);
  assert.equal(canSettle({ ...b, usageConfirmed: false }), false);
  assert.equal(canSettle({ ...b, bedtime: "" }), false);
  assert.equal(newDay("2026-01-03").rewardOnlyReason, undefined);
});
test("starts at iron III zero; all rank and subdivision thresholds", () => {
  assert.equal(rankAt(0).label, "废铁 Ⅲ");
  assert.equal(rankAt(2).filled, 2);
  assert.equal(rankAt(3).label, "废铁 Ⅱ");
  for (const [score, name] of [
    [9, "青铜 Ⅲ"],
    [18, "白银 Ⅲ"],
    [27, "黄金 Ⅳ"],
    [43, "铂金 Ⅳ"],
    [59, "钻石 Ⅴ"],
    [84, "星耀 Ⅴ"],
    [109, "最强王者"],
    [134, "无双王者"],
    [159, "荣耀王者"],
    [209, "传奇王者"],
  ])
    assert.equal(rankAt(score).label, name);
  assert.equal(rankAt(10000).filled, 9891);
});
test("gradient video boundary seconds and cap", () => {
  for (const [s, n] of [
    [0, 0],
    [3600, 0],
    [3601, 1],
    [7200, 1],
    [7201, 2],
    [10800, 2],
    [10801, 4],
    [14401, 8],
    [18001, 16],
    [21601, 32],
    [86400, 32],
  ])
    assert.equal(videoPenalty(s), n);
});
test("linear mode rounds excess up with one free hour", () => {
  assert.equal(videoPenalty(7800, "linear"), 2);
  assert.equal(videoPenalty(7200, "linear"), 1);
});
test("sleep midnight mapping, inclusive cutoff, hourly boundaries and cap", () => {
  for (const [time, n] of [
    ["", 0],
    ["22:15", 1],
    ["00:00", 1],
    ["00:30", 1],
    ["00:31", 0],
    ["00:59", 0],
    ["01:00", -1],
    ["01:59", -1],
    ["02:00", -2],
    ["03:00", -4],
    ["04:00", -8],
    ["05:00", -16],
    ["11:59", -16],
  ])
    assert.equal(sleepScore(time), n);
});
test("one event per gained/lost star, floor absorbs loss but preserves audit", () => {
  const d = day();
  d.usage = [{ id: "v", name: "Video", seconds: 14401, category: "video" }];
  d.bedtime = "02:00";
  const r = replay([d])[0];
  assert.equal(r.gained, 1);
  assert.equal(r.lost, 10);
  assert.equal(r.events.length, 11);
  assert.equal(r.after, 0);
  assert.equal(r.net, -9);
  assert.equal(r.applied, 0);
  assert.equal(
    r.events.filter((e) => e.delta === -1 && e.before === 0).length,
    9,
  );
});
test("hobbies award once per kind and excluded learning video never penalizes", () => {
  const d = day();
  d.hobbies[0].minutes = 120;
  d.usage = [{ id: "x", name: "Course", seconds: 20000, category: "excluded" }];
  const r = replay([d])[0];
  assert.equal(r.gained, 2);
  assert.equal(r.lost, 0);
  assert.equal(r.perfect, true);
});
test("empty study plan or unconfirmed usage cannot earn a streak", () => {
  const d = day();
  d.blocks = [];
  assert.equal(replay([d])[0].perfect, false);
  d.blocks = day().blocks;
  d.usageConfirmed = false;
  assert.equal(replay([d])[0].perfect, false);
});
test("milestone rewards on 3,7,14,30 and 33; no reward for unrecorded days", () => {
  const ds = Array.from({ length: 33 }, (_, i) =>
    day(shiftDay("2026-01-01", i)),
  );
  const rs = replay(ds);
  for (const [i, n] of [
    [2, 1],
    [6, 2],
    [13, 3],
    [29, 5],
    [32, 1],
  ])
    assert.equal(rs[i].bonus, n);
  assert.equal(rs[3].bonus, 0);
  assert.equal(replay([day("2026-01-01"), day("2026-01-03")])[1].streak, 1);
});
test("shield is earned, explicitly used once, no star protection or false perfect day", () => {
  const ds = Array.from({ length: 7 }, (_, i) =>
    day(shiftDay("2026-01-01", i)),
  );
  const bad = day("2026-01-08");
  bad.blocks[0].done = false;
  bad.useShield = true;
  bad.usage = [{ id: "v", name: "Video", seconds: 7201, category: "video" }];
  const next = day("2026-01-09");
  const rs = replay([...ds, bad, next]);
  assert.equal(rs[6].shields, 1);
  assert.equal(rs[7].shieldUsed, true);
  assert.equal(rs[7].streak, 7);
  assert.equal(rs[7].strictStreak, 0);
  assert.equal(rs[7].perfect, false);
  assert.equal(rs[7].lost, 2);
  assert.equal(rs[8].streak, 8);
  assert.equal(rs[8].shields, 0);
});
test("chronological replay is deterministic after correction and ignores drafts", () => {
  const a = day(),
    b = day("2026-01-02");
  assert.deepEqual(replay([b, a]), replay([a, b]));
  const draft = { ...day("2026-01-03"), settled: false };
  assert.equal(replay([a, b, draft]).length, 2);
  const original = replay([a, b]);
  assert.deepEqual(replay([a, b]), original);
  a.blocks[0].done = false;
  assert.equal(replay([a, b])[1].after, 1);
});
test("diamond reward uses beginning-of-day rank and pairs do not carry", () => {
  const ds = [];
  let i = 0;
  while ((replay(ds).at(-1)?.after ?? 0) < 59) {
    const d = day(shiftDay("2026-01-01", i++), 1);
    d.rules = { mode: "gradient", streak: false, shield: false };
    ds.push(d);
  }
  const d = day(shiftDay("2026-01-01", i++), 3);
  d.rules = { mode: "gradient", streak: false, shield: false };
  ds.push(d);
  const result = replay(ds).at(-1);
  assert.equal(result.gained, 1);
  assert.equal(result.studyRemainder, 1);
  const one = day(shiftDay("2026-01-01", i), 1);
  one.rules = d.rules;
  assert.equal(replay([...ds, one]).at(-1).gained, 0);
});
test("promotion and demotion events are recorded", () => {
  const a = day("2026-01-01", 3);
  a.rules = { mode: "gradient", streak: false, shield: false };
  const b = day("2026-01-02", 0);
  b.usage = [{ id: "v", name: "Video", seconds: 3601, category: "video" }];
  assert.equal(replay([a])[0].events.at(-1).promotion, true);
  assert.equal(replay([a, b])[1].events.at(-1).demotion, true);
});
test("CSV and copied durations retain seconds and unknown sites require categorization", () => {
  const rs = parseUsage(
    "name,minutes\nYouTube,15\nCourse site,20\nbilibili 1h 20m 5s",
  );
  assert.equal(rs.length, 3);
  assert.equal(rs[0].seconds, 900);
  assert.equal(rs[1].category, "excluded");
  assert.equal(rs[2].seconds, 4805);
});
test("Pacific day selection respects UTC offset and DST independent of browser zone", () => {
  assert.equal(today(new Date("2026-09-29T02:00:00Z")), "2026-09-28");
  assert.equal(today(new Date("2026-01-02T07:59:00Z")), "2026-01-01");
  assert.equal(shiftDay("2026-03-08", 1), "2026-03-09");
});

test('focus countdown survives a stale render clock, elapsed deadline and pause', async()=>{
  const {focusRemaining}=await import('../lib/game.ts');
  const f={id:'test',day:'2026-01-01',kind:'hobby',targetId:'guitar',title:'Guitar',duration:60,remaining:60,endsAt:62000,status:'running'};
  assert.equal(focusRemaining(f,1000),60);
  assert.equal(focusRemaining(f,32000),30);
  assert.equal(focusRemaining(f,120000),0);
  assert.equal(focusRemaining({...f,status:'paused',endsAt:null,remaining:27},120000),27);
});
