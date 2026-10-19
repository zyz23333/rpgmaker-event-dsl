# 26: Timer 完整槽位往返

Status: resolved
Blocked by: 05, 23
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** Start 与 Stop 缺槽／零／非零状态在正式 DSL、已知 raw 和 Workspace 往返中一致。

## Scope

主要指令责任：E124。

原生证据分配：E4。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] Start 恰两槽且 seconds 必填；Stop 恰一/两槽，省略/undefined 为缺槽，显式 0 和非零保留，范围 0..5999。
- [x] 类型、null、多槽、稀疏洞与域外值在正式、已知 raw 和反编译一致失败；独立原生预期和实际生成源码证明往返。
- [x] E4 将本票实际产品输出与 05 逆向证据中的容器序列化/参数确认契约比较，并保留结果关联。

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

- [05：原生 Timer Stop 槽位逆向核对](05-native-timer-stop-slots.md)。
- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

## Comments

### 2026-10-20 — DEV / focused 实施认领

独立工作树 `C:/Users/Shuen/.codex/worktrees/mv-ticket-26/rpgmaker-event-dsl` 从实际集成提交 `205334338d8e64e3d00e485849c9ddf67bd7e3b1` 建立，起始状态干净，分支 `codex/mv-ticket-26`；05/23 已 resolved。按 implement-spec 与 tdd 在已批准的 T1 公共接口建立窄 red→green，用独立原生参数数组验证 Timer 完整保存槽位。准备笔记在仓库外 `C:/Users/Shuen/.codex/tmp/mv26-timer-preparation-20261020.md`。

本阶段仅聚焦开发测试、相关类型与 lint 检查；全量检查、构建、built baseline、最终契约版本增量与 E4 实际产品比较等待协调槽。本记录不代表 resolved、READY、编辑器 UI 或游戏验收通过；旧 requirements 与历史结果保持。

### 2026-10-20 — DEV checkpoint 验证与交接

已交付有限Timer类型/helper/编译/反编译/正式及已知raw校验、精确负零渲染、raw槽位诊断路径、三容器真实Workspace及完整15个carrier比较、文档和编写指南。实际窄red→green及测试前提错误均留存于[实施记录](../evidence/26-timer-saved-slot-roundtrip.md)和[原始历史](../evidence/26-history/README.md)。

聚焦Timer60例通过；相关5文件91例通过；末次Timer+索引2文件63例通过，追加最终化E4待执行行后索引单例再次通过。包类型与改动TS的lint通过。新增13条自动化与1条待最终化E4，requirements共288行，归档120个source通过记录、29个原始日志；原274行深度相等、2,722个旧历史文件及旧README前缀字节一致。保留claimed，未运行broad/build/built/native、未最终bump Compile Contract、未resolved/READY。后续须获取实际最新集成与最终化槽后再执行这些完成门槛。

### 2026-10-20 — 最终化 READY / resolved

原DEV提交保持不变；M盘独立最终化分支先合并实际集成888b950（含完整Map24数值修正），最终产品3c7aad6使用Compile Contract mv-1.6.1/12。当前full check 42文件1069测试、fresh15文件build、built Windows18文件455测试均通过。首次full的七个旧粗粒度诊断断言失败与原10秒索引超时原样保留；修正断言后focused4文件140例及完整重跑通过，没有改worker或期限。

实际E4对照同身份05 REA事实及10条资源，当前built公共Workspace执行8个产品阶段、14独立场景与10负例；四个generated及十五个实际live carrier完整相等，精确槽位与负零、Check和失败业务状态均通过。26无分配游戏组，最终50/52–54继续后续责任。当前公开API文档、示例与编写指南在DEV已更新并复核；无旧别名/迁移说明或首方制品进入本票交付。

最终selected index在原10秒内通过。新增1458结果、1507初始归档文件和13个关闭后的追加捕获有原始映射；入站300和DEV288条requirement保留、共314条。6084个unique历史raw blob/报告前缀、所有归档source/copy、189个实际/物理冻结输入及15dist均核验一致。详情与原始结果见[当前实施记录](../evidence/26-timer-saved-slot-roundtrip.md)、[最终历史](../evidence/26-final-history/README.md)、[byte audit](../evidence/26-final-history/final-byte-audit-v1.json)及[最终index原输出](../evidence/26-final-history/post-archive/final-index-v1/stdout.log)。本票适用criteria全部完成，状态resolved；完整规格的最终汇总、实际游戏与55审计仍独立执行。
