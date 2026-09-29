# Working on Sisyphus

Sisyphus is a Chinese-language, local-first habit game. Start with `README.md` for user onboarding and `docs/game-rules.md` for scoring. This file applies to the whole repository. No specific agent vendor, plugin, account, or external personal repository is required for local use.

## First session

1. Read `git status` and preserve existing work. Check `node --version` and `npm --version`; Node 22.13+ is required, Node 24 recommended.
2. In the repository root run `npm ci`, `npm run setup:local`, then `npm run db:local`.
3. Run `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`. Keep track of the process you started. If occupied, choose another explicit port and report it; do not kill an unidentified process.
4. Open the exact loopback URL and use the local sign-in link. The placeholder user is `Seedy`; this is not a real ChatGPT account. An unauthenticated `/api/state` returning 401 is expected. After local sign-in, GET must return `{state, version, results}`.
5. Verify writes only in a disposable checkout/database. Do not create demo habits or settlements in the user's real records. A blank user's own instance can be checked read-only until they enter actual data.
6. Hand back the URL, start/stop instructions, actual verification results, and backup location. Explain that the terminal must remain running and that database state lives under `.wrangler/`.

If a sandbox reports `listen EPERM`, request permission to bind a loopback port for the migration or dev server. Do not work around it by exposing the server publicly. Wrangler logs and runtime metadata are kept in ignored project-local directories.

A clean clone defaults to the `portable` execution profile. `setup:local` creates ignored configuration and a local D1 migration config; it does not seed personal records. Do not change an existing `managed-linux` profile blindly: it belongs to a different preview environment. Do not install a hosting plugin or request cloud credentials just to run locally. `npm start` launches the built Worker and does not supply the development sign-in middleware; use `npm run dev` for normal local use.

## Data boundaries

- `.wrangler/` is the authoritative local database, not disposable cache. `private-data/` contains optional personal import snapshots. Preserve both.
- Browser localStorage contains recovery drafts and a sound preference. Keep the same browser origin when recovering a draft; a different port or host is a different origin.
- Never use `git clean -fdx`, remove the database to fix a startup error, or replace records with an empty state to fix authentication.
- Export a backup before migrations beyond the normal checked-in migrations, bulk record edits, restores, or changes to scoring that affect existing history. Keep backups in ignored `backups/` or `artifacts/`, never in `public/`.
- Backups and `/api/state` may contain personal study, sleep and usage records. Do not paste their contents into commits, issues, screenshots or logs intended for publication.
- The loopback development profile has one fixed player, shared by all browsers using that database. It is not multi-user authentication. Never expose it with `--host 0.0.0.0`, a public tunnel or a forwarded public port for ordinary local use.
- Actual hosting needs a trusted authentication gateway and a provisioned D1 `DB` binding. Preserve the header-stripping and loopback checks in `build/sites-vite-plugin.ts`.

## Changing records for a user

The primary daily workflow is conversational: the user tells their coding agent what they did, and the agent updates their local instance. A request to log or correct reported activities authorizes those record updates; do not send the user back to fill out the UI or prepare JSON. Use the authenticated, version-checked state API rather than direct SQL:

1. Read the full current envelope and save a private backup.
2. Preserve unrelated days, rules, focus state and source evidence. Apply only the requested edits.
3. PUT `{state, version}` with the current version. On 409, read again and reconcile; never blindly retry a stale full-state overwrite.
4. Read back and verify the intended changes and computed results.

Resolve the record date using the conversation and the app's timezone, asking only if ambiguous (especially after midnight). Match reported work to existing tasks; treat corrections as edits, not new sessions, and avoid duplicating activities already saved. Save partial reports as drafts with missing details unconfirmed. An omitted entertainment total is not zero. Settle when requested and the required evidence is present; ask a focused question when it is missing. For an already settled day, explain the recalculated result after a correction. Finish with what was saved, any missing settlement details, and the rank change if settled. Keep setup examples out of actual records.

Do not invent completed tasks, usage confirmation, bedtime, or exact study durations. `Block.minutes` can be `null`; estimates may use `minutesRange`. The current plan-file UI converts missing/null minutes to 30 and does not preserve ranges, so do not use that importer for uncertain-duration evidence. Preserve `studySession` source dates separately from settlement dates when present.

`rewardOnlyReason` is an optional, explicitly requested exception for one day. Never add it just to make validation pass or spread it to adjacent days. It waives deductions without fabricating evidence or relaxing perfect-day requirements. Normal settlement requires confirmed usage and a bedtime.

## Code map

| File | Responsibility |
| --- | --- |
| `lib/game.ts` | Pure scoring, ranks, replay, date/time rules and focus calculations |
| `lib/validation.ts` | State/envelope schemas and settlement validation |
| `app/page.tsx` | UI, local drafts, imports/exports, focus timer and API calls |
| `app/api/state/route.ts` | Authenticated persistence and optimistic version checks |
| `app/chatgpt-auth.ts` | Trusted gateway header adapter and sign-in paths |
| `db/store.ts`, `db/schema.ts`, `drizzle/` | D1 binding, schema and versioned migrations |
| `vite.config.ts` | Local runtime, private snapshot allowlist and Worker bindings |
| `scripts/setup-local.mjs` | Portable local configuration generation |
| `tests/game.test.mjs` | Deterministic game behavior and boundary tests |
| `tests/api-smoke.mjs` | Optional live API persistence/auth/validation checks |

## Implementation and verification

- Keep scoring deterministic and in `lib/game.ts`. Preserve chronological replay, the zero floor, rank thresholds, and separation between raw star deductions and actual rank change unless explicitly changing the rules.
- The timezone is currently fixed to `America/Los_Angeles`. A timezone feature must address `today()`, schema limits, displayed dates, sleep attribution and boundary tests. Do not rewrite historical dates automatically.
- Use migrations for schema changes; no runtime schema mutation. Preserve compare-and-swap writes and recoverable drafts on failed saves.
- Job Hub and StayFree are optional inputs, not required integrations. Do not search outside this repository for personal sources without user direction. `scripts/import-jobhub.mjs` reads but never edits its supplied source.
- Use the npm lockfile; do not replace it with another package manager's lockfile or upgrade dependencies as an incidental onboarding fix.
- For behavior changes run `npm test`, `npm run typecheck`, and `npm run build`. Add focused tests for changed behavior, not tests that merely duplicate implementation. For documentation-only work verify links, commands and examples.
- For startup/persistence changes, use a disposable checkout with its own `.wrangler/`, install and initialize from scratch, then run `SISYPHUS_TEST_URL=http://127.0.0.1:5174 node --experimental-strip-types tests/api-smoke.mjs` against that checkout's server. The test writes and removes a fixture dated `2020-01-01` and saves a private pre-test backup; it is not read-only.
- State what was actually tested. A build is not proof of working login or persistence. See `docs/verification.md` for prior evidence, not guarantees about future edits.

## Commits and handoff

Stage only intended files. Run `git diff --cached --check` and `npm run privacy:check` after staging: the latter scans the Git index, not all working-tree changes. Inspect the diff manually; the scan detects only known patterns and is not a comprehensive secret audit. Preserve vendored licenses.

Never include `.env*`, `.wrangler/`, `private-data/`, `.sites-runtime/`, `.openai/hosting.json`, exports or QA backups. Do not change repository visibility, deploy, or publish a release merely because onboarding is complete; do so when requested by the owner.

End a handoff with the change, verification, any remaining limitation, and the next concrete command. Keep personal information out of public handoff notes.
