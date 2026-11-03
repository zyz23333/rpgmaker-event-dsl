# 04: 共享依赖变化时保护 Compile、Diff 与 Push

**What to build:** 作者修改、删除、移动或替换共享依赖，或者在编译期间改变共享源码时，Workspace 能拒绝失效或输入不一致的结果。重新编译后才恢复正常 Diff/Push，Compile Check 和失败路径保持约定的状态保护。

Blocked by: 01
Status: resolved

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 22, 23, 24, 25, 26

- [x] 在 01 已交付的共享源码捕获及基本失效行为上，覆盖直接和传递依赖内容修改、删除、重命名、替换和解析目标改变；入口内容不变时也必须使旧 Generated Project Data 失效。
- [x] 依赖内容变化但生成数据碰巧相同的案例仍拒绝旧 Compile Baseline；仅比较生成字节不能代替当前源输入检查。
- [x] 覆盖已读取文件未变而解析观察变化的代表性案例，例如新候选或包元数据影响实际解析；沿用现有解析观察政策，不新增符号级最小失效集承诺。
- [x] 通过公开 Diff/Push 验证上述失效：拒绝时不写 Project Root；修复依赖并重新 Compile 后，所有相关事件更新，正常 Diff/Push 成功。无变化依赖不会因缓存或来源处理被无故认定为已变。
- [x] 使用现有可控工作流进程边界，在 Compile/Check 执行期间改变共享源码或解析结果；既定发布/返回检查点发现变化后失败并要求重跑，不自动重试部分求值或混合两版内容。
- [x] 类型检查、求值、生成和 Compile Baseline 始终使用同一捕获输入。模块缓存以当前操作为界，前一命令的读取不能掩盖下一命令的真实文件变化。
- [x] 对成功和失败的 Compile Check 比较源文件、Generated Project Data、Sync Manifest、Snapshot、配置及 Project Root，证明其不写业务状态且不建立新的 Generated Freshness。
- [x] 普通 Compile 的校验失败不发布部分新输出；发布 I/O 或最终复查失败后的状态遵循现有规则，失效数据不得用于后续 Diff/Push。不额外承诺保存最后一次可用输出。
- [x] 旧或缺失 Compile Contract Version 的输出继续被拒绝；共享编写不能绕过 Project Drift、同 Workspace 互斥、Project Root Binding、素材检查和 Interrupted Push 约束。
- [x] 主要通过公开 Workspace API、真实共享文件和现有进程测试设施验收，不新增仅供测试的公开接口。使用共享常量即可完整验证本票，函数支持不构成本票前置条件。
- [x] 完成必要修复及受影响的类型、静态和行为检查；如改变编译契约，相对实际集成版本更新版本。与函数组合后的最终构建 CLI 验证由 07 完成。

01 的基础输入捕获和普通内容变化失效是本票起点。本票负责较完整的依赖变化、操作期间输入变化和状态保护验收；Decompile 的身份依赖捕获与发布保护由 06 负责，不能以本票通过替代它。

## Outcome and verification

Completed 2026-11-03 against integrated ticket 01 (`7f092d182efdd28924a4e93543b0987f229000ba`). Added seven public Workspace regression tests in `packages/rpgmaker-event-dsl/test/shared-dependency-workflow.test.ts`, using real Windows workspaces with spaces/Chinese paths and the existing process checkpoints.

- Direct and transitive shared edits, deletion, rename and replacement reject Diff/Push with unchanged entry source. Comment-only edits invalidate the old baseline despite identical emitted bytes; recompilation updates both importing events and unchanged subsequent Diff/Push succeeds.
- Retargeting a shared directory junction to identical source bytes and adding a nearer package scope invalidate recorded resolution observations. Restoring the observations or recompiling restores the normal workflow.
- Compile/Check reject shared source and package-scope changes at `input-validation`; competing Diff remains excluded. Check success and type/reference/Script Command Gate/asset failures preserve source, Generated Project Data, Sync Manifest, Snapshot, configuration and Project Root; Check never refreshes a stale baseline.
- Candidate-write, installation, manifest I/O and late shared-input changes cannot authorize output. Failures retain the existing publication contract; subsequent Diff/Push rejects stale or inconsistent data until explicit Compile.
- Missing/old Compile Contract Version, Project Drift, Project Root Binding and Interrupted Push protections remain effective for shared source. Recovering an all-snapshot Interrupted Push does not authorize writes after its shared dependency changed.

Each behavior was added and run as its own vertical regression slice. All slices passed the existing implementation; no product defect was found, no artificial failing test or product change was introduced, and Compile Contract Version remains `mv-1.6.1/41`.

Validation used Windows x64, Node **v22.19.0** and pnpm **10.33.0**, launched through the explicit Node 22/Corepack path documented in the implementation environment:

- `pnpm --filter rpgmaker-event-dsl exec vitest run test/shared-dependency-workflow.test.ts test/shared-values-workspace.test.ts test/compile-inputs.test.ts test/compile-publication.test.ts` — **4 files, 38 tests passed** (133.51 s).
- `pnpm --filter rpgmaker-event-dsl typecheck` — passed.
- `pnpm exec oxlint packages/rpgmaker-event-dsl/test/shared-dependency-workflow.test.ts` — passed.
- `pnpm exec oxfmt --check packages/rpgmaker-event-dsl/test/shared-dependency-workflow.test.ts` and `git diff --check` — passed.

These checks use the source Workspace API and shared constants. Ticket 06 owns Decompile identity dependency publication; ticket 07 owns the final parameterized built-CLI acceptance. This ticket does not claim either separate acceptance.
