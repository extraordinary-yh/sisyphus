# SISYPHUS · 自律排位

[English](README.md) | **简体中文**

让 **Claude Code、Codex 等 coding agent** 帮你启动自己的 Sisyphus 实例，然后直接告诉它你今天做了什么。Agent 帮你记录，Sisyphus 把学习、生活习惯和屏幕使用转化成星星、连胜与段位，从废铁一路升到王者。

这是一个 **本地运行、自己保存数据** 的习惯记录工具。当前界面为中文，支持学习计划、兴趣习惯、娱乐时长、睡觉时间、专注计时、连胜和历史回放。

- Sisyphus 本身无需 ChatGPT 登录、API key、Cloudflare 账号或付费服务即可本地运行；coding agent 有各自的配置和访问要求。
- 无需 Job Hub 或 StayFree，直接用日常语言告诉 agent 你做了什么。
- 当前日期按 **America/Los_Angeles** 计算，还没有时区设置界面。
- 当前不是手机同步服务，也不会自动监控或阻止其他应用。

## 用 Claude Code、Codex 或其他 coding agent 开始

把仓库地址交给你的 agent，让它启动你自己的本地实例：

> Clone https://github.com/extraordinary-yh/sisyphus.git，先阅读 AGENTS.md 和 README.zh-CN.md，帮我配置并启动本地 Sisyphus。如果已经配置过，请保留现有数据。在独立测试环境验证后，把看板地址给我。以后我会直接告诉你每天做了什么，请据此更新记录，只在必要信息不清楚时追问。

Agent 负责安装依赖、初始化本地数据库和启动服务。之后继续在同一个项目目录里使用它，让它能够访问你的实例。浏览器看板用来查看段位、历史和结算演出；你也可以按自己的习惯在界面里编辑记录。

Agent 应遵循的工作流程见 [AGENTS.md](AGENTS.md)。

## 直接告诉 agent 今天做了什么

实例启动后，在 agent 对话里描述你的一天：

> 帮我记到今天：我完成了二分查找练习，也读完了数据库索引那一章。另外练了 30 分钟吉他。先保存这些，娱乐时长和睡觉时间晚点告诉你。

Agent 会先读取当天已有记录，把完成的内容对应到任务，补上你报告的活动并保存。你不用准备 JSON，也不用逐个填写字段。没有提供的信息保持未知，不会被当成零或凭空补全。

一天结束后，可以继续说：

> 刚才记录的那一天，全天娱乐合计是 YouTube 45 分钟、游戏 20 分钟，没有其他娱乐。我在次日凌晨 00:20 关闭了设备。请更新那天的记录、结算，并告诉我段位有什么变化。

Agent 会记录已确认的合计和睡觉时间，完成结算并反馈结果。如果日期或必要信息不明确，它会针对缺失信息追问。也可以直接纠正：

> 刚才说的吉他其实练了 40 分钟，不是 30 分钟。修改原来那条，不要再加一次。

继续使用同一个对话可以保留上下文；换 agent 时，把它指向这个仓库，让它先读 `AGENTS.md` 和已有记录再接手。对话发生在你的 coding agent 里；看板没有内置聊天，也不会自动监控你的活动。

学习、兴趣、睡觉时间影响星数，娱乐超时扣星。历史回放不会重复加分，修订已结算日期会重新计算后续战绩。细则见 [评分规则](docs/game-rules.md)。

## 供你或 agent 使用的启动命令

以下命令可以交给 agent 执行，也方便希望自行配置的用户参考。

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

## 数据、备份和更新

| 内容 | 保存位置 | 说明 |
| --- | --- | --- |
| 已保存记录、规则、计时状态 | `.wrangler/` 本地 D1 数据库 | 主要数据源；不要当作缓存删除 |
| 未保存／恢复草稿、声音偏好 | 当前浏览器的 localStorage | 不同浏览器或地址不共享；不是正式备份 |
| 可选导入快照 | `private-data/` | 个人数据，Git 已忽略 |
| 本机配置 | `.sites-runtime/`、`.openai/hosting.json` | 初始化生成，不应上传 |

恢复或批量修改前，可以让 agent 创建一份私有备份。也可以在「数据背包」→「导出 JSON」备份。换电脑时，在新电脑初始化项目，通过「读取备份」载入，再检查并点击「恢复这份草稿」保存。**恢复会替换当前记录**，建议先导出当前数据。导出的 JSON 含个人记录，请自行妥善保管。

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

日常直接告诉 agent 你的计划，让它保存即可。如果已有结构化计划，可以交给 agent 使用，也可以通过界面导入 JSON，不需要其他仓库。参考 [示例计划](examples/study-plan.json) 或以下格式：

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

直接告诉 agent 每项活动花了多久，以及是否为全天合计。批量输入时，界面也支持粘贴 `name,minutes` CSV 或 `YouTube 1h 20m` 文本。导入会替换当前列表，不是追加。未知来源默认排除，需要你分类并核对跨设备、域名与子域名是否重复。

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
| `/local/jobhub` 或 `/local/stayfree` 返回 404 | 尚未生成可选快照；agent 无需这些文件也能记录你报告的活动 |
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
