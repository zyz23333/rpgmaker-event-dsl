# 18: 编译输入捕获与 Freshness

Status: resolved
Blocked by: 17
Stage: S4a
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 源码、类型依赖、配置、Snapshot、目标和契约版本共同绑定输出；实际验证内容与哈希一致，旧输出被 Diff／Push 拒绝。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] Compile Baseline 同时包含实际源码、类型验证依赖、配置、Snapshot 集合/内容、目标绑定和 Compile Contract Version。
- [x] 依赖修改/删除/替换、配置/目标/契约变化使旧输出不可用于 Diff/Push；捕获、类型验证、生成和哈希使用同一实际输入。
- [x] Compile/Check/Decompile 发布前检测内容或发现集合变化，失败要求重跑；不增加普通 helper 值导入、事件脚本执行或隐式重试。

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

- [17：Snapshot 一致捕获与目标绑定](17-snapshot-capture-and-project-binding.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I9、I11、T1、T5；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Outcome

已交付共享不可变 TypeScript host 输入捕获、解析候选/目录观察、捕获 Snapshot 的统一验证/生成读取、发布前完整输入复查，以及包含单一内部 Compile Contract Version 的 Compile Baseline。依赖修改/删除/替换、新增高优先级声明和自动类型、包元数据及相关配置改变均使旧输出不可用于 Diff/Push。API/CLI 类型验证目录统一绑定 Workspace；Check只读且不建立 Freshness。普通 helper 值导入和事件JavaScript执行边界保持受限。

源码与构建同跑8组公共边界安全矩阵；保留16份最终通过记录及2份原failed记录。合入最新集成31b5461后的验证tip为a84eb848：正常 pnpm check（24 files /233 tests）、build、正常构建后基线（5 files /26 tests）全部通过；入库后证据/schema及独立往返复验1 file /3 tests通过。base vitest默认maxWorkers2，原断言与timeout保留。

详见[输入捕获与Freshness报告](../evidence/18-compile-inputs-and-freshness.md)。本票没有独立E/R分配，机器记录native:not-executed；19–22的完整输出发布、Decompile全批隔离、实时Drift与旧契约恢复，以及最终原生验收仍由对应工单完成。
