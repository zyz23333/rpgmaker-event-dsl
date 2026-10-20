# 28: Conditional 全条件与子体

Status: claimed
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

- [ ] 全部 14 条件模式、Actor 7 子型及所有枚举/引用/selector 均有独立正负边界预期。
- [ ] then/else 使用 Child Command Body，缺 else 与空 else 区分；单槽 Script Input 完整保留、准确 warning 和 Gate。
- [ ] 在三类真实容器验证固定引用与上下文 warning，完成 E2/E5、R3/R4/R7 中分配场景，不能只测 parser 返回 helper 字符串。

### 共通要求（限本票适用范围）

- [ ] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [ ] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [ ] 产品变更执行 Windows / Node 22 全量适用检查与构建；安全票同时验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [ ] 本票分配的必要编辑器/游戏场景取得实际证据后才关闭；最终回归另外执行。原生版本、runtime/NW.js、步骤、输入身份、操作者、预期/实际与原始结果可追踪。
- [ ] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

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
