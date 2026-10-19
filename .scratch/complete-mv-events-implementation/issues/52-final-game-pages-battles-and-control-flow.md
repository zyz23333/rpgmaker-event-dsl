# 52: 最终游戏回归：页、战斗与控制流

Status: ready-for-agent
Blocked by: 48
Stage: S7
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完成 R1–R3 的页选择、触发／调用、战斗 span、分支／循环／标签和停滞后果对照。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 R1–R3。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；最终集成候选的完整原生回归另由 49–54 交付。首方、静态、合成、真实 UI 与游戏观察按规格分别记录。

## Acceptance criteria

- [ ] 候选版本完成 R1 五 Map trigger、页选择、Common trigger/调用、自主/强制路线与等待。
- [ ] 完成 R2 最低战斗页、AND/全关、turn0/A-B、三 span/后续调度及结果分支；R3 Choices/条件/循环/Break/Exit/Label 后果。
- [ ] 原生对照与产品输出使用等价干净初态，记录跳过、残留对象作用和停滞，不通过改引擎行为制造通过。

### 共通要求（限本票适用范围）

- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上执行本票 E/R 组，保留原生对照和产品输出的输入身份、版本、步骤、实际结果及差异。修复后按影响复验并追加记录，不能覆盖原始捕获。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（R1–R3）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
