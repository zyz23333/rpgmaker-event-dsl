# Ticket28 Conditional：开发批次验收

2026-10-20 后续修订：按用户要求，历史验收审计命令、实现及其8个专用测试已删除。下文保留当时的执行记录和结论，其中的历史审计命令与测试文件已不再提供；产品行为与产品校验器测试继续保留。

按规格顶部的 **2026-10-20 用户执行修订**，本票完成产品实现与受影响自动化后关闭；全量、构建和原生最终回归由48–55继续承担。本文不将尚未执行的原生准备记为通过。

## 源码与实现

最终工作分支 `codex/mv-ticket-28-final` 已合入实际集成 `08d85b4b101cfd38b797aa383a5946e7ff9083c1`，含批次修订 `218f1827`。Conditional产品来自 `bf570fdd3141260b832dd16939200cc5cfcd5dd6`，文档格式修复 `e0d26bb68baa5dd2492d9e04aa0dc6d1cb815762`；证据单测优化提交为 `e2209fb5a85407315652ef9e584a4e1dcc2526db`。当前 Compile Contract Version 为 `mv-1.6.1/14`。

完整14条件、Actor7子型、then/else独立 Child Command Body、缺/空分支、marker、单槽Script/Gate、数值符号、已知raw、严格输入、固定引用及运行上下文warning已实现。[DEV报告](conditional-dev-20261020.md)记录独立字面预期、实际Discovery/源码求值、三类完整carrier、真实源码修改及Push的范围。该报告中的待全量/逐阶段放行安排是当时历史状态，当前执行频次以上述用户修订及本文为准。

## 实际检查

Windows / Node22.23.0 / pnpm10.33.0 / Vitest4.1.9，沿用两worker和10秒单测期限。输出根为 `M:/Shuen/Codex/mv-events-implementation-20261020/ticket28-final/`；每个下列目录保留实际命令、执行版本/dirty状态、环境、stdout/stderr及退出状态的 `completed.json`。

| 输出目录 | 执行与实际结果 |
| --- | --- |
| `affected-unit-v1` | Conditional及受影响compiler/decompiler/graph/Choices/Loop：9文件359测试通过 |
| `affected-workspace-v1` | Conditional、Choices、Loop、command-boundary：4文件30测试通过 |
| `evidence-and-conditional-affected-v1` | `pnpm --filter rpgmaker-event-dsl exec vitest run test/mv-evidence-validation.test.ts test/mv-evidence.test.ts test/conditional-workspace.test.ts`：3文件15测试通过，含8个新小语料控制、真实当前索引、原Common源码求值/完整比较和4个Conditional Workspace用例 |
| `evidence-typecheck-v2` | package typecheck通过 |
| `evidence-lint-v2` | 四个受影响TypeScript文件lint通过 |
| `evidence-scoped-format-v3` | 五个受影响代码/配置文件格式通过 |

本轮受影响运行在merge `d060f93669064c9d0acee304c0d89d756bd16562`及receipt记载的改动上执行，随后按原字节提交为 `e2209fb5`。既有Conditional产品检查可复用，因为本轮未再改变产品源码；不因文档收尾重跑完整生命周期。早先格式失败、隔离首轮超时、明确selection/legacy red和类型注解失败均保留在各独立目录，最终通过不覆盖这些原记录。

### 旧全量失败仍是失败

`full-check-v1` 在干净 `e0d26bb6` 执行 `pnpm check`：类型、lint和198文件格式通过，测试为 **47文件通过/1文件失败，1,357测试通过/2次10秒超时**，退出1，测试总时长422.56秒。失败均位于 `mv-evidence.test.ts`：旧全历史索引检查与 `MV-S0-CE-001`。不能将该次全量称为通过。

原配置下的 `evidence-focused-v1`（3测试）、`validator-alone-v1`及 `ce001-alone-v1` 后来通过，仅表明全量与隔离执行的时序不同；没有证明原超时的具体成因。已有诊断输入和日志原地保留，不再追加历史payload克隆或profiling。本轮受影响通过是独立结果，不能倒改原全量结论；48负责最终集成全量与构建。

## 日常证据检查的有限优化

普通索引单测继续验证全部当前需求、README清单、来源段落、fixture哈希和test/review链接。结果选择使用canonical记录文件名中的run时间；legacy按 `completedAt`参与排序，所有legacy/异常名称始终完整校验。每个需求最新时间的所有并列记录都校验，完全不按passed筛选，选中canonical须与payload的requirementId/runId相符。

选中结果仍检查原schema、runId唯一性、捕获source fingerprint、fixture binding及passing difference。较早canonical payload不在日常单测中反复反序列化，完整原历史规则保留于显式 `pnpm --filter rpgmaker-event-dsl test:evidence:history` 入口。本轮用小临时语料确认all模式能发现被取代的损坏JSON；没有重新运行真实1.4GB历史审计。

8个小语料控制证明：最新损坏记录拒绝；旧canonical损坏由all发现；较晚failed不能被较早passed遮蔽；legacy时间和坏名称可检测；未知需求拒绝；选中名字身份和同刻记录完整校验；合法failed记录的结构可以通过但不代表需求通过；旧legacy仍完整校验。首轮目录隔离red为实际10秒超时，selection与legacy另有明确断言red→green。当前记录完整性与最终覆盖全部passed分开，后者由55审计。

既有requirements、fixtures和results未为此优化重写。新增8控制为test-support边界，不增加产品公开API，也不改变Conditional值域、引擎行为或测试期限。

## 最终专门票中的待执行项

| 责任票 | 明确尚待执行的工作 |
| --- | --- |
| 48 | 最终集成候选全量适用自动化、构建和适用built Windows基线；本轮没有新build/dist或built运行 |
| 49/51 | Conditional E2/E5的最终逆向契约/产品输出比较；已准备的独立73条件、5种body/464records及12个原字符串样本，尚未执行built比较 |
| 52 | Conditional控制流/上下文代表场景及**原完整17页、三回合R2输入**的产品/原生配对；简化Common guard和25的E355变体均不替代 |
| 53/54 | 按各票分配补齐Conditional R4/R7的运行选择、动态状态和脚本/数值代表场景，与52共同完成本票R3/R4/R7责任 |
| 55 | 最终需求状态、候选和适用复验审计；日常索引通过不代表完整支持已交付 |

现有静态准备保留在上述M输出根：`static-native-review-bindings-v1.json`绑定五个native准备工具；`conditional-scenarios-v1.cjs`列出七对准备：原Common14模式、直接Map/Troop、released/directions/markers补充、boat/ship/airship各一对、原完整R2。**七对均为准备，未执行游戏**。`e2e5-built-comparison-v2.mjs`修正Map/Troop warning的 `pages[0].` 路径，输入为 `conditional-e2e5-inputs-v1.json`；二者也是静态准备。

原R2失败保留：`C:/Users/Shuen/.codex/tmp/mv25-r2-normal-scene-product-pair-160eef49-292f-462b-bc42-b31e73d54a67/pair-result.json`，独立fixture SHA256 `b7559a8a9418c07d2fc0cb271c17f728f471c2779865a46dd46a93c91b8eb125`。原wrapper为 `C:/Users/Shuen/.codex/tmp/mv25-r2-normal-scene-product-pair.cjs`，SHA256 `867c0bd88e1c80aa8304484b5c4b23a145629d0dd3b3e3a8ca5f8c9585ba1477`；其native dependency另为 `mv-r2-normal-scene-scheduling-native.cjs`，SHA256 `98cd24dda9d15488a9d125c3b3ffa50a71e2247602317bbcfde609110b9c7ddd`。准备回调要求全部15carrier与原fixture相同，保留原E122/E111/E121 guard和非空marker。最终52继续使用此原输入，不把准备或旧失败冒称为本轮实测。
