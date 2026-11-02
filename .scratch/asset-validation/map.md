# 事件素材引用检查的决策地图

Labels: wayfinder:map
Status: resolved

## Destination

明确 RPG Maker MV 事件直接素材引用及通过标准项目数据可静态追踪的间接素材依赖的文件存在性检查范围、判定规则、诊断与 Workspace 工作流契约，形成足以编写实施规格的已决路线。
地图完成时，阻碍实施的设计问题均已解决；本轮建图不实现产品功能，也不把研究结论等同于产品验收。

## Notes

- 2026-11-02 原生反例已按维护者答复处置：[真实请求和磁盘对照证据](../asset-validation-implementation/evidence/01-native-media/observations.md)推翻图片 `literal%20image`／`image#hash` 的字面文件定位假设。维护者选择“图片含 `%` 或 `#` 统一不支持；音频保持支持”，01／03 与 ADR 0017 恢复 resolved／accepted。普通百分号图片成功及两个失败和因果对照均保留，见[政策处置对账](../asset-validation-implementation/evidence/01-native-media/policy-resolution-2026-11-02.md)。产品 F06 图片分支仍由实施票 03 落实，不据文档关闭产品票。

- 现行设计已按用户于 2026-10-25 的“调整一下”修订，依据前一轮过度设计评审；此前 Comments 中的确认是历史，当前 Answer、ADR 和实施规格已同步。
- 首版仍为 Windows / Node.js 22、RPG Maker MV 1.6.1 普通编辑项目的文件存在性检查。事件直接引用、已识别 raw 和有限标准数据间接关系保留；图片尺寸、解码和播放保证继续排除。
- 所有当前 Map／Common／Troop Event 独立检查。素材保留定义位置和事件内 Asset Dependency Chain，公共事件保留直接调用位置；不再枚举所有传递调用路径，调用数量不放大素材使用次数，循环关系不另生成停止诊断。见 [ADR 0016](../../docs/adr/0016-event-rooted-asset-use-coverage.md)。
- 普通使用的确认文件问题默认 error，候选／明确非活动配置为 warning。名称／链接／加密不受支持时，候选／非活动同样 warning 并标记未检查；坏字段、固定引用与实际查询失败仍 error。逐素材例外仍只降级已确认文件问题。见 [ADR 0017](../../docs/adr/0017-exact-asset-file-existence-in-editing-projects.md)／[0018](../../docs/adr/0018-asset-check-diagnostics-and-explicit-exceptions.md)。
- Compile／Check 在完整候选校验后、发布或返回前检查一次；Push 暂存后、pending 和首次 data 替换前检查一次，无写入 Push 也检查。取消跨检查点素材比较、改善也失败、Manifest 前和 Push 写后素材复查。见 [ADR 0019](../../docs/adr/0019-asset-checks-at-workflow-boundaries.md)。
- 素材可用性与 data 同步分开：写后素材变化不创建或保留 pending；真正 data／编译依据异常仍沿既有保护和恢复。实时素材不进 Compile Baseline，政策进入；Diff、Clone、Pull、Decompilation 不新增文件门槛。
- 事件、外部必要字段和 System 设置使用同一捕获视图；素材查询使用绑定实时 Project Root。素材不进入快照、复制、备份或写入；不扩大 DSL-Owned Project Data 或外部数据校验范围。
- 文件定位研究及原生部署范围研究仅是事实依据；采用事件起点，不改用原版全库扫描。原生研究不等于产品验收。
- 设计和交接已完成，地图及六张票保持 resolved；[实施规格](asset-validation-spec.md)保持 ready-for-agent。[验收矩阵](acceptance-matrix.md)及[子用例索引](implementation-acceptance-cases.md)已按修订更新，产品实现、自动化和原生必验的实际状态以各实施票证据为准，最终完成由17汇总。

## Decisions so far

- [01 原生文件定位](issues/01-native-asset-file-resolution.md#answer)：MV 1.6.1 目录、文件名、扩展名和部署差异的研究依据。
- [02 覆盖与来源](issues/02-direct-asset-reference-coverage.md#answer)：有限直接／间接字段，定义事件内来源和直接公共事件调用关系；不枚举传递调用链。见 [ADR 0016](../../docs/adr/0016-event-rooted-asset-use-coverage.md)。
- [03 文件事实](issues/03-asset-file-existence-contract.md#answer)：准确单层名称、固定桌面扩展名、普通文件元数据及链接／加密边界；图片／影片含 `%`／`#` 不支持，音频按原名；单次查询失败与缺失分开。见 ADR 0017。
- [04 诊断政策](issues/04-asset-diagnostics-and-policy.md#answer)：普通使用严格，候选／非活动的文件问题及支持范围问题 warning；支持范围警告标记未检查，输入／查询失败仍 error。见 [ADR 0018](../../docs/adr/0018-asset-check-diagnostics-and-explicit-exceptions.md)。
- [05 工作流](issues/05-workspace-asset-check-lifecycle.md#answer)：一次当前素材门槛、每条新命令重新查询、与 data 写入恢复解耦；保留编译输入和标准 data 保护。见 [ADR 0019](../../docs/adr/0019-asset-checks-at-workflow-boundaries.md)。
- [06 验收交接](issues/06-asset-validation-acceptance.md#answer)：逐字段、来源、文件事实、诊断、工作流及有限原生必验；按收缩后的契约更新预期，所有产品验收仍待执行。

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

### 2026-10-25 — 过度设计评审后的收缩

用户要求按评审调整。已修订 ADR 0016／0018／0019，并同步 ADR 0006、0011–0013、0017、GLOSSARY、票 02–06、实施规格及两份验收材料。主要撤销多检查点素材事实相等、改善也失败、写后素材 pending 和全传递调用链展开；候选／非活动中的不支持形式改为 warning + 未检查。实际字段覆盖、文件定位规则、data 一致性／恢复及原生必验保留。

当前正文与各票 Answer 为现行设计，历史确认不再作为被替代规则的实现要求。本次只修订文档；地图继续 resolved，实施规格继续 ready-for-agent，不宣称产品实现或验收完成。

### 2026-11-02 — 图片特殊名称反例的政策处置

源票 01／03 和 ADR 0017 曾因原生图片 `%20`／`#` 反例重开为 needs-info／proposed。维护者随后明确选择统一排除含 `%`／`#` 的图片名、音频继续支持，现恢复设计完成状态。现行规格、验收矩阵／索引及实施职责一致更新；原始15样本13成功2反例、普通百分号成功与两组因果对照保持历史事实。实施01按当前支持域对账关闭，实施03和最终17仍各自承担产品实现与验收。
