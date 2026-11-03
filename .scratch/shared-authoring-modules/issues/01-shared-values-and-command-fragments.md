# 01: 跨文件共享常量、配置与命令片段

**What to build:** Event DSL 作者可以从本地共享模块具名导入常量、配置、引用和命令片段，让多个 Event Definition 复用同一份源码，并通过现有 Compile/Compile Check 得到正确事件数据。共享依赖从首次支持导入起就参与 Compile Baseline，修改共享文件后不能继续使用旧产物。

Blocked by: None (can start immediately)
Status: resolved

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 1, 2, 3, 14, 15, 16, 17, 18, 19, 22, 23, 26, 27

- [x] 如需整理现有源码加载、解析或输入捕获边界，先完成保持既有行为的局部整理及验证，再加入共享值能力；不新增作者需要调用的注册 API 或预处理步骤。
- [x] 两个独立 Definition Source 能以相对静态具名导入及别名使用同一模块中的字面常量、配置对象、DSL 引用值、单个 DSL Command 和命令数组；支持本地具名导出列表及导出别名。
- [x] 保持既有属性访问、对象和数组展开、类型注解、断言及 satisfies 的语义；命令数组由作者显式展开，不隐式展平。用独立预期 Raw Event Commands 验证生成顺序和保存值。
- [x] 解析遵循现有 ESM/NodeNext 约定，类型检查和值求值选中同一实现；支持常规 JavaScript 扩展名说明符解析到 TypeScript 源文件，并验证 Windows 含空格和中文的路径。
- [x] 新增值依赖的实际目标限制在配置的 sourceRoot 内，拒绝越界真实目标及工具隔离区，包括经路径别名到达的目标。对缺失文件、缺失导出及不支持的导入形式给出真实源码位置，不退回宿主执行。
- [x] 传递导入、多个入口共享依赖及菱形依赖可用；值模块循环得到有限失败和可读依赖链。合法的纯类型依赖和类型循环仍按既有 TypeScript 规则检查。
- [x] Definition Source Discovery 只选择声明入口；入口 include/exclude 不成为共享依赖准入规则。导入普通模块不递归收集其声明；同一模块既被导入又被发现时，不因调用者数量重复收集 Event Definition。
- [x] Compile/Check 检查入口及实际求值依赖的类型和本阶段支持的语法。共享模块内部类型错误、未知绑定和不支持的源码结构明确失败；未加载的普通文件不自动变成声明入口。
- [x] 使用现有输入捕获记录直接、传递共享源码及必要解析观察，确保检查、求值、生成与基线使用一致输入；缓存不跨操作掩盖文件变化，保持现有发布前输入复查。
- [x] 仅修改直接或传递共享源码即可使旧 Generated Project Data 失去 Generated Freshness，Diff/Push 拒绝旧输出；重新 Compile 后所有相关事件使用新值，正常 Diff/Push 可完成。此基础闭环不得留到 04 才实现。
- [x] Compile Check 不写 Generated Project Data、不刷新 Sync Manifest 或建立新鲜度；正常 Compile 和失败路径保持现有 Project Root、Snapshot 和发布状态规则。
- [x] 用公开 Workspace API 和真实临时源码验证以上行为；保留已有内联 DSL、同文件 const 展开、DSL namespace、外部类型导入、Common Event 调用和 Script Command Gate 的相关回归。
- [x] 同步共享值的使用说明，明确本地值导入范围。补充相应架构决定并修订 ADR 0013 的旧值导入限制，核对 ADR 0002 的源码加载表述；保留其他既有身份、同步和保存语义。
- [x] 相对实际集成版本更新 Compile Contract Version，并证明旧契约产物不能被当作当前产物；完成受影响的类型、静态及行为检查。

本票通过公开 Workspace 工作流交付共享值能力。参数化函数由 02 负责，复杂依赖变化及操作期间变动的完整验收由 04 负责，每次使用的完整来源由 05 负责，Decompile 的现有源码兼容由 06 负责。本票不预先宣称这些后续能力已完成。

## Comments

2026-11-03：从集成分支 `codex/shared-authoring-modules` 的 `466c7f73` 建立独立实施分支 `codex/shared-authoring-01` 并认领本票。按已确认的公开 Workspace API 测试入口进行逐条 red→green；使用真实 Windows / Node 22 验证。

2026-11-03：本票已完成。受限源码加载支持本地具名共享值、传递及菱形依赖、真实路径边界与隔离区保护，依赖只参与输入捕获而不扩大声明收集。共享实现自身也进行类型检查；导出列表可先于声明，纯类型导入/导出不进入值图，值循环有明确链诊断，调用只允许已知 DSL helper，不能经原型取得宿主函数后执行。基础 Compile/Check→Freshness→Diff/Push 闭环可用。已同步 ADR 0020、ADR 0002/0013 和使用说明，Compile Contract Version 为 mv-1.6.1/41。

验证：真实 Windows / Node v22.19.0 下，新增公开 Workspace 套件最终 14/14 通过；definitions、compile-inputs、decompile-publication、asset-diagnostics-workspace 四个受影响套件共 129/129 通过。类型检查、变更源与测试的 oxlint、变更文件格式及 git diff --check 通过。共享导入、循环链、隔离区别名、纯类型导入、宿主调用拒绝、语句位置、前置导出列表和混合 default/type 导入均经历实际失败再修复的逐条 red→green；保留的工作流状态检查及新增拒绝回归通过。未将 02 的作者函数、04 的完整竞态矩阵、05 的逐次来源、06 的身份扩展或 07 的构建 CLI 验收记为本票完成。
