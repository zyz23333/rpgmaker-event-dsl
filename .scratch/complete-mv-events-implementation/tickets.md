# MV 1.6.1 原生事件完整支持：实施任务索引

Published: 2026-10-19
Parent: [实施规格](complete-mv-events-implementation-spec.md)
Approval: [已确认拆分记录](ticket-breakdown-draft.md#comments)

用户已确认 55 张任务的粒度、范围和依赖。所有任务已逐票发布为 ready-for-agent；该状态表示规格充分，是否可领取仍须检查单票 Blocked by。任务状态以各独立文件为准。

发布时唯一无阻塞任务是 [01：证据索引与最小往返样例](issues/01-evidence-index-and-roundtrip-fixture.md)。01 完成后，02–10 可按环境条件分别领取。按依赖前沿推进，不要求编号全程串行。

当前平台范围仅为 Windows / Node 22；Linux 等其他平台不构成本阶段支持或验收要求。02 已调整为 Windows 自动化基线，任务编号和依赖保持不变。

## 已发布任务

| 编号 | 任务 | 阶段 | 直接依赖 |
| --- | --- | --- | --- |
| 01 | [证据索引与最小往返样例](issues/01-evidence-index-and-roundtrip-fixture.md) | S0 | 无 |
| 02 | [Windows 自动化基线](issues/02-windows-automation-baseline.md) | S0 | 01 |
| 03 | [原生分支、尾标记与 Battle 初值实验](issues/03-native-branch-markers-and-battle-defaults.md) | S1 | 01 |
| 04 | [原生移动记录与镜像实验](issues/04-native-movement-records-and-mirrors.md) | S1 | 01 |
| 05 | [原生 Timer Stop 槽位实验](issues/05-native-timer-stop-slots.md) | S1 | 01 |
| 06 | [原生 Transfer 初值实验](issues/06-native-transfer-defaults.md) | S1 | 01 |
| 07 | [原生 Shop 初值与空商店实验](issues/07-native-shop-defaults-and-empty-goods.md) | S1 | 01 |
| 08 | [原生脸图索引实验](issues/08-native-face-index-behavior.md) | S1 | 01 |
| 09 | [原生单槽字符串实验](issues/09-native-single-slot-strings.md) | S1 | 01 |
| 10 | [原生 EXP 临界值实验](issues/10-native-exp-boundaries.md) | S1 | 01 |
| 11 | [System 容量与无名引用贯通](issues/11-system-capacity-and-unnamed-references.md) | S3 | 02 |
| 12 | [地图与战斗引用上下文贯通](issues/12-map-and-battle-reference-context.md) | S3 | 11 |
| 13 | [Loop 与子体边界最小闭环](issues/13-loop-and-child-body-boundaries.md) | S2 | 02、03 |
| 14 | [共享 Movement Route 保存形态](issues/14-shared-movement-route-saved-shapes.md) | S2 | 04、12 |
| 15 | [raw、异常与递归 Gate 共用边界](issues/15-raw-validation-and-script-gate.md) | S2 | 13、14 |
| 16 | [Workspace 操作互斥](issues/16-workspace-operation-locking.md) | S4a | 12 |
| 17 | [Snapshot 一致捕获与目标绑定](issues/17-snapshot-capture-and-project-binding.md) | S4a | 16 |
| 18 | [编译输入捕获与 Freshness](issues/18-compile-inputs-and-freshness.md) | S4a | 17 |
| 19 | [Compile／Check 完整输出与发布](issues/19-compile-check-and-output-publication.md) | S4b | 15、18 |
| 20 | [Decompile 完整候选一次发布](issues/20-decompile-complete-directory-publication.md) | S4b | 19 |
| 21 | [Push 全输入漂移与写入复核](issues/21-push-full-input-drift-checks.md) | S4c | 20 |
| 22 | [Interrupted Push 内容恢复](issues/22-interrupted-push-content-recovery.md) | S4c | 21 |
| 23 | [Common Event 完整往返](issues/23-common-event-complete-roundtrip.md) | S5 | 22 |
| 24 | [Map Event 完整页与 note](issues/24-map-event-full-pages-and-note.md) | S5 | 22 |
| 25 | [Troop Event 所有权与 Reset](issues/25-troop-event-ownership-and-reset.md) | S5 | 22 |
| 26 | [Timer 完整槽位往返](issues/26-timer-saved-slot-roundtrip.md) | S6 | 05、23 |
| 27 | [Choices 完整分支往返](issues/27-choices-complete-branches.md) | S6 | 23 |
| 28 | [Conditional 全条件与子体](issues/28-conditional-all-modes-and-bodies.md) | S6 | 09、23、24、25 |
| 29 | [消息、滚动文本与注释](issues/29-messages-scrolling-text-and-comments.md) | S6 | 08、23 |
| 30 | [Label、Script 与 Plugin Line](issues/30-labels-scripts-and-plugin-lines.md) | S6 | 09、23 |
| 31 | [Control Variables 全操作数](issues/31-control-variables-all-operands.md) | S6 | 09、23、25 |
| 32 | [金钱、物品与队伍变更](issues/32-inventory-and-party-changes.md) | S6 | 23 |
| 33 | [45 类移动指令完整契约](issues/33-movement-all-45-instructions.md) | S6 | 09、24 |
| 34 | [地图位置与 Location Info](issues/34-map-locations-and-location-info.md) | S6 | 06、23、24 |
| 35 | [地图角色、动画与跟随者](issues/35-map-characters-animations-and-followers.md) | S6 | 23、24 |
| 36 | [地图外观设置](issues/36-map-appearance-settings.md) | S6 | 24 |
| 37 | [画面、天气、等待与影片](issues/37-screen-weather-waits-and-movies.md) | S6 | 23 |
| 38 | [Picture 完整参数](issues/38-picture-complete-parameters.md) | S6 | 23 |
| 39 | [音频播放与系统音频设置](issues/39-audio-and-system-audio-settings.md) | S6 | 23 |
| 40 | [系统访问、窗口色与场景](issues/40-system-access-window-color-and-scenes.md) | S6 | 23 |
| 41 | [角色生命、资源与状态](issues/41-actor-resources-and-states.md) | S6 | 23 |
| 42 | [角色成长、技能与职业](issues/42-actor-growth-skills-and-classes.md) | S6 | 10、23 |
| 43 | [动态装备槽](issues/43-runtime-equipment-slots.md) | S6 | 23 |
| 44 | [角色文本与人物／载具图像](issues/44-actor-text-and-character-images.md) | S6 | 08、09、23 |
| 45 | [敌人状态、出现与表现](issues/45-enemy-state-and-appearance.md) | S6 | 23、25 |
| 46 | [Battle Processing 与战斗控制](issues/46-battle-processing-and-control.md) | S6 | 23、25 |
| 47 | [Shop 完整商品结构](issues/47-shop-complete-goods-structure.md) | S6 | 07、23 |
| 48 | [全矩阵与三类事件集成](issues/48-full-matrix-and-three-container-integration.md) | S7 | 26、27、28、29、30、31、32、33、34、35、36、37、38、39、40、41、42、43、44、45、46、47 |
| 49 | [最终编辑器回归：容器与分支](issues/49-final-editor-containers-and-branches.md) | S7 | 48 |
| 50 | [最终编辑器回归：移动与保存状态](issues/50-final-editor-movement-and-saved-state.md) | S7 | 48 |
| 51 | [最终编辑器回归：文本、素材与 EXP](issues/51-final-editor-text-assets-and-exp.md) | S7 | 48 |
| 52 | [最终游戏回归：页、战斗与控制流](issues/52-final-game-pages-battles-and-control-flow.md) | S7 | 48 |
| 53 | [最终游戏回归：动态选择与地图位置](issues/53-final-game-runtime-selectors-and-locations.md) | S7 | 48 |
| 54 | [最终游戏回归：表现、脚本与数值](issues/54-final-game-presentation-scripts-and-values.md) | S7 | 48 |
| 55 | [证据审计与完整支持交付](issues/55-completion-evidence-audit.md) | S7 | 49、50、51、52、53、54 |

## 覆盖与完成边界

- 105 类事件指令、45 类移动指令各有唯一主要责任票；详细分配在单票 Scope 中。共享结构与集成测试可复用同一场景，不重复计覆盖。
- 166 项专有验收点按已确认草案原样发布，各票另包含适用的共通验收要求和规范来源。
- 49–51 完成最终 E1–E7 编辑器回归，52–54 完成最终 R1–R7 游戏回归；原生前置 03–10 的事实采集不能代替最终产品输出验收。
- 55 依赖所有最终回归分支；所有其他任务均经依赖图通向 55。任务完成记录、原生结果和复验状态必须可追踪。
- 本次发布未实施产品、执行原生实验或关闭父规格；原设计票和父规格状态保持不变。

## 发布核验

已逐票对照确认稿：55 个标题、交付行为、阶段、直接依赖、主要指令责任、原生证据分配及 166 项专有验收点一致。依赖图无环且无多余传递边，唯一初始前沿为 01；105+45 指令无遗漏或重复分配。401 个本地链接及锚点有效，文档格式检查通过。父规格与决策地图的文件哈希和本轮发布前一致。

## Comments

### 2026-10-19 — 仅 Windows 的平台修订

按用户最新要求，已同步规格、确认记录、02 与全部涉及平台的任务验收条件；CI 切换为 Windows / Node 22。上方发布核验记录描述首次发布时的状态，父规格此后已按本次要求修订。当前仍有 55 张任务，初始前沿仍为 01；完整原生 E/R 验收与 Windows 安全必验继续保留。

平台修订核验通过：55 张票与修订后的确认记录一致，166 项专有验收点和 105+45 指令责任完整，依赖无环，492 个本地链接及锚点有效，当前任务中已无 Linux 或双平台必验要求。现有检查及构建已在本机 Windows / Node 22.23.3 通过（13 个测试文件、114 个测试）；此结果不代表计划中的新验收已经完成。
