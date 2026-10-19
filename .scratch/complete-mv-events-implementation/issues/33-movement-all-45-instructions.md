# 33: 45 类移动指令完整契约

Status: resolved
Blocked by: 09, 24
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 页路线与强制路线共同覆盖全部 45 码参数、默认、引用、None 和 M45 字符串／Gate，取得两种入口的往返证据。

## Scope

主要指令责任：M1–M45。

原生证据分配：E3/E5、R1/R6/R7。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 45 个移动 code 各参数模式、枚举、值域、无参外壳和保存形态逐项有独立测试，不能仅用每 code 一个例子签收；两种路线入口覆盖indent缺失/null/0的独立预期，并拒绝其他数字与不允许的parameters/indent组合。
- [x] 页路线与强制路线共用模型、准确 defaults/M0/505；savedShape.indent为absent/null/zero，默认absent，zero直接编码0且显式反编译，M0缺indent，505逐项镜像完整非终止对象；非 custom 保存路线仍作引用和 Script Command Gate 校验。
- [x] M45 完整单槽字符串与 None 素材、音频独立值一并验证；取得 E3/E5、R1/R6/R7 相关产品证据。

### 共通要求（限本票适用范围）

- [x] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [x] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [x] 产品变更执行 Windows / Node 22 全量适用检查与构建；安全票同时验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [x] 本票分配的必要编辑器/游戏场景取得实际证据后才关闭；最终回归另外执行。原生版本、runtime/NW.js、步骤、输入身份、操作者、预期/实际与原始结果可追踪。
- [x] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [09：原生单槽字符串逆向核对](09-native-single-slot-strings.md)。
- [24：Map Event 完整页与 note](24-map-event-full-pages-and-note.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [移动指令参数附表](../../complete-mv-events/research/command-parameters/movement.md)：逐码参数与共享路线保存形态。

## Comments

### 2026-10-19 — implementation claim

Claimed on codex/mv-ticket-33 in the separate managed worktree, clean at actual merged integration8617d815750631d00a8b60b2410d9e5420da4e16. Dependencies09/24 are resolved. Implementation uses the already accepted T1 public DSL/compiler/Staged Data Graph and actual Workspace API/CLI seams, independent native expectations and narrow red→green slices. This ticket owns all45movement instructions across page and205routes plus its allocated E3/E5/R1/R6/R7 evidence. Prior ticket24 worktree/build/evidence remains unchanged; broad checks are coordinated with root.

### 2026-10-19 — 继承已接受的有限 zero 状态

用户对04原生clone + copy/paste反例回复“接受有限 zero 状态（推荐）”；当前契约以[04报告](../evidence/04-movement-records-and-mirrors-reverse.md#契约比较与已接受修订)、ADR0015及权威决定票12 Answer为准。本票继承14的共享外壳实现并负责全部45码在页/205两入口的覆盖；04的逆向证据与契约批准不计作本票产品或游戏验收。

### 2026-10-20 — actual25 integration and scoped saved-number correction

Merge7fe5ea6 includes actual25 integration233db5420d6cf83da0220c6aa5aed56626798f39.
Typecheck and all five affected actual Workspace cases pass. Complete native
delivery input bindings now include the unchanged seed Troops carrier and actual
loaded Troops comparison; the original13/19 behavioral predicates remain intact.
Accepted design13's negative-zero boundary was checked separately: M14 x/y,
M41 index, M42 opacity and M44 volume/pan now use lossless numeric rendering;
native M43 negative zero is rejected because its symbol cannot reconstruct that
value. Four real Workspace red→green slices, seven positive current fixture
cases and two precise rejection cases are retained with original logs. The337
existing movement cases, current typecheck, targeted formatting/lint and unchanged
index deadline pass. Complete preservation, input hashes and unpublished fixture
format correction provenance are in the [allocated report](../evidence/33-movement-instructions.md).
The ticket stays claimed: contract remains /7, no33 build/native product pair has
run, and final check/build/built/native/evidence delivery follows actual23 merge.

## Answer

Completed on codex/mv-ticket-33 after merging actual23 integration
205334338d8e64e3d00e485849c9ddf67bd7e3b1. The clean executed product is
c20c471481fcfa8b4c705f3a082b9613d82d60e8, compile contractmv-1.6.1/9.
All45 formal movement instructions, shared finite route shells/M0/complete505,
strict authored/native/known-raw validation, saved noncustom routes, references,
None image/SE, complete one-slot M45 and recursive Gate are delivered. The scoped
accepted numeric -0 correction preserves M14/M41/M42/M44 numeric signs and rejects
the nonrepresentable categorical M43 value before publication.

Windows / Node22.23.0 full pnpm check passes39 files/980 tests; fresh build passes
with15 actual output files; the complete built Windows baseline passes15 files/
366 tests. All337 focused movement cases and14 actual source/built Workspace cases
retain independent expectations and complete filesystem/carrier checks. Both
original worker counts and case/index deadlines remain unchanged.

Allocated actual R1-v2 passes both13/13 native oracles; R6/R7-v3 passes both19/19.
Both use normal Scene scheduling, public init→Clone→Decompile→formal edit→Check→
Compile→Diff→Push, true owned replacement, all15 complete carriers, four mandatory
generated/loaded carriers, fresh explicit profiles, exact process/host/engine
identities, empty native stdout/stderr and exit0. E3/E5 compares the identified52
shipped resources and accepted04/09 facts with current source/built product
outputs. Native environment is actual MV1.6.1 / NW.js0.29.0 / embedded Node9.7.1;
the passive audio signal checks do not claim human hearing or editor UI execution.

The [allocated report](../evidence/33-movement-instructions.md#final-integrated-product-and-verification--2026-10-20)
and [final audit](../evidence/33-history/final-delivery-audit-v3.json) bind the exact
97-file source/15-file dist freeze and both untouched raw external native runs.
All274 incoming requirements plus12 own objects are preserved in order; all2594
inherited history/results are byte-identical. The archive retains58 original
schema records plus six separately identified review derivatives, with originals,
fixture-format provenance, red/failed runs and archive-tool corrections preserved.
All12 allocated requirements have passed records. Final index and archive lint
pass. Only ticket33 closes here; final49–55 and integration review remain separate.
