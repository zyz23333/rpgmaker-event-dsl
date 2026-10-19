# 19: Compile／Check 完整输出与发布

Status: resolved
Blocked by: 15, 18
Stage: S4b
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** Check 与 Compile 验证相同完整物化结果；验证失败不发布，发布失败后的不完整输出不能用于 Diff／Push。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] Compile 与 Check 都完成同样的物化、结构、引用和 Gate 验证；Check 不发布、不更新业务状态、不建立 Freshness。
- [x] 校验失败不发布新输出；generated/manifest 发布失败可以使旧输出失效，但 Diff/Push 必须拒绝不完整或不 fresh 产物。
- [x] 用真实临时文件系统和确定性失败核对源码、Snapshot、Project Root、产物与元数据状态；重新成功 Compile 可恢复。

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

- [15：raw、异常与递归 Gate 共用边界](15-raw-validation-and-script-gate.md)。
- [18：编译输入捕获与 Freshness](18-compile-inputs-and-freshness.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I9、I11、T1、T5；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Outcome

已交付完整纯内存 Compile Output 候选：Check 与 Compile 共享物化、严格 JSON 序列化、结构、固定引用与递归 Gate 校验。Check 无候选文件或业务状态更新，维持原 Freshness；Compile 在生成目录安装前及 manifest 提交前重查18的捕获输入。Diff／Push 从 Snapshot 独立推导完整 owned 文件集合，并对实际 Buffer 做 SHA256，拒绝少报、自报额外域、实际多余／损坏／缺失文件及发布失败后的 stale 状态。成功 Compile 可恢复；Project Root、Snapshot 与源码保持。唯一编译契约版本为 `mv-1.6.1/3`。

产品／测试提交 `5d541e98ab7f10d3808214a9ec9281f49cf49001`，基于并已合入最新集成 `1e6b3f4fbf8259bba421b2d85b78ae2a9b29cba6`。Windows／Node22.23.0 正常 `pnpm check` 27 files／260 tests、fresh `pnpm build`、正常 built Windows baseline 6 files／35 tests均通过；24份新原始记录入库后索引／schema／独立往返3 tests再次通过。新增9项要求，旧151项语义及既有证据不改；18份最终源码／构建passed及6份原failed记录原样保留。

详细矩阵、真实red→green、fingerprint及范围限制见[19验收报告](../evidence/19-compile-check-and-output-publication.md)。本票没有分配独立原生场景，记录均为 `native: not-executed`；23–25完整容器、21 Drift、22恢复及最终E／R回归仍属各自工单。
