# 完整支持 MV 原生事件的决策地图

Labels: wayfinder:map
Status: resolved

## Destination

明确下一阶段完整支持 RPG Maker MV 1.6.1 原生事件所需的事件模型、指令语义、数据所有权、无损往返规则和验收方法，形成足以编写实施规格的已决路线。
本地图完成时，阻碍实施的设计问题均已解决；本轮建图不实现产品功能，也不宣称事件支持已经完成。

## Notes

- 平台范围按用户最新要求限定为 Windows / Node 22；Linux、macOS 等其他平台的支持、CI 与兼容验收不纳入本阶段。验收决策和实施规格已同步，Windows 文件系统与 E1–E7/R1–R7 必验保留。
- 用户于 2026-10-18 确认范围：Map Event、Common Event、敌群战斗事件、全部原生事件页属性、地图事件备注及全部原生事件指令。
- 用户确认：所有合法原生形态必须有正式 Event DSL 表达与反编译支持；`rawDslCommand` 不得充当原生功能未实现的长期替代。Script Input 和原生 Plugin DSL Command 使用各自正式 helper。
- 用户确认：`decompile → compile → push` 对支持范围内原生事件保持解析后的保存结构和值，目前只允许 JSON 文本表示差异。具体未知数据、raw、脚本/引用校验、LF/CR 映射及失败契约已由 [06](issues/06-semantic-roundtrip-policy.md#answer) 和 [ADR 0012](../../docs/adr/0012-event-saved-state-roundtrip-boundary.md) 最终确认，禁止静默丢失或自动修复。
- 用户确认：直接破坏现有 0.x DSL API 和 Workspace 格式，不保留兼容层，不提供迁移说明。
- 用户确认：最终验收同时包含自动化测试、真实 MV 编辑器打开/保存代表性事件、代表性游戏场景运行；本轮只规划这些检查。
- 每次继续前读取 `wayfinder`、`docs/agents/issue-tracker.md`、`docs/agents/domain.md` 和 `GLOSSARY.md`。讨论设计时使用 `grilling` 与 `domain-modeling`；研究使用 `research`；只有首方文档、模板和 runtime 不能回答编辑器问题时才使用 `reverse-engineer-anything`。
- 尊重 ADR 0001 的 Schema-First DSL、ADR 0003 的 Workspace Compile/Push 与 Data Domain 所有权、ADR 0004 的显式 MV Entry Identity、ADR 0006 的 Interrupted Push 安全模型，以及 ADR 0008 的 command-family 模块边界。必要的语义变更应明确指出需要重开的 ADR。
- 地图事件页遵循 [ADR 0009](../../docs/adr/0009-preserve-native-map-page-saved-state.md)：正式表达未启用的原生保存配置，使用固定空白页默认值，并仅对禁用条件的显式保存 ID 放宽目标存在性检查。此决定不替代 06 票的全局未知数据与往返契约。
- 敌群战斗事件遵循 [ADR 0010](../../docs/adr/0010-troop-event-ownership-and-reset.md)：整体接管 pages，以既有 troopId 标识，保留外部敌群数据与原生页序、禁用条件配置；省略声明和显式空白都生成一张默认空白页。非空白到空白的 Troop Event Reset 扩展 Destructive Change，但不放宽同步检查；未知数据规则与 Workspace 接入契约已分别由语义往返和 Workspace 集成决定确认。
- Workspace 集成遵循已接受的 [ADR 0013](../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 与 [ADR 0014](../../docs/adr/0014-publish-decompiled-source-as-a-complete-directory.md)；验收与实施顺序已由[如何证明 MV 事件支持完整并划定实施顺序](issues/08-completion-evidence-and-sequencing.md#answer)确认，实际实现与安全验收仍待执行。
- 原生保存形态遵循已接受的 [ADR 0015](../../docs/adr/0015-bounded-native-saved-shape.md)：Stop保留可选秒数槽；移动记录与M0使用逐类有限保存字段；非空子体尾标记两态由正式结构精确保留。编写默认不修补原生数据，静态推导、明确产品支持选择与真实UI观察分开记录。
- 原生保存值边界已由[13号票](issues/13-native-value-domain-boundaries.md#answer)最终确认：脸图索引与四类direct坐标采用非负32位域并拒绝负零，素材不扫描，当前尺寸或运行上下文风险按明确矩阵警告；列明单槽字符串完整保存并按CR/LF给参数重确认风险提示。ADR0011/0012已细化，产品选择、静态路径与真实验收分别记录。
- 用户所说的 `.references/RPGMV` 实际位于 `references/RPGMV`；另有 `references/rmmv-local-runtime-1.6.1`、`references/rpg-maker-mv-corescript` 与 `references/rmmv-test-project`。它们是本地参考资料，不随研究分支发布。
- 研究必须区分首方帮助、随包模板、runtime 源码、编辑器二进制与真实运行观察；runtime 版本不能代替编辑器本体版本证据。未经实际执行不得声称编辑器或游戏测试通过。
- 原生指令契约已最终确认：[原生指令逐参数契约还缺哪些证据](issues/11-native-command-parameter-evidence.md#answer)已交付逐参数表，其发现的保存形态和值域问题也已决；[验收与实施顺序](issues/08-completion-evidence-and-sequencing.md#answer)已最终确认。类别库存、静态研究与设计讨论完成均不能代替产品全参验证及原生验收。
- 本地 tracker 使用 `Type` / `Labels` 标识票类型；`Status: open / claimed / resolved` 为 wayfinding 执行状态，不使用 triage 标签。依赖见各票 `Blocked by`；按编号选择未解决、未认领、依赖均已解决的票。研究票可并行，HITL 设计票必须由用户实际参与，建图会话不手动解决设计票。
- 研究报告放在本目录 `research/`。每条研究使用独立的临时 `research/<name>` 分支，仅推送自写研究文字，不开 PR、不合并、不提交本地编辑器、游戏资产或原生源码副本。结果应链接报告、分支和原始资料位置。

## Decisions so far

<!-- 仅索引已解决的决策票；用户已确认的目的与边界记录在 Notes。 -->

- [MV 原生事件数据的完整边界与版本基准是什么](issues/01-native-event-data-baseline.md)：三类事件的完整字段与主要语义已有首方依据；控件边界、初始化与编辑器保存规则由独立研究继续取证。
- [原生事件指令的参数与结构还存在哪些保真缺口](issues/02-native-command-fidelity.md)：105+45 的逐项静态库存已建立，并定位参数、镜像、递归验证与引用装配缺口；全参组合与真实往返仍需后续证据。
- [地图事件备注与完整事件页应采用什么 DSL 模型](issues/03-map-event-page-model.md)：经三轮逐项讨论与最终确认，已确定 note、完整页分组、固定空白页默认、未启用状态保留、共享 Movement Route、禁用条件 ID 例外、图像/数值校验和准确省略默认的反编译规则；ADR 0009 已接受，05/06/07/08 继续承接各自范围。
- [敌群战斗事件的身份与数据所有权如何划定](issues/04-troop-event-ownership.md)：经三轮 Q1–Q11 及最终确认，已确定 troopId 与 pages 所有权、完整条件/span 模型、位置引用校验、默认空白与 Reset 分类、数量边界及逐敌群反编译；ADR 0010 已接受，05/06/07/08 已收到后续输入。
- [原生指令的完整参数与结构应如何表达和校验](issues/05-native-command-contract.md#answer)：经四轮 Q1–Q24 及最终确认，已确定正式表达、固定默认、分支与续行、保存状态、引用/运行选择校验、文本/None/脚本与插件边界；ADR 0011 已接受，逐参数证据表继续作为实施规格完成门槛。
- [语义无损往返与未知数据处理的精确契约是什么](issues/06-semantic-roundtrip-policy.md#answer)：经四轮 Q1–Q16 及最终确认，按保存结构和值判定往返；未知事件代码单记录 raw 警告保留，已知异常和事件内部未知字段拒绝，外部 carrier 完整保留。raw 原生参数/引用/Gate 不豁免，完整列表结构校验，文本只以 LF 分记录且 CR 原样保存；已确定发布前引用检查、准确诊断与反编译失败隔离。ADR 0012 已接受并收紧 ADR 0003，05 文本规则及 07/08/11 已同步；实现和真实验收仍未执行。
- [扩展事件数据域后 Workspace 如何保持同步与写入安全](issues/07-workspace-domain-integration.md#answer)：经三轮 Q1–Q16 及最终确认，已确定真实校验输入、完整候选发布、页级 Diff/Reset、基线版本与目标绑定、全标准输入漂移检查、失败恢复和操作互斥；ADR 0013/0014 已接受，验收输入已交后续规划，未实施产品或执行真实验收。
- [编辑器如何保存分支与移动路线及不启用的字段](issues/09-editor-serialization-evidence.md)：本体版本与嵌入源证据已确认 402 文本、505 镜像、空分支 code 0 和非激活编辑状态的保存规则；真实保存仍属验收工作。
- [原生事件属性的合法值与创建默认值是什么](issues/10-editor-event-defaults-and-limits.md)：普通创建/清空的工厂初值、属性控件范围与常规页数限制已有静态依据；装载异常值、控件时序和真实保存仍需实验。

- [原生指令逐参数契约还缺哪些证据](issues/11-native-command-parameter-evidence.md#answer)：105+45逐参数证据及全模式/样本责任已齐，实际REA+Ghidra补齐随包Qt数值控件依据；其发现的正常保存形态与具体值域边界已由相应决策确认，真实验收仍待后续执行。

- [原生保存形态差异如何进入正式 DSL](issues/12-native-saved-shape-model.md#answer)：经两轮Q1–Q7及最终确认，已确定Stop可选seconds、移动指令savedShape与路线terminator的逐类外壳及默认、子体commands/endMarker对象、准确省略和undefined语义；保留精确镜像、raw完整结构校验及递归引用/Gate。ADR0015已接受，验收输入已纳入最终验收方案；产品实现与真实验收仍待执行。

- [原生控件范围与保存值的支持边界如何划定](issues/13-native-value-domain-boundaries.md#answer)：经两轮Q1–Q8及最终确认，已确定faceIndex与E201/202/203/285直接坐标的0..2,147,483,647整数域和负零拒绝；不扫描素材，非None大索引与固定/运行地图采用准确warning；完整字符串保留CR/LF/尾部字符，并按原生单行/两行控件给重确认风险提示；EXP常量1..9,999,999，帮助差异交真实验收。ADR0011/0012、参数表及验收输入已同步；实施与真实验收尚未执行。

- [如何证明 MV 事件支持完整并划定实施顺序](issues/08-completion-evidence-and-sequencing.md#answer)：经三轮Q1–Q12及最终确认，已确定逐项契约覆盖、独立原生/合成证据、E1–E7编辑器与R1–R7游戏必验组、Windows及原生执行责任、三层故障验证、S0–S7实施依赖和按影响复验规则；区分设计完成、切片合入与完整支持声明。方案已定，产品实现与真实验收仍待执行。

## Not yet specified

- 当前无阻止编写实施规格的未决设计问题。后续原生前置实验与完整组合验收仍可能暴露页生命周期、战斗时序或编辑器保存行为的具体反例；按已决流程重开相关契约或形成独立决策票，不能静默修改既定预期。

## Out of scope

- RPG Maker MZ、VX Ace 和其他版本，以及其他 MV 版本的兼容承诺。
- 插件私有命令参数语义、插件私有文件的理解，以及非标准数据的正式建模；其保留或拒绝边界由 06 确定，不能静默丢失。
- 地图绘制和整个数据库的 DSL 化。敌群战斗事件属于本阶段，敌群成员、角色、技能等数据库内容的完整定义不因此自动纳入。
- 运行时引擎改造、重建 RPG Maker 编辑器、发布或复刻本地参考软件。
- 旧 DSL / Workspace 的兼容层和迁移说明。

## Comments

### 2026-10-19 — 决策地图完成

用户最终确认[如何证明 MV 事件支持完整并划定实施顺序](issues/08-completion-evidence-and-sequencing.md#answer)的完整契约与完成边界，并确认关闭该票和更新地图。全部 13 张决策票均已 resolved，地图达到“足以编写实施规格”的目的，状态更新为 resolved。已核对决策索引和票据状态；本次完成的是设计路线，原生前置实验、产品实现、自动化和编辑器/游戏验收按已确定方案进入后续阶段，没有在本轮被记为通过。

### 2026-10-19 — 实施规格发布

已按 to-spec 将全部已决契约、逐参数附表、测试边界与 S0–S7 依赖整理为[MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation/complete-mv-events-implementation-spec.md)，状态为 ready-for-agent。后续通过 to-tickets 在独立实施 effort 中拆分任务，原十三张设计票保持 resolved。规格发布不表示原生前置实验、产品实现或自动化/编辑器/游戏验收已完成。

### 2026-10-19 — 平台范围收敛到 Windows

用户要求当前只支持 Windows，已同步验收方案的正式 Answer、实施规格、任务确认记录和正式任务，CI 改为 Windows / Node 22。保留历史讨论作为来源记录；当前不承担 Linux 等其他平台的兼容和验收要求。事件能力范围、55 张任务的依赖和原生验收要求保持不变，地图状态仍为 resolved。
