# 24: Map Event 完整页与 note

Status: resolved
Blocked by: 22
Stage: S5
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完整保存条件、图像、移动、优先级、选项和触发器，包括禁用配置、非 custom 路线、页级 Diff 与写回。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E1/E3/E6、R1。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 完整 note、Page Condition Slots、image、Autonomous Movement、priority/options/trigger 使用固定默认并准确省略，页序/数量/初始位置按契约验证。
- [x] 禁用条件显式非负 ID 例外、独立图像值、tileset 上下文和非 custom 保存路线完整保留并递归验证，切图不自动修改 priority。
- [x] 页级 Diff、Entry Removal 和写回保留外部 Map carrier；取得 E1/E3/E6、R1 的分配场景证据，自动化覆盖全字段与非法形态。

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

- [22：Interrupted Push 内容恢复](22-interrupted-push-content-recovery.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2–I3、I5–I10、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Comments

### 2026-10-19 — implementation claim

Claimed on codex/mv-ticket-24, based on actual merged22 integration 520a2e5d3a034299bedf8d1051b8559da2d3e648. Implementation uses the already accepted spec T1/T3 public seams: authoring/compile/validate outputs and actual Workspace init/Clone/Decompile/Discovery/evaluation/Check/Compile/Diff/Push. Independent native literals supply expected full saved state; tests do not use private implementation calls as the behavior boundary. Native E1/E3/E6 reverse-code/product comparison and R1 actual product pairing remain required before delivery.

### 2026-10-19 — completed delivery

Implemented complete note and saved Map pages, new condition slots, independent image values and real tileset context, options/priority/trigger, strict complete native readers, noncustom route validation, property/page Diff and null-hole Entry Removal preserving external carriers. Public API documentation, example and authoring guide now describe the current contract. Compile contract is mv-1.6.1/6.

Windows/tool Node22.23.0/pnpm10.33.0,2workers: pnpm check32files/471tests passed; fresh pnpm build passed; built Windows baseline10files/201tests passed. Final typecheck/lint/format passed with only the existing22-history warning. Two final observation-only assertions (project descriptor and exact-default source omission) were present in the built baseline and separately verified by final source74/74. No product source changed after the native runs. Initial full-check468pass/3fail and focused11/11fixture migration are retained; the immutable historical command JSON/result blobs were not altered.

Allocated E1/E3/E6:34identified editor resources revalidated read-only and explicitly compared with actual current built/source product output; no editor UI capture claimed. Allocated R1: both strict complete literal-vs-compiled pairs passed actual built public init/Clone/Decompile/source edit/Check/Compile/Diff/Push, all15disk JSON carriers and the three complete actual runtime-loaded Map001/CommonEvents/System carriers, fresh native processes/profiles and unchanged engine/disk identities; trigger pair10cases per side and route pair13assertions per side. Current source membership/hashes and all15fresh dist files exactly match both captured dirty builds. Original tools/logs, safe native summaries, exact fingerprints and limitations are in evidence/24-map-event-full-pages.md and evidence/24-history/.154new immutable machine records are indexed under MV-S5-MAP-001–010/E1/E3/E6/R1-TRIGGERS/R1-ROUTES. This closes only24allocated representative scenes;49–54still own final native evidence/regression.

Latest integration was rechecked in this worktree with git merge --no-edit codex/complete-mv-events-implementation: already up to date at520a2e5d3a034299bedf8d1051b8559da2d3e648. Independent merger/root integration remains separate from this delivery.

### 2026-10-19 — merger correction claim

Independent merger reproduced native events:[] being silently expanded to[null]. Delivery cdae5f8 remains immutable historical evidence. Reopened to reject missing mandatory slot zero before Decompile publication; the already accepted actual public Workspace seam will test a late Map failure against existing published source/output and full source/Project Root/Snapshot/config/manifest/Discovery state. New red/green and source/built/native results append; no prior requirement or captured result is rewritten.

### 2026-10-19 — merger correction completed

Rejected native events:[] with MV-MAP-EVENT-SHAPE before any candidate source is published. Collection-level failure now carries decompile stage, Map identity and native path. New MV-S5-MAP-011 uses actual public Workspace operations with existing authored source/generated output, an earlier valid changed Map and a later invalid Map002; exact source, Project Root/descriptor, Snapshot, generated output, config, manifest and Discovery state survive the located failure. Valid behavioral red and passing green are retained separately from the initial destination-exists harness failure.

Corrected Windows/Node22.23.0/pnpm10.33.0,2workers/existing timeouts: full pnpm check32files/472tests passed; fresh build passed; actual built Windows baseline10files/202tests passed; current45case source matrix passed; final evidence validator and lint/format passed with only the existing22-history warning. Both actual native pairs were repeated from the new build with unchanged original adapters: triggers/highest-page/Common10cases per side and route/wait/Parallel13assertions per side. All15complete disk JSON carriers and three complete actually loaded Map001/CommonEvents/System carriers, fresh processes/profiles, unchanged engine/disk identities, empty stdout/stderr, exit0 and strict comparison passed. Final source/dist membership and hashes match both new captures. Current package documentation and authoring guidance state mandatory native slot zero and atomic refusal.

Appended one requirement and159machine records, including75source+75built Workspace cases, three explicitly classified TDD attempts, one45case summary, three new identified-resource/current-product comparisons and two new actual native pairs. The original cdae5f8 build was preserved outside Git before rebuilding. History audit verified225prior requirement objects and921original result/24-history artifacts unchanged against cdae5f8; originals are not relabelled. New runs, safe summaries, correspondence, exact copy origins and tooling limitations are in evidence/24-merger-correction/ and the new correction section of evidence/24-map-event-full-pages.md. This completes the merger's only reported blocker; independent final merge/audit remains separate.

### 2026-10-20 — scoped numeric saved-value correction claim

Reopened only for the assigned supplemental Map Page numeric `-0` correction, on a separate managed `codex/mv-map-numeric-fix` worktree based on actual integration `233db5420d6cf83da0220c6aa5aed56626798f39`. Accepted design03/13, ADR0009/0011/0012 and spec I2/I6 already require exact preservation of these numeric saved fields. Root's ten actual public Decompile counterexamples are retained externally in `mv24-numeric-fields-public-audit-1b65432f-4e9e-450a-8473-252c5141cbc8` and independent identity/state audit `mv24-numeric-fields-independent-audit-cd65fae7-69d6-4006-984b-580657a90d76`; no old evidence is rewritten. The approved spec T1 public Workspace/Discovery/evaluation seams and independent JSON are used for focused red→green. Initial Map x/y placement and categorical enums remain separate. Development checkpoint is not final delivery; latest integration, contract reconciliation, broad/build/built checks, affected native evidence and independent merge remain pending.


### 2026-10-20 — supplemental numeric development checkpoint (not READY)

Implemented the assigned ten Map Page numerical -0 preservation gaps with scoped native/authored validation and exact rendering/default elision/import collection. Categorical priority/trigger/moveType and enabled references still refuse -0, now with accurate actual -0 diagnostics; initial x/y rules remain untouched. Focused public Workspace22/22 and targeted Map/Movement165/165 pass, alongside package typecheck, focused lint/format and the original evidence-index test. Four requirements and109machine records append; the audit proves251incoming requirement objects and1579untouched prior evidence blobs unchanged, with original97source/15dist root audit inputs still exact. All product reds, harness mistakes and audit-tool failures remain retained and separately classified. See [the supplemental current report](../evidence/24-map-event-full-pages.md#supplemental-numeric-saved-value-correction--development-checkpoint-2026-10-20).

This is a clean development checkpoint only, awaiting latest actual integration and coordinated finalization after33/36. Contract remains /7; no broad check/build/built/native/merge/cleanup has been performed. Status remains claimed until those final obligations and independent acceptance complete.

### 2026-10-20 — supplemental numeric current delivery

Integrated actual incoming3854276 at71098b7 and reconciled the sole compilation contract to `mv-1.6.1/11`; exact incoming296requirements plus the original four numeric rows yield300. Windows/Node22.23.0/pnpm10.33.0 with original two workers and deadlines: full check41files/1009tests passed, fresh15-file physical M build passed, actual built Windows baseline17files/395tests passed including22numeric cases. The initial full-check evidence-index timeout remains retained; a profiled, parent-authorized eight-read prefetch preserves original parse/validation/first-error order, every check, the existing cache and `recordEvidence`, with3631real and eight controlled equivalent comparisons. Executed dirty71098 provenance and187complete source/test/config/dist inputs are frozen; subsequent metadata is not relabelled as the executed build.

Fresh read-only34-resource/current-built E1/E3/E6 comparisons pass without editor UI claims. Two fresh current-built native pairs pass original10trigger and13route/wait/Parallel cases per side, all15disk/four generated/four actual loaded carriers, four strict15-flag native sides, ten exact signed-zero paths and unchanged1100-file reference/private seed. Independent merger inspection uses a separate physical walker and oracle recomputation and accepts the actual native evidence in audit22a6458a. The prepare-only runs remain explicitly native-not-executed, and historical launch helpers are not used. Final whole clean READY acceptance remains separate.

Appended1220exact machine records and six complete input sets/202deduplicated byte objects, with licensed raw/game/loaded data retained only on M. History audit6e13f0a9 verifies5986prior artifact memberships, unchanged prior requirement objects/report prefixes, all187executed inputs and1220new captures. Original archive manifest/empty open-log snapshot/final output/failed audit remain intact; an explicit close-time receipt and one exact path/hash/size allowlist handle only the archive producer's own open stdout timing. The first close-time helper's Buffer/string comparison mistake is also retained with its exact non-overwriting correction. Details, source origins and limits are in [the current report](../evidence/24-map-event-full-pages.md#supplemental-numeric-saved-value-correction--current-delivery-contract-mv-16111). Final metadata index/static validation and clean READY handoff follow; no primary merge, push, PR or cleanup is performed by this worktree.

Final metadata index validation passes under its original ten-second deadline: selected index test1passed/2unrelated skipped,3.35s test/4.99s total. Final repository lint and185-file format checks pass with retained historical/audit unused-binding warnings only. Product and all187executed inputs remain unchanged; exact final logs and metadata origins append separately. All assigned supplemental delivery obligations are complete and status is resolved. Independent merger still owns acceptance of the whole clean READY commit; this is not acceptance of only the earlier71098development merge or completion of final49–55.
