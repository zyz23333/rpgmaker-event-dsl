# 05 — Timer Stop 槽位的逆向核对

核对日期：2026-10-19（Asia/Shanghai）。本票按用户修订后的 reverse-engineer-anything 验收方式，核对目标编辑器与随包 Qt 的保存路径。这里的数组是代码推导，未冒称实际编辑器 UI 创建、磁盘捕获、产品往返或游戏运行。

## 目标、留存与方法

目标 `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe` 为 19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。本次重新校验身份，与历史 PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` 一致；其 FileVersion 1.6.1.0 / ProductVersion 1.6.1 仅复用自报版本，不认证发行来源。没有打开新的 REA native session，也没有生成新的 Evidence ID。

复用 [E124 参数研究](../../complete-mv-events/research/command-parameters/core.md#e124--control-timer发现正常保存形态新增设计依赖)、[共享控件与保存链](../../complete-mv-events/research/command-parameters/shared-controls.md)、[03 保存路径核对](03-branches-and-battle-reverse.md)。实际目标字节经 Node fs/zlib/crypto 只读解码，验证外层长度、压缩消费边界、decoded 长度和 SHA-256，再阅读完整资源；没有 eval、加载 QML 或执行抽取代码。原始首方文本保留于仓库外 `C:/Users/Shuen/.codex/research-evidence/mv-editor-05-20261019/`；脚本为 `C:/Users/Shuen/.codex/tmp/mv-decode05.cjs` 与 `mv-decode05-support.cjs`。仓库只保存原创结论与 [资源身份 metadata](05-resource-identities.json)。

下表 offset 从文件头零起算，stored 含四字节外层长度。角色由内容与调用关系识别，未恢复 qrc 名称树；`Q@offset:line` 为 decoded 全文的一基行号。

| 目标   | 角色             | offset | stored | 编码  | decoded bytes | decoded SHA-256                                                    |
| ------ | ---------------- | -----: | -----: | ----- | ------------: | ------------------------------------------------------------------ |
| EXE    | Control Timer    | 793186 |    586 | zlib  |          2048 | `095449887fbb1f73c8a292ee6c304256cb5cd422f7901a53b3acf16a290cd670` |
| EXE    | Group_Operation  | 680842 |   1335 | plain |          1331 | `0d87a64dcdc267fcbce7aca42df12a3b665df6153be84b5701eade6113ed8cc8` |
| EXE    | EventCommandBase | 686141 |    939 | plain |           935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| EXE    | Command dialog   | 656916 |   1086 | plain |          1082 | `0152387fa661f0e67f45b989248c60142881526cda1f31898e29c0e03366fbf7` |
| EXE    | DataManager      | 909009 |   4291 | zlib  |         24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| EXE    | Editor SpinBox   | 875471 |   1735 | zlib  |          7183 | `a94b75dfca7ceb95315d38a3897e8c389a96d71f56696329f0cf8edd20535984` |
| Qt DLL | Qt SpinBox       | 160589 |   3826 | zlib  |         13133 | `4b98b9d85a651cbe2f47e4abf7efaf67a25b9b942f5441b77cc5faae9643e0ca` |

随包 `QtQuick/Controls/qtquickcontrolsplugin.dll` 为 780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`。复用同身份 native SpinBox constructor 证据 `ev_0abda227cbae2d1ac569a8e0af403fc960727b39b3d337287fe4165a16926d1d`，其既有 Ghidra 12.1.4 报告保存在 `C:/Users/Shuen/.codex/research-evidence/mv-command-parameters-20261019/qt-spinbox-evidence.json` 与 `qt-spinbox-analysis.json`。旧 ID 为历史报告指针，本票未从当前 REA 会话重新取得该记录，也未重复反编译。

## 分开的代码路径

**初始化。** Q@679418:174–184 的 picker 为新建有参数指令传 null eventData；Q@656916:19–29 的 dialog 设置 eventCode/eventData 后调用 load。Q@686141:22–24 只在 makeSimpleEventData 时创建带空 parameters 数组的一条记录。Timer 不在输入秒数时写 parameters；Q@793186:63–65 只在第一次确认且 eventData 仍为空时创建它。

Group_Operation 的 operationType 为第一按钮 checked ? 0 : 1（Q@680842:20），第一按钮显式 checked:true（:27–33）；Timer 将两项改名 Start/Stop（Q@793186:15–22）。分钟范围为 0..99、秒为 0..59（:30–46），Time group 仅在 Start 时 enabled（:28）。同安装 SpinBox 默认值 0、decimals 0、step 1 由上述 native constructor 旧证据佐证；Editor SpinBox 没有另设 value/decimals/step。0 在两个控件的明确范围内，因此没有 minimum=1 的夹取先后疑问。新实例初始化成功仍是静态推导前提，未观察 Qt Loader/信号时序。

**加载与参数确认。** Timer 的完整 onLoad（Q@793186:51–59）取已有第一条记录的 parameters，设置 operation，并仅在原 p0===0 时由 p1 填分钟和秒；Stop 不把保留的 p1 填入控件。完整 onSave（:62–71）对已有数组仅写 p0；仅当新的 p0===0 时写 p1，Stop 路径既不清空 p1，也不缩短数组。Q@656916:33–40 的 dialog 在确认时调用 save，之后把 eventData 返回列表。Q@667573:370–377、425–446 的已有命令编辑/替换路径复用 03 的身份和核对；它可以统一 indent，但没有重建 Timer parameters。

**仅容器序列化。** Q@909009:341–383、407–424 将数据库记录及 Map Event 交给 JSON.stringify，没有遍历每条命令调用参数 save 或为 Stop 填默认值。对本票有限的 `[1]`、`[1,0]`、`[1,83]`，数组长度及 p1 数值因此原样进入序列化。TkoolAPI.writeFile 内部与最终磁盘成功仍不在静态报告证明范围。

## 保存结构结果与推导

| ID                         | 输入/路径                                                   | 可复核结论                                                                                        | 等级与边界                                                                            |
| -------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| MV-E05-START-BOUNDS        | 新建/重确认 Start，分钟 0..99、秒 0..59                     | p0=0 时写 p1=分钟×60+秒，正常新建恰为 `[0,seconds]`；支持整数 0..5999，边界为 `[0,0]`、`[0,5999]` | 控件域与保存表达式为代码观察；不据异常数组的容忍度扩大契约，Q@793186:30–46、62–71     |
| MV-E05-START-DEFAULT       | 新实例、null eventData、不改默认而确认 Start                | 第一 operation 显式默认0，随包 SpinBox 值0且整数步长1，推导新建 Start 为 `[0,0]`                  | 静态推导；复用同身份 Qt native 旧证据，未实际打开编辑器                               |
| MV-E05-NEW-STOP            | 新建 null eventData，选 Stop 后首次确认                     | makeSimpleEventData 创建空数组，随后只写 p0=1，精确得到长度1的 `[1]`                              | 静态推导；不依赖 disabled 数值显示，Q@686141:22–24、Q@793186:62–71                    |
| MV-E05-SAVED-START-ZERO    | 已确认并保存的 Start `[0,0]`，重开参数窗口改 Stop           | onLoad 沿用已有数组，onSave Stop 只改 p0，得到长度2的 `[1,0]`                                     | 静态推导；起点是已保存 Start，不是尚未确认的新窗口，Q@793186:51–71                    |
| MV-E05-SAVED-START-NONZERO | 已确认并保存的 Start `[0,83]`，重开改 Stop                  | onLoad 显示1分23秒，Stop 保存仍沿用旧 p1，得到长度2的 `[1,83]`                                    | 静态推导；普通编辑代码可达路径，无需手改 JSON，未冒称实际 UI 生成                     |
| MV-E05-STOP-RECONFIRM      | 分别载入 Stop `[1]`、`[1,0]`、`[1,83]`，保持 Stop 再确认    | onLoad 不读 p1 到控件；onSave 不写/删 p1，因此三种数组分别保持长度1/2/2及原值                     | 完整 load/save 路径推导；不能从 disabled 控件显示0推出保存值被覆盖                    |
| MV-E05-UNSAVED-TOGGLE      | 新建窗口中在 Start 输入83秒，未确认即切 Stop，再首次确认    | 输入只改变控件，eventData 仍为空；首次 Stop 确认创建空数组，结果是 `[1]`                          | 静态推导；与“保存 Start83 后重开改 Stop”的两次确认路径分开                            |
| MV-E05-CONTAINER           | 已有 `[1]`、`[1,0]`、`[1,83]`，不重新确认参数而保存事件容器 | 所读容器路径仅 stringify，保留数组长度和0/83值，不调用 Timer onSave                               | 序列化责任为代码观察；不是实际文件捕获，也不是产品输出比较，Q@909009:341–383、407–424 |
| MV-E05-START-REEDIT        | 新实例载入 Stop83，主动改回 Start后确认                     | onLoad 不从 Stop 的83回填控件；新的 Start 分支使用当前控件，若保持新实例默认0则改写为 `[0,0]`     | 有条件推导；显式编辑动作可改变状态，未穷尽 Qt 运行时序，不授权 DSL 无损保存时归一化   |

已存 Stop 的三个样本同时也是独立有限输入的处理推导；其中一槽与两槽0/83另有上述普通构造/编辑代码链。没有把任意合成输入都称为原生正常创建，也没有运行抽取逻辑后把仿写输出当独立原生期望。

## 契约比较、未知与放行范围

本票与 ADR0012/0015 和已接受 D-TIMER 一致：Start 的 seconds 必需；Stop 的可选 seconds 直接表达槽位存在性，省略或 undefined 缺槽，显式0与83保留；存在值仍是整数0..5999。disabled 只控制界面可操作性，不抹掉保存字段。没有发现必须改变这组既决保存契约的原生代码反例；不补0、不丢已有 p1，也不回退 raw。

剩余未知为真实 Qt Loader/对象创建与信号完整时序、TkoolAPI 写盘实现和实际磁盘捕获。Stop 分支不消费控件值，已有数组不会被该分支覆盖，因此这些未知没有形成当前有限保存契约的反例。新建 Start 的默认0及改回 Start 的行为继续明确带新实例/初始化成功条件。未对 null、域外值或额外参数的容忍度作产品支持承诺。

本票仅解除 26（Timer 产品实现）相关逆向前置。正式 DSL 编反编译、验证、Workspace输出比较及最终 E4 产品比较由 26/50 负责，实际 R1–R7 游戏运行由 52–54 负责。`passed` 记录仅指本报告中有边界的逆向核对已完成，不等于这些后续责任通过。
