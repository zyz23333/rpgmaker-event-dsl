# 45/46 敌人与战斗控制批次交付

2026-10-20。按[用户执行修订](../complete-mv-events-implementation-spec.md#2026-10-20-用户执行修订按批次开发减少全量与证据开销)完成开发功能及受影响自动化。45/46 的开发工作可以关闭；最终编辑器逆向/产品比较及实际游戏运行继续归 49/50/52/53/54。未执行的最终场景没有记为通过。

## Candidate and scope

- 分支 `codex/mv-battle-batch`；工作树 `M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-battle-batch`。
- 共同实现提交 `3afae909`；合入实际集成 `2ce2ba3b4a364dc3770f953323707d843a4f53c7` 后的最终产品提交为 `dde334b3e8fedecf8408f3bf94e4c33c752a413d`。后续本报告、工单和当前证据整理不改产品。
- Compile Contract Version 为 `mv-1.6.1/18`，相对传入实际集成的 `/17` 递增一次，符合 ADR 0013。
- 传入索引 388 条加本批次 5 个稳定 ID，共 393 条。`MV-S6-BATTLE-001`–`003` 为实际 Workspace 自动化；`004`/`005` 为最终 E2/E4、R2/R4/R6 待执行责任。
- 45 拥有 E331/332/333/334/335/336/337/342，46 拥有 E301/339/340，共 11 类。

两票同时交付正式领域类型/helper、投影前原始输入检查、编译、正式反编译、已知 raw/native 严格参数检查、固定引用与动态上下文诊断，以及真实 Workspace Discovery/源码求值/Check/Compile/Diff/Push。没有通过 raw 填补已知正式模式。

Enemy HP/MP/TP 采用具名 constant/variable operand；HP 强制显式 `allowDeath`。HP/MP 常量 1..9999、TP 1..100。各家族分别限定 single 0..7 或 all −1；Appear/Transform/Animation 只接受 single。Animation 强制保存独立 `allEnemies` Boolean，开启全敌时仍保留原 single index。Force Action 的固定 Actor 使用 Actor reference，target 为 `lastTarget`/`random`/`index`，保留 0..7 而不按当前敌人数裁剪。Abort Battle 输入及原生参数均为空。

Battle 使用 fixed/variable/randomEncounter 模式；flags 默认固定 false，按它们严格要求或禁止 win/escape/lose，不能从分支推断 flags。每个结果体使用 Child Command Body，非空 absent、空 present、各层 marker 及嵌套所有权分别保留；raw 冲突和错误 branch 次序、缺失、重复、额外槽明确拒绝。即使 Troop 中运行会跳过 Battle Processing，其保存分支、脚本 Gate 和引用仍全部验证。

上下文 warning 保留 hidden 位置、缺失 Enemy 造成的运行成员过滤、合法空位置、Common 未知调用者、Map 残留 Troop、Battle/Force 跳过及 Abort 残留 aborting 状态。Animation 全敌覆盖当前执行目标时的空 single index 警告准确说明独立保存值。未知运行目标不会冒充缺失固定项目错误。

合并保留 Actor 新模型、Variable 的 Game Data 上下文及现有 Conditional/Choices 结构检查。删除双方已由命令族严格验证替代的旧 Actor/Enemy/Battler 检查函数；保留仍供其他家族使用的 operand 表达。文本批次的 E303 所有权移动由其后续独立合入负责。

公开 README、包 README、完整事件示例及分发编写指南已同步；新增 `skills/rpgmaker-event-authoring/references/enemies-and-battle.md`，没有旧 API 别名或迁移说明。

## Actual verification

环境均为 Windows、Node 22.23.0、pnpm 10.33.0；保留原 2 个 Vitest worker 和原 case 期限。运行器、确切命令、源码身份、环境、退出码及原始日志位于：

`M:/Shuen/Codex/mv-events-implementation-20261020/battle-batch-temp`

下列执行标签保留 `-execution.json`、`-completed.json` 及实际产生的 stdout 日志。`merged-scoped-lint-v1` 成功且 stdout 为空，未生成 `.log`；没有补写或声称存在该历史日志。入口为同目录 `run-focused-v1.ps1`；没有复制全部源码、构建或历史 payload。

| 执行标签 | 实际结果 |
| --- | --- |
| `expanded-public-boundaries-v1` | 3 文件、80/80；正式编写/编反编译、逐资源边界/模式/操作/selector、flags、Force 目标、数值负零、marker/结构和原始 descriptor 输入 |
| `migrated-regressions-v2` | 5 文件、90/90；旧 Events/Decompiler/Staged/Snapshot/Troop 调用与字面预期迁移 |
| `battle-workspace-v1` | 3 组中 001、003 通过；002 的源码求值器测试前提失败原样保留，见下文 |
| `battle-source-refusal-v2` | 002 修正为源码求值器支持的局部常量后通过；1 passed、2 名称过滤 skip |
| `public-workspace-types-v2` | 公开 API 正负类型契约及新增 Workspace 类型检查通过 |
| `merged-package-types-v2` | clean `dde334b3`、契约 18：包 TypeScript 通过 |
| `merged-affected-v1` | 同一 clean 产品：18 文件、663/663；本批次、真实 Workspace、DSL/Events/Decompiler/Staged/Boundary、Conditional/Choices、Actor/Variables 交叉影响及 Snapshot/Troop 回归 |
| `merged-scoped-lint-v1`、`merged-scoped-format-v1` | 同一产品的 33 个受影响 TS/示例/契约文件通过，无 lint warning |
| `merged-contract-freshness-v1` | 同一产品：`compile-inputs.test.ts -t MV-S4-INPUT-007:` 1 passed、7 名称过滤 skip；旧/缺失/不匹配契约仍不能授权 Diff/Push，Check 不建立 Freshness |
| `current-index-v1.json` | 393 个唯一 ID、49 个当前夹具文件、5 个本批次 ID；无缺失 source/test/review 或夹具哈希不符 |
| `current-result-schema-v2.json` | 当前需求 schema 和三份合并后通过记录的 schema/fixture 一致；004/005 仍待原生执行，无历史全量扫描 |

663 项包含此前快速用例和旧回归，存在重叠，未作为额外不重复覆盖数。没有逐批全量、build/built 或实际游戏执行声明。最终产品测试后仅整理证据和文档，已通过且不受影响的检查直接复用。

独立输入为版本化字面夹具 `packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/battle-command-cases.json`，27 条完整原生记录覆盖所有 11 个 owned code、三类 Troop 模式、Force 模式及混合 marker 的嵌套 Battle。该合成输入不是编辑器捕获。快速单元预期另外独立列出参数表等价类，避免把每个标量边界重复成完整 Workspace 生命周期。

实际 Workspace 001 通过真实发现和 `loadDefinitionFile` 求值三类 Event Definition；Check 保持全部业务状态，formal/raw Compile 与完整载体字面预期一致，随后真实改名、Diff 和 Push 保留 15 个标准数据文件及 Troop 外部 name/members/hidden/carrier 字段。002 覆盖 helper、局部 const、direct、known raw、固定 Actor 引用和嵌套不可达 Script Gate；003 在有效前缀后的原生异常数据上拒绝 Decompile。失败组均比较完整源码树、Discovery、Project、Snapshot、generated、manifest、config、descriptor 和 pending 状态。

最终产品上的三份 Workspace result 保留在本目录 `results/MV-S6-BATTLE-001-*`–`003-*`，源码提交均为 `dde334b3`。原始早期失败和通过保留在外部 M 目录，不覆盖历史结果。当前 ID/文件/夹具哈希及三份有效结果检查见同目录运行输出 `current-index-v1.json`；不重新解析全部历史 payload。

## Original failures and limits

`animation-saved-index-red-v1` 保留最初丢失全敌标志的反例；`enemy-input-domain-red-v1`、`battle-bodies-red-v1`、`force-action-red-v1`、`battle-context-red-v1` 分别保留旧范围、旧 body/目标模型和上下文缺口。每轮红之后的最小修复与绿均保留原始日志。初版 Battle malformed-header 的 `it.each` 把参数数组展开成单个 scalar；该测试前提已修正，后来执行使用完整 parameters 向量，未把原先五条误通过当作原生证明。

`initial-integrated-types-v1`、`current-callers-types-v1` 保留旧调用和字符串迁移语法问题；`migrated-regressions-v1` 保留旧 API 字面预期和零诊断断言的七项失败，随后迁移到明确错误/warning 检查。`public-workspace-types-v1` 保留格式化后类型负例注释未贴到实际报错属性的失败；移动注释后 v2 通过。`merged-package-types-v1` 保留 Actor 合并移除、但 Force 仍需的 resolver 类型 import 缺失，补入后 v2 通过。

`battle-workspace-v1` 的 002 在遇到 `Object.defineProperty` 时先被源码求值器拒绝为未知全局，未到达预定的原始对象校验。最终 Workspace 用实际支持的局部 const 额外字段验证投影前拒绝；descriptor/prototype/symbol/getter 反例仍在公共入口单元中验证。没有扩大源码求值器能力或放宽值域来取得通过。

`check-current-result-schema-v1.mts` 首次通过 pnpm filter 启动时，工作目录位于 package，故相对 `.scratch` 路径未找到。v2 固定到实际 worktree 后通过；这是轻量检查脚本的路径前提修正，未改产品或需求。

原始日志保留不等于每项历史失败均已做根因诊断；后来通过没有被记为曾执行编辑器 UI、游戏或最终全量。

## Final native work

| 最终票 | 本批次仍待执行的责任 |
| --- | --- |
| 48 | 最终集成候选的适用全量、build/built、混合三类事件和 Workspace 安全检查 |
| 49 | E2 Battle flags、胜逃败 bodies、缺/空/非空及各层 marker 的编辑器代码路径逆向与最终产品独立比较 |
| 50 | E4 Battle 固定默认与模式切换、项目初值、独立保存状态的逆向与最终产品比较 |
| 52 | R2 完整原始 17 页/三 turn Battle 场景、AND/全关、三 span 和后续调度、结果分支；不得以较小 guard 替代 |
| 53 | R4 Common 多上下文、hidden/缺失成员位置、Force 主体/技能 scope/last/random/0..7 以及运行无作用和异常后果 |
| 54 | R6 Enemy Animation 的单敌/全敌、独立 index 与实际图像/运行观察，含缺位置、hidden/死亡等适用状态 |

52/53 的 Battle 控制必须记录实际跳过、Force 调度、Abort 残留 aborting 和后续效果；静态 runtime 解释或 Node 仿写不能替代实际 MV1.6.1/NW.js。编辑器侧按已接受 REA 修订区分代码事实、有条件推导和 UI 捕获。`MV-S6-BATTLE-004`/`005` 仍未执行通过，最终 55 的完整支持结论继续依赖 49–54 完成。

## Independent merge review correction — 2026-10-20

独立 merger 对原 READY `f0dba9a1` 执行 architecture/command-boundary 得到 15 pass、1 fail；原始日志保留在 `M:/Shuen/Codex/mv-events-implementation-20261020/battle-batch-merger/cross-boundary-v1.log`。先前本批次的受影响检查没有覆盖 architecture；该原失败没有覆盖或重分类。

真实依赖环为 `validation/native-parameters` → Battle/Enemy `validation` → `dsl-command-inputs` → `command-structure` → `native-parameters`。本次将两族的纯原生参数 guard 原样移至各自的 `native-validation.ts`，native dispatcher 直接依赖它们；DSL 校验仍拥有原始对象与子命令遍历。Enemy 原生 guard 显式列出同一组 owned code，保留原来的参数数量、有限值域、错误代码、路径与诊断消息。没有放宽已知 raw/native 输入，也没有更改 Compile Contract Version 或原生输出。

完整示例的 `heroBattler` 改用固定 Actor reference，Battle Processing 改用具名 fixed Troop 模式。外部 `check-full-example-battle-v2.mts` 从真实完整示例 AST 提取这两处调用与四个原始依赖常量，经当前 `loadDefinitionFile` 执行实际类型检查和 helper 求值：原 `f0dba9a1` 提取输入同时因 actor/troop 旧 API 被拒绝，更新后的输入通过。此检查只覆盖这两处精确源码及其依赖，不声称整份跨家族示例已验收。v1 检查脚本因 pnpm filter 改变 cwd，在运行求值前失败；原脚本与日志保留，v2 固定真实 repo 并使用 Node 22.23.0。

同一外部 `battle-batch-temp` 下新增执行记录：`architecture-repair-cross-boundary-v1`（architecture、command-boundary、Enemy、Battle、context、common-native，6 文件、100/100）、`architecture-repair-types-v1`（包类型通过）、`architecture-repair-workspace-v1`（真实 Battle Workspace 3/3）及 `example-battle-v2/result.json`（上述示例精确提取输入通过）。`architecture-repair-scoped-lint-v1` 与 `architecture-repair-scoped-format-v1` 均通过全部六个受影响 TS 文件；lint stdout 为空且没有 `.log`，execution/completed 元数据保留退出码 0。原架构测试未改，2 worker 与原期限保留。没有 full/build/built/native 执行声明，最终 48–55 责任保持不变。

## Final actual integration synchronization

补修产品提交 `4cd941ad` 后先合实际 Map/Inventory 集成 `a53b84979a49175a3132bf37031ec71a8920125d`，再合实际 Text 集成 `8cec365e809d5d2ddabe0befd6557b500a74d384`；最终受测产品为 `d84e523a`。本段之后的交付提交只更新报告。

最终保留全部 433 个实际 Text incoming requirement 对象并追加本批次原有五个稳定 ID，共 438 条；没有覆盖任何旧 requirement 或 result。按 ADR 0013，实际 incoming 的 contract20 加入本批次的新 Enemy/Battle 语义后统一为 `mv-1.6.1/21`。保留 Shop 的 ordered goods/purchaseOnly、独立 shop-native/shop-validation，及 Text 的 E303 Actor 所有权、Choices/native-message 拆分与明确的消息保存字段。完整示例组合新的 Battle result bodies 与 Text 必填 face/background/position；本批次测试、README 和敌人/战斗编写指南中的 comment 例子同步到 `{ lines }`。

Map 合并后的 `map-incoming-interactions-v1` 通过 9 文件、117/117，包含 architecture、公共边界、Enemy/Battle/context、Decompile/Snapshot 和真实 Battle Workspace。`map-incoming-types-v1` 发现自动合并重复导入 ConstantOperand/VariableOperand；去重后 v2 通过。scoped lint v1 的两个旧 operand import warning 在移除无调用 import 后 v2 通过；保留仍有独立用途的 export。该清理不改变运行语义；最终 types/static 再次验证。

最终 Text 同步产品的 `text-incoming-interactions-v1` 通过 8 文件、112/112（包含原 architecture 和真实 Battle Workspace 3/3）；`text-incoming-types-v1` 通过。`example-battle-evaluation-v3.log` / `example-battle-v3/result.json` 再次验证当前完整示例的两处精确调用及依赖常量通过实际源码类型检查/求值。`final-battle-freshness-v1` 通过目标 1 项、名称过滤 skip7，保留原期限，确认旧契约输出不授权 Diff/Push。`final-text-sync-scoped-lint-v1` 和 `final-text-sync-scoped-format-v1` 通过相对实际 incoming 的全部 35 个 TS 文件；lint stdout 为空且无 `.log`，完成元数据记录 exit0。

上述记录均在原 M 外部日志目录，含真实执行命令、源码身份和退出码；未追加 full/build/built/native 或最终 48–55 通过声明。独立 merger 已复核原架构失败与补修，最终 whole-READY 仍由其接入实际集成。
