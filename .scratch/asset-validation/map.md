# 事件素材引用检查的决策地图

Labels: wayfinder:map
Status: resolved

## Destination

明确首版事件直接素材和一批关系明确的固定间接素材的存在性检查、诊断及 Workspace 工作流，形成可独立实施与交付的规格。产品实现和验收不属于本次设计修订。

## Notes

- 2026-11-02 用户要求按过度复杂评估再次简化。现行规格、各票 Answer、ADR 与验收材料已同步；此前 Comments 只记录历史。
- 保留所有当前 Map／Common／Troop Event 的直接字段、raw、嵌套、路线、None、Compiler Default、镜像与明确非活动配置；不按运行可达性筛选。
- 间接关系保留 Animation、Tileset、固定 Troop／Enemy、Enemy Transform、固定 Skill 正动画、Game Over、Return to Title。各使用保留定义位置及事件内 Asset Dependency Chain。
- 初始／默认候选、固定传送地图初始化素材、默认攻击、战斗系统音频／宿主背景和公共事件调用报告延后。Common Event 仍独立检查，缺素材不会因不收集 caller 而漏检。
- 普通使用严格、明确非活动配置 warning、必要输入／查询失败 error；精确例外带原因。非法／重复例外仍报错，合法例外未生效告警及三套精确统计延后。
- 文件定位、准确名称、固定扩展名、元数据、链接与加密支持边界保持；Compile／Check／Push 各一次素材门槛，无差异 Push 同样检查。
- 实时素材不进 Compile Baseline、快照、备份或写入；例外政策仍进基线。素材变化不影响已完成 data 的恢复记账，既有输入／绑定／漂移保护保留。
- 首版只以当前保留范围验收；延后族单独登记，不阻塞交付，也不标为通过。地图及六票保持 resolved，规格保持 ready-for-agent，产品实现与实际验收仍待执行。

## Decisions so far

- [01 原生文件定位](issues/01-native-asset-file-resolution.md#answer)：MV 1.6.1 文件定位事实和研究边界，未因缩小首版覆盖而改写历史事实。
- [02 覆盖与来源](issues/02-direct-asset-reference-coverage.md#answer)：直接字段与七族固定间接关系，独立事件根、局部来源和延后清单；见 ADR 0016。
- [03 文件事实](issues/03-asset-file-existence-contract.md#answer)：准确名称、扩展名、元数据及支持边界；依据原生反例与用户确认，图片 `%`／`#` 统一不支持，音频保留字面名称，见 ADR 0017。
- [04 诊断政策](issues/04-asset-diagnostics-and-policy.md#answer)：普通／非活动政策、精确例外、来源与完整性；取消首版候选、调用报告、三套统计及未生效例外告警，见 ADR 0018。
- [05 工作流](issues/05-workspace-asset-check-lifecycle.md#answer)：ADR 0019 单次门槛、当前文件事实和 data 恢复分离不变。
- [06 验收交接](issues/06-asset-validation-acceptance.md#answer)：保留范围独立验收，延后族不阻塞首版；[规格](asset-validation-spec.md)、[矩阵](acceptance-matrix.md)和[子用例索引](implementation-acceptance-cases.md)一致。

## Not yet specified

- 当前首版范围无阻碍实施的未决产品政策。延后能力不预先承诺交付时间，重新纳入时另定契约与验收。

## Out of scope

- 本次延后：初始／默认候选、固定传送目标初始化素材、公共事件调用报告、三套精确统计、未生效例外告警。

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

### 2026-11-02 — 收缩首版覆盖和验收

用户在评估后明确要求“进行简化”。本次保留直接素材与七族明确固定间接关系，将候选、传送初始化、调用报告、三套统计及未生效例外告警延后；同步票 02–06、ADR 0011／0012／0016–0019、术语、规格和两份验收材料。文件定位及单次检查／data 恢复原则保持。

旧族 ID 保留追溯，延后族不展开为首版通过要求；其余用例也移除相应旧分支。保留范围可独立交付，当前仍未实现产品或执行产品验收。历史研究与 Comments 保留原事实，不作为已撤销要求的实施依据。
