# 06：Animation 与 Tileset 间接素材验收

日期：2026-11-02。票据：[06](../issues/06-animation-and-tileset-dependencies.md)。契约：[实施规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)、[有限子用例索引](../../asset-validation/implementation-acceptance-cases.md)。实现分支 `codex/asset-validation-06-dependencies`，工作树 `M:/Shuen/Codex/asset-validation-06-dependencies`；从集成 `4a8fbe71` 实施，已合入最新文档提交 `0a8546c3`。Compile Contract Version 为 `mv-1.6.1/30`。

[逐项机器回执](06-dependency-acceptance.json)保存 175 个独立规范 ID：173 个 ID 各有源码／构建入口两份实际通过回执，另有 2 个 N03 原生 ID。机器记录包含完整输入、独立预期及断言回调、对应测试源文件版本与 SHA256、实际结果、Windows／Node 22 环境、时间、命令、产品／构建文件哈希，以及 346 份真实 CLI 进程结果。计划 ID 清单只用于独立集合比对，不计为执行结果。源码、构建与原生集合分别完全匹配，无漏项、无额外归属 ID、无以 skip 计为通过。

## 实现行为

当前候选原生输出中的 212／337 读取所选 Animation 的两张图与所有 timing SE；282 读取所选 Tileset 的全部命名槽。重复名称保留每个槽的独立来源，诊断包含定义事件、原生参数位置、完整数据库字段链和预加载／执行条件。空名称为合法 None，缺必要字段或类型错误报告 `MV-ASSET-INVALID-DATA`，并继续检查安全的独立兄弟字段。缺固定目标仍由原有 reference 验证处理，缺准确普通文件由素材文件检查处理，四类结果没有混同。

新增的必要字段读取器仅解释选中的到达字段；外部数据库来自本次编译捕获的同一 Snapshot，只读并且不发现事件根。当前候选事件根与捕获外部资料通过两个独立参数传递。测试故意让实时 Animation 数据比 Snapshot 更新，并向外部资料加入已删除的 Common Event：两者均不能替代捕获视图或恢复根。没有扩张全库 schema，没有新增公共 API、JSON CLI、产品测试开关或持久素材状态。

| 验收族 | 独立规范 ID | 已执行内容 |
| --- | ---: | --- |
| B01 | 32 | Show Animation／Show Battle Animation × image1／image2／se0／se1 × formal／raw × present／missing。每个叶字段分别验证 Compile／Check、真实 CLI、完整使用／链／条件、准确文件事实、修复与原生参数。 |
| B02 | 36 | Change Tileset 的 slot0–slot8 × formal／raw × present／missing；全部槽独立到达，不依赖地图实际放置图块。 |
| C06 | 17 | 上述 17 个允许 None 的到达字段各自为空；独立名称及非默认 timing SE 保存值继续保留。 |
| C07 | 85 | 上述 17 个字段分别 target-missing／field-missing／field-wrong-type／field-empty／file-missing；缺目标、坏必要字段、合法 None、准确文件缺失各有独立预期及状态断言。 |
| C04 | 1 | 同一个名称保存到九槽，诊断保留九条不同字段链；补齐单个准确文件后通过。 |
| C10 | 2 | 未选 Animation 与非必要字段不扩张扫描；未知字段与较新的实时数据保留原值，捕获外部事件载体不引入当前根。 |
| N03 | 2 | 双图实际加载／Canvas 消费及 timing SE 的真实解码／source start，另含跳过分支的预加载对照。 |

另有四项补充检查，不增加规范 ID：坏 timing 数组保留图像兄弟及完整链；坏 timing／SE 记录不阻断后续 timing；坏 Tileset names 容器保留关系链；真实 Workspace/API 与 CLI 同时报告坏必要字段和独立缺文件。

## 原生 N03 审阅签收

[原生观察说明](06-native-animation/observations.md)、[两份规范回执](06-native-animation/acceptance-receipts.json)与 [逐事件原始记录](06-native-animation/native-results.json)保留真实执行。执行者从保存 JSON 经原生 DataManager、Scene_Map、解释器 212 与 Sprite_Animation 运行；包装器原样调用原方法，没有替换路径或返回值。MV 1.6.1／NW.js 0.29.0／Chromium 65／内置 Node 9.7.1 与外围 Node 22.23.4 分开记录。

native_01 已阅读探针与实际观察，校验全部 20 个交接文件的 SHA256，核对原始 observed 状态与 19 项独立断言。两张有效自制 960×192 PNG 各有 16 次真实 Canvas drawImage；四个有效动画帧为 0／1／2／3，timing 在帧 0／2 发生；两份有效 OGG 各有原生 XHR、WebAudio 解码和 source start。假分支中的对照动画双图被预加载，但没有该动画的实际命令、帧或 SE 执行。最终事件等待完成、duration 为 0。两份规范 ID 均通过。

前三次未完成探针尝试按失败保留：缺背景图导致场景未 ready、观察器解引用已 purge 的图像、过宽的对照音频子串断言。成功 run-04 修复探针并增加 Canvas 消费证据；机器回执保留各次输入／原始结果哈希。没有把失败、静态来源或预加载计成原生执行通过。控制预加载图在原生清理后的浏览器 error 事件也原样保留，并有其先前加载和 bitmap 身份记录。原始成功目录为 `M:/Shuen/Codex/asset-validation-notes/n03-animation-20261102/run-04`；仓库探针位于 [native-animation](../probes/native-animation/run-n03.mjs)。

## 自动化与旧功能验证

- 完整源码规范套件：173／173 通过，`ticket06-source.log`。四项补充源码检查通过；收尾另以 `ticket06-source-final-targeted.log` 保留四项补充、两项增强后的图像回执与当前契约版本检查，共 7／7。过滤未选的 177 项不计为通过。
- 完整构建入口组合：233／233 通过，`ticket06-built.log`；其中规范 173、补充 4、旧 Map Appearance／Map Characters／Battle 56。两项增强后的图像回执及当前契约另为 3／3，`ticket06-built-final-targeted.log`；181 项过滤未选不计通过。
- 证据审阅补强了最早两项 TDD 图像用例：两者增加完整结构／原生／外部字段断言，image2 增加 Compile 拒绝与实际 CLI；产品未变。仅重跑这两个规范 ID。其余 171 个 ID 的源码／构建回执保留主运行时测试源哈希及不可变提交 `6af35138`；最终两项对应 `d4f1fa11`。机器回执精确列出两种源文件哈希与 342／4 条回执归属。
- 旧 fixture 为所选 Animation／Tileset 补齐必要标准字段及准确普通文件，保留原有未知字段与断言。源码旧功能初次为 53 通过、3 失败：Battle fixture 新增 mkdir 调用时遗漏 import，均在准备阶段失败。补齐 import 后独立重试 3／3 通过；初始失败日志及重试日志均保留，没有计初次失败为通过。构建入口全部旧功能 56／56 通过。
- TDD 先逐项观察 Animation image1、image2、timing SE0、Battle image1、Tileset slot0 的“缺文件 Check 错误成功”，再添加相应最小实现得到 green；补充容器链断言也先 red 后修复。历史 red 位于实施工具会话，没有单独持久日志；未事后重建或虚构历史日志。完整最终通过运行与提交中的测试源可核验。
- 仓库 typecheck、lint、format:check、build 与 `git diff --check` 通过。两个新测试文件均加入显式 Windows 构建后清单。所有报告／准确命令／哈希记录于机器合册，外部完整日志目录为 `M:/Shuen/Codex/asset-validation-notes/`。

自动化中的零字节 PNG／OGG 只证明准确普通文件存在。N03 使用独立有效自制 PNG／OGG，实际观察关系与消费；不声称验证所有动画布局、插件或人耳扬声器输出。本票不改图片 `%`／`#` 政策，不关闭 01／03，不实现后续关系、例外或 Push；最终全仓与整规格签收仍由 17 负责。
