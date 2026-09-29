# Verification

The initial release was checked locally with:

- 17 game-engine tests: all rank boundaries, uncapped king stars, penalty boundaries/caps, sleep mapping, hobby awards, per-star loss events at the floor, empty-plan protection, streak milestones, earned shields, missing-day resets, chronological correction, Diamond block pairing, promotion/demotion, import parsing, Pacific date boundaries, refresh-safe timer arithmetic, explicit reward-only settlement and isolation of that exception from subsequent days.
- TypeScript `tsc --noEmit` and the production Vinext build.
- A live local API smoke test: authenticated persistence, stale-write rejection, invalid settlement rejection, duplicate-date rejection, cross-origin rejection and unauthenticated rejection. Its synthetic fixture was removed while preserving other records.
- Browser interaction checks: imported plan and usage draft, save and reload persistence; focus start/pause/reload/cancel; complete star-by-star preview and unchanged history afterward. Test timing was discarded without recording activity.
- Local layout inspection at the browser's normal narrow and medium panel sizes. No automated cross-browser matrix has been run.
- Staged-source privacy scan. Actual personal snapshots and QA backups remain ignored. This is not a certification that arbitrary future changes are safe to publish.
- Reward-only settlement was saved through the version-checked API and read back. The browser showed four completed blocks, unknown/range durations, four awarded stars, zero deductions, a promotion and the explicit one-day exception. Original usage and missing bedtime evidence were preserved.

Run the optional local API smoke check with `node --experimental-strip-types tests/api-smoke.mjs` while the development server is running. It refuses non-loopback URLs and aborts if its synthetic date is already in use. Source-control privacy checks run separately with `npm run privacy:check` after staging.

## Onboarding verification — 2026-09-29

The documented portable workflow was exercised in an isolated temporary copy with no personal runtime state, no cloud credentials, a fresh dependency install and its own local D1 database:

- `npm ci`, `npm run setup:local`, and `npm run db:local` completed; the initial migration created the database.
- `npm run build` completed from that clean installation.
- `npm run dev -- --host 127.0.0.1 --port 5187 --strictPort` served the app; the browser displayed the empty lobby and connected-records status.
- The live API smoke test passed local sign-in, persistence/readback, stale version, invalid settlement, duplicate date, cross-origin and unauthenticated checks. Its synthetic record was removed.
- The working checkout passed all 17 game tests, TypeScript checking, documentation relative-link/example checks and the staged privacy scan.

This run used macOS with Node 23.7.0/npm 10.9.2 already installed. npm warned that an ESLint dependency excludes Node 23; the onboarding guide recommends Node 24 or Node 22.13+ within the 22.x line. No Windows/Linux startup or Node 24 run was performed in this check. The sandbox required explicit loopback-port permission for the database tool and dev server. The `db:local` script now loads the existing project-local environment configuration so Wrangler does not try to write its logs into the user preferences directory.
