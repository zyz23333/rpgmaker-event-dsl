# MV 1.6.1 逐参数证据：消息、流程、条件、变量与物品

研究日期：2026-10-19。对应 [原生指令逐参数契约还缺哪些证据](../../issues/11-native-command-parameter-evidence.md)。本报告完整覆盖顶层代码 101、102、103、104、105、108、111、112、113、115、117、118、119、121、122、123、124、125、126、127、128、129、355、356，以及其所属 401、402、403、404、405、408、411、412、413、655 和正常 code 0。未执行编辑器、游戏、解出的 QML/JS 或产品测试。

## 阅读规则与已决输入

依据 [指令契约 Answer](../../issues/05-native-command-contract.md#answer)、[往返契约 Answer](../../issues/06-semantic-roundtrip-policy.md#answer)、ADR 0011/0012。以下区分 **S**（目标内首方静态源码观察）、**I**（由读到的代码路径推断）、**D**（用户已决产品规则）、**C**（供实施规格采用的机械字段映射/候选拼写，尚未成为新增用户决定）。`p[n]` 是零起始 parameters 槽位；`[]` 表示确切零参数，不代表遗漏 parameters。引用 `Q@offset:line` 是下方资源身份表所列完整解码文本的一基行号；它不是 REA Evidence ID。

每节的 schema 用现有有意义字段和已决 Schema-First 规则描述所需数据，**不能拿当前 helper 的裸数字、位置参数或缺字段充当规范**。已决形状直接标 D；未定的新名字使用 C，数据需求不因此未答。没有已决 Compiler Default 的字段，在本证据表中明确填写；其编辑器初值不自动成为 DSL 默认。可选默认候选集中列明，避免在事实研究中悄悄新增省略许可。

通用校验（D）：确认的类型/枚举/范围、必需槽位、互斥模式或结构不符为 error；固定 Project Data Reference 缺失/重名为 error；变量/开关必须指向最终 System 有效容量，允许其中无名槽，ID 0 不允许。Runtime Selector 的合法位置在当前容器不存在为 warning，并保留；Common Event 无可用上下文时不猜命中。可识别 raw 参数也执行相同检查，已知原生无法正式表达不得降级 raw。Script Command Gate 在编译时遍历所有保存子体；反编译可产生 Script Input 并报告所需配置，不自行开 Gate。

共享数值控件证据由主代理合并于 [共享控件与保存证据](shared-controls.md)：随包 `references/RPGMV/QtQuick/Controls/qtquickcontrolsplugin.dll` SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6` 的 SpinBox.qml（offset160589、stored3826、zlib、decoded13133）将value/minimum/maximum/step/decimals映射到SpinBoxValidator；Ghidra构造函数 `FUN_1000d330` 的 Evidence `ev_0abda227cbae2d1ac569a8e0af403fc960727b39b3d337287fe4165a16926d1d` 确认decimals0、value0、step1、bottom0/top99。本文未覆盖decimals的SpinBox按整数编辑；E122覆盖最小/最大值后0仍在域内，Timer同样0在域内。对于minimum1而基类value0的Group_Operand，最小值setter与componentComplete的完整初始化时序仍未观测；不据此断言实际首次保存0或1。Ghidra只作静态证据，没有编辑器执行。

共享操作初值S：Q@680842:20–33的Group_Operation以第一按钮checked=true给operationType=0；各命令替换显示文本但不改变此编码。GameObjectBox初值ID1（Q@607446:12）与System变量/开关控件初值ID1（Q@604662:12、Q@596373:12）只是编辑器选择器初态，不构成DSL的隐式目标。

原生 `null`/空字符串/0/槽位缺失各自不同。除命令明确的 None 外，数据库 ID 0 不当作合法引用。文本/名称保留空字符串、空白和大小写；四类行记录特有 LF 限制不推广到 note、Label、Plugin Command Line 或单参数 Script Input。

## 第一手来源与可复核方法

唯一编辑器目标：`F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`，19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，本体自报 1.6.1。身份与已有 PE Evidence 见 [编辑器保存规则](../editor-serialization.md#目标身份与版本)，本轮不重新认定发行来源。

runtime 根 `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/`；下文 `O`=`rpg_objects.js`，`W`=`rpg_windows.js`。这些随零售编辑器提供的首方文件优先于社区 CoreScript。读取时校验了本报告末尾身份表中的文件哈希；没有运行它们。

内嵌资源沿已知记录边界读取，方法同 [可重复读取逻辑](../editor-serialization.md#可重复核对不执行目标代码)：plain 为 4-byte 大端长度+UTF-8；zlib 多一个 4-byte 解码长度。校验解压输出长度、消费的输入字节和 SHA-256。只在内存阅读源文本，报告只提交原创归纳。资源角色按读写关系判定，不伪称已还原 qrc 路径。沿基类、调用控件、父对话框追踪，字符串搜索只作定位。

共享 S：Q@686141:13–24 只声明 save 信号；`makeSimpleEventData()` 显式创建 `[code,indent,[]]`，没有通用的保存时清空参数。多数简单指令只在 `!eventData` 时调用它，因此修改旧参数时保留未触及的槽；E111/E122 等显式重建数组则不同。新建/重编辑/整体项目保存必须分开，完整创建调用链见 [指令契约编辑器证据](../command-contract-editor-evidence.md#新建重新编辑与无操作保存的不同路径)。

## 消息与文字

### E101 — Show Text

正式表达：D `showText({lines,...})`，每 helper 一组 101；C 保留 `face:{image,index}`，将 `image` 扩为 faces Asset Reference 或 `null`，`index` 为独立字段；`background`、`position` 使用枚举。`face.image=null,index=非零` 不得被省略整个 face 破坏。

| 字段/组 | 原生映射与值域 | 固定默认 / 原生新建初值 | 校验、出处 |
| --- | --- | --- | --- |
| face.image | p0 string，None 编为空字符串；非空 faces 素材名 | 未新增默认；S ObjImageBox 初值 `""` | Asset Reference 类别 faces；None picker 已证，Q@625536:11–15 → Q@8723218:24–25,34–62 → Q@8787441:50–56 → Q@618109:247–264 |
| face.index | p1 integer，首方Help规定144×144帧、2行4列（`references/RPGMV/Help/page/01_11_01.html:53–55`），标准 576×288 素材为 0..7；实际 picker 按图片高度动态分帧，**没有证据支持通用硬上限7** | 未新增默认；S 初值0 | 与 None 独立保存；扩展素材域见下方阻塞项 C-FACE；Q@638194:25–44,89–92 |
| background | p2 0 window / 1 dim / 2 transparent | C 候选 window；S 新建0 | 完整枚举；Q@729658:74–88,164–168，Q@916501:259–265 |
| position | p3 0 top / 1 middle / 2 bottom | C 候选 bottom；S 新建2 | 不是 Choices 的 left/center/right；同上 |
| lines | 1..4 个 string，每个一条401 `[text]`，同101 indent | D 必填，`[""]`合法、`[]`错误，无内容默认 | 每元素禁内嵌LF、CR字面保留，保留尾空行；Q@729658:158–174，O:9058–9084 |

S 批量输入可以输入大于4行，但保存循环每四行插一个新的101，所以不能用批量模式证明单组超过4条401。保存函数会裁尾空行，D DSL 明确保留；该差别是已决编辑状态政策，不模拟用户重新确认。原生 runtime 在101之后能联接相邻102/103/104等待输入（O:9067–9081）；DSL 不需合并 helper，测试须验证相邻记录顺序保持。

最小验收：有脸/None各配非零index、三种背景×位置；1/4行、空白/尾空行、CR字面；五行批量原生保存应形成两组；101后各接102/103/104；576×432三行脸图的index8样本交 C-FACE。

### E102 — Show Choices

D `showChoices({choices:[{text,commands}],defaultChoice?,cancel?,position?,background?})`。choices 1..6项，text string（空/空白均保留），commands 必填可空。

| 字段/组 | 原生映射 | 固定默认 D / 新建 S | 校验 |
| --- | --- | --- | --- |
| choices文字 | p0 string[]；顺序位置i对应402 `[i,text]` | 无默认 / 本地化Yes、No | 402镜像必须等于主列表，不择一修复 |
| cancel | p1：disabled=-1、choice=index0..5、branch=-2 | choice1 / 1 | choice位置超过当前项数只warning，仍保留；branch必须commands |
| defaultChoice | p2：none=-1、choice=index0..5 | choice0 / 0 | 同样允许不存在的保存位置并warning |
| position | p3：left0/center1/right2 | right / 2 | 枚举error |
| background | p4：window0/dim1/transparent2 | window / 0 | 枚举error |

结构 S/D：102→每项同级402+深层body→可选403+body→同级404 `[]`；每个空体补深一层code0 `[]`，非空体不普遍强加0；403由Q@706715:133–134写`[6,choices[6]]`，正常最多六项所以JSON.stringify落盘`[6,null]`是I，仍待真实保存核对。404无参数。所有子体递归引用和Gate检查。Q@706715:21–79,106–169；Q@696269:262–274显示402文本；O:9088–9128消费选择。runtime把p1>=项数视作-2，不授权编译器改保存p1。

最小验收：1/6项、全空/中间空/尾空、2项而default/cancel=5、每种取消模式、空分支、嵌套、403真实落盘、402冲突必须拒绝。已有报告讨论的一项重开可能引入No及重确认把越界cancel改branch，须与单纯打开保存分阶段记录。

### E103 — Input Number

`inputNumber({variable,digits})` 两字段必需；p=`[variableId,digits]`，digits整数1..8；无None。固定默认不新增；S 新建digits=1、variable控件初值1（Q@785795:15–44；Q@604662:12）。变量引用遵循最终System容量，不能把控件初始1转成隐式目标。O:9131–9142；W:3969–3972把玩家初始显示值夹到0..10^digits−1，这是运行输入逻辑而非任意变量存值约束。验收digits1/8、未命名槽、邻接101、玩家取消/确认行为与存值。

### E104 — Select Item

`selectItem({variable,itemType})`；p=`[variableId,itemType]`，itemType完整枚举1 regular、2 key、3 hiddenA、4 hiddenB（Q@916501:220–221）。C候选具名枚举；未新增省略许可。S 新建p1=2（Q@767603:21–43），变量控件初值1。固定引用是**写入结果的变量**，不是被选物品引用。runtime p1 falsy时回退2（O:9154–9156）不证明省略/0是当前编辑器正常新建形态；正常两槽，缺槽应按ADR0012待证/拒绝而不是补默认。取消写0是运行结果，不是variableRef0。验收四种类型、空库存、取消、邻接101；缺槽/0合成样本与原生样本分开。

### E105 — Show Scrolling Text

`showScrollingText({lines,speed,noFastForward})`；p=`[speed,noFastForward]`，后接同indent的405 `[text]`。speed整数1..8，noFastForward boolean；lines至少1，无已决最大数；文本映射同E101。固定默认未新增，C候选speed2/noFastForwardfalse；S speed显式2，boolean未显式checked，继承Qt默认（强度低于显式赋值）。Q@743190:49–64,100–126；O:9159–9170。验收speed1/8、空内容、9行以上、禁用/允许快进、CR/尾空行、孤立405拒绝。

### E108 — Comment

D/C对象形状 `comment({lines})`，替换位置数组；必需1..6 string。108第一行 `[text]` + 同indent408后续行；空内容`[""]`，最多六条总记录，不是六条408。无Compiler Default；S 文本控件未显式text，正常新建空字符串，保存split后至少一行。Q@776563:18–25,43–68；O:9173–9180。runtime把内容收集到`_comments`，无原生游戏操作，但不可忽略插件可能读取。验收1/6行、尾空白、CR、7行及孤立408拒绝；无Gate。

## 条件、循环与调用

### E111 — Conditional Branch

D `conditional({condition,then,else?})`；condition和then必需；else缺失与`else:[]`不同。111参数完全由所选condition模式决定；父结构111→then→可选411 `[]`+else→412 `[]`，标记同indent、子体深一层。空体code0；Q@748645:90–138。下面 C字段拼写沿现有领域含义按Schema-First整理，数字是原生编码而不是建议公开裸参数。

| condition模式及必需字段 | 精确原生p / 枚举、范围 | 引用与校验 / 第一手源码 |
| --- | --- | --- |
| switch `{switch,value:boolean}` | `[0,switchId,value?0:1]`，三槽 | System switch引用；Q@661534:230–238；O:9186–9188 |
| variable `{variable,operator,value:{kind:constant,value}\|{kind:variable,variable}}` | `[1,leftId,source0或1,rightValue或ID,op]`；op eq0/ge1/le2/gt3/lt4/ne5；常量整数−99,999,999..99,999,999 | 两侧变量都解析；互斥来源；Q@661534:93–100,239–248，O:9189–9217 |
| selfSwitch `{selfSwitch:A\|B\|C\|D,value:boolean}` | `[2,letter,value?0:1]` | 非项目引用；需要解释器eventId>0才读取，未知/不适用上下文warning；Q@661534:250–252，O:9218–9223 |
| timer `{seconds,operator:ge\|le}` | `[3,seconds,ge0或le1]`；整数秒0..5999，99分59秒 | timer未运行则条件false；Q@661534:174–190,254–256，O:9224–9232 |
| actor `{actor,check:{kind:inParty}}` | `[4,actorId,0]`，**三槽** | actorRef；Q@658002:210–240；O:9233–9240 |
| actor name `{actor,check:{kind:name,name}}` | `[4,actorId,1,string]`；空名允许 | 字面字符串精确比较，无trim；同上及O:9241–9243 |
| actor class/skill/weapon/armor/state | `[4,actorId,checkCode,targetId]`；checkCode依次2/3/4/5/6 | actorRef与classRef/skillRef/weaponRef/armorRef/stateRef必需；无None；Q@658002:218–235；O:9244–9261 |
| enemy appeared `{enemy:成员selector,check:{kind:appeared}}` | `[5,index,0]`，index0..7，**三槽** | Runtime Selector，无all；缺当前成员warning；实际runtime调用isAlive，死亡/隐藏都false，不能仅解释为hidden=false；Q@650223:169–179、Q@8720354:10–42，O:9262–9268 |
| enemy state `{enemy,check:{kind:state,state}}` | `[5,index,1,stateId]` | index0..7+stateRef；O:9269–9273 |
| character `{target:人物selector,direction}` | `[6,characterId,direction]`；player−1/currentEvent0/event正整数；direction down2/left4/right6/up8，**无retain** | selector不是map event项目引用；不存在warning；Q@650223:181–183，Q@612052:44–64；O:9275–9280,9028–9037 |
| gold `{amount,operator:ge\|le\|lt}` | `[7,amount,op]` op0/1/2；amount整数0..9,999,999 | 固定值，不是运行金币上限；Q@703296:38–45,218–220；O:9281–9293 |
| item `{item}` | `[8,itemId]` | itemRef，无None；Q@703296:222–224；O:9294–9296 |
| weapon `{weapon,includeEquipment}` / armor `{armor,includeEquipment}` | `[9,weaponId,bool]` / `[10,armorId,bool]` | 两字段独立，引用必需；bool C候选默认false，尚未新增；Q@703296:225–231；O:9297–9302 |
| button `{button}` | `[11,string]`，枚举ok/cancel/shift/down/left/right/up/pageup/pagedown | 无Script Gate；Q@916501:348–354，Q@703296:233–235；O:9303–9305 |
| script `{script:ScriptInput}` | `[12,code:string]`，允许空，355的12行上限不适用 | Gate，不能预求值；Q@703296:236–238；O:9306–9308 `!!eval` |
| vehicle `{vehicle:boat\|ship\|airship}` | `[13,0\|1\|2]` | enum非项目引用；Q@650223:185–186、Q@916501:281–283；O:9309–9311 |

固定默认：condition及其目标、操作、值必需；else省略表示不存在。新建S：默认选switch（Q@661534:31），该switch控件初始1；Create Else Branch未显式checked，Qt初值推断false。**这不授权凭缺失condition制造switch1条件。** 各条件模式切换的makeParameters新建空数组，actor inParty/enemy appeared不留下旧的p3（与E124不同）。所有then/else递归检查，包括未运行分支和空Script；不存在event/敌人位置warning不等于无损数据可省略。

最小验收：每个条件行至少一例；variable全部6比较×两来源；timer未运行/0/5999；actor全部7子型；enemy隐藏/死亡/缺位置；人物三selector在地图/战斗/公共事件；有/无/空else、嵌套、非法分支、禁Gate脚本藏在then/else仍错误。引用在当前类目存在但同ID其他类目缺失时不得换表。

### E112 — Loop

D要求对象输入；C机械映射 `loop({body})`，body必需且可空，保留现有领域子体字段名并移除旧`loop(array)`位置API。112 p=`[]`，同级413 p=`[]`；空体插深一层code0 `[]`，非空体保留其原结构。S Q@679418:202–207直接创建空Loop，Q@667573:435–442调整整体indent；O:9329–9339。无默认/None/项目引用；子体完整递归引用、Gate、结构验证。验收空/单条/嵌套Loop、脚本在Loop被禁、Break深度、非空原生body尾0的保留责任；不把编译现实现漏遍历当规范。

### E113 — Break Loop

`breakLoop()`，p=`[]`，无参数/默认/None。S picker无参数路径Q@679418:202–207；O:9342–9359从当前位置扫描匹配413并计嵌套深度。D循环外warning保留；不是无害no-op，可能跳过余下列表。验收内外/嵌套Break，参数额外槽必须按已知契约拒绝，不能raw绕过。

### E115 — Exit Event Processing

C MV命名 `exitEventProcessing()` 替换当前简名 `exitEvent()`；p=`[]`，无参数/默认/引用。S O:9362–9365把当前解释器index移到当前list.length；它不等于结束调用者整个游戏流程。验收地图/被调用Common Event内exit，调用者后续命令继续；无Gate。

### E117 — Common Event

C `callCommonEvent({commonEvent})`（helper动词遵循已有命名语义，移除位置ref输入），p=`[commonEventId]`；固定Common Event Project Data Reference必需，无None和Compiler Default。S Q@710524:15–34选择commonEvents，GameObjectBox初始ID1（Q@607446:12）并非隐式DSL目标。O:9368–9380：有效目标才setupChild，继承当前地图成立时的eventId，否则0。不得要求额外Common Event上下文声明，也不做完整调用图保证。验收引用已命名/无目标失败、被地图事件与战斗调用的自身开关区别、递归调用不作为静态确定成功。

### E118 — Label

C `label({name})`，p=`[name:string]`；空/纯空白可保存，精确匹配、不trim，未设置长度上限；name必需无Compiler Default。S Q@790356:15–33直接存TextField.text，无非空检查；新建文本为空。O:9383–9385标记本身无操作。当前列表重复Label为warning，不能自动改名。验收`""`、`"A"`与`" A "`、重复、不同Common Event中的同名。

### E119 — Jump to Label

C `jumpToLabel({name})`，p=`[name:string]`，值域/新建同E118。S Q@771175:15–33；O:9388–9413按完整当前list从头找首个同名118；缺目标warning、重复warning、保留跨分支行为，不增加禁令。无引用解析器/Gate。验收前跳/后跳、缺失/重复、跨indent跳转及branch清理；不要把不同list的Label合成全局命名空间。

## 开关、变量、计时器与库存

### E121 — Control Switches

D `controlSwitches({switch:ref或{kind:"referenceRange",from,to},value:boolean})`；p=`[startId,endId,value?0:1]`，三槽。每个目标ID为最终System有效槽，两端包含、中间无名合法；from≤to，逆序DSL报错不排序。S原生范围控件两端整数1..5000，Q@688564:17–21通过Math.min/max**保存有序范围**，新建Single选中（:41）；值操作第一项ON（共享operation group）。Compiler Default无，目标/值必需；编辑器1..5000控件范围与最终System容量各自独立，不意味着slot5000在项目必然存在。O:9416–9421。验收相同端点、跨无名槽、正逆序、0/容量外；原生反向输入保存有序与DSL拒绝同时记录，二者不冲突。

### E122 — Control Variables

D `controlVariables({variable:ref或referenceRange,operation,value:模式对象})`；目标/operation/value必需，无Compiler Default。前缀p0=startId,p1=endId,p2=operation：set0/add1/sub2/mul3/div4/mod5；目标规则同E121。S Q@736003:27–86,133–142每次`params.length=0`后重建，故切换来源没有正常残留尾槽。

| value模式（所选必需字段） | p3及后续精确槽位 | 值域、校验、首方证据 |
| --- | --- | --- |
| `{kind:"constant",value}` | `[0,integer]`；完整长度5 | D整数−99,999,999..99,999,999；Q@736003:120–121，Q@683885:184–190 |
| `{kind:"variable",variable}` | `[1,variableId]`；长度5 | 有效System变量引用；同上:191–193 |
| `{kind:"random",from,to}` | `[2,from,to]`；长度6 | D两端同常量范围且有序；Q@683885:194–197原生保存排序；DSL不排序 |
| `{kind:"gameData",source,...}` | `[3,sourceCode,param1,param2]`；长度7 | 下表完整八种source；**未使用param2仍明确写0**；Q@683885:198–202 |
| `{kind:"script",script:ScriptInput}` | `[4,code:string]`；长度5 | Gate；空合法、无355行数上限；同上:203–205 |

Game Data子表中的schema为C字段映射，`source`与`value`枚举沿有意义名字复用；enemy/character/party目标必须统一Runtime Selector，不延用裸enemyIndex/characterId。数字只标原生槽。

| source | param1=p5 | param2=p6 | 范围、引用/Runtime Selector |
| --- | --- | --- | --- |
| item0 `{item}` | itemId | 0 | itemRef必需，背包计数，无装备或None语义 |
| weapon1 `{weapon}` | weaponId | 0 | weaponRef，数量排除已装备 |
| armor2 `{armor}` | armorId | 0 | armorRef，数量排除已装备 |
| actor3 `{actor,value}` | actorId | level0,exp1,hp2,mp3,mhp4,mmp5,atk6,def7,mat8,mdf9,agi10,luk11 | actorRef，**没有TP**；不得扩成动态actor变量模式 |
| enemy4 `{enemy:成员selector,value}` | index0..7 | hp0,mp1,mhp2,mmp3,atk4,def5,mat6,mdf7,agi8,luk9 | 无all，无TP；成员缺失warning，runtime返回0 |
| character5 `{target:人物selector,value}` | player−1/currentEvent0/event正整数 | mapX0,mapY1,direction2,screenX3,screenY4 | 同E111人物子集，战斗无目标返回0 |
| party6 `{member:队伍位置selector}` | index0..7 | 0 | 队伍位置非actorId/敌人索引；不存在runtime返回0 |
| other7 `{value}` | mapId0,partyMembers1,gold2,steps3,playTime4,timer5,saveCount6,battleCount7,winCount8,escapeCount9 | 0 | 非项目引用；不同运行计数不可同名混淆 |

S Q@692063:63–98构造每个source参数，:296–302提供8个队伍位置；Q@916501:284–301完整status枚举；Q@8720354:33–36八个敌人位置；O:9453–9542完整gameDataOperand。Q@682177:11–13新建GameData盒为type7,param1=0,param2=0（Map ID）；不自动当value缺省。新建Control Variables操作set、来源constant（Q@736003:41、Q@683885:39）；数值SpinBox的基类value0已由共享控件证据确定；此命令范围允许0，所以constant/random两个输入的静态初值为0，仍未运行首次保存。

运行语义S：Random在目标循环内每槽独立取样，其他operand在循环前只求值一次（O:9424–9450）；变量写入number时floor（O:563–569），不按编辑常量上下界clip；除/模0结果与脚本结果由runtime处理，不提前数学化改写。Game Data缺对象返回0，不替代固定引用缺失error。

最小验收：六操作×五来源覆盖；target含2槽以证明Random独立与Script一次求值；GameData八source每个status编码至少静态fixture，角色/敌人边界、人物三target、party0/7、other十种；未命名目标/来源槽；缺固定引用error、缺runtime位置warning；所有模式原生长度；嵌套Loop中的Script Gate；随机反序原生排序/DSL错误。

### E123 — Control Self Switch

`controlSelfSwitch({selfSwitch,value})`，p=`["A"\|"B"\|"C"\|"D",value?0:1]`；两字段必需，无None/Compiler Default。S Q@714208:37–51，Q@603593 self-switch固定模型；编辑器初值A/ON的combo部分继承Qt首项，operation显式第一项。O:9572–9578只有eventId>0写`[mapId,eventId,letter]`。不把它解析为System Switch；Common Event借调用上下文时可以有效。验收四字母×开关、地图调用公共事件、战斗无有效eventId的warning；值域错误与上下文warning分开。

### E124 — Control Timer（发现正常保存形态，新增设计依赖）

已决原则要求保存独立未使用字段。现有 `controlTimer({action:"start",seconds}) \| ({action:"stop"})` 不足以表达全部静态可达正常保存状态。

| 原生模式/保存形态 | 精确参数 | 证据与字段需求 |
| --- | --- | --- |
| 新建start | `[0,seconds]` | seconds整数0..5999；Q@793186:30–46分钟0..99/秒0..59，:68–69合成；action/seconds必需 |
| 新建stop | `[1]` | Q@793186:63–70先建空params后只写p0；不能无条件补p1=0 |
| 已有start改stop | `[1,原seconds]` | onLoad恢复旧数组；onSave只改p0，stop分支不删除p1；Q@686141没有通用重建；这是I普通编辑路径可达，不需手改JSON |
| 重开已有stop再确认 | `[1,保存seconds]` | onLoad只在原p0=0时读秒数，但onSave stop仍不删旧p1；故不能从disabled控件显示值覆盖保存槽 |

固定Compiler Default无；新建action默认start由operation首项，分钟/秒控件继承数值初值0，静态推断首次start为0秒；真实保存仍未执行。O:9581–9588仅start消费p1，stop不消费，不说明可删除p1。

**C-TIMER（阻塞模型完成）**：推荐候选`action:"stop",seconds?:number`，缺省**不生成槽**，显式0生成`[1,0]`；或`duration:{kind:"absent"}\|{kind:"saved",seconds}`。这不是普通省略为固定默认，须与用户明确；不得选raw、删除p1或给`[1]`补0。核心证据足够建立HITL，不以“实施时确认”结案。最小原生样本：新建stop；start=83秒→stop→保存→重开stop→确认；与未重新编辑的原JSON分别比较。

### E125 — Change Gold

`changeGold({operation,value})`；C value统一`{kind:"constant",value}`或`{kind:"variable",variable}`，operation gain/lose（原生increase0/decrease1）。p=`[operation,source0\|1,valueOrVariableId]`，确切三槽。常量整数1..9,999,999（Q@773339:19–21继承Q@683885:47–48的minimum1）；变量读取值不限这个编辑常量域，可为0/负数；variableRef解析。无None/默认。新建operation第一项、constant模式；基类value0而最小值1，初始化与clamp先后仍需首次保存样本；不选数字DSL默认。O:9591–9595和9040–9043决定正负，不能把lose负变量擅自取绝对值。验收常量1/9999999、变量0/负数、超界error、符号及库存金币实际封顶与保存输入分离。

### E126 — Change Items

`changeItems({item,operation,amount})`；itemRef必需；operation gain/lose=0/1，amount同E125两模式，常量整数1..9999（共享Group_Operand）。p=`[itemId,operation,source,amountOrVariableId]`，四槽，无includeEquipment/None/default。Q@752458:15–47；Q@683885:47–48；O:9598–9602。新建item控件ID1、operation首项/constant模式；不隐式生成DSL目标。验收常量边界、变量负值、缺item/variable错误，实际库存封顶不截断保存量。

### E127 — Change Weapons

`changeWeapons({weapon,operation,amount,includeEquipment})`；p=`[weaponId,operation0\|1,source0\|1,amountOrVariableId,bool]`，五槽。常量1..9999，weaponRef/variableRef必需，includeEquipment boolean独立；C候选省略默认false（编辑器未显式checked，Qt佐证不足以升级D）。Q@725548:30–56在gain时仅disabled checkbox，仍保存checked；**gain+true正常保存状态可经lose+勾选→gain获得**，不能拒绝/清false。runtime gainItem按减去不足部分才处理装备（O:9605–9609），保存状态仍有意义。验收gain/lose×两bool、库存不足且身上装备、变量模式与边界、独立flag往返。

### E128 — Change Armors

`changeArmors({armor,operation,amount,includeEquipment})`；p=`[armorId,operation0\|1,source0\|1,amountOrVariableId,bool]`，五槽。全部值域/模式/默认处理同E127，但固定引用必须Armors，不能混为Weapons。S Q@801043:15–56，O:9612–9616。新建ID1和checkbox默认的证据等级同E127。验收armor独立存在性、gain+true保存、lose库存不足与装备卸除、边界与变量符号。

### E129 — Change Party Member

`changePartyMember({actor,operation,initialize})`；p=`[actorId,add0\|remove1,bool]`，三槽。actor固定actorRef，不能用全队/动态actor；initialize独立保存，remove时只是UI禁用（Q@781359:31–54），**remove+true仍合法保存，不删/清false**。C候选默认false，不新增省略承诺；初值actor控件1、add首项、checkbox继承Qt。O:9619–9634只在add且true时setup actor，remove忽略initialize。验收四组合、缺actor错误、已有角色初始化影响等级装备、公共事件调用与队伍重复添加行为。

## 脚本与插件命令

### E355 — Script

D `script({code})` 或现有Script Input，code必需string，空计一行；仅LF拆分，1..12条原生记录：355 `[first]` + 同indent655 `[next]`，每条确切单string槽。CR原样保留；`"a\r\nb"`编成第一记录`"a\r"`和第二`"b"`，不CRLF归一化。无Compiler Default（空是显式输入），无None。Q@764174:18–25,44–69保存split LF并裁尾，D不裁尾；O:10494–10502执行时为每条增加LF再eval，**这不许可反编译删除已有CR或变更记录分界**。

Gate作用于整个记录组以及任何已识别原生raw的355/655，Loop、条件、Choices内也不遗漏。空code也需Gate；此12行限制不适用于E111脚本条件、E122脚本操作数或移动Script。验收1/12行、13行拒绝、空/尾空/CR/CRLF、单原生记录内LF拒绝、孤立655与错误indent、关闭Gate反编译允许但编译失败。

### E356 — Plugin Command

D `pluginCommand({line})`，p=`[line:string]`确切一槽；空字符串/前后空格/重复空格/Tab/CR/LF按完整字符串保存，不trim、不token重组。原生UI单行控件不是D已决定整行字符串保留的隐式LF禁令。Q@740795:15–40直接读写text；O:10505–10513按字面ASCII空格split再shift，`" X  Y "`产生空command和含空字符串args，Tab不会作为split分隔符。无Compiler Default，空行须显式；不受Script Gate（任意插件可执行什么不在Gate覆盖），Registry只lint。验收精确保存上述空白组、未知插件名称只lint、Gate关闭仍可编译；不使用当前command+args反编译规范化。

## 结构、默认和已发现的前置事项

### 统一正常结构与异常边界

- 原生每条记录显式code/indent/parameters；正常外层列表末尾是code0、indent0、parameters[]。空体code0的indent随父层，不与外层终止混用。
- 401/405/408/655属于紧邻的父组；402/403/404归102，411/412归111，413归112；没有公开独立续行helper。整个输出列表进行验证，不能仅验证单条对象。
- S Q@667573:25–29允许选中0处创建；:165–169把新命令交给insert；:435–443在选中0之前splice插入而不删除0。因此空体插一条命令后的非空体尾0有普通UI静态路径支持；所读Choices/Conditional的makeBlockArray也明确原样收集非空体，不普遍删除其0。当前抽象如何精确表示“非空body的已有尾0”由ADR0012要求保持；若实施schema无法同时重建，不得声称已证明可规范化，应列结构模型依赖。既有研究的生成规则不能代替全量编辑操作调查。
- 403 `[6,null]`是已闭合QML构造+JSON语义推断，实际落盘未观测；它是验收样本，不冒充已执行结果。

### C-BODY 的有界删除与重确认核查

本次只追事件列表、标准弹出菜单和三个父指令的保存函数，没有执行UI，不扩展为全部编辑操作的可达性证明。

| 路径 | 静态结论 | 证据 |
| --- | --- | --- |
| 单独选中body尾code0后Delete/Cut | code0使validItemSelected=false；标准Delete/Cut及相同快捷键动作disabled，不能由所读普通动作单独删0 | Q@667573:25–29,179–202；Q@629475:99–109,139–148 |
| 选中同一body的普通命令并把选择末端拖至尾0，再Delete/Cut | updateCommandSelection寻找结束命令时跳过非外层末尾的0；从上一普通命令向后扩展时遇到同indent的code0即停止。因此这条具体选择路径保留尾0；删除所有普通子命令后仍是空体0 | Q@667573:328–343；实际remove在412–418仅删计算后的selection范围 |
| 插入普通命令到body的code0处 | creationEnabled允许；按所选0的indent在其之前插入，不删除已有0，得到非空body+尾0 | Q@667573:25–29,165–169,435–443 |
| Conditional重确认 | 所有深层记录被收入对应body；仅body.length===0时补0。原本非空且无0不会因此自动补0，已有0也不被删除 | Q@748645:90–138 |
| Choices重确认 | 同样只在缺失/零长度body补0；保留非空body已有记录。删除选项/改变cancel会改变哪些body被输出，但不等于保留同一分支而删除其尾0 | Q@706715:125–169 |
| Battle Processing重确认 | 同样只对零长度body补0；输出由flags选择的分支。关闭flags可能删除整个分支/全部结果结构，不能当作仍保留该body的无0生成路径 | Q@782932:46–106 |

**有界结论**：已证普通创建和插入会保留非空body尾0，且上述同body删除动作保留它；没有在这些路径中找到“保留同一非空body内容而单独删尾0”的普通操作。父指令的重确认函数能接收并继续保存既有非空无0体，属于对该输入的函数行为，**不能单凭此证明无0体本来由普通UI创建**。没有审计所有跨层多选、外来剪贴板或全部版本历史；因此不把有界未发现升级为‘无0必定非法’，也不授权强制归一化。结构HITL票应以已证正常尾0为最低表达需求，将是否需要显式终止存在性与更多正常形态调查分开。

### 默认清单的证据等级

已决可省略默认在本范围只有E102的defaultChoice/cancel/position/background，以及else缺失的结构含义。其余现有API默认不能仅因已实现就升级为已决规范；本表给出显式全字段即可表达的schema和编辑器初值，显式表达无缺口；新增可省略字段需在接口定稿中明确决定并声明固定默认。建议集中处理而非逐命令再次讨论：E101空脸/index0/window/bottom；E104 key；E105 speed2/noFastForwardfalse；E111装备判断includeEquipmentfalse；E127/128 includeEquipmentfalse；E129 initializefalse。目标、引用、核心操作、必需子体没有候选默认。隐含Qt控件初值与显式QML常量分列，不把真实首次保存标成通过。

### 本报告发现且不能由既决规则直接抹平的事项

| 标识 | 首方事实 / 最短反例 | 对既决契约的影响 | 责任 |
| --- | --- | --- | --- |
| C-TIMER | 普通新建stop=`[1]`；start83→stop=`[1,83]`，无需异常JSON | 只有action的stop schema无法做到ADR0012保存槽位存在性无损；不能补0/删83/raw兜底 | HITL决定字段缺失与保存秒数的正式表达，然后E124三阶段原生样本 |
| C-FACE | faces picker固定144px帧、4列；576×432图第三行可写index8..11，runtime也按4列绘制 | 通用index0..7硬约束缺证，且与正常扩展尺寸素材静态可达路径冲突；None伴随index须保留 | HITL明确原生素材尺寸边界/索引域；真实样本验证。不把素材格式建议当文件加载硬约束 |
| C-BODY | 空体新建有0；在此处普通插入命令不删除0，非空体收集代码继续保留0 | 编译非空body时若不产生保存尾0会丢正常结构；尚未证明普通UI可产生同内容但无尾0的形式，不预断两者都正常 | 与主报告结构证据汇总，定位正常编辑列表操作并决定是否有新增模型依赖 |

其余范围的原生模式/枚举/参数数目/数据库类目已逐项列出；正常数据中的硬引用和最终System容量按既决策略验证。没有在这些范围发现理由执行目标本体；本子任务未自行打开/关闭共享Ghidra native session，引用的共享控件Ghidra证据由主代理取得。

验收交接给 [如何证明 MV 事件支持完整并划定实施顺序](../../issues/08-completion-evidence-and-sequencing.md)：各节最小样本组成自动化原生fixture与真实创建/打开/重确认/保存/游戏矩阵；三个状态分开记录。非标准合成异常（额外槽、镜像矛盾、缺续行）只证明拒绝策略，不能替代原生可创建性证据。

## 资源与文件身份

<!-- 本节由本次只读解码记录生成：原软件文本没有写入研究分支。 -->

| 引用 / 角色 | offset | stored bytes | 编码 | decoded bytes | decoded SHA-256 |
| --- | ---: | ---: | --- | ---: | --- |
| Q@596373 GameSwitchBox | 596373 | 2004 | plain | 2000 | `5aaba3b55a3d310b69dd2cb833cf8a864b6785eff31f868a927134c814d7f9a8` |
| Q@603593 SelfSwitchBox | 603593 | 1069 | plain | 1065 | `575592e0d2220e8a333612da0290f81fad98fa6a44ad6a9e59aed445a5fd66a7` |
| Q@604662 GameVariableBox | 604662 | 2027 | plain | 2023 | `73e2e714e76de967386acea78f688e2517b8f7e3761dd86d7a29ebc0e26aba1c` |
| Q@607446 GameObjectBox | 607446 | 741 | zlib | 2580 | `8c2bc0bf8b611a96c4ab50889c74051e540af35d3ebd553c158081417d05c7bf` |
| Q@612052 CharacterSelectBox | 612052 | 1623 | plain | 1619 | `577a37d7bc6dafbc4a5053ba6227e33066c2a6b601780d9d0fcb5dfc8ea80da2` |
| Q@618109 FileListBox | 618109 | 2836 | zlib | 11083 | `2cd5a2d9b73ad52c3ebdd45e1d4ab228fe6adc05e1644be90bc29ceda2d28c36` |
| Q@625536 FaceImageBox | 625536 | 460 | plain | 456 | `28e5ac99d832a6764a3073a4eca8c69e689e57e9fd3c46cff23050c7bc1caa00` |
| Q@629475 StandardPopupMenu | 629475 | 1229 | zlib | 7978 | `f70c81456329484f6af62922a395150be07615d5a17ff097295e4af60382abd3` |
| Q@638194 ImageSelectorView | 638194 | 1222 | zlib | 5016 | `1d00d66ec8159738c77a866c7218d6219eb9d7cb1ecdcce7619abf7214670d9a` |
| Q@650223 Conditional tab Enemy/Character/Vehicle | 650223 | 1259 | zlib | 7019 | `17a808d4d34e5662480ae2932f36c89cc1b510b80aecff834b449b0daf68fde7` |
| Q@658002 Conditional tab Actor | 658002 | 1290 | zlib | 9604 | `0d3f443139f6b271ca58cb38488ba06cbe25a12caf9afceed9f36d118034bb30` |
| Q@661534 Conditional tab Switch/Variable/SelfSwitch/Timer | 661534 | 1451 | zlib | 9745 | `8d0956bba213d04cc07219cbcd95a8b1b1f8b03f438a1443f4c8054bb5aa9c03` |
| Q@667573 Event command list | 667573 | 3694 | zlib | 17486 | `bbc1e26fa83771fc56581b1dc34ec762b3789444dacef76cb24334834e17e82c` |
| Q@679418 Event command picker | 679418 | 1424 | zlib | 7863 | `8e83b762134d12696649e6302adec9f40bbad7618b2c9cbff5ad945f005dd829` |
| Q@680842 Group_Operation | 680842 | 1335 | plain | 1331 | `0d87a64dcdc267fcbce7aca42df12a3b665df6153be84b5701eade6113ed8cc8` |
| Q@682177 GameDataOperandBox | 682177 | 1180 | plain | 1176 | `e2f6b54bdd86f173089e1ee5e9d2abe3280aed190f783693a48a875d843cb056` |
| Q@683885 Group_Operand | 683885 | 1207 | zlib | 6701 | `bfcb7f528bca2e310e6bfa5216c694d66599e9892ac7d55168f6687f312d09f8` |
| Q@686141 EventCommandBase | 686141 | 939 | plain | 935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| Q@688564 Group_VariableRange | 688564 | 752 | zlib | 3436 | `097732922e354ba57eb2587d1698f8ec8d2499a73a77b69fd7ae28d88ed25357` |
| Q@692063 Dialog_GameData | 692063 | 1570 | zlib | 13340 | `c92419a0ec809122d9488b006da7fab45094ee509150e89a53862ab2f35ea2bd` |
| Q@696269 EventCommandTexts | 696269 | 5243 | zlib | 36610 | `da7306813f20eecebc47219dcb07ec947b045f3f675aad47d14be214c3394a0f` |
| Q@703296 Conditional tab Gold/Item/Weapon/Armor/Button/Script | 703296 | 1350 | zlib | 8485 | `bb9e8fe60880075e0357c3ca10e4e577b463f9d4f566adeef26fd6745bcef9b3` |
| Q@706715 Show Choices | 706715 | 1413 | zlib | 6097 | `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283` |
| Q@710524 Common Event | 710524 | 840 | plain | 836 | `6e3cfa0ad6ea408dc7a1cdbac1789aeee31eb7d38ad7faae4ed69c53cd2d166e` |
| Q@714208 Control Self Switch | 714208 | 1384 | plain | 1380 | `0ff2d660fd2678c17b460881dda22c3d9bf885650ee01b01c6645888a7f0c2a7` |
| Q@725548 Change Weapons | 725548 | 1455 | plain | 1451 | `8a5bfaf28d98c7979477019e4c092deaf06e3fa3aaec90370a9ea51793356c4c` |
| Q@729658 Show Text | 729658 | 1731 | zlib | 6309 | `2577da93fb1bc923d0c2f1868cadfcee04deb3d625610ed6493b466114236425` |
| Q@736003 Control Variables | 736003 | 935 | zlib | 4527 | `47268876ada2d3e9f69c748857f9d783fc8c71006b5fc7dc66597f8977c641b8` |
| Q@740795 Plugin Command | 740795 | 961 | plain | 957 | `783cb549eebcedc0ee398f785bf0a3b04397f374625698b28b08988539d39c0f` |
| Q@743190 Show Scrolling Text | 743190 | 3603 | plain | 3599 | `948fc7aad26ce2dde80be5a25544525ba4cf5839682f52cdb32904b0803f4d24` |
| Q@748645 Conditional Branch | 748645 | 1102 | zlib | 5024 | `e94ba6162d753827591839fd6d1aa7d793d40270a6ddbfa5ddbb093476872dcb` |
| Q@752458 Change Items | 752458 | 1172 | plain | 1168 | `69fea40b39a945117350fc231c5096686a811c6427198a1a2e1000996f99540c` |
| Q@764174 Script | 764174 | 1961 | plain | 1957 | `753c7d5886418fd2f22d0516659d5baa9855f86a53316dbce83bc34b0646dbe3` |
| Q@767603 Select Item | 767603 | 1181 | plain | 1177 | `7923b81e770a1b138edb4c602d9ac2383ca4231f73109c35462ecaf7126f8d45` |
| Q@771175 Jump to Label | 771175 | 771 | plain | 767 | `abc5db1a3aea0497fd766badf89af966b77fcd5f5907a9bd39a9b267f679a521` |
| Q@773339 Change Gold | 773339 | 935 | plain | 931 | `f35400e18fed23471bbe10931ac6c333e3322c41712134cbc554e9ad8ec68d8d` |
| Q@776563 Comment | 776563 | 1930 | plain | 1926 | `aae3a9a8e122ebb45761438808e1eb613c06f21f0820434a437d54b5d5458e84` |
| Q@781359 Change Party Member | 781359 | 1573 | plain | 1569 | `e0d19b63c1df46777bd806f0f1729c988f3987e327e60b5095748ec84f0138d9` |
| Q@782932 Battle Processing | 782932 | 901 | zlib | 3628 | `a492dfc999be4fb3e3ca213300cd9a751649adc8da49edd18efd4ce48544787a` |
| Q@785795 Input Number | 785795 | 1158 | plain | 1154 | `224c2dcfac4a9fd22a51ed38c2698612f27db2519a2552503d98c321ccf4d1d2` |
| Q@790356 Label | 790356 | 756 | plain | 752 | `c074ab7d30a0a2da87162112da6abbcd6ec4772555192b42ad55eae6b5bb2bed` |
| Q@793186 Control Timer | 793186 | 586 | zlib | 2048 | `095449887fbb1f73c8a292ee6c304256cb5cd422f7901a53b3acf16a290cd670` |
| Q@801043 Change Armors | 801043 | 1451 | plain | 1447 | `eb40cfd275d715b866cc4e3432e14ca9b1d6b9157ed2477eb76b232a5f0d9d1f` |
| Q@916501 Constants | 916501 | 5142 | zlib | 25783 | `b29ba19e1bd5ed04e2334aab57ddcbf386331dbe136751c77f05f47a9e35edd2` |
| Q@8720354 ObjTroopMemberBox | 8720354 | 1006 | plain | 1002 | `fe77ee989d83b85bcfc1c53ca528ef0ca98510f84a28fb97e87ae06e941890e8` |
| Q@8723218 ObjImageBox | 8723218 | 691 | zlib | 2310 | `c83f4c1884a4bf3cbbd5564e84bc9ae1677561a6d21421b13a0bdbd3f074808e` |
| Q@8787441 Dialog_ImageSelector | 8787441 | 1343 | zlib | 6236 | `07186f580840ab0cccaa2fdb5b22dec768f27b7d67ba804e07354096857c4b50` |

- `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_objects.js`：304315 bytes，SHA-256 `2d43dd9d8974c88a1b82ffa493d6d8a02c4ce1d0dfc8f05e6c0ab731e3f0573e`。
- `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_windows.js`：182643 bytes，SHA-256 `2501aea15906d84a2fb51de20e6dc006f847249674f14802ec2ac2dd5361bb99`。
