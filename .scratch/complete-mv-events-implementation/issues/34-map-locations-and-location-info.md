# 34: 地图位置与 Location Info

Status: ready-for-agent
Blocked by: 06, 23, 24
Stage: S6
Execution batch: [地图位置与角色行为](../tickets.md#batch-map)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** Transfer／Vehicle／Event Location 与查询完整表达模式，保留非负 32 位坐标并区分固定地图、动态地图和查询后果。

## Scope

主要指令责任：E201、E202、E203、E285。

原生证据分配：E4/E6、R5。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [ ] E201/E202/E203/E285 全模式/目标/枚举/默认与 direct 非负 32 位域完整，负零在有损重写前拒绝。
- [ ] 固定 map 缺失 error、尺寸外 warning；所属 Map 中 E203/E285 条件性提示，未知 Common 运行地图不猜、不单因未知报警。
- [ ] 验证 terrain/region、tileId 别名、eventId 精确匹配等不同后果，变量只验引用；E4/E6/R5 与真实 Workspace 往返齐备。

### 共通要求（限本票适用范围）

- [ ] 按规格 I1–I12 和对应完整参数附表实现；正式编写、编译、反编译、验证、已知 raw 及适用 Workspace 路径一起交付，实际发现并求值生成源码，预期独立于待测编译器。
- [ ] 对本票拥有的字段/模式/枚举/None/独立保存值/默认/正负边界及已知相互作用建案例；完整比较键存在性、数组长度/顺序、页序、值、镜像、CR 和非激活配置。
- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。
- [ ] 按规格 2026-10-20 用户执行修订，开发及批次合入执行 Windows / Node 22 受影响测试与必要检查；全量适用自动化及构建集中到 48。安全票仍验证用户可观察的源码、项目、Snapshot、manifest、Discovery 集合和诊断状态。
- [ ] 本票原生场景可集中到 49–54 最终回归；开发票关闭时记录实际自动化结果，并明确指向待执行的最终场景，不把未执行记为通过。证据按规格 2026-10-20 用户执行修订保留必要版本、输入、命令和预期/实际日志。
- [ ] 同步受影响的当前公开 API 文档、示例及编写指南；不保留旧 API 别名或迁移说明，不分发首方编辑器、runtime/源码或本地游戏资产。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [06：原生 Transfer 初值逆向核对](06-native-transfer-defaults.md)。
- [23：Common Event 完整往返](23-common-event-complete-roundtrip.md)。
- [24：Map Event 完整页与 note](24-map-event-full-pages-and-note.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [系统、地图与表现参数附表](../../complete-mv-events/research/command-parameters/visual-map.md)。
