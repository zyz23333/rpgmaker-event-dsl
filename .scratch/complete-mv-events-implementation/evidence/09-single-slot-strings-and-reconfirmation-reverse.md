# Ticket 09 — 单槽字符串、输入限制与参数重确认逆向

2026-10-19；范围为 E118/E119/E320/E324/E325 和 E111/E122/M45 的单槽字符串。本文核对目标编辑器的构造、既有值赋入、普通输入限制、主动确认及容器序列化路径；没有操作编辑器 UI、执行抽出代码、读写系统剪贴板或运行游戏。原始字符串样本是独立合成输入，既不是普通 UI 创建证明，也不是原生落盘捕获。

八个命令的参数保存器都直接读取当前控件字符串，没有在命令保存函数中 trim、拆续行或裁尾。共用文本控件另有行数限制和按键处理，Qt 文档模型及信号时序可能影响载入后控件中的值。因此“只保存容器”“给控件赋已有字符串”“再确认参数”分别记录；保存器直接赋值不能证明这三条路径对所有字符串等价。本次没有发现要求改变已接受字符串保存域或 warning 规则的正常原生反例。

## 目标、资源身份与方法

目标 `references/RPGMV/RPGMV.exe`，19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，本次重新校验。版本 1.6.1 / FileVersion 1.6.1.0 复用既有 PE 自报 Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`，出处见[既有身份记录](../../complete-mv-events/research/editor-serialization.md#目标身份与版本)。没有新建、切换或关闭 REA 原生分析 session，也没有给普通资源解码伪造 Evidence ID。

[资源身份](09-resource-identities.json)列出 28 个同 EXE QML 资源的 offset、stored、压缩方式、decoded 长度和 SHA-256。offset 为文件头零起始的外层长度字段位置；stored 包含外层四字节长度，压缩资源另含解码长度和 zlib 流。每项均检查原 EXE 身份、长度字段、zlib 输入消费边界、解码长度与 SHA-256。Q@offset:line 为完整解码文本按 CRLF/LF 切分的一基行号，不冒充 qrc 路径。

复用[文本控件研究](../../complete-mv-events/research/command-contract-editor-evidence.md)定位，再完整读取本票命令的加载/保存、TextEditControl 的 417 行及相关别名/父子关系。共用命令对话框/容器身份与[03](03-branches-and-battle-reverse.md)一致；移动路线身份及字符串以外的外壳责任复用[04](04-movement-records-and-mirrors-reverse.md)。只对当前问题做有界阅读，不把未见字符串改写扩大成整个 Qt 或编辑器的全局证明。

原始首方 QML 与解码 manifest 只在 `C:/Users/Shuen/.codex/research-evidence/mv-editor-09-20261019/`，原创解码脚本为 `C:/Users/Shuen/.codex/tmp/mv-decode09.cjs`。实际初次提取使用 Node v24.14.0；最后资源复核、结果记录及索引检查使用 Windows/Node v22.23.0。仓库只发布原创报告、选定身份、独立样本和限定核对结果，不发布首方源码。已有运行准备文件的 literal Script/Plugin Line 实验不计为本票证据，也不代替本票或最终游戏验收。

## 八个槽的构造、赋值与保存

Q@679418:174–184 的新参数命令传 null eventData；Q@656916:24–40 将已有/null 数据交给组件调用 load，确认时调用 save。新建不调用既有参数赋入分支；各控件没有显式非空要求或本票文字字段的 maxlength。没有把未显式 text 的 Qt 构造初值当作已实际观察到的首次保存；在当前文本为空的前提下，读取它的保存器能生成空字符串。E111/E122 默认条件/操作数不等于 Script，须明确选中 Script 模式后讨论其空脚本。

| 字段                 | 加载、选择与确认位置                                       | 字符串结构与限制                                                                                                                            |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| E118 Label           | Q@790356:15–19,21–34                                       | p0 直接赋给 LabeledTextField.text，再把当前 text 写 p0；没有 trim、非空拒绝或拆记录                                                         |
| E119 Jump to Label   | Q@771175:15–19,21–34                                       | 与 E118 相同的单槽路径；本票不改 Label 精确匹配语义                                                                                         |
| E320 Change Name     | Q@732733:15–26,28–43                                       | 先恢复 actor，再将 p1 赋给 LabeledTextField；确认写 actor/current text，两槽；未连接 actor 变化来填其当前 name                              |
| E324 Change Nickname | Q@746793:15–26,28–43                                       | p1 同样直接加载/保存；未从 actor 的 nickname 自动 refresh                                                                                   |
| E325 Change Profile  | Q@721727:22–45                                             | p1 直接加载/保存为一整串；LabeledTextArea 明确 maximumLineCount=2；不按行生成其它事件记录                                                   |
| E111 Script 条件     | Q@748645:67–101,141–150 → Q@703296:165–175,181–211,213–250 | type12 加载 p1 并选 Script；makeParameters 读取 scriptBox.text 写唯一脚本槽；条件体结构由父命令负责，不把脚本文本按 LF 拆成条件记录         |
| E122 Script 操作数   | Q@736003:114–143 → Q@683885:141–152,156–207                | type4 将 p4 交给 scriptBox；确认重建参数，前三槽目标/操作、p3=4、p4=current text，共五槽；没有脚本 split/trim                               |
| M45 Script           | Q@810345:15–38，经 Q@685092:23–38                          | 既有 M45 p0 直接赋 TextField；确认先经 Q@683357:22–24 新建 code/parameters，再写当前 text 到 p0；移动记录外壳可能重建，与字符串内容风险分开 |

Label/Jump 和 actor 文本保存函数在已有 eventData 时沿用其参数数组；这不为多余槽位等任意异常数据提供支持。本票输入均满足已接受槽数和父结构，异常槽位仍由产品验证负责。E111 的 tab 切换、\_column 建立和 Script 模式选择按完成初始化后的调用路径解释；完整 Qt lazy component/信号先后没有执行，不把赋值表达式当成实际完成的载入捕获。

## 共用文本控件真正做了什么

LabeledTextField Q@8799522:8,13–19 转发到 TextField；TextField Q@877206:3–5 继承 TextEditControl 并设 maximumLineCount=1。LabeledTextArea Q@8800825:8–16,23–30 转发文本/行数到 TextArea；TextArea Q@826857 仅继承同一 TextEditControl，Profile 在命令处设两行。

TextEditControl Q@866210 的行为分别是：

- :15 行数上限基础值为 0；:60–68 将 length、lineCount、text、textFormat、wrapMode 等转发到内部 Qt TextEdit。这里的“行数”取 Qt lineCount，不是产品单纯计算 LF 数量的实现。
- :156–164 **上限变化处理**：当 maximumLineCount>0，按字面 LF 分割当前 text、最多保留指定段数，再以 LF 连接。这个处理不 trim 空格，也没有显式 CRLF→LF 替换；若底层已改变 CR，则外层表达式不能恢复它。它在上限变化时运行，不是每次 onLoad 都显式调用的清理函数。
- :304–309 **文本变化处理**：只有内部 width>0、上限>0、Qt lineCount 超过上限时，以当前 length−1 为终点截取 text，并调整 cursor；没有按光标位置删除新插入字符。length来自内部TextEdit；对length与JavaScript字符串长度一致的普通文本，这一次处理删除末UTF-16单元，不据此断言任意textFormat输入都有相同关系。是否多次重入、何时看到新 lineCount、载入时 width 是否已经大于零，未在实际 Qt 中执行；不能推导所有输入最终都会留下同一前缀。
- :312–315 **Tab** 转移焦点并接受事件。键盘 Tab 不是普通插入 Tab 字符的证明；粘贴或已有字符串里的 Tab 仍是另一条路径。:109–110 的 paste 直接调用内部 textEdit.paste，未读取/核对系统剪贴板转换。
- :321–337 **Return** 在单行模式向上寻找可确认的祖先并调用 ok；多行模式把事件交给 TextEdit 继续处理。此代码支持单行/双行输入责任的差别，但不证明所有键盘、粘贴、IME 或无可确认祖先情形的精确最终文本。
- :252–270 的内部 TextEdit 负责文档存储和渲染；宽度至少为 root.width/contentWidth 中较大者。本票已读命令和完整 417 行包装未发现显式字符数上限。这个有界负向结论不能证明 Qt 内部没有容量/性能限制，亦不证明合成长串已经输入成功。

因此，按 LF 裁行和按 Qt lineCount 删除末字符是两个不同触发器。不能把它们都简化为“载入时 split 后取前 N 行”，也不能认为它们只作用于用户新输入、对程序赋值无效。控件别名把程序赋值也送进 TextEdit；Qt 原生 text/document 处理、CR/CRLF 表示、textFormat 解释、模型加载和信号重入仍是明确边界。本票不从未鉴定版本的上游 Qt 源码或经验补写目标行为；已接受保存域和风险 warning 不依赖保证每种重确认的精确输出，因此无需开启新的原生分析 session 来消除这些不影响契约的未知。

## 独立字符串样本与 warning 的产品选择

[独立输入文件](09-string-inputs.json)用 JSON 转义完整记录原串；样本包含空串、空格/Tab、单独 CR、LF、CRLF、尾空格/Tab、尾 LF、两个尾 LF、尾 CR、尾 CRLF、三段文本及 4096 个“中”加尾空白的长串。没有先转换换行、trim 或从编译输出倒造预期；每个原串的 UTF-8 SHA-256、UTF-16 长度及 warning 原因随样本记录。输入适用于上述八个槽的赋值/保存路径核对，不声称已执行八槽与全部样本的 UI 组合。

| 原串说明                             | 单行七槽的已接受原因 | Profile 的已接受原因 | 与代码事实的边界                                        |
| ------------------------------------ | -------------------- | -------------------- | ------------------------------------------------------- |
| 空、纯空格/Tab、尾空格/Tab、单行长串 | 无本类风险 warning   | 无本类风险 warning   | 不是普通键盘能生成 Tab 或无长度限制的证明               |
| `A\rB` 或 `A\r`                      | CR                   | CR                   | 保留行为待验；不宣称必删除、必转 LF 或必保留            |
| `A\nB` 或 `A\n`                      | LF                   | 无                   | 尾 LF 计数；Profile 两段本身不触发行数 warning          |
| `A\n\n` 或 `A\nB\nC \t`              | LF                   | 至少两个 LF          | 两个以上 LF 是产品风险阈值，不声称完全复刻 Qt lineCount |
| `A\r\nB` 或 `A\r\n`                  | LF 与 CR，可合并     | CR                   | 不先把 CRLF 规范化；不能只检查转换后的文本              |

这些原因来自[已接受决定13](../../complete-mv-events/issues/13-native-value-domain-boundaries.md#完整字符串与重确认警告)和[规格I6](../complete-mv-events-implementation-spec.md#i6--文本素材与-native-saved-value)，不是本次生成的新 Qt 事实或产品测试结果。warning 保留原串、不使成功变失败，不因长度、空白或猜测的其它控制字符新增本类风险。Script Command Gate 仍覆盖 E111/E122/M45，包含空脚本；本票没有编译、预执行脚本或验证 Gate。Plugin Command Line 及四类物理行记录保持各自规则，不从本票扩展 warning 或拆分策略。

## 仅容器保存、外层路线确认与主动重确认

DataManager Q@909009:341–383,407–425 经 JSON.stringify 序列化现有数据库/地图/事件值，:482–484 的 clone 为 JSON stringify/parse；不会对每个单槽字符串调用 TextEdit。对本票有效 JSON 字符串，CR/LF/CRLF、空白和尾字符以 JSON 转义往返保留，JSON 文本的排版和转义形式可变。没有获得 TkoolAPI.writeFile 的实际成功结果；这仅是已读保存责任和标准 JSON 字符串语义推导。

M45 位于页 Autonomous Movement 或 E205 的 route.list。Q@653645:22–31 的页路线窗口及 Q@771946:22–47 的 E205 参数窗口克隆/回传完整移动列表，后者为非 M0 项写完整 505 镜像；没有逐项打开 M45 文本窗口。Q@701512:167–180 把路线回写到页，外层确认可能改变 wait 等非文字状态，详见04；本票只说明这条路径不把每条脚本送进 TextEdit，不能称整个路线形态都无变化。只有 Q@672838:116–123 的单项 edit 或 Q@665677:96–104 的新增才进入 M45 参数对话框；其确认还重建移动记录外壳。保留字符串与外壳的不同责任，没有用文本观察抹掉04的 indent 反例。

事件列表或路线列表显示文本时会构造 UI model 文本；这里读取的 refresh/insert 路径只将展示值交给列表，没有把展示换行/截断结果回写 parameters。仅容器保存、外层路线确认、M45 单项主动确认及实际游戏执行是四种不同问题，不能把 native runtime 接受脚本当作编辑器能普通输入该脚本的证明。

## 保存路径结果与推导

每个 stable Case ID 对应限定的源路径/条件核对义务。passed 只签收这项核对，不把未执行 Qt/UI、磁盘或产品结果计为通过。全部特殊字符和长串的起点均为上述独立合成样本；普通空白输入与注入已有字符串分开解释。

| Case ID                 | 独立输入/操作起点                                              | 预期结果或保留结论                                                                                      | 证据等级及限制                                                         |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| MV-E09-LABEL            | E118 p0 依次考虑独立字符样本，既有/null 命令                   | LabeledTextField 直接收p0，确认读取当前text写p0，没有命令级trim、split或非空检查                        | 随包代码观察；当前控件值不等于保证原输入未被Qt改变                     |
| MV-E09-JUMP-LABEL       | E119 p0 同一独立样本集                                         | 加载/保存与Label同构，仍为一槽，不创建续行或重组Label                                                   | 随包代码观察；精确Label查找及其产品警告未执行                          |
| MV-E09-ACTOR-NAME       | E320 actor1和独立p1字符串；不修改actor选择                     | actor恢复后p1直接入TextField，确认写当前text；未从项目name刷新文本                                      | 随包代码观察；正常已完成初始化为前提，不证明UI创建所有样本             |
| MV-E09-ACTOR-NICKNAME   | E324 actor1和独立p1字符串                                      | 与Name同构；没有按昵称长度裁字的命令保存表达式或项目昵称默认读取                                        | 随包代码观察；不把有界未见上限说成Qt无限容量                           |
| MV-E09-PROFILE          | E325 actor1，空/两段/三段/CRLF/尾LF样本                        | p1完整加载/读取，Profile设两行；保存器不拆记录，底层超行限制另行触发                                    | 随包代码观察及条件边界；不声称三段重确认仍原样                         |
| MV-E09-CONDITION-SCRIPT | E111完整合法父体，type12脚本字符串为样本；另从新建明确选Script | tab4加载p1并选Script，makeParameters取当前text作唯一脚本槽；不按LF生成多条件记录                        | 随包代码观察；tab/\_column完成顺序未实际执行，父体保存责任不在此结论内 |
| MV-E09-VARIABLE-SCRIPT  | E122合法五槽，p3=4/p4为样本，目标和operation固定               | setup选择Script并赋p4；确认重建恰五槽，脚本文本没有split/trim表达式                                     | 随包代码观察；不保证Qt保留原串或脚本求值成功                           |
| MV-E09-MOVEMENT-SCRIPT  | M45合法p0样本，页路线或205列表；主动编辑该项                   | p0直接载入TextField；确认新建一条M45并取当前text，外壳重建单独处理                                      | 随包代码观察；没有抽出函数复算或原生UI执行，保留04外壳责任             |
| MV-E09-EMPTY-WHITESPACE | 空控件、空串、空格/Tab及不含CR/LF的空白样本                    | 保存器允许读取空串及当前空白，不trim；新E111/E122须主动选择Script；Tab键转焦点与已有Tab分开             | 有条件推导；没有把未测Qt初值或Tab粘贴当真实创建结果                    |
| MV-E09-CONTROL-CHARS    | 各槽注入CR/LF/CRLF样本，再比较赋值与确认                       | 命令层直接赋值/读取，不做换行转换；底层Qt与行数处理可能改变current text，具体输出不保证                 | 有界观察与未知限定；不预先规范化以制造一致性                           |
| MV-E09-TRAILING         | 尾空格/Tab/LF/两个LF/CR/CRLF样本                               | 单槽保存器没有四类行记录的裁尾循环；若current text保留则整串读取，超行与Qt转换风险仍独立                | 有条件静态推导；尾LF照原串参与warning阈值                              |
| MV-E09-LONG             | 独立4096个中加尾空白，分别赋入八槽                             | 已读命令和完整共享包装没有显式字符数上限；产品已批准不新增长度上限                                      | 有界负向代码观察及契约比较；未证明真实输入/显示/性能/内部容量          |
| MV-E09-LINE-LIMIT       | 控件maximumLineCount由0变1或2；考虑已有三段字符串              | 上限变化处理按字面LF截段再连接；仅该事件有此表达式，不等于每次load固定裁行                              | 随包代码观察；赋值前后、Qt先行转换及信号顺序未运行                     |
| MV-E09-INPUT-LIMITS     | 普通Tab、Return、粘贴及已载入超行text                          | 单行Return寻祖先OK、多行交TextEdit；Tab转焦点；width>0且Qt lineCount超限的textChanged按length−1截取text | 随包代码观察；length来自TextEdit，不假装粘贴/IME/递归截断最终结果已测  |
| MV-E09-QT-TIMING        | 控件赋值、宽度0/正值、lineCount变化和重复textChanged           | 宽度/行数/重入、CR与CRLF文档模型、textFormat及tab内容建立未知均已界定，不给无条件重确认保证             | 已完成边界核对；未知UI结果保持未执行，不需要改变已接受保存域           |
| MV-E09-CONTAINER        | 八槽有效字符串仅容器保存；M45仅外层路线/205确认且不单项编辑    | JSON保存/clone保留有效字符串；外层路线回传完整列表/镜像而不逐项调用TextEdit；非文本设置责任另列         | 代码与JSON语义推导；未验证磁盘写入、产品输出或游戏                     |
| MV-E09-WARNING-POLICY   | 原串LF计数、CR检测及独立样本预期原因，对照决定13               | 单行LF、Profile至少两个LF、列明八槽CR按原串给风险原因；尾分隔符参与，不改串、不扩展字段；Gate独立       | 已批准产品选择一致性核对；不是Qt输出预测或产品warning测试              |

## 契约比较与后续责任

与[ADR0012](../../../docs/adr/0012-event-saved-state-roundtrip-boundary.md)、[决定13](../../complete-mv-events/issues/13-native-value-domain-boundaries.md#answer)、规格I6及[E118/E119/E111/E122](../../complete-mv-events/research/command-parameters/core.md)、[E320/E324/E325](../../complete-mv-events/research/command-parameters/actors-battle.md)、[M45](../../complete-mv-events/research/command-parameters/movement.md#m45--script)一致：完整字符串是已批准保存能力，输入控件的重确认风险不是编译器规范化规则。保存域包含空、空白、完整CR/LF/CRLF和尾字符，无新增字符/行数产品上限；已知Raw与正式表示一致。QML未见命令级trim/split支持区分单槽与四类物理行记录，但不是声称全部字符串在原生TextEdit重确认都无损。

没有把新的正常原生形态宣布非法，没有擅改warning阈值、增加产品长度限制或把Qt调整结果作为反编译修复。未知已限于本次不保证的原生主动确认/输入输出，未发现会要求改变必须实现保存契约的未决冲突；因此可解除本票逆向前置。后续产品须独立验证精确字符串往返、已知raw、稳定warning及Gate；49–51负责最终E5产品输出比较，52–54保留实际R6/R7游戏责任。

纯证据文档和样本不改变harness或产品，不新增TDD测试；沿用已批准T1索引边界检查真实来源section、review行、唯一ID、fixture hash及关联记录。Windows/Node22索引、格式、链接和空白校验结果记入本票 Outcome and verification；没有把样本JSON、文档passed或其它线程literal预实验提升成产品/游戏通过。
