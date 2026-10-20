# 37–40 画面、图片、音频与系统场景批次交付

2026-10-20。按[用户执行修订](../complete-mv-events-implementation-spec.md#2026-10-20-用户执行修订按批次开发减少全量与证据开销)交付功能及受影响自动化；37–40 可据此关闭开发工作。全量与构建归 48，最终逆向/产品比较及实际游戏观察仍归 49–54，未执行项没有计为通过。

## 候选与范围

- 分支 `codex/mv-presentation-batch`，工作树 `M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-40`。
- 批次共同实现提交 `4c6e3385c037c6d19a8f9d4617650b029d47e0a1`；合入实际 Conditional 集成 `6dfa75eb96cc089bb00d85012c643ec9af2cdad7` 后，最终产品提交 `8e51e031`。本报告及工单关闭只改文档。
- 编译契约为 `mv-1.6.1/15`，按 ADR 0013 相对实际集成的 `/14` 递增一次；不将两个并行 `/14` 当作同一有效契约。
- 当前索引为传入 332 条加本批次 42 条，共 374 个唯一稳定 ID。本批次为 Screen 4、Picture 9、Audio 5、System/Scenes 24；其中 E4/R6 文档要求仍明确待最终执行。
- 35 类主要指令：37 的 E221/222/223/224/225/230/236/261，38 的 E231–235，39 的 E132/133/139/140/241/242/243/244/245/246/249/250/251，40 的 E134–138/351–354。

四票均交付正式 helper、完整领域输入、编译、正式反编译、已知 raw/native 验证及实际 Workspace Discovery/求值/Check/Compile/Diff/Push。保留完整载体、非激活保存值、None、数值负零及失败后的完整业务文件状态。独立预期来自版本化字面夹具，不由待测编译器生成。

共享 Tone/Color 统一为具名四字段，移除公开 tuple 联合；Screen、Picture 和 Window 保留各自范围及数字负零。`imageAsset`、`movieAsset`、`audioAsset` 保留读取/投影前原始输入形状检查；另在已有 Screen Workspace 失败生命周期中加入 Movie 的局部 const 额外字段用例。Encounter 只发布 `changeEncounter({ enabled })`；系统音频 helper 属于 Audio 模块。

Conditional 合并保留新的 Child Command Body、上下文和原生参数校验；同时保留 Picture/Audio/System 的各自校验、Timer 的 saved-slot 提前返回、Weather 战斗 warning、Choices 越界 warning 及完整已知 raw 诊断位置。冲突调用和反编译字面预期统一到具名 `wait({ frames })`。证据 helper 与传入 `6dfa75eb` 的文件完全一致，保留默认 latest、显式 all 的优化；未回退为重复扫描全部历史。

## 实际验证

所有批次执行均为 Windows、Node 22.23.0、pnpm 10.33.0，保留原两个 Vitest worker 和原 case 期限。运行器与原始执行记录在：

`M:/Shuen/Codex/mv-events-implementation-20261020/presentation-batch-temp`

每个下列标签均有 `-execution.json`、`-completed.json` 和 `.log`，包含确切命令、版本、Git 身份及退出码。执行入口为该目录的 `run-focused-v1.ps1`；没有复制完整源码或历史 payload。

| 执行标签 | 实际结果及输入身份 |
| --- | --- |
| `batch-affected-unit-v1` | `4c6e3385` clean：11 文件、521/521；四族、DSL/Events/Decompiler/Boundary、Movement 与 Choices 受影响单元检查 |
| `batch-affected-workspace-v1` | 同一 clean 提交：4 文件、84/84；Screen/Picture/Audio/System 的真实 Workspace，包括原 Movie 输入、失败状态和实际 Push |
| `shared-tone-types-green-v1` | 提交 `4c6e3385` 前同一产品字节的包 TypeScript 通过；两个公开共享类型负例确认 tuple 不再可赋值 |
| `batch-focused-lint-v1`、`batch-focused-format-v1` | 同一未改变的批次字节，47 个受影响 TS/示例文件通过 |
| `batch-contract-freshness-v1` | clean `110ce540`、当时契约 `/14`：`compile-inputs.test.ts -t MV-S4-INPUT-007:` 1 passed、7 名称过滤 skip；旧/缺失/不匹配契约不能授权 Diff/Push，Check 不创建 Freshness |
| `conditional-merge-types-v1` | clean `8e51e031`、最终契约 `/15`：包 TypeScript 通过 |
| `conditional-merge-unit-v1` | 同一最终产品：10 文件、271/271；Conditional 的 public/validation/context，以及 Events/Decompiler/Boundary 和四个表现族单元套件 |
| `conditional-merge-workspace-v1` | 同一最终产品：Conditional Workspace 4/4；真实求值、上下文与失败/写入路径 |
| `conditional-merge-lint-v1`、`conditional-merge-format-v1` | 同一最终产品：7 个合并冲突/契约调用文件通过 |
| `current-index-v3` | 同一最终产品：374 ID、45 个当前夹具文件、本批次 42 ID，无缺失文件、重复 ID 或夹具 SHA 不符；只检查当前有效层 |

605 项批次检查是前两行实际执行之和；后续 271/4 有重叠，不作为额外不重复覆盖数。Conditional 合并后只复验相交路径，未把此前 605 项冒称在新提交全部重跑。提交前后未改变的检查直接复用；没有逐批全量、build/built 或游戏执行声明。

独立夹具位于 `packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/`：`screen-effect-cases.json`、`picture-parameters.json`、`picture-carriers.json`、`audio-command-cases.json`、`system-access-window-scenes.json`、`system-access-window-scenes-project.json`。测试路径和稳定需求名称由当前 `requirements.json` 对应。

## 原始失败与边界

`merged-types-v1` 保留两个新 Choices 调用仍使用位置 Wait 的 TypeScript 失败；随后修为具名调用。`shared-tone-types-red-v1` 保留公开 Tone/Color 仍接受 tuple 时两个 unused `@ts-expect-error`，随后最小类型/编反编译修复通过。`check-current-index-v1.cjs` 与 `current-index-v1-failure.log` 保留初版检查器误把文档要求当作必有 test 的前提失败；v2/v3 允许文档 review，不是产品值域放宽。

各票既有原始红、索引超时、输入及日志原地保留在 `ticket37-temp`、`ticket38-temp`、`ticket39-temp`、`ticket40-temp`，共同父目录为 `M:/Shuen/Codex/mv-events-implementation-20261020/`。详细旧记录仍在各票已有 evidence 文档；其中旧的逐票 full/build/冻结/归档/暂停处方由新执行修订取代。历史失败没有删除，后来通过没有被当成原失败根因诊断。40 旧 manifest 中 long-path status 的误报限制继续保留于其独立交接。

## 最终验收责任

| 最终票 | 仍待执行的本批次范围 |
| --- | --- |
| 48 | 最终集成候选的适用全量、build/built、三类事件混合及 Workspace 安全回归 |
| 50 | 39/40 分配的 E4：音频/访问设置、Window 隐藏 gray 与独立保存状态的最终编辑器逆向及当前产品输出比较 |
| 51 | 适用素材与 E6：Movie/Picture/Audio Asset 的最终事实、None 及当前产品输出比较 |
| 54 | 四票 R6 实际 MV 1.6.1/NW.js 游戏运行；使用独立初态、自制素材及必要声音/图像观察 |

54 的 Screen 范围包括淡入淡出/等待、并行效果、战斗 Weather 跳过效果与等待、Movie 播放/None；Picture 包括原点、位置、负 scale、blend、wait、旋转、Tone 以及 Picture None/Erase；Audio 包括各流 None、Save/Replay 位置、SE 并发与 Stop、秒制 fade、系统/载具音频；System 包括地图/战斗场景边界、访问开关、Encounter 重置、Window gray/effect、存档持久性以及 GameOver/Title 生命周期。

上述最终场景尚未执行通过。最终 55 的完整支持结论仍依赖 49–54 全部完成。
