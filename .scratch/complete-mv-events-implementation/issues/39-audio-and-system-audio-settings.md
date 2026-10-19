# 39: 音频播放与系统音频设置

Status: claimed
Blocked by: 23
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 播放／淡出／保存／恢复与战斗、胜败、载具音频均保留完整音频对象，None 不丢数值。

## Scope

主要指令责任：E132、E133、E139、E140、E241、E242、E243、E244、E245、E246、E249、E250、E251。

原生证据分配：E4/R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [ ] 音频播放/淡出/保存/恢复与系统战斗/胜败/载具音频的全部参数、范围、vehicle 类型准确支持。
- [ ] None 仍保留 volume/pitch/pan，固定默认不取当前项目值，不自动改写为 Stop；可复用编码但不改变各自原生行为。
- [ ] 全参数正式/raw/反编译和 Workspace 比较通过，E4/R6 记录相关原生设置和声音观察。

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

2026-10-20 focused DEV：完整 Audio/None/独立数值、seconds fade、Save/Replay/Stop、
三种 vehicle、原始 helper/Asset 输入及正式/raw/native 精确拒绝已实现。已从干净
checkpoint 5f1c690 合入实际 post26 73504ec，继承契约 /12；原314行保持完整，
追加5行共319。最终 source focused 11 files/449 tests、typecheck、scoped lint/format
通过。全部原始失败和输入/输出保留，详见
[开发记录](../evidence/39-audio-and-system-audio-dev-checkpoint.md)。本票保持 claimed；
full/build/built、相对契约递增、E4/R6、独立复核与最终关闭仍待 finalization，未声称 READY。

最终证据 helper 经单独授权合入；449 tests 的全部100个产品源文件字节不变，
未把旧449执行冒称为新 helper 下重跑。capture-v6 下原始完整 mv-evidence 的索引
先触发原10s超时、另2案通过；随后相同输入的公开索引单案在原10s内8.13s通过。
两次原日志并存，不推定耗时根因、不放宽门槛。38条原始结果（37 pass、1已保留
测试前提 fail）及6份输入捕获完整归档，详情见开发记录的最终 helper/index 章节。
