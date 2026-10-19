# 01: 证据索引与最小往返样例

Status: resolved
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

- [x] 索引区分要求与执行结果，记录稳定 ID、出处、输入/fixture 哈希、环境、操作者、预期/实际和复验状态；原生、静态、合成来源分开。
- [x] 用自编最小上下文和一份当前可精确保留的 Common Event 验证真实 Discovery、源码求值和完整比较；比较器不能删除尾标记、缺键、CR 或非激活值。
- [x] 独立预期不从待测编译器生成，普通自动化不依赖本地首方资料；后续任务按同一格式增补逐参数案例。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- None (can start immediately).

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T1、T3、I13（S0）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Outcome and actual verification — 2026-10-19

交付 [机器索引](../evidence/requirements.json)、[复建与扩展约定](../evidence/README.md)、自编完整最小标准数据上下文，以及 `test/mv-evidence.test.ts` 的真实 Workspace 验证。预期 JSON 为独立自编输入；类型解析使用实际包源码的临时 junction，没有模拟声明或本地首方资料依赖。

`MV-S0-CE-001` 走实际 Clone → Decompile → Compile Check → Compile，并将完整 CommonEvents/System 解析数据与输入比较；manifest 的实际发现集合与生成源文件集合一致。修改生成源码的事件名后，下一次 Compile 的结果随之改变，恢复源码后恢复完整相等；Project Root 和全量 Snapshot 保持原值。`MV-S0-COMPARE-001` 使用同一个严格比较器，逐项拒绝删除尾 0、缺少 indent 键、移除 CR、移除尾空文本记录、改变非激活 switchId、删除 null 槽、将空数组换为 null、删除外部未知字段的八种损失。

Windows 10.0.19045 / Node **22.23.0** 实际执行：

- `pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts`：3/3 通过。
- `pnpm check`：类型、lint、格式及全部 14 个测试文件 / 117 项测试通过。
- `pnpm build`：通过，目标 node22。
- 原始运行结果：[Common Event 全链路](../evidence/results/MV-S0-CE-001-2026-10-19T07-14-36-055Z-c79ee83a-5240-4c5a-9a3d-5610b166db7b.json)、[完整比较负控](../evidence/results/MV-S0-COMPARE-001-2026-10-19T07-14-36-102Z-159e1e61-686d-49f8-9ad2-27954e6d64cc.json)。每份记录包含实际工具版本、源码版本与逐文件哈希、fixture 哈希、步骤、预期和实际。

本票仅关闭 S0 两项种子义务。索引保留静态推导、REA 逆向观察、合成支持/拒绝和实际游戏观察的区别；本票没有执行原生逆向或游戏验收，也不代表其他任务、105+45 全矩阵或最终集成候选已通过。
