# 06: 让 Decompile 兼容使用共享逻辑的现有源码

**What to build:** Workspace 已有源码使用共享值、命令函数或嵌套组合时，作者仍能执行 Decompile。工具能识别现有 Entry Identity、拒绝候选冲突，并保持身份分析、输入一致性及完整候选发布的既有边界。

Blocked by: 02
Status: resolved

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 25, 28, 29

- [x] 现有源码包含本版合法的共享导入、函数声明、箭头函数及命令函数调用时，不再仅因这些语法而拒绝身份检查。通过公开 Decompile 完成无身份冲突的真实 Workspace 案例。
- [x] Entry Identity 使用受支持的共享常量、对象字段或既有对象展开时，按需要解析直接及传递依赖，仍按 Data Domain 和显式 MV ID 判断身份；不从模块、文件或函数名推导身份。
- [x] 现有声明与候选身份发生冲突时，可靠拒绝并给出相关身份和来源；无法确定身份的源码仍明确失败，不跳过未知声明或猜测安全。
- [x] 保持 ADR 0014 的有限身份分析：只解释识别身份所需的内容，不调用完整事件构造、不执行无关命令函数，也不为此完整校验既有事件负载。
- [x] 不相关命令错误、无关类型错误或关闭 Script Command Gate 不能无故扩大成既有事件的完整校验；用于确定身份本身的错误仍失败。用可观察的 Decompile 结果证明这一区分。
- [x] 现有事件不能为完整候选补齐遗漏引用；候选仍独立进行原有表达能力与固定引用验证，不执行事件 JavaScript，也不改变 Script Command Gate。
- [x] 身份分析使用与本版正常解析一致的受限本地模块规则，捕获实际读取的共享输入及必要解析观察；相关共享身份依赖在操作期间变化时，发布前失败并要求重跑，不混合旧身份和新输入。
- [x] 使用既有工作流测试设施验证身份依赖修改和解析变化；本票自己完成 Decompile 的必要输入保护，不以 04 的 Compile/Diff/Push 验收作为其替代或阻塞条件。
- [x] 保持候选永久隔离、最终发现规则、目的目录必须不存在和一次完整发布；共享导入不得把部分候选或工具隔离区变成可用依赖。
- [x] 身份冲突、未知身份或发布前输入变化时，原用户源码和 Snapshot 保持原保护，失败不发布部分新源码；既有发布 I/O 失败和重试语义不变。
- [x] 未修改的反编译源码仍能通过 Compile 重建独立预期的支持范围内保存状态，满足 Event Semantic Round Trip；不尝试从 MV 数据还原原来的模块和函数边界。
- [x] 通过公开 Decompile 和必要的 Compile 回归验收上述行为，完成受影响的类型、静态及行为检查。同步 Decompile 兼容范围说明；若改变编译契约，按现有规则相对实际集成版本更新版本。

本票扩展的是现有源码身份读取与相应工作流保护。它不引入完整事件工厂，也不把 Decompile 改为完整编译已有源码；逐次命令诊断由 05 负责，构建后 CLI 的整体交付由 07 负责。

## Comments

2026-11-03 — 实现完成，公开 Workspace 验收通过。

- 现有源码保持独立的按需 Entry Identity 投影；共享导入复用受限本地解析器，直接及传递源码、实际解析观察进入同一次 TypeInputCapture。函数声明和箭头函数保持惰性，只投影需要的函数结果、选项字段和局部 const；不调用 DSL 构造器或执行事件 JavaScript。
- 对象展开、共享配置与显式引用 ID 可决定身份；名称引用不推导 ID。Common Event 引用/命令与声明通过 commands/trigger 的存在区分，检查存在性不读取命令负载。身份依赖错误、递归、未初始化局部和不支持的高阶调用仍明确失败。
- 冲突诊断包含 Entry Identity、现有声明源文件与候选文件。新增公开 Decompile 案例证明关闭 Gate 与无关命令/类型错误不触发完整校验，候选不能借现有源码补齐引用，内容改变及 junction 解析改变都在发布前拒绝并保护原状态。
- 新增 decompile-shared-identities.test.ts 22 项，连同 decompile-publication.test.ts 的 33 项共 55 项通过。原有发布、隔离、I/O 失败与重试保护保持通过；新增 Decompile→Compile 案例按独立字面预期核对保存的 CR、空行与终止记录。
- 实际 Windows x64 / Node 22.19.0，经显式 Corepack pnpm 10.33.0：上述 Vitest 套件、包 typecheck、变更 TypeScript 文件 oxlint 通过；已格式化变更文件。
- 本票只改变 Decompile 现有身份读取及其输入/发布检查，不改变 Compile 的 DSL 类型、验证或生成语义，因此沿用实际集成 Compile Contract Version mv-1.6.1/42。构建后 CLI 整体验收仍由 07 负责；无真实 MV 编辑器或游戏执行声明。
