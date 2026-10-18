# MV 1.6.1 逐参数证据：角色、战斗与场景指令

研究日期：2026-10-19（Asia/Shanghai）。覆盖 301、302、303、311–326（实际存在的代码）、331–340（实际存在的代码）、342、351–354，共 **33 个顶层指令族**。研究基准 `efb78e3e52ba93459402cce32e1224b16a2932c4`。对应 [逐参数研究票](../../issues/11-native-command-parameter-evidence.md)。

本报告依据 [原生指令契约](../../issues/05-native-command-contract.md#answer)、[语义往返契约](../../issues/06-semantic-roundtrip-policy.md#answer)、[Workspace 输入契约](../../issues/07-workspace-domain-integration.md#answer) 与 ADR 0010/0011/0012。这里是契约证据及其机械展开，尚未实施产品，也未执行编辑器、游戏或提取的脚本。所有真实保存/运行样本交给 [完整性与实施顺序](../../issues/08-completion-evidence-and-sequencing.md)。

## 阅读约定与共用契约

- `P[n]` 为 parameters 的零起始槽。除另行说明外，表中给出完整参数数量，所有字段必填；必填不表示其值不能是空字符串、false、空列表或已证 None。分支标记和605是父命令的内部记录，没有独立公开 helper。
- helper 名依 MV 原生命令和现有公开命名机械对齐；下列模式对象采用已决 Runtime Selector 的 kind/scope/target 风格。具体 schema 拼写是本表的机械展开，不把当前实现中的裸数字 target、操作数或缺失字段当已决规范。
- 所有数字均须有限且符合整数要求；ID/index 使用安全整数。Project Data Reference 用相应 `actorRef/classRef/skillRef/stateRef/enemyRef/animationRef/troopRef/itemRef/weaponRef/armorRef/variableRef`，固定目标必须存在；无名变量槽按最终 System 容量存在性判断，名称不回退 Snapshot。项目引用没有从编辑器数据库容量推导出的额外绝对上限。
- 除 Battle/Shop 已决默认外，本报告把未获逐字段批准省略的输入列为**显式字段**；编辑器初值与固定 Compiler Default 分开记录。新建 UI 选第一条数据库记录不授权 DSL 默认选 ID1。若以后允许更多字段省略，需声明其固定默认；反编译现阶段完整输出这些字段即可精确保存，不构成表达缺口。
- A（角色选择）为 `target:{kind:"runtimeSelector",scope:"actor",target:"entireParty"}` → `[0,0]`；`target:"actor",actor:actorRef(...)` → `[0,actorId]`；`target:"actorFromVariable",variable:variableRef(...)` → `[1,variableId]`。模式互斥，不保留未选择控件的临时值，因为原生仅有一个保存槽。变量执行结果0仍按全队选择，不能拒绝或变成actorRef(0)。
- O（数量操作数）为 `value:{kind:"constant",value:n}` → `[0,n]`；`value:{kind:"variable",variable:variableRef(...)}` → `[1,variableId]`。只接受这两个模式；不把 Control Variables 的 random/gameData/script 模式扩展到这些指令。operation 的 gain/lose 对应0/1（状态add/remove、技能learn/forget另列）。常量范围仅限制字面量，不限制运行变量值；运行时负变量可反转增减效果。
- E（敌人选择）为 `target:{kind:"runtimeSelector",scope:"enemy",target:"enemy",index}` → index，整数0..7；支持全体的指令另可 `target:"all"` → -1。0..7来自本体固定八槽菜单，不随所属敌群人数收窄；隐藏成员占位置，坏Enemy引用被runtime过滤会使后续位置前移，应警告。敌人选择不是 Enemy 数据库引用。
- 本组均无直接 Script Input。Battle 的所有保存分支仍递归执行完整引用/结构/Script Command Gate 校验；手写raw的可识别参数遵循同样规则。上下文不适用、选择当前位置不存在时警告保留；不将警告升为容器禁令，不预测 Common Event 的调用环境。
- 已知code缺槽、额外槽、未知模式、错误类型、已证范围冲突或结构不完整均应诊断，不能自动raw/修复。只由本体当前新建路径证实规范形态，不把“当前对话框重写成这样”提升为全部历史保存形态非法的证明。

## 首方资源身份与定位

目标为 `references/RPGMV/RPGMV.exe`，19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，自报1.6.1。复用版本证据 REA `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`。本轮事实由本体完整嵌入QML/JS只读解码及零售NewData runtime取得，未为这些QML结论伪造REA Evidence ID，未调用Ghidra执行目标。解码方法见 [已有复核逻辑](../editor-serialization.md#可重复核对不执行目标代码)。

`Q@offset:line` 是以EXE零起始文件偏移定位的完整资源文本的一基行号。stored包含外层4-byte大端长度；zlib包含内层4-byte解码长度。每个压缩记录已核对完整解码长度和压缩输入消费边界。角色名来自完整文本内容，不冒充重建的qrc路径。资源只在内存阅读，未发布原软件源文件。

| Q 引用（offset） | stored bytes | 编码 | decoded bytes | decoded SHA-256 |
| ---: | ---: | --- | ---: | --- |
| 598377 | 2555 | plain | 2551 | `4070f50227431437c02d9889c8f055db95c69d993044affc1ecb473d6d56b8b2` |
| 607446 | 741 | zlib | 2580 | `8c2bc0bf8b611a96c4ab50889c74051e540af35d3ebd553c158081417d05c7bf` |
| 618109 | 2836 | zlib | 11083 | `2cd5a2d9b73ad52c3ebdd45e1d4ab228fe6adc05e1644be90bc29ceda2d28c36` |
| 625536 | 460 | plain | 456 | `28e5ac99d832a6764a3073a4eca8c69e689e57e9fd3c46cff23050c7bc1caa00` |
| 625996 | 437 | plain | 433 | `6ec9ee818f3ef58e70336c8d8f7e301ebac2df86ea49592abfb45e1b0e1853e9` |
| 638194 | 1222 | zlib | 5016 | `1d00d66ec8159738c77a866c7218d6219eb9d7cb1ecdcce7619abf7214670d9a` |
| 641925 | 962 | plain | 958 | `e04e2333308248a392de8783ebfa3a044d0d722963f3f8990cada25715441e29` |
| 652278 | 651 | zlib | 2282 | `8ab9f2c8845ed4dfea4beff6480f88b74bd939dac582103adbd2bf7d6f468625` |
| 659292 | 579 | zlib | 2049 | `d265b93a0e7c8294ede8e25d33b9368024efe1d09aaf5a0cba0433b5050546bb` |
| 672127 | 711 | zlib | 2587 | `136ed5941165595e3700dfc4e7e6f40951524c9fac9ba469ec87d6db0e9b0c7a` |
| 675223 | 1190 | zlib | 7945 | `68b5ffb34022a960b2525bb7c11377141a6f2139a833de7fe0eb722290103f43` |
| 679418 | 1424 | zlib | 7863 | `8e83b762134d12696649e6302adec9f40bbad7618b2c9cbff5ad945f005dd829` |
| 680842 | 1335 | plain | 1331 | `0d87a64dcdc267fcbce7aca42df12a3b665df6153be84b5701eade6113ed8cc8` |
| 683885 | 1207 | zlib | 6701 | `bfcb7f528bca2e310e6bfa5216c694d66599e9892ac7d55168f6687f312d09f8` |
| 686141 | 939 | plain | 935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| 691763 | 300 | plain | 296 | `0df05b338c080d0388ae00253c9ccd086cfe8b918746e8d1ace4fc19f7e71816` |
| 708873 | 1361 | plain | 1357 | `2ee8f69349df56afc1c205c4773c4088e96995d5e8683c75f00ca691864b4858` |
| 713113 | 1095 | plain | 1091 | `da6871c1cb0d3cdec008b2fd2b8a62e7b54caf7bbb0281601f3e4d3809f843b3` |
| 715592 | 1116 | plain | 1112 | `3cf9003cbf85f3b02b9b23df0af4abb8b6f829d763e3b55957f8bd18d908782f` |
| 718893 | 2099 | plain | 2095 | `0e517b3735cb92510a6d2cadb6801d9b9f851f1a606df2caa4450f2c43a316a1` |
| 721727 | 1116 | plain | 1112 | `e4b4d61825ecd872d327bf3f329d34b318979c7a35c420b3186607caf7ef96af` |
| 724163 | 1385 | plain | 1381 | `36c29bc990521a0452c3b5aee0c0f4d8b8f4ae1f8267d25cb387c6d1dcda7607` |
| 728891 | 767 | plain | 763 | `c2e337fdc0dab2e6bc2b04dfbef678bfbe91470e492e5d179c97909672c7a1f4` |
| 732733 | 1018 | plain | 1014 | `685ded00629658dd89f64342e2fea085d01d7840c39ee4299bda12babe6175bd` |
| 735205 | 798 | plain | 794 | `eec0882b36f41b1545d7ae0cad554a25277d6586dff297dbd2c4c508d51abd42` |
| 736938 | 1122 | plain | 1118 | `13131ddd62b6f8e92e68497b84a95c17e4efbf6d03f59accb77490ccdeae2223` |
| 741756 | 1434 | plain | 1430 | `ed7260d5b0e70b1f1a56657fd30b997a1f4b5dce1ffc9db1c8edfd3d602f62f4` |
| 746793 | 1034 | plain | 1030 | `ac56677374938c7d9e4c43b73ca123d5880bc817a6bce8039d444aae9c75e0b6` |
| 749747 | 2423 | plain | 2419 | `316ffc934f719c54e25669569ece8493d3b2193a4d0fdcc7ce6ed5c1ffe4cd28` |
| 755493 | 1465 | plain | 1461 | `ca3eb6f744c13811d3c2434cb1629364b8bf824f88b86d99ab8aff73b6f47c16` |
| 759986 | 728 | plain | 724 | `d94b849034818320bccc831b3a951c1e3adfcdd30aab494adfeed94c402ef463` |
| 762570 | 1060 | zlib | 3681 | `35bb0adeba83d80de4d1dc755d3049d8e3bfa52f9229bbc70530eb4d2d40d635` |
| 766135 | 1468 | plain | 1464 | `61b5f7c5947129d54aa3cf336ea730717a66c015287b0492063f63e98b2af0bc` |
| 768784 | 1779 | plain | 1775 | `997b186ab8ba24203b40b23dd6683afc0074a9e296982c6340729a8643bb65f2` |
| 774797 | 1156 | plain | 1152 | `5558be86753ed03e5b57ae76c14d7342436587cd5cf34d16980fac4c19e0ba13` |
| 779933 | 1426 | plain | 1422 | `a1804d2cdb84b136f4b74d0a18180e605810343a878a001f0ac31caca755f078` |
| 782932 | 901 | zlib | 3628 | `a492dfc999be4fb3e3ca213300cd9a751649adc8da49edd18efd4ce48544787a` |
| 784374 | 1421 | plain | 1417 | `836a25113f282270f4fad2e3e9458182ca80911f76b20ee79f6966df99a03c67` |
| 788887 | 673 | zlib | 2578 | `d65004b296d1ca2c912e2ffad250bfdfe663dad4be013814b0ec80ae66c6e046` |
| 792645 | 541 | zlib | 1793 | `fb2e813dae6b00ae3f82f9cd79786e2f42eadd13616bcc06ad2f56aaeb019a22` |
| 794801 | 1424 | plain | 1420 | `ae84298fff1158f5d45a89e227a99dca1c86ecfcb178cc9efee9b4dbfd1dba8b` |
| 796741 | 1155 | plain | 1151 | `c4033e882cc03761c9803f8fc1fd5dedbeda06c73308297173978eee70b4570f` |
| 799926 | 1117 | plain | 1113 | `e38e8be2eb0d4616d519f2d974cc0bb9015506fb19da5b0406ba069b570ecd97` |
| 803041 | 1424 | plain | 1420 | `9a6970f1405e36836d058459ff1c2fe7fc33d80d033dc3763acbf6a9d23d4ccc` |
| 909009 | 4291 | zlib | 24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| 916501 | 5142 | zlib | 25783 | `b29ba19e1bd5ed04e2334aab57ddcbf386331dbe136751c77f05f47a9e35edd2` |
| 922020 | 3441 | zlib | 15177 | `dfc6ccb9eb02a7c90acc5b27aa351b912e1847cdc90d00dbb93bb29991ea32a6` |
| 8720354 | 1006 | plain | 1002 | `fe77ee989d83b85bcfc1c53ca528ef0ca98510f84a28fb97e87ae06e941890e8` |
| 8723218 | 691 | zlib | 2310 | `c83f4c1884a4bf3cbbd5564e84bc9ae1677561a6d21421b13a0bdbd3f074808e` |
| 8724767 | 2600 | plain | 2596 | `ed2cb9e6480336a216dcf150dd683336822197be1dcf3b374370789e03c897d8` |
| 8787441 | 1343 | zlib | 6236 | `07186f580840ab0cccaa2fdb5b22dec768f27b7d67ba804e07354096857c4b50` |

runtime引用简写 `R` 为 `references/RPGMV/NewData/js/rpg_objects.js`（SHA-256 `2d43dd9d8974c88a1b82ffa493d6d8a02c4ce1d0dfc8f05e6c0ab731e3f0573e`）；`H05/H12/H15` 分别为 `references/RPGMV/Help/page/01_10_05.html`、`01_10_12.html`、`01_10_15.html`。这些均是随包首方源码/帮助，静态观察不冒充执行。

### 共用首方行为与初值

| 事实 | 定位与证据边界 |
| --- | --- |
| A 固定/变量/全队编码 | Q@652278:15–18、27–63、67–74；默认radio固定，GameObjectBox currentId=1来自Q@607446:12；这不是默认全队。R:8977–8995 将变量结果0交给全队路径。 |
| 全队不等于所有数据库Actor | R:4790–4805 的members在战斗中取battleMembers，地图取allMembers；固定Actor ID则由$gameActors.actor解析。 |
| O 输入范围 | Q@683885:18–19、31–49、53–68：常量/变量，常量minimum=1、maximum=9999，由各命令覆盖上限；Group成员为int，首方H05明确整数计量。常量新建SpinBox在minimum=1下的初次clamp仍属Qt初值路径，未运行。 |
| operation默认 | Q@680842:20、27–42固定第一项0；但核心operation显式填写。R:9040–9043只对结果按0/1变号。 |
| 敌人成员 | Q@8720354:10–14、28–42固定八位置，可加全体-1；Q@691763:14默认启用全体菜单。R:9007–9016按当前$gameTroop.members取位置或全体；R:5250–5267保留hidden并过滤坏引用。 |
| 空图像 | Q@618109:247–264无条件插入None空文件名；Q@8787441:50–64选择None写空字符串；Q@8723218:24–25、47–60分开传递名称与index，没有名称为空就清除index的onSave规则。 |
| 普通人物/脸图 | Q@641925:12–20人物4×2、大图1×1；Q@625536:11–20脸图144×144、固定4列；Q@625996:12–19为sv_actors。普通脸图素材规范为2行4列8张（Help/page/01_11_01.html:53–55）。 |
| 无参数命令 | Q@922020:121–125标记340/351/352/353/354 flag=0；Q@679418:174–184、202–207创建parameters=[]；无专属参数对话框，也没有隐藏默认参数。 |

## 逐指令参数契约

### E301 — Battle Processing

正式形状：`battleProcessing({troop,canEscape?,canLose?,win?,escape?,lose?})`，kind同helper；troop模式按已决模式规则机械展开为 fixed / variable / randomEncounter。

| schema 字段 / 模式 | 原生槽位与类型 | 值域、必填与引用 |
| --- | --- | --- |
| troop:{kind:"fixed",troop:troopRef(...)} | P0=0、P1=troopId | troop必须解析到实际外部Troops条目，不要求同ID另有Troop Event声明。 |
| troop:{kind:"variable",variable:variableRef(...)} | P0=1、P1=variableId | 变量槽引用；运行结果决定troopId，不预测。 |
| troop:{kind:"randomEncounter"} | P0=2、P1=0 | 无目标引用；P1是该模式固定结构值，Q@672127:21–28明确返回0。 |
| canEscape / canLose | P2/P3 boolean | 两者独立；显式false必须恢复false。 |
| win / escape / lose | 对应601/602/603，闭合604；这些记录parameters=[] | 按下表必需/禁止，子列表可空。编辑器重确认时，零长度体补indent+1的code0、parameters=[]；非空体保留已有记录。普通插入能留下非空体尾0，正式DSL如何保留依[保存形态前置S3](index.md#需要用户讨论的保存形态)决定，不能读成编译器应删掉尾0。 |

| flags | 结果体要求 | 正常生成序列 |
| --- | --- | --- |
| false,false | 禁止win/escape/lose | 301，无604 |
| true,false | win、escape必填，lose禁止 | 301、601+win、602+escape、604 |
| false,true | win、lose必填，escape禁止 | 301、601+win、603+lose、604 |
| true,true | 三体全部必填 | 301、601+win、602+escape、603+lose、604 |

Compiler Defaults仅canEscape=false、canLose=false；troop和所需分支不得省略。反编译只能省略值恰等于false的旗标，绝不按分支缺失推断/修补flags。新建UI为固定模式、troop ID1，旗标unchecked依Qt默认链；编辑器确认关闭flags会删除相应原分支，是编辑动作而非往返许可。

证据：Q@672127:19–29、36–92；Q@782932:37–71、73–106完整载入、重建、空体处理；R:10130–10174。runtime在战斗中跳过301，固定/动态troop不存在时不进入战斗；随机遇敌受当前位置和Encounter配置影响。固定引用缺失报错；地图无遇敌、战斗上下文等仅警告，不做运行保证。所有结果体即使不可达仍校验引用与Gate。

最小验收：三种troop来源×四种flags；每个必需结果体分别空/非空/含嵌套脚本；每种缺分支/多分支错误；randomEncounter严格P1=0；缺目标与无遇敌的运行结果；关闭flag的主动编辑和无操作保存分开取样。四槽之外的载荷及不规范结果结构按06报错，不借raw补位。

### E302 — Shop Processing

正式形状：`shopProcessing({goods,purchaseOnly?})`。goods必填，可空，顺序和重复均保留。

| schema 字段 / 模式 | 原生槽位 | 值域、必填与引用 |
| --- | --- | --- |
| goods[n].kind=item/weapon/armor + 对应item/weapon/armor引用 | P0=0/1/2，P1=实际ID | 非空商品引用必须存在且类别匹配；不是泛化数字ID。 |
| goods[n].price省略 | P2=0、P3=0 | 标准数据库价格；P3=0是本体保存器写法。 |
| goods[n].price显式数值 | P2=1、P3=price | 整数0..999999；0是免费，不能以truthy判断变为标准价。 |
| purchaseOnly | 首条302的P4 boolean | true禁止出售；默认false。 |
| goods=[] | 唯一302 [0,0,0,0,purchaseOnly] | P1=0是结构占位，不触发itemRef(0)；不生成605。 |

首商品用302含5槽，后续每商品用605含4槽，与302同indent并连续，归属Shop。不能把605末尾添加purchaseOnly，也不能把空商店占位作为真实商品混入后续goods。仅已决purchaseOnly=false和price省略=标准价可省略；反编译不能把已存mode0/P3非0无声归零，当前映射未支持的此类形态应报尚未支持，并继续要求正常原生证据。

新建UI：Shop列表空；Purchase Only依unchecked；新商品对话框kind=0、dataId=1、price=-1（标准）来自Q@675223:15–17。reset只重设kind/dataId（:19–22），没有重设price，因此“再次添加商品”可沿用上次价格状态，不是固定Compiler Default。显式定价SpinBox0..999999（:203–210），随商品选择刷新为数据库价格（:76–80）。

证据：Q@762570:89–125全部序列化，Q@675223:30–74、76–91、184–210价格模式；R:10177–10188；`references/RPGMV/NewData/js/rpg_windows.js:2968–2989` 的Window_ShopBuy.makeItemList按kind取三库，按P2决定标准/指定价格。战斗中Shop跳过，不以容器硬拒绝。

最小验收：空goods两旗标；三种商品、重复顺序、标准价、指定0和999999；首302/后605的准确参数数和indent；原生创建空Shop；普通重新编辑可能把占位显示成缺item的条目，需区别无操作保存；缺商品项目引用错误，孤立605错误。

### E303 — Name Input Processing

正式：`nameInputProcessing({actor,maxCharacters})`。

| 字段 | 原生 | 约束 |
| --- | --- | --- |
| actor | P0 actorId | 固定Actor Project Data Reference；不支持全队、变量或None。 |
| maxCharacters | P1 number | 整数1..16，显式必填。 |

Compiler Default无；编辑器初值actor ID1、maxCharacters=8（Q@736938:15–28），不能把已证UI初值自动加为DSL省略。R:10191–10199只在非战斗且Actor存在时打开Scene_Name；战斗上下文警告。证据Q@736938:31–45、H12:65–76。验收1/16、0/17拒绝、固定Actor不存在、地图名称输入与战斗跳过；原名长度超出输入长度时真实UI呈现另测，不截断保存的命令参数。

### E311 — Change HP

正式：`changeHp({target:A,operation:"gain"|"lose",value:O,allowDeath})`，6槽。

| 字段 | 原生 | 约束 |
| --- | --- | --- |
| target | P0/P1 | A的全部三模式。 |
| operation | P2=0/1 | gain/lose显式。 |
| value | P3/P4 | O；常量整数1..9999；变量引用。 |
| allowDeath | P5 boolean | 独立保存，gain时也允许true；不能因为UI禁用而删掉。 |

Compiler Default无；新建固定actor1、gain、constant初值受minimum1约束、allowDeath=false依Qt默认。Q@794801:23–33、35–55明确UI仅在lose启用checkbox，onSave始终写checked。R:10202–10208、9045–9055只对活目标改HP；不允许死亡时最低保1，不能借此禁止已死亡对象指令。H05:23–38。验收三A模式、两operation、常量1/9999和变量0/负数、gain+allowDeath=true精确往返、dead/alive目标与allowDeath差异。

### E312 — Change MP

正式：`changeMp({target:A,operation:"gain"|"lose",value:O})`，P0/P1=A，P2=operation，P3/P4=O。常量整数1..9999，其他模式/引用/互斥沿用A/O，不接受脚本/None。所有字段显式，无Compiler Default；新建固定actor1、gain、constant最小1的Qt初值路径。证据Q@774797:15–46，R:10211–10217，H05:48–56。验收三目标、常量上下界、变量负值和缺引用；MP运行clamp不能反推编译器裁剪参数。

### E313 — Change State

正式：`changeState({target:A,operation:"add"|"remove",state:stateRef(...)})`，4槽。

| 字段 | 原生 | 约束 |
| --- | --- | --- |
| target | P0/P1=A | 包含全队与变量结果0。 |
| operation | P2=0/1 | add/remove。 |
| state | P3=stateId | 正整数且实际State存在；无None。 |

全部显式、无Compiler Default。新建固定actor1、add、state1（不是运行结果保证）。Q@755493:15–33、35–52；R:10229–10243添加/移除、死亡变化时collapse并clearResult。验收三A模式、add/remove、死亡State、已有/未有状态和坏引用；无需Gate。

### E314 — Recover All

正式：`recoverAll({target:A})`，仅P0/P1=A，无其他参数和默认。新建固定actor1。Q@728891:15–32，R:10246–10251调用各actor.recoverAll；不是“对全部角色”的固定操作，名称中的All指恢复内容。验收固定/全队/变量、变量0和未命中、精确2槽，state/HP/MP恢复游戏样本。

### E315 — Change EXP

正式：`changeExp({target:A,operation:"gain"|"lose",value:O,showLevelUp})`，6槽：P0/P1=A、P2=0/1、P3/P4=O、P5 boolean。showLevelUp独立保存，即使operation=lose且UI禁用仍须保留true。全部显式、无Compiler Default；新建固定actor1/gain/constant，showLevelUp=false依Qt初值。

**首方范围冲突必须保留。** 目标编辑器Q@803041:23–26明确常量maximumValue=**9999999**（7位9）；共用minimum=1。随包H05:125写的是**99999999**（8位9）。按已决以指定MV1.6.1本体为基准，普通编辑控件范围为整数1..9,999,999；不能把Help更大范围说成本体已支持或把其差异悄悄省略。运行变量值不受此常量上限。

证据Q@803041:28–55与R:10254–10260、3877–3895（经验值、等级变化/消息）；该UIcheckbox名Show Level Up。验收1、9,999,999及界外10,000,000，实际输入9,999,999/10,000,000核对本体；变量更大值、lose+showLevelUp=true；原生保存反例若超过本体已证范围须进一步解释来源，不直接断言非法。

### E316 — Change Level

正式：`changeLevel({target:A,operation:"gain"|"lose",value:O,showLevelUp})`。6槽同315，但O常量整数1..98。P5是独立boolean；lose时保存true仍合法。全部显式，无Compiler Default；新建同315。Q@784374:23–55；H05:133–148；R:10263–10269、3943–3945把运行目标等级clamp到1..maxLevel，参数本身不裁剪。验收1/98、变量正/负、初始等级边界、lose+true保存。

### E317 — Change Parameter

正式：`changeParameter({target:A,parameter,operation:"gain"|"lose",value:O})`，6槽。

| 字段 | 原生 | 约束 |
| --- | --- | --- |
| target | P0/P1=A | 三模式。 |
| parameter | P2=0..7 | mhp,mmp,atk,def,mat,mdf,agi,luk按此顺序。 |
| operation | P3=0/1 | gain/lose。 |
| value | P4/P5=O | 常量整数1..9999，或变量槽。 |

全部显式，无Compiler Default。新建固定actor1、parameter初始第0项（Qt菜单初值）、gain/constant。Q@766135:19–34、36–56；Constants参数名数组Q@916501:188–193对应八项；R:10272–10278调用addParam，不把数据库base参数直接改写。H05:156–168。验收八枚举一一映射、1/9999、负变量、三A模式、永久成长与存档效果。

### E318 — Change Skill

正式：`changeSkill({target:A,operation:"learn"|"forget",skill:skillRef(...)})`，P0/P1=A，P2=0/1 learn/forget，P3=Skill ID。四槽，项目引用存在、无None；全部显式、无Compiler Default。新建固定actor1、learn、skill1。Q@741756:15–52；R:10281–10290。验收全体/固定/变量，learn/forget、已学重复操作与未学遗忘、缺技能引用错误。

### E319 — Change Equipment

正式形状沿用已决示例：`changeEquipment({actor,slotIndex,equipment})`，3槽。

| 字段 | 原生 | 完整约束 |
| --- | --- | --- |
| actor | P0=actorId | 固定Actor引用；不支持全队/变量。 |
| slotIndex | P1=slotIndex+1 | 零起始整数；0 ≤ slotIndex < 最终System.equipTypes.length−1。不是equipTypes类别ID，亦不写死5槽。 |
| equipment:null | P2=0 | 原生None，卸下；不是缺失Project Data Reference。 |
| equipment:{kind:"runtimeSelector",scope:"equipment",target:"idForSlot",id} | P2=id | 正安全整数；根据执行时actor.equipSlots()[slotIndex]决定Weapons还是Armors；不从Actor初始配置冻结类别。 |

全部显式，无Compiler Default。新建UIactor1、第一装备槽（原生P1=1）；EquipmentSelectBox插入None并在actor/etype变动时选index0（Q@598377:24–42）。编辑器候选按初始角色traits、etype和可装备类型过滤，候选数组没有额外写死的最大ID（:45–65）。这只是候选菜单，不能把无法在初始菜单出现的动态ID强制变为编译错误；已决非空ID仍为正安全整数，候选缺失警告。

精确编码证据：Q@718893:15–16的slotId是currentIndex，:42–50按equipTypes.length−1生成槽列表，:68–71保存etypeBox.currentId；Q@8724767:20、47–57说明currentId=currentIndex+1；R:3653–3660把P1减1成slotId。R:3587–3596从System.equipTypes生成slots，双持仅把第二槽类别变成1。R:3632–3651的changeEquip/tradeItemWithParty约束库存、槽类型；找不到item时可按空装备处理并卸下。Q@909009:797–807只解释编辑器初始双持候选，不是运行时保证。

候选诊断机械分级：缺Actor、坏slotIndex报错；合法equipment ID在可能用到的Weapons/Armors候选中缺失或当前候选不可装备时警告，提示可能卸下或不生效；不自动换表找同ID替代物，不保证库存/状态变化后成功。槽0正常总为武器；槽1可随双持在武器/护甲之间变化；其余槽按原生slot类别解释。未知外部trait不要求全面验证；不能误把动态候选警告升级为固定项目引用错误。

最小验收：System含非五槽；slotIndex首/末/越界；None；第二槽同一ID在Weapons/Armors不同内容，运行前改变双持；候选缺失、库存缺失、etype不匹配及卸下行为；round-trip保留ID而不反编成weaponRef/armorRef。此命令本身无脚本输入。

### E320 — Change Name

正式：`changeName({actor,name})`，P0=固定Actor引用、P1=完整string。空串与纯空格可保存，不trim；两字段显式，无Compiler Default。新建actor ID1，文本控件空串是Qt/包装初值，不能继承Actor原名（本控件没有refresh到原名路径）。

Q@732733:15–26、28–42直接载入/保存text；R:10302–10308、3460–3462直接setName。单行TextField包装的UI限制见既有 [文本控件证据](../command-contract-editor-evidence.md)，不把四类物理行记录的拆分/条数规则套到这个单槽。保存编码是一个字符串，没有401/408/655续行。普通UI单行；控制字符与异常导入字符串必须单独报告支持边界，不能未经取证称其原生非法。

验收空、空格、中文、转义符、原名不同；固定引用错误；单槽LF/CR数据作为边界样本单独标来源，不自动拆记录。

### E321 — Change Class

正式：`changeClass({actor,class:classRef(...),keepExp})`，P0=Actor、P1=Class、P2 boolean。两个项目引用必须存在，None/变量/全队均不支持；keepExp独立显式，无Compiler Default。新建actor1/class1/unchecked（Qt默认）。

Q@708873:15–33、35–51写完整三槽；R:10311–10317、3972–3979。UI标签为“Save Level”，但runtime布尔参数名keepExp且实际把原职业当前累计EXP复制到新职业后按新职业经验曲线算等级；不能宣称恒定原level。这是命名保真解释，保留keepExp比按UI标签推断数值操作更准确。验收两种keepExp、不同经验曲线、角色/职业缺失、已有新职业EXP与从未切换职业。

### E322 — Change Actor Images

正式机械展开：`changeActorImages({actor,character:{image,index},face:{image,index},battler})`，6槽。

| 字段 | 原生 | 值域/None/保存关系 |
| --- | --- | --- |
| actor | P0=actorId | 固定Actor引用。 |
| character.image | P1=characters素材名string | Asset Reference对应characters；显式null编码空字符串。 |
| character.index | P2整数 | 标准人物网格0..7；空图或大图时独立保存，不归零。 |
| face.image | P3=faces素材名string | faces Asset Reference或null→空字符串。 |
| face.index | P4整数 | 标准脸图0..7；实际picker可按更高图片产生更大索引，见下述范围边界。 |
| battler | P5=sv_actors素材名string | sv_actors Asset Reference或null→空字符串，无index槽。 |

所有字段与index显式，无Compiler Default；null不能省略整个character/face对象。新建UI在actor变更时从该Actor当前数据库图像字段refresh（Q@788887:47–55），这是工程相关初值，不应被DSL默认继承。onLoad分别赋全部保存字段；battler缺值时旧兼容表达`params[5] || ""`不等于1.6.1新保存允许缺槽，onSave固定写6槽（:58–80）。

None已由通用FileListBox→Dialog_ImageSelector→ObjImageBox链证明；四个图像辅助资源定位在共用表。R:10320–10329、3981–3993分开存所有名称/index并refresh玩家；空名字不删除该命令。引用只检查非空Asset Reference的命名空间和约定素材要求，不把空名包装成Asset Reference。

**faceIndex边界与证据等级。** 首方素材规范H `01_11_01.html:53–55`限定144格、4列2行；标准为0..7。Q@625536:13–20固定144格/4列，Q@638194:25–34、87–95、154–157实际按素材高度选择，576×432脸图可按静态路径产生8..11，未运行。此图不符合该首方标准尺寸；研究不能自行决定“原生完整支持”是否包含编辑器可接受的非标准素材尺寸。若范围包含这些正常UI操作，本表0..7需放宽或明确额外保存表达，不能以raw掩盖；该边界须在研究主索引形成可追踪决定。同样不把坐标UI范围自动用于这个图片尺寸依赖的索引。

最小验收：三类素材分别None/非空；character和face的index0/7，None+非零、大图+非零精确保留；切换actor后的默认与无操作保存区别；标准脸图与576×432实验分开，记录picker生成索引及runtime显示；六槽缺失/多槽诊断，非空素材命名空间错误。

### E323 — Change Vehicle Image

正式机械展开：`changeVehicleImage({vehicle,image,index})`，P0=boat/ship/airship编码0/1/2；P1=characters Asset Reference名称或null→""；P2=index整数0..7。三字段显式、index在None/大图下也保留。无Compiler Default。

Q@768784:15–46在vehicle切换时读取System.boat/ship/airship图像，:48–64载入/写回三槽；素材None链和4×2网格同322。新建选择boat（Qt第一项）后图像来自工程System，不是固定默认。R:10332–10338访问$gameMap.vehicle并setImage，未检查inBattle，因此战斗调用不可直接描述为无操作；需警告其改变持有的地图载具对象但不保证立即可见。验收三vehicle、null+非零index、非空普通/大图、地图切换后视觉与存档值；参数只接受0..2枚举。

### E324 — Change Nickname

正式：`changeNickname({actor,nickname})`，2槽P0 Actor引用、P1完整string；空串/空格保留、不trim。字段显式，无Compiler Default；新建actor1、文本为空（不从Actor昵称refresh）。Q@746793:15–42；R:10341–10347、3468–3470。普通输入是单行包装；与320相同的单槽文本证据边界，不拆续行。验收空白、中文、控制字符边界来源、坏Actor引用及菜单显示。

### E325 — Change Profile

正式：`changeProfile({actor,profile})`，P0 Actor引用、P1完整string，两字段显式、无Compiler Default。空串、空格及原字符串里的换行按单槽原样保存；不是lines对象，也不是355脚本，完全没有Script Gate。

Q@721727:22–28明确LabeledTextArea.maximumLineCount=2，:30–44直接取text写入唯一P1；R:10350–10356、3476–3478直接setProfile。普通UI两行，不存在“第二行转成另一记录”的结构；CR/LF具体控件编辑行为见共享文本证据，不能把四类行记录的LF拆分和4/6/12限制扩张到该参数。新建actor1、profile文本为空，不继承Actor现有profile。

最小验收空串、两行、尾部换行、CR/LF/CRLF和3行导入的分别来源、打开不确认与确认后的保存差异。已确认的单槽保存数据应完整表达；若研究主索引选择把控件两行作为正式硬界，须明确对已有原生反例的支持义务，不能由本表自行裁剪。

### E326 — Change TP

正式：`changeTp({target:A,operation:"gain"|"lose",value:O})`，5槽P0/P1=A、P2=0/1、P3/P4=O。常量整数1..100，变量值不受字面量范围限制。全部显式、无Compiler Default；新建固定actor1/gain/constant初值受minimum1约束。Q@796741:15–46；R:10220–10226；H05:64–74。验收三A模式、1/100、变量0/负值、运行TP上下界clamp和保存值不裁剪。

### E331 — Change Enemy HP

正式：`changeEnemyHp({target:E,operation:"gain"|"lose",value:O,allowDeath})`，5槽。

| 字段 | 原生 | 约束 |
| --- | --- | --- |
| target | P0=-1或0..7 | 支持全体；固定位置与hidden/坏引用诊断沿用E。 |
| operation | P1=0/1 | gain/lose显式。 |
| value | P2/P3=O | 常量整数1..9999，或变量槽。 |
| allowDeath | P4 boolean | 独立保存，gain时true不自动删。 |

全部显式、无Compiler Default。新建全体菜单第0项即-1（Qt第一项）、gain/constant、allowDeath=false依Qt默认。Q@724163:15–55；R:10359–10365调用changeHp，活体/最低HP规则同311。地图调用可能作用于残留troop，不保证无效果；目标未命中警告。验收全体/第0/第7槽、hidden、当前成员数不足、坏引用导致位置前移警告、常量上下界、gain+true、死亡/复活语义。

### E332 — Change Enemy MP

正式：`changeEnemyMp({target:E,operation:"gain"|"lose",value:O})`，P0=E（允许-1）、P1=operation、P2/P3=O。4槽，常量整数1..9999。显式、无Compiler Default；新建全体/gain/constant（Qt初值链）。Q@799926:15–46；R:10368–10374。验收E全体/0/7、两operation、变量负值与字面量边界、隐藏及残留troop上下文；引用错误与上下文warning分级同331。

### E333 — Change Enemy State

正式：`changeEnemyState({target:E,operation:"add"|"remove",state:stateRef(...)})`，P0=E（允许-1）、P1=0/1、P2=State ID。3槽，State固定存在、无None。显式、无Compiler Default；新建全体/add/state1。Q@779933:15–52；R:10386–10400处理状态、collapse和clearResult。验收全体/单槽、死亡State、hidden、缺引用错误和成员缺失warning。

### E334 — Enemy Recover All

正式：`enemyRecoverAll({target:E})`，1槽P0=E（允许全体-1）。无默认、全部显式；新建全体（Qt菜单）。Q@759986:15–32；R:10403–10408。验收全体/0/7、hidden/死亡目标、成员不足及地图残留troop；不得把helper名字误解成永远针对全体。

### E335 — Enemy Appear

正式：`enemyAppear({target:E-single})`，仅P0=index整数0..7；E-single只允许单个成员模式，**不允许all/-1**。当前实现接受EnemyCommandTarget的all不足以证明正式支持该输入；Q@735205:15–19明确includeEntireTroop=false。

无Compiler Default，新建index0依Qt第一项。Q@735205:22–34；R:10411–10417调用appear并makeUniqueNames，hidden成员仍占位，未hidden目标也可执行。runtime的iterateEnemyIndex能读取负值并不构成编辑器该族有全体模式的证据。验收hidden成员第0/第7槽、重复出现、成员数不足warning、all模式编译错误、地图残留对象情境。

### E336 — Enemy Transform

正式：`enemyTransform({target:E-single,enemy:enemyRef(...)})`，P0=index整数0..7，P1=固定Enemy数据库引用。target不允许all/-1，enemy不可None/变量；位置选择与数据库Enemy身份不得混淆。

全部显式、无Compiler Default；新建index0/enemy1。Q@713113:15–27、29–43；R:10420–10426、4460–4471改变敌人数据库类型并刷新，执行目标的位置不因此改变。验收同位置变身为另一个Enemy、hidden状态/HP状态可视结果、固定Enemy缺失错误、合法但当前不存在的位置warning、all拒绝。

### E337 — Show Battle Animation

正式机械展开：`showBattleAnimation({target:E-single,animation:animationRef(...),allEnemies})`，**3槽**。

| 字段 | 原生 | 约束 |
| --- | --- | --- |
| target | P0=index整数0..7 | 单敌保存槽，allEnemies=true时仍必填保留；不能替换为all selector并抹去这个字段。 |
| animation | P1=Animation ID | 固定项目引用，必须由真实Workspace装入Animations；无None。 |
| allEnemies | P2 boolean | 单独保存旗标；true时运行目标覆盖为全敌人。 |

全部显式、无Compiler Default；新建index0/animation1/allEnemies=false（Qt）。Q@792645:15–40、42–64：勾选只改变targetEnemy.enabled，onSave始终写currentId；onLoad用`!!params[2]`兼容旧缺省不等于当前原生新建允许缺槽。R:10429–10444只有isAlive目标播放，不等待动画完成；allEnemies=true调用iterateEnemyIndex(-1)。因此不额外添加wait字段，不把P0设-1当成相同保存状态。

这是05“原生独立保存的未使用配置仍须表达”的直接应用，无须选择新的领域模型。验收P0=7/P2=true保留、随后取消全体恢复第8位置、死亡/hidden目标与存活目标、动画缺失错误、当前成员不足warning、原生三槽/非bool异常诊断。

### E339 — Force Action

正式机械展开：`forceAction({subject,skill,target})`；不沿用裸targetIndex数值。

| schema 模式 | 原生 | 约束 |
| --- | --- | --- |
| subject:{kind:"runtimeSelector",scope:"battler",target:"enemy",index} | P0=0、P1=index | index整数0..7，单敌，无all。 |
| subject:{kind:"runtimeSelector",scope:"battler",target:"actor",actor:actorRef(...)} | P0=1、P1=Actor ID | 固定引用，必须存在；无变量/全队。 |
| skill | P2=Skill ID | 固定Skill引用；无None。 |
| target:{kind:"lastTarget"} | P3=-2 | 执行动作者记住的上个目标位置。 |
| target:{kind:"random"} | P3=-1 | 运行时按该技能选择随机目标。 |
| target:{kind:"index",index} | P3=index | 整数0..7；不是Actor ID、Enemy ID，也不必小于当前敌群人数。 |

4槽，全部显式、无Compiler Default；新建subject敌人0、skill1、target第一项lastTarget（Qt第一项推断）。Q@659292:15–18、29–60、65–72限定subject两个模式；Q@749747:49–55生成固定10项，:60–77映射P3=currentIndex−2；H15:189–205说明Last Target/Random/Index1..8。

R:10447–10456通过iterateBattler；R:9018–9027明确仅在战斗中处理，死亡subject跳过；R:3171–3183清原actions并设置强制动作，-2使用_lastTargetIndex、-1调用decideRandomTarget。R:1483–1522按技能敌/友、单体/全体/死亡对象作用域解释target；不是永远指敌人位置。不按当前敌人数裁剪，可能由运行smoothTarget等退回可用对象；必须保持原值。

最小验收敌人/Actor两种subject、死亡subject、三目标模式、index7但当前敌人少、友方/敌方/全体/复活技能、上一次目标与随机目标、地图调用跳过、技能/Actor坏引用错误。等待模式action及强制行动顺序在真实战斗中验证，不只比对生成数组。

### E340 — Abort Battle

正式：`abortBattle()`，parameters=[]，无字段/默认；Q@922020:121、Q@679418:202–207无参工厂。R:10459–10462直接BattleManager.abort；`references/RPGMV/NewData/js/rpg_managers.js:2605–2607` 的BattleManager.abort把phase设aborting，并非所有上下文立即切地图。地图上下文警告保留，不说它完全无副作用。验收精确零参数、战斗中中断并回地图、地图调用残留manager状态；不得要求额外canEscape。

### E342 — Change Enemy TP

正式：`changeEnemyTp({target:E,operation:"gain"|"lose",value:O})`，P0=E（全体-1或0..7）、P1=0/1、P2/P3=O。常量整数1..100，变量引用运行值另计。全部显式、无Compiler Default；新建全体/gain/constant。Q@715592:15–46；R:10377–10383。验收单敌/全体/hidden、1/100、变量负值、成员不足warning与残留troop场景。

### E351 — Open Menu Screen

正式：`openMenuScreen()`，零参数；无默认。Q@922020:122、Q@679418:202–207；R:10465–10471仅非战斗时push Scene_Menu并initCommandPosition。没有针对System菜单开关的此处检查，不能把Change Menu Access的状态当编译前置条件。验收零参数往返、地图打开、战斗跳过、菜单禁用状态下原生结果。

### E352 — Open Save Screen

正式：`openSaveScreen()`，零参数；无默认。Q@922020:123、Q@679418:202–207；R:10474–10479非战斗push Scene_Save。此命令本身不检验isSaveEnabled，不能因系统禁止菜单存档而在DSL中拒绝它。验收地图/战斗、保存禁用时打开行为、准确零参数；实际存档仅在验收临时项目进行。

### E353 — Game Over

正式：`gameOver()`，零参数；无默认。Q@922020:124、Q@679418:202–207；R:10482–10485无条件SceneManager.goto(Scene_Gameover)，没有要求全部Actor死亡。验收地图/战斗分别调用、零参数、场景转换；不加“战斗限定”错误。

### E354 — Return to Title Screen

正式：`returnToTitleScreen()`，零参数；无默认。Q@922020:125、Q@679418:202–207；R:10488–10491无条件goto(Scene_Title)。验收地图/战斗分别调用、场景生命周期、零参数；不添加自动保存字段或隐含保存操作。

## 覆盖、尚待决定与验收责任

| 范围 | 当前状态 | 剩余责任 |
| --- | --- | --- |
| 33个指令的完整参数槽、模式、普通控件范围、项目引用、运行选择及上下文 | 已逐项静态调查；没有以类别清单代替参数表 | 按本表和已决契约实施；真实Workspace必须装入完整外部数据及System配置。 |
| 301 flags/分支/空体/604、302/605/空goods/价格 | 目标本体完整保存函数已读；分支/商品槽映射已明确，非空子体尾0的正式表达仍受S3阻塞 | 先完成保存形态决定，再安排自动化与原生夹具；不一致镜像/异常结构按06拒绝。 |
| 319动态装备ID和slotIndex、337非激活敌人位置 | 静态证据充分且可直接应用已决保存原则 | 单测不能代替动态双持/库存/全体动画真实游戏场景。 |
| EXP帮助与本体上限差异 | 已标明首方冲突；目标本体控件为9,999,999 | 真实输入边界确认；若需将帮助承诺的更宽范围纳入正式编写，提出明确范围决定。 |
| 扩展脸图的faceIndex | 标准素材0..7已证；非标准尺寸的picker可达更高索引为静态推断 | 研究主索引需跟踪范围决定或补充实验，不宣布一般faceIndex范围已封闭。 |
| 单槽Name/Nickname/Profile与行限制 | 保存字符串槽已证，普通UI一/一/两行已证 | 不自行推广四类line-record的拒绝政策；控制字符/超行保存来源和是否硬限由共享文本研究及必要设计决定归口。 |
| 新建Qt隐含初值与真实保存 | 显式控件值/静态依赖已分别列出；未执行 | 08收尾检查Qt首次初始化、再次编辑与无操作保存差异；不把此未知转为默认继承。 |
| 静态资源/源码研究 | 完成所列代码范围；没有执行目标，也没有产品测试 | 本报告不能充当编辑器/游戏验收通过记录。 |

范围决策未清除前，整张逐参数研究票与实施规格不能仅凭这33族“有表”标为全部闭合。所有不再影响接口的真实保存/运行任务继续由验收票接收。无产品源码修改、无原软件源码副本或资产发布。

## 共用控件证据与成组验收矩阵

隐含Qt基础初值由主研究 [共享控件与原生验证器证据](shared-controls.md) 补充：随包 `qtquickcontrolsplugin.dll` 的SpinBoxValidator构造函数、meta分发表和getter经REA+Ghidra静态核对，基础decimals=0、value=0、step=1、minimum=0、maximum=99。这确认本报告数量字段使用整数控件，而非默认可输入小数。各命令显式设minimum=1/maximum=N后最终首次显示/保存还经过控件约束与初始化次序；本报告不把基础value=0误写成每条数量命令的新建保存值0，也不因此添加Compiler Default。REA原始Evidence ID、函数地址、DLL身份和限制由共享报告集中记录，避免将本报告的QML本地引用伪装成新的REA记录。

| 验收组 | 有效边界 | 无效或尚未支持输入 | 真实动态检查 |
| --- | --- | --- | --- |
| A角色选择与O操作数：311/312/313/314/315/316/317/318/326 | 固定、全队、变量；常量1/各自max；合法无名变量槽；变量运行值0/负值 | 缺模式必需字段、混合固定与变量、未知mode、裸ID替代引用、缺固定Actor/State/Skill；数量0/max+1/小数/NaN/Infinity拒绝；variable来源不按常量值域裁剪 | 战斗全队取battleMembers、地图取allMembers；变量目标0全队；不会为表外Actor自动补数据库 |
| 独立旗标：311/315/316/321/331/337 | true/false，当前UI禁用但值true仍保存 | 字符串"false"、0/1代替boolean、缺必填bool、未知对象字段；不能因当前效果不用而删槽 | allowDeath与showLevelUp的操作模式切换、keepExp对应经验曲线、allEnemies切换恢复保存的单敌位置 |
| 固定引用：301/302/303/319/320/321/322/324/325/336/337/339 | 存在且名称唯一或显式ID；所有原生None/占位分别按专用模式 | ID0/缺目标/重复名称、类别错配；空Shop的占位0与equipment:null/素材null不泛化为一般引用许可 | 变量troop目标与固定troop存在性区分；动态装备类别/库存/候选不保证命中 |
| E敌人位置：331/332/333/334/335/336/337/339/342 | 0/7；支持全体的族用-1；当前成员不足警告 | -2、8、小数；335/336/337/339主体的all模式拒绝；不要把-1容忍扩张给单敌族 | hidden仍占位、坏Enemy引用过滤前移、地图残留troop、死亡对象和无目标 |
| 319装备 | null、正ID、首槽/最后合法槽、非五槽System | slotIndex=-1/槽数/小数；非空equipment ID0/负值/非整数；武器/护甲固定引用替代动态selector | 第二槽双持切换、找不到装备可卸下、无库存和不匹配etype |
| 322/323图像 | 各素材None、普通人物index0/7、大图或None非零index | 非空素材命名空间错、index负值/小数；标准人物index8无正常4×2来源；扩展脸图index8以上单独按范围议题处理 | None是否保留旧index、再次确认图像与直接保存不同、标准/超高脸图实验 |
| 320/324/325文本 | 空串、纯空格、中文、单槽完整字符串 | 非string、缺字段、多槽拒绝；特殊换行/超UI行数需区分来源，不自动贴“已证非法”标签 | 单行/双行控件编辑与无操作保存差异，CR/LF控制字符 |
| 301/302结构 | 三troop模式×四flags；空/非空分支；空/重复goods与免费价 | 缺必需/多余分支、错indent、孤立601/602/603/604/605、缺空体标记、商品price=-1/1000000/小数 | 真实编辑器创建与再次确认，零商品Shop运行，战斗内跳过与Encounter选择 |
| 303与339索引 | maxCharacters=1/16；action target=-2/-1/0/7对应模式 | maxCharacters=0/17/小数；target index=-1/8以index模式输入；主体模式混合 | 长名字输入，友方/敌方技能选择及Last Target、随机目标、死者处理 |
| 340/351/352/353/354无参 | parameters=[]，完整外层结构 | 任意多余参数、命令额外顶层字段、非法indent | 实际scene切换与battle上下文、菜单/存档权限状态差别 |

本矩阵补齐每族共用的负面验收候选；不是已运行的测试结果。33个族均有正式字段/原生槽位、模式和类型域、初值与DSL默认区别、引用/上下文以及正负边界候选；扩展脸图与单槽文本范围的问题仍按上节明确交接。
