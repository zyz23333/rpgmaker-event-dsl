# 9: 原生单槽字符串逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 追踪 Label、角色文本及三种单槽 Script Input 对空白、CR／LF／CRLF 和尾字符的加载、确认及序列化。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E5 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 覆盖 E118/E119/E320/E324/E325 和 E111/E122/M45，追踪空串、空白、CR/LF/CRLF、尾分隔符及长串的赋值/输入限制/保存链。
- [x] 区分普通输入路径、既有/注入输入加载、容器序列化及主动确认；保存原始字符，不先规范化换行；Qt 行数/文本时序不明处明确记录。
- [x] 对照单行 LF、Profile 至少两个 LF、列明槽含 CR 的风险规则；代码事实与产品 warning 选择分开，未证明的原生行为不作保证。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本/哈希、资源偏移/长度/解码哈希、实际存在的 REA Evidence ID、代码路径与契约比较。分别核对新建、既有/注入输入、仅容器序列化和参数确认的路径；代码观察、有条件推导与未决时序分别标明，不虚构 UI 捕获。原始首方输出仅留本机仓库外；仓库发布原创结论和复核指针。影响必须实现的保存契约而无法界定的问题保持未解决。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I6–I7、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Outcome and verification

2026-10-19：本票完成限定的 E5 逆向前置，交付原创[报告](../evidence/09-single-slot-strings-and-reconfirmation-reverse.md)、[28 个同 EXE 资源身份](../evidence/09-resource-identities.json)、[12 个独立精确字符样本](../evidence/09-string-inputs.json)、17 个稳定 `MV-E09-*` 索引义务及独立核对记录。原 EXE 长度/SHA-256、资源外层长度、zlib 输入边界、解码长度/SHA-256 全部核对；初次提取 Node v24.14.0，最终复核/记录及索引检查 Windows/Node v22.23.0。历史 PE Evidence ID 明确复用，没有新建/切换原生 session 或虚构新 ID。

八个槽的命令保存器直接读写当前字符串；共享 TextEditControl 另有 maximumLineCount 变化时按 LF 截段、width/Qt lineCount 超限时以 length−1 截取文本、单行 Return 寻祖先确认及 Tab 转焦点。length 来自 TextEdit；Qt 文档/CR/CRLF处理、textFormat、宽度和行数更新、重入及 tab 内容建立顺序没有实际执行，不能把直接赋值或单次截取推成无条件重确认保真。仅容器 JSON 保存、外层路线/205 确认与主动编辑 M45 分开，移动外壳仍按04责任处理。

已对照决定13/ADR0012/规格I6：完整字符串保存域、无新增产品长度/行数上限、原串 LF/CR 风险阈值及 Script Gate 责任一致，无须契约修订；未将未知 Qt 输出或普通输入限制转成 DSL 改写/拒绝规则。全部特殊字符和长串样本明确为独立输入，不宣称已在普通 UI 创建。warning 原因是已批准产品选择，本票不宣告产品 warning 或 Gate 已实现。

实际验证：Windows/Node v22.23.0，`pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts -t 'validates the evidence index'` 通过1项，另2项因名称筛选未执行；本票证据/样本/索引/票据及新记录的oxfmt检查、3份变更Markdown的本地链接目标检查与`git diff --check`通过。纯证据/样本不修改产品或harness，未新增TDD测试。17条passed仅证明限定的代码/条件/身份和已批准契约核对完成；未执行编辑器UI、抽出代码、系统剪贴板、工程写盘、产品输出比较或游戏。

本票解除自身逆向前置；后续产品应独立交付字符串精确往返、已知raw、warning与Gate，49–51交最终E5产品比较，52–54保留实际游戏要求。其它线程literal运行准备未计入本票通过。
