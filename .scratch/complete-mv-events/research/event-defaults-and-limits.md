# MV 1.6.1 原生事件的创建初值与属性控件范围

研究日期：2026-10-18。对应问题：**原生事件属性的合法值与创建默认值是什么**。产品源码基准 `13f3aac9f0cf2bda068a1ee2d14819b92626a7be`。本报告补充 [原生事件字段基准研究](native-event-data.md)，供 Compiler Default 与验证边界决策使用；不设计最终 DSL。

## 结论与证据边界

同一份用户指定的 `references/RPGMV/RPGMV.exe` 含有完整的 Qt QML/JavaScript 源文本资源。静态解码和阅读这些资源，可以把此前“样例里看到的取值”推进为“编辑器工厂代码与控件模型明确规定的取值”：地图空页速度 3、频率 3、priority 0；移动速度控件 1..6、频率 1..5；地图变量页条件阈值 -99,999,999..99,999,999；战斗回合 A/B 0..9999、HP 阈值 0..100。地图页与战斗页新增、清空都重新解析对应页模板。下文逐项给出资源和行号。

这些是**静态源文本观察及局部路径推断**。没有执行 RPGMV.exe、游戏、解出的 QML/JavaScript、模板工厂或 UI 操作。没有声称真实保存通过。以下概念始终分开：

| 概念 | 本报告含义 |
| --- | --- |
| 工厂模板初值 | JsonTemplates 的数据字符串，以及实际调用 JSON.parse 的创建/清空路径 |
| 控件自身初值 | QML 控件声明的 currentIndex/value 等；绑定已有对象后可能被覆盖 |
| 控件可选择范围 | model、indexOffset、minimumValue/maximumValue 及相关转换代码 |
| 随包数据取值 | NewData 或已有工程已保存的具体值，不自动等于每条创建路径 |
| runtime 接受范围 | 核心脚本读字段的方式；setter 未检查范围不代表编辑器可输入任意数字 |
| 真实 UI 行为 | 实际打开、点击、保存和运行的观察；本轮未取得 |

## 目标身份与版本来源

唯一目标绝对路径为 `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`，大小 19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。本轮读取后再次核对了文件哈希。

编辑器本体版本复用 [编辑器保存规则研究](editor-serialization.md) 的已取得证据，不重复诊断或版本分析：REA `inspect_pe_resources` Evidence 为 `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`；其 RT_VERSION 记录位于偏移 19,562,144、长度 540。该研究对同一字节范围的普通只读 VS_VERSION_INFO 解析得到固定 FileVersion `1.6.1.0` 与字符串 ProductVersion `1.6.1`。这属于本体自报版本，不认证发行渠道或与官方安装包逐字节一致。Windows FileVersionInfo 返回空字符串的现象不能推翻原字节的版本资源。

该版本与资源解码流程已由临时分支 `research/mv-editor-serialization` 的 commit `3f8d4fdf8711b11fe03b20fff5fab5139165869c` 记录。本轮没有新增 REA operation 或 Evidence；下列 Q-* 是本报告的本地引用标识，不是伪造的 REA Evidence ID。

## 资源身份、读取方法与引用约定

全部偏移为相对于 exe 文件头的 0 起始字节位置。`stored` 包括最外层 4-byte 大端长度前缀；plain 是长度后直接 UTF-8，zlib 是长度、4-byte 大端解码长度、压缩流。每条压缩记录都核对了解码输出长度与解压器消耗输入长度；每份文本核对 decoded SHA-256。文本只在内存中阅读，未复制到仓库、研究提交或软件分发附件。

角色名来自文本内注释、控件类型或调用路径。没有重建 Qt resource name/tree，不能把角色名当作已验证 `qrc:/...` 路径。下文的“Q-ID:行号”指按 UTF-8 解码、以 CRLF/LF 分行后的 1 起始文本行号。

| 引用 | 资源角色 | offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| --- | --- | ---: | ---: | --- | ---: | --- |
| Q-TEMPLATE | 注释为 JsonTemplates.js 的数据模板 | 346222 | 2617 | zlib | 11436 | `52fd4ca2a3f178712d94467c5770919cf716882e2ebc9a57bde0a963e9447165` |
| Q-CONDITION | 地图页条件布局 | 656030 | 886 | zlib | 5163 | `2e679cbed93309a6e1b51db11a7128af1b5294c8be3fb2a35b70ac9946627818` |
| Q-PAGE | 地图页属性布局 | 701512 | 1784 | zlib | 7813 | `d3f53b2536e23bb60f8b080f1692cec652262688cd20dd5184de5773dc9c3b15` |
| Q-BATTLE-CONDITION | 战斗页条件对话框 | 8779077 | 1145 | zlib | 8073 | `9afa1d70061a8898eec25c8be717caaceaa3464626ff22904b67573907b11fef` |
| Q-EVENT-EDITOR | Map Event 页签编辑器 | 674163 | 1060 | zlib | 4143 | `93338301160a3f64994c0371b137e8bc5f6c6c8e1f803b1730fe72e5a6322834` |
| Q-BATTLE-EDITOR | Troop 战斗页编辑器 | 959423 | 1837 | zlib | 7793 | `5a40dcc720eeda8ca0a67e312a657ab52b753ef7914cfb903e64f2a0801326c7` |
| Q-MAP | 地图事件新建入口组件 | 8667116 | 3753 | zlib | 19336 | `e684f74d77d923861f3e7804709ba2a27974418bd56e5ee586eea257fddaed12` |
| Q-IMAGE | EventImageBox 形态的事件图像控件 | 626433 | 1675 | zlib | 6491 | `9e05d77cba069b12cef44536bf917a1eed9829c72871f472cfbcd82f7422070e` |
| Q-SPEED | MovementSpeedBox 形态的控件 | 602267 | 521 | plain | 517 | `36f300fe57216b5d2e8cc8b95cdec472db04555aafe2ce3c7e79b39100144606` |
| Q-FREQUENCY | MovementFrequencyBox 形态的控件 | 620945 | 496 | plain | 492 | `a79b3da1057059bdb7073a5e79c2538eaefcf9b00c9c463e51fb7ac3b74b86cc` |
| Q-COMMON | 公共事件属性布局 | 967367 | 2086 | plain | 2082 | `80b034dedb0ab5f3465d6b9bc9bda652e47aa7d756985ee84697d0e96f70942c` |
| Q-COMBO | ObjComboBox 形态的绑定控件 | 8728865 | 1118 | plain | 1114 | `a2d5d7acd82fb294b91c6869fbeb1c009515644636dfea3913155211879413de` |
| Q-DB-LIST | 数据库条目通用列表与工厂 | 963372 | 1930 | zlib | 7745 | `cc33f67d3ed28382350a871766793d70ff786ca9d7c2726768e9aab55bcf54e6` |
| Q-DATABASE | 数据库主窗口的分页配置 | 934867 | 1816 | zlib | 8770 | `90fc0bbe06a34a0ee68ad881d469ca20654c830811ffd668fd2f7d6b0f0a7af6` |
| Q-DB-TAB | Tab_DBStandard 形态的数据库分页组件 | 966730 | 637 | zlib | 2162 | `a3f4768edb3fd8cad0d5e9c596809171e459fcf8285c714f87185e19980f3f53` |
| Q-PAGE-BUTTONS | 通用事件页按钮 | 647618 | 592 | zlib | 2264 | `08d4a8bc3e7ad0d7478dd70265cb7a73298de4c2d24a2617699dab68c9dcefec` |
| Q-SELF-SWITCH | SelfSwitchBox 形态的绑定控件 | 603593 | 1069 | plain | 1065 | `575592e0d2220e8a333612da0290f81fad98fa6a44ad6a9e59aed445a5fd66a7` |
| Q-SPIN | ObjSpinBox 形态的绑定控件 | 8717236 | 970 | plain | 966 | `4a76e7bf246987c17ae67a15f8be8481760d4b90405de27a0e23120a4a67b25f` |
| Q-LABELED-SPIN | LabeledSpinBox 形态的控件 | 8796406 | 630 | plain | 626 | `a0810e1c287e4e2eb22bb24cf75308a7bf492a7e5a45b683f6eaec52f8c898fe` |
| Q-IMAGE-DIALOG | Dialog_ImageSelector 形态的对话框 | 8787441 | 1343 | zlib | 6236 | `07186f580840ab0cccaa2fdb5b22dec768f27b7d67ba804e07354096857c4b50` |
| Q-IMAGE-GRID | ImageSelectorView 形态的图像网格 | 638194 | 1222 | zlib | 5016 | `1d00d66ec8159738c77a866c7218d6219eb9d7cb1ecdcce7619abf7214670d9a` |

可复核的原创只读逻辑如下；把表中已知记录参数代入即可。此段不是原软件源文本，不执行任何提取代码：

```js
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const file = fs.readFileSync('F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe');
const offset = 346222, stored = 2617, compressed = true;
const expected = '52fd4ca2a3f178712d94467c5770919cf716882e2ebc9a57bde0a963e9447165';
if (file.readUInt32BE(offset) !== stored - 4) throw Error('record length');
let output;
if (compressed) {
  const decoded = zlib.inflateSync(file.subarray(offset + 8, offset + stored), { info: true });
  if (decoded.buffer.length !== file.readUInt32BE(offset + 4)) throw Error('decoded length');
  if (decoded.engine.bytesWritten !== stored - 8) throw Error('compressed boundary');
  output = decoded.buffer;
} else {
  output = file.subarray(offset + 4, offset + stored);
}
if (crypto.createHash('sha256').update(output).digest('hex') !== expected) throw Error('digest');
// 在本地检查所需行，不把整个目标文本作为研究附件发布。
```

## 地图事件与地图页的创建、清空初值

### 普通新建 Map Event

Q-MAP:232–247 的 onEventNew 取得光标坐标与新事件 ID，JSON.parse `JsonTemplates.Event`，再覆盖 id、name、x、y，然后打开事件编辑器。name 按 `EV` 加至少三位 ID 文本生成。Q-MAP:24 与 533–542 显示普通新建从 1..999 中挑第一个空槽；没有空槽则返回 0 并显示警告。这是该新建入口的 ID 策略，不是“任意已导入 JSON 的 id 必须 <=999”的充分证据。

Q-TEMPLATE:22 的 Event 初值是 id0、name空、note空、x0/y0、含一个下述空地图页。常规新建覆盖身份和位置，不覆盖 note 或初始页。这使空备注和一页初始页有了工厂调用路径证据，而不仅是工程样例。

### 新增与清空地图页

Q-EVENT-EDITOR:112–119 的 createPage 通过 createEmptyPage 新建对象，插在当前页之后，并将选中页号递增；:144–153 的 clearPage 以同一工厂的新对象替换当前页。createEmptyPage 明确 JSON.parse `JsonTemplates.EventPage`。复制/粘贴则 JSON.stringify/JSON.parse 当前页或剪贴板值（:121–134），因此不是空页模板初值。

Q-TEMPLATE:23 的地图空页工厂值：

| 字段 | 工厂初值 |
| --- | --- |
| `conditions.actorId / itemId / switch1Id / switch2Id / variableId` | 均为 1；所有对应 Valid 均 false |
| `conditions.selfSwitchCh / selfSwitchValid` | A / false |
| `conditions.variableValue` | 0 |
| `image.characterName / characterIndex` | 空字符串 / 0 |
| `image.tileId / direction / pattern` | 0 / 2 / 0 |
| `moveType / moveSpeed / moveFrequency` | 0 / 3 / 3 |
| `moveRoute.list` | 仅一个 code0、parameters空数组的路线终止项 |
| `moveRoute.repeat / skippable / wait` | true / false / false |
| `priorityType / trigger` | 0（Below）/ 0（Action） |
| `walkAnime / stepAnime / directionFix / through` | true / false / false / false |
| `list` | 仅一个 code0、indent0、parameters空数组的事件终止项 |

注意，清空页只替换 pages 中的当前对象，不清空 Event 外层 name、note、id、x、y。普通空页 priority=0 与当前产品 `compiler/events.ts:93` 的 priority=1 不同；这证明产品当前 Compiler Default 是自己的选择，不能称为编辑器空页初值。

### 选图后的联动不属于空页初值

Q-IMAGE:93–127 的 onOk 读取旧 characterName 是否为空，将选择重新编码为新 image；人物/非人物类别发生变化时触发 typeChanged。Q-PAGE:29–37 对该信号将 priorityType 设为：characterName 非空为 1，否则为 0。因此，空页初始 Below、选择人物图后的 Same、从人物图改为图块/空图后的 Below，具有不同路径。已有任意 priority 的无操作打开/保存不应被自动替换成这一联动结果；QML 信号实际时序仍须运行验收。

Q-PAGE:167–180 的自主路线对话框初始化读已有 route；确认时写 list、repeat、skippable，并显式写 wait=false。这是主动确认路线的处理，不是单纯切换 moveType 或非 Custom 页保存时的全局重置规则。

## 地图页控件的枚举与边界

Q-COMBO:12–14,20–32 定义默认 indexOffset0；数据值为 currentIndex + indexOffset，绑定对象时用原值减去 offset 设置 currentIndex。这使 model 索引与持久化数字之间的对应可以静态核对。

| 属性 | 控件可选择值 | 证据与限定 |
| --- | --- | --- |
| `moveType` | 0 Fixed、1 Random、2 Approach、3 Custom | Q-PAGE:47–66；路线按钮仅在 index3 启用 |
| `moveSpeed` | 1..6：x8 Slower、x4 Slower、x2 Slower、Normal、x2 Faster、x4 Faster | Q-SPEED:16–21 有 indexOffset1 与六项模型；Q-PAGE:69–75 绑定 moveSpeed |
| `moveFrequency` | 1..5：Lowest、Lower、Normal、Higher、Highest | Q-FREQUENCY:16–21 有 indexOffset1 与五项模型；Q-PAGE:76–82 绑定 moveFrequency |
| `priorityType` | 0 Below、1 Same、2 Above | Q-PAGE:123–130 的三项模型与默认 offset0 |
| `trigger` | 0 Action、1 Player Touch、2 Event Touch、3 Autorun、4 Parallel | Q-PAGE:139–145 的五项模型 |
| `conditions.variableValue` | -99,999,999..99,999,999 | Q-CONDITION:81–88 的 ObjSpinBox minimum/maximum |
| `conditions.selfSwitchCh` | A、B、C、D | Q-SELF-SWITCH:14–16,30–42 的四项模型与直接字段写回 |
| 条件开关值 | Boolean，Valid 与对应 ID/阈值分开绑定 | Q-CONDITION:21–147；enabled 不等于删除未激活值 |
| actor/item/switch/variable 引用 | 选择对应工程数据集或 System 名称槽 | Q-CONDITION:30–35,48–53,68–74,121–127,140–146；并非一个脱离工程的数值最大 ID |

Q-SPEED 声明 currentIndex3，Q-FREQUENCY 声明 currentIndex2。考虑 indexOffset1，它们在无对象绑定时分别暗示值4和3；但地图页绑定时会读工厂/已有对象的值覆盖，所以不能把速度控件自身 currentIndex3 误解为“新建地图页速度4”。地图页工厂明确为速度3。

Q-SPIN:26–38 在对象绑定时读字段、调用内部 control.normalize，并在 value 变化时写回；Q-LABELED-SPIN:8–14 仅把 minimum/maximum、stepSize、decimals 等 alias 给内部 SpinBox。本轮尚未定位该底层 SpinBox 对 normalize、整数小数精度的完整实现；所以表中是明确的数值上下界，不把“UI 排斥小数、打开越界值完全不改写”附加成已证实事实。原生事件语义使用整数的字段仍需按领域和最终验证政策处理。

## 事件图像的选择域与规范字段

Q-IMAGE:71–79 为普通人物图分成 12列×8行，大图分成 3列×4行；:93–127 是选择确认时的字段转换，:131–153 是图块来源列表。

| 模式/字段 | 选择确认的结果 | 静态依据 |
| --- | --- | --- |
| 普通人物图 `characterIndex` | 0..7 | 从 imageIndex 分解为 cx0..3、cy0..1，再 cy*4+cx（:113–115） |
| 大人物图 `characterIndex` | 固定 0 | :110–111；大图依据 DataManager.isBigCharacter 判断 |
| 人物图 `direction` | 2、4、6、8 | directionIndex 为图像行组 modulo4，再乘2加2（:97,108） |
| 人物图 `pattern` | 0、1、2 | imageIndex modulo3（:109） |
| 人物图 `tileId` | 0 | :106 |
| 图块图像来源 | 当前 Map 的 tileset 中 B/C/D/E 四组；只加入名称非空的组 | :131–153、168–171；不把 Tilemap 所有 tile ID 都视作该 picker 可选集合 |
| 图块模式其他图像字段 | characterName空、characterIndex0、direction2、pattern0 | :100–104 |
| tile ID 转换 | `组号*256 + floor(x/8)*128 + y*8 + x%8` | :183–184；组号来自 B/C/D/E 的0..3，列表图块每格48px且maxColumns16 |

Q-IMAGE:157–165 的已有图像载入会读全部五个字段，不主动重建对象。这与重新确认选择的规范字段不同。上表是正常选择器输出，不能把任意外部数据读入后的结果一律预先归一化到上表。

图块坐标边界可进一步限定到标准资产：首方帮助 `references/RPGMV/Help/page/01_11_01.html:187–191` 要求 B..E 为768×768、16×16图块；Q-IMAGE:150–152 指定48×48 frame、maxColumns16。Q-IMAGE-DIALOG:125–145 将列表 frame/maxColumns 传给网格；Q-IMAGE-GRID:25–43 按实际图像尺寸计算 frameMaxX/Y，游标越界时回到 imageIndex0。因此对标准 B..E 图，x/y均0..15，组合结果覆盖0..1023；tileId0是源图B左上角的空图语义，不能当作活动图块与人物图并存。这个结论不保证非标准尺寸图片只会产生0..1023；网格基于实际尺寸的行为和QML异步图像加载仍需区分。

## 公共事件和战斗页

### 公共事件

Q-TEMPLATE:18 的 CommonEvent 模板包含 id0、name空、trigger0、switchId1、仅一个事件终止项的 list。Q-COMMON:31–43 的 trigger 模型为 None/Autorun/Parallel 三项，对应 0/1/2；只有 triggerIndex>0 时启用 switchId 控件。切回 None 使控件不可用，没有在这个布局里重置 switchId 的动作。

公共事件和敌群到工厂的配置链可以闭合：Q-DATABASE:95–101 将 Troop 模板、troops 数据集和 Edit_Troops 编辑页配在一起，:124–130 将 CommonEvent 模板、commonEvents 数据集和 Edit_CommonEvents 配在一起；Q-DB-TAB:26–34 再把 templateName、dataSetName 和 maximumNumberOfItems 转发给内部 DataSelector。Q-DB-LIST:192–209 的 changeMaximum 按这个 templateName 解析相应 JsonTemplates，增容时填入新条目并将 id 设为数组槽位；:248–259 的 clear 同样重新解析模板并恢复原 id。因此数据库“更改最大值”增容与“清空”这两条路径确实使用上述 CommonEvent/Troop 模板，不只证明了模板符号存在。

数据库分页层的默认 maximumNumberOfItems 是1000（Q-DB-TAB:15），Common Events 配置未覆盖它；Troops 配置显式覆盖为2000（Q-DATABASE:101）。该值被转交给更改最大值对话框（Q-DB-LIST:125–138），所以这里可确认配置上限分别是公共事件1000、敌群2000。通用 DataSelector 自身的999初值（Q-DB-LIST:21）在这两条路径中被覆盖，不能当成公共事件上限。对话框具体最小值、越界已有数据库的装载处理和 runtime 可容纳数量没有在本轮核对。

### 战斗页初值与新建/清空路径

Q-TEMPLATE:24 的 BattleEventPage 为空战斗页，:14 的 Troop 初值是 id0、name空、members空数组、包含一个相同初值战斗页的 pages。Q-BATTLE-EDITOR:210–217 在当前页之后插入 createEmptyPage；:242–251 的清空用同一工厂替换当前页。工厂明确 JSON.parse `JsonTemplates.BattleEventPage`。复制/粘贴则复制当前数据，不用空页模板。

数据库层清空整个 Troop 会按上一节的通用工厂重建整条 Troop，再恢复 id，因此会一并重建 name、members 和 pages；战斗页的 Clear 只替换当前页。这两种“清空”的作用域不同。

| 战斗页字段 | 工厂初值 |
| --- | --- |
| `turnEnding / turnValid / enemyValid / actorValid / switchValid` | 全部 false |
| `turnA / turnB` | 0 / 0 |
| `enemyIndex / enemyHp` | 0 / 50 |
| `actorId / actorHp` | 1 / 50 |
| `switchId` | 1 |
| `span` | 0（Battle） |
| `list` | 仅一个 code0、indent0、parameters空数组的事件终止项 |

### 战斗页条件范围与 span

| 属性 | 控件可输入/选择范围 | 证据 |
| --- | --- | --- |
| `turnA / turnB` | 各0..9999 | Q-BATTLE-CONDITION:55–80；提示说明 A+B*X，turn0 在命令输入前 |
| `enemyHp / actorHp` | 各0..100，百分比 | Q-BATTLE-CONDITION:108–117,145–154；提示是小于等于 |
| `enemyIndex` | 通过当前 troop 的成员选择器 | Q-BATTLE-CONDITION:100–106；不能替换成敌人数据库 ID |
| `actorId` | 工程 actors 数据集条目 | Q-BATTLE-CONDITION:137–143 |
| `switchId` | System switch 选择器 | Q-BATTLE-CONDITION:175–181 |
| `span` | 0 Battle、1 Turn、2 Moment | Q-BATTLE-EDITOR:64–71,130–135,202–207 |

这些控件界限不等于 runtime 硬校验。例如零售脚本 `references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:5303–5342` 直接执行比较与取模，setter/读取处没有把全部越界值拒绝；完整支持应由后续验证政策决定，如何处理编辑器不能新选出但原始 JSON 中存在的值，不由本研究悄悄裁剪。

## 页数限制的含义

Q-EVENT-EDITOR:17,49 与 Q-BATTLE-EDITOR:25,38 都设 maxEventPages20，并以 tabView.count<20 提供 creationEnabled。Q-PAGE-BUTTONS:31–69 进一步确认 New 依 creationEnabled，Paste 依 creationEnabled 且剪贴板类型匹配，Delete 仅在 tabView.count>1 时启用。因此正常按钮路径维持1..20页，最后一页应通过 Clear 重建而非 Delete 移除。

createPage、pastePage、removePage 函数的局部代码本身没有长度校验，updatePages 又按数组实际长度生成 tabs（Q-EVENT-EDITOR:86–96；Q-BATTLE-EDITOR:117–127）。因此上述是**普通 UI 路径的页数限制**；不能只凭它裁定导入0页/21页会报错、会截断，或 runtime 数据格式硬性只能有1..20页。

## 未决项与最小实际实验

本节只保留静态源仍不能证明的事项，不把未执行当成已通过。实验应在一个独立临时工程中完成，保存操作前后比对 JSON；无需修改用户现有游戏。

1. **控件绑定和信号顺序**：新建空页，选择人物图再改图块/空图，确认 priority 联动；另以自定义 priority 无操作保存，确认没有被选择动作规则覆盖。
2. **已有异常值的处理**：对速度0/7、频率0/6、阈值越界和未知枚举，在临时工程分别检查只打开/保存、操作对应控件再保存的差异。静态 model 限制不能证明 loaded value 的钳位时机。
3. **页数和空页列表**：检查 New/Paste/Delete 按钮在1页和20页时的状态；以临时JSON的0页和21页检查编辑器是否接受、显示或改写。不要用 runtime 可以遍历数组来替代编辑器验证。
4. **模板与最终保存**：在真实新建/清空后核对全部 dormant 条件值、route 与 end marker；确认 QML 初始化和原生写文件路径没有增加额外规则。
5. **快捷事件与项目模板创建**：门、宝箱、旅馆、传送的快捷入口会在 Event 模板上继续生成内容（Q-MAP:111–125,343起），不等于普通空事件工厂初值；本票没有展开各快捷事件的剧情与命令生成。新建项目从随包模板复制的流程也不由数据库空条目工厂自动代表。

本报告不会因为“正常控件可输出”就决定 DSL 自动修复输入，也不会把工厂初值强加给反编译已有数据。最终哪些值做 Compiler Default、哪些越界状态保留或报错、是否采用编辑器创建上限，均留给决策地图。

## 问题完成度

| 问题 | 状态与本轮结果 |
| --- | --- |
| 普通地图事件新建、地图页新增和清空的初值 | 已答，静态工厂调用链闭合；列出外层覆盖字段与完整空页默认值 |
| 公共事件和敌群数据库增容、清空的初值 | 已答，主窗口配置、分页转发与通用工厂闭合；公共事件配置上限1000、敌群2000 |
| 战斗页新增、清空的初值 | 已答，直接读取 BattleEventPage 模板；区分清空整条 Troop 与清空单页 |
| 地图移动、优先级、触发器、独立开关、战斗 span 枚举 | 已答，控件模型与绑定转换提供静态依据 |
| 变量条件、战斗回合和 HP 的数值上下界 | 已答控件明确声明的边界；底层 SpinBox 的小数精度与 normalize 完整行为仍部分未答 |
| 人物图索引、方向、图案与标准 B..E 图块的选择域 | 已答正常选择器输出的静态规则；非标准尺寸资产和异步加载的实际结果仍部分未答 |
| 正常按钮路径的页数 | 已答，Map Event 和 Troop 均为1..20页；异常导入与直接函数调用不由此结论覆盖 |
| 快捷事件、全新项目随包模板复制的全部路径 | 未展开；已定位普通工厂与快捷入口的区别，未称为全部创建路径完成 |
| 真实编辑器保存、游戏执行与已有异常值的处理 | 未执行；保留上节最小实验，未将静态结果写成运行通过 |
| 最终 Compiler Default 和输入验证政策 | 待后续决策；本报告只提供事实，不替代完整支持契约 |

本轮只核对事件外层、地图页、公共事件和战斗页的属性工厂及相关控件，没有逐项逆向全部105类事件指令或45个移动路线代码。那些指令的覆盖与参数保真应查对应研究报告和验收票，不能由本报告的属性结论推出。
