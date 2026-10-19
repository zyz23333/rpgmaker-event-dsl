# 23: Common Event 完整往返

Status: resolved
Blocked by: 22
Stage: S5
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 三种 trigger、独立 switchId、调用命令与 Entry Removal 贯通 Decompile→Compile／Check→Diff→Push。

## Scope

主要指令责任：E117。

原生证据分配：E1、R1/R4。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] Common Event 显式身份、name、none/autorun/parallel 和独立 switchId 准确表达；none 不丢槽、不新增禁用页条件的缺失 ID 例外。
- [x] E117 引用与调用通过实际 Workspace 检查；公共事件不强制地图/战斗声明、不建立调用图，调用上下文不确定按已决规则处理。
- [x] 真实源码求值和 Decompile→Compile/Check→Diff→Push 保留保存状态，移除保留 ID 孔；取得 E1、R1/R4 的分配场景证据。

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

### 首轮交付（59d274e，已被独立审查退回）

2026-10-20 首轮记录：实际24/25 integration 已合入，Common独立语义增量为 `mv-1.6.1/8`。干净产品候选 `b2c301d2dc19cc25a2265a6aa152f119d2367463` 的 Windows / Node22.23.0 `pnpm check` 36文件625/625通过，fresh `pnpm build` 15文件通过，完整 built Windows baseline 13文件348/348通过；默认2 workers和原始deadline未改。首轮check的624通过/1旧边界断言失败及更正后的13/13 focused、最终全量均原样保留。最终追加索引验证3/3通过。追加证据后的lint通过；两份已实际执行并按原字节保存的23原创工具有未用变量warning，另有既存22历史工具warning，没有修改已捕获工具来隐藏警告。

E1只读身份再核对34资源和E117/picker，并将当前Common16组100个source与100个built标准执行链接至产品比较；未声称编辑器UI观察。四个实际完整literal/product原生配对均通过：R1触发/调用、共享Parallel等待与停止、最低ID Autorun、R4同一Common的Map/Battle身份及self-switch行为。全部15disk carrier、完整实际loaded carrier、真实Push安装、fresh profile/PID/PPID/host/cwd/engine/log/exit均验证，原始首方数据只保留外部。

验收索引272行，Common21行；Common805份真实标准记录保留800通过及5份历史失败。原210与23自行合入25后的e199e95检查点268个requirement对象不变，e199e95已捕获的2122份旧证据按Git blob字节保持。97个source与15个dist对全部四次原生捕获逐文件和集合完全相同，另有完整外部不可变备份。详见[交付报告](../evidence/23-common-event-roundtrip.md)及[不可变/产物审计](../evidence/23-history/mv23-final-immutable-build-audit-v1.json)。本票只关闭自身分配，最终49–55和全规格完成仍另行验收。

### 审查修正后的重新交付

独立审查精确复现CommonEvents []→[null]及trigger -0→0两处静默重写，原READY停止合并；原脚本、三个原结果、旧59d274e、四组旧native与旧freeze保留。修正候选59de6e9745ce1508299ff5acbbf80c59fbf2c9b3仅在owned reader增加必有null槽0与categorical -0拒绝，不修改通用JSON负零能力，Contract仍mv-1.6.1/8。新的公开Workspace独立回归red3/普通[null]控制1、green7/7；失败重试两次均保持完整源/Project/Snapshot/manifest/config/Discovery业务字节，诊断分别准确定位CommonEvents[0]、CommonEvents[1].trigger并保留actual -0。原merger built reproducer在新dist三模式重跑也已证实拒绝/普通no-op。

本轮Windows/Node22完整pnpm check 37文件629/629、fresh build15文件、完整built baseline14文件352/352、最终索引3/3均通过。所有四组实际完整native pair重新执行通过，正常Scene/Input，15完整disk/实际loaded carrier、真实Push、fresh profiles/进程/host/engine/log/exit严格验证。E1再次只读34资源及E117/picker，并链接当前Common100source/100built和新增边界4source/4built记录。保持原deadline与2 workers；历史工具warnings不篡改，lint退出0。

当前274行=真实主integration233db54的251+本票23；e199e95的268属于本票checkpoint，不能称主integration已有268。真实主integration 1580份历史证据、被退回59d274e的272个requirement对象和2460份历史证据保持原Git blob字节；旧审计原样保留。Common1026份标准执行保留1018通过、8历史失败，未改失败状态。当前97source fingerprint 71b81c61c14e6850bcde4fb6d63a64eb2bdac445df4e0fb9c18867f01b07b3f5，15dist fingerprint 38b15fcf80d82448beaea685cd38ed7c6f5f08d45af65333631232ade1f124df，全部四组逐文件/集合匹配；新freeze位于C:/Users/Shuen/.codex/tmp/mv23-review-executed-build-preserved-471f85cc-617a-4ab6-9260-2749e36fe234。详见[当前交付报告](../evidence/23-common-event-roundtrip.md#复审修复候选的最终交付)与[v2审计](../evidence/23-history/mv23-review-final-immutable-build-audit-v2.json)。只关闭本票，最终49–55及整规格仍另行。

## Dependencies

- [22：Interrupted Push 内容恢复](22-interrupted-push-content-recovery.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2–I3、I7–I10、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [核心指令参数附表](../../complete-mv-events/research/command-parameters/core.md)。
- [原生事件数据](../../complete-mv-events/research/native-event-data.md)、[编辑器保存证据](../../complete-mv-events/research/editor-serialization.md)：Common Event 独立保存开关的依据。
