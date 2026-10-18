# 原生指令的完整参数与结构应如何表达和校验

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: 02, 09
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[原生事件指令的参数与结构还存在哪些保真缺口](02-native-command-fidelity.md)、[编辑器如何保存分支与移动路线及不启用的字段](09-editor-serialization-evidence.md)。

根据指令保真调查，与用户确定补齐原生合法参数、分支、续行与移动路线的正式 DSL 契约，包括术语与 helper 命名、互斥参数、默认值、地图/公共/战斗上下文的校验边界，以及脚本输入门禁与原生插件命令的行为。

所有合法原生事件形态都必须有正式表达，不能靠 rawDslCommand 把缺失功能包装成支持。对研究发现的每类缺口选择表达与校验原则，明确编译和反编译遵循的共同语义；实现仍沿用 ADR 0008 的 command-family 所有权。

## Answer

用户于 2026-10-18 在逐轮同意 Q1–Q24 后，对完整契约与完成边界回答“确认”。以下为正式结论；本票已 resolved，[ADR 0011](../../../docs/adr/0011-native-command-state-and-validation.md) 已 accepted。关闭表示本票的表达与校验设计已达成共同理解；逐参数补证、产品实现和真实验收仍按后续工单推进。本轮没有实现产品、运行产品测试、执行真实编辑器或游戏验收。

### 范围与表达原则

所有合法原生事件形态均须有正式 Event DSL 表达；Raw DSL Command 不能长期替代缺失的原生功能。沿用 Schema-First DSL、MV-Aligned Command Helper Name 与 [ADR 0008](../../../docs/adr/0008-command-family-module-architecture.md) 的 command-family 所有权；0.x API 直接变更，不保留旧别名或兼容层。

互斥来源使用模式对象，所选模式的参数必填，矛盾组合报错。原生独立保存的未使用配置仍须表达。目标、项目引用、核心操作和必需的子列表显式给出；可省略字段逐项声明固定 Compiler Default，不继承旧事件、编辑器记忆或邻接指令。反编译只能省略能准确恢复原值的默认字段。

### Choices、分支与续行

```ts
showChoices({
  choices: [
    { text: "进入", commands: [] },
    { text: "离开", commands: [] },
  ],
  defaultChoice: { kind: "choice", index: 0 },
  cancel: { kind: "branch", commands: [] },
  position: "right",
  background: "window",
});
```

- choices 长度 1–6，保留空文字、纯空白与显式尾部空项；text 和必填 commands 同属一个对象，顺序决定位置，commands 可为 []。主记录文字和 402 镜像从同一个 text 生成。
- defaultChoice 为 none / choice；cancel 为 disabled / choice / branch，均使用 kind 模式。choice index 为整数 0–5，即使超出当前实际选项数也保留并警告。这是 Q12 对 Q5 初始限制的明确修订；不把越界取消值自动转为 branch。
- `conditional({ condition, then: [] })` 无 else，显式 `else: []` 保留空 else。Loop 的子体仍由父命令持有；具体对象字段与全量 helper 对照在逐参数表中列明，不能沿用现实现的旧位置参数接口作为规范。
- Battle Processing 的 flags 与结果分支使用独立字段表达；flags 可省略为 false，组合必须符合下表。所需分支可为空，但不能缺失；禁用分支不能出现，组合不符报错，不自动补删。

| canEscape | canLose | 必需结果分支 | 正常结构 |
| --- | --- | --- | --- |
| false | false | 无，禁止 win/escape/lose | 301 |
| true | false | win、escape | 301 → 601 → 602 → 604 |
| false | true | win、lose | 301 → 601 → 603 → 604 |
| true | true | win、escape、lose | 301 → 601 → 602 → 603 → 604 |

Continuation Event Commands、分支标记及路线镜像属于父命令，不新增独立公开 helper。按已读首方静态生成规则：Choices/Conditional/有分支的 Battle 各空体产生深一层 code 0；新建空 Loop 为 112 → 深一层 code 0 → 413；205 持有 route，505 镜像非终止移动指令，路线终止与事件列表结束分别处理。不得把空体规则泛化成所有非空体后强加 code 0。403 参数落盘形态等尚未完全验证的细节在后续参数表中标为待证；已有镜像矛盾、异常终止或分支组合由语义往返策略决定。

### 已选定的默认值、枚举与空商店

| 命令/对象 | 可省略字段 | 固定默认值 |
| --- | --- | --- |
| Show Choices | defaultChoice | `{ kind: "choice", index: 0 }` |
| Show Choices | cancel | `{ kind: "choice", index: 1 }` |
| Show Choices | position / background | right / window |
| Transfer Player | direction / fade | retain / black |
| Set Event Location | direction | retain |
| Shop Processing | purchaseOnly | false |
| Battle Processing | canEscape / canLose | false / false |
| 共享 Movement Route（沿用地图页决定） | repeat / skippable / wait | true / false / false |

Choices position 为 left/center/right，background 为 window/dim/transparent；Transfer fade 为 black/white/none。Transfer 与 Set Event Location 的 direction 为 retain/down/left/right/up，retain 编码为 0；其他只支持四向的字段不因此增加 retain。

一项 Choices 省略 cancel 仍保存 index 1，并按位置缺失规则警告；不根据实际项数调整默认值。目标、choices 文字与分支 commands 不采用编辑器的本地化 Yes/No 初值。

Shop 使用 purchaseOnly，true 禁止出售，替换旧 allowSelling。goods 必填、允许 []；空列表编为 302 `[0,0,0,0,purchaseOnly]`，反编译识别为 []。此处 ID 0 是结构占位，不是 itemRef({id:0}) 或一般引用例外。非空 goods 保留顺序与重复，商品 kind 与 item/weapon/armor 引用类别一致；省略 price 表示数据库标准价格。

Choices 初值有完整局部静态创建链。Transfer/Set Event Location/Shop/Battle 的部分初值仍依赖 Qt 控件与上游源码佐证，未完全匹配随包框架首次初始化路径；本轮明确将它们选为固定 DSL 默认，真实新建保存检查仍待验收。

### 引用、运行选择与校验等级

Runtime Selector 不是 Project Data Reference，但其中的固定项目目标或变量引用必须正常解析。同一概念在条件、Game Data 和命令中复用，各命令只接受原生支持的子集；位置 index 零起始，不混淆人物、敌群位置、队伍位置与技能目标位置。Common Event 不增加强制上下文声明，不做完整调用图或运行状态推演，不保证未来目标命中。

| 情况 | 正式编写的处理 |
| --- | --- |
| 参数形状、互斥组合、已定类型/枚举/值域不合法 | 报错，不裁剪或重置 |
| 固定项目引用缺失、名称不唯一 | 报错；既有禁用页条件保存 ID 例外不变 |
| 有效容量内无名 variable/switch 槽的显式 ID | 允许；不要求命名 Definition |
| variable/switch ID 0 或超出最终 System 容量 | 报错；引用不自动扩容，既有禁用条件例外不变 |
| 合法数值域内的 event/enemy 位置在当前所属容器中不存在 | 警告、保留；不推断 Common Event 的未知调用上下文 |
| 已属合法原生指令，但所属上下文不适用 | 警告、保留；诊断区分跳过、残留对象作用与流程停滞 |
| 循环外 Break Loop、缺失/重复 Label | 警告、保留；不新增跨分支 Jump 禁令 |
| Script Input 未获 Workspace Script Command Gate 允许 | 报错，完整递归覆盖所有保存子体与路线 |

Label 按精确字符串匹配，作用域为当前原生命令列表，不 trim、不跨 Common Event 边界；重复标签命中首个。循环外 Break Loop 可能跳过余下流程；战斗中 Transfer Player 若执行可能停在该命令；地图上的敌人命令可能触及残留 troop。坏 Enemy 引用导致 runtime 过滤后索引前移要准确警告。[战斗页模型](04-troop-event-ownership.md#answer)对启用 enemy 页条件的更严格存在性与成员引用检查不变。

变量/开关名称仅解析唯一的 DSL 命名声明，不回退 Snapshot 名称。无名槽依最终生成容量判断，容量与真实 Workspace 输入装配交给 Workspace 决策。Force Action 技能目标为 lastTarget/random/index，index 为整数 0–7，不按当前敌人数拒绝或裁剪。

### 连续范围、动态来源与换装

Control Switches / Control Variables 保留 `{ kind: "referenceRange", from, to }`，两端为对应类别的引用；解析后是包含两端的连续数字 ID 区间，包含无名中间槽。要求 from ≤ to，反向报错、不自动交换。这是产品选择，编辑器反向控件行为尚未核实。

Control Variables 的 value 统一为模式对象：`{kind:"constant",value}`、`{kind:"variable",variable}`、`{kind:"random",from,to}`，以及各自必需字段明确的 gameData/script 模式。常量与随机端点是 −99,999,999..99,999,999 的整数，随机 from ≤ to；该界限不施加于运行时变量、Game Data 或 Script 计算结果。原生 Random 对每个目标独立采样，其他 operand 在目标循环前求值一次。actorFromVariable 的变量引用必须存在，运行值 0 保留全队语义。

```ts
changeEquipment({
  actor: actorRef({ id: 3 }),
  slotIndex: 1,
  equipment: {
    kind: "runtimeSelector",
    scope: "equipment",
    target: "idForSlot",
    id: 7,
  },
});
```

Change Equipment 的 actor 是固定项目引用；slotIndex 为零起始，合法范围依据最终 System 装备槽数量，不写死五槽。非空 equipment 使用正整数 ID 的 Runtime Selector；执行时根据槽位类型查 Weapons 或 Armors，反编译不能凭初始 Actor/Class 推断固定 weaponRef/armorRef。`equipment: null` 表示原生 itemId=0 卸下。候选缺失按运行选择警告，不自动换表替代，不保证库存或可装备条件；目标表中该 ID 条目缺失可能卸下现有装备。具体参数上限、候选诊断与来源映射继续在参数表中写清。

### 移动路线与 None 素材

沿用共享 `{commands,repeat?,skippable?,wait?}`，commands 必填且可空；命令形状为 `setMovementRoute({target,route})`。所有保存路线都完整校验，即使自主移动不是 custom。移动子指令使用 kind 对象列表：routeWait 改为 `{kind:"wait",frames}`；jump x/y 为相对位移；walkAnimation/stepAnimation/directionFix/through/transparent 使用 enabled；其他方向/转向 kind 沿用已有表达。

changeImage 使用 character 与 characterIndex，character 为 characters 类素材或 null，index 为整数 0–7；空图或大人物图的非零 index 独立保留。blendMode 为 normal/additive/multiply/screen，与图片指令共用。路线继续复用 Script Input、SE 素材和开关引用，未列数值范围须进入参数证据表。

Asset Reference 继续要求非空素材名。已逐字段证明支持原生 None 的素材槽使用显式 null，并保留同条记录的 index、volume、pitch、pan 等独立参数；字段省略只对应其固定默认。null 的原生编码与行为逐字段确定，不能统一改写为 stop/erase/删除指令，也不能把地图内部 null 与原生空素材字符串混用。runtime 能读取空名不足以证明所有素材 picker 均支持 None。

### 文本、Script 与 Plugin Command Line

| 正式命令 | 行数 | 空内容的表达 | 正常记录归属 |
| --- | --- | --- | --- |
| Show Text | 1–4 | lines: [""] | 一个 helper 对应一个 101 与其 401 |
| Show Scrolling Text | 至少 1，无已设上限 | lines: [""] | 105 与其 405 |
| Comment | 1–6 | lines: [""] | 108 与其 408 |
| Script | 1–12，仅限 355 指令 | Script Input.code: "" 计作一行 | 355 与其 655 |

lines 每元素对应一条物理文本记录；[] 报错，空字符串和纯空白保留。显式尾部空行保留，不模拟编辑器重新确认时裁尾。超出所选普通编写行数时报错，不截断、不拆分或合并指令组。355 的限制不推广到其他 Script Input 槽；空 Script 仍受门禁约束。

[06 号票 Q13](06-semantic-roundtrip-policy.md#answer) 已最终确认换行映射：lines 元素不内嵌 LF，CR 作为字面字符保留；Script code 只按 LF 拆成 355/655，反编译只在原生记录间插入 LF，不执行 CRLF→LF、CR→LF 或删除 CR。四类命令的单条原生文本记录内含 LF 时，当前正式行模型无法精确表达，拒绝反编译而不拆记录或降级 raw；已有超长组按 4/6/12 条原生记录限制拒绝。该规则不推广到 note、Plugin Command Line 或单参数 Script Input。保留 CR 是明确产品选择，不代表编辑器保存路径已全部验证；正常原生反例仍由 11 补证并要求重开对应限制。06 已 resolved，ADR 0012 已 accepted。

Plugin DSL Command 为 `pluginCommand({line})`，替换 command + args；完整字符串原样编译/反编译，不 trim、不折叠空白。Plugin Command Registry 仅作 lint 解释，不改写保存文本或要求理解插件私有语义。所有 Script Input 均完整递归校验，包含 Loop、显式空或不可达分支、非激活页路线；Raw DSL Command 的门禁政策仍属于语义往返策略，本票不自动扩展现有规则。

### 后续责任、证据与完成条件

本票关闭代表表达/校验设计已达共同理解，不能表示 105+45 全参审查、功能实现或真实验收已完成。Q24 将剩余事实调查明确交给 [原生指令逐参数契约还缺哪些证据](11-native-command-parameter-evidence.md)，逐族列出 schema、原生槽位、必填/默认、值域/None、保存结构、引用/上下文、证据与所需样本。可机械应用本票规则的项直接记录；新模型冲突必须重新与用户讨论；缺证项不得猜默认或用 raw 宣称支持。该表是实施规格完成的前置要求。

- [语义无损往返与未知数据处理的精确契约是什么](06-semantic-roundtrip-policy.md)：异常参数/组合、未知字段、镜像冲突、code 0、换行、Raw DSL 与 Script Gate 边界，以及收紧 ADR 0003。
- [扩展事件数据域后 Workspace 如何保持同步与写入安全](07-workspace-domain-integration.md)：最终系统槽容量、完整引用及上下文输入、真实 compile/check/decompile/diff/push 路径；包括 Animations/Tilesets 缺失装配问题。
- [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md)：结合参数表制定自动化原生夹具、编辑器新建/打开/确认/保存与游戏场景的验收及切片顺序。

依据：[原生指令保真调查](../research/native-command-fidelity.md)、[编辑器保存证据](../research/editor-serialization.md)、[本轮指令契约补充证据](../research/command-contract-editor-evidence.md)。证据区分首方帮助、模板/runtime、本体静态源码、推断与真实执行；当前未取得真实保存样本，403 的 [6,null] 仍属序列化推断。研究文字不等于产品能力或验收通过。

## Comments

### 2026-10-18 — 已决地图页模型输入

[03 号票](03-map-event-page-model.md#answer) 已经用户最终确认并解决。自主移动与 Set Movement Route 共用 Movement Route 对象 `{ commands, repeat?, skippable?, wait? }`，commands 必填且可为空，标志默认 true / false / false；命令形状改为 `setMovementRoute({ target, route })`。wait 在 Set Movement Route 中控制解释器等待，在自主移动中只保留保存值。所有保存路线均执行完整指令、引用与 Script Command Gate 校验，非 custom 页不豁免。

本票继续确定移动子指令的完整参数、原生续行/终止结构及其他命令族契约，沿用该共享对象与默认值，不引入页专用的另一套路线。禁用条件槽的保存 ID 例外不适用于路线指令。长期依据见 [ADR 0009](../../../docs/adr/0009-preserve-native-map-page-saved-state.md)。

### 2026-10-18 — 已决战斗页模型输入

[04 号票](04-troop-event-ownership.md#answer) 已经最终确认并解决，长期依据见 [ADR 0010](../../../docs/adr/0010-troop-event-ownership-and-reset.md)。正式容器为 `troopEvent({ troopId, pages })` 与 `battlePage({ conditions?, span?, commands })`；页面 commands 必填且可为空，条件全关闭不使保存的命令列表消失。禁用 actor/switch 条件允许无目标的显式保存 ID，禁用 enemy 条件允许越界旧位置；这些例外不扩展到页内指令及 Script Command Gate。

启用 enemy 页条件时，index 是 0 起始成员位置，hidden 成员占位；位置必须存在且该敌群所有成员的 Enemy 引用均有效，以防 runtime 过滤坏引用造成后续索引前移。成员重排后条件按新位置解释，不绑定原 Enemy 身份。本票继续决定指令中 Runtime Selector 的完整参数与上下文校验，并与 07 的真实 Workspace 路径协调；不能把页条件的已决规则当成全部指令校验已经确定。

### 2026-10-18 — grill-with-docs 第一轮：Q1–Q4 已确认

用户回答“同意”，接受以下四项决定。本票仍在讨论，尚未形成完整 Answer，也未实施产品功能。

1. **Q1 互斥参数模式**：对真正互斥的参数来源，采用带模式标记的对象；选定模式后必须提供该模式需要的字段，类型与运行时校验共同拒绝矛盾组合。原生数据若独立保存当前未使用的配置，仍保留这些独立保存字段，不能因使用判别联合而丢失状态。具体模式名、字段名及各命令族适用范围待后续轮次确定。
2. **Q2 固定 Compiler Defaults**：目标、引用和核心操作参数原则上显式填写，不隐式选择数据库第一项。可省略字段逐项声明固定默认值，以首方原生初值为依据；不继承编辑器上次输入、旧事件或相邻指令。反编译仅省略能准确重建原值的字段。未查明的原生初值保留为待取证项，不能把现有实现或测试期待值冒充原生默认。
3. **Q3 Show Choices 的选项归属**：改为 `showChoices({ choices: [{ text, commands }, ...] })`；选项文字和分支内容属于同一个对象，数组顺序决定原生选项位置，commands 必填且允许为空。正常编译从同一 text 生成选择列表文字与对应 402 文字。默认选项、取消行为、数量限制与空分支的完整生成规则待后续确定；已有原始数据的 102/402 镜像矛盾仍由 06 决定。
4. **Q4 Plugin Command Line**：采用 `pluginCommand({ line })`，以完整原样字符串替换现有 command + args 输入；编译与反编译不 trim、不折叠空白。Plugin Command Registry 可解析文本用于 lint，但不改写保存文本，也不要求理解插件私有语义。该决定明确替换 GLOSSARY 中分字段表达的旧约定，并引入 Plugin Command Line 术语；它仍是正式 Plugin DSL Command，不是 Raw DSL Command。

当前决策树前沿：Choices 的默认/取消与正常分支结构；其他复合指令的省略与显式空体；Transfer Player/Shop 等已证特殊值与语义修正；统一 Runtime Selector 与项目引用的边界；公共事件上下文与诊断等级；移动子指令的值域及结构；缺少首方证据的参数默认与后续调查交接。完整共同理解仍需最终确认。

### 2026-10-18 — grill-with-docs 第二轮：Q5–Q11 已确认

用户回答“同意”，接受以下七项决定。下面记录正式设计选择；现有产品尚未实现这些变更。

5. **Q5 Choices 模式对象**：`defaultChoice` 使用 `{ kind: "none" }` 或 `{ kind: "choice", index }`；`cancel` 使用 `{ kind: "disabled" }`、`{ kind: "choice", index }` 或 `{ kind: "branch", commands }`。本轮曾要求 index 为零起始且指向现有选项；该范围限制已由后续 Q12 明确替换，勿继续作为最终契约。取消分支 commands 必填且允许为空。替换 defaultType/cancelType/cancelBranch，不静默覆盖互斥设置。字段能否省略及对应默认值仍待首方初值证据与后续选择。
6. **Q6 分支存在性**：没有分支与显式空分支是不同保存结构。`conditional({ condition, then: [] })` 不含 else；显式 `else: []` 表达存在的空 else。不自动删除显式空分支，也不自动补出省略分支。Battle Processing 的 canEscape/canLose 战斗规则与结果分支保持独立表达；具体原生合法组合与正常结构记录仍待首方保存规则核定。Choices 已证的空分支 code 0 生成规则不推广到其他命令族。
7. **Q7 已证语义修正**：Transfer Player 和 Set Event Location 的 direction 使用 `retain / down / left / right / up`，retain 对应原生值 0；仅支持普通四向的参数继续使用 down/left/right/up，不接受 retain。Shop Processing 改为 `purchaseOnly: boolean`，true 表示禁止出售，删除 allowSelling；默认值不以帮助示例配图猜定。
8. **Q8 Runtime Selector 一致性**：条件、游戏数据读取和普通命令复用相同概念的 selector；人物为 player/currentEvent/指定 event ID，敌人为单个成员位置及仅适用于批量命令的全体，固定角色目标内使用 actorRef，动态角色分支使用变量引用或全队。队伍位置、Force Action 的技能目标位置保持各自用途，不混成 enemy index。位置 index 统一零起始，每个命令仅接受其原生支持的 selector 子集。Selector 自身不是项目引用，但可以包含必须正常解析的 Project Data Reference；据此澄清 GLOSSARY，后续具体字段仍需完整列明。
9. **Q9 公共事件与上下文**：Common Event 保持可复用，不新增强制执行上下文声明，不要求完整调用图或运行状态推演。完整检查结构、参数和 Project Data References；不承诺 Runtime Selector 在执行时一定命中。不能仅按定义容器判定全部后续目标。哪些直接上下文限制报错、哪些位置缺失警告，仍需按具体命令确定，不能粗按地图/战斗分类套规则。
10. **Q10 正式值域**：按逐项确认的原生类型、枚举与数值范围校验，超界报错，不裁剪、不重置；runtime 恰好能读取更宽的值不自动构成正式支持。各参数分别确定范围，不统一套非负整数。未知范围继续取证；原始异常数据的保留或拒绝属于 06。03/04 明确批准的保存值例外不变。
11. **Q11 可疑流程诊断**：循环外 Break Loop、缺失 Label 目标、重复 Label 均警告并保留原生行为；不额外禁止跨分支跳转。Label 精确字符串匹配，不 trim、不改大小写，作用域为当前原生命令列表，不跨 Common Event 调用边界。循环外 Break Loop 可能扫描到列表末尾并跳过后续命令，不能描述为无害 no-op；重复 Label 命中全列表首个同名标签。真正的参数矛盾与结构错误仍是编译错误。

剩余前沿：直接上下文限制与 Runtime Selector 的诊断细则；移动子指令的正式字段/值域；连续范围和动态来源的校验；未证的 Choices 数量/空文字、命令工厂默认及分支结构；完整命令参数契约的补证与验收交接。Q1–Q11 均不替代 06 的未知数据政策，也未表示产品或真实编辑器验收通过。

### 2026-10-18 — grill-with-docs 第三轮：Q12–Q17 已确认

用户回答“同意”，接受以下六项决定，包括对 Q5 的明确修订。补充的首方静态事实见 [指令契约编辑器证据](../research/command-contract-editor-evidence.md)；没有执行真实编辑器或游戏。

12. **Q12 Choices 的保存范围（替换 Q5 的索引限制）**：choices 为 1–6 项，文字允许空字符串或纯空白，不 trim。defaultChoice/cancel 的 choice index 为整数 0–5，即编辑器六个固定位置；不要求小于当前 choices.length。指向当前不存在的位置时警告并原样保留，不自动改成 none/disabled/branch。DSL 中明确给出的列表原样保存，不模拟参数对话框裁掉末尾空文字的操作；因此尾部空项的保留也是本次明确的保存选择。其余模式对象、必填且可为空的 commands 规则不变。原生 runtime 对越界取消编号的处理仍由 runtime 执行，不提前改写保存值。
13. **Q13 无名系统槽的引用**：显式 variableRef/switchRef ID 可以引用最终生成 System 数组有效范围内的无名槽，不要求非空名称或对应命名 Definition。名称引用仍只解析 DSL 中唯一匹配的名称，不回退 Snapshot 名称；ID 0 和越界 ID 仍报错（03/04 已批准的禁用保存 ID 例外不变），引用本身不自动扩容。该规则针对实际存在的槽，与禁用条件保留不存在目标的例外不同。引入 System Variable Slot / System Switch Slot 术语；07 继续确定容量与真实 Workspace 接入。
14. **Q14 直接上下文诊断**：对原生结构与参数本身合法、但保存位置的执行上下文不适用的命令，警告并保留，不增加按容器禁止编译的规则。诊断准确区分跳过、无目标、可能作用于残留对象和阻止流程继续；特别指出战斗中的 Transfer Player 若执行会停在该指令。不可达分支中的保存命令同样接受完整结构/引用/门禁校验，但不因上下文警告拒绝整个事件。
15. **Q15 项目目标与运行位置分级**：固定 actor/enemy/animation 等 Project Data Reference 缺失报错；合法数值域内的指令 event ID 在所属地图不存在、enemy index 超出所属敌群当前成员数、坏 Enemy 引用可能造成过滤后位置前移，均警告并保留。公共事件缺少足够上下文时不猜测目标，也不声称已验证命中；所属上下文检查不传播为完整调用图推断。Force Action 技能目标为 lastTarget/random/index，index 为零起始 0..7，按技能作用范围解释，不按当前敌人数拒绝或裁剪。04 已决的启用敌人页条件存在性与全体成员引用 hard error 规则不变，本项仅适用于页内指令。
16. **Q16 Battle Processing 正常组合**：canEscape/canLose 均 false 时不允许结果分支；仅 escape 为 true 时必须显式给 win 与 escape；仅 lose 为 true 时必须给 win 与 lose；均 true 时必须给 win/escape/lose。所需分支可为空数组，不得省略；不需要的分支不得出现。不静默添加空分支或删除额外分支，组合不符直接报错。正常编译在无结果分支时只生成 301；有结果分支时按原生顺序生成 601/启用的602或603/604。既有非规范原始组合仍由 06 决定保留或拒绝方式。
17. **Q17 移动子指令形式**：Movement Route 继续使用 kind 对象列表；routeWait 改为 `{ kind: "wait", frames }`；jump 的 x/y 为相对位移；walkAnimation/stepAnimation/directionFix/through/transparent 使用 enabled。changeImage 使用 character/characterIndex，character 为 characters 类素材或 null，index 独立保存且允许整数 0..7，空图与大人物图的非零索引不自动归零。blendMode 使用 normal/additive/multiply/screen 并与图片指令共用；其他方向与转向等无参数 kind 沿用已有表达。继续复用 Script Input、SE Asset Reference 和开关 Project Data Reference。

剩余前沿收敛为：固定命令默认与可省略字段、空 Shop 的正式表示、连续变量/开关范围和动态来源规则、未完整核实的参数值域与补证交接、最终共同理解确认。正常空体/续行生成按新静态证据落实，既有异常数据处理继续由 06 承接；本轮不宣布逐参数验收已经完成。

### 2026-10-18 — grill-with-docs 第四轮：Q18–Q24 已确认

用户回答“同意”，接受以下七项。当时完整契约已整理为核对稿，等待最后一次共同理解确认；随后确认结果见本文件末尾，核对稿现已转为上方 Answer。没有实施产品或执行验收。

18. **Q18 固定默认**：Choices defaultChoice=choice0、cancel=choice1、position=right、background=window；Transfer direction=retain、fade=black；Set Event Location direction=retain；Shop purchaseOnly=false；Battle canEscape/canLose=false。对应字段可省略，且反编译仅在精确恢复时省略。一项 Choices 的省略 cancel 仍为 choice1 并警告。接受 Choices 完整静态初值链与其他控件默认较弱证据的区别，保留真实样本验收。position 为 left/center/right，background 为 window/dim/transparent，fade 为 black/white/none；目标、文字、商品列表和必需分支不自动生成。
19. **Q19 空 Shop**：goods 必填且可为 []，正常编译为 302 `[0,0,0,0,purchaseOnly]`，反编译恢复为空列表。ID 0 仅为该结构占位，不是 itemRef 或一般缺失引用例外。非空商品保持顺序、重复项和引用类别一致性；沿用省略 price 表示标准价格。
20. **Q20 连续范围与操作数**：引用范围为解析后包含两端的连续数字 ID，含无名中间槽；from>to 报错、不交换。Control Variables 的 constant/variable/random/gameData/script 统一模式对象。常量和随机端点采用整数 −99,999,999..99,999,999，随机端点有序；不把该界限施加于运行时读值/计算结果。保留 Random 每目标独立采样、其他 operand 一次求值及 actorFromVariable 值0全队的原生语义。逆序拒绝是明确产品选择，编辑器反向控件行为未核实。
21. **Q21 None 素材**：已证支持 None 的素材字段用显式 null；Asset Reference 继续非空名。保留 index/volume/pitch/pan 等独立保存值，省略仅对应固定默认。按字段规定原生编码与语义，不统一改成 stop/erase/删命令；未证 picker 不因 runtime 可读空名而自动开放。
22. **Q22 文本与空脚本**：一 showText 对应一101组，不自动拆并；lines 每项对应一原生行且不内嵌换行，[]报错，[""]合法，保留空白和尾部空行。正式编写上限采用 Show Text 4、Comment 6、Script 12行；Scrolling Text 至少一行、无已设上限。code:""作为一行合法 Script，仍受 Gate；355行数限制不套其他 Script Input 槽。已有超长组、内嵌换行与 CRLF 交给参数证据及往返策略，不先静默归一化。
23. **Q23 Change Equipment**：actor 固定引用；slotIndex 零起始并依据最终 System 装备槽数量，不写死五槽。equipment 为 `{kind:"runtimeSelector",scope:"equipment",target:"idForSlot",id}`，非空ID为正整数；null 表示卸下。执行时按槽位查 Weapons/Armors，不凭初始配置反编译成固定引用；候选缺失警告，不换表寻找替代物、不保证装备成功，并准确提示缺失可导致卸下。
24. **Q24 完整参数证据门槛**：105+45库存不是全参完成；后续建立逐族参数契约表，覆盖 schema/原生参数、必填默认、值域None、结构校验、证据样本。机械应用已决原则，新增设计冲突回到用户讨论；未证不猜默认、不以 raw 替代支持。独立跟踪剩余调查，参数表作为实施规格完成前置要求，由验收与顺序决策承接实际验证安排。

文档核对：已整理综合契约、术语、ADR草案、后续参数研究票及往返/Workspace/验收交接；独立只读一致性核查后澄清Battle旗标可省略与换装候选条目缺失的措辞。本轮本地Markdown链接目标存在性与空白检查通过；工单和ADR仍待最终共同理解确认。没有产品测试、编辑器/游戏执行、commit、push或PR。

### 2026-10-18 — 最终共同理解确认与关闭

用户对完整核对稿及完成边界回答“确认”。Q1–Q24 与综合契约正式生效，本票改为 resolved，ADR 0011 改为 accepted，并将结论索引加入决策地图。此前各轮 Comments 中的待确认/剩余前沿描述属于当时的讨论记录，以本 Answer 及本条最终确认作为当前状态。

### 2026-10-18 — 06 号票对文本记录映射的补充

用户在 06 的 Q12–Q16 轮回答“同意”，随后对完整契约回答“确认”。其中 Q13 将本票“不内嵌换行”精确化为禁止行记录元素内 LF、原样保留 CR，并确定 Script 仅按 LF 拆分/拼接记录。当前 Answer 已同步该细化及已有超长组、内嵌 LF 的拒绝边界；本票历史 Q22 保留原讨论记录。正常原生反例仍须补证并重开模型，不能当作非标准数据永久拒绝。06 已 resolved、ADR 0012 已 accepted；未实施或执行真实验证。

已同步语义往返、Workspace、验收工单的正式结论链接；逐参数研究票的前置讨论现已完成，但研究仍为 open、未认领。其参数证据表继续阻塞完整支持的实施规格完成与最终验收顺序决策，不因本票关闭而视为已完成。

核验范围为文档一致性、Markdown本地链接与锚点、工单依赖及空白格式；没有执行产品测试、编辑器或游戏检查，没有commit、push或PR。本轮讨论任务至此完成。
