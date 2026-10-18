# MV 1.6.1 指令契约的编辑器静态证据

研究日期：2026-10-18（Asia/Shanghai）。用于 [05 原生指令契约](../issues/05-native-command-contract.md) 的后续讨论；补充 [编辑器保存规则](editor-serialization.md) 与 [指令保真调查](native-command-fidelity.md)。本报告只记录事实、推断与未知，不修改已接受的设计决定。

## 核心发现与证据边界

1. **Show Choices 正常保存为 1–6 项，允许空字符串和纯空格。** 只删除末尾完全空字符串，且至少保留一项；中间空项不会紧缩。把空文字一律报错不符合该保存函数。
2. **Default/Cancel 下拉框始终提供六个选项编号，不按实际文字项数限制。** 保存时直接写出所选编号；实际只有两项也能从这条静态 UI 路径写出 index=5。因此“编号必须小于当前选项数”需要回到用户处重新讨论，不能以当前设计决定否定首方保存事实。
3. **Choices 的新建初值链可以闭合。** 新建以 null eventData 打开新的控件树，不从旧命令加载参数；显式控件初值经 onSave 变为 default=0、cancel=1、position=2、background=0。它们分别是第一项、第二项、右侧和窗口背景。文字初值为本地化 Yes/No。
4. **Conditional 的实际编辑确认会重新生成有条件的 411 与固定 412；每个空 then/else 体补一个深一层 code 0。** 关闭 Else 后确认会移除原 Else 内容，不能把这种编辑操作等同于无操作项目保存。
5. **Loop 新建明确生成 112 → 深一层 code 0 → 413。** Loop 没有参数编辑对话框；其子体随后经命令列表编辑。
6. **Battle Processing 两旗标均 false 时只生成 301，连 604 都没有。** 任一为 true 时生成 601、与启用旗标对应的 602/603、604；缺少内容的各分支补 code 0。关闭旗标后确认，会删除相应结果分支；两者都关闭会删除所有结果分支。
7. **空 Shop 是正常保存路径。** 商品列表为空时仍生成 302，参数为 `[0,0,0,0,purchaseOnly]`；不能仅凭当前 DSL goods 非空元组与引用必须存在的规则排除它。

上述都是随包 QML/JavaScript 的**静态观察和有界路径推断**，没有执行编辑器、游戏或解出的代码，没有真实创建/保存结果。Qt 信号次序、原生辅助对象及最终磁盘结果仍需真实样本验证。报告中的正常生成规则不能自动授权反编译修复已有非规范数据；该政策仍属 06。

## 目标身份、工具和方法

唯一二进制目标：`F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`。本次只读核对大小 **19,595,264 bytes**，SHA-256 为 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，与既有报告一致。

复用已有 REA PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`。该证据及原字节解析确认本体自报 FileVersion 1.6.1.0 / ProductVersion 1.6.1，详见 [既有身份记录](editor-serialization.md#目标身份与版本)；本次不重复取版本 Evidence，不认证发行来源。

本会话没有 REA MCP 工具。按 REA recovery 指南使用已安装的公开 launcher `C:/Users/Shuen/AppData/Local/npm-cache/_npx/a1722018f28f9df2/node_modules/.bin/rea.cmd doctor --client codex --json` 做一次只读诊断：REA 6.7.0、Node 24.14.0；Codex registration aligned、live server unknown；Ghidra/IDA/Hopper/Kuna 不可用。没有 setup、安装引擎或改客户端配置。完整嵌入文本的只读解码不需要这些原生反编译引擎。

资源用普通 Node `fs` / `zlib` / `crypto` 在内存解码，未 eval、载入 QML 或把原生源码副本写进仓库。偏移是 exe 文件头 0 起始；stored 包含外层 4-byte 大端长度。plain 为长度后 UTF-8；zlib 为外层长度、4-byte 解码长度、压缩流。逐条检查解码长度、解压器消耗输入长度及文本 SHA-256。角色来自完整文本内容与引用关系；未重建 Qt resource name/tree，角色不冒充已验证的 qrc 路径。`Q-ID:行号` 是完整 UTF-8 文本按 CRLF/LF 切分的一基行号。

初次定位从已有 Q-BASE/Q-CHOICES 边界沿长度记录读取；为追调用方，补读同一记录段及既有 8,667,116 起始段，搜索边界止于 8,802,185 的下一个不匹配记录。搜索结果只用作定位，以下结论均阅读了相关函数及父控件后得出，不把字符串出现当作执行证据。

| 引用 | 角色 | offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| --- | --- | ---: | ---: | --- | ---: | --- |
| Q-BASE | EventCommandBase | 686141 | 939 | plain | 935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| Q-CHOICES | Show Choices | 706715 | 1413 | zlib | 6097 | `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283` |
| Q-CONDITIONAL | Conditional Branch | 748645 | 1102 | zlib | 5024 | `e94ba6162d753827591839fd6d1aa7d793d40270a6ddbfa5ddbb093476872dcb` |
| Q-BATTLE | Battle Processing | 782932 | 901 | zlib | 3628 | `a492dfc999be4fb3e3ca213300cd9a751649adc8da49edd18efd4ce48544787a` |
| Q-TRANSFER | Transfer Player | 758295 | 1691 | plain | 1687 | `26b948a478069a1ab482a446293cc9529777819d02b592c5decd0d44455ce046` |
| Q-EVENT-LOCATION | Set Event Location | 711364 | 1749 | plain | 1745 | `7262f3ac20254fe2adc352b3117781409176f7945cf501fdcaeaee740f36d4d2` |
| Q-SHOP | Shop Processing | 762570 | 1060 | zlib | 3681 | `35bb0adeba83d80de4d1dc755d3049d8e3bfa52f9229bbc70530eb4d2d40d635` |
| Q-DIALOG | Dialog_EventCommand | 656916 | 1086 | plain | 1082 | `0152387fa661f0e67f45b989248c60142881526cda1f31898e29c0e03366fbf7` |
| Q-LIST | 事件指令列表 | 667573 | 3694 | zlib | 17486 | `bbc1e26fa83771fc56581b1dc34ec762b3789444dacef76cb24334834e17e82c` |
| Q-PICKER | Dialog_EventCommandSelect | 679418 | 1424 | zlib | 7863 | `8e83b762134d12696649e6302adec9f40bbad7618b2c9cbff5ad945f005dd829` |
| Q-CONSTANTS | Constants | 916501 | 5142 | zlib | 25783 | `b29ba19e1bd5ed04e2334aab57ddcbf386331dbe136751c77f05f47a9e35edd2` |
| Q-COMMANDS | EventCommands 编号与 flag 表 | 922020 | 3441 | zlib | 15177 | `dfc6ccb9eb02a7c90acc5b27aa351b912e1847cdc90d00dbb93bb29991ea32a6` |
| Q-LABELED-COMBO | LabeledComboBox | 8797951 | 739 | plain | 735 | `8830bc7b2492b1dd0149c7ced80b5b04742b4c0d81355f99bf6a264341b2f333` |
| Q-LABELED-TEXT | LabeledTextField | 8799522 | 389 | plain | 385 | `20d7752e7a0f74a49842b29e97dee8c59d7b905715e614c495ca5676b8eb8d0b` |
| Q-COMBO | 自定义 ComboBox | 854492 | 2011 | zlib | 8889 | `68f5706dc8e25bec53c589bd7f733ff876a09906028057348b27168859ee8ccb` |
| Q-CHECK | 自定义 CheckBox | 893754 | 1005 | zlib | 3826 | `13ce867d2bf5d9081e234e2cc4b3330a59fad91ed351baddec15b6a553376467` |
| Q-BOX | DialogBox | 834556 | 1689 | plain | 1685 | `15905c5ef78bfc39ed27a65ef029a52c4b892e189ae15fe142fe7c4a5e3639df` |
| Q-BUTTONS | DialogButtonBox | 828547 | 757 | zlib | 3389 | `31427cee1f8f1ccf6425bce07e44216afed78021befafa7f9a8d87e62f077d0c` |
| Q-MODAL | ModalWindow | 878315 | 1884 | zlib | 8437 | `875ac97ba5e20ab1a457399321e9621d3b56a698aaeeadc78c9584f3b69a970e` |
| Q-TEXT-FIELD | 单行 TextField 包装 | 877206 | 73 | plain | 69 | `4c498faa0ec8d1ded0a1fbd1697978a061999a7961ecfc231be4f5176d775727` |
| Q-TEXT-EDIT | TextEditControl | 866210 | 3005 | zlib | 14044 | `12dfecd9a6fdc127a1759552698490bccd5ccf599aa898fd682461f0ed939dad` |

Q-* 是普通本地解码的引用标识，均不是新的 REA Evidence ID。解码方法复用 [可重复读取逻辑](editor-serialization.md#可重复核对不执行目标代码)。

## 新建、重新编辑与无操作保存的不同路径

新建流程：Q-LIST:380–381 打开指令选择器；Q-PICKER:174–184 根据 command flag 判断是否需要参数对话框，为需要参数的命令显式设 `eventData=null`，然后 open。Q-MODAL:24 把对话框内容作为 sourceComponent，:64–67 的 Loader 仅在 childWindow.visible 为 true 时 active，:249–260 负责显示并调用内容的 init。官方 Qt 5.15 [Loader active 文档](https://doc.qt.io/archives/qt-5.15/qml-qtquick-loader.html#active-prop) 说明 inactive 释放已载入对象、再次 active 重新实例化；该文档用作框架语义补充，不冒充目标运行观察。

Q-DIALOG:19–21 用 eventCode 选择 EventCommand 组件；:24–29 将 null/已有 eventData 及 troopId 交给组件并调用 load。Q-BASE:19 调用 init；本报告调查的 Choices/Conditional/Battle/Transfer/Set Event Location/Shop 组件没有另行覆盖 onInit 生成旧参数。Q-DIALOG:33–36 在 OK 时调用 save 并取得新 eventData。**这条链说明被读到的控件初值怎样成为新建命令参数，不能只凭一个 currentIndex 声明推断全部命令默认。**

重新编辑流程：Q-LIST:370–376 取选中片段 slice，传入非 null eventData，打开同一类型参数对话框。各命令 onLoad 恢复控件；onSave 可以重建结构。Q-LIST:425–446 替换片段并调整 indent，只插入参数对话框返回的记录，没有 Choices 值域修正。

项目或事件整体无操作保存并不等于每条指令执行一次 onSave。就已读调用链，命令级 save 由参数对话框 OK 触发；既有 Q-DATA 报告表明 JSON 保存函数没有按 runtime 用途裁剪字段。没有把这条局部观察升级为全部原生 UI 信号/写文件实现的证明。

## Choices 的正常输入、编号及保存

### 最低数量和空文字

Q-CHOICES:21–22 声明本地化 Yes/No 和 maxChoices=6，:33–40 生成六个输入框。:106–115 保存时读取六个 `.text`，只在 `length>1` 且最后一项 `.length===0` 时 pop。

直接静态推断：

| 六个输入框内容（省略的尾槽均为空） | 保存 choices |
| --- | --- |
| 全空 | `[""]` |
| `A, 空, B` | `["A","","B"]` |
| `A, 一个空格` | `["A"," "]` |
| `A, 空, 空` | `["A"]` |

因此数量为 1–6；中间空文字不改变后续选项索引；纯空格不 trim。Q-LABELED-TEXT:8、13–18 直接 alias TextField.text；Q-TEXT-FIELD:3–4 只设最大一行；Q-TEXT-EDIT:66 直接 alias TextEdit.text，:304–309 只处理超过行数时删末字符，不 trim 空格。Q-DIALOG/Q-BOX/Q-BUTTONS 没有针对文字为空禁用 OK 的连接。Help 的“Choices left blank will not be displayed”是概括，不能覆盖此完整保存函数所显示的中间空项和至少一项规则。

### 编号不是实际数组下标的硬范围

Q-CONSTANTS:270–277 是固定模型：Default 为 None、Choice #1..#6；Cancel 为 Branch、Disallow、Choice #1..#6。Q-CHOICES:65–79 将其直接设为 combo 模型，没有根据文字生成动态模型。Q-LABELED-COMBO:10–15 只做属性 alias；Q-COMBO 完整 278 行没有 Choices 输入，:217–225 只根据 combo 自身 count 更新 currentText，没有文字数校验或编号禁用。Q-CHOICES 的完整 172 行中没有 onTextChanged、动态 enabled 或 onSave clamp。

Q-CHOICES:116–125 直接写 `default=currentIndex-1`、`cancel=currentIndex-2`。据上述完整局部链，普通参数编辑可达如下保存形态：两个选项、Default #6 → default=5；两个选项、Cancel #6 → cancel=5；删第二项文字但保留初始 Cancel #2 → 一项而 cancel=1。它们不需要手改 JSON。实际 UI 操作尚未执行。

**重新编辑会产生不同结果。** Q-CHOICES:84–103 的 onLoad 在 cancelType>=choices.length 时把 Cancel 控件设成 Branch；之后确认写 -2 并生成 403。Default 仅做 `defaultType+1`，不会按 choices.length 修正。因此“保存选项编号”与“runtime 当前选择行为”不能合成同一个规范化过程。runtime 也会把 cancelType>=N 视为 -2（`references/RPGMV/NewData/js/rpg_objects.js:9097–9106`），但不能用该运行规则抹掉保存值。

Q-CHOICES:92–94 只回填 `i<choices.length` 的输入框，未清空剩余控件的初始文字。结合新实例的 Yes/No 初始值，可推断一项指令重新打开后第二框可能仍为本地化 No，并在确认时成为第二项。这是需要实际 UI 样本优先验证的静态可疑边界；不能据此全局改写反编译输出。

### 新建初值

与上文新建 null → fresh component → load 不覆盖 → save 的调用链结合：

| 参数 | Q-CHOICES 显式控件初值 | onSave 转换 | 新建值 |
| --- | --- | --- | --- |
| choices | :21、40，本地化 Yes/No | 去掉尾部空槽 | 两项本地化文本 |
| background | :55 currentIndex=0 | :116 原样 | 0 |
| position | :63 currentIndex=2 | :117 原样 | 2 |
| default | :71 currentIndex=1 | :118 减 1 | 0 |
| cancel | :79 currentIndex=3 | :119 减 2 | 1 |

这些是完整静态创建路径支持的初值，不是根据 Help 图片猜测。仍未执行实际新建，且 Compiler Default 是否采用它们由用户决定。

### 分支结构

Q-CHOICES:126–137 顺序为 102、各 402+body、cancel=-2 时的 403+body、404。402 保存 `[index,text]`。:140–169 收集已有分支，空体插入 indent+1 的 code 0，非空体原样保留（含已有 code 0）。这不是普遍给所有非空体再补一条 0。

403 的参数由 :133–134 写 `[6,choices[6]]`；正常 choices 最多六项，该槽为 undefined。按 JSON.stringify 数组语义推断最终为 `[6,null]`，但尚未取得真实磁盘样本，保留这一证据等级。

## Conditional、Loop 和 Battle

### Conditional Branch

Q-CONDITIONAL:67–88 加载条件，并由 :104–115 扫描同 indent 的 411 来恢复 Create Else Branch。:90–102 确认时重建 111 → then body → 可选 411+else body → 412。:117–139 按 411 分割深层命令，空 then/else 各补一条 indent+1 code 0，非空保持收集到的原序列。

由此可确定：省略 Else 与有一个空 Else 是两种正常结构；关闭 Else 后确认只拼接 then，旧 else 内容不再输出；不确认该指令参数时不能拿此函数当作全局删除许可。Create Else Branch 的勾选控件本身未显式给 checked（:61–65），完整新建路径继承 Qt CheckBox 的默认 unchecked，见下文框架补充及其版本限制。

### Loop

Q-PICKER:202–207 对无参数命令生成主记录；eventCode=112 时额外生成 `{code:0,indent:1,parameters:[]}` 和 `{code:413,indent:0,parameters:[]}`。Q-LIST:435–442 插入时整体加 indentOffset，所以嵌套新 Loop 的相对结构一致。

Q-LIST:370–377 只有 flag=1 才打开参数对话框；Loop 的 flag=0（Q-COMMANDS:22，:248–249 读取 flag）。所以 Loop 没有类似 Conditional 的 onSave 重建。新建空体规则已证；命令列表删除/粘贴、缺损 Loop 的全面修复或约束不在本轮覆盖。

### Battle Processing

Q-BATTLE:37–43 载入主记录 flags，:46–71 重建：

| canEscape | canLose | 正常 onSave 结构（不含外层列表末尾） |
| --- | --- | --- |
| false | false | 301 |
| true | false | 301 → 601+win → 602+escape → 604 |
| false | true | 301 → 601+win → 603+lose → 604 |
| true | true | 301 → 601+win → 602+escape → 603+lose → 604 |

Q-BATTLE:73–106 收集原来的三个 body；缺失或空 body 补 indent+1 code 0，非空保留。确认时只拼接启用结果分支，关闭 escape/lose 会丢弃对应旧 body；两者都 false 时连 win 和 604 都不输出。这是**主动重新编辑该指令的生成规则**，不是“任意已保存数据里不能存在其他组合”的证明。

当前用户已接受不自动合并省略与显式空分支；若设计要求普通 authored Battle 严格遵循上表，应明确哪些组合报错，不能靠 compiler 无声添加或丢弃用户分支。反编译已有非规范组合仍由 06 规定。

## Transfer、Set Event Location、Shop

Q-CONSTANTS:339–341 的方向菜单为 Retain、Down、Left、Right、Up；:554–560 对四向映射 2/4/6/8，对 Retain 映射 0。Transfer 的加载与保存见 Q-TRANSFER:37–56，方向存第 5 槽，fade 存第 6 槽。Q-CONSTANTS:303–305 的 fade 顺序为 Black=0、White=1、None=2。

Set Event Location 同用这个方向菜单（Q-EVENT-LOCATION:28–33、36–59），所以 **direction=0 的 Retain 也属于它的正式模式**，不是 Transfer 专有。该命令没有 fade 字段。exchange 模式把 params[2] 写另一个 eventId、params[3] 写 0（:52–58）；这属于实际编辑确认的写法。

Transfer 与 Set Event Location 的方向 ComboBox，以及 Transfer fade ComboBox 未显式设 currentIndex；默认依赖 Qt Controls 1 的非空模型初始选中第一项。新建调用链已读通，具体 Qt 默认的版本匹配证据见下一节；不能用 Choices 显式 currentIndex 的证据替代它们。

Q-SHOP:89–105 载入商品数据及首商品 params[4]；:107–125 重建商品与 purchaseOnly。商品无自定价时明确写 priceMode=0、price=0；自定价时写 mode=1 与对应 price。无商品时保存 `[0,0,0,0,checked]`，从而占位 itemId=0 是这个命令的原生正常结构，并非已有可解析 Item 引用。Purchase Only 控件未显式 checked（:83–87）；新建默认依赖 Qt CheckBox 的 unchecked。

## Qt 控件初值的补充与限制

为避免只凭经验认定隐含初值，本轮先用 Context7 找到 Qt 5.15 官方存档，再只读读取 Qt 官方源站。公开文档解释 Loader inactive 释放对象；官方 Qt Quick Controls 1 源码补充如下：

| 来源 | 静态内容 | 限制 |
| --- | --- | --- |
| [Qt Controls 1 CheckBox，Qt 5.7 分支](https://code.qt.io/cgit/qt/qtquickcontrols.git/plain/src/controls/CheckBox.qml?h=5.7) | :96 继承 AbstractCheckable；:105 注释 unchecked 为 default | 没有鉴定随包 Qt 二进制的精确 patch 版本 |
| [AbstractCheckable，同分支](https://code.qt.io/cgit/qt/qtquickcontrols.git/plain/src/controls/Private/AbstractCheckable.qml?h=5.7) | :86 `checked: false` | 是上游框架源码，不是目标 exe 内的对应实现字节 |
| [ComboBox，同分支](https://code.qt.io/cgit/qt/qtquickcontrols.git/plain/src/controls/ComboBox.qml?h=5.7) | currentIndex alias 到 popup selected index，模型变更路径 :594–606 把该索引设 0 | 完整首次完成信号和随包版本对应仍待进一步钉死 |

Q-CHECK 完整 113 行没有覆盖 checked 初值；Q-COMBO 完整 278 行没有覆盖当前索引初值；上文完整新建流程也没有从旧参数赋值。因此静态路径与官方 Qt Controls 1 语义共同支持 **Conditional Else=false、Battle flags=false、Shop purchaseOnly=false；Transfer/Set Event Location direction=0、Transfer fade=0**。其中布尔默认有上游显式赋值；ComboBox 初值的完整框架首次完成路径与目标随包版本对应仍是较弱环节，不能标成目标内显式工厂常量。实际保存仍未执行。若 05 要求这部分同等强度，保留待补证而不提前省略参数。

本轮取得的上游文本 SHA-256：CheckBox Qt 5.7 `11890a7703be587bedda7ec74a56725e4e51acd873bfb8f723fe4c9f31191ad4`；AbstractCheckable Qt 5.7 `0f9fc058c17a035e7c643cae27e0f2dd2609d7caaeec981fb0a86611cff0cee0`；ComboBox Qt 5.7 `a8c0d10301944b57a36cdffeb17360d876bf24537332ce98eda3489f6f13d5b8`。这些 URL 的分支引用可能移动，哈希标识本次阅读内容，不应称为目标文件自身的 Evidence。

## 完成范围及后续样本

| 问题 | 状态 |
| --- | --- |
| Choices 最少/最多项数、空/空格/中间空项 | 已有完整局部保存及父控件静态依据；未运行 |
| Default/Cancel 是否按实际项数限制、改变项数后的保存 | 已答静态规则；越界编号可由所读普通编辑路径写出；重新编辑的 cancel 归一化另列 |
| Choices 新建默认与旧参数缓存区分 | 静态创建/加载/保存链闭合；未运行 |
| Conditional/Loop/Battle 的正常空体和终止结构 | 已答本轮要求的静态生成规则；无操作全工程保存、异常输入另有边界 |
| Transfer/Set Event Location direction 与 fade 值域 | 已答；Set Event Location 无 fade |
| Transfer/Set Event/Shop/flags 初值 | 新建调用链已读；隐含 Qt 默认有上游框架佐证，精确随包框架匹配/首次信号路径仍未完全闭合 |
| 空 Shop | 新发现正常保存占位；正式 DSL 表达需用户决定 |
| 真实编辑器打开、确认、保存、再次打开 | 未执行 |

最小运行样本应包括：Choices 全空、中间空、尾部空格、两项配 default/cancel #6、一项重新打开是否引入 No；Conditional 新建有/无 Else 与关闭已有 Else；四种 Battle flags 组合及关闭已有分支；Loop 新建与删除最后一条 body 命令；空 Shop；Transfer/Set Event Location 新建方向及 Transfer fade。每个样本区分只保存事件容器与重新确认参数对话框。无需复制或提交编辑器、完整游戏资产或提取出的首方源文本。

本报告不决定 Q5 是否放宽、不改 flags/branches 契约、不把控件归一化当无损规则，也不声称产品已有这些能力或测试已通过。

## 补充：319 Change Equipment 的槽位与物品选择

沿既有内存资源集合有限补读，没有执行目标代码。下表沿用前文 offset/stored/decoded 定义；角色名来自文本内容和引用关系。

| 引用 | 角色 | offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| --- | --- | ---: | ---: | --- | ---: | --- |
| Q-EQUIPMENT | Change Equipment | 718893 | 2099 | plain | 2095 | `0e517b3735cb92510a6d2cadb6801d9b9f851f1a606df2caa4450f2c43a316a1` |
| Q-EQUIPMENT-SELECT | EquipmentSelectBox | 598377 | 2555 | plain | 2551 | `4070f50227431437c02d9889c8f055db95c69d993044affc1ecb473d6d56b8b2` |
| Q-EQUIPMENT-DATA | DataManager | 909009 | 4291 | zlib | 24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| Q-OBJECT-BOX | GameObjectBox | 611197 | 855 | zlib | 4445 | `edea76b1a490abd79bd5fec4111ddbafd6ab379093b0ca993335be6c1f0e4fc0` |
| Q-OBJECT-SELECT | GameObjectBox_SelectBox | 596143 | 230 | plain | 226 | `0ff9fdfdda552f16713c89aa5e903085fbdd9fa9c26967cdb0a5d9baa223c047` |
| Q-OBJECT-ELLIPSIS | GameObjectBox_EllipsisBox | 607446 | 741 | zlib | 2580 | `8c2bc0bf8b611a96c4ab50889c74051e540af35d3ebd553c158081417d05c7bf` |
| Q-OBJECT-COMBO | ObjSelectBox | 8724767 | 2600 | plain | 2596 | `ed2cb9e6480336a216dcf150dd683336822197be1dcf3b374370789e03c897d8` |

Q-EQUIPMENT:19–24 是 actors 数据集的 GameObjectBox，没有 Entire Party、变量或 actor=0 选项；Q-OBJECT-BOX:30 的 includeZero 默认为 false。普通下拉路径的 Q-OBJECT-SELECT 继承 Q-OBJECT-COMBO，后者 :76–82 枚举 actors 数组的 1 到 length−1；扩展选择器路径的滚轮检查要求对应对象存在且具有 name（Q-OBJECT-ELLIPSIS:47–55），其独立弹窗的完整选择行为本补充未继续展开。因此这里证实的是既有 Actor 选择，不将初始数据数量写死为通用数值上限，也不声称已经验证所有无效旧 ID 的重开行为。

**params[1] 的保存语义是 1 起始槽位序号。** Q-EQUIPMENT:15–16 将内部 slotId 绑定 etypeBox.currentIndex；:42–50 按 system.equipTypes.length−1 个槽生成标签，经 DataManager.slotIdToEquipId 为双持第二槽显示 Weapon。Q-OBJECT-COMBO:20、:56–58 在该控件默认 flags 下将 currentIndex+1 作为 currentId；Q-EQUIPMENT:64–71 原样保存 actorId、该 currentId 和物品 currentId。正常可选槽位范围因此是 1..system.equipTypes.length−1，不能把参数名“Equipment Type”误读为永远直接查询同编号装备类型的固定数据库引用。

Q-EQUIPMENT:34–40 的 EquipmentSelectBox 以当前 actor 和映射后的装备类型筛选。Q-EQUIPMENT-SELECT:34–65 先插入 None/value=0，再在未封印该装备类型时列出物品：类型≤1 取 weapons 中 actor 允许的 wtypeId；其他类型取 etypeId 匹配且 actor 允许 atypeId 的 armors。改变 actor/etype 会把选项重置到 None（:24–32）；加载一个不在当前筛选列表中的 itemId 也退到 None（:78–86）。这些是主动打开/确认选择器的行为，不是无操作保存的无损规则。None 是明确原生哨兵，不是一个缺失的武器或防具引用。UI 提示明确写着队伍必须拥有指定物品（Q-EQUIPMENT:37）。

编辑器的双持/可装备判定只读数据库 Actor 与其初始 Class traits（Q-EQUIPMENT-DATA:758–807）。首方 runtime 则在 `references/RPGMV/NewData/js/rpg_objects.js:10293` 调用 actor.changeEquipById，后者 :3653–3658 先算 slotId=etypeId−1，再根据**执行时** equipSlots()[slotId] 是否为 1 决定查 $dataWeapons 或 $dataArmors。equipSlots 的第二槽会因当前 isDualWield 改为 1（:3587–3595）；运行 traits 包括当前状态、当前职业和现有装备（:2369–2371、:3807–3817）。itemId=0 通过数据库空项表示卸下，changeEquip 接受空 item（:3629–3633）。因此编译期不能仅凭编辑器初始 Actor/Class 推断运行时唯一 weapon/armor 类别，也不能把当前库存/可装备筛选升级为必然成功的静态保证。所读 319、选择器及 DataManager 相关函数没有关于未来状态的专门注释；上述差异来自代码路径对照，不冒充文档声明。

## 补充：101 / 105 / 108 / 355 文本空输入、分组与行数

| 引用 | 角色 | offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| --- | --- | ---: | ---: | --- | ---: | --- |
| Q-SHOW-TEXT | Show Text | 729658 | 1731 | zlib | 6309 | `2577da93fb1bc923d0c2f1868cadfcee04deb3d625610ed6493b466114236425` |
| Q-SCROLL-TEXT | Show Scrolling Text | 743190 | 3603 | plain | 3599 | `948fc7aad26ce2dde80be5a25544525ba4cf5839682f52cdb32904b0803f4d24` |
| Q-COMMENT | Comment | 776563 | 1930 | plain | 1926 | `aae3a9a8e122ebb45761438808e1eb613c06f21f0820434a437d54b5d5458e84` |
| Q-SCRIPT | Script | 764174 | 1961 | plain | 1957 | `753c7d5886418fd2f22d0516659d5baa9855f86a53316dbce83bc34b0646dbe3` |
| Q-TEXT-AREA | TextArea 包装 | 826857 | 48 | plain | 44 | `04e14edf4bb1b0279e8d5dd491b8e113639e2ff996580bcc664b6e368e01e599` |
| Q-LABELED-AREA | LabeledTextArea | 8800825 | 882 | plain | 878 | `57ebdcdf7dc151cfe17903a5699724ad3cea67009e7ade0a33d5d2fdae3c62de` |

四组 onSave 均先将 text 按 LF (`split("\n")`) 分行，再且仅在 length>1 时删除尾部完全空字符串，因而至少保留一行。中间空字符串、尾部非空白行中的空格不会被 trim。最小空输入的记录如下（不含容器末尾 code 0；indent 随父列表调整）：

| 命令 | 空 text 的最小保存 records | 静态位置 | 控件行数限制 |
| --- | --- | --- | --- |
| Show Text | 101[faceName,faceIndex,background,position] → 401[""] | Q-SHOW-TEXT:158–175 | 普通输入 4 行，Batch Entry 设为 0/不限（:34、:104–110） |
| Show Scrolling Text | 105[speed,noFastForward] → 405[""] | Q-SCROLL-TEXT:114–127 | 本组件未覆盖 maximumLineCount，继承 0/不限 |
| Comment | 108[""] | Q-COMMENT:59–69 | 6 行（:25） |
| Script | 355[""] | Q-SCRIPT:60–70 | 12 行（:25） |

Show Text 的批量保存按每四行插入一个新的 101，每个 101 复制相同的四个头参数，并为每行生成一个 401（Q-SHOW-TEXT:169–174）；第五行开始第二个组。此为一次编辑操作生成多个独立指令组的功能，不要求 DSL 自动拆分或合并相邻组。其余三类没有四行切组；105 使用 405 续行，108 使用 408，355 使用 655。**空 Script 可由正常 onSave 生成**，不能以当前 scriptInput helper 拒绝空字符串反推原生禁止。

行数上限不是仅有标签：Q-LABELED-AREA:10 把 maximumLineCount 代理到底层 TextArea；Q-TEXT-AREA 直接继承 Q-TEXT-EDIT，后者 :15 默认 0，:156–164 在上限改变时按 LF 裁行，:304–310 在有宽度且行数超过上限时删除末字符。没有执行 Qt 信号/粘贴路径，故不声称所有粘贴输入的精确截断过程均已验证。6/12 是编辑器本组件的输入限制，并非 runtime 续行消费函数本身的长度上限；正式 DSL 是否按已接受的逐参数契约采用它们，仍应明确记录。

这些组件的 onLoad 都用 `join("\n")` 恢复文字；保存函数中没有显式 CRLF→LF 替换，也没有 trim。所读 Q-TEXT-EDIT 将 text 直接 alias 到 Qt TextEdit.text；目标内这层包装未显式定义 CRLF 归一化。Qt 原生文档文本/剪贴板处理、单个原生 parameters 字符串内嵌 CR/LF 的往返仍未验证，不能只凭 split("\n") 推出 CRLF 必定被保存为含 CR 的行。这里不替 06 决定异常原始换行的诊断或保留政策，也不把编辑器重确认时裁尾空行自动施加给 DSL 的已保存行记录。

## 补充：None 素材的有限源码对照

本节只整理本轮已经读取的首方 runtime 与本项目源码，不新增二进制或 picker 调查。以下运行语义不能单独证明每一种空素材均能由普通编辑器操作生成；各素材选择器是否提供 None、空素材时保存哪些 index/volume/pitch/pan 等字段，仍需逐参数证据。没有执行这些源码，也没有进行生成源码求值或 round-trip 测试。

### 当前正式 helper 与反编译的缺口

`packages/rpgmaker-event-dsl/src/authoring/references.ts:32–64` 的 audioAsset、imageAsset、movieAsset 都通过 assertNonEmptyString 拒绝 `name: ""`；`src/authoring/shared.ts:31–35` 只检查字符串类型及 length===0，不 trim，因此纯空格不是相同情况。相比之下，`src/domain/references.ts:444–470` 的 isAssetReference 只要求 name 为字符串并检查类别/目录，手写对象可以绕过 helper 的空名限制；这不构成正式 helper 已支持 None 的证明。

`src/commands/audio/decompile.ts:45–75` 接受原生空 movieName/audio.name，并生成 movieAsset/audioAsset 的空名调用。因此即便反编译没有退为 Raw DSL，生成的正式源码仍可能在调用 helper 时抛错。同类空名渲染出现在 map 的 battleback/parallax（`src/commands/map/decompile.ts:17–65`）、actor images（`src/commands/actor/decompile.ts:167–180`）、movement route audio（`src/commands/movement/decompile.ts:451–460`）与 showPicture 的 imageAsset 渲染（`src/commands/screen/decompile.ts:77–78`）。这是静态矛盾定位，不声称已经执行复现或完成这些命令全部参数的审查。

Show Text 当前可通过省略 face 编译空脸；但是 `src/commands/message/decompile.ts:55–60` 在 faceName 为空时省略整个 face，从而也省略原生独立保存的 faceIndex。None 的正式表示应同时说明这种伴随字段的保留规则，不能仅因运行时不显示就判定它没有保存意义。

### 已确认的首方运行语义

以下路径均相对于 `references/RPGMV/NewData/js/`。表中的空素材指该命令原生参数中的空字符串，不把它等同于任意字段的 null。

| 原生槽位/命令 | 空名的运行行为 | 已读依据 |
| --- | --- | --- |
| Play BGM / BGS | 停止当前对应播放，不创建新的音频 buffer；仍更新当前音频记录 | `rpg_managers.js:1175–1194`、`:1264–1276` |
| Play ME | 先 stopMe，再因空名不创建新 ME；stopMe 还可恢复此前暂停的 BGM | `rpg_managers.js:1329–1361` |
| Play SE，包括移动路线调用相同播放器的槽位 | 空名时不播放，也不停止已有 SE；不同于 Stop SE | `rpg_managers.js:1364–1385` |
| Play Movie | 空名时跳过播放和 video wait 设置，继续推进解释器位置 | `rpg_objects.js:10032–10042` |
| 通用图片加载 | loadBitmap 收到空文件名返回空 Bitmap | `rpg_managers.js:859–878` |
| Change Parallax | 保存空名字和相关滚动字段；渲染器更换为空 Bitmap | `rpg_objects.js:6098–6110`、`rpg_sprites.js:2384–2397`，结合通用图片加载 |
| Show Picture | 仍新建并保存 Game_Picture 及其位置/变换等字段；空图片不等于 erasePicture | `rpg_objects.js:893–899`、`:9913–9924`，`rpg_sprites.js:1934–1947`、`:1989–1990` |
| Change Battle Back | 写入空字符串会使 Overworld 背景选择明确返回空名；不同于地图内部未指定背景的 null/自动选择状态 | `rpg_objects.js:6093–6095`，`rpg_sprites.js:2513–2552`，尤其 `:2538`、`:2547` |
| Actor / Vehicle / 路线角色图像、Actor battler 图像 | 这些名字交给相应图像加载路径；空名字走空 Bitmap，不应凭名字为空删除整条图像变更记录 | `rpg_objects.js:10320–10336`，`rpg_sprites.js:238–248`、`:787–793`，结合通用图片加载；本节未完成每个 picker 的保存链 |
| Show Text face | 空名字不为脸图预留正文左边距；图像加载仍按空素材处理 | `rpg_windows.js:4487–4496`，结合通用图片加载 |

这些行为支持按具体参数定义 None，而不支持统一改写为空操作、stop 或 erase。若 DSL 用 null 表示原生 None，编码必须明确到字段；例如 battleback 的 None 若对应本节所述行为，应编码原生空字符串，不能借用 Game_Map 内部 null 的另一种运行含义。空素材时的独立参数是否保留仍应依已保存数据契约处理，不能由 runtime 是否使用它们决定。

同样，None 素材、空 Shop 的 itemId=0 占位、319 的 None=0 都不等于缺失的 Project Data Reference。当前 `src/validation/references.ts:65–89` 的 resolver 对不存在的 ID/name 报错。具体原生哨兵可以由该命令契约表达，无需因此放宽所有项目引用的存在性规则。

## 补充：Switch / Variable 范围的 Help 与 runtime 证据

本节转录本轮 command_context_facts 的只读补查结果，未重新调查、运行或新增二进制解码。证据来自随包首方 Help 和 NewData runtime，独立于前文 Q-* 本体资源；路径均相对于 `references/RPGMV/`。

`Help/page/01_10_02.html:32,48` 说明开关与变量的连续范围；`:86,99–100` 给出 Constant / Random 控件可输入值为 −99,999,999..99,999,999。这是相应编辑输入范围，不应当作运行变量值的统一裁剪界限：`NewData/js/rpg_objects.js:563–568` 的变量赋值没有按这两个上下限裁剪运行值。

`NewData/js/rpg_objects.js:9416–9420` 对 Switch 目标 ID 执行连续闭区间循环；`:9424–9448` 对 Variable 目标执行相应循环。Random 的采样位于每个目标的循环内（`:9435–9436`），因此每个变量独立取样；其余 operand 在目标循环前求值一次。反向目标区间不会执行目标循环，但非 Random operand 仍可在循环前求值。Random 的逆序端点不会被自动交换；编辑器对反向范围控件的实际处理尚未核实，不能从 runtime 推导其正常可创建性。

此外，`:8977–8993` 的 actorFromVariable 路径在读取到运行值 0 时作用于全队。这是变量读值后的原生选择语义，不等于定义一个 Actor 数据库 ID=0，也不授权编译器预测该变量在执行时必然指向某个具体 Actor。
