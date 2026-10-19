# 20: Decompile 完整候选一次发布

Status: resolved
Blocked by: 19
Stage: S4b
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 候选隔离、按最终位置解析并检查发现集合及身份冲突，整目录不覆盖发布；失败不暴露部分源码。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 完整候选隔离于实际 Discovery，以最终位置解析依赖；发布前确认全部候选可被发现，身份与现有声明不冲突，现有源码只作可靠身份提取。
- [x] 固定目标目录必须不存在，空目录也拒绝；宽 glob、别名/junction、并发抢占和不支持完整发布机制均不能暴露部分结果。
- [x] 任一事件失败整次失败；目录一次发布后进程未报告成功的重试只报告目标已存在，不合并、不覆盖、不自动编号，保留 Snapshot 与原源码。

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

- [19：Compile／Check 完整输出与发布](19-compile-check-and-output-publication.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I9、I11、T1、T5；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。

## Outcome

已实现完整Decompile候选在最终位置的统一依赖／类型／受限求值验证、现有源码可靠身份投影、永久Discovery隔离和单次不覆盖目录发布。发布期间固定实际路径身份并重验完整候选及捕获输入，拒绝已有整个目标、并发占位、路径／输入／候选变动和不支持布局；真实进程中断验证部分暂存不可发现、成功回报丢失后重试只报目标已存在。

主要产品／测试提交为 `55f75ab`；`66c04d4` 修复合并复核发现的无关named import过早校验，新增公开红绿并保持身份字段实际依赖未知helper时拒绝。完整验收、16项requirement矩阵、最终66份源码／构建passed记录、66份修复前passed、4份标准历史failed、实际C:/F:跨卷拒绝补充及原始报告均见 [Ticket20验收报告](../evidence/20-decompile-complete-directory-publication.md)。原160项requirement逐条保留，当前176项；既有入库result字节未修改。

Windows／Node22.23.0最终正常 `pnpm check`：28 files／293 tests通过，176.78s，typecheck／lint／format:check通过；本工作树 `pnpm build` 成功，随后实际built Windows矩阵7 files／68 tests通过，103.98s。最终归档后证据索引3项通过，4.75s；最终source／built记录的全部实际文件hash与当前内容一致，`git diff --check`通过。

支持布局要求sourceRoot预先存在、与Workspace state同文件系统，Windows PowerShell5.1／.NET可用，且路径可被可靠固定；根缺失／跨卷／无法固定等安排发布前拒绝。根和包README均同步了这些条件。全部本票机器记录为 `native: not-executed`；本票分配的是自动化／文档验收，没有分配独立编辑器／游戏场景，最终E／R验收仍由49–54承担。
