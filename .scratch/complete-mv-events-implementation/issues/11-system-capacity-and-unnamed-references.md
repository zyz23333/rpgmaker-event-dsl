# 11: System 容量与无名引用贯通

Status: resolved
Blocked by: 02
Stage: S3
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 真实 Workspace 保留空名实际 ID 和无名 System 槽，完成开关范围、自开关及名称移除的编译、物化与 Diff 验证。

## Scope

主要指令责任：E121、E123。

原生证据分配：R1 相关开关/自开关场景；最终与容器集成复核。

以当前可支持载体验证本票最小完整行为；不将共享基础签收计作全部家族参数、S5/S6 或完整支持已完成。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 实际 ID 存在性不受空名字影响；System 容量取 Snapshot 与命名声明最大 ID 的较大值，名称只从 DSL 唯一解析，引用不能扩容。
- [x] E121 连续开关范围和 E123 自开关在正式/已知 raw/反编译中一致；反向范围报错，中间无名槽合法，容器不适用按契约诊断。
- [x] 实际 Workspace 验证新增/删名、无名显式 ID、外部空名条目与物化/Diff；删名不缩容，固定引用失败不静默跳过。

### 共通要求（限本票适用范围）

- [x] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [x] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [x] 产品变更执行 Windows / Node 22 全量适用检查与构建；安全票同时验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [x] 本票分配的必要编辑器/游戏场景取得实际证据后才关闭；最终回归另外执行。原生版本、runtime/NW.js、步骤、输入身份、操作者、预期/实际与原始结果可追踪。
- [x] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [02：Windows 自动化基线](02-windows-automation-baseline.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4、I7、I10、T1–T3；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

## Outcome —2026-10-19

Implemented final System capacity independent of names, actual empty-name database
IDs, DSL-only unique switch/variable name resolution, explicit references without
capacity expansion, and exact E121/E123 validation in formal/recognized raw/Decompile.
Reversed ranges, invalid letters/operations/counts/IDs and omitted Boolean values fail
with owned contextual diagnostics. Missing native switch references reject before
new source publication. Current Map/Common carriers are covered; Common Event
unknown callers remain valid. The approved carrier boundary leaves Troop-context
E123 warning integration to25/48, followed by final integrated regression52–54.

The real Workspace verifies complete roundtrip, extension to switch5/variable4,
Push, complete name removal without capacity shrink, unnamed explicit variable4 and
empty-name item1, second Push, refreshed Snapshot/manifest/Discovery and clean Diff.
Four independent final MV1.6.1/NW0.29.0 processes compare original literal controls
with actual compiled Workspace output, including11 direct intermediate snapshots
and native117 Common Event caller inheritance. All four passed; initial raw results
are retained separately from the final rerun.

Verification: Windows/Node22.23.0 pnpm check16files/122tests; pnpm build; built CLI
Windows baseline2files/4tests. The branch merged integration7d2ea0b before final runs.
[Case index](../evidence/requirements.json), [full scope and native report](../evidence/11-system-slots-and-native-switches.md),
original observer/inputs/expected/results and per-case immutable execution records
are committed. Source fingerprints distinguish the exact verified inputs from the
baseline revision. Public READMEs and the Event Authoring reference are synchronized.
