# 跨事件的共享编写模块与参数化命令函数（第一版）

Status: ready-for-agent
Created: 2026-11-03
Scope: 本地共享模块、参数化命令函数、命令组合，以及现有 Workspace 工作流集成

## Problem Statement

Event DSL 作者在多个 Event Definition 中编写宝箱、商店、任务奖励等相似内容时，需要反复复制 DSL Commands 和配置。相同逻辑分散在不同文件中，调整一次规则需要逐个修改，容易遗漏，也难以用参数表达事件之间的差异。

当前 Workspace 的源码加载采用受限 TypeScript 求值。同文件的 const 值、对象和数组展开可以复用，但普通值导入仅接受工具自身的 DSL 模块，自定义函数声明和箭头函数没有求值支持。外部 import type 可以参与类型检查，却无法带入实际命令或配置。

Common Event 与 Common Event DSL Command 已能提供游戏运行时复用，但没有编写函数的参数接口。作者需要的是在编译时组合 DSL Commands，并在每个使用位置生成对应的原生事件内容；不应为了减少源码重复就必须分配 Common Event 的 Entry Identity。

## Solution

作者可以在 Workspace 的 sourceRoot 内创建普通 TypeScript 共享模块，用具名导出提供常量、配置、命令片段和参数化函数，再从 Definition Source 或其他共享模块使用相对静态导入。函数接收具名参数对象，返回 DSL Commands 或用于组合命令的值；事件通过现有对象、数组和展开语法使用这些值。

第一版扩展现有受限求值模型，提供明确的纯组合函数子集，不切换为任意 TypeScript 模块执行。共享函数在 Compile/Compile Check 阶段求值，生成的数据继续进入现有 Staged Data Graph、事件校验和编译链。相同输入的共享写法应产生与手工展开写法相同的 Native Saved Shape。

本次能力同时覆盖共享依赖追踪、错误来源和现有 Workspace 工作流兼容。共享文件改变后，旧 Generated Project Data 必须失去 Generated Freshness；正常 Compile/Check、Diff/Push 及 DSL Decompilation 的既有约束继续成立。

## User Stories

1. As an Event DSL author, I want to extract repeated command sequences into a local module, so that I can maintain their source in one place.
2. As an Event DSL author, I want to import a shared command array from multiple Definition Sources, so that several events can reuse the same authored sequence.
3. As an Event DSL author, I want to share configuration objects and constants, so that repeated settings do not drift between events.
4. As an Event DSL author, I want to define a function with a named options object, so that each event can supply its own rewards, references, text, and settings.
5. As an Event DSL author, I want to declare the function's input and output types, so that invalid arguments are caught before project data is generated.
6. As an Event DSL author, I want to use either a named function declaration or a const arrow function, so that the supported authoring styles remain familiar.
7. As an Event DSL author, I want to call the same function with different arguments, so that event-specific values remain independent.
8. As an Event DSL author, I want to call a helper defined in the same file, so that I can organize a single event file before extracting a module.
9. As an Event DSL author, I want a shared function to compose another shared function, so that reusable sequences can be built from smaller pieces.
10. As an Event DSL author, I want to combine shared fragments with event-specific commands in a deliberate order, so that reuse preserves the intended event sequence.
11. As an Event DSL author, I want to reuse commands inside branches, choices, and loops, so that composition works inside Child Command Bodies.
12. As an Event DSL author, I want to reuse suitable command fragments across Map Events, Common Events, and Troop Events, so that source organization is independent of the event container.
13. As an Event DSL author, I want ordinary event-context validation to apply after composition, so that an invalid use of a fragment is still rejected or diagnosed normally.
14. As an Event DSL author, I want shared modules outside Definition Source Discovery patterns to be available through imports, so that helpers do not need to masquerade as event entry files.
15. As an Event DSL author, I want imported helper exports to remain separate from collected event declarations, so that importing a module does not silently add or duplicate project entries.
16. As an Event DSL author, I want to rename a named import locally, so that shared helper names can fit the vocabulary of the importing file.
17. As an Event DSL author, I want missing modules and exports to identify the failing import, so that I can repair module organization quickly.
18. As an Event DSL author, I want cyclic module dependencies and recursive helper calls to produce clear failures, so that compilation does not hang.
19. As an Event DSL author, I want unsupported function syntax to be reported explicitly, so that I understand the first version's authoring boundary.
20. As an Event DSL author, I want errors in a shared function to identify its source and calling event, so that I can find both the faulty definition and the affected use.
21. As an Event DSL author, I want different uses of a shared fragment to retain their own diagnostic context, so that one caller does not hide another caller's problem.
22. As an Event DSL author, I want Compile Check to validate the complete shared dependency graph without publishing generated data, so that I can check a refactor safely.
23. As an Event DSL author, I want changes to direct and transitive shared dependencies to invalidate old generated data, so that Diff and Push cannot use stale commands.
24. As an Event DSL author, I want deleted, renamed, or differently resolved dependencies to invalidate old generated data, so that module restructuring cannot leave misleading freshness results.
25. As an Event DSL author, I want compilation to reject observed changes to its inputs before publication, so that generated data and its recorded basis describe the same source state.
26. As an Event DSL author, I want a fresh compilation after a shared change to update all affected event outputs, so that a single source edit has a consistent result.
27. As an Event DSL author, I want existing Common Event calls and Script Command Gate behavior to keep their meaning, so that authoring reuse does not change runtime execution rules.
28. As an Event DSL author, I want Decompile to recognize existing event identities even when their sources use supported shared modules, so that adopting reuse does not break takeover and collision checks.
29. As an Event DSL author, I want unchanged decompiled event data to remain round-trippable, so that shared authoring support does not weaken Event Semantic Round Trip.
30. As an Event DSL author, I want working examples and an explicit supported-syntax description, so that I can use the feature without guessing which TypeScript constructs are accepted.

## Implementation Decisions

1. **编译时组合。** 共享模块和函数是编写阶段的能力，函数调用先求值得到普通 DSL 值，再由现有编译器生成 Raw Event Commands。不增加新的运行时命令，不自动生成 Common Event，不改变项目中的事件调用关系。参数只在编译时传入；运行时条件继续使用已有 DSL Command 表达。

2. **保持受限求值。** 第一版在现有受限源码加载层增加模块和函数语义，不通过动态 import、宿主执行、转译后执行或任意 JavaScript 求值来运行作者模块。模块解析、求值和源码来源应形成内部一致边界，供正常编译和相关身份分析复用；不新增作者必须调用的注册 API、宏 API、插件加载器或独立预处理步骤。

3. **本地模块范围。** 新增值导入只支持相对静态具名导入及导入别名，目标为配置的 sourceRoot 内的 TypeScript 源文件，实际路径解析后仍须位于该源目录内。模块说明符遵循现有 ESM/NodeNext 约定，包括 JavaScript 扩展名说明符对应 TypeScript 源文件的常规解析；类型检查与值求值必须指向同一个实现。第一版不增加扩展名猜测、目录入口约定、路径别名或 Workspace 外部值模块。既有 DSL 包的导入方式和外部类型导入能力继续保留。

4. **Discovery 与依赖职责分开。** Definition Source Discovery 继续选择声明入口；共享依赖无需匹配入口 include 规则，入口 exclude 也不成为共享依赖白名单。仅导入模块不把其导出递归收集为 DSL-Owned Project Data。只有被 Discovery 选中的入口具名导出才进入既有声明收集；辅助值和函数不是 Event Definition。同一模块既被导入又被选为入口时，不因被不同调用者引用而重复收集其声明。工具隔离区不得通过导入或路径别名变成可求值的共享源。

5. **共享值及导出。** 支持具名导出的字面值、const 配置对象、DSL 引用值、单个 DSL Command 和命令数组，以及本版支持的函数。支持本地具名导出列表和别名；模块间可继续导入并组合。现有字面值、属性访问、对象及数组展开、类型注解、类型断言和 satisfies 行为应继续成立。第一版不增加默认导入、默认导出、模块间直接转导出、星号导出或本地模块 namespace 导入；已有 DSL namespace 导入不受此新增范围限制影响。

6. **函数输入与声明形式。** 支持具名函数声明，以及赋给 const 的箭头函数；两者都可在本地使用或具名导出。函数接受零个参数或一个具名选项对象参数，支持普通参数名后读取其属性，也支持一层具名对象属性解构及重命名。参数和返回值可使用普通 TypeScript 类型声明。第一版不支持参数默认值、rest 参数、嵌套解构或依赖 this 的函数。

7. **函数体的确定边界。** 支持箭头函数的表达式返回体，以及由零到多个 const 声明和一个末尾 return 组成的函数块。允许使用现有受限表达式、参数属性、模块常量、DSL helper 调用、其他受支持函数调用、对象与数组组合。函数调用使用独立局部作用域，遵循所支持语法的普通词法绑定规则；函数不能通过赋值改变参数、模块常量或其他调用结果。第一版不增加编写阶段的 if、三元表达式、循环、一般二元计算、模板插值、数组方法或其他宿主对象方法。需要此类计算的后续扩展另行立项。

8. **组合结果与现有声明边界。** 函数可以返回用于命令组合的常量、配置、引用值、单个 DSL Command 或命令数组。返回的数组不隐式展平，作者使用现有展开语法安排命令次序。完整 Event Definition 的工厂、批量事件生成及函数返回函数不在第一版内；事件仍由 Definition Source 显式声明 Entry Identity。既有允许的身份常量或对象展开可以引用受支持共享值，不能通过文件名、函数名或隐式分配推导身份。

9. **复用不改变值及容器语义。** 共享与内联写法产生相同 Native Saved Shape，包括命令顺序、Child Command Body 边界、保存值和原生终止记录。不同调用的参数和命令位置互不污染；编译过程或来源标记不能让某次调用改写其他事件的结果。共享片段在不同 Map Event Page、Common Event 或 Battle Event Page 中使用时，按各自最终上下文进行既有验证，不因为函数在其他文件声明而丢失上下文。

10. **完整且有限的依赖图。** 模块可传递导入其他受支持模块，允许多个入口共享依赖及菱形依赖。模块读取、解析和必要缓存以本次操作捕获的输入为依据，缓存不得跨操作掩盖文件变化。拒绝值模块的循环依赖及函数直接或间接递归，并报告可理解的模块或函数链。纯类型依赖继续遵循既有 TypeScript 检查规则，不因合法的类型循环引入新的运行时求值限制。

11. **类型检查与失败处理。** Compile 和 Compile Check 对入口及实际参与求值的传递共享模块执行类型检查，不能仅检查入口就忽略共享函数内部的错误。找不到模块、导出、绑定或不支持的语法时明确失败，不跳过导入、不返回空命令列表、不退回宿主执行。进入求值的模块应检查本版语法边界，不能以函数尚未调用为由让不支持的函数体悄悄通过正式编译；不相关、未被加载的普通共享文件不自动成为声明入口。

12. **错误定位和每次使用的来源。** 导入及语法问题定位到发生问题的模块、行和列。函数求值或 DSL 构造错误同时给出共享定义位置和调用位置，嵌套组合保留有用的调用链。后续事件、引用和素材验证仍报告事件 Entry Identity（已知时）及 DSL/native 路径，并关联能够可靠确定的共享定义与使用位置。同一个对象被多个事件或位置复用时，来源应按每次使用区分，不能只留下最后一次调用位置；未知位置不伪造行号。

13. **Compile Baseline 和 Generated Freshness。** 在现有编译输入捕获基础上纳入实际读取的直接及传递共享源码、必要解析观察和类型依赖，确保类型检查、求值、生成及基线记录使用一致输入。共享文件修改、删除、替换、重命名或解析目标变化必须使旧输出失效，即使入口文件没有变化；依赖源内容变化但输出巧合相同也不能继续沿用旧基线。实现相对集成版本更新 Compile Contract Version，使原有编译契约的产物不能被误判为当前。无关文件仍沿用既有解析观察政策，不额外承诺精确到符号的最小失效集。

14. **工作流检查点。** Compile/Check 发布或返回前继续重查捕获输入和发现集合；观察到共享输入变化时失败并要求重跑，不自动重试部分求值。Compile Check 不写 Generated Project Data 或建立新鲜度。普通 Compile 只发布通过校验的完整输出，失败后的状态沿用现有 publication 规则。Diff/Push 使用扩展后的 Compile Baseline 检查，拒绝旧产物；重新 Compile 后才允许进入既有 Diff/Push 流程。Project Drift、Script Command Gate、素材检查、同 Workspace 互斥及 Interrupted Push 的既有政策不因共享编写而改变。

15. **Decompile 的身份兼容。** 更新现有源码的 Entry Identity 分析，使合法的共享导入、函数声明及命令调用不会单独导致身份读取失败。身份来自受支持共享常量或对象字段时，按需要解析其依赖，捕获并重查相关输入；身份无法可靠确定仍须失败。保持 ADR 0014 的有限身份分析边界：不为识别身份而执行完整事件构造、校验不相关命令负载、打开 Script Command Gate 或借现有事件补齐候选引用。候选身份冲突仍拒绝，已有源码及 Snapshot 保持原保护；完整候选的隔离与一次发布保持不变。

16. **文档与架构一致性。** 更新公开使用说明、Sample Workspace 和 Agent Event Authoring Skill，提供常量共享、参数化宝箱或奖励片段、嵌套组合、错误及重新编译流程的可用示例。明确新增语法子集以及与 Common Event 的区别。ADR 0013 明确保留“不扩展普通值导入”，本规格有意将其扩展为受限本地值导入，实施时须补充相应架构决定并修订该边界，同时保留其输入一致性要求。ADR 0002 的源码加载描述应与当前受限模型及本版扩展核对、同步。保留 ADR 0001 的具名声明入口、ADR 0003 的 Compile/Push 分工、ADR 0004 的显式身份及 ADR 0012/0014 的保存状态和发布约束。

## Testing Decisions

测试入口已由用户于 2026-11-03 确认：以公开 Workspace 工作流为主，覆盖 Compile/Compile Check、Diff/Push 和 Decompile，并补少量构建后 CLI 验证。不为本功能新增专用测试 API。

- **主要验收接口。** 使用公开 Workspace API 配合真实临时 Workspace、源文件、共享模块和最小 MV Project Data。观察最终 Generated Project Data、Diff、Push 落盘结果、诊断，以及失败前后有关文件状态。优先复用现有 Windows sandbox 和工作流进程测试设施。
- **好测试的标准。** 从作者可见的输入和结果验证契约，不断言内部 AST、缓存命中次数、模块私有数据结构或调用顺序。关键输出使用独立预期 Raw Event Commands；同一案例可辅以内联与共享两种源码的等价比较，但不能仅让两条可能同时错误的产品路径互相证明。
- **受测模块范围。** 源码加载与类型检查通过 Compile/Check 验收；事件校验和命令编译通过生成数据验收；输入捕获和新鲜度通过 Diff/Push 验收；身份分析和源发布通过 Decompile 验收；诊断来源通过公开错误或警告验收。只有高层案例无法清楚定位的有限语法边界，才补已有加载器入口的定向测试。
- **CLI 验证范围。** 构建后 CLI 至少完成一个跨文件参数化组合成功案例和一个共享依赖变化导致旧产物拒绝的失败案例，核对退出码、可读诊断和有关输出。主要功能矩阵留在公开 Workspace API，不把全部矩阵再复制到 CLI。
- **既有先例。** 复用当前 definition loading/discovery、compile inputs/freshness、decompile publication、Common/Map/Troop Workspace 和素材来源诊断的测试组织方式；不把每个已支持 MV 命令族重新做一次完整原生游戏验收作为本功能前置。

以下是第一版必须覆盖的外部行为，允许一个有独立预期的案例覆盖多项：

| 场景 | 必须观察到的结果 |
| --- | --- |
| 两个入口导入同一命令数组、配置和引用常量 | 入口无需扩大 Discovery；各事件生成正确内容，共享模块不额外生成项目条目。 |
| 参数化函数用于不同宝箱或奖励事件 | 至少两个不同参数集产生各自独立的预期命令；具名函数、箭头函数和选项对象读取/浅解构均有覆盖。 |
| 本地函数、跨模块函数组合和菱形依赖 | 命令及展开顺序正确；不因依赖共享重复收集 Event Definition。 |
| 同一共享片段多次使用及放入 Child Command Body | 原生顺序、缩进、分支/循环边界、终止记录与独立预期一致；不发生跨调用参数污染。 |
| Map、Common、Troop 使用及上下文错误 | 三类容器有代表性成功使用；一个上下文不合法的共享片段仍产生相应验证结果。 |
| 类型或语法失败 | 缺失导出、参数类型错误、共享模块内部类型错误、不支持的函数体或导入形式明确失败，定位到真实源码；覆盖未调用但已加载的非法函数体。 |
| 解析边界 | 合法相对说明符和 Windows 含空格/中文路径可用；缺失文件、超出 sourceRoot 的真实目标、隔离区目标被明确拒绝。 |
| 循环和递归 | 值模块循环、函数直接/间接递归得到有限失败及相关链；合法共享依赖及类型循环不误报。 |
| 来源诊断 | 覆盖共享函数内部构造错误、调用参数问题，以及组合后引用或素材问题；两个调用者或同事件两个使用位置的来源不会互相覆盖，嵌套调用仍可追踪。 |
| 共享输入新鲜度 | 编译后只改直接依赖或传递依赖，旧输出失效，Diff/Push 拒绝；删除、重命名、替换和解析目标变化有代表性验证；重新编译后所有相关输出更新。 |
| 输入一致性和失败状态 | 使用现有可控工作流边界让共享输入在操作期间变化，Compile/Check 在既定检查点拒绝；Check 不改变 generated、manifest、Snapshot、Project Root 或源文件，不建立新鲜度。普通 Compile 的失败状态符合已有发布契约。 |
| Decompile 身份兼容 | 有共享导入/函数的现有源码能进行正确身份检查；共享常量决定身份时冲突仍拒绝，相关依赖变化仍被发现；不相关命令错误或关闭 Script Command Gate 不扩大成既有事件的完整校验。 |
| Decompile 原有保护 | 无法确定身份及候选冲突均保留原源码和 Snapshot，失败不发布部分候选；未修改的反编译源码仍满足 Event Semantic Round Trip。 |
| 旧行为与文档示例 | 现有内联 DSL、同文件 const 展开、DSL namespace、类型导入和 Common Event 调用继续工作；文档中的第一版示例能通过实际 Workspace 编译。 |

完成时执行与变更相关的类型、静态和测试检查，进行一次必要的构建及上述 CLI 验证。仅在新失败、代码变化或未解决风险要求时扩大或重复运行；本规格不要求额外的大型验收归档体系。

## Out of Scope

- 任意 TypeScript/JavaScript 模块执行、Node 内置模块值导入、第三方包值导入、网络加载、文件读取等宿主能力。
- 编写阶段的通用控制流、算术与字符串计算、数组回调方法、异步函数、生成器、类、可变状态、高阶函数以及递归。已有 DSL 中的运行时条件分支和循环不受影响。
- 源码目录外共享包、跨 Workspace 包管理、动态导入、模块间转导出、路径别名、默认导出和完整 ECMAScript 模块兼容性。
- 完整事件工厂、自动事件批量生成、自动 ID 分配、新的模块注册配置、专用 include/macro DSL，以及自动把共享函数转换为 Common Event。
- 游戏运行时的函数传参机制、Common Event 参数协议、MV 插件或事件脚本执行机制的扩展。
- 自动识别并抽取现有重复代码，或从 MV 数据反推原有共享模块、函数边界和调用参数。Decompile 继续生成可读的展开事件源码。
- 符号级最小增量编译、跨命令持久缓存、watch 模式、IDE 导航或独立调试器。
- 重新制定资产检查、原生事件保存形态、同步恢复或跨 Workspace 协调政策。

## Further Notes

- **授权与完成边界。** 用户选择了上一轮推荐的“本地共享模块＋参数化命令函数＋命令组合”第一版，并确认本规格的工作流测试入口。本轮交付规格；ready-for-agent 表示可进入实施，不表示功能已实现或测试已通过。
- **范围收敛。** 上一轮尚未选择完整 TypeScript 执行或有限求值的具体路线。本规格按第一版建议收敛为现有受限求值的纯组合子集，并明确语法边界；后续不能把支持任意函数体当成已承诺能力。
- **领域术语。** Event Definition、Definition Source、Definition Source Discovery、DSL Command、Child Command Body、Entry Identity、Compile Baseline 和 Generated Freshness 使用现有 GLOSSARY 的含义。“共享编写模块”和“参数化命令函数”在本文描述新增源码组织能力，不是新的事件类型或 Common Event 的别名；实施时同步领域文档中的必要定义。
- **已知集成点。** 当前正常源码加载和 Decompile 身份分析分别限制普通值导入；当前诊断来源有按对象记录位置的实现，需确保共享值复用时仍能表达每次使用的来源。现有输入捕获已经记录文件与解析观察，应优先扩展而非另建独立新鲜度系统。
- **架构冲突处理。** ADR 0013 的普通值导入限制是本功能需要明确扩展的旧边界，不能只修改加载器而保留相反文档和测试。ADR 0002 的 tsx 加载表述与当前实际受限求值也需要对齐。其余引用 ADR 的工作流和保存语义继续适用；本轮没有直接改写已接受 ADR。
- **依据。** [领域术语](../../GLOSSARY.md)、[ADR 0001](../../docs/adr/0001-schema-first-dsl-entry-model.md)、[ADR 0002](../../docs/adr/0002-technical-architecture-and-toolchain.md)、[ADR 0003](../../docs/adr/0003-workspace-compile-push-model.md)、[ADR 0004](../../docs/adr/0004-explicit-mv-id-entry-identity.md)、[ADR 0012](../../docs/adr/0012-event-saved-state-roundtrip-boundary.md)、[ADR 0013](../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md)、[ADR 0014](../../docs/adr/0014-publish-decompiled-source-as-a-complete-directory.md)。
- **实现与测试先例。** [源码加载](../../packages/rpgmaker-event-dsl/src/workspace/definitions.ts)、[身份分析](../../packages/rpgmaker-event-dsl/src/workspace/definition-identities.ts)、[输入捕获](../../packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts)、[现有来源关联](../../packages/rpgmaker-event-dsl/src/workspace/asset-provenance.ts)、[加载和 Discovery 测试](../../packages/rpgmaker-event-dsl/test/definitions.test.ts)、[编译输入测试](../../packages/rpgmaker-event-dsl/test/compile-inputs.test.ts)、[Decompile 发布测试](../../packages/rpgmaker-event-dsl/test/decompile-publication.test.ts)。这些是当前定位信息，不是固定实现文件边界。
