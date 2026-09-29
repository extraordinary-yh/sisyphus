# SISYPHUS · 自律排位

把学习、生活习惯与屏幕使用转化成每天一场的个人排位赛。深蓝金色的游戏大厅、八阶徽章、逐星结算、连胜里程碑与专注计时。

## Run locally

Requires Node.js 22.13+ (Node 24 recommended) and npm.

```sh
npm ci
npm run setup:local
npm run db:local
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173 and use the local sign-in link. The development profile is a loopback-only single-player profile, not production authentication. Records persist in the local D1 database under `.wrangler/`, independent of browser storage. Keep that directory or export a JSON backup before moving machines. Hosted deployments require the Sites authentication gateway and a provisioned D1 `DB` binding. Do not expose the development server to the network.

## Daily play

1. Choose the date you are recording. Today and past days are supported in America/Los_Angeles time.
2. Import a Job Hub plan JSON or add study blocks. Mark only completed work. Plans copied to a different date reset completion flags.
3. Enter entertainment minutes, classify each source, and confirm the full-day total. Imported rows replace the current list; they are not appended and double-counted.
4. Record guitar, French, reading, exercise, other hobbies and the time you shut down all devices to try sleeping.
5. Preview the result and settle. The animation shows every earned and lost star. Replaying is read-only; correcting a day recalculates all subsequent days chronologically.

A persistent focus timer supports pause, resume and refresh. It can encourage staying on task; it cannot block other apps. Elapsed time requires confirmation, and interrupting a study timer does not mark its block complete.

## Rank and scoring

| Tier | Divisions | Stars per division | Total score at entry |
| --- | ---: | ---: | ---: |
| 废铁 | 3 | 3 | 0 |
| 青铜 | 3 | 3 | 9 |
| 白银 | 3 | 3 | 18 |
| 黄金 | 4 | 4 | 27 |
| 铂金 | 4 | 4 | 43 |
| 钻石 | 5 | 5 | 59 |
| 星耀 | 5 | 5 | 84 |
| 王者 | unlimited | unlimited | 109 |

Study: one star per block below Diamond; one per two blocks from Diamond onward, determined by the rank at the start of the day. Odd blocks do not carry over. Each qualifying hobby awards one star per day. The default qualifying duration, including exercise, is 30 minutes.

Gradient entertainment penalties: ≤1h 0; >1h −1; >2h −2; >3h −4; >4h −8; >5h −16; >6h −32, capped at 32. Exact 2h remains −1; one second later becomes −2. Video and manually entered games share this total.

Sleep: ≤00:30 +1; 00:31–00:59 0; 01:00–01:59 −1; 02:00–02:59 −2; 03:00–03:59 −4; 04:00–04:59 −8; 05:00 onward −16. Evening times belong to the selected day, post-midnight times to the following morning. The linear original rule is also available in settings.

All planned blocks completed and ≤60 minutes entertainment earns a perfect day. A nonempty plan and confirmed usage are required. Streak milestones at 3/7/14/30 qualifying days award +1/+2/+3/+5, repeating in 30-day cycles. Every seven qualifying streak days earns one shield (inventory cap one). Shields require explicit use, preserve the protected streak without incrementing it, and never prevent star penalties. Strict streaks still reset. Missing calendar days reset both streak counts.

The floor is 废铁 III 0 stars. Every deduction is recorded and animated even at the floor; no negative debt is created. Raw net stars and actual rank change are shown separately.

A day can carry an explicitly requested `rewardOnlyReason` exception. That day's video and late-sleep deductions are waived, while the original evidence stays intact. Missing usage confirmation and bedtime remain unknown and do not prevent this special settlement. The exception is shown in the lobby, history and replay, never propagates to another day, and does not waive the normal perfect-day requirements. It is absent by default.

Completed session records can preserve a separate `studySession` source (session ID, study date and original plan date) alongside the chosen settlement date. Unknown block minutes remain `null`; estimated durations use `minutesRange` without inventing a precise duration. Neither changes the block-based reward.

## Local imports and privacy

```sh
node scripts/import-jobhub.mjs /absolute/path/to/your/job-hub
```

This reads the latest 30 source plan files and writes only `private-data/jobhub-plans.json`. It never edits the source repository. The local Vite preview serves the exact whitelisted snapshot via `/local/jobhub`; this route does not exist in production. Run the command again to refresh the snapshot, or import the plan JSON in the app.

StayFree is not automatically synchronized. The first version supports manual entry and pasted `name,minutes` CSV / `YouTube 1h 20m` text. Its settings export is a settings backup, not verified usage data. A manually captured snapshot can be saved as ignored `private-data/stayfree.json` with `{date, source, usage:[{id,name,seconds,category}]}` and read from the local UI. Validate dates, full-day completeness and overlapping aggregate/subdomain rows. Unknown sources default to excluded until classified. Game tracking is manual only.

Personal snapshots, runtime databases, exports, recovery files, `.env*`, account-specific hosting configuration and QA artifacts are ignored. They are also outside public assets. The production bundle contains no private snapshots. Local browser storage holds only recoverable unsaved drafts and a sound preference; the database is authoritative.

The repository must stay **private until its owner explicitly approves making it public**. `.gitignore` does not sanitize Git history. Run `npm run privacy:check` after staging and inspect the diff and commit history before publishing. This check catches known private paths, personal home-directory paths and common key formats; it is not a comprehensive data-loss prevention system.

## Engineering

- React + TypeScript, Vinext/Vite, Radix/Shadcn primitives, Cloudflare D1.
- Pure deterministic game engine: `lib/game.ts`.
- Input validation: `lib/validation.ts`; authenticated, version-checked state writes: `app/api/state/route.ts`.
- Per-user records; optimistic compare-and-swap prevents silent overwrite by another tab. Failed saves retain a local recovery draft.
- Schema migrations: `drizzle/`; no runtime schema mutation.
- Read-only WebMCP progress tool is registered when the browser implements `navigator.modelContext`.
- Original AI-generated game art is in `public/art/`; prompts and asset details in `docs/art-prompts.json`.

```sh
npm test
npm run typecheck
npm run build
npm run privacy:check
```

See [design notes](docs/design.md) for research references and open balance questions.
