# 49: 最终编辑器逆向与产品比较：容器与分支

Status: resolved
Blocked by: 48
Stage: S7
Execution batch: [最终原生回归](../tickets.md#batch-native-regression)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 在候选版本完成本票 E 组的逆向证据核对与最终产品输出比较，遵循规格 2026-10-19 用户验收修订；实际游戏验证仍由 52–54 承担。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 E1–E2。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 候选版本完成 E1 的 Map/Common/Troop 默认、触发、禁用配置、note/图像/保存路线与页数边界；高 ID/21 页另标支持样本。
- [x] 完成 E2 的四类子体、缺/空 else、402/403/尾 0、Battle flags 和 Shop 结构；原生与最终 DSL 输出分别核对。
- [x] 保留逆向代码事实/有条件推导/未决项及二进制/资源身份和产品比较结果；既有逆向报告不能代替最终候选产品检查，修复后按影响复验。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上，将实际产品输出与独立原生保存契约及同身份逆向证据比较，留存输入哈希、候选版本、预期/实际和差异。新建、加载、参数确认与容器序列化分别追踪；未决时序明确记录，影响必需保存契约且无法界定者不能判通过。修复后按影响复验并追加结果；不以静态证据替代 R1–R7 实际游戏运行。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（E1–E2）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Comments

### 2026-10-20 — 最终 E1–E7 比较批次认领

在专用分支 `codex/mv-final-e1-e7`、M 工作树从实际集成 `e3d7bd3f`（438 要求、契约21）准备49–51。复用同身份03–10及既有容器保存链逆向，重新核对所用二进制/资源身份与路径覆盖；普通创建、容器保存和参数重确认分别记录。最终候选的 built 产品比较等48交付后执行。没有运行编辑器 UI 或游戏，也未将本票验收记为通过。

### 2026-10-20 — E1–E2 最终候选验收完成

在48实际候选 `2dc639015f908de6fd524e50236e5422b5f8e990`、`mv-1.6.1/22` 的 built Workspace API 上通过最终比较；API SHA256 为 `24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`，全部15项 dist 与48 manifest在执行前后均一致。详见[最终 E1–E7 报告](../evidence/49-51-final-editor-comparison.md)及[原始案例 manifest](../evidence/49-51-final-editor-cases.json)。E1完整页/条件/图像/非custom路线/外部 carrier、20页和单列的21页/ID1000合成保存样本，以及E2四类子体、Choice/Battle/Shop完整记录均与独立预期一致。Map Event初始位置维持地图边界规则，99/88旧坐标属于命令保存值。

真实Decompile、Check、源码发现/求值、修改Common1名称后的Compile/Diff/Push通过，最终15个工程carrier和Snapshot完整一致。追加 `MV-S7-E1`、`MV-S7-E2`，同批补齐分配的旧E-only结果；未替组合E+R签收。五个二进制/资源产物及183条资源引用身份通过复核，静态事实、条件推导和Qt未知项仍分别保留。

证据索引定点检查以 `pnpm exec vitest run test/mv-evidence.test.ts -t "validates the evidence index, source references, fixture hashes, test links, and current recorded runs" --testTimeout 120000` 通过：1 passed、2 skipped，测试本体41.08秒；`git diff --check`通过。默认10秒超时的原始日志和四次harness准备失败均保留，未改报通过。日志、输入、脚本和收据均位于 `M:/Shuen/Codex/mv-events-implementation-20261020/final-e1-e7/`，定点检查日志为 `evidence-index-timeout120000-20261020.log`。本票无产品代码修改、无build/full、无编辑器UI或游戏实测；R1–R7仍由52–54负责。按本票修订后范围设为resolved。
