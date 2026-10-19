# 04: 原生移动记录与镜像实验

Status: ready-for-agent
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 捕获页路线与强制路线在插入、替换、复制粘贴后的 parameters／indent／M0／505 及 flags。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E3 原生前置。

本票交付真实原生证据，不必等待产品实现；反例未解决时不解除相关实现前置。可执行操作由代理完成，原生 UI 受限的具体步骤沿用规格中的用户执行责任。

关联的 E/R 仅指本票相关代表场景；最终集成候选的完整原生回归另由 49–54 交付。首方、静态、合成、真实 UI 与游戏观察按规格分别记录。

## Acceptance criteria

- [ ] 页路线与 E205 分别覆盖无参、有参记录，原始键存在性、indent 缺失/null、M0 两态及默认 flags 完整留存。
- [ ] 插入、替换、复制粘贴和重确认后核对 505 与非终止项的整个对象镜像，不能先删异常外壳再比较。
- [ ] 保留不受支持组合的真实观察；若与有限形态矩阵冲突，记录反例并走既定契约修订。

### 共通要求（限本票适用范围）

- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本与哈希、干净临时工程、精确操作步骤、原始输入/输出及契约比较。普通创建、注入起点、容器重存、主动重确认必须区分，不能用静态解释或 mock 代替本票实验。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I5、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [移动指令参数附表](../../complete-mv-events/research/command-parameters/movement.md)：逐码参数与共享路线保存形态。
