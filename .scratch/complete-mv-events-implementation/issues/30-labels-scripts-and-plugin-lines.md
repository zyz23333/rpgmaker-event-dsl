# 30: Label、Script 与 Plugin Line

Status: resolved
Blocked by: 09, 23
Stage: S6
Execution batch: [文本、脚本与角色展示](../tickets.md#batch-text)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完整保存标签与插件行，按 LF 表达脚本记录；精确匹配 Label 并递归执行 Script Command Gate。

## Scope

主要指令责任：E118、E119、E355、E356。

原生证据分配：E5、R3/R7。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] Label/Jump 精确保存与匹配完整字符串；重复首个、缺失与重复诊断准确，单槽 CR/LF 风险不改写文本。
- [x] E355 仅按 LF 分为 1–12 条并保留 CR/尾空，E356 完整 Plugin Command Line 不规范化或强制理解插件语义。
- [ ] 所有正式/raw/嵌套脚本 Gate 一致且 Decompile 不自动启用；E5/R3/R7 用受控场景取得产品证据。

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

- [09：原生单槽字符串逆向核对](09-native-single-slot-strings.md)。
- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

## Comments

### 2026-10-20 — Focused DEV checkpoint; acceptance remains pending

Claimed in dedicated `codex/mv-ticket-30` worktree at actual integration `2053343`,
then merged actual incoming `c2a40a4` (ticket 33 / contract 9) before handoff.
Named Label/Jump, complete Plugin Line, strict own-field input checks, LF-only 1–12
Script groups and exact per-list Label/string-risk diagnostics are implemented.
Synthetic source-product Workspace checks and focused validation passed as detailed
in [the durable DEV report](../evidence/30-text-dev-checkpoint.md). All existing
requirements/history/result blobs are preserved; new executions append unique blobs.

This is **claimed / DEV only**, not READY or resolved. Full checks/build/built baseline,
contract increment on latest integration, allocated E5 product comparison and actual
R3/R7 game pairs remain mandatory in the root's serialized finalization queue.

### 2026-10-20 — Batch development resolved under the user amendment

Completed as the continuous29/30/44 batch after merging actual integration2ce2ba3b. Product checkpoint59328ebd (format-only2e733ff7), incoming contract17 advances once to18. Windows/Node22 typecheck,342 affected unit tests,13 actual source Workspace cases and contract freshness passed. Complete source, Project, Snapshot, generated, manifest, config/descriptor, pending and Discovery states are checked where applicable. Current API documents/examples are reconciled.

See [the batch delivery and actual log pointers](../evidence/29-30-44-text-capability-batch.md). The first two acceptance items and common development requirements are complete. The combined native acceptance item remains unchecked: E5/E6 final REA/product comparison belongs to51; R3 to52; R6/R7 actual MV1.6.1/NW.js games to54. Full/build checks belong to48. These unexecuted final obligations are not claimed as passed. Original DEV/failure records remain in place; earlier claimed-only full/native queue language is superseded by the2026-10-20 user amendment.
