# 原生保存形态差异如何进入正式 DSL

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: 11
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

逐参数研究发现三类由原生编辑路径产生、但当前已决接口尚不能充分区分的保存结构。如何补充正式 DSL，使编译、反编译和 Push 保留字段/槽位存在性、原始值、结构终止及镜像，并继续拒绝真正未知字段？

本票由用户参与决定；不能用 raw 兜底、静默补默认或清理记录来绕过已定的完整原生支持与保存结构往返要求。

## Research inputs

- [逐参数研究总索引](../research/command-parameters/index.md#需要用户讨论的保存形态)、[核心参数证据](../research/command-parameters/core.md)、[移动参数证据](../research/command-parameters/movement.md#原生移动记录外壳的待决差异)和[共享保存链](../research/command-parameters/shared-controls.md)。原始目标身份、精确偏移/行号和证据强度均在报告中。
- **停止计时器的可选保存槽**：新建 Stop 保存 `[1]`；普通 Start 83 秒后改 Stop，保存器只修改操作槽，可保留 `[1,83]`。完整静态路径已闭合，真实编辑器样本尚未执行。只有 action 的 Stop schema 无法表达差异；统一删 seconds 或补 0 都改变保存结构。
- **移动记录外壳**：无参按钮只创建 code，参数化工厂创建 parameters 数组；新建路线和空白页模板的 M0 分别可缺 parameters 或含 `[]`。插入器对缺失 indent 做算术，沿最终 JSON 保存路径推导 `indent:null`；205/505不清洗子记录。该 null 结论是静态推导，没有冒称真实文件观察。它不应未经调查就被当作插件额外字段。
- **子体末尾 code 0**：在空体的 0 前普通插入命令保留原 0；已读的同体删除/剪切路径不会单独删掉该尾0。Conditional/Choices/Battle重确认只给零长度体补0，既不删除非空体已有0，也不为已载入的非空无0体统一补0。尚未证明同内容有/无尾0都能由普通UI创建；不能根据这个未知直接选择全量强加或全量移除。

## Decisions required

1. Control Timer 的停止模式如何表达秒数槽缺失、存在且为 0、存在且非 0；选定正式字段、编写默认、反编译输出及校验边界。
2. 共享 Movement Route 是否需要明确的原生保存形态信息，如何表达无参 parameters 的缺失/空数组、子项 indent:null 及终止项外壳，并复用于页自主移动和 Set Movement Route。只允许已证形态，不演变为任意 JSON 通道。
3. 子体记录终止如何建模或生成；哪些已证结构可机械恢复，哪些差异必须显式表达。选择应覆盖 Choices、Conditional、Loop、Battle 及嵌套；如需继续取证某个精确普通编辑路径，再独立形成研究前置。
4. 编译/反编译的精确比较、205/505镜像、异常诊断与递归引用/Gate如何复用现有约束；无法表达的正常形态必须先补模型。

候选可以是有限的显式保存字段、结构对象或有证唯一生成规则；研究没有批准其中任何一种。讨论时给出具体输入/原生输出例子，不替用户作决定。

## ADR impact

已接受的 [ADR 0015](../../../docs/adr/0015-bounded-native-saved-shape.md) 补充 ADR 0009 的共享 Movement Route、ADR 0011 的正式指令/子体表示，以及 ADR 0012 的原生记录外壳与终止约束。三个既有 ADR 已添加关联说明；保存结构和值等价、未知数据和完整校验的底线不因此放宽。

## Completion and handoff

正式 Answer 应明确所有字段、缺失语义、默认、原生映射、诊断及必要样本；同步受影响的参数报告和领域记录，再解除本票对 [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md) 的阻塞。实际编辑器创建/重存/重确认和游戏运行由验收规划承接；不能把尚未执行的样本记为通过。

## Answer

用户于2026-10-19逐轮接受Q1–Q7，并对以下完整契约与完成边界最终回复“确认。改完提交”。本票已resolved，[ADR 0015](../../../docs/adr/0015-bounded-native-saved-shape.md)已accepted；设计完成不等于产品实现、编辑器或游戏验收通过。

### Timer 的槽位存在性

```ts
controlTimer({ action: "start", seconds: 83 }); // [0, 83]
controlTimer({ action: "stop" });               // [1]
controlTimer({ action: "stop", seconds: 0 });   // [1, 0]
controlTimer({ action: "stop", seconds: 83 });  // [1, 83]
```

action 必填；Start 的 seconds 必填，Stop 可选。存在的 seconds 均为整数 0..5999；Stop 的省略或显式 undefined 表示缺 p1，不是默认秒数。原生 Start 必须恰有两个参数，Stop 必须恰有一个或两个参数；类型、已定范围、多槽、null 等异常按契约诊断，不删除或补槽。Stop `[1,0]` 反编译必须输出 seconds:0。

### Movement Route 及逐类外壳

共享路线采用 `{commands,repeat?,skippable?,wait?,terminator?}`，commands 必填可空，flags 固定默认仍为 true/false/false，页自主移动与 Set Movement Route 使用同一模型及默认。Set Movement Route 的 target 在路线外。路线末尾必须有且仅有一个 M0；它不进入用户移动 commands 数组。

| 所属对象 | DSL 保存字段 | 原生允许形态 | 固定编写默认 |
| --- | --- | --- | --- |
| 无参 M1–13、M16–26、M31–40 | `savedShape?: {indent?: "absent" \| "null"}` | code；缺 parameters；indent 缺失或 null | 缺 indent |
| 有参 M14、M15、M27–30、M41–45 | 同上 | code；由正式参数生成精确 parameters 数组；indent 缺失或 null | 缺 indent |
| 路线所属 M0 | `terminator?: {parameters?: "absent" \| "empty"}` | `{code:0}` 或 `{code:0,parameters:[]}`，均缺 indent | parameters:[] |

保存对象及其字段都可省略，空对象按各字段默认处理。`savedShape.indent:"null"` 是 DSL 符号，编为原生 JSON null；不是接受数字缩进、undefined/NaN 序列化或任意顶层字段。无参非终止记录的 parameters:[]、M0 的 indent:null、移动记录数字 indent 等未获支持，不利用参数键/indent 的交叉组合扩域。

```ts
const route = {
  commands: [
    { kind: "moveDown", savedShape: { indent: "null" } },
  ],
  terminator: { parameters: "absent" },
};
// 原生 route.list：[{code:1,indent:null},{code:0}]
// 省略 flags 的原生值：repeat=true, skippable=false, wait=false
```

原生新建205的flags与M0工厂形态不同于共享编写默认；反编译必须显式表达这些差异，不按所在页/命令切换默认。M0默认来自原生空白页，普通移动指令的缺indent来自首方工厂构造，null来自插入/最终JSON链推导。非终止记录尚无本轮真实UI保存样本，固定默认不冒称实测结果。

### Child Command Body 与 Body End Marker

子体为 `{commands,endMarker?: "present" | "absent"}`，commands 必填，endMarker 默认 present。Choices 的每项 `{text,commands,endMarker?}` 与 cancel branch `{kind:"branch",commands,endMarker?}` 平铺这些字段；Conditional 的 then/else、Loop 的 body、Battle 的 win/escape/lose 使用该子体对象，替换旧裸数组且无兼容层。

| 子体内容 | endMarker | 原生生成 |
| --- | --- | --- |
| 空 | 省略或 present | 恰一个 `{code:0,indent:父层+1,parameters:[]}` |
| 空 | absent | 报错 |
| 非空 | 省略或 present | 完整内容后恰一个本体尾标记 |
| 非空 | absent | 完整内容，不生成本体尾标记 |

Conditional 缺 else 仍没有 else；`else:{commands:[]}` 保留显式空 else。Battle flags 与所需/禁止分支的组合规则不变。每层嵌套拥有自己的标记，父关闭记录与内层标记不能代替本层标记；外层事件 commands 仍是原接口，最终固定 code0/indent0/parameters[] 不加可选开关。移动路线 M0 与事件 code0 分别判断。

非空无尾标记是用户明确批准的有限支持能力，适用于四类结构及嵌套。Conditional/Choices/Battle 重确认保留这种已有输入的静态证据，不是普通UI创建证明，也不是Loop重确认的实测；空体缺标记、重复/中间标记、错误缩进并未放宽。

**与手写 raw 的合并校验**：endMarker 表示所属子体最终保存结构的状态，不仅是“编译器是否额外添加一条”。正式命令和raw生成后，完整列表校验应确认每个标记的实际归属；raw若让标为absent的本体产生尾标记，或让present体重复产生标记，均报错。合法raw嵌套结构的内层标记不误当外层标记；本票不另行扩大或收紧06已接受的合法手写raw总体能力。不能仅凭commands数组非空就把纯结构记录当普通子体内容，绕过空体或边界检查。反编译仍使用所属正式结构表达已知原生body，不自动降级raw。

### 省略、undefined 与精确比较

本票新增可选字段的显式undefined与省略等价；必填字段、数组元素及稀疏洞不能用undefined制造缺槽。null仅在具体正式契约允许时有效。反编译只省略固定规则能恢复同一保存结构和值的字段，不能借编写默认修补原生输入；例如indent:null、缺parameters的M0、无尾0的非空体和Stop显式0都必须留下相应DSL信息。

沿用06的解析后结构和值比较：对象键顺序和JSON等价文本转义可不同；字段是否存在、数组长度/位置/次序、null和空数组、所有原始值及各层结构记录必须相同。不能在比较前补parameters、删indent、清理0或挑选镜像副本。

205生成每个非终止移动项的505，唯一参数为该项的完整保存对象，保持顺序与键存在性；M0不生成505。已有205/505的数量、次序或完整子对象不一致均拒绝，报告双方精确位置，不选边修复。402镜像继续沿用原规则。

### 校验、诊断与验收交接

Decompile在源码发布前验证可表达性、原生结构及完整候选声明可确定的固定引用；Compile/Compile Check重做正式与raw的完整输出结构、引用和Gate校验；Push沿用Freshness/Drift/Destructive Change/Interrupted Push契约，不从Snapshot补缺失状态。所有保存路线、嵌套体、非custom页与不可达分支都递归检查。

诊断沿用06的稳定标识、阶段、严重级别、事件身份、精确原生/DSL路径及可靠时才提供的源码行列。区分已定类型/范围/必填/互斥等违反契约，当前未覆盖保存形态，以及镜像冲突；缺键与null/[]须能区别显示，冲突给相关两处路径。未知字段与未知移动码继续拒绝；真正未知事件码的原有单记录raw通道不变。若新证据证明被拒绝形态为正常原生，先补正式模型，不永久用raw或归一化掩盖。

以下为08票的必要验收输入，均尚未执行；具体执行环境、证据责任及实施顺序由08统筹：

- Timer：新建Stop、Start0/83改Stop、Stop重开确认三阶段；[1]/[1,0]/[1,83]精确往返，缺/多槽和边界值的正反样本。
- Movement：45类动作在页路线与205的适用样本；无参/有参的缺indent和null，M0两种parameters外壳，空/非空路线、默认/非默认flags及非custom保存路线；新建/插入/替换/copy-paste后真实落盘验证，205/505只差缺键/null也应报冲突。
- Body：Choices、Conditional、Loop、Battle的空/非空/嵌套；非空体present/absent逐层组合、else缺失与显式空、Battle各flags组合；空absent、重复/中间/错缩进0、raw声明冲突及合法raw嵌套的区别。无尾0合成支持样本与普通UI创建样本分开标注。
- Workspace：生成源码可求值并重编译、完整decompile→compile→diff→push精确比较、Gate开关及引用失效、失败无部分发布与无部分写入；保存字段/嵌套体变化必须反映在比较中。
- 编辑器只保存容器、重新确认参数、游戏运行分别记录结果；真实证据反驳静态推导时更新证据和契约，不能把设计批准当作执行通过。

## Comments

### 2026-10-19 — 从逐参数研究中形成明确设计依赖

本票记录已发现的保存结构问题，未认领、未开始 HITL 讨论、没有新模型决议。研究报告保留静态事实、路径推断与真实观察的区别。

### 2026-10-19 — 开始 grill-with-docs 讨论

用户指定本票开展 HITL 讨论，使用 grilling 与 domain-modeling。前置票 11 已解决；本票已认领。先核对停止计时器、移动记录外壳和子体尾 code 0 的证据与既有契约，再按依赖分轮决定正式表达、缺失语义、默认及校验边界。讨论中的候选不自动成为决定；当前没有新增已接受模型，也没有执行产品实现或真实编辑器/游戏验收。

### 第一轮待答 — 三条独立决策分支

- Q1：停止计时器是否采用 `seconds?: number`，省略准确表示没有 p1，显式 0 和非 0 均保留；Start 仍必填，已有普通秒数域为整数 0..5999。替代方案是显式 absent/saved 对象。
- Q2：移动记录外壳是否采用附着在对应移动指令及路线终止项上的有限、具名、按类型校验的保存字段；具体字段、合法组合与固定默认留到下一轮，不引入任意 JSON，也不把 M0 的两种 parameters 外壳推广为所有指令已证形态。
- Q3：是否明确扩展正式支持能力，在正常非空子体的末尾精确保留单个 code 0 的存在或缺失。推荐作为有界产品选择，明确无尾 0 尚无普通 UI 创建证明；空体、重复/中间 0 和错误缩进不随之放宽。若不接受这一扩展，则需精确研究前置来决定唯一生成规则与表示方式，不能把尚未发现反例当作普遍证明。

后续决策依赖：Q2 确认后确定外壳字段与各类型默认；Q3 确认后确定子体接口、终止状态、空体约束和反编译输出；最后汇合精确比较、205/505 镜像、递归校验、诊断与验收交接。以上问题均待用户回答，未修改已接受 ADR 或 GLOSSARY。

### 2026-10-19 — 第一轮 Q1–Q3 已接受

用户回答“接受”，确认本轮三个推荐。以下为已接受决定，完整接口和最终共同理解仍在讨论中。

1. **Q1 停止计时器的可选秒数槽**：采用 `controlTimer({action:"stop",seconds?:number})`。省略 seconds 精确表示原生 p1 不存在，编为 `[1]`；显式 0 编为 `[1,0]`，显式 83 编为 `[1,83]`，反编译不得把存在且为 0 的槽省略。Start 的 seconds 仍必填；两种模式存在的秒数均为整数 0..5999，不接收 null、额外槽位或域外值。不引入 duration 模式对象，也不为 Stop 的秒数补 Compiler Default。作者显式 undefined 的处理留待接口细则。
2. **Q2 移动记录外壳归属**：使用附着于对应移动指令和 Movement Route 所属终止项的有限、具名保存信息，按记录类型限制合法组合；页自主移动与 Set Movement Route 复用模型。205 与 505 从同一份声明生成；M0 不作为用户可重复插入的移动指令。不使用按索引对应的独立保存信息数组或任意 JSON。字段拼写、每种记录的合法组合及固定默认尚未决定；M0 已证的两种 parameters 外壳不自动推广为所有指令均已证的组合。
3. **Q3 非空子体终止的有限支持范围**：对其余结构符合契约的非空 Child Command Body，正式模型精确保留末尾单个 Body End Marker 的存在或缺失。这是明确产品支持选择，适用于 Choices、Conditional、Loop、Battle 及其嵌套；不把 Conditional/Choices/Battle 接受既有无尾 0 输入的静态行为误记为普通 UI 创建证明，也不把它误记为 Loop 重确认的观察。空体、重复/中间 code 0、错误缩进与外层列表终止不随之放宽。具体子体 schema、编写默认及反编译输出继续讨论。

领域术语已记录到 GLOSSARY；架构取舍暂记 [ADR 0015 草案](../../../docs/adr/0015-bounded-native-saved-shape.md)。草案区分已接受原则与待决接口，待完整共同理解确认后定稿。本票保持 claimed，不解除 08 的依赖，不声称产品实现或编辑器/游戏验收通过。

### 第二轮待答 — Q4–Q7

以下是提议，尚未获用户接受，不构成已决默认或支持域。

- **Q4 移动外壳完整候选**：所有非终止移动指令增加 `savedShape?: {indent?: "absent" | "null"}`，默认 absent；这有限表达工厂构造时缺键与插入保存链推导出的 null，不宣称两者均已实测。无参指令不生成 parameters，不允许通过 savedShape 增加空数组；有参指令的数组由正式参数精确生成，不能缺失。Movement Route 增加 `terminator?: {parameters?: "absent" | "empty"}`，默认 empty，M0 一律缺 indent。两使用场景共享默认，无参 parameters:[]、M0 indent:null、任意数字 indent 等未获支持形态按现有诊断边界拒绝。示例 `{kind:"moveDown",savedShape:{indent:"null"}}` 生成 `{code:1,indent:null}`；`terminator:{parameters:"absent"}` 生成 `{code:0}`。
- **Q5 子体完整候选**：统一采用 `{commands: DSLCommand[],endMarker?: "present" | "absent"}`，默认 present。Choices 的 choice 与 cancel branch 在已有 commands 同级加 endMarker；Conditional 的 then/else、Loop 的 body、Battle 的 win/escape/lose 使用该子体对象，不保留裸数组兼容形式。空 commands 仅允许 present，生成深一层的单个 code 0、parameters[]；非空可 present/absent，末尾标记缩进由所属子体确定。else 缺失仍表示没有 else，显式空子体保留 else。外层 commands 保持原接口和固定最终 code 0，不增加此开关。
- **Q6 反编译输出策略**：对于本票增加的可省略字段，仅在固定编译规则能精确恢复字段/槽位存在性、数组长度和所有值时省略；保留差异即可，不要求所有保存字段每次完整展开。Stop 的显式 seconds:0 仍不得省略。该策略不依赖 Q4/Q5 最终选择的具体默认，但实际省略依据必须是已接受默认。
- **Q7 作者 undefined**：本票新增的可选字段中，显式 undefined 与省略等价；必填字段不得 undefined，数组内 undefined/稀疏洞不得代替缺槽，不把它们通过 JSON 序列化转成 null。null 只在字段自己的正式契约允许时有效；移动保存外壳候选使用符号字符串 "null" 表示原生 null。

### 2026-10-19 — 第二轮 Q4–Q7 已确认

用户回答“确认”，接受第二轮全部推荐；上述 Q4–Q7 从候选转为已接受契约，含字段拼写、各记录类别的允许形态、固定默认、所有父命令的子体接口、反编译省略和作者 undefined 规则。

- 移动保存字段固定为 `savedShape?: {indent?: "absent" | "null"}`；普通移动指令默认缺 indent，无参指令缺 parameters，有参指令的参数数组由语义字段产生。路线终止固定为 `terminator?: {parameters?: "absent" | "empty"}`，默认 empty，M0 缺 indent。两种场景共用同一默认，flags 沿用 true/false/false。
- 子体固定为 `{commands,endMarker?: "present" | "absent"}`，默认 present；空体禁止 absent，非空可选。Choices 平铺子体字段，Conditional/Loop/Battle 使用子体对象；外层命令列表的接口与最终终止规则不变，不提供裸数组兼容层。
- 反编译只省略可由已接受固定规则精确恢复的字段；原生数据缺键不借 Compiler Default 修复。可选 undefined 与省略等价，必填或数组项中的 undefined/洞拒绝，合法原生 null 与 DSL 的符号 "null" 明确区分。

下一步汇总正式 Answer、同步受影响参数报告，并核对既有 raw 与完整结构校验规则的交界。最终共同理解确认前，本票仍为 claimed，ADR 0015 仍为 proposed。

### 2026-10-19 — 完整契约待最终确认

已完成Answer汇总与交界核对，没有发现需新增用户取舍的决策分支。endMarker描述最终保存状态，与06的完整输出结构校验共同约束raw；不新增全局raw code0禁令。已同步03/05/06的当前接口说明、08验收输入、五份受影响参数报告、GLOSSARY及ADR0009/0011/0012的关联说明，ADR0015保留proposed。

文档检查：`git diff --check`通过；15份新增/修改Markdown的296个本地链接及标题锚点检查通过。未运行产品测试、编辑器或游戏验收，也未修改产品代码。本票等待用户对Answer整体的最终共同理解确认；确认后才置resolved、将ADR0015置accepted并登记到地图，按依赖机制解除对08的本票阻塞。

### 2026-10-19 — 最终共同理解确认与关闭

用户对完整契约及完成边界回复“确认。改完提交”，确认最终共同理解并授权提交文档。Q1–Q7与本Answer正式定稿，本票改为resolved，ADR0015改为accepted，决策地图登记结论，08按依赖机制不再受本票阻塞。此前Comments中的待答、claimed和proposed均是历史讨论状态，以当前Answer及本条为准。

已同步Timer、移动外壳、子体、镜像、raw合成校验及验收交接的相关文档；本次只提交设计与领域记录，不实施产品，也不声称真实编辑器或游戏验收通过。

提交前文档核验：16份新增/修改Markdown的317个本地链接及标题锚点通过，`git diff --check`通过；08的前置03/04/05/06/07/11/12均已resolved，仅13仍open。历史依赖列表保留，完成状态解除本票阻塞。
