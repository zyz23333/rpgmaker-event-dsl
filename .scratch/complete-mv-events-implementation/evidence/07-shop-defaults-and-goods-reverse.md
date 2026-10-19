# 07 — Shop 初值、商品列表与空占位的逆向核对

核对日期：2026-10-19（Asia/Shanghai）。本票按用户修订的 reverse-engineer-anything 验收方式，阅读目标编辑器的构造、载入、商品编辑确认、父参数确认和容器序列化路径。所有数组示例均为明确输入下的代码推导；没有执行抽出的 QML/JavaScript、编辑器 UI、系统剪贴板、实际写盘、产品往返或游戏。

**当前仍有契约决定阻塞**：空 Shop 重新打开后，在列表末尾添加真实商品的正常代码路径会保留零 ID 占位行，形成占位与真实商品混合。当前 E302 明文禁止该结构。以下保留反例及有限边界，未自行改变已接受契约，也未放行产品票47。

## 目标、方法与资源身份

目标 `references/RPGMV/RPGMV.exe` 为19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。与历史 PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` 一致；FileVersion1.6.1.0 / ProductVersion1.6.1 为该历史记录的自报版本，本次重新校验文件身份，不认证发行来源。目标根为 `F:/Shuen/RPG/rpgmaker-event-dsl/`。

先复用 [E302 参数契约](../../complete-mv-events/research/command-parameters/actors-battle.md#e302--shop-processing)、[共享控件研究](../../complete-mv-events/research/command-parameters/shared-controls.md) 和 [03 的通用加载/保存链与 CheckBox 默认证据](03-branches-and-battle-reverse.md)。Node fs/zlib/crypto 从原 EXE/DLL 按实际四字节大端长度读取；压缩记录另核对解压长度前缀、完整压缩输入消费边界、decoded 长度和 SHA-256。新查 Shop、Merchandise、SmartListBox、ListBox、GameObjectBox 和对象选择器，复用同身份 Qt CheckBox 与 SpinBox 原生证据，没有重复打开 native 分析会话。

仓库仅发布原创结论与 [选定资源身份 metadata](07-resource-identities.json)。首方全文、完整扫描发现 metadata 只留在 `C:/Users/Shuen/.codex/research-evidence/mv-editor-07-20261019/`；脚本在 `C:/Users/Shuen/.codex/tmp/mv-decode07.cjs`、`mv-scan07-support.cjs`、`mv-scan07-listbox.cjs`、`mv-scan07-selector.cjs`。本次未新建 REA Evidence ID；上列 PE 和下列 SpinBox ID 是复用的真实历史记录，不伪装为本次调用结果。原生 SpinBox 构造 Evidence `ev_0abda227cbae2d1ac569a8e0af403fc960727b39b3d337287fe4165a16926d1d` 来自同安装 DLL、Ghidra12.1.4 的既有分析，支持未覆盖 decimals=0；其原 bundle 保留在 `C:/Users/Shuen/.codex/research-evidence/mv-command-parameters-20261019/`。

offset 从文件头零起算；stored 包括外层四字节长度；角色由完整文本与调用关系识别，未恢复 qrc 路径。`Q@offset:line` 指 decoded 全文一基行号。

| 目标   | 角色                      |  offset | stored | 编码  | decoded bytes | decoded SHA-256                                                    |
| ------ | ------------------------- | ------: | -----: | ----- | ------------: | ------------------------------------------------------------------ |
| EXE    | Shop Processing           |  762570 |   1060 | zlib  |          3681 | `35bb0adeba83d80de4d1dc755d3049d8e3bfa52f9229bbc70530eb4d2d40d635` |
| EXE    | Dialog_Merchandise        |  675223 |   1190 | zlib  |          7945 | `68b5ffb34022a960b2525bb7c11377141a6f2139a833de7fe0eb722290103f43` |
| EXE    | SmartListBox              |  594736 |   1407 | zlib  |          5671 | `45892eadba38c8489ea172663e8029efa8fff5912e0ea9e225d1b3a92b4af75e` |
| EXE    | ListBox                   |  895267 |   5054 | zlib  |         27264 | `5481b25306b33ceaac94d5fe1e164adabb7dd3255dfe5f67ef28c9de1eb5f727` |
| EXE    | GameObjectBox             |  607446 |    741 | zlib  |          2580 | `8c2bc0bf8b611a96c4ab50889c74051e540af35d3ebd553c158081417d05c7bf` |
| EXE    | Dialog_GameObjectSelector | 8771735 |   2302 | zlib  |         11973 | `9d74ffe518d64b6d519ae6c5112687a3556e8b8b4204250793dfab5b06b10299` |
| EXE    | Editor SpinBox            |  875471 |   1735 | zlib  |          7183 | `a94b75dfca7ceb95315d38a3897e8c389a96d71f56696329f0cf8edd20535984` |
| Qt DLL | CheckBox                  |  290172 |   7338 | plain |          7334 | `5334c4d26069acd2e7445be4e78e8d0749f376ec21d33200c350226b7a64d17a` |
| Qt DLL | AbstractCheckable         |  300501 |   5585 | plain |          5581 | `2fa2bb063b151e5da6ef8943ecfabd1fc67845ca1f07fbc8a367d9ef15b87390` |
| Qt DLL | SpinBox                   |  160589 |   3826 | zlib  |         13133 | `4b98b9d85a651cbe2f47e4abf7efaf67a25b9b942f5441b77cc5faae9643e0ca` |

EXE 的 base/dialog/picker/event-list/modal/DataManager/CheckBox 包装在03已确认，选定身份一并列在本票 metadata。随包 `QtQuick/Controls/qtquickcontrolsplugin.dll` 为780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`；本次同样从原 DLL 复核三个选定资源。Shop 不使用 ComboBox，06 的首项证据不需要再引入本票。

## 新建、价格与列表保存责任

新建参数 picker 将 eventData 设为 null 后打开 Command dialog（Q@679418:174–184）；dialog 赋值后调用目标组件 load，确认时调用 save 并返回 eventData（Q@656916:19–40）。Shop onLoad 先创建空 list，只有存在 eventData 才逐记录填充（Q@762570:89–104）。Purchase Only 仅使用 CheckBox，没有 checked 覆盖（:83–87）。同身份包装未覆盖默认，随包 AbstractCheckable 显式 checked:false（Qt Q@300501:87），其继承链已由03核对。因此新实例完成初始化、不添加商品、不改勾选时，有条件推导唯一302的参数为 `[0,0,0,0,false]`；显式选 Purchase Only 后末槽为 true。

Shop 保存对 dataObject.list 按现有顺序循环，首记录 code302，其余 code605（Q@762570:107–120）。每条填 kind、dataId、价格模式和值，只有首条写 purchaseOnly；list 为空才另造四零占位加布尔（:122–125）。不会给605加第五槽，也未见过滤、排序或按商品值去重。makeCommand 构造三个字段（Q@686141:27–29）；局部 indent0 随父事件列表插入整体加相同 offset（Q@667573:435–448），故302与所有605连续、同层，属于该 Shop 参数组。

Merchandise 根明确 kind0、dataId1、price=-1（Q@675223:15–17）。price=-1 是该对话框内部标准价哨兵，不是原生价格槽值：Shop 保存将任何负内部 price 编为 mode0/value0，非负编为 mode1/原值（Q@762570:115–116）。子窗口 Standard 勾选明确 true（Q@675223:184–190）；Specify 数值框 min0/max999999（:203–210），整数编辑依据复用 SpinBox decimals0 的本体证据。指定0 是免费，不能变为标准价。

载入 Shop 的 mode0 一律变为内部-1，非0模式读取第四槽（Q@762570:95–97）。载入具体商品时，父列表把 kind、dataId、price 交给子窗口（:45–53）；子窗口先选择类别并设置正ID，再依 price 决定 Standard/Specify，定价模式最后回填 spinBox.value（Q@675223:30–55）。getItem 按类别分别取 items/weapons/armors，选择变化时用数据库价格刷新数值框（:76–91、117–167）。在正常同步信号处理、初始化完成且不再改选商品的条件下，既有 custom0/custom999999 被最后赋值恢复；没有执行实际 Qt 时序。主动改商品会以数据库价格刷新数值框，是显式编辑行为，不能当成对旧保存值的编译归一化。

子窗口 onOk 依据已勾选类别写 kind/当前ID；Standard 写内部-1，Specify 写 spinBox.value（Q@675223:58–74）。父 onOk 每次构造一个新的 `{kind,dataId,price}` 对象交给 SmartListBox（Q@762570:20–23）。SmartListBox 的 indexOf 比较对象身份；两个字段相同的新对象不会因此去重，选空白尾行即插入，选已有行即替换（Q@594736:100–112）。其拖动按 source/target index splice，复制和粘贴按选中次序传递 JSON 对象，没有按 kind/ID/price 合并的步骤（:37–56、136–168）。真实商品重复与顺序因此由保存循环完整承接。

`reset()` 只设 kind0/dataId1，没有重置 price（Q@675223:19–22）。所以在同一 Shop 编辑期间新增下一条商品可能沿用上一条的价格模式和值；这不是第二个标准价 Compiler Default。已有标准价输入中第四槽非0则另论：给定独立输入 `[0,1,0,83,false]`，Shop 参数重确认会经内部-1重建为 `[0,1,0,0,false]`。这是给定异常输入的处理推导，没有发现正常保存器产生 mode0/value83 的路径；当前契约仍要求报尚未支持，不能据此将反编译无声归零。

## 空占位、主动编辑与混合反例

新建空 Shop 保存器确实直接产生唯一四零占位（Q@762570:122–125）。重新打开该已存命令时，onLoad 对每条记录无条件读取 kind/dataId/price 并 append，没有识别唯一空占位的分支（:89–104）。因此四零成为内部 `{kind:0,dataId:0,price:-1}` 一条数组数据。makeModelItem 找不到 item0 时显示问号，但只构造显示对象，不移除或修复该数据（:68–79）。

SmartListBox.refresh 对数据数组每项添加显示行，再额外添加一条 makeModelItem(null) 空白尾行（Q@594736:69–79）。ListBox.rowCount 代理实际 listView.count、currentIndex 代理当前行，底层 view 使用 root.model（Q@895267:26–29、260–271）。所以重新打开的空 Shop 有一条零 ID 数据行和一条独立的空白尾行。父参数直接确认、不打开商品子窗口时，数据仍只有那一条零 ID 行，保存重新产生唯一 `[0,0,0,0,purchaseOnly]`，结构保持相同。

**主动确认零 ID 商品行是另一条路径。** Goods onInit 只在 root.dataId>0 时按保存值回填类别和ID（Q@675223:31–49）。零ID不进入回填；新内容的 Item radio 明确 checked:true，三个 GameObjectBox 各继承显式 currentId1（:107–167；Q@607446:12）。GameObjectBox.includeZero=false、minusOneText为空，Shop 三个实例未覆盖（Q@607446:14–17）。其 setCurrentId 只是直接赋值（:101–103），但本次零 ID 被上层 guard 拦在该调用之前。

进一步核对对象选择器：GameObjectBox onInit 复制 currentId、includeZero 和 minusOneText，确认时把选择器 dataId 写回（Q@607446:21–35）。Dialog_GameObjectSelector 仅在 includeZero=true 时加入 None 组；一般数据分组和数据行从ID1开始，正ID选择映射至相应组/行（Q@8771735:46–58、63–86、104–110、127–134）。在类别有正常正ID条目、控件完成初始化的前提下，主动确认零 ID 行会按当前 Item/Weapon/Armor 控件保存正ID；只改价格再确认也不保留零ID。当前代码依据不支持把“武器ID0”“防具ID0”或“零ID加指定价格”顺势纳入占位变体。

这项结论有明确边界：本次没有执行 Qt Loader 的销毁/重建、ExclusiveGroup、瞬时 currentIndex=-1 或空/破损数据库的信号时序；ModalWindow.contentsLoader 随 childWindow.visible 激活，打开后调用内容 init（Q@878315:24、64–67、249–260）。正常非空控件的上述推导不等于证明所有异常外部数据都绝不产生别的零 ID 组合。未查明的组合保持未知，不能自动扩大产品值域。

混合反例所需的路径更小，而且不必编辑零 ID 行：

1. 新建空 Shop 并确认，保存器生成 `[0,0,0,0,false]`。
2. 重新打开，onLoad 将它作为一条数组元素载入，refresh 另加空白尾行。
3. 选空白尾行新增一个有效 item1、明确选择 Standard，再确认子窗口。editCurrentItem 对尾行调用 editItem(null)；finishEdit 在尾行 index1 splice 新对象，没有删前一条零 ID 数据（Q@594736:91–112；Q@762570:45–53）。
4. 确认父 Shop；保存器按两条数据产生以下连续同层记录。indent2 为明确的父列表上下文例子，由统一插入 offset 推导。

```json
[
  { "code": 302, "indent": 2, "parameters": [0, 0, 0, 0, false] },
  { "code": 605, "indent": 2, "parameters": [0, 1, 0, 0] }
]
```

这是原生构造、重载、追加与保存代码组成的有条件静态反例，不是导入手工坏数据，也不是已捕获的 UI 操作或实际生成文件。有效 item1 是独立工程前提，不来自 DSL 输出。

占位还不必固定在第一条：SmartListBox.onDrop 只排除越界、相同索引和模型最后空白行，取得数据后直接按源/目标 splice（Q@594736:37–56）。对 `[占位,真实A]` 将 source0 拖向空白尾行 index2，target向下调整为1，得到 `[真实A,占位]`；已有多个真实商品时同理可位于中间。复制实际占位行也不会被“空白尾行”过滤：contextMenu 只将末尾空白行认作 emptyItemSelected，copy 复制选中的非尾行，paste 的 JSON.parse 产生新对象，indexOf 的身份检查不会按四零内容排重（:20、117–168）。因此存在重复精确占位的代码路径推导；尚未声称观察过这项实际 UI 创建。若契约仅增加开头一个占位布尔，将不能表达所读拖动路径；任何可重复占位选择必须由用户明确接受，并保持精确四零边界。

## 保存结构结果与推导

表内通过仅表示对应有界代码核对完成。契约处理项仍 blocked，07不能据其它行已核对而关闭。

| ID                       | 输入/路径                                                              | 可复核结论                                                                                                 | 等级与边界                                                     |
| ------------------------ | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| MV-E07-NEW-EMPTY         | 新实例null eventData，不添加商品，两种Purchase Only状态                | 初始化list为空；完整初始化后默认false；保存唯一302 `[0,0,0,0,false]` 或显式勾选后的true，无605             | 有条件静态推导；Q@762570:83–125、Qt Q@300501:87；未执行UI      |
| MV-E07-PURCHASE          | 多商品和空商品列表，Purchase Only明确false/true                        | 首302第五槽始终读checkbox.checked；后605只有四槽；空占位也保留同一布尔                                     | 保存器代码观察；不把605第五槽或truthy外部值变成支持            |
| MV-E07-GOODS-ORDER       | 有效item/weapon/armor，包含两个字段相同的新商品对象                    | kind分别0/1/2；保持数组次序和重复；首302五槽、其余605四槽，统一父indent                                    | 构造/列表/保存代码观察；项目引用有效性仍由产品独立检查         |
| MV-E07-PRICE-MODES       | Standard和Specify0/999999，实际正ID商品                                | Standard内部-1保存mode0/value0；Specify保存mode1/原整数，0为免费；数值框0..999999、继承decimals0           | 代码观察与复用原生控件证据；未声称自动化执行全部数值组合       |
| MV-E07-PRICE-RECONFIRM   | 独立有效输入：item1标准、weapon2免费、armor3指定999999，载入后不改确认 | 按三类精确数据集和ID回填；定价最后回填并在正常初始化/信号处理后保持模式和值；标准显示取数据库价而原槽仍0   | 有条件静态推导；子选择变化刷新价格与不改确认分开，未执行Qt时序 |
| MV-E07-RESET-PRICE       | 同一Shop期间上一商品指定83，再选空白尾行新增                           | reset仅重置kind0/dataId1，price仍可沿用83；不是每次新增都固定Standard                                      | reset与调用路径观察；保存模式仍取确认时实际选择                |
| MV-E07-EMPTY-RELOAD      | 独立唯一302四零占位，父参数直接重确认                                  | 载入为一条kind0/id0/price-1数据并显示问号，另加空白尾行；不打开子窗口时仍保存相同唯一占位                  | 有条件静态推导；ID0没有变成普通item引用                        |
| MV-E07-PLACEHOLDER-EDIT  | 打开占位数据行，只改价格或类别后确认；正常非空正ID类别                 | dataId>0 guard跳过零ID回填；默认选择控件ID1，确认读取选中类别的正ID；未证明ID0可与custom或weapon/armor结合 | 有条件静态推导；异常空库和Qt瞬时信号未知，不扩展零ID值域       |
| MV-E07-MIX-PATH          | 原生创建空Shop、重开、从空白尾行新增有效标准价item1                    | 条件成立时保存首302 `[0,0,0,0,false]` 加605 `[0,1,0,0]`；与原E302禁止混合冲突                              | 有条件正常代码路径反例；未执行UI，不归一化或永久raw兜底        |
| MV-E07-PLACEHOLDER-ORDER | 占位与真实商品混合后拖动；复制占位行再粘贴                             | onDrop允许占位移至中间/末尾；copy/paste可保留并产生另一精确四零行的条件推导；未看到按值过滤                | 有界代码推导；实际UI创建未观察，重复支持需要用户明确选择       |
| MV-E07-STANDARD-NONZERO  | 独立异常输入 `[0,1,0,83,false]`，只容器保存或打开Shop参数确认          | 容器保留83；参数重确认经-1写回0。没有正常保存器生成mode0/value83的证据，仍按当前契约尚未支持处理           | 合成异常输入的处理推导；不把重确认归零作为反编译规范化         |
| MV-E07-CONTAINER         | 既有空/普通/重复商品组，仅保存事件容器                                 | DataManager stringify路径不调用Shop.load/save，保留每条完整参数、值、顺序、数量和indent                    | 容器责任代码观察；不是磁盘成功、产品输出或游戏证据             |
| MV-E07-CONTRACT          | E302禁止混合与MV-E07-MIX-PATH冲突                                      | 未取得用户契约决定，07和47仍阻塞；精确四零结构占位与正ID商品引用必须分别处理，未知零ID组合不获支持         | blocked；须回到相关已接受决定，不能以其它代码核对通过代替解决  |

## 契约比较与未决范围

已一致部分：goods必填可空、真实商品按类别使用有效正ID引用、标准价与指定0的差别、价格0..999999、purchaseOnly默认false、首302/后605、完整顺序重复和同indent续行。新建商品默认item1只是 UI 初值，不成为 DSL 可省略目标；新增沿用价格也不是固定 Compiler Default。单独空列表仍使用唯一四零占位，不产生 itemRef(0)。

**尚未解决**的是 [E302 当前契约](../../complete-mv-events/research/command-parameters/actors-battle.md#e302--shop-processing)“不能把空商店占位作为真实商品混入后续goods”与上列正常编辑代码路径的矛盾。这触及 ADR0011的父属结构与 ADR0012要求的原生保存状态往返：不能删除占位、把它当普通itemRef0、忽略相邻605、永久降为raw，或仅因实现尚不支持便把正常形态写作异常。

候选的有限表达方向是一个具名 Shop 结构占位变体，精确编码 `[0,0,0,0]`，允许位于真实商品之间；单独唯一占位可继续反编译为goods=[]。是否允许重复该精确变体，也必须明确决定，不能凭推导自动修改域模型。该方向只是待审提案，不是已接受API。purchaseOnly仍只归首302，item/weapon/armor正ID引用规则、mode0/value非0的未知边界、任意零ID类别/价格组合不随之放宽。

原始首方文本保持仓库外，报告/metadata/索引/结果是可复核的原创交付。纯证据文档未改变 harness 或产品行为，因此不新增TDD测试；仅运行既有证据索引校验。最终产品票47、E2/E4产品输出比较以及实际R1–R7游戏运行仍分别承担自己的要求。
