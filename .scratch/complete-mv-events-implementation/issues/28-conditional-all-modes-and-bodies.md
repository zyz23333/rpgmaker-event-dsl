# 28: Conditional 全条件与子体

Status: resolved
Blocked by: 09, 23, 24, 25
Stage: S6
Execution batch: [条件与分支](../tickets.md#batch-conditions)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 覆盖全部 14 种条件和 Actor 子型，精确保留缺／空 else、脚本字符串及各容器的引用与运行选择诊断。

## Scope

主要指令责任：E111。

原生证据分配：E2/E5、R3/R4/R7。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 全部 14 条件模式、Actor 7 子型及所有枚举/引用/selector 均有独立正负边界预期。
- [x] then/else 使用 Child Command Body，缺 else 与空 else 区分；单槽 Script Input 完整保留、准确 warning 和 Gate。
- [x] 在三类真实容器验证固定引用与上下文 warning，不能只测 parser 返回 helper 字符串。按2026-10-20用户执行修订，E2/E5及R3/R4/R7分配场景转49/51–54最终执行，当前未执行且未记通过，详见下方Answer。

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
- [24：Map Event 完整页与 note](24-map-event-full-pages-and-note.md)。
- [25：Troop Event 所有权与 Reset](25-troop-event-ownership-and-reset.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

## Comments

### 2026-10-20 — 认领与实施边界

在独立 managed worktree `mv-ticket-28`、分支 `codex/mv-ticket-28` 基于实际集成 `205334338d8e64e3d00e485849c9ddf67bd7e3b1` 认领。沿用规格 T1 已确认的公开 DSL／实际 Workspace Discovery、求值和文件系统测试边界，按独立原生预期逐切片 red→green。完整14条件、Actor7子型、Child Command Body、正式／已知 raw／严格未类型化输入、引用／Gate／上下文及数值保真均属本票；原17页三回合 Conditional R2 失败保留并安排原完整输入产品配对复验，不由25的Script guard变体替代。

先进行聚焦开发、文档和追加证据；全量检查、构建、built Windows基线、原生产品配对及最终契约版本由root串行排期。当前认领不表示验收或READY。

### 2026-10-20 — DEV源码检查点，仍未READY

完整E111形式模型、14模式／Actor7子型、严格helper／直接值／原生／已知raw、独立子体marker、单槽Script／Gate／CR-LF warning、类别引用和运行上下文warning已形成源码DEV检查点。实际Discovery／求值的三容器完整往返和真实源码修改Push保留负零；原R2简化guard回归通过。最终聚焦11文件304测试、package typecheck和改动TypeScript的lint通过；未运行全量check、build、built基线、原生游戏或最终Compile Contract Version更新。

新增4条Workspace源码验收记录，旧274条requirement逐对象相同、2,307个历史结果／fixture文件逐字节相同，见[DEV报告](../evidence/conditional-dev-20261020.md)和[历史审计](../evidence/conditional-dev-history-audit.json)。报告列出待root串行执行的集成／built／E2-E5及R3-R4-R7原生工作；原完整17页三回合R2输入仍须配对复验，简化guard及25的E355变体不替代。票保持claimed，不能据此关闭。

## Answer

### 2026-10-20 — 按已接受的轻量批次政策完成开发验收

实际集成 `08d85b4b` 已合入。产品覆盖和原先独立预期见DEV报告；后续受影响9文件359单测、4文件30Workspace测试通过。本轮优化证据单测后，原证据/8个新小语料/Conditional Workspace合计3文件15测试、package typecheck、受影响lint与格式通过。源码及命令、环境和实际输出见[最终开发验收报告](../evidence/conditional-finalization-20261020.md)。旧全量仍准确记录为1,357通过、2次超时，未宣称该次通过，也未宣称已经诊断其原因。

日常证据检查完整验证需求、关联文件及当前结果，不再反复解析所有旧canonical payload；最新选择不按passed筛选，legacy/坏名称始终完整检查，显式history入口保留全历史深审。既有requirement、fixture和result未因此重写。

依规格顶部2026-10-20用户执行修订，本票开发范围已完成并resolved。48仍负责最终全量/构建/built；49/51仍待E2/E5产品比较；52–54仍待本票R3/R4/R7实际游戏场景。原完整17页三回合R2及七对静态准备的输入/脚本指针已保留给52，当前均未冒称本轮游戏通过。55在全部最终专门票完成后审计完整覆盖；本票关闭不构成最终完整支持声明。

### 2026-10-20 — 最终52实际游戏补充

52 实际完成 held/direct/released 三组完整条件输入与三种已乘载车辆，以及完整 R2 原 E122/E111/E121 guard、17页三回合和全部调度 oracle。原四份非法 E331 输入各自实际拒绝；分别版本化的有限合法金额变体才启动游戏，不把原拒绝改写成通过。R3条件/循环/标签组亦通过；R4/R7仍由53/54各自交付。 共同候选为 `2dc63901` / `mv-1.6.1/22`；详见[52最终报告与限制](../evidence/52-final-games.md)。52共33对/66个实际游戏通过，四份原始拒绝独立保留；本注只确认所列52责任，既有状态保持不变，最终索引及跨票完整性由55汇总。
