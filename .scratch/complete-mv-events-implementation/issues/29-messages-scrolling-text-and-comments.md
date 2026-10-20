# 29: 消息、滚动文本与注释

Status: resolved
Blocked by: 08, 23
Stage: S6
Execution batch: [文本、脚本与角色展示](../tickets.md#batch-text)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 正式支持文本行记录、输入数字、选择物品及脸图保存值，精确保留 CR、空行和尾行并拒绝非法分记录。

## Scope

主要指令责任：E101、E103、E104、E105、E108。

原生证据分配：E5/E6、R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E101/E105/E108 的物理记录只排除 LF，保留 CR/空白/尾空和各自条数限制；非法单条 LF 或数量不回退 raw。
- [x] E101 faceIndex 为非负 32 位并拒绝负零，None 保留 index；非 None 且 >=8 的准确 warning，不扫描素材。
- [ ] E103/E104 全参数与变量引用完成，正式/已知 raw/反编译与实际 Workspace 一致；取得 E5/E6/R6 分配证据。

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

- [08：原生脸图索引逆向核对](08-native-face-index-behavior.md)。
- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

## Comments

### 2026-10-20 — 实施认领

在独立 managed worktree `mv-ticket-29/rpgmaker-event-dsl`、分支 `codex/mv-ticket-29` 从实际集成 `205334338d8e64e3d00e485849c9ddf67bd7e3b1` 认领。按 implement-spec 与 tdd，在规格 T1 已接受边界进行消息族纵向实现。当前只运行针对性开发检查，尚未执行最终完整检查、构建或 E5/E6/R6 产品与原生配对，不据准备证据关闭本票。

### 2026-10-20 — DEV 检查点，未交付最终验收

E101/E103/E104/E105/E108 的必填具名 API、None 独立索引、物理行与条数、精确变量引用和脸图布局 warning 已完成针对性纵向实现。公开 helper、未类型化命令、原生及已知 raw 共享有限校验；当前文档、示例与编写指南已同步。真实 Windows / Node 22 的 Map/Common/Troop 合成 Workspace 发现并求值生成源码，完整往返并证明编辑后 Push 落盘；失败和 Check 路径比较源码、项目、Snapshot、generated、manifest、配置及 Discovery。8 个受影响测试文件 112 项通过，类型、变更文件 lint/格式与 evidence index 检查通过。

详见 [DEV 行为、检查和待办](../evidence/29-message-dev-checkpoint.md) 与新增 `MV-S6-MESSAGE-001..005` 义务及不可变结果。此检查点未执行全量检查、构建、built Windows 基线、contract bump 或原生游戏；仍待实际集成 26/27/28 后复核诊断/子体组合，并按队列完成 E5/E6/R6 配对。状态保持 `claimed`，不标 resolved/READY。

### 2026-10-20 — Batch development resolved under the user amendment

Completed as the continuous29/30/44 batch after merging actual integration2ce2ba3b. Product checkpoint59328ebd (format-only2e733ff7), incoming contract17 advances once to18. Windows/Node22 typecheck,342 affected unit tests,13 actual source Workspace cases and contract freshness passed. Complete source, Project, Snapshot, generated, manifest, config/descriptor, pending and Discovery states are checked where applicable. Current API documents/examples are reconciled.

See [the batch delivery and actual log pointers](../evidence/29-30-44-text-capability-batch.md). The first two acceptance items and common development requirements are complete. The combined native acceptance item remains unchecked: E5/E6 final REA/product comparison belongs to51; R3 to52; R6/R7 actual MV1.6.1/NW.js games to54. Full/build checks belong to48. These unexecuted final obligations are not claimed as passed. Original DEV/failure records remain in place; earlier claimed-only full/native queue language is superseded by the2026-10-20 user amendment.
