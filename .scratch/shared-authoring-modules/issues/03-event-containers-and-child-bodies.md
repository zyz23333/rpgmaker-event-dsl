# 03: 在三类事件和嵌套命令体中复用共享逻辑

**What to build:** 作者能把同一共享片段或参数化命令函数用于 Map Event、Common Event、Troop Event，以及分支、选项和循环的 Child Command Body。编译结果保持正确 Native Saved Shape，验证按每个使用位置的事件上下文进行。

Blocked by: 02
Status: resolved

Parent: [跨事件的共享编写模块与参数化命令函数（第一版）](../shared-authoring-modules-spec.md)
User Stories: 7, 10, 11, 12, 13, 27

- [x] 为 Map Event Page、Common Event 和 Battle Event Page 分别提供一个真实 Workspace 成功案例，使用共享命令值或参数化函数生成内容，并核对独立预期的事件数据。
- [x] 在条件分支、选项分支和循环体中组合共享片段与事件独有命令；验证作者指定的次序、缩进、分支关闭记录、完整事件终止记录及相关 Body End Marker 保存状态。
- [x] 同一共享数组或命令对象在同事件两个位置、多个事件及不同嵌套深度使用时，各位置生成正确数据；不同参数调用不互相污染。仅比较保存结果，不把对象引用是否相同当作契约。
- [x] 共享与手工展开写法具有相同 Native Saved Shape；测试以独立预期为主，两种产品路径互相比对只作补充，不归一化保存值或删除必要原生记录。
- [x] 验证代表性的上下文不合法使用仍产生原有级别和含义的诊断；共享代码所在文件不替代调用事件的地图、战斗或角色上下文。
- [x] 共享片段中的既有 Common Event DSL Command、引用解析和受 Script Command Gate 约束的输入保持原有规则；不能因为从函数返回就绕过验证。
- [x] 通过公开 Compile/Check 验证嵌套组合，并对代表性成功结果完成 Diff/Push，确认写入的项目数据与生成结果一致；失败及 Check 路径保持既有只读和发布规则。
- [x] 修复该矩阵暴露的组合、上下文或保存形态问题，保留相关既有事件族回归；不把所有 MV 命令重新做完整原生游戏验收作为本票条件。
- [x] 完成受影响的类型、静态及行为检查；如修复改变类型、校验、默认或输出语义，按现有规则相对实际集成版本更新 Compile Contract Version。

本票验证和完善事件容器中的可用行为。诊断的逐次源码来源由 05 独立负责，不因此增加 05 对本票的阻塞关系；两票均须保留已经正确的事件身份和路径诊断。

## Outcome

2026-11-03：在 `test/shared-event-containers.test.ts` 增加 6 个公开 Workspace API 回归案例。当前集成的 01/02 已支持本票组合行为，本票没有发现需要修改产品实现的问题，也没有制造产品红→绿记录；逐个行为切片验证通过后才增加下一片。首次运行中修正了测试准备阶段重复声明反编译的空 Troop Event，以及一个上下文诊断的文本预期。

- Map Event、Common Event、Troop Event 复用同一命令对象/数组和不同奖励参数，核对独立 Native Saved Shape，包括 Comment continuation、Common Event DSL Command、完整页配置和 Troop 外部载体；真实 Diff/Push 写入结果与已核验生成结果一致。
- 条件分支、选项/取消分支和循环复用相同片段，核对独立原生命令顺序、不同嵌套深度、关闭记录、事件终止记录，以及显式缺失和默认存在的 Body End Marker；另有手工展开源码作补充对照。
- 同一共享函数返回的 Self Switch 条件和 Enemy Appear 仍按各调用事件上下文产生原有警告级别、事件身份、native 路径和含义；合法 Map Self Switch 与有实际隐藏成员的 Troop Enemy Appear 不被误诊。
- 返回的 Common Event 引用缺失仍失败；正式 Script Input 与可识别 raw 脚本记录都遵守 Script Command Gate，显式开启后保留预期记录。Check 和验证失败均检查源码、项目、配置及完整 Workspace Data State 的字节不变，Check 不建立 Generated Freshness。

验证环境：Windows / Node v22.19.0，经环境记录中的 Corepack pnpm 10.33.0 启动。

- `vitest run test/shared-event-containers.test.ts test/conditional-context.test.ts test/battle-context.test.ts test/choices.test.ts test/loop-body-shapes.test.ts test/troop-workflow.test.ts`：6 文件、130 测试通过；本票新增 6 项。
- 包 `typecheck`、新测试 `oxlint`、变更文件 `oxfmt --check` 和 `git diff --check` 通过。
- 交付前合并检查最新集成 `46fd3a2abbb0d931f282ea15358f2fe5511a92e4`：Already up to date，已确认祖先关系。本票只增加测试和结果记录，未改变类型、校验、默认或输出语义，Compile Contract Version 保持集成的 `mv-1.6.1/42`。

本票不声明新原生编辑器/游戏验收。逐次共享源码来源诊断仍由 05 负责，Decompile 共享身份兼容仍由 06 负责，构建后综合 CLI 验收仍由 07 负责。
