# 27: Choices 完整分支往返

Status: resolved
Blocked by: 23
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 保留 1–6 项、取消与默认模式、越项保存值、402 文本及子体尾标记，验证原生选择行为。

## Scope

主要指令责任：E102。

原生证据分配：E2、R3。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 1–6 项含空/尾空文字，defaultChoice/cancel 全模式与越项 warning 准确；默认值不因一项列表改写。
- [x] Choices 项与取消分支平铺 commands/endMarker，102/402 从同一文字生成；缺分支、镜像矛盾和错误边界明确失败。
- [x] 正式/已知 raw/反编译完整参数、引用、结构与 Workspace 往返一致；E2/R3 取得产品分配场景证据。

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

- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。

## Comments

### 2026-10-20 — DEV checkpoint

在实际依赖 23 的集成基线 `205334338d8e64e3d00e485849c9ddf67bd7e3b1`
上完成 Choices 的开发切片：嵌套 choice/cancel 编写结构、完整 E102 保存模式、
402 文本镜像、精确 403 `[6, null]`、子体尾标记所有权、已知 raw 与反编译验证，
以及越项保存值 warning。同步当前 README 和 agent 编写指南。

Windows / Node 22.23.0 下，8 个相关测试文件共 118 项通过；package typecheck、
17 个变更 TypeScript 文件的 scoped lint 与 format check 通过。
Workspace 测试实际发现并求值源码，覆盖 Compile / Diff / Push 和失败重试后业务状态。
TDD、测试前提修正和检查原始日志保存在工作区外的
`C:/Users/Shuen/.codex/tmp/mv27-dev-*.log`。

本次仅交付 DEV checkpoint。票仍为 claimed，验收项未勾选；未运行 broad check、
build、built baseline 或原生游戏，未提升契约版本，也未登记 E2/R3 为通过。
后续须在 root 分配的实际最新集成和 finalization slot 上复验，协调 ticket 26
的共享 raw 诊断路径修复，再补充验收索引、完整检查和分配的原生证据。

### 2026-10-20 — DEV numeric saved-index correction

独立 public Workspace 审计发现前一 DEV 错将 E102 的数字保存索引 `-0`
当作符号枚举拒绝。按既有 I6 / design13 范围，`{ kind: "choice", index: -0 }`
可以忠实表达，现已修正正式编写及原生/已知 raw 的 E102 slots 1/2，并以精确
literal 与 `Object.is` 默认省略保留源码和写出值的符号。E402 派生序号及
position/background 符号模式仍拒绝 `-0`；全局 `oneOf` 规则未放宽。

新增三项 formal/raw/decompile regression 先 red 后 green，以及同七场景
Workspace 精确保存测试。Windows / Node 22.23.0 下，相关 8 文件共 125 项通过，
package typecheck、5 个变更 TypeScript 文件的 scoped lint / format check 通过。
原失败 public 审计及 98 文件 source freeze 保留原样；新的实际源码 public green
审计与精确 commit/hash 另存外部 DEV handoff，均不作为原生游戏证据。

仍为 DEV / claimed，未执行 broad/build/built baseline/native，未提升契约版本。
ticket 26 的共享 raw suffix mapping 待实际最新集成时协调，不复制未合并依赖。

### 2026-10-20 — 最终化 READY / resolved

在M盘独立最终化分支合并实际73504ec集成，当前Compile Contract mv-1.6.1/13。Windows/Node22.23.0/pnpm10.33.0、原2workers和原期限下，完整fullcheck-v2、fresh15-file build、完整built Windows均通过；精确文件/测试数量及source/dist绑定见[当前实施记录](../evidence/27-choices-complete-branches.md)。原DEV125测试与最终affected131通过，旧raw suffix11个真实red、第一次完整检查1151pass/2fail、原子进程期限失败和索引超时、补正文档ID以及最小有界读取优化的完整原输出全部保留。未放宽领域、fixture、worker或期限。

实际E2重核13条同身份03资源，built公共Workspace真实源码改动和Push比较完整15live/4generated，并验证6负例完整状态。实际R3经root独立exact prepare审查释放后，原7Choices完整谓词/Input和新增数值负零通过8对/16原生游戏进程；完整15disk/4generated/4loaded、1100文件独立物理副本、reference/seed不变、真实进程/host/7engine、唯一profile/exit0/空日志均由独立读取器复核。当前公开API文档、示例及编写指南已同步并复核。首方runtime/源码/assets与完整原生carrier只保留M盘外部，仓库提交安全摘要和原件hash，不分发。

328条requirements完整保留入站314和DEV274；最终索引与历史/归档/执行字节审计通过。9项criteria全部完成，状态resolved；参见[最终历史](../evidence/27-final-history/README.md)、[byte audit](../evidence/27-final-history/final-byte-audit-v1.json)及[关闭后索引原输出](../evidence/27-final-history/post-archive/final-index-v2/stdout.log)。规格最终49–55责任仍独立推进。最终索引v1曾在原10秒期限超时；完整8389文件输入及所有诊断/失败保留，后续有效全量profile未复现、原因仍未确定。根审核后一次无插件原CLI v2实际1pass/2filtered（4.86秒）完成门槛，未修改helper/领域或将诊断通过冒充正式门槛。
