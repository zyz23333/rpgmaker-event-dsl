# 8: 原生脸图索引逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 追踪标准、三行、缩小和 None 脸图在 picker 加载、图像变化、参数确认及容器序列化中的索引处理。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E6 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 追踪固定列数/动态行数、第三行 index、换图与 None 的名称/索引保存链；合成尺寸样本与代码可证明的可点选路径分开。
- [x] 分别核对容器序列化与 picker 主动确认；归零/异步加载路径及其条件明确记录，不把 picker 改写当作 DSL 必须改写。
- [x] 区分产品支持域极值与普通可选值，保留资源身份、时序局限和反例；无法界定且影响保存契约的问题保持未解决。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本/哈希、资源偏移/长度/解码哈希、实际存在的 REA Evidence ID、代码路径与契约比较。分别核对新建、既有/注入输入、仅容器序列化和参数确认的路径；代码观察、有条件推导与未决时序分别标明，不虚构 UI 捕获。原始首方输出仅留本机仓库外；仓库发布原创结论和复核指针。影响必须实现的保存契约而无法界定的问题保持未解决。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I6、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Outcome and verification

2026-10-19：本票完成限定的 E6 逆向前置，原创[报告](../evidence/08-face-index-and-image-replacement-reverse.md)、[16 个 QML 资源及首方帮助身份和独立尺寸输入](../evidence/08-resource-identities.json)、14 个稳定 `MV-E08-*` 索引义务及独立核对记录已交付。目标 EXE 长度/SHA-256、外层及压缩边界、解码长度/SHA-256 均重新核对；历史 PE 版本 Evidence ID 明确复用，不虚构新记录。实际资源抽取与预览扫描使用 Node v24.14.0；最终索引/格式校验使用 Windows/Node v22.23.0。

固定 144 格/四列及动态行数支持三行图的8/11有条件选择路径；父 E101/E322 名称/index 独立加载保存，完整 Face→Obj→Labeled→ImageBox→ImageClip 预览链没有按图片尺寸写回夹紧。换成两行图时，若新尺寸后执行adjust可归0；换成单行图时frameActive=false，adjust跳过归0。None 子确认、1ms源变化定时器及缺文件列表选择的完整 Qt 时序未执行，条件和未知均保留；仅容器序列化不调用参数确认。这些边界未推翻已接受的0..2147483647有限保存域、None独立index和不扫描素材的契约，未发现需要用户重新决定的冲突。

实际验证：Windows/Node v22.23.0，`pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts -t 'validates the evidence index'` 通过1项，另2项因名称筛选未执行；本次证据/索引/票据及新记录的oxfmt检查、3份变更Markdown的本地链接目标检查与`git diff --check`通过。纯文档证据不修改产品或harness，无需新增TDD测试。14条passed只证明限定的资源/路径/条件与已批准契约核对完成；未执行编辑器UI、抽出代码、工程写盘、产品输出比较或游戏，合成极值不冒充普通picker可创建样本。

本票解除自身逆向前置；相关产品实现、49–51最终E6比较及52–54实际R6游戏显示仍须分别交付。本票没有以完成源码核对代替后续实际运行要求。
