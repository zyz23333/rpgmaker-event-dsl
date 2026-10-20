# 52: 最终游戏回归：页、战斗与控制流

Status: resolved
Blocked by: 48
Stage: S7
Execution batch: [最终原生回归](../tickets.md#batch-native-regression)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完成 R1–R3 的页选择、触发／调用、战斗 span、分支／循环／标签和停滞后果对照。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 R1–R3。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 候选版本完成 R1 五 Map trigger、页选择、Common trigger/调用、自主/强制路线与等待。
- [x] 完成 R2 最低战斗页、AND/全关、turn0/A-B、三 span/后续调度及结果分支；R3 Choices/条件/循环/Break/Exit/Label 后果。
- [x] 原生对照与产品输出使用等价干净初态，记录跳过、残留对象作用和停滞，不通过改引擎行为制造通过。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上执行本票 E/R 组，保留原生对照和产品输出的输入身份、版本、步骤、实际结果及差异。修复后按影响复验并追加记录，不能覆盖原始捕获。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（R1–R3）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。


## Answer

2026-10-20：在最终候选 `2dc639015f908de6fd524e50236e5422b5f8e990`、Compile Contract `mv-1.6.1/22` 上完成本票 R1–R3。33 对实际原生游戏、66 个独立进程通过；另有四份原始非法 E331 金额输入在公共 Decompile 中按预期拒绝，未启动游戏且仍为 `pairPassed:false`，不算游戏通过。完整输入、原生与产品两侧的干净初态、公共 Workspace 真正源码修改及 Push、15 个保存载体、四个加载载体、主机/进程/profile、七份引擎哈希、原生 oracle 和实际结果均由不可变绑定与逐次观察记录保留，见[最终游戏报告](../evidence/52-final-games.md)、[输入绑定](../evidence/52-final-games/input-bindings-v1.json)及[完整观察](../evidence/52-final-games/observations-v1.json)。

R1 五种 Map trigger、最高适用页、Common trigger/调用及路线/等待/Parallel 后果通过；完整 R2 原17页三回合、原 E122/E111/E121 guard、16条有序 trace、momentCounter2、Guard turns0/1/2、finalTurn3，以及胜利/普通逃跑/允许失败结果通过。原 R2 非法金额原件保留拒绝，其单字段合法变体保持完整场景。R3 八种 Choices、12种标签/条件/循环/Break/Exit/停滞及三组条件输入/三种实际车辆通过。补充上下文观察覆盖战斗中 Battle/Name 跳过、残留敌人死目标无操作及 `0→0→100→95`、原生 Wait 期间 aborting、下一场战斗重置与原生 Abort result1。

保留九次已完成的长路径准备失败、短路径批次中的原完整 R2 源文件计数前提失败及原两战斗合成预期失败。所有纠正均版本化，仅调整工具路径/计数或新合成场景的错误预期及更强观察，未修改产品、已接受领域、原始输入/失败或任何引擎方法；详细范围及精确差异见报告。最终有效37结果与39次短路径尝试分别记录。

验收索引追加九组、15份结果；轻量检查以实际 schema 验证全部447条 requirement 的形状，逐对象确认旧438条不变，并核对九组新增链接/哈希与15份新增结果的 schema/fixture/source fingerprint，全部通过。原 targeted index 保留原10秒期限，以10010.1556ms、STACK_TRACE_ERROR失败，原输出保留、原因未诊断且未复跑；独立 merger/55在最终证据集成后统一验证 current index。本票完成自身游戏和交付责任；未将 `MV-S6-BATTLE-005` 的53/54关联责任或55完整支持声明一并标为通过。
