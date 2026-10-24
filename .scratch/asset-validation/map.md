# 事件素材引用检查的决策地图

Labels: wayfinder:map
Status: resolved

## Destination

明确 RPG Maker MV 事件直接素材引用及通过标准项目数据可静态追踪的间接素材依赖的文件存在性检查范围、判定规则、诊断与 Workspace 工作流契约，形成足以编写实施规格的已决路线。
地图完成时，阻碍实施的设计问题均已解决；本轮建图不实现产品功能，也不把研究结论等同于产品验收。

## Notes

- 用户于 2026-10-20 确认：本轮终点是厘清设计，为可实施的规格铺路；重点是事件引用的图片、音频、影片等素材是否有效。
- 用户随后明确首版只规划文件存在性，不规划图片尺寸、脸图或行走图索引与实际布局的匹配。
- 事件自身保存的直接素材引用继续纳入：事件页图像、指令、嵌套分支与 Movement Route；可识别的原生 Raw DSL Command 应遵守同样规则。确切检查位置、未启用保存状态、None 和未知负载边界已由票 02 的完整 Answer 确认。
- 用户于 2026-10-20 在澄清数据库条目存在性与其素材存在性的区别后，明确要求将“事件可静态追踪的间接素材依赖”纳入首版规划，替代最初只查直接引用的范围选择。以事件实际引用的目标为起点，沿已知标准数据关系追踪；播放动画所用的图片与 SE、更换图块组所用的图块图片作为覆盖讨论用例，不自动扫描整个数据库。
- 引用某个项目数据条目不等于所选事件操作会加载其全部素材。例如修改角色 HP 不能直接成为检查该角色全部图像并阻断编译的依据。票 02 已确认有限关系清单、Conditional Asset Candidates、逐次来源和动态／循环停止点；纯粹同条目关联不纳入。后续已接受的级别与例外政策见[素材检查结果如何诊断并影响编译](issues/04-asset-diagnostics-and-policy.md#answer)。
- 用户确认优先融入 Compile 与 Compile Check；其默认检查、严重性和逐素材例外已由[素材检查结果如何诊断并影响编译](issues/04-asset-diagnostics-and-policy.md#answer)逐项及整体确认，不再从“融入工作流”推断政策。[工作流票](issues/05-workspace-asset-check-lifecycle.md#answer)已确认 Compile／Check 的完成边界重查、Push 写入前后及无写入情形的当次检查；实时素材条件与 Generated Freshness 分开，未引入素材快照。
- 使用 GLOSSARY.md 的 Asset Reference 与 Project Data Reference 术语。直接素材引用仍是 DSL Asset Reference；间接素材来自所引用标准项目数据中的素材字段，不把这些原生字段改称或改写成 DSL Asset Reference，也不重做现有项目数据条目的引用解析。
- 延续当前 Windows / Node.js 22 和 RPG Maker MV 1.6.1 范围，不在本地图引入其他平台或引擎版本的兼容承诺。
- 每次继续前读取 wayfinder、docs/agents/issue-tracker.md、docs/agents/domain.md 与 GLOSSARY.md；设计票使用 grilling 与 domain-modeling，研究票使用 research。HITL 票必须由用户实际参与；一次会话最多解决一张设计票，研究票除外。
- 当前基线：素材 helper 及命令校验只检查结构、类别与非空 filename stem；普通 Compile 与 Compile Check 共用项目校验路径，尚无素材磁盘存在性检查。已有引用收集器不等同于包含来源位置和已识别 raw 参数的完整素材使用清单。
- [ADR 0016](../../docs/adr/0016-event-rooted-asset-use-coverage.md) 已接受事件起点的有限素材覆盖，并修订 [ADR 0011](../../docs/adr/0011-native-command-state-and-validation.md) 原有“文件不扫描”的设计边界；[ADR 0017](../../docs/adr/0017-exact-asset-file-existence-in-editing-projects.md) 已接受普通编辑项目的准确文件匹配与元数据存在性契约；[ADR 0018](../../docs/adr/0018-asset-check-diagnostics-and-explicit-exceptions.md) 已接受诊断与显式逐素材例外政策；[ADR 0019](../../docs/adr/0019-asset-checks-at-workflow-boundaries.md) 已接受输入一致性、工作流检查点、变化判据与恢复边界。尺寸检查继续排除；不能把设计完成写成已实现扫描功能。
- [ADR 0012](../../docs/adr/0012-event-saved-state-roundtrip-boundary.md) 的保存状态与已识别 raw 校验边界继续适用；[ADR 0013](../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 已接入工作流决定：素材政策属于编译基线，实时文件观察不属于；Push 重建生成事件及对应快照的素材使用，在写入边界检查文件、捕获输入和绑定。素材不进入 Standard Project Data Snapshot、复制、备份或 Push 写入范围，既有标准 data 漂移与恢复内容检查继续有效。
- 间接检查只按已知消费位置读取必要的标准项目数据字段，不扩展 DSL-Owned Project Data 或写入权限；外部素材字段及必要 System 设置使用同一份捕获快照，文件查询使用绑定的实时 Project Root。不混读实时标准 data，不演变为外部条目全部字段或插件私有数据的通用校验。
- Diff 不扫描实时素材，Clone／Pull／DSL Decompilation 不增加素材文件门槛。操作内相关文件观察改变须重跑；仅内容、修改时间、文件身份或无关目录项改变不单独失效。写后失败保留 Interrupted Push，可证明已完成的 data 写入仍可恢复记账，之后再判当前素材，恢复本身不证明素材通过。检查点与同 Workspace 互斥不构成跨进程原子隔离。
- 本地 tracker 使用 Type / Labels 表示票类型，Status: open / claimed / resolved 表示 wayfinding 状态，不使用 triage 标签。Blocked by 使用本目录内的票号；按编号选取未解决、未认领且前置均已 resolved 的票。开放票通过 issues/ 元数据查询，不在本地图正文重复列出。
- 研究可以使用本地 references/ 内的首方帮助、模板与 MV 1.6.1 runtime；逐条区分文档、静态代码与实际运行观察。研究报告保留出处，不发布原生源码或游戏资产副本。
- 研究使用独立的临时 research/<name> 分支，仅推送自写研究 Markdown，不开 PR、不合并。研究结果作为票内上下文输入，不代替用户对支持范围的选择。
- 已完成的原生文件定位研究按最初直接引用范围交付，其目录、文件名和扩展名事实可供间接素材复用；它本身没有证明标准数据依赖边或操作相关性完整。票 02 已补充所选关系的首方静态消费依据；没有据此宣称运行时所有依赖均已覆盖。
- 用户在原版部署排除范围研究后确认继续采用事件起点，原版字段清单只用于查漏，不采用原版全库扫描起点；首版不接入插件显式素材声明、typed 参数或声明的备注字段。票 02 的 Q1–Q14 与合并 Answer 已于 2026-10-20 完整确认，票已 resolved；后续决策以上述覆盖契约为输入。
- 用户于 2026-10-24 最终确认[验收与实施规格交接契约](issues/06-asset-validation-acceptance.md#answer)及[验收矩阵](acceptance-matrix.md)。全部子票与本地图均已 resolved，表示设计路线已完成、可编写实施规格；产品实现、自动化与原生必验仍待后续执行，不把设计完成等同于产品验收。

## Decisions so far

<!-- 只索引已解决的决策票。建图阶段确认的目的与边界见 Notes。 -->

- [MV 原生素材名称如何定位到项目文件](issues/01-native-asset-file-resolution.md#answer)：已记录 MV 1.6.1 的原生文件定位与部署差别、Windows 名称事实及未实测边界，供支持政策票决策。
- [事件直接与间接素材依赖的检查边界如何统一](issues/02-direct-asset-reference-coverage.md#answer)：以全部当前事件定义为独立起点，覆盖选定直接字段与有限标准数据关系；保存未启用配置也检查，保留逐次来源、条件候选和公共事件链，动态目标／循环处有界停止；排除全库、插件声明和引擎硬编码素材扩展。领域覆盖设计已完成，诊断与工作流未预设；见 ADR 0016。
- [素材文件存在性应如何判定](issues/03-asset-file-existence-contract.md#answer)：普通编辑项目按准确目录／名称及固定桌面扩展名匹配，普通文件元数据确认即可，不强制打开；单层名称、链接和加密边界明确，缺失、名称不符、类型问题与无法检查分开记录，保留全部使用来源。见 ADR 0017。
- [素材检查结果如何诊断并影响编译](issues/04-asset-diagnostics-and-policy.md#answer)：两种编译默认检查，明确使用的已确认文件问题默认 error，候选／非活动配置默认 warning；仅允许带原因的逐素材文件问题降级，不豁免支持边界或无法检查。保留逐次来源、分组与不完整检查状态。见 ADR 0018。
- [素材检查如何接入 Compile 与 Push 并保持结果有效](issues/05-workspace-asset-check-lifecycle.md#answer)：标准数据采用一致捕获视图，文件查询绑定实时项目；Compile／Check 完成边界及 Push 写入前后重查，无写入 Push 也检查。实时素材条件不进入持久编译基线，Diff／接管不新增文件扫描；仅比较存在性相关变化，逐检查点取得新观察。写后失败留 pending，恢复记账与当前素材判断分开，保留同步、绑定和非原子性边界。见 ADR 0019。
- [如何验收素材存在性检查并交接实施规格](issues/06-asset-validation-acceptance.md#answer)：确定独立预期、逐项覆盖与关键组合，形成七组验收矩阵；明确 Windows 实测／注入、有限原生必验及证据责任、诊断与工作流断言、反例处理和实施顺序。设计交接已完成，产品验收须以后续实际执行结果另行确认。

## Not yet specified

- 无。本地图范围内的文件定位事实、领域覆盖、文件存在性、诊断、工作流、验收与实施规格交接决定均已完成。后续具体实现设计由实施规格承担；新事实反例或范围扩展按验收票的重开规则处理。

## Out of scope

- 产品实现、实施任务拆分与实际发布；本地图止于足以编写实施规格的设计路线。
- 图片尺寸、图像解码、脸图或行走图索引/布局检查，以及音频、影片的可解码性或实际播放保证。
- 未使用素材查找、自动删除、素材优化、自动修复或重命名、复制或管理素材文件。
- 与事件无已知静态依赖关系的全库或全项目素材体检；不因某个条目被引用，就无条件扫描它关联的全部素材。
- 执行或静态猜测 Script Input、Plugin DSL Command 及未知 raw payload 中动态拼接的素材名称；未知负载仍遵守既有不解释边界。
- 插件 `@requiredAssets`、file/animation 参数（含数组和 struct）及声明的备注素材字段检查；显式声明支持暂不纳入首版，与未知脚本推断分别处理。
- RPG Maker MZ、其他 MV 版本，以及非 Windows 平台的兼容承诺。
- 部署树与加密素材检查、根以下素材路径链接的跟随，以及媒体内容可读性检查；具体支持边界见[素材文件存在性应如何判定](issues/03-asset-file-existence-contract.md#answer)，不影响既有 Project Root 别名与绑定。

## Comments

### 2026-10-20 — 建图范围确认

用户确认规划终点与素材有效性方向；随后选择“先查事件直接引用”“首版只规划文件存在性”“优先融入现有工作流”。以上仅确定地图目的与边界，文件匹配、诊断和工作流契约仍由子决策票解决。

### 2026-10-20 — 纳入可静态追踪的间接素材

用户在澄清项目数据条目存在性与素材文件存在性的区别后，回复“调整一下，纳入规划吧”，确认把事件可静态追踪的间接素材依赖纳入首版。已扩展目的、覆盖及下游决策问题，并移除原先排除间接素材的边界；文件存在性、Windows / MV 1.6.1 和现有工作流方向继续适用。此为规划范围修订，未解决覆盖、严重性或同步契约，也未实施功能。

### 2026-10-20 — 原版部署排除的研究上下文

按用户要求补充[原版 Exclude unused files 范围调查](research/native-unused-assets-scope.md)，作为票 02 的事实输入：原版全量指定数据库字段／地图／事件收集与 img / audio 输出筛选，和当前事件起点的素材存在性诊断有不同目的。报告附完整规则出处、REA 字节身份及 12 个原筛选函数的受控重放结果；未启动编辑器部署，未更改支持范围或解决设计票。

### 2026-10-20 — 覆盖票完整确认并解决

用户确认票 02 的 Q1–Q14、合并 Answer 和完成边界。已关闭覆盖票、接受 ADR 0016，并在 ADR 0011 记录有限的文件扫描设计修订。后续文件匹配票 03 的前置 01、02 均已 resolved；本轮没有继续解决其他设计票或实施产品功能。

### 2026-10-24 — 文件存在性契约完整确认并解决

用户确认[素材文件存在性应如何判定](issues/03-asset-file-existence-contract.md#answer)的 Q1–Q9、合并契约及完成边界，包含依据开销讨论调整后的“不强制逐文件打开”。已接受 ADR 0017，并向 ADR 0011／0016 添加交接指针。完成的是设计，不是产品实现或原生验收；[素材检查结果如何诊断并影响编译](issues/04-asset-diagnostics-and-policy.md)的前置已满足，本轮未开始下一张设计票。

### 2026-10-24 — 诊断政策完整确认并解决

用户确认[素材检查结果如何诊断并影响编译](issues/04-asset-diagnostics-and-policy.md#answer)的 Q1–Q11、合并契约、共同理解及完成边界。已接受 ADR 0018，记录 Asset Check Exception 术语，并更新相关 ADR 的交接指针。完成的是设计，没有产品实现或原生验收；[素材检查如何接入 Compile 与 Push 并保持结果有效](issues/05-workspace-asset-check-lifecycle.md)的前置已满足，本轮没有认领或开始该票。

### 2026-10-24 — 工作流 Q1–Q12 逐项确认，待完整契约确认

用户以 grill-with-docs 讨论[工作流票](issues/05-workspace-asset-check-lifecycle.md#answer)，已逐轮确认一致标准数据视图、各操作职责、实时素材与生成新鲜度分离、检查点、变化判据、查询复用、恢复记账及输入／绑定重查。已整理合并 Answer 与 [ADR 0019 草案](../../docs/adr/0019-asset-checks-at-workflow-boundaries.md)，仍待整体共同理解和完成边界确认；票保持 claimed、ADR 保持 proposed，不加入上方仅索引已解决票的 Decisions so far。没有产品实现或测试执行，验收票仍由本票阻塞。

### 2026-10-24 — 工作流完整契约最终确认并解决

用户确认[工作流票](issues/05-workspace-asset-check-lifecycle.md#answer)的 Q1–Q12、完整合并契约、共同理解及设计完成边界。票 05 已 resolved，[ADR 0019](../../docs/adr/0019-asset-checks-at-workflow-boundaries.md) 已 accepted；相关 ADR 与领域术语已同步，历史 Comments 中的待决状态保留为过程记录。完成的是工作流设计与文档交接，没有产品实现、产品测试或原生验收。票 06 的前置现均已解决，保持 open 且本轮未开始；地图仍待验收设计完成。

### 2026-10-24 — 验收 Q1–Q11 已确认，合并交接材料待整体确认

用户以 grill-with-docs 讨论[如何验收素材存在性检查并交接实施规格](issues/06-asset-validation-acceptance.md#answer)，已逐轮确认独立预期、逐项覆盖、合成 fixture、Windows 实测与注入分工、工作流变化验证、有限原生必验及责任、反例处理、诊断语义、实施顺序和完成门槛。已形成合并 Answer 与[验收对照表和证据清单](acceptance-matrix.md)，所有新用例均待实施／执行。

票保持 claimed、地图保持 open，等待用户对合并全文、共同理解及设计完成边界作最终确认；尚不加入只索引已解决票的 Decisions so far。本轮没有产品实现、实施任务拆分、产品测试或原生运行验收；沿用现有领域术语与 ADR，无新增领域定义或架构决策。

### 2026-10-24 — 验收契约确认，决策地图设计完成

用户最终确认[验收合并契约](issues/06-asset-validation-acceptance.md#answer)、[七组矩阵与证据责任](acceptance-matrix.md)、共同理解及完成边界，同意关闭验收票并将地图标记为设计完成。全部六张子票与本地图均已 resolved；验收结论已加入 Decisions so far，Not yet specified 已无本地图范围内的未决项。

本地图达成“足以编写实施规格的已决路线”。实际实施规格、任务拆分、产品实现、自动化和原生必验仍为后续工作；矩阵中的计划项目均未执行，未宣称产品验收通过。ADR 0019 已同步设计交接指针，沿用既有术语和架构决定；历史 Comments 中的待决状态保留为过程记录。

### 2026-10-24 — 实施规格已发布

用户在验收票完成后调用 to-spec，要求编写规格。已将六票 Answer、ADR 0016–0019、验收矩阵及现有 Workspace／CLI 接入点合成为[事件素材文件存在性检查实施规格](asset-validation-spec.md)，状态为 ready-for-agent，并附[实施验收子用例索引](implementation-acceptance-cases.md)。规格沿用验收票已确认的测试入口，细化配置、内部职责、稳定诊断标识及实施顺序；没有重新访谈或修改已决产品政策。本地图继续 resolved，表示设计交接完成；产品代码、自动化和原生必验仍待实施／执行。
