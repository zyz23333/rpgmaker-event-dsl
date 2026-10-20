# 51: 最终编辑器逆向与产品比较：文本、素材与 EXP

Status: resolved
Blocked by: 48
Stage: S7
Execution batch: [最终原生回归](../tickets.md#batch-native-regression)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 在候选版本完成本票 E 组的逆向证据核对与最终产品输出比较，遵循规格 2026-10-19 用户验收修订；实际游戏验证仍由 52–54 承担。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 E5–E7。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 候选版本完成 E5 行记录计数/空尾和列明单槽 CR/LF/CRLF/尾字符，注入起点如实标识。
- [x] 完成 E6 脸图标准/三行/缩小/None、图像联动、缩图旧坐标和缺素材处理代码，以及 E7 EXP 两个临界值的校验/夹界/保存链；未决时序如实记录。
- [x] 验证 warning 与准确保存，允许记录原生调整/报错但不得静默归一化产品；保留逆向证据、实际产品比较和差异，不将推导写成 UI 捕获。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上，将实际产品输出与独立原生保存契约及同身份逆向证据比较，留存输入哈希、候选版本、预期/实际和差异。新建、加载、参数确认与容器序列化分别追踪；未决时序明确记录，影响必需保存契约且无法界定者不能判通过。修复后按影响复验并追加结果；不以静态证据替代 R1–R7 实际游戏运行。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（E5–E7）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Comments

### 2026-10-20 — 最终 E1–E7 比较批次认领

与49/50同批在 `codex/mv-final-e1-e7` 准备，基于实际集成 `e3d7bd3f`。08脸图、09单槽及10EXP报告作为有身份约束的复用依据；图像异步调整、输入逐键/粘贴与数值载入分别保留限定，不伪造 UI 保存结果。待48交付最终 built 产品后完成字符串、独立索引、坐标及 EXP 的比较与诊断检查；尚未执行通过。

### 2026-10-20 — E5–E7 最终候选验收完成

在48实际候选 `2dc639015f908de6fd524e50236e5422b5f8e990`、契约22的built API（SHA256 `24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`）完成最终比较，前后完整15项dist匹配。见[最终报告 E5–E7](../evidence/49-51-final-editor-comparison.md#e5)和[案例 manifest](../evidence/49-51-final-editor-cases.json)。四类物理行记录的空/尾空与条数，完整单槽CR/LF/CRLF/尾字符，标准/三行/None独立脸图索引、缺素材名及缩图后命令坐标均原样保存；Script Gate显式开启，warning理由保持single-line/CR/official two-row/no-clamping，无素材扫描假象。None加2147483647未误报face-layout。

EXP 9999999、1、变量操作数和lose+showLevelUp=true通过完整六槽比较。10000000分别在原始helper、recognized Raw与native Decompile拒绝，位置为 `changeExp.value.value`、`commands[0].parameters[4]`、`list[0].parameters[4]`，业务树不变且Decompile未发布源码。最终源码负例保留其他Common声明，没有无关缺引用混淆。08–10复用资源和SpinBox/PE真实Evidence bundle身份一致；文本处理与数值setter候选、Qt图片异步/None时序仍保留条件和未知项。

追加 `MV-S7-E5`、`MV-S7-E6`、`MV-S7-E7` 及旧E-only `MV-S6-TEXT-E5`有效结果。实际Decompile/Check/编辑Compile/Diff/Push和15carrier/Snapshot全比较通过；证据索引定点检查加 `--testTimeout 120000` 通过1 passed、2 skipped（41.08秒），原10秒超时原始日志保留，`git diff --check`通过。外部输入、脚本、日志、失败原始记录与收据均在 `M:/Shuen/Codex/mv-events-implementation-20261020/final-e1-e7/`。未修改产品、未运行build/full、编辑器UI或游戏；R1–R7仍由52–54验收。本票按修订后范围设为resolved。
