# 36: 地图外观设置

Status: resolved
Blocked by: 24
Stage: S6
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 地图名、tileset、战斗背景和远景的全部参数、引用、None 及独立保存值可准确往返。

## Scope

主要指令责任：E281、E282、E283、E284。

原生证据分配：E6/R6。

本票以完整安全写回作为可交付行为，依赖链包含 22。独立准备可按规格先做，但不能据此关闭本票。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] E281–E284 的显示开关、tileset、背景与远景全部字段、None、滚动参数和引用准确表达。
- [x] 显式 null 与错误类别/空名 Asset Reference 区分，保存独立配置，不扫描文件或增加素材漂移依赖。
- [x] 实际 Map Workspace 往返与 E6/R6 相关代表场景验证保存和表现，错误保留准确身份/路径。

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

- [24：Map Event 完整页与 note](24-map-event-full-pages-and-note.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I2、I4–I8、T1–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
- [系统、地图与表现参数附表](../../complete-mv-events/research/command-parameters/visual-map.md)。

## Answer

E281–E284 已完成正式编写、严格输入边界、已知 raw/native、精确诊断、实际 Discovery/evaluation 与 Map Workspace Check→Compile→Diff→真实 Push。E282 解析 Snapshot 中真实 Tileset ID，接受已有空名记录；E283 两个图像/None 独立必填，E284 保留全部独立配置、非激活滚动值及正负零。公开 API 文档与编写参考已同步。

实际验证使用 clean7407e5cefa87639030b0dde6ce56eeb87219924d、contract mv-1.6.1/10：Windows/Node22 全量 pnpm check 40文件/987测试通过；全新build通过；built Windows baseline 16文件/373测试通过。9项 E6 资源身份复核通过，10组实际当前产品/native 对照（地图、8组Battle背景及缺图Loading Error/E282停滞）20侧全部通过，各有15项严格身份/表现验证、15完整disk carriers、4必要generated carriers及11完整reference/seed保护检查。原始失败、环境拒绝、ENOSPC未完成准备和迁移证明均保留，不改写为通过。

验证与证据详见 [36交付记录](../evidence/36-map-appearance-settings.md#final-current-delivery--contract-mv-16110)、[归档清单](../evidence/36-history/archive-manifest-v1.json)；外部不可变最终审计 M:/Shuen/Codex/mv-events-implementation-20261020/ticket36-delivery-v4/mv36-final-audit-v2-1c865f97-79d6-42a8-942a-15d93f0fe393.json，SHA256 025695793a9840b419fa807a52215134ff18c99bf25d73800641afd86ea5895b。该审计保留286 incoming+10本票需求和所有先前证据历史，逐文件验证实际source/dist与冻结build一致，并复核1100-file reference和1100-file private seed内容/身份未变。原生执行仅关闭本票已分配E6/R6代表场景；49–55最终回归仍另行执行。

Codex另实际查看24张原生PNG的两张标注对照图，背景/远景类别与对应字面输入一致；保留随机TP和帧状态差异，不声称像素或RNG相同，也不记为human观察。图像身份与检查范围见36-history/provenance/native-png-observation-v1.json。

最终元数据检查：证据索引/schema/来源/fixture/历史运行引用在原10秒期限内通过（实际3.35秒），scoped lint 0 errors（6条仅归档工具原件unused-sync warnings），format183文件及git diff --check均通过。详见36-history/final-checks-record-v1.json。

追加最后两个原件工具后，history-only lint复核仍0 errors、7条仅原件unused-import warnings（含刚归档检查记录中的assert），先前6-warning原始结果保留。第二次最终产品审计4573原始blob检查及追加元数据审计1277项均通过，source99/test57/dist15逐字节未变；最终记录见36-history/final-ready-verification-v1.json。
