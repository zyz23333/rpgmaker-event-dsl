# 42: 角色成长、技能与职业

Status: resolved
Blocked by: 10, 23
Stage: S6
Execution batch: [角色状态、成长与装备](../tickets.md#batch-actors)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** EXP／等级／能力／技能／职业完整覆盖操作数、限制和独立选项，EXP 常量与运行变量分开验证。

## Scope

主要指令责任：E315、E316、E317、E318、E321。

原生证据分配：E7/R7。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E315/E316/E317/E318/E321 全模式/枚举/引用/独立选项逐项验证，包含显示升级和 keepExp 等保存状态。
- [x] EXP 常量严格整数 1..9,999,999，运行变量值不套常量上限；原生前置 10 的结果可追踪。
- [ ] 正式/raw/反编译与真实 Workspace 一致，完成 E7/R7 中分配的产品输出和实际增减对照。

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

- [10：原生 EXP 临界值逆向核对](10-native-exp-boundaries.md)。
- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [角色、战斗与场景参数附表](../../complete-mv-events/research/command-parameters/actors-battle.md)。


## Development completion — 2026-10-20

按规格2026-10-20用户执行修订，以41/42/43完整能力批次关闭开发。正式类型/helper、Compile、Decompile、原始对象/固定引用、known raw与实际Workspace路径、当前公开文档均已交付；实际integration6dfa75eb已合入，批次契约为mv-1.6.1/15。合并后273项受影响测试、4项当前实际Workspace、3项Snapshot上下文、类型/静态检查及编译契约Freshness用例已通过。完整预期、实际版本、命令、原始失败及修正见[批次交付记录](../evidence/41-43-actor-capability-batch.md)。

上方原有包含实际原生验收的第三项保持未勾，以如实记录未执行状态；开发resolved不等于最终原生通过。最终全矩阵/构建在48，E7逆向与产品比较在51，R4角色/状态/动态装备及上下文游戏验证在53，R7成长/技能/职业实际后果在54。当前没有编辑器UI或游戏实测声明；原始证据原地保留，不新增大型归档。
