# 14: 共享 Movement Route 保存形态

Status: resolved
Blocked by: 04, 12
Stage: S2
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** Set Movement Route 精确保留 flags、逐类记录外壳、M0 和 205／505 镜像，并提供页路线可直接复用的完整路线模型。

## Scope

主要指令责任：E205。

原生证据分配：E3、R1/R6 的路线形态代表。

以当前可支持载体验证本票最小完整行为；不将共享基础签收计作全部家族参数、S5/S6 或完整支持已完成。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E205 target 与共享路线分开；flags true/false/false、逐类 savedShape、M0 terminator 和准确省略规则可完整往返。非终止项的 indent 有 absent/null/zero 三态，默认 absent；null/zero分别直接编码null/0且反编译显式保留，拒绝其他数字，M0仍缺indent。
- [x] 以独立于待测编译器的无参、有参和嵌套数据代表验证完整 205/505 镜像；缺indent/null/0分别建样本，任何完整对象差异均拒绝。未知移动码、不允许的 parameters/indent 组合、额外键和镜像冲突明确拒绝。
- [x] 提供 Map Page 可复用的同一路线能力；本票负责共享外壳和 E205，45 类移动参数的完整签收归 33，避免重复记完成。

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

- [04：原生移动记录与镜像逆向核对](04-native-movement-records-and-mirrors.md)。
- [12：地图与战斗引用上下文贯通](12-map-and-battle-reference-context.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I5、I7–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [系统、地图与表现参数附表](../../complete-mv-events/research/command-parameters/visual-map.md)。
- [移动指令参数附表](../../complete-mv-events/research/command-parameters/movement.md)：逐码参数与共享路线保存形态。

## Comments

### 2026-10-19 — 04 原生反例的有限 zero 契约已接受

用户回复“接受有限 zero 状态（推荐）”。[04 报告](../evidence/04-movement-records-and-mirrors-reverse.md#契约比较与已接受修订)、[ADR0015](../../../docs/adr/0015-bounded-native-saved-shape.md)和权威决定票12已同步非终止项zero状态；无参缺parameters、有参完整语义数组、M0两态和完整505镜像均不变。本票负责产品实现、独立fixture及真实编反编译往返，04的条件复算与契约记录不计本票完成。
### 2026-10-19 — 实现与验收完成

已交付共享 `MovementRoute`、E205 的独立 target、true/false/false 默认 flags、非终止记录 absent/null/zero 三态、唯一 M0 两种 parameters 形态，以及按完整对象、顺序和外层 indent 核对的 E205/E505 镜像。参数键存在性、额外字段、未知移动码、原始数组、recognized raw 引用与嵌套 Script Gate 均在规范化或复制之前验证；原生 Map Page 路线读取和默认页复用同一 codec。公开 API、示例及编写指南已同步，无旧路线数组或外层 flags 别名。

独立字面量 fixture 覆盖六个 Common Event；45 个指令/结构案例和五个真实 Workspace 案例执行正式编写、编译、反编译、Staged Data Graph、Discovery、类型检查、源码求值、Check、Compile、Diff 和 Push。失败场景检查完整源码、Project Root、Snapshot、Generated、manifest 与 Discovery；修改生成源码名称再还原证明实际求值。共享基础没有计作 33 的全部移动参数或 18/24 的页编写签收。

最终 Windows / Node 22.23.0 联合产品树（`dad1fd4`，已合入 16 / `b2f2acd`）验证：typecheck、lint、format:check、build 全部通过；`vitest run --maxWorkers=2` 的 22 个文件、215 个案例全部通过；built Windows 配置的三个文件、八个案例全部通过（含 16 的四个锁案例）；built Movement Route Workspace 五个案例全部通过。默认全并发此前使既有 S0 Workspace 的 10 秒时限超时，因此最终使用两 worker 运行全量断言，没有放宽既有超时或断言。架构测试发现的源依赖环已通过叶模块拆分修复。

实际原生运行使用未修改的 MV 1.6.1 / NW.js 0.29.0 / embedded Node 9.7.1；独立 literal 和真实 Workspace Compile 输入各启动一个原生游戏进程，每个路线场景观察 90 个实际帧。两组各五个独立预期全部符合，覆盖 saved envelope、wait、repeat+wait、受阻不可跳过与可跳过行为；两进程正常退出 0。保留版本、输入和首方文件身份、原始输出及观察记录，不将游戏观察记作 Qt UI 捕获，也不分发首方运行时或游戏资产。

[完整验收报告与复现入口](../evidence/14-movement-acceptance.md)链接当前源码/完整套件、built CLI、built Workspace 和实际原生证据。新增八条本票 requirement 与不可变运行结果；既往记录保留。最后再合入仅证据/文档的 10 / `3e05dc3`，通过 Git 比较确认上述产品、测试、构建配置与依赖树不变；125 项索引并集、文档引用、fixture/hash、测试链接、记录 schema、格式与 diff 再核验通过。最终 E1–E7 / R1–R7 证据及整合回归仍由 49–54 负责。
