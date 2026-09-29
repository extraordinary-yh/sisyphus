# Game design and sources

## Aim

Support consistent study and redirect entertainment time toward chosen activities. The game rewards action outside the interface. A clear first step, predictable rewards and a brief end-of-day ceremony are the main loop. No feed, loot boxes, paid recovery or random penalties.

## Research used

- [Duolingo: how streaks keep learners committed](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/). Duolingo reports A/B experiments on streak wagers and weekend protection. This supports trying visible milestones and limited forgiveness; it does not prove that the same parameters will work in a study-and-screen-time game.
- [Duolingo: building a learning habit](https://blog.duolingo.com/putting-in-work-the-habit-of-language-learning/). Use a small concrete starting action and a stable daily routine. Associations between longer streaks and retention are not evidence that longer streaks alone cause better learning.
- [StayFree user guide](https://userguide.stayfreeapps.com/). Cross-device aggregation is useful for reviewing usage. Actual desktop inspection found a readable all-devices dashboard and a settings-backup export. No public automatic usage API or portable usage export was verified during implementation.
- [17173: 王者荣耀段位排列](https://news.17173.com/z/pvp/content/03112025/181409620.shtml). Reference for the familiar mainland ladder division/star structure. This game adds a matching 3×3 iron tier underneath bronze. King remains uncapped as requested. Rank art is original, not extracted from Honor of Kings.

## First-version balance choices

- Streak awards: 3/7/14/30 → 1/2/3/5 stars. Fixed transparent milestones; settings can disable them.
- Shields are earned after seven qualifying days, capped at one, and require explicit use. Track protected and strict streaks separately; never label a protected day as perfect.
- Penalties grow exponentially as requested but cap at 32 video stars and 16 sleep stars. Daily minimum rank score is zero. Revisit after 1–2 weeks of real data if the cost becomes demotivating.
- Hobby awards are once per type per day. More minutes do not farm repeated stars. Custom habits remain self-reported.
- Study thresholds use starting rank, avoiding an ambiguous mid-settlement rule change. Diamond odd blocks do not carry across days; this is visible in the UI.
- Sleep is the reported device-off/attempt-to-sleep time, not inferred sleep quality or a medical measure.
- No automatic season reset. A new calendar month never silently takes away progress.

## Deliberate limits

Automatic StayFree ingestion is unfinished because a stable authorized data interface was not verified. Local snapshots and manual imports are explicitly identified. Timer time is not proof of real activity. Cloud and local D1 databases are separate; move records with an explicit backup import. Importing a backup replaces the active state after user action. Uploaded JSON is schema-validated at save time; the authoritative state is kept in a versioned per-user database row.

## Possible next experiments

Compare one week of gradient penalties with one week of the retained linear rule; examine completion rate and return-after-a-bad-day, not time spent in this app. Consider cosmetic unlocks for lifetime study milestones without granting spendable stars, and a two-minute start ritual. Add reminders only when requested, and keep them optional.
