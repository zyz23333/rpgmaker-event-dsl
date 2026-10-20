# MV 1.6.1 原生事件完整支持：实施任务索引

Published: 2026-10-19
Parent: [实施规格](complete-mv-events-implementation-spec.md)
Original breakdown: [已确认拆分记录](ticket-breakdown-draft.md#comments)

2026-10-20，按用户“只优化当前剩余任务”的要求，将剩余工作改为按下方批次连续执行。调整时 55 张票中已有 29 张 resolved，剩余 26 张归为 11 个执行批次；前 8 批补齐能力，后 3 批完成集成、最终原生回归和交付审计。该统计是调整时的快照，当前状态仍以各独立文件为准。

原票继续承载各自范围、验收点、依赖、证据和完成状态；本索引负责组织执行。批次不是新票，没有独立状态，不替代成员票的验收记录。首次发布时的 55 张拆分与确认记录保留为历史依据，后续继续本 effort 时优先按本节选取执行批次。

当前平台范围仅为 Windows / Node 22；Linux 等其他平台不构成本阶段支持或验收要求。02 已调整为 Windows 自动化基线，任务编号和依赖保持不变。

## 当前执行批次

### 执行约定

- 默认按一个能力批次连续推进，在同一工作分支上处理成员票、集中审查和交付；成员票是验收清单，不再默认每张票各开一次完整实施会话。跨会话继续时保留该批次的上下文和未完成项。用户明确只指定某张票时，以用户指定范围为准。
- 启动前逐票检查 `Status`、`Blocked by` 和占用情况。某成员已有执行者或仍被阻塞时，跳过该成员并记录原因，其余可做工作继续；不因分组增加阻塞边。调整时前 8 批的所有原有前置均已 resolved，表中顺序只是推荐推进顺序。
- 开发期间运行受影响的测试和检查；批次交付前冻结同一候选源码、构建产物和输入，集中执行该候选的全量适用检查、构建及各成员分配的必要 E/R 场景。同一运行确实覆盖多个成员时，各票引用同一份结果并说明覆盖项，不为逐票关闭重复运行相同检查。
- 每张票仍须逐项满足原有专有及共通要求，才可改为 resolved。仅完成部分成员时只关闭已满足条件的票，其余保留准确状态；没有执行的场景不能借用同批其他场景的通过结论。最终候选之后有变更，按规格 T6 对受影响证据复验。
- 沿用既有验收索引、稳定需求 ID 和证据存放方式；共享准备、夹具和环境，保留各场景输入身份及实际结果，不建立批次专属的第二套覆盖矩阵或审计流程。最终原生回归仍覆盖全部 E1–E7 和 R1–R7，不以开发批次的局部证据替代。

<a id="batch-conditions"></a>

### 条件与分支

成员：[Conditional 全条件与子体](issues/28-conditional-all-modes-and-bodies.md)。

交付全部条件模式、Actor 子型、then/else 保存形态、上下文引用与 Gate。条件模式和结构组合较多，保留独立执行边界。

<a id="batch-variables"></a>

### 变量操作数与求值

成员：[Control Variables 全操作数](issues/31-control-variables-all-operands.md)。

交付全部 operand / Game Data 模式、值域及真实运行求值语义。操作数矩阵和求值次数有独立风险，保留独立执行边界。

<a id="batch-text"></a>

### 文本、脚本与角色展示

成员：[消息、滚动文本与注释](issues/29-messages-scrolling-text-and-comments.md)、[Label、Script 与 Plugin Line](issues/30-labels-scripts-and-plugin-lines.md)、[角色文本与人物／载具图像](issues/44-actor-text-and-character-images.md)。

集中交付行记录、单槽字符串、CR/LF、脸图索引与 None、Label 和脚本 Gate；共享文本及素材边界案例，分别验证各指令自己的记录规则和运行后果。

<a id="batch-inventory-shop"></a>

### 物品、队伍与商店

成员：[金钱、物品与队伍变更](issues/32-inventory-and-party-changes.md)、[Shop 完整商品结构](issues/47-shop-complete-goods-structure.md)。

集中交付物品类别和数量、队伍独立保存选项、商品顺序/价格/占位及父属续行；复用商品引用上下文和 Workspace 场景。

<a id="batch-map"></a>

### 地图位置与角色行为

成员：[地图位置与 Location Info](issues/34-map-locations-and-location-info.md)、[地图角色、动画与跟随者](issues/35-map-characters-animations-and-followers.md)。

集中交付位置/查询、角色目标、跟随者、动画与等待；共享 Map/Common 上下文和运行工程，分别保留坐标域、目标子集和停滞风险验证。

<a id="batch-presentation"></a>

### 画面、图片、音频与系统场景

成员：[画面、天气、等待与影片](issues/37-screen-weather-waits-and-movies.md)、[Picture 完整参数](issues/38-picture-complete-parameters.md)、[音频播放与系统音频设置](issues/39-audio-and-system-audio-settings.md)、[系统访问、窗口色与场景](issues/40-system-access-window-color-and-scenes.md)。

集中交付表现和场景命令的完整参数、独立保存值、None 与等待。复用 R6 工程、自制素材及共同准备；参数域和实际图像/声音/场景结果仍逐项证明，影片、场景切换等会干扰后续执行的案例使用独立初态。

<a id="batch-actors"></a>

### 角色状态、成长与装备

成员：[角色生命、资源与状态](issues/41-actor-resources-and-states.md)、[角色成长、技能与职业](issues/42-actor-growth-skills-and-classes.md)、[动态装备槽](issues/43-runtime-equipment-slots.md)。

集中交付 Actor 固定/运行选择、资源与成长操作数、EXP 和动态装备槽；复用角色、职业、装备及库存上下文，分别保留 R4/R7 场景和独立初态。

<a id="batch-battle"></a>

### 敌人与战斗控制

成员：[敌人状态、出现与表现](issues/45-enemy-state-and-appearance.md)、[Battle Processing 与战斗控制](issues/46-battle-processing-and-control.md)。

集中交付敌人 selector、状态与表现、战斗结果分支、Force Action 和 Abort Battle；共享 Troop/Common 上下文和战斗工程，单独核对各 selector 子集及调度后果。

<a id="batch-integration"></a>

### 全矩阵与三类事件集成

成员：[全矩阵与三类事件集成](issues/48-full-matrix-and-three-container-integration.md)。

依赖前 8 批的全部成员以及原依赖中的已完成票均 resolved，按原票执行。交付完整覆盖审计、混合场景和 Workspace 安全检查，形成绑定源码、构建与输入身份的最终回归候选。

<a id="batch-native-regression"></a>

### 最终原生回归

成员：[最终编辑器逆向与产品比较：容器与分支](issues/49-final-editor-containers-and-branches.md)、[最终编辑器逆向与产品比较：移动与保存状态](issues/50-final-editor-movement-and-saved-state.md)、[最终编辑器逆向与产品比较：文本、素材与 EXP](issues/51-final-editor-text-assets-and-exp.md)、[最终游戏回归：页、战斗与控制流](issues/52-final-game-pages-battles-and-control-flow.md)、[最终游戏回归：动态选择与地图位置](issues/53-final-game-runtime-selectors-and-locations.md)、[最终游戏回归：表现、脚本与数值](issues/54-final-game-presentation-scripts-and-values.md)。

依赖[全矩阵与三类事件集成](issues/48-full-matrix-and-three-container-integration.md)完成。在同一候选与已核对的原生环境上，统一准备和调度 E1–E7 逆向/产品比较及 R1–R7 实际游戏运行。两类工作均只依赖集成票，彼此不增加先后依赖；保留原六张票的独立场景、结果及关闭记录。该批可跨会话完成，复用环境准备不等于复用受前一场景污染的游戏状态。

<a id="batch-delivery"></a>

### 证据审计与完整支持交付

成员：[证据审计与完整支持交付](issues/55-completion-evidence-audit.md)。

依赖最终原生回归的全部六张成员票 resolved。核对有效证据、候选和复验状态、公开文档后，按原票门槛形成交付结论。

## 原始任务索引

下表保留 55 张原票与直接依赖，用于查询验收责任；执行组织以上方批次为准。首次发布时唯一无阻塞任务为[证据索引与最小往返样例](issues/01-evidence-index-and-roundtrip-fixture.md)，该历史前沿已不代表当前进度。

| 编号 | 任务 | 阶段 | 直接依赖 |
| --- | --- | --- | --- |
| 01 | [证据索引与最小往返样例](issues/01-evidence-index-and-roundtrip-fixture.md) | S0 | 无 |
| 02 | [Windows 自动化基线](issues/02-windows-automation-baseline.md) | S0 | 01 |
| 03 | [原生分支、尾标记与 Battle 初值逆向核对](issues/03-native-branch-markers-and-battle-defaults.md) | S1 | 01 |
| 04 | [原生移动记录与镜像逆向核对](issues/04-native-movement-records-and-mirrors.md) | S1 | 01 |
| 05 | [原生 Timer Stop 槽位逆向核对](issues/05-native-timer-stop-slots.md) | S1 | 01 |
| 06 | [原生 Transfer 初值逆向核对](issues/06-native-transfer-defaults.md) | S1 | 01 |
| 07 | [原生 Shop 初值与空商店逆向核对](issues/07-native-shop-defaults-and-empty-goods.md) | S1 | 01 |
| 08 | [原生脸图索引逆向核对](issues/08-native-face-index-behavior.md) | S1 | 01 |
| 09 | [原生单槽字符串逆向核对](issues/09-native-single-slot-strings.md) | S1 | 01 |
| 10 | [原生 EXP 临界值逆向核对](issues/10-native-exp-boundaries.md) | S1 | 01 |
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
| 49 | [最终编辑器逆向与产品比较：容器与分支](issues/49-final-editor-containers-and-branches.md) | S7 | 48 |
| 50 | [最终编辑器逆向与产品比较：移动与保存状态](issues/50-final-editor-movement-and-saved-state.md) | S7 | 48 |
| 51 | [最终编辑器逆向与产品比较：文本、素材与 EXP](issues/51-final-editor-text-assets-and-exp.md) | S7 | 48 |
| 52 | [最终游戏回归：页、战斗与控制流](issues/52-final-game-pages-battles-and-control-flow.md) | S7 | 48 |
| 53 | [最终游戏回归：动态选择与地图位置](issues/53-final-game-runtime-selectors-and-locations.md) | S7 | 48 |
| 54 | [最终游戏回归：表现、脚本与数值](issues/54-final-game-presentation-scripts-and-values.md) | S7 | 48 |
| 55 | [证据审计与完整支持交付](issues/55-completion-evidence-audit.md) | S7 | 49、50、51、52、53、54 |

## 覆盖与完成边界

- 105 类事件指令、45 类移动指令各有唯一主要责任票；详细分配在单票 Scope 中。共享结构与集成测试可复用同一场景，不重复计覆盖。
- 166 项专有验收点按已确认草案原样发布，各票另包含适用的共通验收要求和规范来源。
- 49–51 完成最终 E1–E7 逆向证据与产品输出比较，52–54 完成最终 R1–R7 实际游戏回归；03–10 的逆向前置不能代替最终产品输出验收。
- 55 依赖所有最终回归分支；所有其他任务均经依赖图通向 55。任务完成记录、原生结果和复验状态必须可追踪。
- 本次发布未实施产品、执行原生实验或关闭父规格；原设计票和父规格状态保持不变。

## 发布核验

已逐票对照确认稿：55 个标题、交付行为、阶段、直接依赖、主要指令责任、原生证据分配及 166 项专有验收点一致。依赖图无环且无多余传递边，唯一初始前沿为 01；105+45 指令无遗漏或重复分配。401 个本地链接及锚点有效，文档格式检查通过。父规格与决策地图的文件哈希和本轮发布前一致。

## Comments

### 2026-10-19 — 仅 Windows 的平台修订

按用户最新要求，已同步规格、确认记录、02 与全部涉及平台的任务验收条件；CI 切换为 Windows / Node 22。上方发布核验记录描述首次发布时的状态，父规格此后已按本次要求修订。当前仍有 55 张任务，初始前沿仍为 01；完整原生 E/R 验收与 Windows 安全必验继续保留。

平台修订核验通过：55 张票与修订后的确认记录一致，166 项专有验收点和 105+45 指令责任完整，依赖无环，492 个本地链接及锚点有效，当前任务中已无 Linux 或双平台必验要求。现有检查及构建已在本机 Windows / Node 22.23.3 通过（13 个测试文件、114 个测试）；此结果不代表计划中的新验收已经完成。

### 2026-10-19 — 编辑器验收改用逆向

按实施规格的用户验收修订，同步 03–10、49–51 及全票共通证据条款。03–10 按 reverse-engineer-anything 追踪实际编辑器初始化、加载、编辑确认与序列化；观察、推导及未决时序分开，首方原始输出仅在仓库外保留。49–51 将最终候选产品输出与独立契约和逆向结论比较；52–54 和 R1–R7 仍须实际 MV 1.6.1 / NW.js 游戏运行。依赖、领域行为及完成门槛保持不变，修订本身不关闭任务。上文首次发布统计保留为历史记录。

### 2026-10-20 — 剩余任务按能力批次执行

用户反馈实施拆分过细，并明确本次只优化当前剩余任务。核对原票后，29 张已 resolved，剩余 26 张按上方 11 个批次组织；每张未完成票新增 `Execution batch` 入口，后续以批次作为默认执行和集中交付单元。复杂的条件与变量矩阵分别保留独立边界，其余按共享上下文、参数规则和原生运行准备合并推进。

本次调整只改变剩余工作的执行安排；原票状态、直接依赖、验收点、证据责任及既有完成记录沿用。批次中共用的全量检查和构建结果须绑定同一候选，逐票引用并在各自要求满足后关闭；最终 E1–E7/R1–R7 与完整支持审计仍按规格执行。本次未领取或关闭实施票。
