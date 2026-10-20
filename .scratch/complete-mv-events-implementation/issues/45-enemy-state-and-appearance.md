# 45: 敌人状态、出现与表现

Status: resolved
Blocked by: 23, 25
Stage: S6
Execution batch: [敌人与战斗控制](../tickets.md#batch-battle)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 敌人 HP／MP／TP／状态、恢复、出现、变身和动画覆盖各自 selector 子集、hidden 位置及独立 index。

## Scope

主要指令责任：E331、E332、E333、E334、E335、E336、E337、E342。

原生证据分配：R2/R4/R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E331/E332/E333/E334/E335/E336/E337/E342 每码的全部 selector、operand、引用和枚举分别支持，不能泛化负数为 all。
- [x] hidden 保留原位置，全敌动画仍保存单敌 index；固定项目缺失与运行位置不适用分别 error/warning。
- [ ] 最终 R2/R4/R6 分配场景及运行无作用/异常后果仍待52/53/54；真实 Troop/Common 自动化已通过，见批次报告。

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
- [25：Troop Event 所有权与 Reset](25-troop-event-ownership-and-reset.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [角色、战斗与场景参数附表](../../complete-mv-events/research/command-parameters/actors-battle.md)。

## Development result — 2026-10-20

按规格用户执行修订关闭开发功能。共同产品 `dde334b3e8fedecf8408f3bf94e4c33c752a413d` 已合入实际集成 `2ce2ba3b4a364dc3770f953323707d843a4f53c7`，契约 `/18`；Windows / Node22.23.0 合并后18受影响文件663/663、包类型、33TS scoped lint/format通过。

[45/46批次交付](../evidence/battle-batch-delivery.md)包含独立输入、实际命令/日志、3项Workspace当前结果、原始失败和边界。索引当前393稳定ID；`MV-S6-BATTLE-004`/`005`明确保留最终逆向/产品比较及实际游戏责任。48全量/构建、49/50适用E2/E4及52/53/54适用R2/R4/R6未记为通过；完整原始17页/三turn R2不以缩小样本替代。
