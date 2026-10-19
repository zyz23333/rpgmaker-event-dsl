# 02: Windows 自动化基线

Status: resolved
Blocked by: 01
Stage: S0
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 同一最小 Workspace 在 Windows / Node 22 上运行检查、构建和 CLI 子进程验证，明确 Windows 文件系统必验项。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] CI 仅使用 Windows / Node 22 执行现有适用检查和构建，并完成最小 Workspace/CLI 验证。
- [x] 真实临时文件系统和子进程有可复用清理与结果留存约定，路径、junction、发布、锁、替换等必验责任明确；不得静默 skip。
- [x] 不新增公开测试 API；发现平台失败则修复或准确记录阻塞，不能把 CI 配置已切换记作 Windows 验证已通过。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

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

### 2026-10-19 — 实施与实际验证结果

本票在已合入 01 与 03 的 `c958799a115e34d6b7eeb6b97cf35a0182f61308` 上完成 Windows / Node 22.23.0、pnpm 10.33.0 实测。`pnpm check` 的类型、lint、格式与 15 个测试文件共 118 个测试通过；`pnpm build` 通过；构建后 `pnpm --filter rpgmaker-event-dsl test:windows-baseline` 的 2 文件、4 个实际 CLI 测试通过。GitHub 托管 runner 的本次执行仍未观察到；这里记录的是本机真实 Windows 检查结果及已配置的同一 CI 顺序，不将托管执行记为通过。

最小独立项目复用 01 的原始 fixture，经独立 Node 子进程执行 Init、Clone、Decompile、Check、Compile、Diff 与 Push。测试实际发现和求值生成源码、完整比较原始保存结构和值，观察只读 Check、no-op Push，以及源码改名后真正文件替换、Snapshot/manifest 刷新；错误选项的 stderr、退出 1 与最终源码/项目/generated/Snapshot/manifest 均核验。源码 CLI 与构建 CLI 分开执行；后者解析实际生成的包声明。中文与空格路径、包类型 junction、CLI 目录 junction 均在真实 Windows 文件系统执行，移除了原文件 symlink 测试对 EPERM/EACCES 的静默 return。

新增支持仅位于 test 目录，没有公开测试 API。每个临时工程独占 OS 临时目录的随机子目录，成功检查解析边界后清理，失败保留完整目录及原始进程记录；CI 明确上传结果目录和 runner.temp 下的失败目录。路径、目录发布、别名、锁、进程中断、逐文件替换与恢复责任已在 [Windows 基线责任表](../evidence/windows-baseline.md) 分配给 16–22，保持各票的未执行状态；本票未替代后续故障与并发验证。

正式通过记录位于 `../evidence/results/`：

- 源码 CLI：`MV-S0-WIN-CLI-001-2026-10-19T07-30-29-395Z-671311f8-0dbe-4f67-be5c-e68d3ad4a3f8.json`。
- 构建 CLI：`MV-S0-WIN-CLI-001-2026-10-19T07-31-16-806Z-77db64c9-e637-4798-a670-b7a63c729392.json`。
- 源码 junction：`MV-S0-WIN-JUNCTION-001-2026-10-19T07-30-20-108Z-7f44b606-1739-4e16-9315-d76049225ca8.json`。
- 构建 junction：`MV-S0-WIN-JUNCTION-001-2026-10-19T07-31-12-238Z-6663f194-6de9-497d-a902-fbfe2c7379eb.json`。

早期将临时工程放在仓库内部的探针遇到 Compile 与 Push 目录 rename 的间歇 EPERM。保留 `07-24-54-465Z-b493db34-988d-430b-a404-e026df92b4e8` 和 `07-26-36-025Z-91a9aa06-91a6-4ef4-bafc-82ece3afb9f3` 两份失败记录，未覆盖为通过。仓库内部单独重现 6 次有 1 次失败；仅改为 OS temp 后连续 6 次通过，随后最终全量检查及构建 CLI 通过。具体外部句柄/扫描来源未证实，不宣称产品的仓库内目录替换已修复；没有加入产品重试或放宽断言。目录发布/替换失败的产品保证仍由 19–22 验证。所有 36 份开发运行原始 JSON 另保留在 `C:/Users/Shuen/.codex/tmp/mv-ticket-02-evidence/`；两份 EPERM 完整失败目录移至 `C:/Users/Shuen/AppData/Local/Temp/rpgmaker-event-dsl-windows-failures/`，避免工作树清理丢失。
