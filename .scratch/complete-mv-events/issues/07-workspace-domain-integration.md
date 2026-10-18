# 扩展事件数据域后 Workspace 如何保持同步与写入安全

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: 04, 06
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置决策：[敌群战斗事件的身份与数据所有权如何划定](04-troop-event-ownership.md)、[语义无损往返与未知数据处理的精确契约是什么](06-semantic-roundtrip-policy.md)。

与用户确定完整地图页与敌群战斗事件接入 Staged Data Graph、Project Data Reference、decompile、materialization、Structured Diff、freshness、drift、Destructive Change 和 Interrupted Push 的一致边界。

重点讨论 Troops.json 的事件页域如何在保留外部字段时检测变化和移除；已有页属性变化、事件页清空、所属 troop 消失和外部编辑器改动怎样在 diff/push 中呈现与阻止误写。对现有数据域整体所有权、显式 ID 与无部分写入保证，沿用既有 ADR，或明确记录重新决策的理由。

不借本次工作扩展为通用文件同步系统。需要可复用的规则与失败场景，足以指导实现与安全测试。

## Research inputs

[MV 1.6.1 原生事件指令库存与有界保真审计](../research/native-command-fidelity.md) 的 Workspace 调用链调查指出：当前 validation input 未载入 Animations/Tilesets，部分编译单测却手工注入了这两类引用。讨论和实施验收需覆盖已有原生指令的真实 Workspace 路径，不只接入新增 Troop Event 数据域。

## Answer

用户于 2026-10-18 在逐轮接受 Q1–Q16 后，对完整契约与设计结案再次回复“确认”。以下为正式结论；本票已 resolved，ADR 0013/0014 已 accepted。本票完成设计决策，不表示功能已经实现或验收已经通过。

### 领域接入与真实校验输入

完整 Map Event note/页面、Common Event 与 Troop Event 必须贯穿声明收集、Staged Data Graph、Decompile、Compile/Check、物化、Structured Diff、Push 与恢复；不能只在独立 compiler 测试中手工注入数据。沿用 ADR 0009–0012：完整保存状态从 DSL 与固定 Compiler Defaults 构建，外部 carrier 数据按 Snapshot 的 JSON 值保留，已拥有事件内部的未知字段拒绝。

实际 Workspace 输入必须供给 Animations/Tilesets、地图尺寸与事件位置及 tilesetId/tilesetNames、敌群完整有序 members 与 Enemy 实际存在性、System 装备槽配置和变量/开关容量，以及已确认原生命令所需的其他项目数据。实际 ID 存在性、唯一名称索引与有序成员上下文分别表达；空名称条目不能因名称索引过滤而丢失实际身份。现有 troop 项目引用仍指向外部敌群，Troop Event Identity 则以所属 troopId 标识事件页域。

System 变量与开关容量分别为 `max(Snapshot 容量, DSL 命名声明最大 ID)`，没有声明时最大 ID 为 0。名称删除不缩容量，引用不扩容量；容量内无名正 ID 可显式引用，名称只解析 DSL 命名声明。禁用保存 ID 的有限例外、名称唯一解析、启用战斗敌人条件的严格成员校验、普通 Runtime Selector 警告，以及所有保存路线和可识别原生 raw 的引用/Gate 校验，均按已决契约进入真实工作流。

### 校验、生成与诊断

Decompile 对完整候选声明和外部 Snapshot 检查可表达性、原生保存结构及已能确定的固定引用，不借已有手写声明补目标。Compile/Check 独立验证最终 Staged Data Graph，并完成同一完整输出的结构检查，覆盖 Loop、所有保存路线、正式 helper/raw 混用、分支、续行、镜像和结束。Check 在内存中完成后停止，不发布任何产物或修改 Freshness。

Gate 关闭允许准确 Decompile 并提示，但 Compile/Check 必须拒绝可识别的原生脚本输入。Decompile、Compile 和 Check 默认在 stderr 显示含稳定标识、阶段、严重级别、身份与路径的诊断；warning 不改变成功结果，error 阻止成功。继承 ADR 0012 的双位置冲突、可靠行列和区分不支持/违反契约规则，不新增公开 JSON 诊断接口或 warnings-as-errors。

校验失败不发布新产物。Compile 发布阶段 I/O 失败可以使 generated/manifest 不可用，不保证旧输出仍可使用，但 Diff/Push 必须拒绝不完整、不一致或不 fresh 的状态；再次成功 Compile 恢复使用。Compile 不修改 Project Root 或 Snapshot。

### Decompile 的完整发布

完整候选源码先进入 Discovery 无条件排除的隔离区，以最终落点的依赖解析语义完成检查，然后一次发布到 `sourceRoot/decompiled/`。整个目标目录必须不存在，空目录也拒绝；最终发布不得覆盖并发出现的目标。宽 glob、链接/junction 与路径别名不能使候选提前可见；不能证明隔离或单次完整发布时，在发布前失败，不降级逐文件复制。

发布前确认实际 Discovery 配置会收录全部候选，且其 Entry Identities 与已有被发现声明无冲突。已有源码仅用于可靠身份提取，语法/受限表达式错误导致身份不可知则拒绝；不把它的全部类型、引用或 Gate 校验加入 Decompile 前提。不自动改配置、覆写源文件或生成编号目录，不用现有声明修补候选的引用。

失败保留原有源码与 Snapshot，候选残片始终隔离；仅清理能明确证明归属的工具临时内容。目录完整发布后进程未报告成功就退出，重试报告目标存在，不删除完整结果。不增加反编译覆盖、合并或独立恢复命令。详细权衡见 [ADR 0014](../../../docs/adr/0014-publish-decompiled-source-as-a-complete-directory.md)。

### Diff、物化与破坏性变化

输出为全部 DSL-Owned Project Data 的完整状态。Troops carrier 只替换 pages，保留所属 troop 的 ID、名称、成员及其他非事件 JSON；所属 troop 缺失且仍有声明时报错。省略既有 troop 的声明与显式默认空白均生成一张原生默认空白页，不删 troop、不写 null、不继承旧页。

报告按 Data Domain/Entry Identity，再按原生页位置展示页数、保存字段与命令列表变化。内部数组路径 0 起始，人类页号 1 起始并明确区分；第一版不推断页稳定身份或智能移动匹配。Troop Event Reset 有独立标识及破坏性原因，以 Snapshot 非空白到 Generated 默认空白的内容转换判定，不受声明是否显式影响；局部删页后仍非空白是普通修改。Map/Common 条目移除及 System 名称清空继续遵循既有 Entry Removal 规则。

Diff 与 Affected 文件判定比较解析后的保存结构和值，不因对象键顺序、排版或等价转义产生变化；数组位置、字段存在性和实际保存值不能忽略。文件过滤支持 Troops.json，过滤视图继续保留全局破坏性状态；过滤不缩小 Push 的全局安全检查。不承诺稳定公开 JSON Diff API。MV-Style JSON Writer 与整文件生成支持 Troops carrier，但不会把外部 carrier 字段变成 DSL-owned。

### Freshness、目标绑定与输入一致性

Compile Baseline 包含实际使用的 DSL 输入与类型校验依赖、相关 Workspace Config、Snapshot 集合及内容、Project Root Binding 和 Compile Contract Version。工具自身 DSL 类型、校验规则、输出语义或 Compiler Defaults 变化须改变编译契约版本；外部类型依赖的修改、删除或替换使旧产物失效。缺失或不匹配版本不得继续 Diff/Push；不提供旧 Workspace 兼容迁移，不新增普通 helper 值导入或事件 JavaScript 执行能力。

Snapshot、Compile Baseline 和 pending 绑定规范化后的 Project Root 路径。无 pending 时切换目标须显式 Pull，重建 Snapshot/绑定并令旧产物失效；有 pending 时先回到原目标恢复。不新增工程 UUID。

捕获内容、集合与哈希必须一致：校验和生成使用实际被哈希的同一份输入，不能事后读取新内容为旧结果背书。发布前观察到输入集合、文件或配置变化就失败并要求重跑，不自动重试或局部重读继续；Clone/Pull、Decompile、Compile 与 Check 均遵循此规则。MapInfos 对地图集合的定位也服从相同约束；无法安全确定集合或定位 carrier 时明确拒绝，不静默过滤成看似完整输入。

### Push 与 Interrupted Push

漂移保护采用完整 Standard Project Data Snapshot 文件集合：支持的固定标准数据库文件与 Snapshot MapInfos 登记的所有地图。插件文件和未登记孤立地图排除，不按实际引用条目动态缩小集合。即使无实际写入也执行检查；未直接引用条目的变化亦会阻止 Push。实时漂移使用整文件内容哈希，不能用 Diff 的语义相等放行编辑器重写。

实际写入与备份仅覆盖 Affected Project Data Files。首次替换前检查完整集合；逐文件替换时再核对预期旧内容；全部替换后、刷新 Snapshot/Manifest 前再检查完整集合，此时已写文件应等于 generated，其余文件等于原 Snapshot。写入前发现变化不开始写；开始写入后发现变化或替换/同步收尾失败则保留 Interrupted Push，不覆盖外部改动或自动全工程回滚。只在成功通过这些检查后完成相应 Snapshot/Manifest 刷新与 pending 清理。

沿用 ADR 0006 的实际内容分类：格式可理解且恢复证据一致时，全 generated 完成已有写入收尾，全 snapshot 放弃 pending；混合/缺失/未知内容、损坏或不一致元数据拒绝自动恢复。恢复先验证原目标绑定；保留原源码/依赖/配置/契约的基线依据，仅记录已发生写入引起的 Snapshot 更新，不借恢复重算把旧产物标成新契约或新输入结果。未知 pending 格式不迁移、不猜测或删除。收尾后仍执行普通 Freshness 与全量 Drift 检查，旧契约或新漂移阻止任何新写入；非 Push 命令不得解决 pending。

这些检查不锁住外部编辑器，不承诺检查后的文件永不变化或多文件原子隔离。同步时避免同时保存工程；不增加跨 Workspace 或跨机器协作锁。权衡与基线扩展见 [ADR 0013](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md)。

### 操作互斥与完成边界

同一 Workspace 的 Clone/Pull/Decompile/Compile/Check/Diff/Push 共用操作互斥，竞争立即报忙并要求重试，不排队；只读命令也不能读取另一个命令正在替换的状态。互斥不能使 Check 改写业务状态。只清理可证明失效的操作锁，锁失效不代表 pending 已解决，不借锁清理移除 pending。不同 Workspace 可独立操作。

本票交付的是集成与失败契约、相应领域文档及后续验收输入；不实施产品、不运行或宣称通过编译、并发、故障注入、真实编辑器或游戏验收。[完整性与实施顺序讨论](08-completion-evidence-and-sequencing.md) 继续负责实现切片和验收计划；[逐参数证据调查](11-native-command-parameter-evidence.md) 的全参证据门槛不因本票完成而消失。

## Comments

### 2026-10-18 — 开始 grill-with-docs 讨论

用户指定讨论本票，已认领并进入 HITL 设计访谈。沿用已确认的地图页、Troop Event、原生指令与语义往返契约，先只读核对 Workspace 的校验输入、源码发现与发布、物化、Diff、Freshness、Drift 和 Interrupted Push 实现，再逐轮确认集成边界。当前尚无新增已接受决定，不实施功能，不以讨论或静态代码调查代替自动化与真实编辑器/游戏验收。

### 2026-10-18 — 已决地图页模型输入

[03 号票](03-map-event-page-model.md#answer) 已解决，完整 note/页字段必须贯穿实际 Workspace 读取、反编译、校验、编译、Diff 与物化路径。现有 Snapshot 已保存完整 Map JSON 与 Tilesets.json，但页面验证上下文尚未保留 map.tilesetId / tilesetNames，需要接通，不能只在单测中注入。活动图块所用 tileset 不存在时报错，对应 B/C/D/E 图组名称为空时警告并保留；本票输入不要求新增图片文件或尺寸扫描。

项目引用校验必须区分禁用条件显式保存 ID 的有限例外、名称引用的唯一解析，以及始终完整校验的 Movement Route。不得使空白页的禁用占位 ID 1 依赖实际条目存在。完整输出仍从 DSL 与固定 Compiler Defaults 构建，不与旧事件隐式合并；既有 Freshness、Drift、Destructive Change 和 Interrupted Push 安全边界继续适用。

### 2026-10-18 — 已决 Troop Event 所有权与 Reset 输入

[04 号票](04-troop-event-ownership.md#answer) 已最终确认并解决，长期依据为 [ADR 0010](../../../docs/adr/0010-troop-event-ownership-and-reset.md)。整个 Troop Event 域由 DSL 接管，显式 troopId 指向 Snapshot 中现有敌群；名称、成员及其他非事件 carrier 数据仍来自 Snapshot。现有 troop 项目引用指向外部敌群，不改指 Troop Event 定义。空名称或空成员敌群仍可拥有事件，不能用当前会丢弃空名称的名称引用索引代替原始 ID 存在性检查。

本票应将 Troops.json 贯穿声明收集、完整验证上下文、反编译、物化、Structured Diff 和 Push 文件支持。输入必须保留完整成员列表及 Enemy 存在性信息，不只保留 id/name。页条件的角色/开关禁用 ID 例外、敌人禁用位置例外，以及启用敌人条件对成员有效性的检查，应在实际 Workspace 路径成立，不能只靠手工注入的编译单测。

省略现有敌群的声明和显式默认空白定义都生成一张默认空白页；pages=[] 拒绝。Snapshot 非空白变成 Blank Troop Event 是 Troop Event Reset，属于 Destructive Change，按前后数据分类并要求显式允许；它不是 Snapshot-Only Owned Entry 的 Entry Removal，不能删除 troop 或写 null。原本默认空白没有变化，局部删页后仍非空白是普通内容修改。Diff 需保留 troop 身份、原生页序与整体 Reset 的可辨识信息；具体报告形状由本票确定。

Reset 不绕过 Freshness、Drift 或 Interrupted Push。本票继续明确实际接入和失败场景：若 Troops.json 成为 Affected Project Data File，沿用当前整文件漂移机制时，外部 name/members 改动也会阻止写入；04 没有批准实时细粒度合并。Snapshot 中所属 troop 消失且声明仍存在时报错；成员重排按新位置解释，坏 Enemy 引用不能通过 runtime 过滤悄悄改变目标。等待 06 的未知数据规则后再完成本票决策。

### 2026-10-18 — 原生指令契约的引用与上下文输入

[原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md#answer) 的 Q1–Q24 及完整契约已最终确认，讨论票已解决，ADR 0011 已接受。本票需将以下已选边界接到真实 Workspace，而非只靠手工注入的 compiler 测试：

- variableRef/switchRef 的显式ID可引用最终生成System容量内的无名正ID槽；名称仅解析唯一DSL命名声明，不回退Snapshot名称。引用不扩容；ID0和越界仍报错，既有禁用页条件保存ID例外不变。本票明确最终容量及对应输入构造。
- 普通命令中的固定项目引用必须存在；Runtime Selector 合法数值域内的位置缺失或不适用上下文警告保留。Common Event 不强制声明上下文，不做全调用图状态预测。启用enemy页条件仍沿用战斗页更严格规则，不与命令警告混用。
- 校验输入保留地图事件位置、敌群完整成员/Enemy有效性、System装备槽配置与需要的项目数据；接通 Animations/Tilesets。Change Equipment 的equipment ID按运行时槽位解释，不能从初始Actor/Class编成固定weapon/armor引用。
- compile --check与普通compile完整递归同一命令结构，包含Loop及所有保存路线；所有Script Input执行Gate，None素材或空Script不能绕过。语义往返讨论另定Raw DSL边界。

连续ID范围、固定默认、空Shop与None参数必须贯穿decompile/compile/物化及Diff，不能在不同阶段重新解释。现有Freshness/Drift/Destructive Change/Interrupted Push边界继续适用；本次输入未授权新增同步机制，也未执行实际Workspace验证。

### 2026-10-18 — 语义往返契约的已最终确认输入

[06 号票 Answer](06-semantic-roundtrip-policy.md#answer) 的 Q1–Q16 及完整契约已最终确认，06 已 resolved，ADR 0012 已 accepted，ADR 0003 已同步。本票的 04/06 前置决策均已解决，保持 open，随后接入以下要求，不将机制设计或真实验证视为已经完成：

- 支持范围内按保存结构和值判定往返；未知外部 carrier JSON 完整保留，已拥有事件内部的未知字段拒绝。外部数据只进行定位/替换与所需引用校验；不扩大 DSL 所有权或进行实时细粒度合并。
- Decompile 发布源码前校验完整候选声明加外部 Snapshot 已能确定的固定引用，不借手写源码补目标；Compile/Check 对最终图独立重查。原生保存例外、Runtime Selector 警告与系统槽容量约定须接到实际输入。
- 真正未知事件代码可单记录 raw 警告保留；已知原生参数、引用和脚本即使手写 raw 也执行正式校验。未知移动指令拒绝，不以 raw 205 隐藏。完整生成列表统一检查缩进、分支、镜像、续行和结束。
- Gate 关闭允许准确反编译并提示，Compile/Check 必须阻止；覆盖所有保存体、路线和可识别原生脚本，不声称理解未知插件载荷。
- 反编译任何事件不可表达则整次失败；包括 I/O 发布失败在内，不得遗留会被 Definition Source Discovery 当作完整接管读取的部分新源码。保留原有源码与 Snapshot，可独立保留诊断。本票选择隔离发布、回滚或失败状态拦截的具体机制。
- 诊断携带稳定标识、阶段、严重级别、身份和原生/DSL 路径；镜像冲突双位置，源码行列只在可靠时提供。Push 继续执行既有同步与破坏性检查，不作为首次事件表达校验阶段。

### 2026-10-18 — grill-with-docs 第一轮：Q1–Q5 已确认

用户对本轮五项建议回复“确认”。以下为已接受的分项决定；本票继续 claimed，尚未完成全体边界及最终共同理解确认，不实施功能。

1. **Q1 编译依赖的实时漂移保护**：Push 除了检查 Affected Project Data Files，还检查影响本次编译或校验的只读标准项目数据文件。依赖文件相对 Snapshot 发生变化时，要求 Pull、重新 Compile 和审阅 Diff；这些文件仅参与检查，不因此纳入写入、备份或 DSL 所有权。此项明确扩展现有“只检查将写文件”的行为和测试约定；依赖集合的确定方式、检查时点与 Interrupted Push 的交互继续讨论，不默认全工程文件同步或实时合并。
2. **Q2 System 最终容量**：变量与开关分别使用 `max(Snapshot 容量, DSL 命名声明最大 ID)`；无声明时最大 ID 取 0。容量内无名正 ID 槽允许显式 ID 引用；删除名称不缩容量，引用不扩容量，名称仍只解析 DSL 命名声明。Decompile 候选图、Compile/Compile Check 与物化使用同一容量规则；ID 0/越界引用仍报错，既有禁用页条件保存 ID 的有限例外不变。
3. **Q3 Decompile 整批隔离发布**：完整候选源码在 Definition Source Discovery 无条件排除的隔离位置生成与校验，成功后以一次目录发布让整批结果可见。发布前部分候选不能参与编译；原有用户源码与 Snapshot 保持原样。隔离不能仅依赖默认 glob、用户 exclude 或临时目录名称。目标目录冲突、I/O/进程中断遗留与实际 Discovery 配置兼容性留待后续决定。
4. **Q4 Structured Diff 基础表达**：报告按 Data Domain 与 Entry Identity 定位；地图页和战斗页按原生数组位置比较，展示页数、保存字段和命令列表变化。Troop Event Reset 必须有独立可辨识标识和破坏性原因，显式空白声明不能绕过。第一版不推断稳定页身份或智能移动匹配，页前移可表现为多个位置变化。内部原生数组路径为 0 起始，面向用户的页号为 1 起始并明确区分；不据此承诺稳定公开 JSON API。
5. **Q5 Compile Contract Version**：由工具维护编译契约版本并纳入 Compile Baseline。影响输出、校验规则或 Compiler Defaults 的变化使旧 Generated Project Data 失效；版本缺失或不匹配时 Diff/Push 要求重新 Compile，不把旧产物视为当前契约结果，不提供旧 Workspace 兼容层。版本变化时 pending Interrupted Push 的恢复边界尚待确认。

静态代码核对发现的现状：反编译目前直接逐文件发布，未覆盖中途 I/O 失败；System 物化已有上述容量算法但引用 resolver 尚未接通无名槽；Structured Diff 目前只有条目级分类；Push 只检查将写文件的实时漂移；Compile Baseline 尚无编译契约版本。这些是待实现缺口，不是已执行验证。下一轮继续依赖范围、发布发现完整性、失败与恢复契约，必要时记录新的 ADR。

### 2026-10-18 — grill-with-docs 第二轮：Q6–Q13 已确认

用户对本轮八项建议回复“确认”。以下细化第一轮决定；本票仍在讨论，不视为最终结案或实现完成。

6. **Q6 固定标准依赖集合与无写入 Push**：漂移保护使用完整 Standard Project Data Snapshot 文件集合，即支持的固定标准数据库文件与 Snapshot 的 MapInfos 所登记全部地图；不引入按实际引用条目的精确依赖追踪。集合内任何文件变化或缺失均要求 Pull 后重新 Compile，包括未直接引用条目的修改。插件文件与未登记孤立地图继续排除。无 Affected Project Data File 的 Push 仍检查同一集合，不提前返回成功；检查不会扩大实际写入或备份范围。
7. **Q7 固定目标目录及重试**：反编译继续发布至 `sourceRoot/decompiled/`，整个目标目录必须不存在；存在时即使为空也整次拒绝，不自动合并、覆盖或生成编号目录。失败候选始终隔离；重试仅清理工具能明确识别归属的临时内容，不删除不明文件。目录已经完整发布而进程尚未报告成功就退出时，重试报告目标存在，不把已完整发布的结果当作残片删除。
8. **Q8 发布前 Discovery 与身份检查**：使用实际 Discovery 配置确认全部候选文件会被收录，候选声明与已有被发现声明无 Entry Identity 冲突；原有源码有语法或受限表达式错误、无法可靠提取身份时，拒绝发布。诊断指出配置或冲突位置，不自动修改配置或原源码。既有源码只用于声明身份检查，不能补候选引用；不对既有源码执行完整 Compile，不因其 Script Command Gate 关闭而拒绝 Decompile。候选自身仍执行完整表达、结构和固定引用检查，Gate 关闭允许准确反编译并警告。
9. **Q9 Compile 失败边界**：校验失败不发布新产物；发布阶段 I/O 失败允许本地 generated/manifest 失效，不承诺上一份成功产物仍可用，但 Diff/Push 必须拒绝任何不完整、不一致或不 fresh 的状态，重新 Compile 才恢复使用。本票不要求 generated 与 manifest 成为可回滚的完整事务。Compile 不改 Project Root 或 Snapshot；Compile Check 始终只读，执行与普通 Compile 相同的完整编译与输出结构检查。
10. **Q10 旧契约 Interrupted Push 收尾**：pending 格式可理解且元数据、备份、产物一致时，先按原记录恢复已经发生的写入。全部目标文件为 generated 时完成 Snapshot/Manifest 收尾并保留旧 Compile Contract Version；全部为 snapshot 时放弃 pending；混合、缺失、未知或元数据不一致时拒绝自动恢复。收尾不得将旧产物升级为当前契约；恢复后仍须通过普通 Freshness 检查，旧契约必须重编译才能开始新写入。无法理解的旧 pending 格式明确停止，不增加迁移兼容层，不猜测或删除记录。
11. **Q11 Project Root Binding**：Snapshot、Compile Baseline 与 pending 绑定规范化后的 Project Root 路径。无 pending 时，切换目标通过显式 Pull 重建 Snapshot 和绑定并使旧产物失效；有 pending 时先回到原绑定目标完成恢复。路径别名应按规范化后的目标处理，不新增工程 UUID 或跨工程同步机制。
12. **Q12 警告呈现**：Decompile、Compile、Compile Check 默认向 stderr 输出可读诊断，含稳定标识、阶段、严重级别、事件身份和路径；warning 不阻止成功，只有 error 导致失败。第一版不新增 `--warnings-as-errors` 或公开 JSON 诊断接口；不改变既定诊断语义。
13. **Q13 类型校验依赖的 Freshness**：实际参与源码校验的类型依赖纳入 Compile Baseline，其删除、替换或内容变化使旧产物失效；工具自身 DSL 类型与校验规则变更由 Compile Contract Version 覆盖。此项不增加普通 helper 模块的值导入能力，也不执行事件 JavaScript。

新增术语 Project Root Binding 及 Compile Baseline 关系已记录于 GLOSSARY.md。当前代码仍缺上述行为，文档决定不代表实现或测试已经通过。继续核对外部并发修改、输入捕获一致性与发布/恢复之间的交界；其余已确认模型不重复决策。

### 2026-10-18 — 已确认规则的实施约束与最后待决边界

Q1–Q13 已形成 [编译假设与目标绑定 ADR 草案](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 和 [反编译整目录发布 ADR 草案](../../../docs/adr/0014-publish-decompiled-source-as-a-complete-directory.md)，均保持 proposed，等待本票完整契约最终确认。

交叉核对后，下列是落实已确认规则必须满足的约束，不作为新的用户取舍：

- Discovery 的隔离应覆盖宽 glob、链接/junction 与路径别名；无法保证隔离或单次目录发布时，在发布前失败，不降级为逐文件复制。最终发布必须不覆盖并发出现的目标，不能仅依靠事前检查目录不存在。
- 候选类型与引用检查采用最终发布位置的解析语义，不能因隔离目录位置不同而读取另一套依赖。既有源码身份检查与完整 Compile 分开，不把原有源码所有类型、项目引用或 Gate 检查偷偷加入发布前提。
- Compile Check 在内存中完成同一候选输出与结构检查后停止，不创建候选输出文件或改写 generated、Snapshot、Sync Manifest/Freshness。警告与普通 Compile 使用同一正式规则。
- Compile/Decompile 与 Clone/Pull 的内容、哈希和集合必须来自本次实际捕获的同一组输入；不能先用旧内容校验/生成，再用重新读取的新内容哈希背书。类型依赖与 MapInfos 所决定的地图集合也服从这一约束。
- 不可安全确定地图集合或安全定位/替换 carrier 的结构错误应明确拒绝，不能靠静默过滤条目形成看似完整的 Snapshot。外部无关字段仍按已决未知数据规则保留，不扩大为全面数据库校验。
- Diff 和 Affected 文件判定按解析后的保存结构和值比较，忽略对象键顺序等已允许的 JSON 文本差异；数组位置、字段存在性、全部保存值仍有语义。实时漂移继续采用整文件内容哈希，不把 Diff 的语义相等用来放宽同步保护。

真正尚待选择的是外部并发编辑的 Push 检查时点、输入变化后失败还是自动重试，以及同一 Workspace 工作流命令的并发处理。只读核对不构成并发或故障注入测试通过。

### 2026-10-18 — grill-with-docs 第三轮：Q14–Q16 已确认

用户对本轮三项建议回复“确认”。Q1–Q16 已逐项接受；以下收束时序和并发边界，随后核对完整契约，尚未把票设为 resolved 或 ADR 设为 accepted。

14. **Q14 Push 的复核时序**：首次替换 Project Root 文件前检查完整 Standard Project Data Snapshot 集合；每次替换 Affected Project Data File 时，再核对被替换文件仍为预期旧内容；全部替换后、刷新 Snapshot/Manifest 前，再检查完整集合，此时已写文件须等于 generated，其余文件须等于原 Snapshot。写入前发现变化不开始写；已经开始写入后发现变化则报错并保留 Interrupted Push，不覆盖外部改动或自动回滚整个工程。后续按既定恢复规则处理，完成已有写入收尾不授权带着新的外部漂移继续写入。检查不能锁住外部编辑器，不承诺全工程原子隔离；运行同步时避免同时保存工程，不新增跨 Workspace 协作锁。
15. **Q15 输入变化即失败**：校验、生成和输入哈希使用同一份捕获输入；发布前复核相关文件集合、内容和配置，发现变化则明确失败并要求重跑，不自动重试、不局部重读继续、不为混合结果写成功或 fresh 标记。Clone/Pull 捕获、Decompile 发布和 Compile 发布均适用；Compile Check 也不能在已观察到变化后报告成功。发布阶段 I/O 失败仍按 Q9，未新增任何失败都保留上一份可用产物的承诺。最后一次复核后的外部变化不属于原子隔离保证，后续 Freshness/Drift 继续负责发现。
16. **Q16 Workspace 操作互斥**：同一 Workspace 的 Clone、Pull、Decompile、Compile、Compile Check、Diff 与 Push 共用操作互斥规则，后来的命令立即报告 Workspace 忙并要求稍后重试，不排队。只读命令不得读取另一命令正在替换的状态，互斥不得让 Compile Check 修改 generated、Snapshot、manifest 或 Freshness。仅可清理能够证明已失效的操作锁，锁失效不等于 Interrupted Push 已解决，清理锁不能清除 pending。不同 Workspace 可独立工作，不增加同一 Project Root 的跨 Workspace 锁。

### 2026-10-18 — 完整契约复核完成，等待最终共同理解确认

已将 Q1–Q16 整理为本票 Answer，设计分支已收束，无需新增设计问题。两份独立只读文档复核分别检查同步/基线/恢复和候选校验/源码发布/领域规则，未发现综合契约与逐项决定或既有 ADR 的确切冲突、遗漏、授权扩大或实现完成误述。

`git diff --check` 通过；本票、后续验收票、GLOSSARY 与 ADR 0013/0014 的 33 个本地 Markdown 文件链接目标均存在。已向 [完整性与实施顺序讨论](08-completion-evidence-and-sequencing.md) 追加逐项已确认的验收输入，但未解决其设计或宣称检查已执行。本轮仅修改设计文档，没有实施功能或运行产品、故障注入、真实编辑器/游戏测试。

等待用户对 Answer 和两份 ADR 的整体共同理解作最后确认后，再将本票设为 resolved、ADR 设为 accepted，并同步地图索引与既有 ADR 引用。当前 claimed/proposed 状态保持。

### 2026-10-18 — 最终共同理解确认与结案

用户对完整契约、两份 ADR 与设计结案回复“确认”。本票已设为 resolved，ADR 0013/0014 已 accepted；决策地图已加入本票结论索引并移除已解决的 Workspace 接入迷雾，ADR 0003/0006/0012 已补充后续决定引用，完整性与实施顺序票已收到最终确认输入。

本票完成真实 Workspace 数据供应、System 容量、候选校验与完整源码发布、页级 Diff/Reset、基线版本与类型依赖、目标绑定、全标准文件漂移检查、失败/恢复时序和操作互斥的设计。依据为既有研究、只读实现调查和用户逐项及整体确认；独立文档一致性复核、文档差异与本地链接检查均已完成。只修改设计文档，没有实现产品功能或执行产品、故障注入、真实编辑器与游戏验收。逐参数证据与后续实施/验收设计继续由对应票承接，本地图尚未完成。
