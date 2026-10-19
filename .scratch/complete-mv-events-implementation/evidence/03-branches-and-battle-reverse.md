# 03 — 分支、Body End Marker 与 Battle 初值的逆向核对

核对日期：2026-10-19（Asia/Shanghai）。依据实施规格开头的用户验收修订，以 reverse-engineer-anything 工作流核对实际编辑器代码；没有启动或操作编辑器，没有把静态结果记为 UI 捕获。本报告只解除本票所列代码事实疑点，不替代产品测试或 R1–R7 实际游戏运行。

## 目标、留存与方法

目标 `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`：19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。与既有 PE Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` 的身份一致，其自报 FileVersion 1.6.1.0 / ProductVersion 1.6.1 仍按原证据复用，不认证发行来源。本次 REA 6.7.0 会话确认未打开目标、无 retained 旧记录；因此旧 ID 是历史报告指针，不声称已从当前会话重新获取。本票未生成新的 REA Evidence ID。

先复用既有 [编辑器指令静态证据](../../complete-mv-events/research/command-contract-editor-evidence.md)、[核心参数表](../../complete-mv-events/research/command-parameters/core.md) 和 [保存链](../../complete-mv-events/research/command-parameters/shared-controls.md)，再只读解码既有资源并逐项核对哈希。新增调查仅补随包 Qt 的 CheckBox/AbstractCheckable 默认值，未重新分析已有 native SpinBox。

首方完整输出及可复核本地身份表保存在 `C:/Users/Shuen/.codex/research-evidence/mv-editor-03-20261019/`，包括 `resource-manifest.json`、`qt-resources-manifest.json` 和选中资源全文；不进入 Git。读取脚本在 `C:/Users/Shuen/.codex/tmp/mv-decode03.cjs`、`mv-qt03b.cjs`。所有脚本仅 fs/zlib/crypto 解码，不 eval、不载入 QML、不调用目标函数。原始二进制不修改。

资源定位以文件头零起始 offset 和包含外层四字节的 stored 长度为准；解码沿用既有报告的长度前缀格式，并验证外层长度、解码长度及压缩消费边界。下列角色来自完整文本及引用关系，未冒称恢复了 qrc 名称树。`Q@offset:line` 的 line 是解码全文的一基行号。

| 角色                    | offset | stored | 编码  | decoded bytes | decoded SHA-256                                                    |
| ----------------------- | -----: | -----: | ----- | ------------: | ------------------------------------------------------------------ |
| EventCommandBase        | 686141 |    939 | plain |           935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| Show Choices            | 706715 |   1413 | zlib  |          6097 | `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283` |
| Conditional Branch      | 748645 |   1102 | zlib  |          5024 | `e94ba6162d753827591839fd6d1aa7d793d40270a6ddbfa5ddbb093476872dcb` |
| Battle Processing       | 782932 |    901 | zlib  |          3628 | `a492dfc999be4fb3e3ca213300cd9a751649adc8da49edd18efd4ce48544787a` |
| Command dialog          | 656916 |   1086 | plain |          1082 | `0152387fa661f0e67f45b989248c60142881526cda1f31898e29c0e03366fbf7` |
| Event command list      | 667573 |   3694 | zlib  |         17486 | `bbc1e26fa83771fc56581b1dc34ec762b3789444dacef76cb24334834e17e82c` |
| Command picker          | 679418 |   1424 | zlib  |          7863 | `8e83b762134d12696649e6302adec9f40bbad7618b2c9cbff5ad945f005dd829` |
| EventCommands flags     | 922020 |   3441 | zlib  |         15177 | `dfc6ccb9eb02a7c90acc5b27aa351b912e1847cdc90d00dbb93bb29991ea32a6` |
| ModalWindow             | 878315 |   1884 | zlib  |          8437 | `875ac97ba5e20ab1a457399321e9621d3b56a698aaeeadc78c9584f3b69a970e` |
| DataManager             | 909009 |   4291 | zlib  |         24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| Editor CheckBox wrapper | 893754 |   1005 | zlib  |          3826 | `13ce867d2bf5d9081e234e2cc4b3330a59fad91ed351baddec15b6a553376467` |

随包 `QtQuick/Controls/qtquickcontrolsplugin.dll`：780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`。这与共享控件研究目标一致；本次按长度格式有界定位其嵌入 QML，再阅读以下完整资源。其 qrc 路径同样未重建。

| 角色                 | offset | stored | 编码  | decoded bytes | decoded SHA-256                                                    |
| -------------------- | -----: | -----: | ----- | ------------: | ------------------------------------------------------------------ |
| Qt CheckBox          | 290172 |   7338 | plain |          7334 | `5334c4d26069acd2e7445be4e78e8d0749f376ec21d33200c350226b7a64d17a` |
| Qt AbstractCheckable | 300501 |   5585 | plain |          5581 | `2fa2bb063b151e5da6ef8943ecfabd1fc67845ca1f07fbc8a367d9ef15b87390` |

## 分开的代码路径

**新建。** Q@679418:174–184 把有参数命令的 eventData 设为 null 后打开命令对话框；Q@656916:19–29 加载相应组件并传入 eventCode/eventData/troopId，再调用 load。Q@878315:24、64–67、249–260 表明 ModalWindow 内容经 sourceComponent Loader，active 依窗口 visible，打开后调用内容 init。由可见代码判定新建不从上一个命令参数回填；实际 Qt Loader 对象创建/销毁与 Repeater 完成时序没有动态观察，下面依赖新实例的结论明确标为推导。

**主动重新确认。** Q@667573:370–377 只为 flag=1 的所选命令传入已有切片并打开参数对话框；Q@656916:33–40 在 OK 时调用组件 save；Q@667573:425–446 用返回的完整切片替换原记录并统一调整 indent。该路径可以重新生成分支与参数，不能当作对整个工程无操作保存的通用转换。

**仅容器序列化。** Q@909009:341–383、407–424 将数据库条目（包括 Troops 内嵌 pages）和 Map Event 条目交给 JSON.stringify，不递归遍历或重新确认每个事件命令。对所读序列化路径，已有正文/尾标记不会被按执行用途删除或补齐。TkoolAPI.writeFile 的内部实现、全部界面信号和磁盘成功不是本票所证明的范围。

## 保存结构结果与推导

| ID                   | 输入/路径                                          | 可复核结论                                                                                                                                            | 等级与边界                                                                                   |
| -------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| MV-E03-BODY-EMPTY    | 新建 Conditional、Choices、Battle 的空子体         | 各 makeBlockArray 对长度零的体生成 indent+1、parameters=[] 的 code0；它属于 Child Command Body，区别于容器最终0                                       | 目标代码观察；Q@748645:117–139、706715:140–169、782932:73–106                                |
| MV-E03-BODY-NONEMPTY | 非空体含/不含单一尾0，主动确认父命令               | 收集并拼接原非空体，不无条件追加0；原有尾0和缺失尾0均保留                                                                                             | 完整循环的代码推导；没有宣称缺失尾0可由普通 UI 创建                                          |
| MV-E03-BODY-NESTED   | 父体中含更深一层分支和其尾0                        | 收集条件只以父 topIndent 区分；更深记录按原序列保存，不把内部闭合当成父分割                                                                           | 代码推导；前提是既有合法嵌套结构，不泛化为任意异常数据                                       |
| MV-E03-ELSE          | 无 Else、空 Else、非空 Else                        | hasElseBranch 只找同 indent411；确认仅在 checked 时写411，并总写412；关闭 Else 会移除其内容                                                           | Q@748645:90–139 代码观察；该删除是显式编辑动作                                               |
| MV-E03-LOOP          | 新建空 Loop；插入/删除正文；载入非空无尾0 Loop     | picker 生成112、深一层0、413；列表插入整体调 indent，原0保留；Loop flag0，没有父参数 save/重确认函数                                                  | Q@679418:202–207、Q@667573:370–377、407–446；普通 UI 创建无尾0仍未证明，不据此限制已接受能力 |
| MV-E03-402           | 各选择文字及分支                                   | 402 parameters=[j,choices[j]]；数量/文字顺序与102 header一致，不能忽略镜像                                                                            | Q@706715:126–137 代码观察                                                                    |
| MV-E03-403           | Cancel Branch，正常最多六个 choices                | save 取j=maxChoices=6并构造[6,choices[6]]；索引6无值，经最终 JSON.stringify 数组语义得到[6,null]                                                      | 代码+标准 JSON 语义推导；不是磁盘捕获                                                        |
| MV-E03-CHOICE-ONE    | 一项已存 Choices，加载新实例后不修改第二字段而确认 | onLoad 只填已有项，未清空剩余字段；若第二字段保留其初始本地化 No，则 save 输出第二项；越界 cancel 在 load 被设 Branch，default 原编号不按实际项数裁剪 | Q@706715:21–40、84–119；明确是新实例/控件就绪前提下推导，不保证全部 Qt 信号时序              |
| MV-E03-CHOICE-EMPTY  | 六字段全空、中间空、尾空/尾空格                    | save 仅移除尾部 length===0 且至少保留一项，中间空和纯空格不 trim；1..6项                                                                              | Q@706715:106–115 代码观察                                                                    |
| MV-E03-BATTLE-NEW    | 新建 Battle、未更改 flags                          | 两个 checked 都从随包 AbstractCheckable 的 false 初值继承；FF路径只写301，无601/602/603/604                                                           | 同安装 Qt 默认已补齐，见下节；控件创建成功前提下推导                                         |
| MV-E03-BATTLE-FLAGS  | FF、TF、FT、TT；之后关闭 flags 再确认              | FF=301；TF=301/601/win/602/escape/604；FT=301/601/win/603/lose/604；TT包含三体；空体补0，非空体原样；关闭 flags 丢弃相应体                            | Q@782932:37–106 代码观察；每层 closing记录与 body0分别保留                                   |

插入/删除的边界：Q@667573:407–446 的 remove/replace/insertEventData 只删除所选切片或插入记录，未出现全列表“删除所有 code0”的规范化。Q@667573:305–353 的选择算法会扩大到主命令所属结构，并避免将非末尾0当普通主命令终点。因此本报告只证明“在已有空体0前插入正文会留下0”和对所读普通删除路径的有限行为，不宣称穷尽全部快捷键/剪贴板输入，也不编造普通无尾0创建证明。

## Battle/Else 默认的新增随包证据

旧研究只用上游 Qt 5.7 AbstractCheckable 的 checked:false 佐证隐含初值，并保留随包版本不完全对应的限制。本次实际读取上述同安装 DLL：Q@290172:97 根类型为 AbstractCheckable；Q@300501:87 直接定义 checked:false。Qt CheckBox 的 checkedState 绑定 checked，且 partiallyCheckedEnabled=false（Q@290172:114、130），初始化没有将 false 强制改 true 的路径。编辑器包装 Q@893754 完整113行未覆盖 checked；Battle 两个 CheckBox（Q@782932:25–34）和 Conditional Else（Q@748645:61–65）也未设 checked。其 onLoad 仅在 eventData 非空时赋已有值。

因此在新建 null 输入下，Else 与 Battle flags 均为 false 的推导现在以实际随包控件声明为依据，不再依赖另一安装或上游版本的默认实现。用户主动点击、既有参数载入和未复原的 Qt 原生运行时序仍与此静态初值事实区分。

## 契约比较、未知与放行范围

本票所读路径与 ADR0011/0012/0015 的有界契约一致：空体必须有0；非空体显式保留其尾0状态；省略 Else 与空 Else不同；Choices402/403由父拥有；Battle分支随flags组合；主动编辑造成的替换不成为 DSL 无损归一化许可。没有发现必须改变产品领域行为的代码反例。

仍未证明的事项是：真实 UI/Qt 信号的完整运行时序、实际磁盘捕获、普通无尾0创建、异常结构的所有编辑路径。它们不被记为 UI通过，也不扩大产品支持域；普通无尾0本来就是接受的有限保存能力，已由规格明确不要求普通创建证明。一项 Choices 的潜在补 No 被保留为有条件推导，产品只按已接受的原样保存契约处理，不模仿该编辑动作。若后续更深逆向或实际游戏发现影响契约的反例，应追加证据并回到原决定。

本报告证明编辑器代码责任；独立合成期望、正式 DSL编反编译/验证/Workspace输出比较仍由13/27/28/46及最终49完成。R1–R7须实际游戏执行，不以本报告或 Node仿写代替。
