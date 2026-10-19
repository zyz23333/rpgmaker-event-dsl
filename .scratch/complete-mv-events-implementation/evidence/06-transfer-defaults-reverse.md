# 06 — Transfer 初值、位置模式与确认路径的逆向核对

核对日期：2026-10-19（Asia/Shanghai）。本票按用户修订的 reverse-engineer-anything 验收方式，阅读目标编辑器与随包 Qt 的初始化、载入、参数确认和容器序列化路径。数组示例为有条件代码推导或独立有限输入的处理推导，没有执行编辑器 UI、实际写盘、产品往返或游戏。

## 目标、方法与资源身份

目标 `references/RPGMV/RPGMV.exe` 为 19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，与历史 PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` 一致。本次重新校验目标字节，FileVersion 1.6.1.0 / ProductVersion 1.6.1 复用旧证据的自报版本，不认证发行来源。目标根为 `F:/Shuen/RPG/rpgmaker-event-dsl/`。

先复用 [E201 与 MAP-LOCATION 契约研究](../../complete-mv-events/research/command-parameters/visual-map.md)、[共享保存链](../../complete-mv-events/research/command-parameters/shared-controls.md) 及 [03 的 dialog/list 路径](03-branches-and-battle-reverse.md)。Node fs/zlib/crypto 仅按实际资源长度前缀读取、解压并验证外层长度、压缩输入消费边界、decoded 长度与 SHA-256，不执行抽出的 QML/JavaScript。新增调查只补编辑器 ComboBox 包装、同安装 Qt ComboBox/原生 Menu 初始索引，以及 currentMapId 的项目来源。未重复分析 SpinBox，与本票位置属性的显式0无关。

仓库发布原创结论和 [选定身份 metadata](06-resource-identities.json)；首方全文、17 条新 REA Evidence bundle 和分析快照仅留在 `C:/Users/Shuen/.codex/research-evidence/mv-editor-06-20261019/`。脚本为 `C:/Users/Shuen/.codex/tmp/mv-decode06.cjs`、`mv-scan06-controls.cjs`、`mv-scan06-context.cjs`。新 native 分析使用 REA 6.7.0 / Ghidra 12.1.4 / JDK 21.0.8，只读分析随包 DLL，导出后已成功 close_binary。

offset 从文件头零起算；stored 包括四字节外层长度。角色由全文和引用关系识别，未恢复 qrc 路径；`Q@offset:line` 指 decoded 全文一基行号。

| 目标 | 角色 | offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| --- | --- | ---: | ---: | --- | ---: | --- |
| EXE | Transfer Player | 758295 | 1691 | plain | 1687 | `26b948a478069a1ab482a446293cc9529777819d02b592c5decd0d44455ce046` |
| EXE | Group_Location | 664736 | 941 | zlib | 4349 | `b0ecfbc0b86b1fe5dfd0e6a9104d4ab1932205a8d6b7d5bba3f404863f7821b1` |
| EXE | LocationBox | 8678030 | 646 | zlib | 2189 | `2e6ff7009f820d08d201854327d44a466057ea7c437e1517ddf5b89199f15d7b` |
| EXE | Dialog_Location | 8693982 | 1735 | plain | 1731 | `5c108ee13343706774468a198fcfea1f0f22a350de7af604a3f1d7a59b2a643c` |
| EXE | GameVariableBox | 604662 | 2027 | plain | 2023 | `73e2e714e76de967386acea78f688e2517b8f7e3761dd86d7a29ebc0e26aba1c` |
| EXE | Constants | 916501 | 5142 | zlib | 25783 | `b29ba19e1bd5ed04e2334aab57ddcbf386331dbe136751c77f05f47a9e35edd2` |
| EXE | LabeledComboBox | 8797951 | 739 | plain | 735 | `8830bc7b2492b1dd0149c7ced80b5b04742b4c0d81355f99bf6a264341b2f333` |
| EXE | Editor ComboBox | 854492 | 2011 | zlib | 8889 | `68f5706dc8e25bec53c589bd7f733ff876a09906028057348b27168859ee8ccb` |
| EXE | Project load/save controller | 426544 | 3371 | zlib | 17252 | `8d2d161cc2d663a7246bf7b7717430a4eebc000f1f04d8704685d5f222cac776` |
| EXE | Main map tree controller | 8672102 | 2367 | zlib | 11367 | `d74ef475802a5a8cb0083a5a340968877b4352db4c2e05b1631af0bcd701cb17` |
| Qt DLL | ComboBox | 274218 | 6593 | zlib | 24147 | `07cb4b61fc694faf650461e7f668db3f1e5115fc8e25d9efdb0681f1b4572500` |

EXE 的 base/dialog/picker/list/modal/DataManager 与 03/05 同身份，完整选定记录一并列在 metadata，避免把共享路径误作新发现。随包 `QtQuick/Controls/qtquickcontrolsplugin.dll` 为 780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`。其 `plugins.qmltypes` 为 95,705 bytes，SHA-256 `58aba7eb65d07e8763035172c6c2bc6e53c22795828196d9bfd90e46cac40561`；同目录 `qmldir` 为162 bytes，SHA-256 `0ed18792740787ecb235bbe73122e3155f970d046495bc6525987e80833cb72a`，声明插件 qtquickcontrolsplugin。

## 初始化与项目上下文

新建 picker 传 null eventData（Q@679418:174–184），dialog 设置组件数据后调用 load（Q@656916:19–29）。Transfer onLoad 只在 eventData 非空时赋已有值（Q@758295:37–43），不在新建时从别的命令复制目标。

Group_Location 默认 needMapSelection=true、needExchange=false（Q@664736:19–20）；Direct 的 radio 显式 value0、checked:true（:34–42）。LocationBox 明确声明 mapId 绑定 DataManager.currentMapId，而 mapX/mapY 显式0（Q@8678030:15–18）。其 memberForId/X/Y 默认空串（:10–12），Group_Location 没设置这些字段，因而 onObjectChanged 的成员回填条件不成立，不把当前命令目标替换成任意 object 的默认0。

DataManager.currentMapId 自身初始0，并在数据库载入/clear 时归0（Q@909009:32、71–74、295–299）；Project onLoad 从工程 editMapId 读取（Q@426544:342–348），保存时记录当前值（:477–486）。主地图树 onCurrentIdChanged 写回 currentId（Q@8672102:110–112）。因此新建目标中的地图 M 来自当前工程/选择，不是固定 map1，更不是调用游戏时的“当前地图”占位。即使编辑器上下文暂时为0，也不据此允许 DSL 缺 destination、写 map0或猜默认地图。

变量模式的三个 GameVariableBox（Q@664736:62–88）都继承自己显式的 variableId=1（Q@604662:12），Direct 默认没有消费它们。新建切换 Variables 后，若未选其它变量，推导取三个1；这同样不是 DSL 隐式变量1许可。

## 随包 ComboBox 初值链

Transfer 两个 LabeledComboBox 只设置模型，不设置 currentIndex（Q@758295:19–34）。LabeledComboBox 把 currentIndex/currentText 代理给 Editor ComboBox（Q@8797951:10–12、19–25），Editor 包装未另设初始索引。包装 onCurrentIndexChanged 在索引有效时刷新 popup.currentText（Q@854492:217–226）。

同安装 Qt ComboBox 把 currentIndex 代理到 popup.__selectedIndex（Q@274218:130）；Component.onCompleted 在索引为-1时改为0，然后置 ready 并解析模型（:376–382）。model 在 active 后改变时也设置0（:548–560）；解析、实例化菜单项与 selectedText 更新分别见 :575–579、584–625、643–650。它自身对 currentText 更新顺序的注释（:135–136）与这些处理路径相符，不能把最终首项推导说成观察过所有瞬时状态。

为核对-1的来源，本票追入同一个 DLL：

| 原生责任 | 新 REA Evidence ID | 可复核观察 |
| --- | --- | --- |
| QQuickMenu 类型定位 | `ev_74bdccebd33acf513d05834cd9d66e52d69d03b08664f75232fd7fa9711a1c93` | FUN_10017cb0 比较类型名并返回对象；其 vtable 引用连到 QML 类型构造包装 |
| QML Menu 构造包装 | `ev_1c1a2e8e4127787482d0356be319e081127fcc72bd73f13c9ec4d9544e1ccaa0` | FUN_100011f0 调用 FUN_10007ff0 并设置 QQmlElement<QQuickMenu> vtable |
| Menu 构造初值 | `ev_cf54d03984c80ddc18c5a4c83d5ce73303cc7b9552f6a85734fde586ad6066c5` | FUN_10007ff0 在对象 +0x38 写 0xffffffff，即 int -1 |
| 属性读取责任 | `ev_d599a2ba1c9bd334f794e5ca56234109dfafc08e6650cc44837a04df9c24a36c` | FUN_10017970 的 ReadProperty case2 从同一 +0x38 读取；qmltypes:139–141 的本类属性顺序为 title、items、__selectedIndex |
| 索引写入责任 | `ev_84ad033941a7f79cda0ce9635747290eb221f12fa7a6c2ec70052cfd32de5b27` | FUN_1000a150 在值改变时写 +0x38 并发送对应变更通知；meta-call WriteProperty case2 调用此函数 |

构造代码证据与 QML completion 合起来支持“新实例完成初始化后首项0”的有条件推导。Constants 的方向模型首项 Retain，其后 Down/Left/Right/Up（Q@916501:336–341），fade 模型为 Black/White/None（:303–305）；directionValue 将普通四方向文本编码2/4/6/8，其余为0（:558–560）。新建默认因此推导为 retain0/black0；仍以模型/文本就绪、正常翻译数据和新实例初始化完成为前提，未伪造首次 UI 保存。

## 载入、编辑确认与容器序列化

Transfer onLoad 将 p0..3 交给 Group_Location.setup，将 direction 映射成选择索引、fade 直接赋索引（Q@758295:37–43）。Group_Location.setup 在 type0 时选 Direct 并写 mapId/mapX/mapY；type1 时选 Variables 并写三个 variableId（Q@664736:113–125）。直接属性回填没有按当前地图宽高夹取坐标；与打开 Location 子对话框后主动选择新位置分开。

Group_Location 的 mapIdValue/mapXValue/mapYValue 按已选模式分别读取 LocationBox 或三个 GameVariableBox（Q@664736:22–26）。切换模式不会将 direct 数字解释成变量ID，或把三个变量ID解释成直接坐标；未选模式的控件可能仍留在该窗口内，但没有独立原生保存槽。Transfer onSave 对 p0..5 全部赋值（Q@758295:46–56），正常新建为六槽，已有合法六槽也按所选模式和控件重写。未声称它主动清理任意异常额外槽。

Location 子对话框 onInit 复制外层 mapId/X/Y，onOk 才回写（Q@8678030:31–40）。Dialog_Location 选择地图并在与原 mapId 一致时恢复 cursorRect，换图则清空选框；仅在选框宽1时把 mapId/x/y 写回根（Q@8693982:23–25、33–55）。因此主动选位置与单纯开父参数窗口不同；地图加载、光标信号和尺寸处理仍有实际 Qt 时序前提，不冒称穷尽地图缩放/异步路径。

参数确认由 Command dialog 调用 save 并返回 eventData（Q@656916:33–40），列表替换其切片（Q@667573:425–446）。仅容器保存仍是 DataManager 的 JSON.stringify 路径（Q@909009:341–383、407–424），不调用每条 Transfer 的 onLoad/onSave，不把既有目的地改为当前地图或补默认。TkoolAPI.writeFile 内部与磁盘成功未动态核实。

## 保存结构结果与推导

| ID | 输入/路径 | 可复核结论 | 等级与边界 |
| --- | --- | --- | --- |
| MV-E06-NEW-CONTEXT | 新建 Transfer 的 direct 地图和坐标 | Direct显式选中；map绑定项目当前地图M，x/y显式0；M来自工程editMapId/地图树选择，不是固定map1或DSL省略默认 | 代码观察；Q@664736:19–42、Q@8678030:15–18、Q@426544:342–348、Q@8672102:110–112 |
| MV-E06-QT-FIRST-ITEM | 新实例的方向/fade未显式选项 | 同安装 Menu native索引-1，ComboBox completion改0；已就绪模型首项分别Retain/Black | 有条件静态推导；本体native/QML链已补，仍未执行Qt/UI时序 |
| MV-E06-NEW-DIRECT | 当前地图M存在，新建Transfer不改选项直接确认 | 正常完成初始化、模型文本就绪时推导六槽 `[0,M,0,0,0,0]` | 静态推导；M是明确项目条件，不是通用Compiler Default，不代表实际UI捕获 |
| MV-E06-NEW-VARIABLES | 新建后切Variables，不改三个变量控件 | 三框显式variableId1，完成初始化并保持其它默认时推导 `[1,1,1,1,0,0]` | 静态推导；不保证工程存在这些引用，不允许DSL省略目标字段 |
| MV-E06-DIRECT-LOAD | 独立已有六槽 `[0,7,83,92,8,2]`，正常载入后不改再确认 | setup回填固定map7/x83/y92，方向Up索引4、fadeNone索引2，模型文本就绪时保存同一六槽 | 有条件静态推导；是有限输入处理，不冒称UI创建；未进入位置子对话框，不按当前地图尺寸裁剪 |
| MV-E06-VARIABLES-LOAD | 独立已有六槽 `[1,3,4,5,6,1]`，正常载入后不改再确认 | setup写变量ID3/4/5，方向Right和fadeWhite，模型文本就绪时保存同一六槽 | 有条件静态推导；不解释变量未来值，不以三个ID当直接map/x/y |
| MV-E06-MODE-SWITCH | Direct/Variables来回切换、主动选择不同目的地 | 只从选中模式读取对应三个字段，确认写p0..5；另一模式控件内存状态不是额外保存槽 | 完整模式读写路径观察；可能改变目的地是显式编辑行为，Q@664736:22–26、113–125和Q@758295:46–56 |
| MV-E06-DIRECTION-FADE | 五方向与三fade，包含retain和none | direction按0/2/4/6/8映射，fade按0/1/2独立保存；只有精确0对应已决可省略默认 | 常量与保存映射代码观察；不执行无差别笛卡尔积，也不把原生异常索引回填当产品支持 |
| MV-E06-LOCATION-EDIT | 打开位置子窗口、保留原图或主动选新图/格子 | 初始化复制现目标，合法单格光标才回写位置；OK将子窗口值写回外层，区别于只载入父参数 | 代码观察；地图加载和完整光标信号时序未动态观察，Q@8678030:31–40、Q@8693982:23–55 |
| MV-E06-CONTAINER | 已有两种六槽Transfer，仅保存事件容器 | stringify不重新执行Transfer参数编辑，保留模式、map/变量、坐标、direction和fade原值 | 容器序列化责任代码观察；不是实际磁盘捕获或产品输出比较 |

## 契约比较与放行范围

与 E201 的既定契约一致：destination 及 direct/variables 的全部字段必需；direction 固定默认 retain，fade 固定默认 black，反编译只有精确0可省略。编辑器的当前地图与三个初始变量1均不成为 Compiler Default。支持域内旧坐标在Snapshot尺寸外仍按已决 warning 保留；本票不把 QML int 声明升级为已实测全部非负32位数可通过普通点选。

新 native 证据消除了“继承索引初始值来自哪个安装/控件”的缺口。实际 Qt Loader、新实例销毁与重建、模型/文本就绪顺序、位置地图加载与光标信号、TkoolAPI最终写盘仍未动态证明；报告所有首次保存和重确认数组均明确带正常初始化/就绪条件，没有将这些未知记成通过。它们没有暴露现有有限六槽保存契约的代码反例，也不授权 DSL 复制任何显式编辑造成的改变。

本票解除 34 的 Transfer 相关逆向前置。34及最终50继续负责正式DSL编反编译/验证/Workspace输出与E4产品比较，52–54负责实际R1–R7游戏运行。`passed` 的记录只表示本报告中有界逆向核对已经执行并完成。
