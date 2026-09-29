# SISYPHUS · Ranked Habits

**English** | [简体中文](README.zh-CN.md)

Turn studying, daily habits, and screen time into a personal ranked game. Complete real-world tasks, earn stars, and climb from Iron to King.

Sisyphus runs **locally, with your data on your own machine**. It includes study plans, hobbies, entertainment tracking, bedtime records, a focus timer, streaks, and history replays. **The app interface is currently in Chinese**; this guide includes the relevant button labels.

- No ChatGPT login, API key, Cloudflare account, or paid service is needed for local use.
- Job Hub and StayFree are optional. You can enter everything manually.
- Dates currently use **America/Los_Angeles**. There is no timezone setting in the UI yet.
- There is no cross-device sync, automatic app monitoring, or app blocking.

## Start with your coding agent

Give this repository to your preferred coding agent and paste:

> Read AGENTS.md and README.md, then help me run Sisyphus locally. Check my Node version, install the locked dependencies, initialize the local configuration and database, start the server on 127.0.0.1, and verify sign-in, reads, and saves. Test writes in an isolated environment without adding demo data to my real records. Preserve existing databases and drafts. When finished, tell me the URL, how to start it next time, where my data lives, and how to back it up. Use manual entry if I don't have Job Hub or StayFree.

See [AGENTS.md](AGENTS.md) for development and handoff instructions.

## Quick start

You need Git, Node.js, and npm. **Node 24 is recommended**; Node 22.x starting at 22.13 is also supported. Avoid odd-numbered versions such as Node 23, which some dependencies exclude. The initial install requires internet access.

```sh
git clone https://github.com/extraordinary-yh/sisyphus.git
cd sisyphus
npm ci
npm run setup:local
npm run db:local
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open <http://127.0.0.1:5173> and click **登录** (Sign in). Local sign-in uses a fixed development user, with no real account required. `Seedy` in the terminal is the placeholder user's name. If the repository is still private, you need repository access to clone it.

A successful setup shows the page, loads your records after sign-in, and retains a saved draft after a refresh. The first page compilation may take a little time. Keep the terminal running; press `Ctrl+C` to stop the server.

For later sessions:

```sh
cd sisyphus
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

`cd sisyphus` assumes you are in its parent directory. You can also open a terminal directly in the project folder. Run all npm commands from the repository root.

## Your first day

1. Select today and add a real study task. You can also load the [example plan](examples/study-plan.json) through **数据背包 → 选择计划** (Data → Choose plan), or **导入计划 JSON** (Import plan JSON) in the study editor. Its task is marked incomplete; adapt it to your own plans.
2. Start a focus timer if useful. A finished timer does not automatically mark a task complete; you confirm completion yourself.
3. Record hobbies and time spent watching entertainment videos or gaming. Check categories and duplicate entries, then confirm the full-day total. Explicitly confirm zero if you had no entertainment time.
4. Enter when you shut down your devices to try sleeping. After-midnight times belong to the morning following the selected date.
5. Preview and settle the day. Replaying history does not award stars again. Editing an earlier record recalculates subsequent results chronologically.

Study, hobbies, and bedtime affect stars; excess entertainment incurs deductions. See [scoring rules](docs/game-rules.md) for ranks, boundaries, and special settlement rules.

## Data, backups, and updates

| Content | Location | Notes |
| --- | --- | --- |
| Saved records, rules, and timer state | Local D1 database under `.wrangler/` | Authoritative data; do not delete it as cache |
| Unsaved/recovery drafts and sound preference | Browser localStorage | Not shared across browsers or origins; not a backup |
| Optional import snapshots | `private-data/` | Personal data, ignored by Git |
| Local configuration | `.sites-runtime/`, `.openai/hosting.json` | Generated during setup; do not upload |

Back up through **数据背包 → 导出 JSON** (Data → Export JSON). To move to another machine, initialize the project there, select **读取备份** (Read backup), review it, then click **恢复这份草稿** (Restore this draft) to save. **Restoring replaces the current records**, so export them first. Backup JSON contains personal records; store it privately.

Each local database uses one fixed development user. Different browsers signed into the same instance share its saved records. If two windows conflict when saving, export the current draft and reload to reconcile rather than forcing an overwrite.

Before updating, export a backup, stop the server, and check `git status`. If you have no local code changes:

```sh
git pull --ff-only
npm ci
npm run setup:local
npm run db:local
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

If you or your agent have customized the code, reconcile those changes first. Do not fix update problems with `git reset --hard` or `git clean -fdx`; the latter also deletes the ignored local database.

## Optional imports

### Study plans / Job Hub

Anyone can import a JSON plan through the UI without another repository:

```json
{
  "date": "2026-01-01",
  "blocks": [
    {
      "id": "study-1",
      "title": "Learn a new concept",
      "minutes": 30,
      "done": false,
      "firstAction": "Open your notes and write down today's question"
    }
  ]
}
```

Change the date to your plan's date. Importing replaces the selected day's task list and takes effect when saved. Reusing a plan on a different date clears its completion flags. The UI plan importer currently suits known, whole-minute durations; see [AGENTS.md](AGENTS.md) for handling unknown durations or estimates.

If you have a compatible Job Hub repository containing `study-plan/plans/YYYY-MM-DD.json`:

```sh
node scripts/import-jobhub.mjs "/path/to/your/job-hub"
```

This reads the latest 30 plans and writes `private-data/jobhub-plans.json` without modifying the source repository. Rerun it manually to refresh the snapshot. The local page reads it through `/local/jobhub`.

### Entertainment time / StayFree

Enter time manually or paste `name,minutes` CSV or text such as `YouTube 1h 20m`. Imports replace the current list rather than appending. Unknown sources default to excluded; classify them and check for overlapping devices, domains, and subdomains.

StayFree **does not sync automatically**. Its settings export is not a usage report. An optional local snapshot has this format:

```json
{
  "date": "2026-01-01",
  "source": "Manually verified usage",
  "usage": [
    { "id": "video-1", "name": "YouTube", "seconds": 1200, "category": "video" }
  ]
}
```

Save it to the ignored `private-data/stayfree.json` to read it from the UI. Categories are `video`, `game`, or `excluded`. Both `/local/*` snapshot routes exist only in the development server.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Clone reports Repository not found | Check the URL and your access; private repositories require authorization |
| Node version error during install or startup | Check `node --version`, switch to Node 24, and rerun `npm ci` |
| Missing `.openai/hosting.json` | Run `npm run setup:local` from the repository root |
| `no such table: players` | Stop the server, run `npm run db:local`, and restart; do not delete `.wrangler/` |
| Port 5173 is occupied | Use `--port 5174 --strictPort` and the corresponding URL; save or export drafts before changing origins |
| Not signed in / 401 | Use `npm run dev`, open `127.0.0.1`, and click 登录; `npm start` is not the local onboarding entry point |
| `/local/jobhub` or `/local/stayfree` returns 404 | The optional snapshot has not been created; manual entry works without it |
| Date differs from your local date | Dates currently use Los Angeles time; customization must cover date validation and tests |
| Save fails or a record version conflicts | Export the draft first, then check sign-in, database status, and other windows; preserve recovery drafts |

## Development and contributions

React + TypeScript, with Vinext/Vite for the runtime and Cloudflare D1 for persistence. Ordinary local development uses the `portable` profile and needs no special agent plugin.

```sh
npm test
npm run typecheck
npm run build
npm run privacy:check
```

`privacy:check` scans **the Git index**, not unstaged changes or untracked files. Before committing, stage the intended files, inspect `git diff --cached`, and run the scan. Do not commit personal records, secrets, exports, or QA backups. `.gitignore` does not remove anything from history.

- [Agent instructions and code map](AGENTS.md)
- [Scoring rules](docs/game-rules.md)
- [Design notes and research sources](docs/design.md)
- [Verification notes and API smoke test](docs/verification.md)
- [Original AI artwork prompts](docs/art-prompts.json)

## Hosting

Local use is the recommended starting point. Development sign-in is for a single-player loopback environment; do not expose the development port publicly or share it through a tunnel.

Hosting requires a real authentication gateway and a provisioned D1 `DB` binding. The current code integrates with the Sites authentication gateway. `npm run build` builds the app; it does not deploy it or provision online accounts or databases. Making the GitHub repository public does not publish an online service.

## License

This project uses the [MIT License](LICENSE). Third-party code retains its own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
