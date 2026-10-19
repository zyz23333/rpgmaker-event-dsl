# 15: raw、异常与递归 Gate 共用边界

Status: resolved
Blocked by: 13, 14
Stage: S2
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 未知事件按有限 raw 保留，已知异常和坏结构明确失败；正式与已知 raw 走同一验证及递归 Gate，并给可定位诊断。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：Gate 的原生脚本行为归 28/30/31/33；本票自动化验证门控和结构。

以当前可支持载体验证本票最小完整行为；不将共享基础签收计作全部家族参数、S5/S6 或完整支持已完成。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 未知事件 code 在合法外壳/严格 JSON 参数/可保留上下文下单记录 raw 警告；已知未实现或异常不得自动 raw，外部 carrier 未知 JSON 保留。
- [x] 正式与已知 raw 共用结构和家族参数验证入口；精确检查缺键/null/undefined/洞/多槽/额外字段，包含分支续行和镜像归属，不提前宣称全部家族参数已补齐。
- [x] 识别所有脚本位置并递归检查 Gate，含 raw、镜像、保存路线及空/不可达脚本；Decompile 关闭 Gate 可生成并提示，Compile/Check 拒绝。
- [x] 诊断包含稳定标识、阶段、级别、身份、路径和预期/实际，镜像给双方位置；替换 raw 豁免和异常回退旧断言。

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

## Outcome

产品实现 `fb36525`，合入17/18后最终产品及公开文档提交 `5816a3a`。交付严格raw JSON、完整原生外壳、已知正式/raw共用验证、真实结构及102/402和205/505镜像、递归Script Gate、固定引用和可定位诊断。为非custom保存路线的保留与Gate提前交付最小最终Page `movement` 载体；完整23/24和后续家族矩阵仍按原票负责。合法但当前不可无损表达的已知保存变体显式unsupported，未改成领域禁止。

Windows / Node22.23.0：typecheck、lint、format:check、build通过；完整源码26 files /251 tests；构建Windows baseline5 files /26 tests；本票构建Workspace1 file /5 tests；追加证据后的索引1 file /3 tests均通过。新增8项要求和8份不可覆盖记录，保持17/18并集。15原生分配为自动化结构/Gate验证，无独立编辑器或游戏场景；记录全部native not-executed，不替代28/30/31/33和最终E/R验收。

详细输入、公共入口、原始红灯现象、最终报告和剩余家族责任见 [15验收记录](../evidence/15-command-boundary-and-script-gate.md)。本票已同步README、包README、示例和event-patterns编写指南；唯一Compile Contract Version更新为 `mv-1.6.1/2`。

## Dependencies

- [13：Loop 与子体边界最小闭环](13-loop-and-child-body-boundaries.md)。
- [14：共享 Movement Route 保存形态](14-shared-movement-route-saved-shapes.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I5、I7–I9、T1–T3；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
