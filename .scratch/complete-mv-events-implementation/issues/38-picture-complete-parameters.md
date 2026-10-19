# 38: Picture 完整参数

Status: claimed
Blocked by: 23
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 显示、移动、旋转、色调、擦除图片完整往返，覆盖负 scale、坐标模式、blend、等待和 None。

## Scope

主要指令责任：E231、E232、E233、E234、E235。

原生证据分配：R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [ ] E231–E235 全部 Picture ID、原点、位置模式、scale、opacity、blend、duration/wait/angle/tone 准确表达。
- [ ] 负 scale 按已证范围支持，图片坐标不误用地图 direct 域；None 与擦除的原生后果分别保留。
- [ ] 独立边界/组合样本及真实 Workspace 往返齐备，R6 用自制素材核对产品输出。

### 共通要求（限本票适用范围）

- [ ] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [ ] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [ ] 产品变更执行 Windows / Node 22 全量适用检查与构建；安全票同时验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [ ] 本票分配的必要编辑器/游戏场景取得实际证据后才关闭；最终回归另外执行。原生版本、runtime/NW.js、步骤、输入身份、操作者、预期/实际与原始结果可追踪。
- [ ] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [系统、地图与表现参数附表](../../complete-mv-events/research/command-parameters/visual-map.md)。

## Comments

### 2026-10-20 — Focused DEV claim

Claimed on codex/mv-ticket-38 at actual integration38542767606ff9712e45d2a8e4894558e3a7d385. Worktree is manually Git-registered on M, not app-attached. T1 seams are already approved; use narrow red→green vertical slices. All new temporary data/results/logs/captures live in ticket38-temp on M. This is focused DEV only: full/build/built/native/contract delivery/READY/resolved and independent merger remain pending. Native R6 will run later in root serial queue. Normative Tone is named red/green/blue/gray, no tuple alias; preserve37 ownership.

### 2026-10-20 — Preserved development checkpoint and incoming Map delivery

Initial focused source execution passed12files/179tests on the3854276/contract10
baseline. Exact execution input bytes and158original result records are preserved
externally at `M:/Shuen/Codex/mv-events-implementation-20261020/ticket38-temp/premerge-3854-source-freeze`.
The clean source checkpoint is4d37538; actual Map delivery888b950 was then merged
as10ef92c, inheriting contract11. Incoming300 requirement objects/raw prefix and
historical evidence were preserved, followed by this ticket's initial8 rows.
Commitc1b9777 adds the Picture Workspace test to the built Windows include list.
Postmerge execution remains pending while ticket26 owns the serial test window.

Root subsequently assigned the shared `imageAsset` constructor's projection
boundary to this ticket. Requirement008 and five helper/actual source-local,
const, spread and cast rejection cases are prepared for a distinct red→green
slice; no implementation or execution is claimed yet. The index now has300
incoming plus9 owned rows. `movieAsset` and `scriptInput` remain with their
assigned finalization owners; queued audio/reference changes are not copied here.
Status remains claimed; full/build/built/R6 and final delivery remain pending.

### 2026-10-20 — imageAsset public constructor original red

The allocated lightweight helper run `image-asset-helper-red-v1` failed as expected
because the constructor accepted the extra input field. The run preserved its raw
failure and178 captured execution inputs, fingerprint
`95e3271bd413b58434d5c953eccf7a3e1bfb3e0c7f8e6ffe80bfdc74dedaa192`.
Product code remains unchanged so the actual Workspace local/const/spread/cast
cases can obtain their own original red when the root releases that window.
No green, postmerge completion or final acceptance is claimed.

### 2026-10-20 — imageAsset source-boundary red→green

`image-asset-workspace-red-v1` preserved four actual Workspace failures for local,
const, spread and cast input against the same178-file repair-before fingerprint.
The only product change in this slice adds `assertDslObject` to the original
`imageAsset` input before folder/name reads and projection. The subsequent
`image-asset-five-green-v1` run passed all five helper/Workspace cases, preserving
fingerprint `d525b335ec25e4dc0a25d751c1e56193f62c2fad8853117dc27a875d79e02e08`.
All execution retained Node22.23.0, two workers and the original ten-second limit.
The root serial window was released after phase exit0; the larger postmerge
focused checks, index audit and focused DEV handoff remain pending.

The allocated lightweight static follow-up also passed package typecheck,
scoped lint/format and whitespace checks. A separate immutable external freeze
retains the five original failed and five passing result records, nine raw logs
and all three input snapshots. Manifest SHA256:
`61b2226b6081124fb0d8b94383a525ed58b326cbc72448c243d290de84032b02`.
It verified every recorded source hash against the preserved snapshot; the only
captured input changed between red and green is `references.ts`. Standard record
source fingerprints and broader pre-run snapshot fingerprints remain separately
identified in the evidence document. No larger batch/index run is claimed here.
