# 21: Push 全输入漂移与写入复核

Status: resolved
Blocked by: 20
Stage: S4c
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** no-op 也检查完整标准输入，只写 Affected 文件；首次替换前、逐文件替换和写后复核发现变化时保留正确状态。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 每次 Push 含 no-op 都对完整标准数据与 Snapshot MapInfos 登记地图做字节哈希 Drift 检查；插件文件和孤立未登记地图按既定范围排除。
- [x] 仅备份/替换 Affected 文件，执行首次替换前全检查、每次替换旧内容检查、写后全检查，后者区分已写 generated 与未写 Snapshot。
- [x] 覆盖无关文件/同语义重排/外部改写与替换/收尾失败；写前不写、写后保留 Interrupted Push，不覆盖外部修改或自动全工程回滚。

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

- [20：Decompile 完整候选一次发布](20-decompile-complete-directory-publication.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I10–I12、T1、T5；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。


## Answer

已交付完整标准输入的 raw-byte Drift 与 Affected-only 写入保护。no-op、首次替换前、逐文件旧内容捕获、写后完整集合分别复核；替换与恢复使用实际非覆盖安装，外部到达对象和无法恢复的独有捕获对象均保留。Diff 使用键顺序无关的解析值比较，保留键存在、数组、CR、负零等保存值区别；规范 Map1001 的 Diff/filter/pending 路径已贯通。Generated 暂存消费也核对实际字节。公开 README 已同步。

产品/索引提交 `fbce1ed`，旧 workflow affected-only 断言按已接受 I12 同步的提交为 `be41bc5`。Compile Contract Version 保持 `mv-1.6.1/4`，因为本票没有修改 DSL、Compile 验证、Compiler Defaults 或 Generated 输出语义。

Windows 10.0.19045 / Node 22.23.0 / pnpm 10.33.0，默认 2 workers 与既有时限：正常 `pnpm check` 29 文件 / 313 测试通过；本工作树 fresh `pnpm build` 通过；正常 built Windows baseline 8 文件 / 88 测试通过；最后 evidence schema 1 文件 / 3 测试通过。首轮全量中的旧契约断言失败及所有已生成失败记录均有记录，未改记为通过。

新增 15 条 requirements、20 source + 20 built 最终通过记录、11 条原始历史失败记录。原有 176 条 requirements deep-equal；原有 results 目录 378 个 Git blobs（377 JSON 与目录说明）逐个不变。40 条最终记录的 captured file hash 与当前文件一致，全部 51 条新 record 与原始输出按字节一致。

完整实现、red/green、环境、检查数、产物身份、记录链接和边界见 [21 验收报告](../evidence/21-push-full-input-drift-checks.md)。本票没有分配独立 E/R，相关共通项按该分配范围完成，自动化 native 保持 `not-executed`；后续最终游戏回归仍需实际执行。本票未关闭工单 22 的完整恢复矩阵、冻结与收尾重试责任。所有 worktree、junction、沙箱均保留待最终清理。
