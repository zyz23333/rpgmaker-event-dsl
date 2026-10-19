# 10: 原生 EXP 临界值逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 追踪 Change EXP 中 9,999,999 与 10,000,000 的输入校验、夹界、确认及序列化，保留帮助差异。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E7 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 在已标识编辑器/随包 Qt 中追踪 9,999,999 与 10,000,000 的范围定义、校验/夹界和确认保存链；输入时序未知须明确记录。
- [x] 本体代码事实、控件路径推导及帮助上限差异分别留存，不伪称实际 UI 输入/保存。
- [x] 不得据现行投票直接声称原生代码结论；若正常路径支持域外保存，先解决契约冲突；影响必需保存契约的未决项不得判通过。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本/哈希、资源偏移/长度/解码哈希、实际存在的 REA Evidence ID、代码路径与契约比较。分别核对新建、既有/注入输入、仅容器序列化和参数确认的路径；代码观察、有条件推导与未决时序分别标明，不虚构 UI 捕获。原始首方输出仅留本机仓库外；仓库发布原创结论和复核指针。影响必须实现的保存契约而无法界定的问题保持未解决。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I6、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Outcome

2026-10-19：完成本票有界 E7 编辑器逆向前置。交付[原创报告](../evidence/10-exp-boundaries-reverse.md)、[16 个资源身份、真实 REA 指针及帮助身份](../evidence/10-resource-identities.json)、[11 个独立边界输入](../evidence/10-exp-inputs.json)，并新增 14 项 `MV-E10-*` 索引和相应不可变限定复核记录。原始首方 QML、汇编/伪代码和 13 条本轮真实 REA Evidence 仅在仓库外，报告记录具体路径；已关闭本轮 DLL 分析 session。

本体 E315 明确 maximum=9999999、共用 minimum=1。复核同 DLL 的 constructor/value setter/getter，补查 native assembly、min/max setter、QQmlParserStatus 完成回调及 ±step；完成、边界变更和步进均落实同一范围。文本包装先按七位裁尾再转换/夹界，故完整文本10000000进入一次处理时候选为1000000，与 numeric load10000000经setter夹到9999999的路径不同；两项均为带前提的代码推导，不是键入或落盘捕获。

初始化、新建/已有参数确认、完整六槽保存、disabled showLevelUp=true、变量ID与运行值，以及仅容器JSON序列化已分开追踪。帮助的99999999与本体9999999差异原样留证。Qt按键/粘贴/IME、信号重入和OK/focus精确时序仍未执行，不判这些未知结果通过；正常完成及必需保存域的关键路径已界定，没有发现须扩域或重开契约的正常原生保存反例。常量1..9999999、变量运行值不套上限、独立boolean与无新增Compiler Default的已接受规则均未改变。

Verification：Windows / Node22.23.0 下，证据索引定向测试1通过、2按名称过滤未运行；格式检查覆盖本票报告/metadata/输入/索引/README/票和14条新增结果；3份Markdown的本地目标链接核对通过；原EXE、DLL、16项资源完整边界/长度/解码SHA、帮助SHA、历史与本轮真实native记录身份均重验；`git diff --check`通过。passed仅指报告明示的有界代码/条件推导与身份复核，未执行UI、抽出代码、产品或游戏，不替代49–51的最终产品输出比较或52–54的真实游戏回归。
