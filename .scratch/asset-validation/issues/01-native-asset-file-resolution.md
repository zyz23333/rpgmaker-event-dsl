# MV 原生素材名称如何定位到项目文件

Type: research
Labels: wayfinder:research
Status: resolved
Mode: AFK
Blocked by: none
Parent: [事件素材引用检查的决策地图](../map.md)
Assignee: Codex research agent

## Question

根据 RPG Maker MV 1.6.1 首方帮助、随包模板和原生 runtime，事件直接保存的图片、音频与影片 filename stem 如何映射到 Project Root 内的实际文件？

厘清类别目录、扩展名选择与平台差异、原生子目录及特殊文件名处理、名称编码、大小写行为的来源，以及普通项目树与部署/加密素材的区别。区分原生加载规则、编辑器可选范围和 Windows 文件系统行为；存在某个候选文件不自动等同于所有运行环境均可加载。

只调查文件定位与存在性所需事实，不研究图片尺寸或媒体解码，不替用户选择首版支持哪些变体。优先使用 references/ 内首方资料，逐项引用文件及稳定定位信息，写明未确认之处和后续设计影响。

研究结果保存为本 effort 的单份 Markdown 报告。记录独立 research 分支及报告路径；仅推送自写研究文字，不发布原生源码、二进制或素材，不开 PR、不合并。

## Research context

- State: completed (2026-10-20); this is a factual investigation, with support policy undecided.
- Branch: `research/mv-asset-file-rules`.
- Worktree: `C:/Users/Shuen/.codex/worktrees/asset-file-research/rpgmaker-event-dsl`.
- Report: [MV 原生素材文件定位研究](../research/native-asset-file-resolution.md).
- Sources: local first-party Help, templates, and MV 1.6.1 runtime; no editor/game execution is claimed.

## Answer

2026-10-20 — 事实调查完成，详见 [MV 原生素材文件定位研究](../research/native-asset-file-resolution.md)。报告逐项保留首方文件与行号，记录 v1.6.1 输入哈希，并区分文档、静态实现和未实测部分；不替后续 HITL 设计票选择支持政策。

- 已确认图片类别目录与固定 `.png`、四种音频目录及 `.ogg` / `.m4a` 运行时选择、Movie 的 `movies/` 目录及 `.webm` / `.mp4` 选择；官方帮助对 Windows 桌面要求 Ogg / WebM，选择函数不按缺失文件回退。
- 已确认图片/音频完整名称的 URL 编码、影片直接拼接名称、原名追加扩展名、Character/Parallax 前缀保留及空名称的原生分支。原生加载器没有主动大小写折叠；Microsoft 首方文档说明 Windows 一般不敏感但可逐目录改变。
- 已区分普通编辑项目与加密部署：帮助明确项目目录不能使用加密文件；runtime 按 System 标志映射 `.rpgmvp` / `.rpgmvo` / `.rpgmvm`，并有图片例外。
- 保留未知：编辑器 picker 的子目录/特殊字符选择能力、目标 Project Root 的大小写设置、宿主对特殊 URL 的实际解析及插件路径改写。没有启动编辑器、NW.js、游戏或媒体加载，没有做图片尺寸、解码或播放检查。存在性事实不等同于运行保证。
- 这些设计影响已落在当前地图的覆盖、文件匹配、诊断及工作流票范围内；本次未发现需要独立新增票的事实阻塞，也未解决任何设计票。

后续在 Windows / MV 1.6.1 / NW.js 0.29.0 中完成[真实媒体定位观察](../../asset-validation-implementation/evidence/01-native-media/observations.md)。图片 `literal%20image` 与 `image#hash` 未定位到同名字面文件；普通百分号图片和受测音频字面名称的成功也保留。上方“宿主解析未知／未启动运行”的描述是 2026-10-20 静态调查当时的证据状态，不代表当前仍未执行。首版图片 `%`／`#` 支持边界依[文件事实决定](03-asset-file-existence-contract.md#answer)及 ADR 0017；本票事实不自动扩大媒体支持范围。

发布与校验：独立 worktree `C:/Users/Shuen/.codex/worktrees/asset-file-research/rpgmaker-event-dsl`；分支 [`research/mv-asset-file-rules`](https://github.com/zyz23333/rpgmaker-event-dsl/tree/research/mv-asset-file-rules)；提交 [`562103d45555fff5c7832e76509d7a1b43859dcc`](https://github.com/zyz23333/rpgmaker-event-dsl/commit/562103d45555fff5c7832e76509d7a1b43859dcc)。仅研究报告被提交，`git push -u origin research/mv-asset-file-rules` 已成功，并以 `git ls-remote` 核对同一提交；未开 PR、未合并。报告已复制回主 checkout 的同一路径，研究 worktree 干净。报告本地链接检查与 `git diff --cached --check` 通过；这只是研究文档校验，不是产品或原生验收。

## Comments

### 2026-10-20 — 地图扩展间接素材范围

用户随后确认把事件可静态追踪的间接素材依赖纳入规划。本票仍按原问题 resolved：目录、名称、扩展名与部署差异的事实可复用，但原报告中的“事件直接引用”是当时的研究范围，不能当作现地图继续排除间接素材的依据。标准数据关系、操作相关性及其覆盖证据由[事件直接与间接素材依赖的检查边界如何统一](02-direct-asset-reference-coverage.md)负责；未改写历史研究或将新增关系记成已经研究完成。
