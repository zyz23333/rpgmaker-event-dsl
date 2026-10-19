# 40: 系统访问、窗口色与场景

Status: claimed
Blocked by: 23
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 保存／菜单／遇敌／队形开关、窗口四元素 tone 和菜单／保存／结束／标题场景完整往返。

## Scope

主要指令责任：E134、E135、E136、E137、E138、E351、E352、E353、E354。

原生证据分配：E4/R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [ ] 访问开关和四种场景命令按精确原生枚举/参数长度验证；窗口 tone 保留隐藏灰度，不能缩成三元素。
- [ ] 正式编写、已知 raw、反编译都输出完整独立保存状态，并在安全工作流可演示。
- [ ] 按对应 E4/R6 代表场景记录界面/状态观察；参数全面性由独立自动化证明。

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
- [角色、战斗与场景参数附表](../../complete-mv-events/research/command-parameters/actors-battle.md)。

## Comments

### 2026-10-20 — 领取 focused DEV

以实际集成 73504ec28bad98ae424a9d452f68774b009579d0、契约 mv-1.6.1/12、原有 314 条验收要求为基线，按已接受 T1 公共边界与 TDD 实施。先交付本票 focused DEV；完整检查、构建、E4 最终逆向产品比较、R6 实际游戏运行与关闭仍由统一验收完成。不会以静态/合成结果替代实际游戏证据。

### 2026-10-20 — focused DEV 定向验证

专有命令单元及既有回归四文件实际通过 30／30，包 TypeScript 与专有静态检查通过。010–024 的 15 个独立 Workspace 案例也已实际执行通过，涵盖真实 Discovery、已发布源码求值、Check、正式表达与已知 raw 的 Compile／Diff／真实 Push，以及源码或原生失败时完整文件状态保全和陈旧输出拒绝。全部使用原 10 秒 case 期限与两个 worker；名称筛选 skip 未计为通过。

共享证据 helper 的唯一获准更新为本树提交 6ba40682006c7c95101a4edd9c66e3d77e2ee92a，原 30 个 dirty 文件逐字节保全。完整输入身份、历史失败与五批 Workspace 日志见[本票证据记录](../evidence/40-system-access-window-color-and-scenes.md)。最新实际集成、Tone 统一、全量／构建／built、最终 E4 比较和真实 R6 尚待统一验收；本票保持 claimed，未据定向结果关闭。
