# 4: 原生移动记录与镜像逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 逆向追踪页路线与强制路线插入、替换、复制粘贴及序列化中的 parameters／indent／M0／505 和 flags。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E3 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 页路线与 E205 分别核对无参/有参构造、原始键存在性、indent 缺失/null/0、M0 两态与默认 flags，保留资源身份和代码依据；有限 zero 状态以用户已接受的04反例修订和 ADR 0015 为准。
- [x] 追踪插入、替换、复制粘贴与参数确认后的 505 和非终止项整个对象镜像；JSON 规则推导与目标代码事实分开，不能清洗外壳后比较。
- [x] 记录有限形态矩阵支持范围、路径限制及未决组合；真实代码反例按既定契约修订流程处理。

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
- [移动指令参数附表](../../complete-mv-events/research/command-parameters/movement.md)：逐码参数与共享路线保存形态。

## Outcome

### 2026-10-19 — 有界逆向前置与有限 zero 决定完成

已核对同身份 MV1.6.1 的页/205新建、既有载入/JSON clone、插入/替换/参数确认、movement与外层event复制粘贴、最终序列化及完整205/505镜像；资源身份与限制见[04报告](../evidence/04-movement-records-and-mirrors-reverse.md)、[资源元数据](../evidence/04-resource-identities.json)和[原始条件复算](../evidence/04-controlled-replay-observations.json)。原始首方文本留在仓库外。

发现原absent/null矩阵未覆盖的数字0：clone后的null项粘贴到null项前，原生算术得到0。用户直接回复“接受有限 zero 状态（推荐）”；已同步ADR0015、权威决定票12 Answer与追加评论、实施规格I5、当前参数附表和04/14/33验收责任。非终止项为absent/null/zero，默认absent；其他数字拒绝，M0/parameters/完整505规则不变。此处解除的是04逆向与契约前置；14/33产品支持仍待实现。

实际验证：Windows10.0.19045 / Node22.23.0；独立解码器重验EXE/资源长度、边界与SHA256；精确提取函数隔离复算通过，重跑输出哈希与留存原始观察完全一致。`pnpm check`通过（15个测试文件、118个测试，类型/lint/格式通过），`pnpm build`通过；最终索引按当前合并输入复核。

三份不可变结果分别签收有界路径核对、原反例的保留与已批准解决、有限zero契约同步；结果中的passed不代表Qt/UI、系统剪贴板、真实编辑器写盘、产品往返或实际游戏运行。最终R1–R7游戏要求保持有效。

- [MV-E04-ROUTE-PATHS](../evidence/results/MV-E04-ROUTE-PATHS-2026-10-19T07-45-33-492Z-8cb39180-514a-445e-9825-047e4f8b8f55.json)
- [MV-E04-INDENT-COUNTEREXAMPLE](../evidence/results/MV-E04-INDENT-COUNTEREXAMPLE-2026-10-19T07-45-33-492Z-cae6fd32-65a4-4cc0-8c27-c85efbb79188.json)
- [MV-E04-ZERO-CONTRACT](../evidence/results/MV-E04-ZERO-CONTRACT-2026-10-19T07-45-33-492Z-9d9bba7e-3f6f-4c38-95ee-accec9b5db55.json)
