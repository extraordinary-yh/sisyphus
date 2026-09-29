# SISYPHUS · 自律排位

[English](README.md) | **简体中文**

把学习、生活习惯与屏幕使用转化成每天一场的个人排位赛。完成现实中的任务，逐星结算，从废铁升到王者。

这是一个 **本地运行、自己保存数据** 的习惯记录工具。当前界面为中文，支持学习计划、兴趣习惯、娱乐时长、睡觉时间、专注计时、连胜和历史回放。

- 无需 ChatGPT 登录、API key、Cloudflare 账号或付费服务即可本地使用。
- 无需 Job Hub 或 StayFree；可以完全手动录入。
- 当前日期按 **America/Los_Angeles** 计算，还没有时区设置界面。
- 当前不是手机同步服务，也不会自动监控或阻止其他应用。

## 让你的 agent 帮你开始

把仓库交给你常用的 coding agent，复制这段话：

> 请先阅读这个仓库的 AGENTS.md 和 README.zh-CN.md，帮我在本机运行 Sisyphus。检查 Node 版本，安装锁定依赖，初始化本地配置和数据库，在 127.0.0.1 启动服务，并验证登录、读取和保存是否正常。使用独立测试环境验证保存，不往我的真实记录里写演示数据。保留已有数据库和草稿。完成后告诉我访问地址、以后怎么启动、数据在哪里以及怎么备份。没有 Job Hub 或 StayFree 时使用手动录入。

Agent 开发与交接指引见 [AGENTS.md](AGENTS.md)。

## 五分钟开始

需要 Git、Node.js 和 npm；**推荐 Node 24**，也可使用 Node 22.13+ 的 22.x 版本。避免使用 Node 23 等奇数版本（部分依赖不支持）。首次安装需要联网。以下命令在仓库根目录执行：

```sh
git clone https://github.com/extraordinary-yh/sisyphus.git
cd sisyphus
npm ci
npm run setup:local
npm run db:local
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

打开 <http://127.0.0.1:5173>，点击「登录」。本地登录会直接进入固定的开发用户，不要求真实账号。终端出现的 `Seedy` 是占位用户名称。仓库若仍为 private，需要先获得仓库访问权限才能 clone。

启动成功应满足：页面能显示、登录后记录能加载、保存自己的草稿后刷新仍保留。首次页面编译可能需要一点时间。终端保持运行，结束时按 `Ctrl+C`。

以后只需要：

```sh
cd sisyphus
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

`cd sisyphus` 假设你当前在它的父目录；也可以直接在项目文件夹打开终端。

## 第一天怎么用

1. 选择今天，添加一个实际要完成的学习任务。也可从「数据背包」→「选择计划」或学习编辑页的「导入计划 JSON」读取 [示例计划](examples/study-plan.json)；示例全部未完成，请按自己的情况修改。
2. 需要时开启专注计时。计时结束并不等于任务已完成，完成状态由你确认。
3. 记录兴趣活动，以及当天视频、游戏的娱乐时长。核对分类和重复项，再确认全天合计；没有娱乐也要明确确认零。
4. 填写关闭设备、准备睡觉的时间。跨午夜时间归到所选日期的次日凌晨。
5. 预览结算，再正式结算。历史回放不会重复加分；修订过去的记录会按日期重新计算后续战绩。

学习、兴趣、睡觉时间影响星数，娱乐超时扣星。完整段位、边界条件和特殊结算规则见 [评分规则](docs/game-rules.md)。

## 数据、备份和更新

| 内容 | 保存位置 | 说明 |
| --- | --- | --- |
| 已保存记录、规则、计时状态 | `.wrangler/` 本地 D1 数据库 | 主要数据源；不要当作缓存删除 |
| 未保存／恢复草稿、声音偏好 | 当前浏览器的 localStorage | 不同浏览器或地址不共享；不是正式备份 |
| 可选导入快照 | `private-data/` | 个人数据，Git 已忽略 |
| 本机配置 | `.sites-runtime/`、`.openai/hosting.json` | 初始化生成，不应上传 |

在「数据背包」→「导出 JSON」备份。换电脑时，在新电脑初始化项目，通过「读取备份」载入，再检查并点击「恢复这份草稿」保存。**恢复会替换当前记录**，建议先导出当前数据。导出的 JSON 含个人记录，请自行妥善保管。

同一个本地数据库只对应一个固定开发用户；不同浏览器登录这个实例会读到同一份已保存记录。多窗口同时保存若发生冲突，先导出当前草稿，再重新载入处理，不要强制覆盖。

更新前导出备份，停止服务并检查 `git status`。没有本地代码改动时：

```sh
git pull --ff-only
npm ci
npm run setup:local
npm run db:local
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

如果你或 agent 已经定制代码，让 agent 先处理这些改动。不要用 `git reset --hard` 或 `git clean -fdx` 来解决更新问题；后者会连本地数据库一起删除。

## 可选导入

### 学习计划 / Job Hub

任何用户都可以通过界面导入如下格式的 JSON，不需要其他仓库：

```json
{
  "date": "2026-01-01",
  "blocks": [
    {
      "id": "study-1",
      "title": "学习一个新概念",
      "minutes": 30,
      "done": false,
      "firstAction": "打开笔记，写下今天要回答的问题"
    }
  ]
}
```

把日期改成你的计划日期。导入会替换所选日的任务列表，保存后生效；跨日期沿用会清空完成状态。界面计划导入目前适合明确的整数分钟数；未知时长和区间记录的 agent 处理方式见 [AGENTS.md](AGENTS.md)。

已有兼容的 Job Hub 仓库时，可读取其中 `study-plan/plans/YYYY-MM-DD.json`：

```sh
node scripts/import-jobhub.mjs "/path/to/your/job-hub"
```

此命令只读取最近 30 份计划，生成 `private-data/jobhub-plans.json`，不会修改来源仓库。手动重新运行才能刷新快照；本地页面通过 `/local/jobhub` 读取它。

### 娱乐时长 / StayFree

支持手动录入和粘贴 `name,minutes` CSV 或 `YouTube 1h 20m` 文本。导入会替换当前列表，不是追加。未知来源默认排除，需要你分类并核对跨设备、域名与子域名是否重复。

StayFree **没有自动同步**；设置导出不是使用时长记录。可选本地快照格式为：

```json
{
  "date": "2026-01-01",
  "source": "手工核对的使用记录",
  "usage": [
    { "id": "video-1", "name": "YouTube", "seconds": 1200, "category": "video" }
  ]
}
```

保存到被忽略的 `private-data/stayfree.json` 后，可从界面读取。分类为 `video`、`game` 或 `excluded`。这两个 `/local/*` 快照入口仅存在于开发服务中。

## 常见问题

| 问题 | 处理方式 |
| --- | --- |
| clone 显示 Repository not found | 核对仓库地址及访问权限；private 仓库只对获授权账号可见 |
| 安装或启动报 Node 版本错误 | 用 `node --version` 检查；切换 Node 24 后重新运行 `npm ci` |
| 缺少 `.openai/hosting.json` | 在仓库根目录运行 `npm run setup:local` |
| 报 `no such table: players` | 停止服务，运行 `npm run db:local` 后重启；不要删除 `.wrangler/` |
| 端口 5173 被占用 | 使用 `--port 5174 --strictPort` 并访问对应地址；换地址前先保存或导出草稿 |
| 页面提示未登录／401 | 使用 `npm run dev`，访问 `127.0.0.1` 并点击登录；`npm start` 不是本地首次使用入口 |
| `/local/jobhub` 或 `/local/stayfree` 返回 404 | 尚未生成可选快照，手动录入即可 |
| 日期和你所在地区不一致 | 当前固定使用洛杉矶时区；定制需同时检查日期校验和测试 |
| 保存失败或记录版本冲突 | 先导出草稿，再检查登录、数据库和其他窗口；保留恢复草稿 |

## 开发与贡献

React + TypeScript，Vinext/Vite 提供运行时，Cloudflare D1 提供数据库。普通本地开发使用 `portable` 配置，无需专用 agent 插件。

```sh
npm test
npm run typecheck
npm run build
npm run privacy:check
```

`privacy:check` 检查的是 **Git 索引中的内容**；未暂存的新文件或改动不在覆盖范围内。提交前暂存预期文件，检查 `git diff --cached`，再运行扫描。个人数据、密钥、导出文件、QA 备份都不应提交；`.gitignore` 不会清除历史。

- [Agent 指引与代码地图](AGENTS.md)
- [评分规则](docs/game-rules.md)
- [设计说明与研究来源](docs/design.md)
- [验证记录与 API smoke test](docs/verification.md)
- [原创 AI 图像提示词](docs/art-prompts.json)

## 托管说明

当前推荐本地运行。开发登录仅用于 loopback 单人环境，不要把开发端口暴露到公网或通过 tunnel 分享。

托管需要真正的认证网关和已配置的 D1 `DB` 绑定；当前代码对接 Sites 认证网关。`npm run build` 只构建，不会部署，也不会自动配置线上账号或数据库。公开 GitHub 仓库也不等于发布了在线服务。

## License

本项目采用 [MIT License](LICENSE)。第三方代码保留各自的许可证，见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
