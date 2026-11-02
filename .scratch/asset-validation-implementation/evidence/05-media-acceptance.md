# 05：直接音频、路线 SE 与影片验收

日期：2026-11-02。环境：Windows x64、Node.js v22.23.4，运行时位于 `M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe`。票据：[05](../issues/05-direct-audio-and-movie-uses.md)。契约：[实施规格](../../asset-validation/asset-validation-spec.md)、[有限子用例索引](../../asset-validation/implementation-acceptance-cases.md)及 ADR 0016–0019。

[逐项机器回执](05-media-acceptance.json)包含 86 个独立 ID 的源码／构建入口共 172 条结果。每条记录明确输入、独立断言与断言文件哈希、执行时间、环境、入口和实际结果；CLI 场景保留真实进程结果。五个当前产品文件与完整 Vitest 报告的哈希一并记录。测试使用自写原生字面量和含中文、空格的真实临时 Workspace；零字节 OGG／WebM 仅证明普通文件存在，不代表播放、编解码或原生游戏运行证据。

实现扩展当前候选原生输出的直接收集：132／133／139／140／241／245／249／250 的音频对象名称、261 的影片名称，以及两种路线中的 44。路线 44 与 505 镜像保持一个逻辑使用及两处位置。音频使用固定 OGG，影片固定 WebM；None 不查询并保留音量、音调、声像等独立保存值。沿用已完成的观察器与政策，不改图片 `%`／`#` 决策。Compile Contract Version 为 29；当前集成 `cfe4d505` 已合入。

| 所属验收 | 实际覆盖 |
| --- | --- |
| A03–A06、A08–A12、A18 | 九个直接字段分别 formal／raw 的 present／missing，以及自主 page、set-route formal／raw 的 SE present／missing，共 42 个 ID。分别验证完整使用、原始命名空间、原名、身份、原生位置、镜像、链与条件；缺失时 Check／Compile 不发布，补齐后对照完整使用和所有原生参数。 |
| C06 | 所有上述允许 None 的 11 个到达字段及 saved-audio-controls，共 12 个 ID。没有素材目录也能通过；保留非默认 17／73／−41，以及独立的 volume／pan 负零。 |
| C03 | SE route-mirror 与 independent-command，共 2 个 ID。205／505 一次，两处定位完整；独立直接 SE 是另一真实使用，多次 Check／Compile 不积累计数。 |
| C08 | 扩展现有三个 canonical route-fixed／random／approach 回调，保留全部原图像场景和断言，另以独立 Workspace 验证 SE 的 warning、非活动原因、实际 CLI 成功、状态只读和完整使用。三个回执 owner 为 `04,05`，没有注册重复 ID。 |
| C11 | 扩展原 recognized-raw 回调，保留 231 场景，再验证 raw 205／505 SE 缺失拒绝、镜像、无发布及补齐成功；owner 为 `02,05`。另新增历史音频 CR/LF 名称的原值 Decompilation 与政策拒绝场景，共 2 个 ID。 |
| F01、F02 | bgm／bgs／me／se／movie 的准确零字节文件；M4A-only、audio-encrypted-only 和 MP4-only 均不能替代，补齐准确文件后通过，共 8 个 ID。 |
| F06 | 音频字面量 `%20`／`#` 按原名定位；影片两种形式为 unsupported，实际 CLI 加 OS 边界守卫证明没有访问影片目标，也没有伪造 target 路径，共 4 个 ID。 |
| F13、F14 | 音频标志 absent／false／true／null／number／string，以及 no-audio-use／movie-only，共 8 个 ID。只解释实际使用类别对应标志；影片不受无关图片／音频错误标志影响。 |
| 实际 CLI | 另为五个媒体命名空间分别验证 Compile／Check 错误来源、准确扩展、无发布、补齐后 Check 只读及 Compile 成功，共 5 个补充 ID。共享 C08 及 F06 也经过真实 CLI。 |

旧成功 fixture 逐项提供准确文件：音频矩阵的 `Battle`／`Boat`／`Ship`／`Airship`／`Theme`、`Rain`、`Victory`／`Defeat`／`Fanfare`，路线的 `Cursor1`／`Bell1`，及影片 `Ending.webm`。原始音频 fixture 的 `" \r\n "` 文件未改，单独验收其原值保留和编译拒绝；成功矩阵使用独立明确的 `Plain SE`，没有名称规范化或放行。既有其他参数、负零和外部字段断言保留。根／包 README、外部项目示例所需准确媒体路径及作者指南均同步。

验证结果：

- 九个直接族与两个路线容器分别先观察“缺文件的 Check 错误成功”的 red，再加入对应收集并得到 green。七个音频族的自动捕获 red／green 日志位于 `M:/Shuen/Codex/asset-validation-notes/05-direct-audio-tdd.json`，其哈希在机器记录中。
- 完整相关源码运行共 217 个用例：216 通过；本票全部 86 个 ID 均通过。唯一失败为旧 `MV-S6-SCREEN-002` 的 30 秒时限，计时 30.28 秒；业务证据显示所有原断言已完成、无数据差异。初始超时仍按失败保留，没有计为通过。
- 仅对该旧 Screen 长循环独立重试：1／1 通过，26.48 秒。没有调整超时、移除循环或弱化断言；无需重复已通过的其他源码测试。
- 构建入口媒体主套件 81／81；共享 4 个、历史 1 个和当前契约版本 1 个另为 6／6。本票全部 86 个 ID 都有构建结果，过滤器未选择的其他测试不计为通过。
- 构建、仓库 typecheck、lint、format:check 和 `git diff --check` 通过；新媒体套件加入显式 Windows 构建后用例清单。当前没有剩余失败或未执行的本票自动化分支。

完整报告位于 `M:/Shuen/Codex/asset-validation-notes/05-source-final.json`、`05-source-screen-retry.json`、`05-built-media.json`、`05-built-shared.json`，包括初始超时与独立通过记录。图片特殊名称的未决原生政策及 N 组、后续间接关系、例外和 Push 不在本票完成声明内；最终仓库全量与完整 Windows 汇总由 17 承担。
