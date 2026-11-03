# 02: 参数化命令函数与嵌套组合

**What to build:** Event DSL 作者可以在本地或共享模块定义命令函数，通过选项对象为不同事件传入奖励、引用和设置，并组合其他共享函数。不同调用生成各自正确的命令，仍通过普通 Compile/Check 和既有事件编译流程使用。

Blocked by: 01
Status: resolved

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 4, 5, 6, 7, 8, 9, 10, 18, 19, 22, 27

- [x] 支持具名函数声明和赋给 const 的箭头函数，既能同文件调用，也能具名导出、导入和通过导入别名调用；不把函数收集为 Event Definition。
- [x] 支持零个参数或一个具名选项对象参数；支持参数名后的属性读取，以及一层具名属性解构和重命名。参数和返回值可带普通 TypeScript 类型声明，错误的参数类型在 Compile/Check 中可见。
- [x] 支持箭头表达式返回体，以及由零到多个 const 声明和一个末尾 return 组成的函数块；函数内可使用参数、模块常量、既有受限表达式、DSL helper 和其他受支持函数。
- [x] 词法绑定和调用作用域符合所支持语法的普通行为；每次调用具有独立局部值。覆盖同名局部绑定、多个调用参数以及跨模块常量的组合，不能让一次调用改写其他调用或模块常量。
- [x] 函数可以返回用于组合的常量、配置、引用值、单个 DSL Command 或命令数组；多层函数组合及同一函数多次调用保持作者指定的命令顺序，不隐式展平数组。
- [x] 用至少两个不同参数集的宝箱或奖励事件完成公开 Compile/Check 验证；生成命令与独立预期一致，并辅以内联写法比较。普通编译后能进入现有 Diff/Push 流程。
- [x] 直接或间接递归明确失败，并报告有用的函数链；不能无限递归或以宿主执行代替受限求值。
- [x] 对本阶段加载模块中的函数体检查支持范围，包括尚未调用的函数。默认参数、rest、嵌套解构、this、通用控制流、一般二元计算、模板插值、数组及宿主方法、异步、生成器、类和可变状态等规格外语法明确失败。
- [x] 不增加函数返回函数、完整 Event Definition 工厂、批量事件生成或自动身份分配。事件仍显式声明 Entry Identity；函数调用不会生成 Common Event 或改变运行时调用关系。
- [x] 函数源码及传递组合依赖沿用 01 的一致输入捕获和新鲜度检查。仅修改函数实现后旧产物失效；重新 Compile 能更新所有相关事件。Compile Check 保持只读。
- [x] 基本参数、语法、绑定及函数构造错误有可靠源码位置；保留可用于后续完整调用诊断的信息。不同使用位置及后续引用、素材验证的完整来源验收由 05 负责。
- [x] 通过现有公开 Workspace API 覆盖本地与跨模块调用，并验证既有 DSL helper、Common Event 调用和 Script Command Gate 的语义；不执行事件 JavaScript。
- [x] 同步第一版函数语法说明和最小可编译示例，相对实际集成版本更新 Compile Contract Version，完成受影响的类型、静态和行为检查。

本票交付可使用的纯组合函数。跨三类事件容器和 Child Command Body 的完整保存形态矩阵由 03 负责；共享函数不参与的基本依赖变化票 04 不以本票为前置条件。

## Outcome

2026-11-03：实现受限参数化作者函数。具名函数和 const 箭头函数以不可执行的内部令牌保存 AST/词法作用域，沿用 DSL helper allowlist，不执行作者模块或事件 JavaScript。支持零参数/选项对象、浅解构/重命名、const + return、命令及配置/引用组合、函数声明与导入提升、const 初始化边界和独立调用作用域。已加载但未调用的函数同样校验语法、调用目标与递归链；拒绝宿主方法、高阶参数、返回函数和事件工厂。Common Event 引用/调用命令与声明的收集区分已修正。

公开 Workspace API 用例验证两个奖励参数、跨模块嵌套/别名/DSL namespace/局部绑定、独立原生命令预期及内联对照、类型和构造源码位置、只改函数后的失效与重新 Compile/Diff/Push、Check 只读、Script Command Gate。README 双奖励示例由测试直接读取并编译。完整每次使用来源矩阵仍由 05 承担，构建后综合 CLI 验收由 07 承担。

验证环境：Windows / Node v22.19.0，通过环境记录中的 Corepack pnpm 10.33.0 启动。

- `vitest run test/author-functions-workspace.test.ts test/shared-values-workspace.test.ts test/definitions.test.ts test/common-event-workspace.test.ts test/compile-inputs.test.ts`：5 文件、140 测试通过，其中新公共行为测试 12 项。
- 包 `typecheck`、变更 TypeScript 文件 `oxlint`、变更文件 `oxfmt --check` 和 `git diff --check` 通过。
- 按公开行为逐项红→绿：初始函数不支持、浅解构/提升、未调用二元表达式/宿主方法、递归、函数/事件返回限制、this/default export、const 初始化位置、箭头类型包装、DSL namespace 局部展开等均先见失败再实现。
- 编译契约相对集成 `/41` 更新为 `mv-1.6.1/42`。未修改 04 票内容。