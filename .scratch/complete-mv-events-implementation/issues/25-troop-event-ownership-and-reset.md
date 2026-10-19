# 25: Troop Event 所有权与 Reset

Status: resolved
Blocked by: 22
Stage: S5
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 按 troopId 接管有序战斗页，保留全部 carrier；空白、删页和破坏性 Reset 在编反编译、Diff／Push 中准确区分。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E1、R2。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] troopId 对应实际存在的 troop，空名称/空成员不丢；完整条件与 span、禁用配置、hidden 位置和启用 enemy 条件的全成员 Enemy 校验准确。
- [x] DSL 只拥有 pages，保留 ID/name/members/站位及未知 carrier；反编译包含每个实际 troop，页非空有序、无页 ID。
- [x] 省略和显式空白产生精确单默认页，Reset 与局部删页/Entry Removal 区分；过滤 Diff 不隐去全局破坏性状态，Push 需显式允许；取得 E1/R2 证据。

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

## Comments

### 2026-10-19 — 认领实施

由 `codex/mv-ticket-25` 在独立 worktree 从实际 integration22 `520a2e5d3a034299bedf8d1051b8559da2d3e648` 开始。按已批准 T1 入口，以正式 authoring/compile/decompile/validation 和公开 Workspace init/Clone/Decompile/Check/Compile/Diff/Push/recovery 为测试 seam，使用独立完整原生预期；只认领本票。E1 采用已批准逆向与独立产品比较，R2 使用实际构建的正式 DSL product pair；此前原生 literal 准备不作为本票签收。

### 2026-10-20 — resolved with exact product and allocated E1/R2 evidence

Actual integration24 `8617d815750631d00a8b60b2410d9e5420da4e16` was merged in `1bda44c`. Product ownership/Reset, exact saved conditions, optional undefined and negative-zero boundaries, complete carriers and bounded prior `/6` recovery are implemented. A necessary finite correction now preserves the accepted unbranched false/false E301 shape without604; its independent public Workspace red/green is retained, and full46 remains separate. After that product correction, Windows/Node22.23.0/pnpm10.33.0 with original two-worker/timeouts passed complete `pnpm check` (35files/525tests), build and full built Windows (12files/248tests). Final E1 passed again. Authentic original built24 `/6` interrupted recovery by new `/7` retains its original build/result/audit; ordinary current Push correctly refuses the old output set and actual public Freshness is false. Final build and original recovery source differ only at the exact finite E301 codegen conditional; every Workspace/recovery source remains identical.

Final allocated R2 page/scheduling evidence is `MV-S5-TROOP-R2-DELIVERY-004`, an actual literal/formal DSL product pair using the first failed R2's frozen complete input. Only the auxiliary moment-repeat counter/stop guard is changed to one saved E355 under the normal Script Command Gate, in both literal and loaded mirrors. A whole-field audit preserves all17pages, conditions/span,16ordered trace, Guard Input turns0/1/2 and every other input field. Actual no-write Check, complete15disk/3loaded carriers, actual Map+Troops Push, isolated profiles/process/host/cwd/engine, exit0 and empty stdout/stderr all pass. Final actual95source/15dist identities exactly equal the current product and its immutable dirty build freeze. V3's separate real pass, the cross-run Common Event input differences and the final fixed input binding are recorded without inferring a cause or author.

The original `MV-S5-TROOP-R2` row and its full runner/input remain unchanged and failed at the Conditional nonempty-body marker (`troop:1 pages[9].list[4]`), native `not-executed`. This is ticket28, not23. Its original-input integration revalidation remains explicitly allocated to28/48/52; it is not claimed supported by25. The v2 E301 pre-game comparison failure is also retained. Full findings, source/build identities, all historical statuses, original recovery evidence and immutable own execution artifacts are in [the evidence report](../evidence/25-troop-event-ownership-and-reset.md), [25-history](../evidence/25-history/README.md) and [final delivery archive](../evidence/25-history/delivery/README.md). Final49–54 remain separate.

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2–I3、I7–I10、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
