# 50: 最终编辑器逆向与产品比较：移动与保存状态

Status: resolved
Blocked by: 48
Stage: S7
Execution batch: [最终原生回归](../tickets.md#batch-native-regression)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 在候选版本完成本票 E 组的逆向证据核对与最终产品输出比较，遵循规格 2026-10-19 用户验收修订；实际游戏验证仍由 52–54 承担。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 E3–E4。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 候选版本完成 E3 页路线与 E205、逐类外壳/M0、插入/替换/复制粘贴、505 镜像及 flags。
- [x] 完成 E4 Timer 三态、Transfer/Shop/Battle 默认、项目初值与固定默认区别、模式切换后的独立值。
- [x] 分开记录新建、容器序列化、参数确认代码与产品输出；复用逆向证据须核对二进制/资源身份及路径覆盖，不虚构 UI 观察。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上，将实际产品输出与独立原生保存契约及同身份逆向证据比较，留存输入哈希、候选版本、预期/实际和差异。新建、加载、参数确认与容器序列化分别追踪；未决时序明确记录，影响必需保存契约且无法界定者不能判通过。修复后按影响复验并追加结果；不以静态证据替代 R1–R7 实际游戏运行。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（E3–E4）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Comments

### 2026-10-20 — 最终 E1–E7 比较批次认领

与49/51同批在 `codex/mv-final-e1-e7` 准备，基于实际集成 `e3d7bd3f`。优先复用04移动外壳与镜像、05Timer、06Transfer、07Shop、03Battle的同身份资源事实和已接受契约，保留插入/复制推导及 Qt 时序限定；48交付后执行最终 built 产品输出比较。最终游戏仍由52–54负责，本票尚未通过。

### 2026-10-20 — E3–E4 最终候选验收完成

在48实际候选 `2dc639015f908de6fd524e50236e5422b5f8e990`、`mv-1.6.1/22`（API SHA256 `24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`）通过最终built比较；执行前后核对完整15项dist。见[最终报告 E3/E4](../evidence/49-51-final-editor-comparison.md#e3)与[案例 manifest](../evidence/49-51-final-editor-cases.json)。Page/205路线、absent/null/zero非终止indent、M0两态、完整505、非custom保存路线及flags，Timer Stop缺槽/零/非零、Transfer显式/变量槽和Shop/Battle独立设置，均经实际源码求值与完整carrier比较通过。

复核同身份03–07资源及有关容器路径；insert/replace/copy/paste的条件推导保留原限制，不冒称Qt交互实测。追加 `MV-S7-E3`、`MV-S7-E4`，并给旧E-only `MV-S6-TIMER-E4-COMPARE`、`MV-S6-BATTLE-004`追加本次有效结果。未将组合E+R或45移动码的全面自动化责任转由本票冒领。

同批实际Decompile/Check/编辑Compile/Diff/Push通过，15工程carrier及Snapshot完整一致。证据索引同一定点检查增加 `--testTimeout 120000` 后1 passed、2 skipped（测试41.08秒）；默认10秒超时原始日志保留，`git diff --check`通过。全部脚本、日志、临时Workspace和收据在 `M:/Shuen/Codex/mv-events-implementation-20261020/final-e1-e7/`。没有产品修改、build/full或UI/game；最终游戏仍由52–54负责。本票已满足修订后范围，设为resolved。
