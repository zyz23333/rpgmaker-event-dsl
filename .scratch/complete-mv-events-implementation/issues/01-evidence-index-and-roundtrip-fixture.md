# 01: 证据索引与最小往返样例

Status: ready-for-agent
Blocked by: None (can start immediately)
Stage: S0
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 建立可复建临时工程和独立预期，真实发现并求值一份现有可支持的 Decompiled Source，再编译比较完整保存结构。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；最终集成候选的完整原生回归另由 49–54 交付。首方、静态、合成、真实 UI 与游戏观察按规格分别记录。

## Acceptance criteria

- [ ] 索引区分要求与执行结果，记录稳定 ID、出处、输入/fixture 哈希、环境、操作者、预期/实际和复验状态；原生、静态、合成来源分开。
- [ ] 用自编最小上下文和一份当前可精确保留的 Common Event 验证真实 Discovery、源码求值和完整比较；比较器不能删除尾标记、缺键、CR 或非激活值。
- [ ] 独立预期不从待测编译器生成，普通自动化不依赖本地首方资料；后续任务按同一格式增补逐参数案例。

### 共通要求（限本票适用范围）

- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- None (can start immediately).

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T1、T3、I13（S0）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
