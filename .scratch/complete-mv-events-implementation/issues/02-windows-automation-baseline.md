# 02: Windows 自动化基线

Status: ready-for-agent
Blocked by: 01
Stage: S0
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 同一最小 Workspace 在 Windows / Node 22 上运行检查、构建和 CLI 子进程验证，明确 Windows 文件系统必验项。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；最终集成候选的完整原生回归另由 49–54 交付。首方、静态、合成、真实 UI 与游戏观察按规格分别记录。

## Acceptance criteria

- [ ] CI 仅使用 Windows / Node 22 执行现有适用检查和构建，并完成最小 Workspace/CLI 验证。
- [ ] 真实临时文件系统和子进程有可复用清理与结果留存约定，路径、junction、发布、锁、替换等必验责任明确；不得静默 skip。
- [ ] 不新增公开测试 API；发现平台失败则修复或准确记录阻塞，不能把 CI 配置已切换记作 Windows 验证已通过。

### 共通要求（限本票适用范围）

- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T1、T5、I13（S0）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Comments

### 2026-10-19 — 平台范围调整

按用户要求，本票仅交付 Windows / Node 22 自动化基线，名称与文件名同步调整。CI runner 已切换为 Windows；本票仍须完成实际检查、最小 Workspace/CLI 与 Windows 文件系统验证，保持 ready-for-agent，未因配置切换标记完成。

本次平台调整已在本机 Windows、Node 22.23.3、pnpm 10.33.0 下执行现有 pnpm check 与 pnpm build：类型、lint、格式检查通过，13 个测试文件的 114 个测试通过，构建通过。该记录仅证明现有检查在此环境中的结果；本票新增的最小 Workspace 与 Windows 文件系统完整基线仍待实施，GitHub 托管 runner 尚未执行本次变更。
