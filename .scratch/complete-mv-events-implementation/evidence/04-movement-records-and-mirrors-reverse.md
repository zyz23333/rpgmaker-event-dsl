# 04：移动记录外壳、编辑路径与 505 镜像逆向

研究日期：2026-10-19（Asia/Shanghai）。对应 [04 号任务](../issues/04-native-movement-records-and-mirrors.md)。按规格顶部用户验收修订，核对实际交付编辑器的代码路径；没有操作编辑器 UI，也没有运行游戏。本报告发现 ADR 0015 原 absent/null 矩阵的数字 0 反例；用户随后明确回复“接受有限 zero 状态（推荐）”。已同步当前权威契约并完成本票有界逆向前置，产品实现与最终游戏验收由后续票承担。

## 要求与结论边界

- `MV-E04-ROUTE-PATHS`：已完成下述有界代码核对与受控 JavaScript 复算。页默认、205 默认、无参/有参构造、载入/克隆、插入/替换/复制粘贴、M0、完整 505 镜像及 flags 的路径均有定位。此项通过仅表示逆向问题已获得相应代码依据。
- `MV-E04-INDENT-COUNTEREXAMPLE`：已保留并复核对原契约的反例。载入/克隆后的 `indent:null` 指令被复制并粘贴到另一条 `indent:null` 指令前，目标原始运算推导出 `indent:0`。两种参数类型的精确提取函数复算均得到相同结果。原 absent/null 域不足的问题已通过下述用户明确批准的窄修订解决，没有把反例归一化或冒称旧契约本已支持。
- `MV-E04-ZERO-CONTRACT`：已完成获批准契约的文档核对。非终止项允许 absent/null/zero，默认 absent；zero 直接编码 0且需显式反编译，其他数字拒绝。只签收契约同步；本票不签收14/33的产品实现或最终游戏运行。

代码观察、ECMAScript/JSON 推导和受控 Node 复算在下文分别标明。复算的 `saved` 数据是指定函数在隔离环境中的 JSON 结果，**不是编辑器写盘捕获**；也不构成 R3/R6 游戏观察。

## 目标身份和原始证据

目标为 `references/RPGMV/RPGMV.exe`，**19,595,264 bytes**，本轮重新读取的 SHA-256 为 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。复用先前真实 REA PE 资源 Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` 及[其原始版本解析说明](../../complete-mv-events/research/editor-serialization.md#目标身份与版本)：FileVersion 1.6.1.0 / ProductVersion 1.6.1。该旧 Evidence 本轮未重新请求；它不证明运行或发行来源。

本轮未开启、切换或关闭其他代理的 REA 原生分析目标。QML/JavaScript 用原创只读 Node `fs/zlib/crypto` 程序从已知记录边界解码，检查外层长度、解压消耗长度、解码长度和 SHA-256；新定位的两个对话框由同一资源段的完整记录读取确定。偏移从 EXE 文件头 0 起算，stored 包含外层 4 字节长度；plain 的后续内容为 UTF-8，zlib 另有内层 4 字节解码长度。角色来自完整文本和调用关系，没有声称恢复 qrc 名称树。`Q@offset:line` 为解码文本按 CRLF/LF 切分的一基行号。

完整位置、长度和哈希见 [04-resource-identities.json](04-resource-identities.json)。关键项如下：

| Q@offset | 角色 | stored / decoded bytes | 编码 | decoded SHA-256 |
| ---: | --- | --- | --- | --- |
| 346222 | 页模板 | 2617 / 11436 | zlib | `52fd4ca2a3f178712d94467c5770919cf716882e2ebc9a57bde0a963e9447165` |
| 653645 | 页路线对话框 | 927 / 923 | plain | `6343dfa083bf2e1451a5af7867664957f4696bf7f950d8751857f108faee3456` |
| 665677 | 共用路线布局 | 992 / 3578 | zlib | `199459336be17ccb510d1912ef53648342e8903ea95d84b59275f6bcbf4b135e` |
| 672838 | 移动指令列表 | 1325 / 4997 | zlib | `2180bf600ca5a34ebbf35f65a343ca95be10055e3abcc7561efd5bc4fab8f51e` |
| 683357 | 有参移动指令基类 | 528 / 524 | plain | `5f8ef1afae81820acbf38a4160b725efee36476bc6c555576f3b15796e9340ce` |
| 685092 | 移动参数对话框 | 1049 / 1045 | plain | `382dc3b59de7d967c897dcf0f7fafce0c7ed19598e07f3f357d16f8a8a827b69` |
| 701512 | Map Event Page 布局 | 1784 / 7813 | zlib | `d3f53b2536e23bb60f8b080f1692cec652262688cd20dd5184de5773dc9c3b15` |
| 771946 | 205 加载与保存 | 1393 / 1389 | plain | `95cf5319c62eeacfbea61afa69a05be5d5788e5b795f34f776a791adcab44615` |
| 808067 | M15 Wait 参数组件 | 708 / 704 | plain | `a7a02f3ae66eb20bdfc9339a9835fedb46fcc8c589de3bda2d672866b57f53a3` |
| 909009 | clone 与 JSON 保存 | 4291 / 24761 | zlib | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| 913300 | 移动 code/flag 表 | 1270 / 5566 | zlib | `0858eff5ff54f87975a9ac93bc93d8c79f2a62d137c87e49b5a6818970f87670` |

Qt 默认值使用**目标随包** `QtQuick/Controls/qtquickcontrolsplugin.dll`，780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`；本轮重新核对原 DLL 及既有解码文件哈希。CheckBox 在该 DLL 的 offset 290172（stored7338 / decoded7334；SHA-256 `5334c4d26069acd2e7445be4e78e8d0749f376ec21d33200c350226b7a64d17a`）继承 AbstractCheckable；后者 offset300501（5585 / 5581；`2fa2bb063b151e5da6ef8943ecfabd1fc67845ca1f07fbc8a367d9ef15b87390`）:87 明确 `checked:false`。EXE 的 CheckBox 包装 Q@893754 没有覆盖 checked。这是随包实现依据，未用其他 Qt 版本文档代替。

原始解码文本、解码器、复算程序和原始结果保留在本机仓库外 `C:/Users/Shuen/.codex/research-evidence/mv-editor-04-20261019/` 及同父目录的 `mv-editor-04-*.cjs`。元数据记录程序和原始文件哈希。仓库只提交原创结论、身份/位置元数据和自己产生的复算输入输出；不提交首方源文本。

## 初始化、载入与保存路径

| 路径 | 实际代码观察 | 有界结论 |
| --- | --- | --- |
| 新空白页 | Q@346222:22–23 的 Event / EventPage 模板含唯一 `{code:0,parameters:[]}`，repeat=true、skippable=false、wait=false，moveType=0 | 页的 M0 无 indent；非 custom 页仍保留完整路线 |
| 新 205 | 205 onLoad 在 eventData 非空时才加载；Q@665677:36 初始化为唯一 `{code:0}`；:44–58 两个普通 CheckBox、第三个显式 checked=true | 结合随包 checked=false 基类，新建局部初值为 false/false/true；M0 缺 parameters。不是共享 DSL 默认 true/false/false |
| 打开页路线 | Q@701512:167–173 读取已有 list、repeat、skippable；Q@653645:22–25 再用 DataManager.clone 将 list 交给共用布局 | 不是每次使用布局的空路线初值；已有 M0 和子指令键保留，克隆经过 JSON |
| 确认页路线 | Q@653645:28–31 回传 list/flags；Q@701512:174–180 写 list/repeat/skippable，显式 wait=false | 仅容器保存与主动确认路线不同；主动确认会设 wait=false |
| 非 custom 切换 | Q@701512:47–66 只通过 moveType 控制 Route 按钮 enabled | 在所读布局中，没有因 fixed/random/approach 删除 moveRoute 的操作 |
| 载入既有 205 | Q@771946:22–30 只读首 205 参数，以 DataManager.clone 复制完整 route.list，分别加载三个 flags | 505 不是参数对话框的加载来源；载入不会校验/合并矛盾镜像 |
| 保存/确认 205 | Q@771946:33–47 保存完整 list/flags，先生成 205，再为 list 前 length−1 项逐一生成 505 | 每个 505 唯一参数是对应整个子指令对象；不剥离 parameters/indent/未知键，不为末尾 M0 生成 505 |
| 数据最终序列化 | Q@909009:341–383、407–425 经 JSON.stringify 保存嵌套内容；:482–484 的 clone 为 JSON.parse(JSON.stringify(data)) | 缺键、空数组和 null 不等价；NaN 在 JSON 中成为 null。以上是目标代码与 JSON 语义推导，不是写盘捕获 |

无参构造走 Q@665677:95–103 的 flag=0 分支，创建只有 code 的对象。Q@913300:6–51 对应 M1–13、16–26、31–40，共34码；M0 不是右侧45个按钮之一。有参11码进入参数对话框；Q@685092:23–38 将 movementCode / movementData 交给组件、调用 load/save。基类 Q@683357:22–24 创建 code 和空 parameters，然后参数组件写完整槽；例如 M15 的 Q@808067:20–31 加载/保存单个 frames 槽。这些是构造状态；随后插入列表还会改变 indent。

M0 的两种既有形态分别有实际构造来源。列表 Q@672838:91–106 在跨过末行的多选中排除末行，:21–23 只有 code>0 才是有效项目；未从这些正常移动按钮/选择路径看到把 M0 当普通用户指令复制插入的依据。这不为合成 M0 indent:null 或无参非终止 parameters:[] 提供支持。

## 插入、替换与复制粘贴

移动列表 Q@672838 的完整局部路径如下：

- :119–127 参数编辑取得选中 slice，并把已有 movementData 交给参数对话框；flag0 没有参数对话框。
- :160–167 的 replace 先 remove，再经同一个 insertMovementData 插入新参数组件产生的记录；不是覆盖旧对象的部分参数。
- :169–181 的 insertMovementData 读取目标记录 indent 与首个待插入记录 indent 做减法，之后对每个插入记录的 indent 使用 `+=`。该函数没有缺值/null 特判，也没有递归清洗。
- :134–146 的 copy/paste 明确使用 JSON.stringify / JSON.parse，并将所得完整数组送入 insertMovementData。clipboardFormat 为 MovementCommand。因而复制本身已跨 JSON 边界，不能假定非数值 NaN 仍留在剪贴板对象中。
- 整个 205 组的外层事件列表 Q@667573:398–410、435–448 使用相似 JSON 复制和插入，但只调整外层事件记录 indent，未遍历嵌套 route.list 或 505 参数对象。

这给出比“插入总是得到 null”更精确的条件矩阵：

| 输入/目标状态 | 原始算术 | 插入项最终 JSON indent | 证据等级 |
| --- | --- | --- | --- |
| 新无参或有参记录无 indent，目标 M0 无 indent | undefined−undefined → NaN，undefined+NaN → NaN | null | 代码 + JSON 推导；两类精确函数复算一致 |
| 先插入再经 clone/保存重载，复制 null 记录，粘贴到 null 非终止记录前 | null−null → 0，null+0 → 0 | **数字 0** | 代码 + JSON 推导；两类精确函数复算一致；ADR 0015 反例 |
| 同一 clipboard null 记录粘贴到缺 indent 的 M0 前 | undefined−null → NaN，null+NaN → NaN | null | 同上；不能把所有 paste 结果概括为 0 |
| 有参记录主动重确认后 replace | 参数组件新建记录缺 indent；插入时 offset 因 undefined 为 NaN | null | 精确 M15 构造/replace 复算；不同于未编辑的保留 |
| 整个含上述记录的 205 组复制粘贴 | 只调整外层205/505 indent | 嵌套 0/null/缺键原样保留 | 外层代码 + 精确函数复算 |

## 受控精确函数复算

[04-controlled-replay-observations.json](04-controlled-replay-observations.json) 保存原始结果、每个所取函数的完整文本 SHA-256 与起止行号。运行环境 Windows / **Node22.23.0**。原创 harness 从已校验解码文本中直接提取 insertMovementData、copy、paste、remove、replace、clone、makeSimpleMovementData、M15 onSave、205 onSave、makeCommand，以及外层事件列表的 copy/paste/insertEventData。除将 QML `onSave:` 标签变成普通 JavaScript 代码块以执行该块外，不重写函数体。

隔离的 Node vm 中，模型更新、光标/选择 UI、helper.setModified 和 Clipboard I/O 为惰性替身；Clipboard 替身仅存取原代码交给它的字符串。没有实例化 QML、执行 TkoolAPI、使用系统剪贴板或运行游戏。所给 selectionStart/End 明确指向合法非终止项或插入目标。这种复算验证源代码表达式和已给输入的结果，不能证明 Qt 信号时序或实际用户操作已发生。

两类输入分别为 native flag0 对应的 `{code:1}` 和精确 M15 保存函数产生的 `{code:15,parameters:[60]}`。从原生模板提取 M0 开始，初次插入得到 NaN；原样 clone 后变为 null；复制并粘贴到第一条非终止项前后得到：

```json
[
  { "code": 1, "indent": 0 },
  { "code": 1, "indent": null },
  { "code": 0, "parameters": [] }
]
```

有参版本对应两条 `{code:15,parameters:[60]}`，分别具有 indent=0 和 null。所有步骤保留键存在性；没有先删除 indent 再比较。205 保存复算逐项严格比较完整镜像对象，并确认 M0 不生成镜像；整个205组复制后嵌套对象保持相等。这些原始断言均通过。原始复算结果保留不改；之后批准的是有限契约，**没有执行或签收产品对 numeric0 的支持**。

## 契约比较与已接受修订

发现时，ADR 0015 及 [保存形态决定 Q4](../../complete-mv-events/issues/12-native-saved-shape-model.md#answer) 只允许非终止指令的 indent absent/null，明确不支持数字 indent。上述 clone + copy/paste 的有界原生代码路径导出数字0，超出原已接受矩阵；04 因此曾保持前置阻塞，并将反例交主代理和用户决定。没有将其归一化成 absent/null，也没有永久降为 raw 或异常输入。

2026-10-19，用户在实施会话中直接回复“接受有限 zero 状态（推荐）”，主代理将该确认转交04执行。**已接受窄修订**：仅给非终止移动指令增加有限 `savedShape.indent:"zero"`，直接编码原生数字0；继续保留 absent/null，固定默认仍 absent，原生 null/0 必须显式反编译。无参指令仍缺 parameters，有参仍有完整语义数组；M0 仍缺 indent，仅允许 parameters absent/empty；505 必须与205的完整对象一致。其他数字缩进一律不因本修订获得支持。

已同步 [ADR 0015](../../../docs/adr/0015-bounded-native-saved-shape.md)、[实施规格 I5](../complete-mv-events-implementation-spec.md#i5--有限-native-saved-shape)、[权威决定票12 Answer 与追加历史](../../complete-mv-events/issues/12-native-saved-shape-model.md#answer)、[移动参数当前契约](../../complete-mv-events/research/command-parameters/movement.md#2026-10-19--已接受的有限外壳契约)以及04/14/33验收责任。Glossary 的 Movement Route / Native Saved Shape 定义已经覆盖此概念，未向词汇表添加表示细节。`MV-E04-ZERO-CONTRACT` 的通过仅说明这些契约记录一致，不代表正式 DSL、编反编译或 Push 已实现 zero。

没有证据支持任意正/负数字 indent、无参非终止 parameters:[]、M0 indent:null、额外字段或任意路线修复。本票不扩大到全部45码参数/域检查或运行语义。Qt 信号/本机剪贴板实现及实际磁盘输出未执行；本次确定了这些给定输入的代码结果及普通构造/clone路径，未将该限制包装成 UI 验证。

**当前状态：有界路径核对、反例记录与获批准窄修订的契约同步已完成。** 原 numeric0 决策阻塞已解除；14/33及相关最终输出验收仍需实际实现并验证完整数据。Qt 时序、系统剪贴板和真实磁盘输出未观察的限制仍然保留；最终真实 R1–R7 游戏运行要求保持有效。
