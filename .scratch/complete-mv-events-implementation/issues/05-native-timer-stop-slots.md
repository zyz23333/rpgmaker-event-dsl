# 5: 原生 Timer Stop 槽位逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 追踪新建 Stop、Start 后改 Stop、零与非零秒数在初始化、加载、容器保存及参数确认中的槽位处理。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E4 Timer 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 分别追踪新建 Stop、Start 0 后 Stop、Start 非零后 Stop 的构造、加载和确认代码，并核对容器序列化。
- [x] 记录原始参数长度/槽值及其代码依据；新建推导与既有/合成输入处理分开。
- [x] 与 Start 两槽、Stop 一/两槽的既决契约比较；反例或影响保存契约的未知解除后再放行。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本/哈希、资源偏移/长度/解码哈希、实际存在的 REA Evidence ID、代码路径与契约比较。分别核对新建、既有/注入输入、仅容器序列化和参数确认的路径；代码观察、有条件推导与未决时序分别标明，不虚构 UI 捕获。原始首方输出仅留本机仓库外；仓库发布原创结论和复核指针。影响必须实现的保存契约而无法界定的问题保持未解决。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I5、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Outcome

2026-10-19：完成 [Timer Stop 逆向核对](../evidence/05-timer-stop-reverse.md)，发布 [资源身份 metadata](../evidence/05-resource-identities.json)、9 个 `MV-E05-*` 索引项及各自不可覆盖的结果记录。目标 EXE/随包 Qt 身份、10 个选定资源的长度/压缩边界/哈希均由只读解码复核；SpinBox native 默认值复用同哈希既有 REA/Ghidra 证据。

Stop 保存只写 p0，不删/填 p1：新建为 `[1]`；已保存 Start0/83 重开改 Stop 后为 `[1,0]`/`[1,83]`；再次确认 Stop 及仅容器 stringify 分别保留槽位。新建窗口未确认前输入83后切 Stop 则仍为 `[1]`，报告将两种路径分开。与 D-TIMER、ADR0012/0015 一致，没有发现当前有限保存契约的代码反例，解除 26 的相关逆向前置。

验证：Windows / Node22.23.0 下 `pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts -t 'validates the evidence index'` 通过（1 passed，2 skipped）；只做索引验证，未执行的产品往返、编辑器 UI、实际磁盘捕获及游戏运行没有记为通过。`passed` 的原生记录只表示已执行并完成本报告范围内的代码核对；26/50 产品比较与52–54实际游戏责任继续独立验收。
