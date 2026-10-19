# 22: Interrupted Push 内容恢复

Status: resolved
Blocked by: 21
Stage: S4c
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 按全 generated／全 snapshot 内容安全收尾，拒绝混合、未知和错目标；保留旧编译依据，恢复后继续正常 Freshness 检查。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 仅 Push 按可理解且绑定正确的证据恢复：全 generated 收尾，全 snapshot 放弃 pending 后继续正常流程；混合/缺失/未知/矛盾/错目标拒绝。
- [x] 可理解旧契约收尾保留原源码/依赖/配置/版本依据，不制造当前 Freshness；完成恢复后的普通检查仍能阻止新写。
- [x] 预造 pending、确定性故障、真实文件系统/受控多进程三层验证元数据与文件最终状态，锁清理和其他命令不能消解 pending。

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

- [21：Push 全输入漂移与写入复核](21-push-full-input-drift-checks.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I11–I12、T1、T5；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Answer

完成内容恢复与原始证据冻结协议。产品提交 `7b2e70235a7e315801aebd9c98f1bfcfb8847ef1`，独立 merger 实际反例推动的同 Buffer 捕获修复为 `65fa6c200f7b354228a253e2d4d3e219430d7abf`。仅 Push 依据完整 v3 M0/B/G 内容恢复，确定性形成 M1；全 O 先退休 P 再进入普通流程，混合/未知/缺失/矛盾/错目标拒绝。保留旧源码、依赖、配置、契约版本及缺失字段，恢复后普通 Freshness/Drift 仍可阻止新写。

Windows 10.0.19045 x64 / Node 22.23.0 实际验证：完整 `pnpm check` 30 files /352 tests 全通过（324.31s）；本工作树 fresh `pnpm build` 15 个产物通过；built Windows 基线 9 files /127 tests 全通过（222.62s）；归档后 evidence index 专项 1 file /3 tests 通过（5.32s）。默认 workers/timeouts 未放宽。

追加19项 requirement、39 source +39 built 最终执行；原191条 requirement 与429个历史结果 blob 不变。原始失败、中间通过、前一稳定产品351/126通过、原 held 进程死亡复现和独立 merger 捕获 red/green 均原样保留。原始字节复制和逐项哈希核对结果、源 revision/dirty provenance、`/5` 保守失效说明及完整限制见 [交付报告](../evidence/22-interrupted-push-content-recovery.md)。原生全部 `not-executed`，本票没有独立分配 E/R，最终实际原生检查仍由后续票负责。

已合并最新集成分支（当时仍为 `a64dc2e`）。保留本工作树、依赖 junction、旧/新 dist、Windows sandboxes 及原始外部证据，交由 merger 对最终归档 tip 审计后集成。
