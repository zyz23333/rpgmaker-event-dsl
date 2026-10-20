# 37: 画面、天气、等待与影片

Status: resolved
Blocked by: 23
Stage: S6
Execution batch: [画面、图片、音频与系统场景](../tickets.md#batch-presentation)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 淡入淡出、色调、闪烁、震动、等待、天气及影片按原生值域、时长和 None 语义工作。

## Scope

主要指令责任：E221、E222、E223、E224、E225、E230、E236、E261。

原生证据分配：R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E221/E222/E223/E224/E225/E230/E236/E261 全部色调/颜色/数值/时长/等待/枚举/None 按参数表验证。
- [x] 不从其他命令借用值域或默认，不把运行上下文失败误报为结构非法；正式/raw/反编译共享规则。
- [x] 完成真实 Workspace 独立往返与安全失败状态验证。
- [ ] 最终 54 执行 R6 中对应等待、并行、天气和影片代表观察；本票未记为通过。

### 共通要求（限本票适用范围）

- [x] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [x] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [x] 按规格 2026-10-20 用户执行修订，开发及批次合入执行 Windows / Node 22 受影响测试与必要检查；全量适用自动化及构建集中到 48。安全票仍验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [x] 本票原生场景可集中到 49–54 最终回归；开发票关闭时记录实际自动化结果，并明确指向待执行的最终场景，不把未执行记为通过。证据按规格 2026-10-20 用户执行修订保留必要版本、输入、命令和预期/实际日志。
- [x] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [系统、地图与表现参数附表](../../complete-mv-events/research/command-parameters/visual-map.md)。

## Comments

2026-10-20 — Focused DEV delivery based on actual integration
`38542767606ff9712e45d2a8e4894558e3a7d385`. Eight owned screen families now
validate named inputs, saved values, required waits, native/known-raw slots,
Weather battle warning, Movie None and signed zero; current public callers and
authoring guidance are updated. Independent full15-carrier public Workspace
roundtrip, actual source evaluation/edit/Push and complete failure state are
covered. See the [DEV report](../evidence/37-screen-weather-waits-and-movies-dev-checkpoint.md)
for exact provenance, retained failures and the authorized active-index pin
exception (16 Common fixture hashes only; all other incoming row fields and all
incoming history remain unchanged).

Executed DEV checks: 8 files/174 tests, subsequent screen/boundary 4 files/33
tests, final current Common/screen Workspace 2 files/103 tests, package tsc,
21-file scoped lint and 24-file scoped formatting passed. Original evidence
index hash failure and subsequent unchanged 10s timeout are retained; the latter
needs integration retry after the Map preparation I/O window/prefetch fix.
Seven exact pre-run captures and all 227 raw results (223 pass/four earlier
failures) are retained. No fullcheck, build, built public entry, editor UI or game
pass is asserted here. Contract remains incoming `/10`; R6 game evidence and
final integration gates remain pending. Ticket stays claimed until those
obligations are actually fulfilled.

### 2026-10-20 — 能力批次交付与开发关闭

按规格顶部 2026-10-20 用户执行修订，本票功能及受影响自动化已完成，状态改为
resolved。旧评论中逐票全量、build/built、冻结/归档及最终游戏后才可关闭的处方
已由该修订取代；上方拆分后的最终原生验收框继续保持未勾选。

共同交付见[37–40 批次记录](../evidence/presentation-batch-delivery.md)。共同实现
`4c6e3385` 实际通过 521 单元/回归与 84 Workspace；合入实际 Conditional
`6dfa75eb` 后的最终产品 `8e51e031` 另通过 271 相交单元/回归、4 Conditional
Workspace、包 TypeScript 与冲突文件静态检查。全批次共用具名 Tone/Color，
编译契约相对主线 `/14` 更新为 `/15`，当前验收索引 374 条、本批次 42 条。
旧失败及新运行的确切命令、版本、输入/夹具与日志路径均见批次记录。

48 仍负责最终集成的适用全量和 build/built；50/51 负责本批次适用 E4/素材
逆向及最终产品比较；54 负责本票分配的实际 MV 1.6.1/NW.js R6。具体场景逐票
列在批次记录末尾。没有将上述未执行项计为通过，完整支持仍待最终 55。
