# 如何证明 MV 事件支持完整并划定实施顺序

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 03, 04, 05, 06, 07, 11, 12, 13
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置决策：[地图事件备注与完整事件页应采用什么 DSL 模型](03-map-event-page-model.md)、[敌群战斗事件的身份与数据所有权如何划定](04-troop-event-ownership.md)、[原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md)、[语义无损往返与未知数据处理的精确契约是什么](06-semantic-roundtrip-policy.md)、[扩展事件数据域后 Workspace 如何保持同步与写入安全](07-workspace-domain-integration.md)。

基于前面的已决模型与契约，与用户锁定完整支持的验收矩阵、实现切片和依赖顺序，消除编写实施规格前的最后设计问题。

矩阵必须区分事件类型/字段、合法参数形态、分支与嵌套、指令上下文、无损往返、引用校验、未知数据与 Workspace 写入安全。确定有意义的自动化原生 fixture 对比、代表性编辑器打开/保存检查和游戏运行场景，以及每项证据由谁、在什么环境中取得。不可将 helper 数量或“不走 raw”作为唯一完整性证明。

确定可发布的最小原生夹具及其来源、维护方式和首方参考资料缺席时的可重复验证方式；不将本地编辑器和游戏资产提交到仓库。最终产出应足以编写实施规格，但不在本票偷跑功能实现或把尚未执行的验收记为通过。

## Research inputs

[原生指令逐参数契约还缺哪些证据](11-native-command-parameter-evidence.md) 是已确认的实施规格完成门槛，纳入本票前置依赖。须依据参数证据表规划验收，不能把 105+45 类别库存等同于全参契约完成。

[MV 编辑器分支、移动路线与禁用字段的静态保存证据](../research/editor-serialization.md) 已提供“后续最小原生保存样本任务”，覆盖 402/403/505/code 0、禁用槽、none 公共事件、非 custom 路线与图像选择联动。静态生成规则已知不等于真实编辑器保存实验通过；本票需把该样本任务和游戏运行场景纳入验收矩阵。

[原生事件的创建初值与属性控件范围](../research/event-defaults-and-limits.md) 另列出控件绑定与信号顺序、异常已有值、页数边界、模板到最终保存以及快捷创建路径的最小实验。根据最终正式支持与未知数据契约决定哪些是完整支持的必验项；需要继续静态调查的具体问题另成研究票，不将本报告尚未验证的边界视为通过。

## Comments

### 2026-10-18 — 地图页模型的验收输入

[03 号票](03-map-event-page-model.md#answer) 已经用户最终确认并解决。将以下代表性案例纳入本票的验证规划；本次讨论没有执行这些产品、编辑器或游戏检查。

- 省略字段与显式固定默认生成相同保存状态；人物图像不隐式修改 priority；非默认状态在反编译时不会被省略。
- 禁用条件保留缺失 ID 与 ID 0；默认占位 ID 1 不要求目标；名称引用仍须唯一解析；启用条件恢复正常存在性校验。
- fixed/random/approach 页保留路线及 wait 值，但路线仍受完整引用与脚本门禁校验；页路线与 Set Movement Route 共用同一对象契约。
- 空图朝向影响原生行为，大人物图非零索引、图块模式中的人物保存字段、图案等保持；图块 tileset 缺失报错、空图组警告；检查真实 Workspace 上下文接入。
- note 的空白、换行、顺序和重复标签精确保持；空页命令列表可往返；0 页报错、20/21 页边界和事件 ID 大于 999 不新增硬拒绝。

将普通原生编辑器输出与主动支持的保存数值/非典型组合分别标注；静态 runtime 可承载不等于已验证编辑器打开保存。实际实验、执行环境、证据归属与实现切片仍由本票结合 04/05/06/07 的结果确定。

### 2026-10-18 — 战斗事件模型的验收输入

[04 号票](04-troop-event-ownership.md#answer) 已最终确认并解决，[ADR 0010](../../../docs/adr/0010-troop-event-ownership-and-reset.md) 已接受。将以下场景纳入本票规划，尚未执行这些产品、编辑器或游戏检查。

- 仅重建 pages，保持敌群 ID、name、members、成员站位和其他外部 carrier 数据；同 troopId 重复声明、所属敌群缺失、空名称/空成员条目分别覆盖，避免名称索引漏条目。
- 省略声明与显式默认空白生成相同结果；非空白到默认空白都要求 destructive 选项，原已空白不产生变化；禁用但非默认配置不能误判空白。局部删页不留 null，仍非空白的修改保持普通分类，敌群不被删除。
- 条件五槽与完整保存默认准确往返，禁用角色/开关可保留缺失 ID 与 0，名称仍需唯一解析；禁用成员位置允许超出成员数，启用时检查实际位置及全体成员 Enemy 引用。hidden 占位、成员重排、坏引用过滤导致索引前移都应有代表性证据。
- 战斗页最低页号优先、全条件关闭不运行、启用条件 AND、回合 0 与 A/B 周期、三个 span 及 Moment 页反复满足时的后续页调度；区分静态源码结论与真实游戏验证。
- pages=[] 拒绝、单默认页重存、20/21 页边界、实际存在的高 ID 敌群；超过普通编辑器上限的支持选择单独标注，不能声称真实编辑器已通过。
- 真实 Workspace 的 decompile/compile/diff/push/恢复链路，包括完整成员上下文、外部 carrier 漂移、Reset 的破坏性检查、全部状态刷新；结合 06 的未知数据契约验证空白判定和禁止静默丢失。

本票继续统筹最小原生夹具、执行环境、证据归属和实施切片；这些输入不是新增的已通过验收记录。

### 2026-10-18 — 原生指令契约与参数证据门槛

[原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md#answer) 的 Q1–Q24 及完整契约已最终确认，讨论票已解决，ADR 0011 已接受。Q24 已要求 [逐参数契约证据表](11-native-command-parameter-evidence.md) 作为实施规格完成的前置条件，本票已增加对应依赖。105+45类别库存与本轮静态补证均不等于全参或运行验收通过。

验收规划至少包含以下有区分力的案例，再结合完整参数表补齐其他命令族：

- Choices空文字/纯空白/显式尾部空项；1项配默认cancel choice1及2项配choice5的保留和警告；主文字与402镜像；一项重新打开是否引入初始No文字的静态疑点。
- Conditional缺省else与显式else:[]；空Loop；Battle四种flags组合、缺失必需分支及额外禁用分支的错误；空体code0和非空体处理；403实际落盘参数。
- Transfer/Set Event Location的retain，Transfer fade、Shop purchaseOnly和Battle flags的省略/显式默认等价；目标编辑器新建默认核实，不能把上游Qt推断写成真实目标实验。
- 空Shop与非空重复商品/自定义价格；连续ID范围含无名槽、反向错误、Random每目标独立采样和其他operand一次求值、actorFromVariable运行值0全队。
- None素材保持独立参数；空BGM/SE/Picture等不同语义；ShowText空脸的非零index往返；生成正式源码须能求值并重编译，不能仅检查输出包含helper名称。
- 文本空行、尾部空行、4/6/12边界、空Script门禁；超长原始组和换行差异按已完成的证据与往返决策核对，不自动裁剪或拆组。
- Change Equipment按执行时双持/装备槽状态解释同一ID、None卸下、候选缺失及库存不足；不把初始数据库候选当作成功保证。Force Action技能位置与当前敌人数独立。
- 所有嵌套列表与保存路线的引用/Gate递归，compile --check与compile一致；无名系统槽在最终容量内正常解析，容量外报错；真实Workspace加载Animations/Tilesets及上下文。
- 当前上下文不适用、缺失位置、循环外Break Loop与缺失/重复Label的准确警告及原生行为；区分跳过、残留对象作用、停滞，不能统一标成no-op。

代表样本区分“只保存事件容器”与“主动打开并确认参数对话框”，分别记录编辑器打开/保存和游戏执行的实际结果。本次只有设计与静态证据整理，没有运行上述产品、编辑器或游戏检查。

### 2026-10-18 — 语义往返与异常数据验收输入

[06 号票 Answer](06-semantic-roundtrip-policy.md#answer) 的 Q1–Q16 及完整契约已最终确认，06 已 resolved，ADR 0012 已 accepted。本票仍等待 07/11 及其必要决策，按下列输入继续规划验收，尚未执行检查：

- 支持原生 fixture 经实际 decompile → compile → push 后，比较解析后的保存结构和值；仅排除 JSON 文本表示差异，不能过滤未知字段、code 0、镜像、非激活配置、尾部空行或 CR 后再宣称相等。
- 真正未知事件代码的单条 raw 原样保留及警告；已知 code 异常参数/引用不自动 raw；手写已知 raw 也不能绕过类型、值域、引用、Gate 或完整输出结构检查。
- 事件/页/条件/图像/路线额外字段、命令第四字段、坏外壳、未知移动子指令、零页/缺字段/错误类型的明确失败；外部 carrier 未知 JSON 完整保留。普通拒绝与已有保存例外、警告场景分别覆盖。
- 102/402 与 205/505 双位置冲突，重复分支、孤立续行、缺闭合、非规范 Battle、异常 event code 0 与移动终止；验证正常结构准确重建且异常不被修复。
- raw 显式绝对 indent、反编译显式 0、省略继承父结构，以及搬移后结构失效；正式 helper/raw 混用的完整列表检查。
- 四类文本 LF 记录边界、CR 字面保留、`["a\r", "b"]` 对应 Script `code: "a\r\nb"` 的准确恢复；单条原生记录内 LF 与已有超长组拒绝，不裁剪/拆并。note、Plugin Command Line、单参数 Script Input 不误用行记录规则。
- Decompile 发布前的候选图固定引用检查；Gate 关闭时源码准确生成但 Compile/Check 失败；未知载荷不被误当作已验证语义。
- 数据检查失败、目标文件冲突及 I/O 发布失败均不留下可被正常发现并当作完整结果的部分新源码，原源码/Snapshot 保持；诊断分类、路径、冲突双方与避免级联误报。

11 仍需补齐原生结构与全参证据；正常原生反例须重开模型，不能因现规则拒绝就标成非法。真实编辑器只保存容器与重新确认参数的行为继续分开验证。

### 2026-10-18 — Workspace 集成的已最终确认验收输入

[扩展事件数据域后 Workspace 如何保持同步与写入安全](07-workspace-domain-integration.md#answer) 的 Q1–Q16 及完整契约已最终确认，该票已 resolved；[ADR 0013](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 与 [ADR 0014](../../../docs/adr/0014-publish-decompiled-source-as-a-complete-directory.md) 已 accepted。本节记录后续验收设计输入，不提前解决本票、不表示以下检查已执行；本票仍等待逐参数证据前置。

- 从真实 Workspace Snapshot 接通 Animations/Tilesets、地图 tileset 与事件位置、完整 troop members/Enemy 实际存在性、System 槽容量和装备槽配置；不能只靠手工注入的 compiler 单测。空名称对象的实际 ID、启用/禁用条件例外、普通 Runtime Selector 警告、保存路线与 raw 原生引用/Gate 检查分别覆盖。
- 变量/开关按 Snapshot 容量与命名声明最大 ID 保留或扩容；容量内无名显式引用、越界/ID0、引用不扩容、名称不回退 Snapshot、删除名称不缩容量，且候选校验/Compile/Check/物化一致。
- Troops 完整 carrier 保留外部未知 JSON；省略与显式空白产生同样 Reset，原已空白不变，局部删页仍非空白为普通修改。Diff 展示页位置、保存字段和命令变化及独立 Reset 原因；Troops 文件过滤保留全局破坏性状态。JSON 键序/排版相等与实时整文件哈希漂移分别验证。
- Decompile 整批隔离、一次目录发布；目标目录存在（含空目录）、并发出现目标、宽 glob、链接/junction 别名、隔离位置与最终位置依赖解析差异、部分输出不被发现、实际 include/exclude 漏选文件、已有身份冲突和无法可靠提取身份等失败场景。既有源码只查身份，候选不借它补引用，Gate 关闭仍可准确反编译。
- Decompile 在候选生成/校验/发布中途 I/O 失败不暴露部分新源码，原源码/Snapshot 保持；完成目录发布后进程未报成功的重试报告目标存在。只清理明确归属的隔离残片，不删除未知文件。
- Compile/Check 完整输出校验一致；Check 不发布文件或改状态；校验失败无发布。Compile 发布或 manifest 写入失败后 Diff/Push 拒绝不完整/不一致状态，重新 Compile 可恢复，不假定上一份输出总是可用。warnings 默认 stderr、含身份/路径且不把成功变失败。
- Freshness 覆盖实际源码/类型依赖、配置、Snapshot 集合、Compile Contract Version 与 Project Root Binding；旧/缺失契约版本及类型依赖变化失效。切换目标须 Pull 重绑；pending 不能作用到另一个目标。源码/类型依赖/配置/MapInfos/数据文件在捕获或发布期间变化时报错重跑，哈希与实际使用字节一致，不混合版本或自动局部重试。
- 全 Standard Snapshot 集合的外部改动、缺失、MapInfos 登记变化以及 no-op Push 均触发漂移保护；无关条目变化亦阻止 Push，插件文件与未登记孤立地图排除。检查集合扩大，实际写入/备份仍仅 Affected 文件。
- Push 写前全量、逐替换旧内容与写后全量复核；后置检查发现外部改动时保留 pending，不盲目覆盖/回滚。恢复覆盖全 generated、全 snapshot、mixed/missing/unknown、元数据不一致、目标不匹配与不理解的 pending 格式；旧契约收尾不洗成新 fresh，恢复后外部新漂移仍阻止新写。
- 同一 Workspace 的各工作流命令互斥，第二命令即时报忙，包括 Check/Diff；崩溃失效锁的清理不解除 pending。不同 Workspace/外部编辑器不受该锁控制，检查点不冒充全工程原子隔离。

实施切片、故障注入点、代表性编辑器/游戏实验与证据责任继续由本票确认；全参证据门槛仍由逐参数研究提供。

### 2026-10-19 — 全量逐参数研究交付与新增前置

[原生指令逐参数契约还缺哪些证据](11-native-command-parameter-evidence.md#answer)已完成事实调查，交付[105+45逐参数索引](../research/command-parameters/index.md)及各分片正负/边界样本；Qt基础整数与初值已有实际REA+Ghidra证据，仍没有真实编辑器或游戏验收。

本票继续等待[原生保存形态差异如何进入正式 DSL](12-native-saved-shape-model.md)与[原生控件范围与保存值的支持边界如何划定](13-native-value-domain-boundaries.md)。正式表示和值域未定前，不划定最终实施规格。两票决定后，将计时器Stop尾槽、移动parameters/indent/M0外壳、非空body尾0、脸图索引、缩图后坐标、单槽文本，以及EXP帮助与本体上限差异的真实核对，纳入验收矩阵。

所有真实样本须区分新建、仅保存容器、主动重确认参数和游戏运行；先保留完整解析结构再比较，不能过滤新发现差异后宣称无损。各命令所有模式/引用/Gate、None和保存配置的组合由参数表提供，合成拒绝样本不替代原生创建证据。
