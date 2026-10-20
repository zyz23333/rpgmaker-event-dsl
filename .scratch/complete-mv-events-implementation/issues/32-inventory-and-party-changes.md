# 32: 金钱、物品与队伍变更

Status: claimed
Blocked by: 23
Stage: S6
Execution batch: [物品、队伍与商店](../tickets.md#batch-inventory-shop)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完整处理数量操作数、项目引用、gain 下 includeEquipment 和 remove 下 initialize 的独立保存配置。

## Scope

主要指令责任：E125、E126、E127、E128、E129。

原生证据分配：E4、R4。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [ ] E125–E129 的全部 actor/物品类别引用、增减和数量模式均正式表达并验证，运行值不错误套常量域。
- [ ] gain 的 includeEquipment、remove 的 initialize 与非激活值原样保留，None/零/缺槽仅按具体参数契约处理。
- [ ] 正式/已知 raw/反编译及真实 Workspace 独立比较通过，取得 E4/R4 相关分配证据并更新当前编写示例。

### 共通要求（限本票适用范围）

- [ ] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [ ] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [ ] 按规格 2026-10-20 用户执行修订，开发及批次合入执行 Windows / Node 22 受影响测试与必要检查；全量适用自动化及构建集中到 48。安全票仍验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [ ] 本票原生场景可集中到 49–54 最终回归；开发票关闭时记录实际自动化结果，并明确指向待执行的最终场景，不把未执行记为通过。证据按规格 2026-10-20 用户执行修订保留必要版本、输入、命令和预期/实际日志。
- [ ] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

### 2026-10-20 — 聚焦开发领取

独立分支 codex/mv-ticket-32，基于实际 integration c2a40a41c094ccdda47faccd4399891952739008。按已接受 T1 seams 逐切片 red→green；本检查点仅开发，保留所有旧证据，不进行 broad/build/built/native 或契约版本增量，仍需最终 E4/R4 和独立合并验收。

### 2026-10-20 — DEV 检查点，尚未最终验收

E125–E129已覆盖正式mode对象、必填独立flags、精确原生槽、严格helper投影前与direct节点字段、引用/范围、负零分类拒绝、编反编译及真实Discovery/Check/Compile/Diff/Push。完整28记录原生矩阵经过实际发现并求值，gain+true/remove+true及无名变量槽原样保存；拒绝案例核对完整业务状态。当前公开README、示例与编写指南同步。

44聚焦测试/2文件、58相关测试/6文件（含架构）、证据索引3测试、typecheck及scoped lint/format通过。新增6需求，286旧需求对象/原始字节前缀及2989旧证据blob保持一致。详细记录与不可变审计见[DEV证据](../evidence/32-inventory-party-dev.md)。保留C盘ENOSPC与初版检查失败记录；未执行native的结果明确标注not-executed。

仍为claimed；后续需在实际最终integration上协调30/31变量family、26/28/30 raw错误路径重叠，按root队列完成契约版本增量、完整检查/构建/built、E4比较与实际R4，再由独立merger验收。本DEV提交不能关闭32。
