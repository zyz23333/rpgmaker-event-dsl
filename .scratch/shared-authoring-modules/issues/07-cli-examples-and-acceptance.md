# 07: 完成构建后 CLI、示例与使用指南验收

**What to build:** 作者可以照着公开示例完成共享值、参数化宝箱或奖励函数及嵌套组合，通过构建后的 CLI 编译并使用结果；共享源码改变后，CLI 拒绝旧产物，重新编译后正常继续。使用指南准确说明第一版语法和工作流边界，整份规格有对应完成证据。

Blocked by: 03, 04, 05, 06
Status: resolved

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 26, 27, 29, 30

- [x] 在包含所有前置票的实际集成版本上运行必要构建；构建后 CLI 可以编译一个包含共享常量、参数化奖励或宝箱函数及嵌套组合的真实 Workspace，验证退出码和独立预期数据。
- [x] 从同一示例完成正常 Compile Check、Compile、Diff 和 Push；核对项目落盘结果，证明文档中的作者流程可用，而不只验证包内加载器。
- [x] 构建后 CLI 至少覆盖一个仅修改共享函数或其传递依赖的失效案例：入口不变，旧产物被 Diff/Push 拒绝，诊断可读且拒绝前没有项目写入；重新 Compile 后相关事件输出更新并能正常继续。
- [x] 核对前置票对三类事件、Child Command Body、错误定位、依赖变动及 Decompile 的公开 API 验收在当前集成上仍成立；只对整合变化、失败或尚未解决的问题补跑相关用例，不把全部 API 矩阵复制成 CLI 测试。
- [x] 公开说明和 Sample Workspace 提供共享值、具名函数、箭头函数、选项对象、嵌套组合、错误定位与重新编译流程的可编译示例；示例中的依赖和项目引用完整可解析。
- [x] Agent Event Authoring Skill 使用与实现一致的第一版能力，帮助作者选择源码共享与 Common Event 调用，明确编译时参数与游戏运行时条件的区别。
- [x] 使用指南明确函数体、导入/导出和模块范围限制，不暗示支持任意 TypeScript 执行、自动事件工厂、批量 ID 分配或自动抽取重复逻辑；文档示例通过真实 Workspace 验证。
- [x] 同步必要的新领域概念，核对 ADR 0013 的值导入边界、ADR 0002 的实际加载模型，以及其他保留的身份、Compile/Push、保存状态和 Decompile 发布约定，与最终实现一致。
- [x] 核对 Compile Contract Version 相对于实际集成状态包含所有需要失效旧输出的变化；独立票不能仅因为选择了相同版本号就把不同契约当成一致。
- [x] 逐项核对父规格的 30 条 User Stories、16 条 Implementation Decisions 和验收场景，指出对应完成票及验证结果。前置票遗漏或最终集成失败必须修复并验证，不能以票已关闭代替功能验收。
- [x] 对既有内联 DSL、同文件 const、DSL namespace、类型导入、Common Event 调用及支持范围内 Event Semantic Round Trip 保留必要回归；运行与实际变更相关的类型、静态和测试检查。
- [x] 以简短记录说明当前版本、已执行验证和任何未完成项。所有第一版必需项通过后才完成本票；不新增大型验收归档制度，也不把未执行的原生游戏验收写成通过。

本票负责集成后的可用交付，01–06 必须各自带有行为测试和完成证据。阻塞列表只记录直接前置票，01 和 02 已由这些依赖传递包含；本票不自动修改或关闭父规格。

## Outcome and verification

2026-11-03：从实际集成 `559622caa0c51560a439b504328355a5787d31e1`（01–06 全部合入）快进后实施。增加可复制的 `example/shared-authoring`，由当前仓库包提供依赖；实际构建 CLI 直接读取这些源文件，完成初始化、Clone、已有共享源码的 Decompile、Check、Compile、Diff、Push，以及仅修改传递模块后的拒绝与重编译。两份 README 保留前置票说明并链接完整示例；Agent Event Authoring Skill 增加按需参考；GLOSSARY 定义 Shared Authoring Module / Parameterized Command Function，ADR 0020 补全函数与有限身份分析约定。ADR 0002/0013 已由 01 修订，与最终实现一致；ADR 0001/0003/0004/0012/0014 的声明、身份、同步及保存边界保持。

验收发现并修复普通词法绑定遗漏：名为 `undefined` 的参数、const 或导入绑定应优先于全局 undefined。公开 Compile 和 Decompile 测试分别先观察到失败，再修复正常求值/静态调用分析及惰性模块身份查找；同时验证真实全局 undefined、已知 DSL helper 别名、const 初始化前读取和不相关命令不求值。Compile Contract Version 从实际集成 `/42` 增至 **`mv-1.6.1/43`**；01 的模块契约 `/41`、02 的函数契约 `/42` 均包含在祖先中，03/04/05/06 未引入另一份未协调的 Compile 契约。旧 `/42` 与更旧/缺失版本均有公开 Freshness、Check、Diff/Push 拒绝回归。

验证环境为真实 Windows x64 / Node 22.19.0，通过显式 Node 22 执行 Corepack pnpm 10.33.0。必要构建成功，CLI 验证设置 `MV_CLI_ENTRY=built`；该套件也加入 Windows 构建测试列表。结果记录在下方，未执行真实 MV 编辑器或游戏验收。

### Evidence pointers

以下简称均指公开行为测试；前置票的运行结果见各票 Outcome/Comments。按本票修改范围重跑，未将全部 API 矩阵复制到 CLI。

| 证据 | 文件与具体范围 | 完成票 |
| --- | --- | --- |
| V | [shared-values-workspace.test.ts](../../../packages/rpgmaker-event-dsl/test/shared-values-workspace.test.ts)：两个入口、配置/引用/命令、别名、菱形依赖、Discovery、类型/导入错误、模块循环、真实路径与隔离区 | [01](01-shared-values-and-command-fragments.md) |
| A | [author-functions-workspace.test.ts](../../../packages/rpgmaker-event-dsl/test/author-functions-workspace.test.ts)：不同奖励参数、本地/跨模块调用、README 源码、类型/语法、未调用函数、词法作用域、递归、工厂拒绝及 Script Command Gate | [02](02-parameterized-command-functions.md)、07 |
| C | [shared-event-containers.test.ts](../../../packages/rpgmaker-event-dsl/test/shared-event-containers.test.ts)：三类容器、不同 Child Command Body 深度/终止形态、上下文警告、引用与 Gate | [03](03-event-containers-and-child-bodies.md) |
| F | [shared-dependency-workflow.test.ts](../../../packages/rpgmaker-event-dsl/test/shared-dependency-workflow.test.ts)：依赖修改/删除/重命名/替换/解析变更、过程变动、Check 只读、发布失败及同步/旧契约保护 | [04](04-shared-dependency-workflow-protection.md)、07 |
| D | [shared-call-diagnostics.test.ts](../../../packages/rpgmaker-event-dsl/test/shared-call-diagnostics.test.ts)：构造/类型/导入/引用/素材与上下文诊断、同事件/跨事件逐次来源、嵌套链及原生值 | [05](05-shared-call-diagnostics.md) |
| I | [decompile-shared-identities.test.ts](../../../packages/rpgmaker-event-dsl/test/decompile-shared-identities.test.ts)：有限身份读取、共享身份冲突/不确定值、输入变化、关闭 Gate、候选独立性和独立预期保存状态 | [06](06-decompile-shared-source-identity.md)、07 |
| B | [shared-authoring-cli.test.ts](../../../packages/rpgmaker-event-dsl/test/shared-authoring-cli.test.ts)：真实 Sample Workspace，独立预期命令，CLI 退出码，传递依赖失效/重编译/落盘，文档两种错误示例 | 07 |
| R | [definitions.test.ts](../../../packages/rpgmaker-event-dsl/test/definitions.test.ts)、[compile-inputs.test.ts](../../../packages/rpgmaker-event-dsl/test/compile-inputs.test.ts)、[decompile-publication.test.ts](../../../packages/rpgmaker-event-dsl/test/decompile-publication.test.ts) 与 01–06 已记录的相关回归；A 也含 DSL namespace，V 含类型循环和 Common Event 调用 | 01–06、07 |

### User Stories — 30/30

| Story | 对应完成证据 |
| --- | --- |
| 1 | V：共享命令数组 |
| 2 | V：两个 Definition Source 使用同一数组 |
| 3 | V：共享设置、引用与常量；B：共享 eventSettings |
| 4 | A、B：具名奖励选项对象 |
| 5 | A、D：输入/返回类型及共享实现类型错误 |
| 6 | A、B：具名声明与 const 箭头 |
| 7 | A、C、B：25/90 等不同参数独立保存 |
| 8 | A：同文件本地 helper 与词法作用域 |
| 9 | A、D、B：跨模块和嵌套函数调用 |
| 10 | A、C：显式展开与命令顺序 |
| 11 | C：条件、选项/取消与循环 Child Command Body |
| 12 | C：Map / Common / Troop |
| 13 | C、D：最终调用上下文警告和验证 |
| 14 | V：非 Discovery 依赖与入口 exclude 分离 |
| 15 | V：辅助导出不收集，菱形/入口重合不重复 |
| 16 | V、A、B：具名导入别名 |
| 17 | V、D：缺失模块/导出的真实位置 |
| 18 | V：模块循环；A：直接/间接递归链 |
| 19 | A：完整函数语法拒绝矩阵，含未调用函数 |
| 20 | D、B：共享构造失败的定义和调用位置 |
| 21 | D：同对象跨事件及同事件多次使用 |
| 22 | F、B：Check 读取完整依赖但不发布/刷新基线 |
| 23 | V、F、B：直接与传递依赖改变使 Diff/Push 失效 |
| 24 | F：删除、重命名、替换、junction 与解析观察改变 |
| 25 | F：输入检查边界变化与发布失败；I：身份依赖复查 |
| 26 | A、F、B：重新 Compile 后所有使用事件更新并 Push |
| 27 | A、C、V：Common Event 调用、正式/raw Script Command Gate |
| 28 | I：有限身份、冲突、输入变动与不相关错误隔离 |
| 29 | I、R：未修改 Decompiled Source 的独立预期保存状态和发布保护 |
| 30 | A：提取真实 README 代码编译；B：完整 Sample Workspace 与错误示例；A：直接提取独立 Skill 示例编译 |

### Implementation Decisions — 16/16

| Decision | 对应完成证据 |
| --- | --- |
| 1 编译时组合 | A/C/B 的独立 Raw Event Commands；V 的既有 Common Event DSL Command |
| 2 受限求值 | V/A 的宿主方法拒绝、未调用体检查与 Gate；无宿主执行入口 |
| 3 本地模块范围 | V 的 `.js`→`.ts`、中文/空格路径、真实越界及隔离区拒绝 |
| 4 Discovery/依赖分离 | V 的两个入口、菱形及被发现依赖的声明计数 |
| 5 共享值及导出 | V 的值/引用/数组/别名/类型断言、非法导入导出拒绝；A 的 DSL namespace |
| 6 函数输入/形式 | A/B 的具名/箭头、属性/浅解构；A 的默认/rest/高阶等拒绝 |
| 7 函数体/词法 | A 的完整语法矩阵、独立 locals、TDZ；07 新增 undefined RED→GREEN |
| 8 结果/声明边界 | A 的工厂/函数返回拒绝与数组不隐式展平；I 区分 Common Event 命令/引用 |
| 9 值/容器语义 | C 的独立保存顺序、缩进、结束标记及上下文；D 的 -0/undefined 保存 |
| 10 有限依赖图 | V 的菱形、值循环、类型循环；A 的递归链；F 的跨操作变动 |
| 11 类型/失败 | V/A/D 的共享类型错误、未知绑定、未调用非法体，不退回空数组或宿主 |
| 12 逐次来源 | D 的每次使用、嵌套链、可靠坐标、事件身份及 DSL/native 路径 |
| 13 Baseline/Freshness | F/B 的内容/解析变化与旧契约拒绝；最终 `/43` |
| 14 工作流检查点 | F/R 的 Check 只读、变化/发布失败、同步保护；B 的拒绝前不写项目 |
| 15 Decompile | I/R 的惰性身份、捕获/冲突/候选独立性/隔离与完整发布 |
| 16 文档/架构 | 两份 README、sample、Skill、GLOSSARY、ADR 0020；核对 ADR 0002/0013 修订与 0001/0003/0004/0012/0014 保留约定 |

### Acceptance scenarios — 14/14

| 父规格表中场景（原顺序） | 实际证据 |
| --- | --- |
| 两入口共享数组/配置/引用 | V 的两个入口与独立命令预期 |
| 参数化宝箱/奖励 | A/B 的不同参数、具名/箭头与选项访问 |
| 本地/跨模块/菱形组合 | A/V 的顺序与声明计数 |
| 重复片段与 Child Command Body | C 的独立 native 预期及结束标记 |
| 三类事件与上下文 | C/D 的成功容器和保留验证 |
| 类型/语法失败 | V/A/D；B 运行文档中的类型及范围错误 |
| 解析边界 | V/I 的正常及真实路径/隔离边界；Windows sandbox 路径包含中文/空格 |
| 循环/递归 | V/A 的有限失败链及合法类型循环 |
| 来源诊断 | D 的构造/参数/引用/素材、重复和嵌套来源 |
| 共享输入新鲜度 | F/A/B 的各种变动、拒绝和重新编译 |
| 输入一致性/失败状态 | F/R 的检查点与发布故障、完整状态比较 |
| Decompile 身份兼容 | I 的固定共享身份、相关变化、关闭 Gate 与无关错误 |
| Decompile 原保护 | I/R 的冲突/未知身份、完整候选、保存状态 round trip |
| 旧行为/文档示例 | R/A/V 的内联、const、namespace、类型和 Common Event 调用；A/B 的真实文档源码 |

以上映射对应已有测试行为及实际运行记录，不以票的 resolved 状态替代验收。本票必需项均已通过，Status 更新为 resolved；父规格由集成流程另行处理。

最终验证记录：

- Node 22 构建 `pnpm --filter rpgmaker-event-dsl build` 通过，产物目标 `node22`。
- `author-functions-workspace` + `decompile-shared-identities`：38/38 通过（含两条已复现 RED→GREEN 的 undefined 修复和 TDZ/全局回归）；随后新增的独立 Skill 文档源码定向测试 1/1 通过。
- `definitions` + `shared-values-workspace` + `shared-event-containers` + `shared-call-diagnostics`：4 文件、35/35 通过，核对本次词法查找改动影响的旧加载、共享值、容器、来源及保存行为。
- `shared-dependency-workflow` 的旧/缺失契约定向测试：1/1 通过，显式增加上一集成 `/42`；其余 6 项未无理由重跑，完整依赖/发布故障矩阵沿用 04 的 38 项联合验收及本次 B 的公开 CLI 结果。
- `MV_CLI_ENTRY=built` 下 `shared-authoring-cli`：1/1 通过；每个成功命令退出 0，stale Diff/Push 与两种文档错误退出 1，核对真实诊断、两个独立预期的保存列表、Project Root/产物保护及重新 Push 结果。最后一轮让 sample 源码在 Init/Decompile 前就存在，与文档步骤一致。
- 离线 frozen-lockfile 安装、包 typecheck、变更源/测试/sample 的 oxlint、格式检查与 `git diff --check` 通过。
- 交付前再次同步 `codex/shared-authoring-modules`：Already up to date，当前集成 `559622caa0c51560a439b504328355a5787d31e1` 是本分支祖先。无第一版未完成项；最终集成两轴评审由父流程执行，未把该后续评审或真实 MV 游戏运行写成通过。

## Comments

2026-11-03 — 最终 Standards/Spec 评审的两项独立 P2 已修复（两轴重复的模块 TDZ 计一次）。修复分支从实际集成 `cdbee50b76f36e4ef718765f37fa0f20fd6fd133` 快进后实施。

- Decompile 的函数调用及延迟字段保留其模块初始化边界；直接和传递共享身份在 const 初始化前读取时明确拒绝，原源码、Snapshot/元数据和项目数据保持不变，不发布候选目录。模块初始化后的本地/导入函数与箭头仍成功，无关命令仍不求值。公开直接/传递反例先复现错误发布，再通过修复；`decompile-shared-identities` 31/31 通过。
- 正常 Compile 对未调用函数的静态结果检查现在遍历数组及展开，拒绝嵌套的已知函数、DSL helper 和完整 Event Definition。公开 Check 反例先复现错误成功，再通过修复；原有合法命令数组、组合和调用限制保持通过。
- 因正常验证规则变化，Compile Contract Version 从 `/43` 更新为 `mv-1.6.1/44`。旧/缺失契约定向测试增加 `/43`，1/1 通过，确认 Check 不恢复旧产物新鲜度。
- 实际 Windows x64 / Node 22.19.0、Corepack pnpm 10.33.0：`author-functions-workspace`、`decompile-publication`、`definitions` 合计 60/60 通过；包 typecheck、变更 TypeScript 的 oxlint、格式与差异检查通过。构建后 CLI 的最终集成复验由父流程在合并后执行。
