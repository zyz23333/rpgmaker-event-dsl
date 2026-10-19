# Ticket 10 — Change EXP 的输入、载入与保存边界逆向

2026-10-19；范围为 E315 常量 9,999,999 / 10,000,000，以及相同控件在初始化、已有参数载入、主动确认和容器序列化中的责任。本文依据同一安装的编辑器和随包 Qt 静态证据，没有操作编辑器 UI、执行抽出的 QML、运行产品或游戏。独立边界样本不是原生输入或落盘捕获。

本体的常量控件范围确为整数 1..9,999,999；帮助的 99,999,999 另行保留。输入八位文本与加载八位数值走不同路径：文本处理器先裁成七位，再转换和夹界；参数加载直接设置 numeric value，经完成后的 Qt setter 夹界。不能把两者都写成“输入 10,000,000 后保存 9,999,999”。目前没有发现要求改变已接受常量域的正常原生保存反例。

## 目标、身份与证据方法

原 EXE 为 `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`，19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。版本 1.6.1 / FileVersion 1.6.1.0 复用历史 PE 自报 Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`，出处见[既有身份记录](../../complete-mv-events/research/editor-serialization.md#目标身份与版本)。原 DLL 为同安装的 `QtQuick/Controls/qtquickcontrolsplugin.dll`，780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`。两项均重新核对原文件长度与 SHA-256。

[资源身份](10-resource-identities.json)登记 13 个 EXE 资源、3 个 DLL 资源及帮助文件。`Q@offset:line` 为 EXE 的外层长度字段文件偏移和完整解码文本的一基行号；`D@offset:line` 为 DLL 的同类定位。stored 包含外层四字节大端长度，压缩项另有内层解码长度和 zlib 流；解码检查原文件身份、外层/内层长度、完整流消费、解码长度和 SHA-256。不推定资源角色名就是恢复出的 qrc 路径。

首方资源、完整反汇编/伪代码和 Evidence bundle 均只留仓库外 `C:/Users/Shuen/.codex/research-evidence/mv-editor-10-20261019/`。解码脚本 `C:/Users/Shuen/.codex/tmp/mv-decode10.cjs` 使用 Node v24.14.0，只调用 fs/zlib/crypto。最终身份复核、结果记录和索引检查使用 Windows / Node v22.23.0。仓库只保留原创结论、身份、独立样本和限定复核结果。

复用历史同 DLL constructor、value setter、getter Evidence 时，检查了原 bundle 的 provider、subject digest 与实际 ID；没有把它们伪称本轮重新生成。本轮 REA 6.7.0 在无目标的 session 中打开该 DLL，使用 Ghidra 12.1.4 / JDK 21.0.8 补查范围变更、完成回调和步进；导出 13 条实际 Evidence 后关闭目标。普通 QML 解码不伪造 Evidence ID。分析 profile digest 为 `e4be421d1cb130970e81b108d97068b73c12565909b409a13178a5c07539573b`。

## 原生 SpinBox 的必要补查

| 定位与真实 Evidence ID                                                                                                                                                                                                                                                                       | 本票使用的事实与限定                                                                                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 历史 constructor `0x1000d330`；`ev_0abda227cbae2d1ac569a8e0af403fc960727b39b3d337287fe4165a16926d1d`                                                                                                                                                                                         | 初始 numeric value=0、step=1、complete 标志为 false、decimals=0，QDoubleValidator 初始 bottom=0/top=99；E315 随后覆盖边界。                                                                                                                                                                    |
| 历史 setter `0x1000d830`；`ev_8afbb164078efb658dc0c010e2df1ab29b438768b6b298f30d7081050a26f2f7`；本轮汇编 `ev_ae1911faa0320479a478eea39337ca236ba0fc7776b209eb89a8076bdcd8637f`                                                                                                              | complete=true 后，先取传入值与 top 的较小者，再与 bottom 取较大者；之后通过 QString 数字格式化/解析储存值。汇编明确读取 decimals 并使用固定格式 f；旧伪代码的 x86 QString 实参恢复有缺口，不能据旧文本解释任意小数、地区化或非有限输入。本票有限整数 1/9999999/10000000 的夹界不依赖那些扩张。 |
| 历史 getter `0x1000fe40`；`ev_50ea4007ffe961e0cc8548746f1a4767338c610df380759134d2d64f60c9e60f`                                                                                                                                                                                              | 读取对象 value 槽；不是从尚未规范化的显示字符串读取。                                                                                                                                                                                                                                          |
| constructor 汇编；`ev_ffa8953da93b0672dca1cffd45d3245ffccf4fa560fddfebdab9b6e1ca9c0973`；vtable 数据 `ev_bb3b852012c0bdcc01673249e992af4f96b1e21bae04a906ee6b89fe576cf48b`；metacast `ev_93088e268d2b48d73c480f15086eb91216dd7054e149f782f601f5931898ed42`                                   | constructor 把第二 vptr 写到 root+8；metacast 将 QQmlParserStatus 接口定位为 root+8；对应 vtable 在 `0x100200d4`。vtable 的 classBegin 为空，componentComplete 槽指向 `0x1000d580`。角色由接口布局和函数效果共同推导，不冒称完整调试符号。                                                     |
| classBegin `0x10005e10`；`ev_2e638e5d3ab3ea0eb2281c23ad528cd0dd9909510aec03a1827a50a858570499`；complete `0x1000d580`；`ev_a0a18cc3e6b738ca75aef453783ffa4cb11bf3d7fdfccb495a10104bc7a27405`                                                                                                 | complete 在接口 this+0x20（root+0x28）设 true，再以 root 当前 value 调同一 setter。因此完成之前可能暂存的 0 或域外赋值，并不能证明完成后正常保存仍绕过夹界。                                                                                                                                   |
| minimum `0x1000d730`；`ev_839f70686f6e755c40b88e1c5d34a599741ccd3dea33c5989c3e060d4718556d`；maximum `0x1000d6e0`；`ev_07f23377552d6397433b795aa5972be0c8c6c9fe5b371c516a4f7464d6d75f86`                                                                                                     | 各自设 bottom/top、发对应变化通知；若已 complete，再把当前 value 交同一 setter。边界先设或后设的正常已完成控件都没有因此长期保留超界 numeric value 的路径。                                                                                                                                    |
| 元对象方法分派 `0x10019f20`；`ev_411f5fc29e54f8bcd166c7ee8c4ea8e4f520d83236c113292ba33c2ed5561fc5`；加步长 `0x1000d640` / 减步长 `0x1000d5b0`；`ev_5e1182f429918d0a5f58f7f0c62c9206b2855a77f9dce3a0aa85c545928d3899` / `ev_614268972718da0dd89280b06ea41cb973aff583f0d5701ec73d0f1e3beccd1c` | ±step 都把计算值交 value setter；不是直接写无界 value 槽。默认 step=1，E315 未覆盖，端点不能靠单次正常步进越过。                                                                                                                                                                               |

导出 bundle 还保留一次类名字符串读取和析构 thunk 的辅助记录，不把它们当新增行为证明。Ghidra 的 terminal-call flow 等限制保留在原记录中，不因本文结论删除。

## 构造、载入和明确保存槽

Q@803041:15–32 创建 actor target、operation、operand 和 Show Level Up。E315 在 :23–26 将 operand 最大值覆盖为 **9999999**。共用 operand Q@683885:15–19 将 minimum/maximum 直接别名到常量 SpinBox，声明 operandType 和 int operandValue；:39、47–48 为 Constant 默认选中、minimum=1、基础 maximum=9999，被 E315 的别名覆盖。

新建参数命令经 Q@679418:174–184 传 null eventData；Q@656916:24–30 设置组件属性后调用 load；E315 的 onLoad 只在 eventData 存在时恢复六槽。actor 固定模式为默认 checked，GameObjectBox 的 currentId=1；operation 默认为 Increase/gain。常量没有显式 value 声明，原生 constructor 从 0 起步，componentComplete 及 min 变化会经 setter 落实 1 的下限；这是已完成正常构造的初值推导，不是从 minimum=1 单独猜测初值。D@300501:87 的 checked:false，经 D@290172 与 Q@893754 未被覆盖，支持新建 showLevelUp=false 的同包初值推导。以上不授权任何新增 Compiler Default。

既有事件的 E315 onLoad Q@803041:35–43 分别恢复 actor selector、operation、operand 和 checkbox。constant 模式的 setup Q@683885:156–164 直接赋 numeric value；variable 模式把 p4 赋 variableId，二者不是同一路径。已完成常量控件载入 9,999,999 时保留该数值；载入注入的 10,000,000 时按 setter 范围夹到 9,999,999。若赋值发生在 complete 前，完成回调或边界之后的重设仍会落实范围。确切初始化信号顺序未实际观测，但该暂态不能单独构成正常已完成参数确认的域外保存反例。

E315 onSave Q@803041:45–55 在 eventData 为空时先造一个 code315/indent0/parameters[]，随后把 **六个当前属性**写入 p0..p5：actor selector 两槽、operation、operand 两槽、checkbox。常量 p4 来自 numeric value，不是 `__text`；variable p4 是变量槽 ID，不是该变量的运行值。保存函数没有再次按帮助上限验证、直接解析用户文本或把已保存 EXP 运行结果写回参数。

## 文本输入与数值赋值不能混称

编辑器 SpinBox 包装 Q@875471 的完整文本已读；关键处理是：

- :61–63 的 normalize 用 prefix+numeric value+suffix 重写显示文本；:71–80 在 activeFocus 或 enabled 变化时调用它，:134–141 的上下键处理也规范显示并选择数值。
- :83–85 把找到的内部 input.validator 设为 null。不能仅引用 Qt 默认 validator 就声称八位文本一定被原生 QValidator 拒绝；外层还实现了自己的文本清理。
- :87–130 仅在 `__text` 为真值时处理：移开首部 prefix/尾部 suffix，按 minimum/maximum 的 toFixed(decimals) 长度计算 maxTextLength，移除一次不匹配字符；minimum>=0 时移除一次负号，decimals=0 时移除一次小数点。正则未带 global，不能声称任意粘贴均会被彻底清理。
- :110–113 **先按七位裁尾**，之后 :115–123 Number 转换并按 1..9999999 夹界，才设置 numeric value；:125–126 更新显示字符串。不能忽略顺序而把八位文本的结果写成单纯上界夹取。

对仅含 ASCII 数字的完整输入，这段处理器的一次调用有确定的局部计算：`"9999999"` 保持七位，候选值为 9999999；`"10000000"` 先成为 `"1000000"`，候选值为 1000000。逐键输入、粘贴、原生 validator.text 通知、focus/accepted 与重入可能使中间输入和显示回写顺序不同，因此本文仅把这些数列为**一次处理的条件推导**。它们不是实际 UI 后最终落盘值；报告尤其不保证所有输入方式都得到 1000000。

随包 SpinBox D@160589:84–134 将 value/min/max/decimals 别名到 SpinBoxValidator；:304–309 在 ready 后将 validator.text 写回 input，完成时初始化文本；:310–317 的 accepted 重写 validator.text 并选择数值，editingFinished 只转发信号。E315 没有订阅 editingFinished 来另做 EXP 解析或扩域。确认链 Q@656916:33–40 读取当前 numeric value；ModalWindow 的 close/ok 与 focus 信号精确先后未运行，不能声称“OK 一定先把用户整串按上限夹取”。

空显示文本在包装的 if(text) 外跳过数值转换，保存仍读此前 numeric value；这一点不是把空文本转换成 0 的路径证明。复杂无效粘贴、NaN、地区化、IME 或跨对象强行写入不属于本票已证普通十进制边界；不从未运行的恶意注入扩大本票结论，也不删除其不确定性。

## 仅保存容器、变量与独立旗标

复用[03 的命令/容器保存链](03-branches-and-battle-reverse.md)：Q@667573 的 edit 才打开 E315 参数组件；仅保存事件容器不遍历逐条打开命令对话框。DataManager Q@909009:341–379 的 stringifyEx/stringifyDatabase 及 map 保存路径只序列化已在容器中的对象，没有按 code315 重设 p4。若外部注入一个 p4=10000000 的结构，再只做容器序列化，十进制整数会被 JSON 表达保留；这不是证明普通 E315 输入可创建该常量，也不把合成域外值变成正式支持值。磁盘写入 TkoolAPI 的成功没有执行。

variable 模式载入/保存的是变量 ID，目标变量运行时存 10,000,000、0 或负数均不流经此常量 SpinBox。更大运行值及 gain/lose 效果由实际游戏验收另证；仓库外已有 literal runtime 准备不计为本票、产品输出比较或最终 R7 通过。

Show Level Up 的 enabled 在 Q@803041:32 依 operation==gain；onLoad 直接恢复 p5，onSave 直接写 checked。lose 下 disabled 与 checked=false 没有等价关系；载入 lose+true 后未切换 checkbox，其保存仍可为 true。enabled 控件只影响交互，不构成删除或改写独立保存 boolean 的证据。

## 帮助差异与契约比较

同安装 `references/RPGMV/Help/page/01_10_05.html`（SHA-256 `e379f054be2c08d4c1a1ab54538027794aa51d3c6554a217f658dd3c5b51aa5a`）:125 的 Change EXP Operand 明写 1..**99999999**。本体明确最大值为 **9999999**，两者差一位 9。本轮新补原生证据独立支持控件落实范围；没有拿用户已接受范围冒充 native 实现结论，也不把帮助的描述升级为可达保存路径证明。

[已接受的值域决定](../../complete-mv-events/issues/13-native-value-domain-boundaries.md#change-exp默认与阶段责任)、[E315 参数表](../../complete-mv-events/research/command-parameters/actors-battle.md#e315--change-exp)和 [ADR0011](../../../docs/adr/0011-native-command-state-and-validation.md)维持常量整数 1..9,999,999，变量运行值不套此上限；showLevelUp 独立、无新增 Compiler Default。正式 authoring、Decompile 和 recognized Raw 的同域校验是后续产品责任，本票没有以编辑器重确认夹界为由在产品中自动修复域外值。

仍未知的是实际逐键/粘贴/IME、原生信号重入和 OK/focus 的精确最终显示与时间线。必需保存契约不要求复刻这些编辑动作；本票已追到正常完成、数值载入、步进、确认与序列化的边界，没有发现未界定且会强制扩大常量域的正常保存路径。因此本票可以关闭其有界逆向前置；后续若出现正常原生域外保存反例，仍须回到领域决定，不能引用本票来拒绝反例。

## 独立样本与逐项复核结果

[边界样本](10-exp-inputs.json)包含独立写定的完整六槽值、原始文本及各路径前提。没有 eval 抽出代码；局部结果只是阅读代码后的条件预期，不是 native/product 执行输出。每条记录在明确 scope 下核对下列义务；unknown 时序未被记成已验证 UI 行为。

| ID                   | 输入/前提                                         | 核对结论                                                                                                  | 证据层级与限制                                   |
| -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| MV-E10-RANGE         | E315 常量配置                                     | E315 设 maximum9999999，共用 minimum1，decimals0；帮助不覆盖本体。                                        | 本体/同包原生事实，未执行 UI。                   |
| MV-E10-INITIALIZE    | 新建 null eventData、正常组件完成                 | 固定 actor1、gain、constant；0 经完成/范围 setter 落实为1；checkbox 初值 false；不新增 Compiler Default。 | 控件构造条件推导，非首次保存捕获。               |
| MV-E10-LOAD-MAX      | constant numeric p4=9999999                       | setup 赋 value，完成后同范围 setter 保持端点，确认读取当前 numeric value。                                | 本体赋值事实与原生 setter 条件推导。             |
| MV-E10-LOAD-OVER     | 注入 constant numeric p4=10000000 后重开参数      | 完成后的 setter 候选夹到9999999；若先赋值，complete/边界变更重走 setter；不是文本裁尾路径。               | 合成域外载入前提，不是普通创建或落盘证明。       |
| MV-E10-TEXT-MAX      | 完整 ASCII 文本9999999进入一次文本处理            | 七位不裁尾，Number候选9999999，位数处理和数值范围一致。                                                   | 一次处理条件推导，信号最终时序未运行。           |
| MV-E10-TEXT-OVER     | 完整 ASCII 文本10000000进入一次文本处理           | 先取七位1000000，再转换与夹界；不能声称所有 UI 输入都会保存9999999或1000000。                             | 局部处理条件推导，非实际键入/粘贴结果。          |
| MV-E10-STEP          | 完成后上界+step1及下界−step1                      | ±step 交同 setter，候选10000000/0受边界限制；上下键另有显示 normalize。                                   | 同包原生事实与端点条件推导。                     |
| MV-E10-CONFIRM       | E315 参数 OK                                      | 对话框 save 写当前六属性，p4取numeric value；没有另按帮助解析原文本。                                     | 本体确认链事实，focus/OK先后未实际捕获。         |
| MV-E10-CONTAINER     | 合法上界或注入10000000，未重开 E315，仅序列化容器 | 容器不启动参数控件；JSON 序列化不为315夹界，注入值保留推导不构成正式支持。                                | 既有链和有界序列化事实，未实际磁盘写入。         |
| MV-E10-HELP          | 同安装帮助 Operand                                | 帮助99999999与本体9999999分别留证，未由帮助主动扩域。                                                     | 首方帮助文本观察，非运行结果。                   |
| MV-E10-VARIABLE      | operand mode1、p4=变量ID1；变量未来值10000000     | setup/save 使用 variableId，常量控件上限不约束变量运行值。                                                | 保存槽事实；运行结果交实际游戏。                 |
| MV-E10-SHOW-LEVEL-UP | lose+showLevelUp=true                             | enabled=false不清除checked；load/save独立恢复/保存p5=true。                                               | 本体保存事实，未实际点击 checkbox。              |
| MV-E10-TIMING        | typed text、setter、complete、accepted、OK/focus  | 明确区分文本、numeric value与回调；不把ready或原生完成事实扩写成精确UI时序。                              | 未决时序的限定记录通过，未知结果本身未判通过。   |
| MV-E10-CONTRACT      | 已接受常量域与所有上述路径                        | 无正常原生域外保存反例；无必需保存域的未界定阻塞；若新反例出现仍须重开契约。                              | 有界一致性复核，不代替产品范围诊断、最终E7或R7。 |

本票只关闭 E7 的编辑器逆向前置。49–51 的最终逆向证据与产品输出比较、52–54 的真实游戏回归，以及本规格的其他逐项要求继续由相应票承担。
