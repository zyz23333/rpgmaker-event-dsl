# 17: Snapshot 一致捕获与目标绑定

Status: resolved
Blocked by: 16
Stage: S4a
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** Clone／Pull 对同一文件集合和内容建立快照与 Project Root Binding；中途变化失败，换目标显式重新 Pull。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] Clone/Pull 捕获文件集合由同份 MapInfos 决定，内容与哈希一致；捕获期间集合/内容/配置变化使发布失败，要求重跑。
- [x] Snapshot、编译元数据和 pending 保留规范化目标身份；无 pending 改目标须显式 Pull，有 pending 先回原目标恢复。
- [x] 错目标、不可安全定位、未知/损坏格式明确拒绝；不添加工程 UUID、自动部分重读或旧格式迁移。

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

- [16：Workspace 操作互斥](16-workspace-operation-locking.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I11–I12、T1、T5；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
## Outcome

Clone/Pull 从同一份原始 Buffer 建立内容、集合和整文件 SHA256，发布前复查全部捕获输入、配置字节及规范化目标；观察到变化即失败，保留原 Snapshot/manifest/Generated/source。MapInfos 只以安全且唯一的正整数 ID 确定集合，空名称、缺失/不透明 parentId 及其他外部字段保留；共享 parser 不再因无关 parentId 丢图。未知或不完整 metadata、错误目标、损坏 Snapshot 和不可安全定位的 carrier 明确拒绝。manifest 安装失败恢复旧 Snapshot，orphan Snapshot 要求显式 Pull。

Snapshot、Compile Baseline/hash 和 pending 保存规范化 Project Root Binding。无 pending 更换目标须显式 Pull，使旧生成元数据失效；有 pending 先回原目标由 Push 恢复。错目标及未知/损坏/矛盾证据均保留现场；无工程 UUID、自动部分重读或旧格式迁移。18继续完整编译/类型依赖捕获，21继续全实时 Drift，22继续完整恢复/旧契约矩阵，本票不代为宣称完成。

验证基于合入集成0262a29后的最终产品提交b5f5d5a：Windows / Node22.23.0，typecheck、lint、format:check通过；全量23 files /225 tests通过（--maxWorkers=2，88.52s）；build通过；构建后Windows基线4 files /18 tests通过（32.09s）；结果入库后索引/来源/记录与基础往返1 file /3 tests通过。十个稳定验收ID、十份最终源码和十份最终构建记录以及两份真实失败记录入库，全部本票机器记录native:not-executed。此票无独立原生场景分配，最终E/R仍按后续票执行。

实现、红绿反例、状态矩阵、边界和原始记录指针见[17验收报告](../evidence/17-snapshot-capture-and-project-binding.md)。公开README与编写指南已同步。
