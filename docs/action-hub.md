# Optional Action Hub task rewards

`GameState.taskRewards` is an optional stream of confirmed task-output rewards, independent of daily usage and bedtime settlement. A stable reward ID earns one star once; an inactive reward reverses it on replay. This stream must come from a confirmed completion or meaningful milestone, never an opened page or expired timer.

Each entry preserves `occurredAt` (possibly unknown) and `recordedAt`. Its game date is the reward recording date in America/Los_Angeles. Remembering old work does not invent an exact activity date or rewrite a past day's raw study/sleep evidence.

The state API advertises `taskRewardsVersion:1`. External adapters must read the full envelope, save a private backup, preserve unrelated fields, PUT with the current version and verify the saved rewards. A 409 requires rereading. Ordinary historical rules remain unchanged in the absence of this optional stream. Task-only results never fabricate a settled day, perfect day, sleep, usage, or streak.

Action Hub remains authoritative for these rewards. Correct an outcome there and synchronize; do not award the same output as a new study block as well. No D1 schema migration or required external account is introduced.
