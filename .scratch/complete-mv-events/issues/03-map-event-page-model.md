# 地图事件备注与完整事件页应采用什么 DSL 模型

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: 01, 10
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[MV 原生事件数据的完整边界与版本基准是什么](01-native-event-data-baseline.md)、[原生事件属性的合法值与创建默认值是什么](10-editor-event-defaults-and-limits.md)。

基于原生事件数据基准，与用户确定地图事件 note、图像、页条件、触发、自主移动、速度频率、优先级、动画、固定朝向与穿透的完整 Schema-First DSL。

需要选择字段分组和术语、显式值与 Compiler Default 的边界、互斥表示与非法组合的表达方式、自主移动与 Set Movement Route 的共享模型，以及缺省字段在原生数据往返时的含义。不能以合并旧事件的隐式继承替代 DSL 的完整表达。

允许直接破坏现有 API，无兼容层或迁移说明。用具体原生事件例子与用户讨论；按 domain-modeling 及时记录已经共同确定的领域术语，只有符合条件的取舍才写 ADR。

## Research inputs

[原生事件的创建初值与属性控件范围](../research/event-defaults-and-limits.md) 已区分工厂模板初值、控件自身初值、可选范围、runtime 接受范围和真实 UI 行为。地图空页 priority 为 0，人物图选择会触发不同的优先级联动；不要把其中任一路径未经讨论地强加为 DSL 默认值，也不要用新建初值改写已有数据。

## Answer

用户于 2026-10-18 在逐项确认 Q1–Q13 后，最终确认以下完整模型作为本票答案。地图事件备注与完整页的 Schema-First DSL、固定默认值、保存状态、共享路线、引用例外、校验边界和反编译风格已经确定；长期取舍记录在已接受的 [ADR 0009](../../../docs/adr/0009-preserve-native-map-page-saved-state.md)。本票完成设计决策，产品实现与后续验收由相关票继续承接。

### Event 与 Page 的字段归属

Map Event 沿用显式 `mapId / id / name / x / y / pages`；`note` 是事件层的可选原样字符串，默认空字符串。pages 保持原数组顺序、非空，不为页引入独立身份；多个页满足条件时，沿用 MV 取最高页号的规则。既有地图身份、坐标边界和占位警告规则不变。

| Page 字段 | 正式表达与固定 Compiler Default | 原生输出 |
| --- | --- | --- |
| conditions | 六个固定槽，缺省整槽为禁用与模板保存值 | conditions 的 Valid 与值分别写入 |
| image.character | characters 类别的 Image Asset Reference 或 null；默认 null | characterName；null 编译为空字符串 |
| image.characterIndex | 整数 0..7；默认 0 | characterIndex |
| image.tileId | 整数 0..1023；默认 0 | tileId；>0 时显示图块 |
| image.direction | down / left / right / up；默认 down | 2 / 4 / 6 / 8 |
| image.pattern | 整数 0..2；默认 0 | pattern |
| movement.type | fixed / random / approach / custom；默认 fixed | moveType 0 / 1 / 2 / 3 |
| movement.speed | 整数 1..6；默认 3 | moveSpeed |
| movement.frequency | 整数 1..5；默认 3 | moveFrequency |
| movement.route | Movement Route；默认空路线，repeat=true、skippable=false、wait=false | moveRoute 的 list / repeat / skippable / wait |
| priority | below / same / above；默认 below | priorityType 0 / 1 / 2 |
| options.walkAnimation | boolean；默认 true | walkAnime |
| options.stepAnimation | boolean；默认 false | stepAnime |
| options.directionFix | boolean；默认 false | directionFix |
| options.through | boolean；默认 false | through |
| trigger | action / playerTouch / eventTouch / autorun / parallel；默认 action | trigger 0 / 1 / 2 / 3 / 4 |
| commands | 必填的 DSL Command 列表，可为空 | list；空列表编译为原生事件结束标记 |

image/movement/options 可以省略、传空对象或只写部分字段；未填写的字段各自补上述固定默认值。完整 Compile Output 不从旧事件继承属性。切换图像不改变 priority，切换 movement.type 不删除路线，图块显示不清理其他 image 字段。

### 条件槽与引用

| 槽 | 提供槽时必填的对象字段 | 整槽省略后的保存值 |
| --- | --- | --- |
| switch1 / switch2 | enabled、ref（switchRef） | false、ID 1 |
| item | enabled、ref（itemRef） | false、ID 1 |
| actor | enabled、ref（actorRef） | false、ID 1 |
| variable | enabled、ref（variableRef）、atLeast | false、ID 1、阈值 0 |
| selfSwitch | enabled、value（A / B / C / D） | false、A |

启用槽仍按 AND 组合；variable 始终表示 >=，atLeast 为整数 -99,999,999..99,999,999。两个开关槽保留独立位置。所有槽均检查结构、值类型和范围，禁用不豁免这些检查。

启用条件的引用必须解析到现有条目。仅禁用条件的显式非负整数 ID 可以没有目标，允许 0；省略槽产生的占位 ID 1 同样不做目标存在性检查。名称引用即使禁用也必须唯一解析，DSL-owned 名称不回退 Snapshot。这个例外不适用于路线指令或其他引用。

### 图像与 Movement Route

image 始终保存完整五字段的可表达状态。tileId>0 时显示图块；否则使用人物素材或空图。大人物图的非零索引和空图的非默认方向/图案不归零。人物素材限定 characters 类别，沿用 MV 对 $、!$、$! 等前缀的识别。

活动图块从当前 Map 的 tilesetId 找到 tileset，B/C/D/E 对应 tileId 范围 1..255 / 256..511 / 512..767 / 768..1023。所用 tileset 不存在时报错；对应图组名称为空时警告并保留。不增加实际图片文件或尺寸扫描。需要把 Snapshot 中已有的 tilesetId/tilesetNames 接入页面验证上下文，不能仅在单测中手工注入。

Movement Route 使用 `{ commands, repeat?, skippable?, wait? }`；commands 必填且可为空，标志的固定默认分别为 true / false / false。页的 movement.route 与 `setMovementRoute({ target, route })` 共用它，target 留在命令调用层。wait 在命令中控制解释器等待，在自主移动中只保存值；自主移动允许保存 wait=true。

2026-10-19 的[12号票Q4](12-native-saved-shape-model.md#answer)已接受共享路线增加 `terminator?: {parameters?: "absent" | "empty"}`，默认empty，M0缺indent；普通移动指令增加 `savedShape?: {indent?: "absent" | "null"}`，默认absent，parameters按有参/无参类别固定处理。该增量保持原生空白页默认M0的parameters:[]，但反编译不能省略原生M0缺parameters或指令indent:null的差异。完整合法组合见12号票；该票已最终确认并resolved，ADR0015已accepted，产品实现未完成。

保存路线即使处于非 custom 页中，也执行全部指令、引用和 Script Command Gate 校验，不做运行时可达性推断。移动子指令完整参数及原生命令结构仍由 05 票统一确定，本票不新增另一套子指令语法。

### 原样保存、生成风格与校验边界

note 不 trim，不改写换行、空白、标签顺序或重复标签；不另建持久化 meta。反编译仅省略能由固定默认值准确重建的字段；整个条件槽、整个路线仅在完全等于各自默认状态时省略。非默认禁用槽、未启用路线及图像保存字段必须输出。页面 commands 始终输出，包括 []。

未知枚举、非法字段类型及上述属性范围外的值报错。页列表为空时报错；超过 20 页警告；事件 ID 不增加 999 上限，仍按既有身份规则验证。非标准输入不裁剪、不静默重置或略过；06 票确定保留机制或拒绝策略及准确诊断阶段，本票没有批准 raw 页、未知字段透传或可观察状态的归一化。

### 代表性声明

以下展示未来 API 的预期形状，不表示当前产品已支持或已执行验证。路线子指令沿用当前已存在的对象写法；其全参契约由 05 票负责。

```ts
export const gateGuard = mapEvent({
  mapId: 1,
  id: 7,
  name: "门卫",
  x: 8,
  y: 5,
  note: "<Quest:gate>\n",
  pages: [
    page({
      conditions: {
        switch1: { enabled: false, ref: switchRef({ id: 17 }) },
      },
      image: {
        character: imageAsset({ folder: "characters", name: "People1" }),
        characterIndex: 2,
        direction: "left",
      },
      movement: {
        type: "fixed",
        route: {
          commands: [{ kind: "moveRight" }, { kind: "moveLeft" }],
          repeat: false,
        },
      },
      priority: "same",
      options: { directionFix: true },
      trigger: "action",
      commands: [],
    }),
  ],
});
```

本例允许开关 17 不存在，因为槽已禁用；改成 enabled=true 后必须存在。固定移动仍保存两步路线但不执行自主巡逻；路线本身仍受完整校验。显式 same 不受人物图像联动影响。未填写的速度/频率为 3/3，行走动画开启，踏步动画/穿透关闭。备注末尾换行保留。反编译可进一步省略本例中显式写出的默认 fixed/action，保留其他非默认保存值。

### 与后续票的交接

- 05：采用共享 Movement Route 及同一默认值/验证规则；继续确定全部移动子指令和原生续行/终止结构。
- 06：把本票的保存状态、note 原样文本、准确省略默认、禁用 ID 例外作为输入；继续确定未知/异常数据的保留或拒绝、报错阶段及 ADR 0003 的全局往返保证。
- 07：将完整页字段和当前 Map tileset 上下文接入真实 Workspace 编译/反编译/验证/同步路径，沿用现有写入安全边界。
- 08：覆盖省略值与显式默认、禁用 ID 0/缺失/名称引用、非 custom 路线与脚本门禁、空图朝向、大图索引、图块组缺失、note 精确字符串、20/21 页等代表性案例；安排真实编辑器与游戏验证。本票未执行这些验收。

## Comments

### 2026-10-18 — grill-with-docs 第一轮：Q1–Q3 已确认

用户回答“同意”，接受以下三项根决策。本票讨论仍在进行，尚未形成完整实施契约或最终 Answer。

1. **保留未启用的原生配置**：Map Event Page 的正式 DSL 模型同时表达启用状态与保存的配置。禁用条件仍能保存原槽值；非 Custom 自主移动仍能保存自定义路线。不能仅因配置当前不生效就在反编译或编译时删除，也不能依赖旧事件隐式合并。具体表示和验证规则留待后续轮次；本票要求交由 06 票统一协调往返契约。
2. **字段分组**：`mapEvent({...})` 的 `note` 位于事件层；`page({...})` 使用 `conditions`、`image`、`movement`、`priority`、`options`、`trigger`、`commands`。`movement` 承载自主移动类型、速度、频率和保存的路线；`options` 承载行走动画、踏步动画、固定朝向和穿透。`commands` 必填且允许为空。各组内部精确类型尚未决定。领域术语补充 Map Event Page，与 Battle Event Page 区分。
3. **固定 Compiler Defaults**：省略属性采用原生空白页基线，选图不隐式改变优先级。已明确的值为：`note` 空字符串、无图像、固定自主移动、速度 3、频率 3、优先级 Below、触发 action、行走动画开启，踏步动画/固定朝向/穿透关闭。已有编译器固定 priority=1 不作为新基线；新基线为原生 priorityType=0。人物图像也不自动改为 Same，作者需要显式设置。反编译已有数据必须表达实际值，只有能够由 Compiler Default 准确重建时才可省略。条件槽、图像和路线的内部默认值将在确定其模型时逐项确认。

待展开的分支：条件槽结构与禁用引用验证、图像模式与保存槽位、自主移动与 Set Movement Route 的共享边界、内部默认值与枚举命名、备注字符串契约、校验范围与页数限制，以及与 06 票的契约衔接。最终需用户确认完整共同理解后再解决本票；本轮不实现产品功能。

### 2026-10-18 — grill-with-docs 第二轮：Q4–Q9 已确认

用户回答“同意”，接受以下具体结构与边界。

4. **Page Condition Slots**：保留 `switch1`、`switch2`、`variable`、`selfSwitch`、`item`、`actor` 六个固定槽。提供槽时必须显式填写 `enabled` 和配置。开关/物品/角色使用 `ref`；变量使用 `ref` 与 `atLeast`（原生 >=，移除只有 `ge` 一种合法值的 `operator`）；独立开关使用 `value`。省略整个槽表示禁用并采用固定初值：引用 ID 1、独立开关 A、变量阈值 0。两个开关槽不合成数组。禁用引用的存在性校验留待下一轮。
5. **完整图像对象**：`image` 使用 `character`、`characterIndex`、`tileId`、`direction`、`pattern` 五个可省略字段，默认分别为 `null`、0、0、`down`、0。`character` 为人物 Asset Reference 或 null，null 对应原生空字符串。`tileId > 0` 显示图块，否则依据人物素材显示人物或无图像；即使显示图块，也保留人物素材和其他保存字段。不引入 `none | character | tile` 互斥 union 或另一个 `kind`，也不因另一模式生效而清空保存字段。
6. **共享 Movement Route**：`movement` 使用 `type`、`speed`、`frequency`、`route`；`type` 为 `fixed | random | approach | custom`，省略时为 fixed。route 与 type 独立，非 custom 类型仍能保存路线。路线对象使用必填且可为空的 `commands`，以及可省略的 `repeat / skippable / wait`（默认 true / false / false）。省略整个页路线使用空路线及这些默认值。Set Movement Route 改为 `setMovementRoute({ target, route })`，将现有平铺的路线设置收入 route 对象；target 不属于 Movement Route。wait 在 Set Movement Route 中控制解释器等待，在 Autonomous Movement 中只保留原生保存值，不产生解释器等待，允许表达已有 wait=true。共享对象及其默认值适用于两种使用方式；移动子指令的完整契约仍由 05 票继续讨论。新增领域术语 Autonomous Movement 与 Movement Route。
7. **正式命名**：`priority` 使用 `below | same | above`；`options` 使用 `walkAnimation`、`stepAnimation`、`directionFix`、`through`，各项可省略，默认 true / false / false / false。trigger 沿用 `action | playerTouch | eventTouch | autorun | parallel`。图像 direction 使用 `down | left | right | up`。
8. **备注原样保存**：note 保留字符串中的换行、空白、标签顺序、重复标签，不 trim、不解析重排、不改写换行；省略时为空字符串。不提供独立持久化的 meta 字段，原生 meta 由 MV 从 note 派生。
9. **校验基线**：速度要求整数 1..6，频率整数 1..5，普通人物索引整数 0..7，图案整数 0..2，变量条件阈值整数 -99,999,999..99,999,999；未知触发/优先级/朝向/自主移动类型报错。地图事件页列表仍必须非空；超过 20 页只警告；事件 ID 不增加 999 硬上限，继续检查身份合法性与唯一性。runtime 可读取超范围数字并不自动构成正式支持；反编译遇到此类数据必须定位，不能裁剪、重置或略过，由 06 票统一决定保留机制或拒绝策略。

当前未决：禁用条件的缺失引用与默认占位 ID、保存路线的引用/脚本校验、图块与地图 tileset 的关联、大人物图索引和未使用图像字段的校验、部分对象的补默认规则、与 05/06/07/08 的交接及最终共同理解确认。

### 2026-10-18 — grill-with-docs 第三轮：Q10–Q13 已确认

用户回答“确认”，接受以下边界。Q1–Q13 的设计分支已逐项确认，下一步为完整共同理解的最终确认；本票暂不标记 resolved。

10. **禁用条件的引用例外**：启用条件的 ID/名称引用必须解析到现有条目；禁用条件的显式 ID 允许保存非负整数（包含 0），不要求目标存在；禁用条件的名称引用仍必须唯一解析，不能猜测 ID。省略条件槽写入禁用状态与默认占位 ID 1，不校验该占位目标的存在性。负数、小数不因禁用而合法。允许 ID 0 是本次主动选择的保存能力，不是原生工厂初值或已证明的正常编辑器输出。修改 GLOSSARY 中所有 Explicit ID References 均须存在的绝对表述；例外仅限禁用条件槽，不扩展到所有引用。
11. **保存路线完整校验**：无论 movement.type 是否 custom，均校验保存路线的指令结构、参数、项目引用与 Script Command Gate。不存在的开关引用和未授权的 Script Input 都报错，不推测页的运行时可达性。禁用条件的保存值例外不扩展到 Movement Route；切换 fixed 不会免除损坏路线的检查。异常路线的其他保留机制由 06 票统一决定。
12. **图像校验边界**：character 非 null 时必须使用 characters 类别的 Image Asset Reference；null 只编译为原生空字符串。普通图、大人物图、无人物图的 characterIndex 统一允许整数 0..7，非零大人物图索引不归零。direction 与 pattern 无论人物/图块/空图模式都保留并校验；空图 direction 仍影响原生移动与朝向条件。tileId 要求整数 0..1023，0 不启用图块图像。活动图块所用地图 tileset 不存在时报错；对应 B/C/D/E 图组名称为空时警告并保留，因为运行时可能 Change Tileset。本票不新增图片文件存在性/尺寸扫描，仅验证素材引用结构和 Snapshot 图块集信息。大人物图识别沿用 MV 前缀规则，包含 $、!$、$! 组合。
13. **反编译风格与补默认**：生成简洁 DSL，仅省略能由固定 Compiler Defaults 准确重建的字段。条件槽仅在整槽等于禁用默认值时省略；非默认禁用条件、未启用路线、图像保存字段必须输出。image/movement/options 可只写非默认字段，空对象逐字段补固定默认。条件槽一旦提供，enabled 和配置必填；路线一旦提供，commands 必填，只有整条路线等于默认空路线才省略整个 route。页面 commands 始终输出，包括 []。不从旧事件隐式继承。

边界核对还确认：目前资产检查并不扫描图片文件或尺寸，Workspace 标准 Snapshot 不含资产清单；Map JSON 和 Tilesets.json 已在 Snapshot 中，但其 tilesetId/tilesetNames 尚未接入页面校验管线。以上为本次实现设计的输入，不表示产品已具备这些新增能力。

### 2026-10-18 — 最终确认与结案

用户对完整模型、代表性声明、校验边界与后续票分工回答“确认”。据此将本票标记 resolved，汇总转为 Answer，ADR 0009 转为 accepted，并在决策地图和 05/06/07/08 票中加入结果索引。

核验：对照前置研究与当前实现核对了字段归属、固定默认、引用解析、素材校验边界和路线门禁；文档通过 `git diff --check` 与相对 Markdown 文件链接检查。只修改设计文档，没有运行产品测试、真实编辑器或游戏验收；这些检查仍由 08 票安排。
