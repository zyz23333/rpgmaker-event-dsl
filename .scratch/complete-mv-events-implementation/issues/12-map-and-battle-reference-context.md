# 12: 地图与战斗引用上下文贯通

Status: resolved
Blocked by: 11
Stage: S3
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 从 Snapshot 装配 Animations、Tilesets、地图和完整 troop members／Enemy／装备槽，实际工作流得到准确引用诊断。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：原生上下文观察分配给 23–25 及命令族；本票验证实际装配。

以当前可支持载体验证本票最小完整行为；不将共享基础签收计作全部家族参数、S5/S6 或完整支持已完成。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 真实 Snapshot 保留地图尺寸/事件位置/tileset 配置、Animations/Tilesets、完整有序 troop members/Enemy 存在性与 System 装备槽。
- [x] 用已有可支持的最小命令经 Workspace 验证空名目标、缺固定引用、hidden 成员位置和运行 selector；不能只手工拼装 compiler 上下文。
- [x] 新增上下文的捕获/装配遵循现有模块边界，carrier 未知有效 JSON 保留；页条件例外只在后续对应容器票落实。

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

- [11：System 容量与无名引用贯通](11-system-capacity-and-unnamed-references.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I3、I7、T1–T3；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Outcome

2026-10-19：本票范围完成，完整报告见 [12-map-and-battle-context.md](../evidence/12-map-and-battle-context.md)。真实 Snapshot 装配 Animations/Tilesets、空名地图及尺寸/事件位置/tilesetId、完整有序 troop members、独立 Enemy 存在性、Tileset 图组和全部 System 装备槽，并传递到 Staged Data Graph。hidden 与缺 Enemy 成员不被过滤或重绑，carrier 未知有效 JSON 保留。

最小现有212/282/336在正式编写、已知raw和Decompile发布前统一固定引用存在性检查；测试经实际 Workspace Discovery/typecheck/evaluation和Check/Compile/Push，独立预期逐文件比较，缺ID0/99与诊断/无发布状态均有负例。`MV-S3-CONTEXT-001`至`005`已加入验收索引，合并前后两轮共十份实际执行结果已保留。

Windows / Node22.23.0：初轮`pnpm check`通过（17files/127tests），合入最新集成`c28c3ea`后再次通过（typecheck/lint/format，19files/161tests）；合并后`pnpm build`通过；构建后Windows CLI/junction基线2files/4tests通过；追加结果后证据schema检查3tests通过。公开README和编写指南同步。

本票未分配原生场景，不把合成输入或Snapshot装配声明为原生UI/游戏验证。实际Troop页/成员selector绑定及页条件例外由25/48验证；完整命令参数和运行语义由对应家族票验收。独立301 false/false输入另暴露既有编译器多604差异，已明确交接46，未调整领域契约或把该未完成行为计成本票通过。
