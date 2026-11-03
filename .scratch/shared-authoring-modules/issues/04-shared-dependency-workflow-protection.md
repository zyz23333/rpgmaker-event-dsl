# 04: 共享依赖变化时保护 Compile、Diff 与 Push

**What to build:** 作者修改、删除、移动或替换共享依赖，或者在编译期间改变共享源码时，Workspace 能拒绝失效或输入不一致的结果。重新编译后才恢复正常 Diff/Push，Compile Check 和失败路径保持约定的状态保护。

Blocked by: 01
Status: ready-for-agent

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 22, 23, 24, 25, 26

- [ ] 在 01 已交付的共享源码捕获及基本失效行为上，覆盖直接和传递依赖内容修改、删除、重命名、替换和解析目标改变；入口内容不变时也必须使旧 Generated Project Data 失效。
- [ ] 依赖内容变化但生成数据碰巧相同的案例仍拒绝旧 Compile Baseline；仅比较生成字节不能代替当前源输入检查。
- [ ] 覆盖已读取文件未变而解析观察变化的代表性案例，例如新候选或包元数据影响实际解析；沿用现有解析观察政策，不新增符号级最小失效集承诺。
- [ ] 通过公开 Diff/Push 验证上述失效：拒绝时不写 Project Root；修复依赖并重新 Compile 后，所有相关事件更新，正常 Diff/Push 成功。无变化依赖不会因缓存或来源处理被无故认定为已变。
- [ ] 使用现有可控工作流进程边界，在 Compile/Check 执行期间改变共享源码或解析结果；既定发布/返回检查点发现变化后失败并要求重跑，不自动重试部分求值或混合两版内容。
- [ ] 类型检查、求值、生成和 Compile Baseline 始终使用同一捕获输入。模块缓存以当前操作为界，前一命令的读取不能掩盖下一命令的真实文件变化。
- [ ] 对成功和失败的 Compile Check 比较源文件、Generated Project Data、Sync Manifest、Snapshot、配置及 Project Root，证明其不写业务状态且不建立新的 Generated Freshness。
- [ ] 普通 Compile 的校验失败不发布部分新输出；发布 I/O 或最终复查失败后的状态遵循现有规则，失效数据不得用于后续 Diff/Push。不额外承诺保存最后一次可用输出。
- [ ] 旧或缺失 Compile Contract Version 的输出继续被拒绝；共享编写不能绕过 Project Drift、同 Workspace 互斥、Project Root Binding、素材检查和 Interrupted Push 约束。
- [ ] 主要通过公开 Workspace API、真实共享文件和现有进程测试设施验收，不新增仅供测试的公开接口。使用共享常量即可完整验证本票，函数支持不构成本票前置条件。
- [ ] 完成必要修复及受影响的类型、静态和行为检查；如改变编译契约，相对实际集成版本更新版本。与函数组合后的最终构建 CLI 验证由 07 完成。

01 的基础输入捕获和普通内容变化失效是本票起点。本票负责较完整的依赖变化、操作期间输入变化和状态保护验收；Decompile 的身份依赖捕获与发布保护由 06 负责，不能以本票通过替代它。
