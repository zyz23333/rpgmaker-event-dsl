# 48: 全矩阵与三类事件集成

Status: ready-for-agent
Blocked by: 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47
Stage: S7
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 核对 105+45 的逐参数责任，执行混合嵌套、跨域引用、真实源码求值和完整 Workspace 安全自动化，形成原生回归候选。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：本票以可复核自动化/文档结果验收；不替代最终原生检查。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；最终集成候选的完整原生回归另由 49–54 交付。首方、静态、合成、真实 UI 与游戏观察按规格分别记录。

## Acceptance criteria

- [ ] 验收索引完整覆盖 105 事件族、45 移动码和 A1–A8 的逐字段/模式/边界/交互，检查遗漏、重复、孤立引用与尚未执行项。
- [ ] 实际 Discovery/源码求值和 Decompile→Compile/Check→Diff→Push 覆盖三类容器、混合嵌套、跨域引用、carrier、Reset、unknown/raw 与安全失败。
- [ ] Windows 全量适用检查与构建完成，记录候选版本与输入哈希；已有原生证据归档但不替代下一批最终集成回归。

### 共通要求（限本票适用范围）

- [ ] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

沿用规格 T1 的现有高层测试入口和 T3 的证据记录要求。测试断言可观察数据、诊断与文件状态，使用独立预期；不新增公开测试 API。涉及失败恢复时，同时验证源码、Project Root、Snapshot、manifest 与 Discovery 的最终状态。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [26：Timer 完整槽位往返](26-timer-saved-slot-roundtrip.md)。
- [27：Choices 完整分支往返](27-choices-complete-branches.md)。
- [28：Conditional 全条件与子体](28-conditional-all-modes-and-bodies.md)。
- [29：消息、滚动文本与注释](29-messages-scrolling-text-and-comments.md)。
- [30：Label、Script 与 Plugin Line](30-labels-scripts-and-plugin-lines.md)。
- [31：Control Variables 全操作数](31-control-variables-all-operands.md)。
- [32：金钱、物品与队伍变更](32-inventory-and-party-changes.md)。
- [33：45 类移动指令完整契约](33-movement-all-45-instructions.md)。
- [34：地图位置与 Location Info](34-map-locations-and-location-info.md)。
- [35：地图角色、动画与跟随者](35-map-characters-animations-and-followers.md)。
- [36：地图外观设置](36-map-appearance-settings.md)。
- [37：画面、天气、等待与影片](37-screen-weather-waits-and-movies.md)。
- [38：Picture 完整参数](38-picture-complete-parameters.md)。
- [39：音频播放与系统音频设置](39-audio-and-system-audio-settings.md)。
- [40：系统访问、窗口色与场景](40-system-access-window-color-and-scenes.md)。
- [41：角色生命、资源与状态](41-actor-resources-and-states.md)。
- [42：角色成长、技能与职业](42-actor-growth-skills-and-classes.md)。
- [43：动态装备槽](43-runtime-equipment-slots.md)。
- [44：角色文本与人物／载具图像](44-actor-text-and-character-images.md)。
- [45：敌人状态、出现与表现](45-enemy-state-and-appearance.md)。
- [46：Battle Processing 与战斗控制](46-battle-processing-and-control.md)。
- [47：Shop 完整商品结构](47-shop-complete-goods-structure.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I13（S7）、T1–T3、T5–T6；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。
