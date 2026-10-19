# MV 1.6.1 原生事件完整支持实施规格

Status: ready-for-agent
Created: 2026-10-19
Source: [完整支持 MV 原生事件的决策地图](../complete-mv-events/map.md)
Baseline: cdec508afc07f0543fb0c6751d4aab924d4a3aa7

## 2026-10-19 用户验收修订：编辑器逆向，保留游戏实测

用户在实施会话中明确选择“编辑器 UI 改为逆向，保留最终游戏运行验证”。本节优先于正文中早先的编辑器 UI 创建、容器重存、参数重确认及 E1–E7 实际操作要求；其余产品契约、Windows / Node 22、安全检查、依赖关系和最终 R1–R7 游戏运行门槛保持有效。

- 03–10 的编辑器前置及 49–51 的最终编辑器验证改由 `reverse-engineer-anything` 工作流交付。按问题追踪目标 MV 1.6.1 编辑器中实际的初始化、加载、编辑、确认和序列化代码，必要时追入随包 Qt 控件；记录二进制身份、资源偏移/哈希、REA Evidence ID（实际存在时）、推导步骤、覆盖范围及未决问题。
- 普通创建、容器保存和参数重确认仍是不同代码路径，分别核对；静态分析得到的是这些路径的代码事实或有条件推导，不能记成真实 UI 捕获。可复用身份相同且覆盖问题的既有逆向证据，不要求重复分析或虚构新的 Evidence ID。
- 产品最终输出按独立的原生保存契约和逆向结论自动化比较。合成样本明确标记，不伪称编辑器创建。控件时序、异步图像加载或输入夹界仍无法确定时，准确记录局限；若影响必须实现的保存契约且无法界定，相关要求仍待解决。
- 52–54 及 R1–R7 必须在实际 MV 1.6.1 游戏 runtime / NW.js 中运行并留存结果；静态逆向、mock 或 Node 中仿写引擎均不能替代。需人工观察的声音和图像仍按游戏要求执行。
- 55 的完整支持声明要求适用自动化、E1–E7 的逆向/产品比较证据与 R1–R7 的实际游戏证据全部齐备。此修订本身不关闭任何实施票。


## Problem Statement

开发者需要用 TypeScript Event DSL 接管、编辑和同步现有 RPG Maker MV 1.6.1 工程的原生事件。当前实现已经有 Map/Common Event、命令族编反编译、引用验证及 Workspace 工作流，但类别覆盖不足以保证完整支持：地图备注和完整页配置、Troop Event、非激活保存配置、部分参数与记录外壳仍不能完整表达，部分反编译失败会转成 raw，已有同步检查也没有覆盖新的输入依赖和发布边界。

这些缺口会使用户无法判断一份看似成功的 Decompiled Source 是否真正保留了原始事件，或使写入前的校验依据与实际工程不一致。仅比较游戏运行效果、helper 数量或 compiler/decompiler 互相往返，不能证明工程数据安全。

本规格将已完成的十三张决策票、已接受 ADR 和逐参数证据汇总为实施约束。目标是完整支持约定范围，并取得相应证据；设计地图完成、规格发布和既有测试通过都不构成产品已经完成的证明。

## Solution

本阶段仅支持 Windows，运行与自动化验收基线为 Node 22。支持 MV 1.6.1 的 Map Event、Common Event、Troop Event、全部原生页配置、地图事件 note、105 类顶层事件指令和 45 类移动指令。所有支持范围内的原生形态均通过正式 Schema-First DSL 表达，编写、反编译、校验、物化、Diff、Push 和恢复形成完整路径。

从同一 Project Data Snapshot 反编译，在源码未修改且配置、引用与同步前提满足时，重新编译和 Push 后保留解析后的保存结构和值。编写者能显式表达未启用设置、缺失或存在的保存槽、各层结束标记、完整字符串及镜像；不能借固定默认修补原生输入。

Workspace 继续按 Data Domain 完整接管，外部 carrier 从 Snapshot 保留；Project Root 仅由安全检查通过后的 Push 修改。已知异常明确失败，真正未知事件代码按有限 raw 契约保留并警告。旧 0.x API 和 Workspace 格式允许直接破坏，不提供兼容层或迁移说明。

实现以已决 S0–S7 路线推进；相关原生前置实验先于依赖它们的实现。最终只有逐项自动化、真实编辑器和游戏证据齐备，才可宣称完整支持。

## User Stories

1. 作为事件编写者，我希望用具名字段和正式命令 helper 表达全部原生事件功能，以便得到可检查、可维护的 TypeScript 声明。
2. 作为既有工程维护者，我希望反编译后不改源码就能恢复原始保存结构和值，以便放心接管工程。
3. 作为地图事件编写者，我希望完整表达 note、条件、图像、自主移动、显示优先级、行为选项和触发器，以便控制全部原生页设置。
4. 作为地图事件编写者，我希望禁用条件和非 custom 移动路线的保存配置仍然存在，以便以后重新启用时不丢设置。
5. 作为公共事件编写者，我希望保留三种 trigger、独立保存开关和调用上下文，以便在地图与战斗中复用事件。
6. 作为战斗事件编写者，我希望按既有 troopId 编写完整有序战斗页，以便使用原生条件和 span 而不接管敌群成员。
7. 作为工程维护者，我希望省略或清空 Troop Event 时明确看见 Reset 及破坏性原因，以便审核可能丢失的事件内容。
8. 作为命令编写者，我希望每种参数模式、枚举、None 和独立保存字段都有正式表达，以便不依赖 raw 补缺。
9. 作为流程编写者，我希望 Choices、Conditional、Loop 和 Battle 能区分缺失分支、空分支和子体尾标记，以便精确保留嵌套结构。
10. 作为移动路线编写者，我希望页路线与 Set Movement Route 共用模型，并保留原生记录外壳和终止项差异，以便在两种入口保持一致。
11. 作为计时器编写者，我希望 Stop 能区分缺秒数槽、显式零和非零保存值，以便不丢编辑历史留下的状态。
12. 作为文本编写者，我希望空白、CR、LF 和尾部空行按对应原生记录规则保留，以便对白、注释和脚本不被悄悄改写。
13. 作为插件使用者，我希望 Plugin Command Line 完整保存，以便插件收到原本的文字和空白。
14. 作为脚本编写者，我希望所有原生脚本入口遵循同一 Script Command Gate，以便正式命令、raw 和嵌套路线保持一致。
15. 作为工程维护者，我希望缺失项目引用与不确定的运行目标使用不同诊断，以便修复确定错误而保留合法运行选择。
16. 作为变量与开关使用者，我希望容量内的无名槽仍可按显式 ID 引用，以便接管未命名的既有工程数据。
17. 作为装备事件编写者，我希望装备 ID 按执行时的槽类型解释，以便保留双持和动态装备配置的原生行为。
18. 作为工程维护者，我希望素材或地图变化后留下的合法保存索引和坐标得到准确警告并原样保留，以便自行决定是否调整。
19. 作为工程维护者，我希望未知代码被明确标为未解释，而已知异常不被伪装成受支持 raw，以便知道接管的实际保证。
20. 作为工程维护者，我希望镜像矛盾、缺闭合和非法结构指出双方或相关位置，以便定位数据问题。
21. 作为 Workspace 使用者，我希望 Check 与正常 Compile 验证同一完整输出，同时不发布产物，以便可靠预检。
22. 作为 Workspace 使用者，我希望失败的 Decompile 不暴露部分新源码，以便源码发现不会误判成完整接管并移除其他事件。
23. 作为 Workspace 使用者，我希望 Diff 展示页位置、保存字段、命令和 Reset，并在过滤后仍保留全局破坏性提示，以便审核写入。
24. 作为 Workspace 使用者，我希望源码、类型依赖、配置、Snapshot 或编译契约变化使旧输出失效，以便避免使用过期校验结果。
25. 作为 Workspace 使用者，我希望更换 Project Root 时显式重新绑定，以便旧产物或 pending 不写到另一个工程。
26. 作为工程维护者，我希望即使 no-op Push 也检查全部标准输入漂移，以便发现未写文件中的外部更改。
27. 作为 Workspace 使用者，我希望并发命令立即报告忙碌，以便避免读取或发布混合状态。
28. 作为工程维护者，我希望中断写入依据真实文件内容恢复，并保留无法自动恢复的证据，以便不覆盖外部改动。
29. 作为贡献者，我希望普通自动化在没有本地 RPG Maker 安装时也能运行，以便跨环境复现契约验证。
30. 作为验收者，我希望每项要求关联独立预期、夹具、环境和实际结果，以便审计完整支持声明。
31. 作为验收者，我希望分别记录原生新建、容器重存、参数重确认和游戏运行，以便区分保存能力、编辑器行为和执行效果。
32. 作为维护者，我希望命令族按完整纵向能力实施并维护证据，以便新增或修改参数时明确受影响的验证范围。

## Implementation Decisions

### I1 — 权威输入、边界与模块责任

本规格实施已确认的决定，不重新选择领域模型。正式 Answer 与已接受 ADR 决定产品规则；逐参数报告提供每个原生槽、模式、枚举、范围、来源和样本。历史评论中的旧方案、研究时的候选接口、现实现与旧测试不能覆盖最终决定。保存形态和保存值边界的后续增量优先于早期接口描述；出现真实原生反例时按既定流程重开对应契约，不能通过更新测试快照自行批准。

沿用 Node 22、TypeScript strict、ESM/NodeNext、pnpm、现有 CLI、构建、校验与测试工具链。保持 ADR 0008 的命令族纵向边界：领域模型拥有声明、引用和联合类型；命令族拥有编写 helper 及专门编码/解码；编译与反编译协调完整分发；validation 拥有完整遍历、引用和结构校验；Workspace 拥有工作流与状态；Project Data IO 拥有读取、写入、物化和 Structured Diff。不得恢复旧过渡 facade 或引入领域模块反向依赖。

公开 DSL 入口只发布编写表面与领域类型，程序化 Workspace API 与 CLI 分开。每个命令族的交付同时覆盖正式表达、编译、反编译、验证与独立往返，不按“先全部 helper、再全部 decompiler”的横向批次宣布完成。内部检查点和数据组织由实现者在这些边界内决定，不增加公开测试 API。

### I2 — 完整保存与默认

Event Semantic Round Trip 比较字段存在性、数组长度/位置/次序、页序、实际值、null/空数组、非激活配置、字符串字符、续行与镜像。仅允许 JSON 排版、对象键序和等价转义变化；运行行为相同不足以放行差异。

声明以具名字段和互斥模式表达，所选模式的参数完整必填。目标、项目引用、核心操作与必需子列表显式给出；只有已确认的字段可省略并使用固定 Compiler Default。完整输出不能继承旧事件、编辑器记忆或相邻命令。反编译只在精确恢复原始状态时省略默认。未获批准的便利默认保持显式，不能直接采用旧实现或控件当前值。

新增保存形态可选字段的显式 undefined 等同省略；必填字段、数组元素及稀疏洞不得用 undefined 制造缺槽。null 仅在其具体契约允许时有效。凡要求严格 JSON 的输入，不得依靠序列化静默丢值或改值。

### I3 — 事件容器、身份与所有权

Map Event 保持 mapId 与 event id 的组合身份，保留名称、初始位置、原顺序非空 pages；note 为原样字符串，默认空串。初始位置仍要求在地图范围内，占位冲突为 warning，不与命令运行坐标混淆。页数超过 20 警告并保留，0 页错误；不增加事件 ID 999 的硬上限。

地图页必须完整表达 conditions、image、movement、priority、options、trigger 和必填 commands。固定空白页规则如下；原生字段编码、全部条件槽细则以地图页正式 Answer 为规范附表。

| 分组 | 必须表达的保存状态 | 固定空白页默认及限制 |
| --- | --- | --- |
| 条件 | switch1、switch2、item、actor、variable、selfSwitch，启用状态与保存配置独立 | 全关闭；项目引用占位 ID 1，变量阈值 0，自开关 A；已提供槽必须给齐字段；变量阈值整数 −99,999,999..99,999,999 |
| 图像 | character、characterIndex、tileId、direction、pattern 独立 | None、0、0、down、0；人物 index 0..7，tileId 0..1023，pattern 0..2 |
| 移动 | type、speed、frequency、共享 Movement Route | fixed、3、3、空路线；speed 1..6、frequency 1..5；路线默认见 I5 |
| 行为 | priority、walkAnimation、stepAnimation、directionFix、through、trigger | below、true、false、false、false、action；五种原生 trigger 均正式支持 |
| 指令 | 完整 commands | 必填，可空；外层列表有固定最终事件终止记录 |

切换图像不自动修改 priority，图块显示不清理人物字段，非 custom 移动不删除路线；空图和大人物图的独立 index、方向、pattern 保留。活动图块使用真实地图 tileset 上下文：缺 tileset 报错，所需 B/C/D/E 图组名称为空警告，不扫描素材文件或尺寸。

Common Event 保留显式 id、name、none/autorun/parallel、独立保存开关与完整命令列表。none 状态也必须准确表达和恢复原生 switchId，不能按不参与执行而删除或固定覆盖；autorun/parallel 继续要求有效开关。沿用既有编写与引用契约补齐保存能力，不因 none 自动扩展已决禁用页条件的缺失 ID 例外。公共事件不强制声明地图/战斗上下文，不引入完整调用图或运行状态预测。

Troop Event 以既有 troopId 为唯一身份，pages 必填且非空；实际存在但空名称/空成员的 troop 不被过滤。DSL 整体拥有战斗事件 pages，troop 的 ID、name、members、站位和其他非事件 carrier 均从 Snapshot 原样保留，不创建或删除 troop。Battle Event Page 无独立 ID，保留原序，局部删页不留 null；超过 20 页警告。地图取最高合格页，战斗取最低合格页，二者不能共用错误的排序语义。

战斗页完整表达 turnEnd、turn、enemy、actor、switch 条件、span 和 commands。默认条件全关，turn A/B 为 0/0、enemy 位置 0、enemy/actor HP 阈值 50、actor/switch 保存 ID 1，span 为 battle。A/B 整数 0..9999，HP 整数 0..100，禁用状态仍检查值域。启用条件按 AND；全关合法且不运行。保留 battle/turn/moment 的原生调度与回合判定，不改成任意时刻回调。

省略实际 troop 的事件声明与显式 Blank Troop Event 均生成恰一张固定默认空白页；非空白到该精确状态为 Troop Event Reset，属于 Destructive Change。已有空白无变化；局部删页后仍非空白为普通修改。空白比较包含全部保存字段和列表，不能按可达性或挑选字段判定。反编译为每个实际 troop 输出声明，包括空白事件。

Map/Common Entry Removal 保留 ID 数组 null 孔，System 名称移除写空字符串且不压缩容量；这些规则不推广为删除 troop 或给其 pages 留孔。

### I4 — 参数覆盖与结构化命令

105 类事件和 45 类移动指令的逐参数报告作为本规格的规范附表：实施必须逐项覆盖所有模式、子型、枚举、参数数量、None、边界、独立配置、引用和结构归属，不能仅覆盖每个 code 的一个代表例。四类参数分片、共享证据及后续已决修订一并适用；未批准的候选拼写可在既定命名和模式原则内机械确定，不能借此改变语义或增加默认。

Choices 支持 1–6 项，保留空文字和尾部空项；每项文字与必需子体同属一个对象，顺序确定位置。defaultChoice 为 none/choice，cancel 为 disabled/choice/branch；choice index 整数 0..5，超过实际项数仍保留并警告。固定默认为 choice 0、取消 choice 1、right、window，不因一项列表改写取消值。102 与 402 从同一文字生成。

Conditional 的 then/else、Loop 的 body、Battle 的 win/escape/lose 使用 Child Command Body；Choices 每项及取消分支平铺其 commands/endMarker。Conditional 缺 else 和显式空 else 不同。Battle 的 canEscape/canLose 默认均 false：全 false 禁止结果分支；仅 canEscape 要求 win/escape；仅 canLose 要求 win/lose；两者 true 要求三体。必需分支可空但不能缺失，禁用分支不能出现。

所有续行、结果分支、闭合和镜像记录归父命令，不新增独立正式 helper。Transfer direction 默认 retain、fade 默认 black；Set Event Location direction 默认 retain；其他仅支持四向的字段不扩展 retain。

Shop 的 purchaseOnly 默认 false；goods 必填可空，保留顺序和重复，引用类别与商品种类匹配，省略 price 表示标准价格。空 goods 使用已确认的原生空商店占位，ID 0 在此是结构占位，不是通用项目引用例外。

Control Switches/Variables 使用包含两端的连续引用范围，解析后允许中间无名槽，反向报错而不排序。Control Variables 完整表达 constant/variable/random/gameData/script；字面常量与随机端点为整数 ±99,999,999，随机下界不得大于上界。Random 每个目标独立采样，其余操作数在目标循环前求值一次；不将字面量界限施加给运行结果。

Change Equipment 的 actor 是固定引用，slotIndex 为零起始并依最终 System 装备槽数量校验；非空 equipment 是按运行槽类型解释的正整数 Runtime Selector，None 为卸下。不得凭初始 Actor/Class 冻结成 weapon/armor 引用或换表寻找替代；候选缺失警告且可能卸下，不保证库存或可装备性。Force Action 技能目标支持 lastTarget/random/位置 0..7，不按当前敌人数裁剪。各指令只接受其原生 selector 子集。

独立保存字段即使当前不用也保留，包含 gain 模式的 includeEquipment、移除成员的 initialize、全敌动画的单敌 index、隐藏的窗口 tone 灰度及 None 音频的数值。Picture scale 支持已证负数范围；其他范围严格使用对应参数附表，不从例子推广。

### I5 — 有限 Native Saved Shape

Control Timer 的 action 必填；Start 必须有 seconds，Stop 可省略或显式给出，存在值均为整数 0..5999。省略 Stop seconds 表示原生槽不存在，显式 0 必须保留；原生 Start 恰两槽，Stop 恰一或两槽，多槽、null 和错误值明确失败。

共享 Movement Route 具有必填 commands、可选 repeat/skippable/wait/terminator；flags 固定默认 true/false/false。页自主路线与 Set Movement Route 使用同一默认，后者的 target 位于路线外。非 custom 页仍保存并校验整条路线。

| 移动记录类别 | 允许原生形态 | 正式保存信息与默认 |
| --- | --- | --- |
| 无参 M1–13、M16–26、M31–40 | code，缺 parameters；indent 缺失或 null | 指令 savedShape.indent 选 absent/null，默认 absent |
| 有参 M14、M15、M27–30、M41–45 | code，完整语义 parameters；indent 缺失或 null | 同上，参数由正式字段完整生成 |
| 路线唯一末项 M0 | 缺 parameters 或 parameters 为空数组；缺 indent | 路线 terminator.parameters 选 absent/empty，默认 empty |

M0 不进入用户移动 commands，不生成 505。无参非终止项的 parameters 空数组、M0 的 indent:null、数字移动 indent 及任意额外键未获支持；不得将不同类别的选项自由组合。indent 的 null 状态直接编码为 JSON null，不依赖 NaN 序列化。205/505 必须镜像每个非终止子项的完整对象、顺序和键存在性，已有矛盾不选边修复。

每个 Child Command Body 有必填 commands 与可选 endMarker，后者默认 present。空体必须恰有一个本层尾标记，不允许 absent；非空体支持 present/absent。非空无尾标记是明确批准的有限保存能力，不冒称普通 UI 创建已经证明。父闭合、内层标记和完整事件列表的最终终止不能代替本层边界。

endMarker 描述合成后本体的最终状态。正式命令与 raw 合并后必须校验标记归属、数量、缩进和声明一致性；不能把纯结构记录当普通内容绕过空体规则，也不能误拒合法 raw 嵌套的内层标记。本规格不新增全局 raw code 0 禁令。外层事件列表保留固定最终终止，不新增可省略开关。

### I6 — 文本、素材与 Native Saved Value

| 文本类别 | 完整契约 |
| --- | --- |
| Show Text / Scrolling Text / Comment | 每个 lines 元素对应一条物理记录，不含 LF，CR 字面保留；条数分别 1–4、至少 1 无已设上限、1–6 |
| E355 Script | Script Input 的 code 只按 LF 拆成原生记录，1–12 条；空串计一条，反编译仅在记录间插 LF |
| 四类行记录共同规则 | 保留空白和尾空记录，不拆并组；原生单条内 LF 或超出已定条数明确拒绝，不能回退 raw 或规范化 |
| Label、Jump to Label、Name、Nickname、Profile、E111/E122/M45 单槽 Script Input | 完整保存空串、空白、CR/LF/CRLF 和尾字符；无额外产品长度/行数限制，不拆记录 |
| Plugin Command Line、note | 沿用完整原样字符串规则；Plugin Registry 仅作可选 lint，不改写或要求理解插件私有语义 |

单槽重确认风险 warning 仅用于已列字段：单行槽含 LF；Profile 原串含至少两个 LF；上述任一槽含 CR。按原串计数，包含尾分隔符，不先改写 CRLF；多原因可合并。warning 不修改文本，不把成功变失败，不扩展到未列字段，不断言仅保存容器就会改写。Label 精确匹配当前原生命令列表，重复命中首个；缺失/重复 Label 和循环外 Break Loop 警告保留。

已证支持 None 的素材参数使用显式 null，并按字段编码为空原生素材值；Asset Reference 自身仍要求正确类别和非空名字。index、volume、pitch、pan 等独立保存，不统一改为 stop/erase。素材校验限于结构与类别，不扫描文件、尺寸或建立资产漂移依赖。

E101/E322 faceIndex 与 E201/E202/E203/E285 direct x/y 使用整数 0..2,147,483,647，拒绝负数、小数、非有限值、超上界及负零。范围不推广到人物 index、图片坐标、相对移动、selector 或运行变量值；在可能丢失负零符号的重写前检查。

非 None 脸图 index 至少 8 时警告超官方两行布局且尺寸未校验，不断言一定越界；None 保留独立 index，不报缺图/图片越界。E201/E202 的固定 Map Reference 必须存在，超 Snapshot 宽高警告保留；Map Event 中 E203/E285 仅相对于所属地图给条件性越界警告。未知运行地图不猜，也不单因未知报警；变量模式只校验引用。

Get Location Info 的后果按查询种类说明：terrain/region 有边界检查，eventId 是精确位置匹配及未命中，tileId 的直接索引可能别名到其他位置；不得统称越界返回 0。Change EXP 字面常量为整数 1..9,999,999，运行变量值不受该常量上限约束；帮助文档差异由真实原生实验核对。

### I7 — 引用、上下文、Gate 与诊断

真实 Workspace 必须提供 Animations、Tilesets、地图尺寸/事件位置/tileset 配置、完整有序 troop members 与 Enemy 存在性、System 装备槽与变量/开关容量及全部命令所需外部数据。实际 ID 存在性、名称索引和有序位置分开，空名称条目不能丢失。

System 变量/开关最终容量分别取 Snapshot 容量与 DSL 命名声明最大 ID 的较大者；删名称不缩容，引用不扩容。容量内无名正 ID 可引用，名称只解析唯一 DSL 声明，不回退 Snapshot；固定外部引用按其真实范围解析。

仅已决禁用 Map/Battle 页条件的显式非负保存 ID 可在目标不存在时保留，含 0；默认禁用占位不要求目标，名称仍须唯一解析。禁用状态仍检查形状和值域，这个例外不传播到路线、普通指令或其他引用。启用战斗 enemy 条件要求位置存在并验证整个所属 troop 的成员 Enemy 引用；hidden 占位置，不能模拟过滤后重新绑定。禁用 enemy 条件可保留当前人数外的非负位置。

结构、必填、互斥、类型/枚举/值域错误和固定引用失败均 error。合法 Runtime Selector 当前位置缺失或容器不适用则按原生后果 warning，区分无作用、残留对象作用与停滞；不保证未来目标命中，不要求 Common Event 上下文声明。

所有可识别原生脚本输入均递归受 Gate 约束，包括正式/raw、续行、嵌套体、镜像、非 custom 保存路线、空脚本与不可达分支。Decompile 可在 Gate 关闭时准确生成并提示，Compile/Check 必须拒绝；不能自动启用或改成 raw 绕过。Gate 不承诺隔离插件私有代码或未知载荷，也不新增事件脚本预执行、语法解析或运行保证。

诊断提供稳定标识、阶段、严重级别、事件身份、精确原生/DSL 路径、预期/实际；镜像冲突给双方位置，字符串差异明确转义，缺键/null/空数组可区分。源码行列只在可靠时提供，独立问题可汇总，坏结构区域不继续猜测制造级联误报。默认 stderr 显示；warning 不改变成功，error 阻止成功。不新增公开 JSON 诊断接口或 warnings-as-errors。

### I8 — 未知与异常数据

真正未知事件 code 在外壳合法、参数为严格可表示 JSON 数组且周围列表可保留时，用单记录 Raw DSL Command 保存并警告其语义未解释。code/indent 为非负安全整数；手写省略 indent 继承 DSL 父深度，显式 indent 为绝对值；反编译始终输出原始 indent，包括 0。

已知 code 的异常参数、缺失正式实现、未知模式、镜像矛盾、孤立续行、错缩进、错误闭合或不支持形态明确失败，不自动 raw。已拥有事件、页、条件、图像、路线及命令外壳的未知字段拒绝；有限 Native Saved Shape 是已定义字段，不能变成通用 extraFields。未知移动指令拒绝，raw 205 也不能绕过路线检查。

手写已知 raw 与正式表达共用原生参数、引用、Gate 和完整输出结构检查，不保留旧豁免。非 DSL-owned carrier 的未知有效 JSON 完整保留，只检查安全定位/替换和所需引用。区分契约违反与当前不支持；正常原生反例必须修订正式契约，不能永久归类为非法。

### I9 — Compile 与 Decompile 发布

声明收集、Staged Data Graph、编反编译、验证、物化、Diff、Push 与恢复都接入完整三类事件。Compile 与 Check 对同一完整输出进行结构/引用/Gate 校验；Check 在内存完成后停止，不发布、修改业务状态或建立 Freshness。

Compile 校验失败不发布新产物；发布 I/O 失败可以使 generated/manifest 不可用，不保证上一份输出仍可用，但 Diff/Push 必须拒绝不完整、不一致或不 fresh 的状态，重新成功 Compile 才恢复。Compile 不修改 Snapshot 或 Project Root。

Decompile 对完整候选及外部 Snapshot 验证可表达性、保存结构和能确定的固定引用，不借现有手写定义补目标。候选在 Discovery 无条件排除的区域准备，以最终发布位置解析依赖；宽 glob、路径别名和 junction 不能使残片提前可见。

发布前验证实际 Discovery 会发现全部候选，候选 Entry Identity 与现有被发现声明不冲突；已有源码仅作可靠身份提取，无法确定身份则失败，不引入其全部类型/引用/Gate 校验。整个固定反编译目标目录必须不存在，空目录也拒绝；一次完整目录发布必须拒绝并发出现的目标。无法保证隔离和完整发布时提前失败，不降级逐文件复制。

任一事件失败使整个 Decompile 失败，保留原源码与 Snapshot；隔离残片不可发现，只清理明确归属的工具临时内容。完整目录已发布但进程未报成功时，重试报告目标存在，不自动删除、合并、编号重试或改配置。

### I10 — 物化、Diff 与 Destructive Change

Compile Output 是全部 DSL-Owned Project Data 的完整状态。物化只替换各拥有域；Troops 只替换 pages，外部 carrier 不重建，失去所属 troop 的声明报错。支持相应 MV-Style JSON Writer 输出。

Diff 与 Affected 判定按解析后保存结构和值比较，文本排版、键序、等价转义不制造变化。按 Data Domain、Entry Identity、原生页位置展示页数、字段和命令变化；内部数组路径零起始，人类页号一起始，不引入页稳定身份或智能移动匹配。

Troop Event Reset 显示独立标识和破坏性原因；文件过滤支持 Troops，并保留全局破坏性状态，不缩小 Push 检查范围。既有 Entry Removal 与 Reset 均需显式允许破坏性写入，不能绕过 Freshness、Drift 或 Interrupted Push。不承诺稳定公开 JSON Diff API。

### I11 — 一致输入、Freshness 与目标绑定

Compile Baseline 包含实际 DSL 输入、类型验证依赖、相关 Workspace Config、Snapshot 集合/内容、规范化 Project Root Binding 和 Compile Contract Version。工具类型、验证规则、输出语义或默认变化更新契约版本；外部类型依赖修改/删除/替换使旧输出失效。缺失/不匹配版本禁止 Diff/Push，不增加普通 helper 值导入或事件脚本执行能力。

Snapshot、编译基线和 pending 绑定同一规范化目标。无 pending 时改目标须显式 Pull 建立新绑定并使旧产物失效；有 pending 时先回原目标恢复。不新增工程 UUID 或旧格式迁移。

验证、生成和哈希使用同一份实际捕获输入，包含 MapInfos 决定的文件集合。Clone/Pull、Decompile、Compile/Check 在发布前发现集合、内容或配置变化即失败并要求重跑，不自动部分重读或重试。无法安全确定集合或定位 carrier 明确拒绝，不能过滤成伪完整输入。

### I12 — Push、恢复与操作互斥

Drift 检查覆盖完整 Standard Project Data Snapshot：固定标准数据库与 Snapshot MapInfos 登记地图；插件文件和未登记孤立地图排除。无实际写入也检查，未引用条目变化同样阻止 Push。实时检查使用整文件哈希，不能借 Diff 的语义相等放行编辑器重写。

实际写入和备份仍只限 Affected 文件。首次替换前检查全集合，逐文件替换时检查预期旧内容，写后刷新同步元数据前再查全集合：已写文件等于 generated，其余等于原 Snapshot。写前漂移不写；写后发现变化或替换/收尾失败保留 Interrupted Push，不覆盖外部改动、不自动全工程回滚。检查点不提供外部编辑器锁或多文件原子隔离。

只有 Push 处理 pending：原目标和元数据可理解且一致时，全 generated 完成已有写入收尾，全 snapshot 放弃 pending 并继续普通流程；混合、缺失、未知内容、错目标、损坏/矛盾证据或未知格式拒绝自动恢复。可理解旧契约的收尾保留原源码/依赖/配置/版本依据，不把旧输出洗成当前 fresh；收尾后普通 Freshness 和全量 Drift 仍能阻止新写。

同 Workspace 的 Clone/Pull/Decompile/Compile/Check/Diff/Push 共用互斥，竞争立即报忙，不排队；只读命令也不读取另一个命令的中间状态。只清理可证明失效的锁，锁清理不清 pending；非 Push 不解决 pending。不同 Workspace 可独立操作，不增加跨机器或跨 Workspace 协调锁。

### I13 — 实施顺序与交付边界

以下是已批准的阶段依赖，不是本轮新建的实施任务票。后续按完整纵向行为细分到可独立验证的任务，并分配 Testing Decisions 中的义务。

| 阶段 | 交付范围 | 完成依赖 |
| --- | --- | --- |
| S0 证据与测试基础 | 验收索引、最小独立夹具、临时工程复建、Windows CI、完整比较与生成源码实际求值 | 本规格与已决契约 |
| S1 原生疑点核对 | 前置实验的真实捕获、结果或契约反例 | S0 的来源/采集约定；按问题逐项解除前置 |
| S2 共用保存与验证基础 | 子体/尾标记、移动外壳、正式/raw 完整结构与共享诊断，以最小命令族贯通 | S0、相关 S1 |
| S3 Snapshot 与引用上下文 | 完整外部数据、地图/troop/System 上下文的真实装配 | S0，与 S2 对齐接口 |
| S4a 一致输入与互斥 | 捕获、类型依赖/哈希、契约版本/目标绑定、锁及崩溃锁 | S3 |
| S4b Compile/Decompile 发布 | Check 一致、生成发布失败边界、完整候选隔离与一次发布 | S2、S3、S4a |
| S4c Push/恢复安全 | 全输入/no-op 漂移、三处检查、pending 和绑定，用小工程先闭环 | S4a、S4b |
| S5 事件容器纵向切片 | Map、Common、Troop 各自编反编译/校验/物化/Diff/Push，含 carrier/Reset | S2、S3、S4 安全闭环及相关 E/R |
| S6 命令族纵向切片 | 每族正式表达、编码/解码、全参验证、独立往返、引用/Gate、正式/raw 一致 | S2、S3、S4 安全闭环、相关 S1 与真实容器上下文及 E/R |
| S7 全矩阵与最终回归 | 三类事件与混合嵌套、跨域引用、真实 Workspace、安全与全部原生代表组，审计声明 | S1–S6 全部必要成果 |

完成依赖不禁止独立准备；依赖具体原生行为的实现仍受对应 S1 硬前置约束。原生反例只阻塞相关工作，更新契约和受影响验证后继续。切片可在自身自动化及分配的必要原生检查通过后合入，但总体未完成项仍待验/阻塞。

## Testing Decisions

### T1 — 已确认的测试边界与现有基础

测试边界沿用已由用户最终确认的“如何证明 MV 事件支持完整并划定实施顺序”，本规格不增加新的公开测试接口，也不重新访谈已经确认的验收选择。

主要入口是现有 Workspace 用例及其公开程序化 API/CLI，在独立临时目录走实际 Discovery、Decompiled Source 求值、Compile/Check、Diff、Push 和恢复。断言用户可观察的原生数据、诊断、源码发现集合、Snapshot、manifest 与实时项目状态，不断言内部调用顺序或私有实现形状。

| 边界 | 现有可复用先例 | 本阶段扩展 |
| --- | --- | --- |
| 真实 Workspace 用例 | 临时工程、配置、标准文件、Clone/Pull、编译产物、Diff/Push、预造 pending 的恢复测试 | 完整三类事件接管、真实引用装配、生成源码实际求值、完整发布与全输入安全 |
| 命令编译/反编译和 Staged Data Graph | 原生命令数组断言、父属续行解析、条件/引用/Gate 与各族覆盖测试 | 独立预期的全模式/边界、有限保存形态、正式/raw 组合与精确诊断；不以字符串包含 helper 作为往返证明 |
| Source Discovery 与加载 | 临时 TypeScript 声明、具名导出和受限输入检查 | 完整候选最终位置解析、身份冲突、类型依赖与发现完整性 |
| CLI 进程入口 | 实际子进程执行及符号链接入口测试 | stderr/退出行为、争用即时报忙、受控中断与跨进程文件状态；平台必验不静默跳过 |
| Project Data IO / Structured Diff / 架构 | 物化、语义差异、稳定写出及无环/命令族边界断言 | Troops carrier/Reset、页路径、文本相等与实时字节漂移的区别，维持依赖边界 |

已核对的旧断言包含“已知异常自动 raw”“raw 不检查引用”“只检查受影响文件 Drift”；它们须由新契约的正负行为测试替换，不能作为兼容要求。当前页编译使用固定属性、声明联合尚无 Troop Event、Snapshot 引用收集可能滤掉空名、Check 在物化前返回，都是本阶段要补齐的实际接入点，不是已完成能力。CI 已随本次平台范围调整切换为 Windows / Node 22；完整 Windows 自动化基线及文件系统必验仍由 02 号任务落实，配置切换不代表验收通过。

优先复用上述高层入口。仅为确定性触发捕获/发布/替换失败而需要的内部检查点或子进程控制，由实现者选择最少必要位置，必须最终通过真实文件系统或受控进程核验，不引入通用测试管理系统。

### T2 — 逐项覆盖矩阵

| 维度 | 必验内容 |
| --- | --- |
| A1 容器与字段 | 三类身份、完整页/条件/图像/路线/trigger/span/note、固定默认、非激活配置、页序/数量、外部 carrier 与 Blank/Reset |
| A2 参数 | 105+45 各模式/枚举/子型/None/独立设置、默认与显式、正负边界、支持值、正式/反编译/已知 raw 一致 |
| A3 结构 | 续行、镜像、闭合、空/非空/嵌套体、各层 endMarker、raw 混用、移动逐类外壳/M0、Timer 槽位 |
| A4 引用与诊断 | 真实上下文、空名实际 ID、无名槽、禁用条件例外、运行选择、递归 Gate、错误/警告/阶段/身份/路径 |
| A5 全链路保真 | 原生起点、实际发现与源码求值、Compile/Check、Diff/Push，完整解析结构和值比较及混合跨域引用 |
| A6 未知与异常 | 未知事件 raw 警告保留、已知异常拒绝、内部未知字段拒绝、外部未知 JSON 保留、镜像冲突不修复、失败隔离 |
| A7 Workspace 集成 | 完整 Snapshot 输入、容量与命名、Decompile 候选、Troops 物化、页级 Diff/Reset、过滤后的全局安全状态 |
| A8 失败与恢复 | 捕获一致性、freshness/绑定、全量漂移、发布、pending、争用、崩溃锁、真实文件系统和并发边界 |

每个参数/字段及已知相互作用必须有可追踪案例；不对独立取值做无差别笛卡尔积。不得先删缺键/null/空数组、尾 0、镜像、非激活设置、CR、尾空行或未知字段，再比较“相等”。明确拒绝负零的参数在有损重写前测试。编译器和反编译器互相往返只是部分证据，预期必须独立。

### T3 — 夹具、索引和结果

建立可由工具检查的验收索引，每项有稳定 ID、规格/参数出处、覆盖维度、输入与正负/边界/组合分类、预期结构/值/诊断/状态、fixture 和测试/E/R 关联、环境/执行责任、切片和必验层。由索引生成或校验人读清单，CI 检查引用、遗漏和重复。

需求与执行结果分开；状态为尚未执行/通过/失败/阻塞/待复验。不适用必须有具体规则，缺环境不是不适用。每次运行关联源码版本、输入与 fixture 哈希、工具/原生环境、操作者、操作阶段、预期/实际、原始结果和差异；通过必须有运行证据，不能手填总勾选。

发布自编事件的最小 JSON、必要的最小自编项目上下文、合成支持/拒绝样本、来源与复建说明，表现素材优先自制。普通自动化不依赖本地 references。首方帮助、模板、既有样例、静态推导、合成能力、合成拒绝、真实 UI 创建和游戏观察分别标注。原始捕获先保留，提取步骤可核对；批量更新预期不覆盖原生捕获。

### T4 — 原生前置与必验代表组

S1 优先核对可能推翻静态假设的移动外壳/indent/M0、403 与一项 Choices、子体尾 0、Timer Stop 槽、新建 Transfer/Shop/Battle 默认、第三行脸图与换小图、单槽字符串重确认、EXP 临界输入。对应实现开始前取得结果；规格与无依赖准备可先推进。发现反例时保留原始结果并进入契约修订，不静默改预期。

| 编辑器组 | 必验小场景 |
| --- | --- |
| E1 容器与页 | Map/Common/Troop 默认、触发、禁用配置、note、图像、非 custom 路线、普通页数边界；高 ID/21 页另标支持样本 |
| E2 分支与续行 | 四类子体空/非空/嵌套、缺/空 else、402/403、各层尾 0、Battle flags、Shop 空/重复/自定义价 |
| E3 移动结构 | 页路线与 205、无参/有参外壳、M0 两态、插入/替换/复制粘贴、精确 505 与 flags；全面45码由自动化承担 |
| E4 初值与保存状态 | Timer Stop 缺/零/非零、Transfer/Shop/Battle 默认、项目初值与固定默认区别、模式切换后的独立值 |
| E5 文本 | 四类记录的空/尾空/条数边界，完整单槽 CR/LF/CRLF/尾字符；注入起点明确标注 |
| E6 素材与地图 | 标准/三行/缩小脸图、None 加独立 index、图像联动、缩图后旧坐标、缺素材实际反应 |
| E7 EXP | 实际输入保存 9,999,999 与 10,000,000，记录接受/拒绝/调整并保留帮助差异 |

| 游戏组 | 必验小场景 |
| --- | --- |
| R1 页与调用 | 地图五 trigger/页选择、公共事件三 trigger/调用、非 custom/custom、自主/强制路线等待 |
| R2 战斗调度 | 最低合格页、AND/全关、turn0/A-B、三 span 与后续页调度、胜/逃/败分支 |
| R3 控制流 | Choices 默认/取消/越项保存、条件/循环/Break/Exit、Label 精确/重复/缺失，区分跳过与停滞 |
| R4 动态选择 | Common 不同上下文、变量角色0全队、双持/槽/库存、Random 与其他求值次数、Force Action 位置 |
| R5 地图位置 | Transfer/Vehicle/Event 与缩图坐标、terrain/region/tile 别名/eventId 实际后果 |
| R6 表现与 None | 脸图/文字/选择、移动与画面等待、并行、音频和 Picture 的不同 None，必要时人工观察声音图像 |
| R7 脚本与数值 | Gate 允许后的受控单槽多行/空脚本、完整 Plugin Line 受控接收、EXP 常量/变量和增减 |

每个小场景有输入、操作、预期和实际记录。普通 UI 新建、仅保存容器、主动重确认参数、游戏运行是不同阶段；非典型能力用注入/合成起点，不伪造普通创建证明。原生对照与 DSL 往返版本使用等价干净初态，辅助观察不得修改引擎行为制造通过；原生本身可能无作用、停滞或失败，须准确验证而非一律要求成功。

### T5 — Workspace 故障与平台

保留预造 pending 恢复测试，另加确定性故障注入与真实临时文件系统/受控多进程两层。至少覆盖：输入捕获到发布的内容/集合变化；类型依赖、旧契约、错目标；Decompile 不可发现隔离、别名/junction、最终位置解析、目标争用与发布后未报成功；Compile 校验/生成/manifest 失败；no-op 与无关标准文件漂移；首次替换前、逐文件替换时及写后复核中的外部改动；全 generated/全 snapshot/混合/缺失/未知恢复；争用、进程中断、崩溃锁与 pending 独立性。

断言原源码、项目文件、Snapshot、manifest、Discovery 集合及诊断的最终状态，不能只断言抛异常。失败的不同阶段采用对应保证，不把 Decompile 整批隔离、Compile 本地输出失效与 Push Interrupted 状态混为统一事务回滚。

本阶段的平台支持、普通自动化与 CI 均仅面向 Windows / Node 22，产品变更运行 Windows 全量适用检查与构建。Linux、macOS 等非 Windows 平台的适配、CI 和兼容验收不纳入本阶段。Windows 路径别名/junction、目录发布、锁和文件替换有明确必验，不静默 skip。原生编辑器与游戏用已标识的 MV 1.6.1 / runtime / NW.js，在独立临时工程执行，分别记录版本和哈希；文件存在或版本字符串不是实际可运行证明。

代理负责夹具、准备、自动化、可执行操作和证据整理；可控制原生 UI 时由代理操作，受限具体步骤由用户执行并按步骤留存原始结果。无法执行的必验任务保持待执行/阻塞，不用静态解释或 mock 顶替。

### T6 — 复验和完成声明

开发时按影响复验：参数/默认/值域/结构变化重跑对应 E/R，页/调用上下文扩大到调度，Workspace 写入变化重跑故障和跨域往返；原生版本/素材/步骤变化重采证据。共享结构或影响不明扩大相关范围。原始样本不覆盖，复验追加结果。

最终候选必须有全量适用自动化及 E1–E7/R1–R7 的有效证据，涉及产品输出的代表场景在最终集成后完整回归一次。此前只证明编辑器行为的采集，在同版本/步骤/输入下可复用，但不代替最终产品检查。候选后修改将受影响项标待复验，无关证据保留影响核对记录；纯文档笔误不机械重跑游戏。

完成门槛是逐项要求全部满足、无未解除的必验失败/阻塞，且独立证据能证明保存与安全契约。helper 数量、没有 raw、测试数量、设计票关闭、研究报告或单次互相往返均不能单独作为完整支持声明。

## Out of Scope

- Linux、macOS 等非 Windows 平台支持、适配、CI 与兼容性验收。
- MZ、VX Ace、其他 MV 版本及未经验证平台的兼容承诺。
- 插件私有命令语义、插件文件理解、任意非标准数据的正式模型；保留或拒绝仍受有限未知数据契约约束。
- 地图绘制、整个数据库 DSL 化、敌群成员/站位定义、引擎改造或重建编辑器。
- 旧 API 别名、兼容层、旧 Workspace 格式迁移与迁移说明。
- 通用 raw page/event/route/block、任意 extraFields、自动修复/归一化或跳过失败事件后宣称成功。
- 素材文件/尺寸扫描、资产清单和资产漂移依赖；不保证图片存在、脚本可运行或动态目标命中。
- 全调用图/运行状态推演、事件脚本预执行、插件执行沙箱、公开 JSON 诊断/Diff API、warnings-as-errors。
- Force Push、实时细粒度 carrier 合并、跨 Workspace/机器锁、多文件全工程原子隔离和自动整体回滚。
- 发布编辑器、首方 runtime/源码、完整反编译输出或本地游戏资产；普通 CI 不依赖这些本地资料。

## Further Notes

### 规格状态与后续工作

本文件是实施规格，状态 ready-for-agent 表示可以进入任务拆分与实施准备，不表示任一 S1 原生实验或产品验收已经通过。实际依赖按 I13 和 T4 执行。规格阶段仅进行了来源/代码/现有测试入口阅读与文档核验，没有运行产品、编辑器或游戏测试，没有创建实施任务、修改产品或扩展已经确认的范围。

后续使用 to-tickets 将 S0–S7 拆成完整纵向行为及精确依赖，在本实施 effort 下创建任务；原十三张票继续作为已关闭设计依据。实现机制可在已决责任边界内选择，新的领域行为或正常原生反例必须明确回到相应决定，不能写成未记录的实现细节。

### 规范来源

以下均为规范/研究文档链接，不指定易失的产品实现文件布局。实施条款须结合对应完整 Answer 和参数附表阅读，不能把本规格中的代表例子当作全部参数清单。

- [完整支持 MV 原生事件的决策地图](../complete-mv-events/map.md)：已确认范围、目的和十三张决策的索引。
- [地图事件备注与完整事件页](../complete-mv-events/issues/03-map-event-page-model.md#answer)、[敌群战斗事件身份与所有权](../complete-mv-events/issues/04-troop-event-ownership.md#answer)：I3；[原生事件完整数据证据](../complete-mv-events/research/native-event-data.md)与[保存规则证据](../complete-mv-events/research/editor-serialization.md)补充 Common Event 和原生行为来源。
- [原生指令完整参数与结构](../complete-mv-events/issues/05-native-command-contract.md#answer)、[保存结构往返与未知数据](../complete-mv-events/issues/06-semantic-roundtrip-policy.md#answer)：I2、I4、I6–I8。
- [有限原生保存形态](../complete-mv-events/issues/12-native-saved-shape-model.md#answer)、[原生控件范围与保存值边界](../complete-mv-events/issues/13-native-value-domain-boundaries.md#answer)：I5、I6及早期决定的最终细化。
- [Workspace 集成与写入安全](../complete-mv-events/issues/07-workspace-domain-integration.md#answer)：I7、I9–I12；[验收与实施顺序](../complete-mv-events/issues/08-completion-evidence-and-sequencing.md#answer)：I13、全部 Testing Decisions及完成门槛。
- [逐参数总索引](../complete-mv-events/research/command-parameters/index.md)、[核心](../complete-mv-events/research/command-parameters/core.md)、[系统/地图/表现](../complete-mv-events/research/command-parameters/visual-map.md)、[角色/战斗](../complete-mv-events/research/command-parameters/actors-battle.md)、[移动](../complete-mv-events/research/command-parameters/movement.md)、[共享控件](../complete-mv-events/research/command-parameters/shared-controls.md)：完整105+45原生映射、值域、证据等级和待执行样本。
- [Schema-First](../../docs/adr/0001-schema-first-dsl-entry-model.md)、[工具链](../../docs/adr/0002-technical-architecture-and-toolchain.md)、[Workspace模型](../../docs/adr/0003-workspace-compile-push-model.md)、[显式身份](../../docs/adr/0004-explicit-mv-id-entry-identity.md)、[Interrupted Push](../../docs/adr/0006-interrupted-push-recovery.md)、[命令族模块边界](../../docs/adr/0008-command-family-module-architecture.md)：现有架构基线。
- [地图保存状态](../../docs/adr/0009-preserve-native-map-page-saved-state.md)、[Troop所有权/Reset](../../docs/adr/0010-troop-event-ownership-and-reset.md)、[命令状态/验证](../../docs/adr/0011-native-command-state-and-validation.md)、[精确往返](../../docs/adr/0012-event-saved-state-roundtrip-boundary.md)、[编译假设/绑定](../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md)、[完整源码发布](../../docs/adr/0014-publish-decompiled-source-as-a-complete-directory.md)、[有限保存形态](../../docs/adr/0015-bounded-native-saved-shape.md)：已接受的产品增量。

## Comments

### 2026-10-19 — 平台范围调整为仅 Windows

用户明确要求当前仅支持 Windows。本规格据此将支持平台、自动化、CI 和最终验收范围收敛到 Windows / Node 22；Linux 等其他平台不构成本阶段完成门槛。已同步验收决策、实施任务及当前 CI，保留 Windows 文件系统安全必验和全部 E1–E7/R1–R7 原生检查。此次只调整平台范围，55 张任务的编号与依赖、105+45 指令覆盖和事件保存契约保持不变。
