# 完整支持 MV 原生事件的决策地图

Labels: wayfinder:map
Status: open

## Destination

明确下一阶段完整支持 RPG Maker MV 1.6.1 原生事件所需的事件模型、指令语义、数据所有权、无损往返规则和验收方法，形成足以编写实施规格的已决路线。
本地图完成时，阻碍实施的设计问题均已解决；本轮建图不实现产品功能，也不宣称事件支持已经完成。

## Notes

- 用户于 2026-10-18 确认范围：Map Event、Common Event、敌群战斗事件、全部原生事件页属性、地图事件备注及全部原生事件指令。
- 用户确认：所有合法原生形态必须有正式 Event DSL 表达与反编译支持；`rawDslCommand` 不得充当原生功能未实现的长期替代。Script Input 和原生 Plugin DSL Command 使用各自正式 helper。
- 用户确认：`decompile → compile → push` 对原生事件要求数据语义等价，允许 JSON 排版变化；无法表达的数据必须明确保留或报错，禁止静默丢失。等价的精确定义、可归一化的表示差异以及未知数据策略仍由决策票解决。
- 用户确认：直接破坏现有 0.x DSL API 和 Workspace 格式，不保留兼容层，不提供迁移说明。
- 用户确认：最终验收同时包含自动化测试、真实 MV 编辑器打开/保存代表性事件、代表性游戏场景运行；本轮只规划这些检查。
- 每次继续前读取 `wayfinder`、`docs/agents/issue-tracker.md`、`docs/agents/domain.md` 和 `GLOSSARY.md`。讨论设计时使用 `grilling` 与 `domain-modeling`；研究使用 `research`；只有首方文档、模板和 runtime 不能回答编辑器问题时才使用 `reverse-engineer-anything`。
- 尊重 ADR 0001 的 Schema-First DSL、ADR 0003 的 Workspace Compile/Push 与 Data Domain 所有权、ADR 0004 的显式 MV Entry Identity、ADR 0006 的 Interrupted Push 安全模型，以及 ADR 0008 的 command-family 模块边界。必要的语义变更应明确指出需要重开的 ADR。
- 地图事件页遵循 [ADR 0009](../../docs/adr/0009-preserve-native-map-page-saved-state.md)：正式表达未启用的原生保存配置，使用固定空白页默认值，并仅对禁用条件的显式保存 ID 放宽目标存在性检查。此决定不替代 06 票的全局未知数据与往返契约。
- 用户所说的 `.references/RPGMV` 实际位于 `references/RPGMV`；另有 `references/rmmv-local-runtime-1.6.1`、`references/rpg-maker-mv-corescript` 与 `references/rmmv-test-project`。它们是本地参考资料，不随研究分支发布。
- 研究必须区分首方帮助、随包模板、runtime 源码、编辑器二进制与真实运行观察；runtime 版本不能代替编辑器本体版本证据。未经实际执行不得声称编辑器或游戏测试通过。
- 本地 tracker 使用 `Type` / `Labels` 标识票类型；`Status: open / claimed / resolved` 为 wayfinding 执行状态，不使用 triage 标签。依赖见各票 `Blocked by`；按编号选择未解决、未认领、依赖均已解决的票。研究票可并行，HITL 设计票必须由用户实际参与，建图会话不手动解决设计票。
- 研究报告放在本目录 `research/`。每条研究使用独立的临时 `research/<name>` 分支，仅推送自写研究文字，不开 PR、不合并、不提交本地编辑器、游戏资产或原生源码副本。结果应链接报告、分支和原始资料位置。

## Decisions so far

<!-- 仅索引已解决的决策票；用户已确认的目的与边界记录在 Notes。 -->

- [MV 原生事件数据的完整边界与版本基准是什么](issues/01-native-event-data-baseline.md)：三类事件的完整字段与主要语义已有首方依据；控件边界、初始化与编辑器保存规则由独立研究继续取证。
- [原生事件指令的参数与结构还存在哪些保真缺口](issues/02-native-command-fidelity.md)：105+45 的逐项静态库存已建立，并定位参数、镜像、递归验证与引用装配缺口；全参组合与真实往返仍需后续证据。
- [地图事件备注与完整事件页应采用什么 DSL 模型](issues/03-map-event-page-model.md)：经三轮逐项讨论与最终确认，已确定 note、完整页分组、固定空白页默认、未启用状态保留、共享 Movement Route、禁用条件 ID 例外、图像/数值校验和准确省略默认的反编译规则；ADR 0009 已接受，05/06/07/08 继续承接各自范围。
- [编辑器如何保存分支与移动路线及不启用的字段](issues/09-editor-serialization-evidence.md)：本体版本与嵌入源证据已确认 402 文本、505 镜像、空分支 code 0 和非激活编辑状态的保存规则；真实保存仍属验收工作。
- [原生事件属性的合法值与创建默认值是什么](issues/10-editor-event-defaults-and-limits.md)：普通创建/清空的工厂初值、属性控件范围与常规页数限制已有静态依据；装载异常值、控件时序和真实保存仍需实验。

## Not yet specified

- 首方编辑器帮助、模板与 1.6.1 runtime 如存在分歧，哪些具体分歧必须用编辑器保存样本或二进制证据裁定，待研究发现后才能逐项命名。
- 完整组合场景可能暴露尚未看见的页生命周期、战斗时序或编辑器归一化规则；发现具体反例后再形成独立决策票。
- 指令库存中多数 family 尚未逐参数深审；正式契约确定后，再明确哪些参数组需要独立事实调查、哪些由原生夹具与实施验收覆盖，不能将库存状态当作全参完成。
- 新增数据域贯穿 Workspace 时可能暴露现有安全模型的特殊情况；先确定敌群事件所有权与未知数据规则，再决定是否需要额外调查。

## Out of scope

- RPG Maker MZ、VX Ace 和其他版本，以及其他 MV 版本的兼容承诺。
- 插件私有命令参数语义、插件私有文件的理解，以及非标准数据的正式建模；仍须在本阶段明确其保留或拒绝行为，不能静默丢失。
- 地图绘制和整个数据库的 DSL 化。敌群战斗事件属于本阶段，敌群成员、角色、技能等数据库内容的完整定义不因此自动纳入。
- 运行时引擎改造、重建 RPG Maker 编辑器、发布或复刻本地参考软件。
- 旧 DSL / Workspace 的兼容层和迁移说明。
