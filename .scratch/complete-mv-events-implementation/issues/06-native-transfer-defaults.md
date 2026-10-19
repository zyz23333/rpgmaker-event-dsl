# 6: 原生 Transfer 初值逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 追踪新建 Transfer 的方向、淡出和位置初始化，核对项目上下文与固定 Compiler Default 的区别。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E4 Transfer 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 追踪新建 Transfer 地图/坐标、direction、fade 的初始化链；区分显式赋值、项目取值与 Qt 继承默认。
- [x] 分别核对既有参数加载、容器序列化和确认代码，不将项目决定的初值升级为通用 Compiler Default。
- [x] 与固定 retain/black 默认及正式 direct/variable 参数契约比较，记录反例与仍未证明的控件时序。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本/哈希、资源偏移/长度/解码哈希、实际存在的 REA Evidence ID、代码路径与契约比较。分别核对新建、既有/注入输入、仅容器序列化和参数确认的路径；代码观察、有条件推导与未决时序分别标明，不虚构 UI 捕获。原始首方输出仅留本机仓库外；仓库发布原创结论和复核指针。影响必须实现的保存契约而无法界定的问题保持未解决。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I4、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Outcome

2026-10-19：完成 [Transfer 初值与模式逆向报告](../evidence/06-transfer-defaults-reverse.md)，发布 [资源身份 metadata](../evidence/06-resource-identities.json)、10 个 `MV-E06-*` 索引项及独立结果记录。实字节复核 EXE/Qt DLL、qmltypes/qmldir，以及17个选定资源。新增同安装 Menu 构造/属性链的 REA/Ghidra 核对，17条原始Evidence与分析快照仅留仓库外，导出后已关闭session。

Direct 显式选中，地图绑定项目 currentMapId，x/y显式0；工程 editMapId 和地图树选择决定当前地图。Menu 原生初始索引-1，经 ComboBox completion 改0；就绪模型首项支持 retain0/black0 的有条件推导。载入 direct 与 variables 分别回填所选三个值，保存六槽；仅容器 stringify 不重新套新建初值。没有发现既有有限保存契约的代码反例，解除34相关逆向前置；没有修改既决默认、坐标域或领域行为。

验证：Windows / Node22.23.0 下 `pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts -t 'validates the evidence index'` 通过（1 passed，2 skipped），`git diff --check`通过。Qt对象/模型/文本就绪与子位置窗口信号、最终写盘仍按报告保留未实测边界。结果的 `passed` 只表示已经执行并完成有界代码核对，不声称 UI、产品比较或游戏通过；34/50与52–54继续分别承担后续产品和游戏验收。
