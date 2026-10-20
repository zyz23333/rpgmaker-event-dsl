# 53: 最终游戏回归：动态选择与地图位置

Status: ready-for-agent
Blocked by: 48
Stage: S7
Execution batch: [最终原生回归](../tickets.md#batch-native-regression)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完成 R4–R5 的上下文、随机求值、装备／Force Action、坐标和 Location Info 实际后果对照。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 R4–R5。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [ ] 候选版本完成 R4 Common 多上下文、变量角色 0 全队、双持/槽/库存、Random 与其他 operand 求值、Force Action。
- [ ] 完成 R5 Transfer/Vehicle/Event Location、缩图坐标及 terrain/region/tileId/eventId 的真实不同后果。
- [ ] 实际游戏观察与可核对状态记录齐备，pure mock/静态解释不能代替；不同场景的输入/初态身份明确。

### 共通要求（限本票适用范围）

- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上执行本票 E/R 组，保留原生对照和产品输出的输入身份、版本、步骤、实际结果及差异。修复后按影响复验并追加记录，不能覆盖原始捕获。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（R4–R5）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
