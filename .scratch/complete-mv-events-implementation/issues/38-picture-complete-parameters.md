# 38: Picture 完整参数

Status: resolved
Blocked by: 23
Stage: S6
Execution batch: [画面、图片、音频与系统场景](../tickets.md#batch-presentation)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 显示、移动、旋转、色调、擦除图片完整往返，覆盖负 scale、坐标模式、blend、等待和 None。

## Scope

主要指令责任：E231、E232、E233、E234、E235。

原生证据分配：R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E231–E235 全部 Picture ID、原点、位置模式、scale、opacity、blend、duration/wait/angle/tone 准确表达。
- [x] 负 scale 按已证范围支持，图片坐标不误用地图 direct 域；None 与擦除的原生后果分别保留。
- [x] 独立边界/组合样本及真实 Workspace 往返齐备。
- [ ] 最终 54 的 R6 用自制素材核对实际游戏中的图片效果；本票未记为通过。

### 共通要求（限本票适用范围）

- [x] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [x] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [x] 按规格 2026-10-20 用户执行修订，开发及批次合入执行 Windows / Node 22 受影响测试与必要检查；全量适用自动化及构建集中到 48。安全票仍验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [x] 本票原生场景可集中到 49–54 最终回归；开发票关闭时记录实际自动化结果，并明确指向待执行的最终场景，不把未执行记为通过。证据按规格 2026-10-20 用户执行修订保留必要版本、输入、命令和预期/实际日志。
- [x] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

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

### 2026-10-20 — Actual73504ec postmerge focused verification

Saved source checkpoint8e49010, then merged actual integration
73504ec28bad98ae424a9d452f68774b009579d0 as
e686bbada86257ae59572738c0a48694284cc654. Incoming314 requirement objects/raw
prefix and README prefix remain exact, followed by nine owned rows (323 total).
Contract `mv-1.6.1/12` is inherited. All four original conflict texts and a
reconciliation receipt are preserved externally. The native validator keeps both
Picture and incoming Timer branches; the equivalent Loop assertion is incoming.

`post73504ec-static-v1` passed typecheck, scoped lint, package format and whitespace
checks. The root-allocated `post73504ec-focused-complete-v1` batch passed13 files
and206 tests in146.75 seconds, using Node22.23.0, two workers and the unchanged
ten-second deadline. The broader180-input snapshot and standard176-input result
fingerprints are separately listed in the evidence document. The batch has exited;
isolated index, history/source audit, large archive and final focused DEV commit
await the next root window. This remains claimed DEV; no full/build/built/R6,
READY or resolution is claimed.

### 2026-10-20 — Preserved index timeout and minimal shared-tool correction

The first isolated index run failed at the unchanged10000ms deadline (one timeout,
two passes), after268 owned result records were copied byte-exactly. The original
failure and all inputs remain preserved. A separate read-only public-validator
probe completed the full6697-result/1184814380-byte scan in22944ms. Artifacts were
read by120ms, no file reads were duplicated, and the CPU profile recorded18183ms
idle in23202ms. The root accepted a minimal bounded I/O correction.

The independent shared-tool commit
`b066c6244fe86c1cfce41645b5cf3cdfe4144aa7` contains only seven insertions and
three deletions in `test/support/mv-evidence.ts`:32 bounded reads and ID Map lookup,
with all validation checks retained. It passed package statics, then the original
public index suite passed all three cases in8.36s total/6.97s test time, with
the original deadline and two workers. The earlier206-case execution/source pin
is kept separately from this later index pin; no206-case rerun is claimed. Final
auditing checks their product inputs for exact equality before the focused DEV
handoff. Contract, ticket status and full/build/built/R6 obligations are unchanged.

### 2026-10-20 — Final focused DEV evidence verification

The history audit verified7610 incoming evidence blobs byte-exactly and all314
incoming requirement objects/raw prefix, followed by nine owned rows. It retains
all272 original records (261 passed,11 failed), with each complete original input
snapshot kept externally on M. The final176-file input fingerprint is
`ac102a6ce7f02126868590f6bb708366eb2a7d4b99c83d9f9f91ae1f4dd4fef4`.
All102 product-source file bytes equal the earlier206-case execution, product
fingerprint `9dcf2d945e1c50110169083bda6fce9dd01f3a7a287aed243d101f29b03a6565`.

After copying all records from the index attempts, the final public index
validation case was run alone and passed in4110.3881ms, retaining the original
10000ms deadline and two workers. It produces no new records, so this verifies
the final record set without an append-after-validation gap. Its JSON report and
raw inputs are preserved. Final tool archiving, staged-byte audit and clean DEV
commit follow in the allocated window; full/build/built/R6 and READY remain pending.

### 2026-10-20 — Focused DEV archive and staged-byte audit

Archived204 self-authored tools/logs/manifests/profile entries. A batch Git object
audit verified byte-exact staging of all272 original result records,176 final
captured inputs and204 archive entries, plus all7610 unchanged incoming evidence
blobs. Incoming314+owned9=323 requirements and inherited `mv-1.6.1/12` were checked
again against actual73504ec. The source remains a focused DEV delivery with all
original failures retained. Root must complete later full/build/built/R6 and the
independent final merger; this ticket stays claimed and is not READY or resolved.

The initial whitespace check identified original conflict markers in six raw
merge-conflict captures. Only those six exact archive paths now have opaque Git
diff attributes; capture bytes remain unchanged. The final archive has208 entries,
including the original204-entry manifest/staged receipt, the finite correction
script and its receipt. Product/test diff behavior is unaffected. The final
staged-byte check covers the208-entry archive before the clean DEV commit.

### 2026-10-20 — 能力批次交付与开发关闭

按规格顶部 2026-10-20 用户执行修订，本票功能及受影响自动化已完成，状态改为
resolved。旧评论中逐票全量、build/built、冻结/归档及最终游戏后才可关闭的处方
已由该修订取代；上方拆分后的最终原生验收框继续保持未勾选。

共同交付见[37–40 批次记录](../evidence/presentation-batch-delivery.md)。共同实现
`4c6e3385` 实际通过 521 单元/回归与 84 Workspace；合入实际 Conditional
`6dfa75eb` 后的最终产品 `8e51e031` 另通过 271 相交单元/回归、4 Conditional
Workspace、包 TypeScript 与冲突文件静态检查。全批次共用具名 Tone/Color，
编译契约相对主线 `/14` 更新为 `/15`，当前验收索引 374 条、本批次 42 条。
旧失败及新运行的确切命令、版本、输入/夹具与日志路径均见批次记录。

48 仍负责最终集成的适用全量和 build/built；50/51 负责本批次适用 E4/素材
逆向及最终产品比较；54 负责本票分配的实际 MV 1.6.1/NW.js R6。具体场景逐票
列在批次记录末尾。没有将上述未执行项计为通过，完整支持仍待最终 55。
