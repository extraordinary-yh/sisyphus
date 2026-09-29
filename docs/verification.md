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
