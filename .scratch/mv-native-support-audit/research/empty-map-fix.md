# 原生空地图修复与定向验证

日期：2026-10-20。修改基线：`298a407535debfdd75afc70d03f0ff49a546e972`；当前未提交改动，编译契约从 `mv-1.6.1/23` 升为 `/24`。用户在独立调研确认反例后要求修复；本记录补充[修复前调查](mv-native-support-audit.md)，原始失败记录保持不变。

后续验证与测试清理（2026-10-20）：用户随后要求全量自动化，并明确不运行原生游戏。类型、lint、300文件格式、构建及22文件551项构建入口测试通过；源码全量2154项通过、2项失败，分别为下文的历史索引问题与 `MV-S6-SCREEN-002` 的30000ms超时。Screen在相同断言和时限内单独复跑通过，耗时28.616秒，原全量仍记为失败，超时根因未确定。完整日志保存在忽略的 `test-results/empty-map-full-validation-20261020075327/`。用户之后要求移除历史验收审计，相关默认检查、手动命令、实现及8项专用测试均已删除；产品行为与产品校验器测试保留。清理后受影响5文件153项测试、类型、定向lint、格式和 `git diff --check` 全部通过，没有再次运行全量或原生游戏。下文保留初次定向验证及当时失败的原意。

## 修复结果

原生新地图的 `events: []` 现在可以完成 Decompile → Check → Compile → Diff → Push，保持空数组。`[null]`、全 null 数组、有事件且带尾部 null 的数组各自保留保存形状；外部 Map 字段不变。新增事件按显式 ID 扩展数组，删除最后事件保留长度与 null 槽，Destructive Push 许可仍生效。非数组、非空数组的非法零槽、非法事件记录继续被拒绝。

根因是读取端要求数组非空，生成端又强制至少一个元素；两处都已修正，未增加数组归一化。相关代码为 [native.ts](../../../packages/rpgmaker-event-dsl/src/map-event/native.ts)、[materialization.ts](../../../packages/rpgmaker-event-dsl/src/project-data/materialization.ts)。按 ADR0013 同步更新 Compile Contract Version；旧 `/23` 输出在普通 Compile 前仍过期，Check 不会将其更新为新输出。

原 `MV-S5-MAP-011` 错把正常空地图当作非法输入，现改为四种保存数组的混合工程完整往返。当前需求行与清单已同步修正，历史结果不改写、不重新解释为本次通过。ADR0012 补明原生空载体契约；没有修改事件页非空、事件 ID 或其他容器规则。

## 实际验证

环境：Windows / Node **22.23.0** / Vitest **4.1.9**，原有 2 workers。执行目录为 `packages/rpgmaker-event-dsl`；仅运行受影响项，没有运行全量测试、编辑器 UI 或实际游戏。

- 回归红：`node node_modules/vitest/vitest.mjs run test/map-event-workspace.test.ts -t 'MV-S5-MAP-011'`。修改产品前实际失败为 `decompile error map:2: MV-MAP-EVENT-SHAPE`；原始记录在 `C:/Users/Shuen/.codex/tmp/mv-empty-map-fix-20261020/evidence/MV-S5-MAP-011-2026-10-20T07-37-15-070Z-447713f7-e7be-4524-8f1b-0d96c50e9d48.json`。修复后通过。中间一次断言误用了短 Diff 的 `No changes` 文本，已修正为完整 Diff 的 `Affected Project Data Files: - none`；相关失败保留在同目录 `07-37-36` 记录中。
- 源码：`node node_modules/vitest/vitest.mjs run test/map-event-workspace.test.ts test/final-review-workspace.test.ts -t 'MV-S5-MAP-011|adds, removes and re-adds|late Map with a malformed|non-array Map events|explicit old /23|high-ID entry|malformed late native page'`，**9 passed / 78 skipped**。包括四种数组往返、新增 ID3/删除/再添加 ID1、原有 ID1001 删除、完整失败状态、旧契约过期。测试准备阶段曾错误预期非数组能先通过 Clone；实际 Clone 已拒绝，现分别在正确操作边界断言，产品未为此放宽。
- `tsc -p tsconfig.json --noEmit`、五个改动 TypeScript 文件的 `oxlint`、七个产品/ADR/测试文件的 `oxfmt --check`、`git diff --check` 全部通过。构建 `tsdown` **成功一次**，15 个文件；构建后未再修改产品源码。
- 构建产物：设置 `MV_CLI_ENTRY=built`，同样选择上述 9 项并额外检查验收索引。结果为 **9 passed / 1 failed / 80 skipped**；9 项产品测试全部通过，索引失败单独见下文。新增执行结果保留在 `C:/Users/Shuen/.codex/tmp/mv-empty-map-fix-20261020/evidence/`；本轮没有复制完整源码或历史结果。
- 收尾增强两个非法数组用例，确保在已有 authored source 和 generated output 的情况下仍保持完整失败状态；`-t 'late Map with a malformed'` 在源码、构建入口分别 **2 passed / 78 skipped**。该测试增强后再次 typecheck 通过，产品源码和构建未变。
- 原反例重放：`node --import tsx ../../.scratch/mv-native-support-audit/probes/root/recheck-empty-map-fixed.mjs` **exit 0**。使用原调查的首方函数生成地图与首方 NewData 工程，源码、构建入口 **2/2** 完成完整流程。生成的 Map002 完整值相等，Diff 为 No changes，Project Root 与 Snapshot 全部数据文件的字节内容保持不变。[机器结果](../evidence/root-recheck-empty-map-fixed.json) 记录实际工作目录、输入哈希、三个改动源码哈希及 15 个构建文件哈希；[脚本](../probes/root/recheck-empty-map-fixed.mjs) 保留以便复验。

## 独立存在的验收索引失败

索引报告 `Fixture differs from captured source inputs`，定位到 `MV-R1-ROUTE-014-2026-10-20T03-50-22-407Z-38b99586-a68c-4c90-a547-3894df1d7dfb.json`。该历史结果声明的 `movement-route-cases.json` 夹具未出现在其 `source.files` 中，因此无法满足既有夹具绑定校验。

直接读取 HEAD 中的原始结果并复算相同判定，已确认历史结果与校验器均和修改前 HEAD 字节相同，且原记录也违反相同条件。[核对记录](../evidence/preexisting-index-failure.json) 保留基线与判定；没有篡改旧记录、放宽校验或将这项失败计为通过。本次没有对其他历史项继续作完整审计。

本次修复关闭了已确认的空地图阻断，未由此推导“所有原生事件与全部参数、编辑序列、游戏表现都已穷尽验证”。
