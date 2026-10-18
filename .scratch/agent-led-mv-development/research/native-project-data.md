# MV 原生项目数据与保真接管的事实边界

调查日期：2026-10-18（Asia/Shanghai）。这是《确认原生项目数据与保真接管的事实边界》的研究资产，服务于“agent 主导 MV 程序开发的能力路线”。本文记录事实、证据等级和待决问题，不确定新的作者接口、保真契约或实施方案。

**可确定的核心事实是：当前工具的命令覆盖面不能代表事件结构覆盖面。** 在本仓库基线中，Map Event 的 `note` 没有进入作者接口，Event Page 的图像、自主移动、优先级和显示／碰撞选项由编译器重建为固定值；这些字段在所核对的本地 MV 1.6.1 核心中直接参与运行。与此同时，地图布局、地图自身的 `note` 和 System Data 的其他属性通过 Snapshot carrier 保留，不能笼统称为“导入后全都丢失”。[R1][R2][R3][R4][R5]

## 证据来源和版本界限

| 证据 | 本次实际核对内容 | 能证明什么；不能证明什么 |
| --- | --- | --- |
| 本仓库源码 | 固定提交 `da26d4ef5aaa2b997c75eb51cc405985178b21e2` | 能确定此基线的公开作者接口、反编译和物化行为。本文未运行编译测试，也未执行游戏／插件。后续提交可能改变这些事实。 |
| 本地合法样本 | `F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project`；`Game.rpgproject` 内容为 `RPGMV 1.6.1`；`js/rpg_core.js:183` 明确写 `Utils.RPGMAKER_VERSION = "1.6.1"`，未发现 `RPGMAKER_ENGINE` community 标记 | 直接确认这个标记为 MV 1.6.1 的现存工程的数据及核心代码。本次没有验证其安装介质、原始发行文件签名或“从未修改”的来源链，也没有证明它是刚用零售编辑器新建的默认工程。项目存在第三方插件；这里仅读取原生核心文本，没有假定插件启用后的行为等同核心。 |
| 官方托管 CoreScript | `rpgtkoolmv/corescript` 固定提交 `182e31449707ba7e406db0485c44c2a9d11e2dcd`，tag `v1.3b` | [Utils.js:19–31](https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_core/Utils.js#L19-L31) 同时标记 `RPGMAKER_VERSION = "1.6.1"`、`RPGMAKER_ENGINE = "community-1.3b"`。它是可公开复核的上游实现，不能直接等同零售版 1.6.1。下文关键运行结论另由本地样本交叉核对。 |
| 官方在线 MV Help | [事件机制](https://rpgmakerofficial.com/product/MV_Help/page/01_09_01.html)、[事件设置](https://rpgmakerofficial.com/product/MV_Help/page/01_09_03.html)、[地图属性](https://rpgmakerofficial.com/product/MV_Help/page/01_07_03.html)、[系统设置](https://rpgmakerofficial.com/product/MV_Help/page/01_08_12.html)、[素材规格](https://rpgmakerofficial.com/product/MV_Help/page/01_11_01.html) | 第一方编辑器概念和语义说明；页面没有把内容锁定到 1.6.1，也不是 JSON schema。英语说明存在与代码不一致的措辞，不能独立替代版本明确的核心核对。 |

CoreScript 项目的 [README:8–21](https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/README.md#L8-L21) 明确说明社区开发及通过 KADOKAWA 分发的关系，并区分 development、RC 和 stable。因此，“官方托管”“代码内版本标记”“零售文件完全一致”是三件事，本文分别记录。

下面使用的本地样本源码定位与文件指纹见文末。本文只提交研究文字，不分发该游戏的资源或完整核心文件。

## Map Event 与 Event Page：原生数据形状

### 事件层和页面层

本地 `data/Map001.json` 的非空事件条目包含完整事件层字段 `id, name, note, pages, x, y`。其中 `id` 对应地图内事件数组的槽位，`x/y` 是地图坐标；`pages` 的数组顺序决定页面编号。`mapId` 由所在 `Map###.json` 文件确定，不是事件 JSON 内的字段。官方帮助说明事件 ID 按地图分配；本地核心用 `$dataMap.events[eventId]` 取事件。[N1][N2][H1]

本地三个事件的页面字段形状相同，共十三个字段：

| 页面字段 | 结构／取值 | 核心使用及当前工具行为 |
| --- | --- | --- |
| `conditions` | 下表所列固定槽位 | 启用的条件全部满足才候选；现有 DSL 能表达正常启用条件，但会重建未启用槽位的值。 |
| `image` | `{ tileId, characterName, characterIndex, direction, pattern }` | `tileId > 0` 时使用地图 tile 图像，否则使用角色素材；方向、图案影响显示。现有 DSL 无页面图像字段，编译器固定为空图。 |
| `list` | Raw Event Command 数组 | 每项 `{ code, indent, parameters }`；编辑器命令、分支和续行均在这里。当前工具编写和反编译的主要覆盖面。 |
| `moveType` | `0` 固定、`1` 随机、`2` 接近、`3` 自定义 | 自主移动逻辑读此值；编译器固定 `0`。 |
| `moveSpeed`, `moveFrequency` | 数字 | 页面切换时写入角色移动设置；编译器均固定 `3`。 |
| `moveRoute` | `{ list, repeat, skippable, wait }`；路线项 `{ code, parameters }` | 与事件 `list` 是不同命令容器；编译器固定空路线和固定三个标志。 |
| `priorityType` | `0` 在人物下方、`1` 与人物相同、`2` 在人物上方 | 影响重叠与事件碰撞／触发关系；编译器固定 `1`。 |
| `walkAnime`, `stepAnime` | boolean | 行走与踏步动画；编译器分别固定 `true/false`。 |
| `directionFix`, `through` | boolean | 方向固定、穿透；编译器均固定 `false`。 |
| `trigger` | `0` 操作键、`1` 玩家接触、`2` 事件接触、`3` 自动执行、`4` 并行 | 当前 DSL 可表达五种值；页面 helper 默认 `action`。 |

表中原生结构来自本地 JSON，语义由本地 `Game_Event.setupPageSettings`、自主移动逻辑与官方事件设置帮助交叉核对；编译器行为来自固定仓库基线。[N1][N2][H1][R2][R6]

`conditions` 的完整字段为：

```text
actorId, actorValid
itemId, itemValid
selfSwitchCh, selfSwitchValid
switch1Id, switch1Valid
switch2Id, switch2Valid
variableId, variableValid, variableValue
```

`Valid` 是该条件是否生效的标志；未启用条件仍在 JSON 中存有其编辑器选择值。本地样本未启用 ID 均为 `1`、`selfSwitchCh = "A"`、`variableValue = 0`。编译器对未启用 ID 写 `0`。这足以证明现有往返不是 JSON 值完全保留；按所查原生条件判断，未启用 ID 不影响页面是否满足条件，但会改变重新打开编辑器时可看到／启用的历史选择。[N1][N2][R7]

### 默认值必须分清来源

本地无图事件 `events[1].pages[0]` 的值为：

```text
image = { characterIndex: 0, characterName: "", direction: 2, pattern: 0, tileId: 0 }
moveType = 0, moveSpeed = 3, moveFrequency = 3
moveRoute = { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }
walkAnime = true, stepAnime = false, directionFix = false, through = false
priorityType = 0, trigger = 0
list = [{ code: 0, indent: 0, parameters: [] }]
```

这些是**已存在样本值**，不是经本次验证的“所有 1.6.1 新建事件默认值”。特别是该样本 `priorityType = 0`，而编译器固定 `1`；样本事件 `events[2]` 已有角色图像、`moveSpeed = 2` 和 `stepAnime = true`，编译后对应字段将被重建。这里的结论由读代码直接推得，尚未运行一次真实往返或游戏回归。[N1][R2]

当前 **Compiler Default** 是仓库自己的已实现行为，不应被描述成“继承原事件”或“已经核对的编辑器默认值”。新建空白页、选择角色／tile 图像、清空页面、复制页面和 Quick Event Creation 可能产生不同的编辑器状态；本次没有从精确零售版本逐项创建这些样本。

### 影响保真判断的运行语义

1. **页面顺序具有运行意义。** `findProperPageIndex` 从数组末尾向前找第一个满足条件的页面。所有启用条件按 AND 组合；若没有匹配页，页面被清空、图像消失并设为穿透。因而不能只比较一页命令，或在生成时随意重排页面。[N2；上游公开对照 U1]
2. **页面变量条件是 `>=`。** 本地核心用“小于阈值则失败”，不是严格大于。官方英文帮助写 “greater than the fixed value”，这里以版本明确的代码为准；现有 DSL 的 `operator: "ge"` 与核心一致。[N2][H1][R1]
3. **Self Switch 的身份是地图、事件和字母的组合。** 本地核心构造 `[mapId, eventId, selfSwitchCh]`，所以事件或地图 ID 重编号可能改变行为。显示名无法替代 Entry Identity。[N2][R8]
4. **自主移动不是 Set Movement Route 事件命令。** 页面先安装 `moveRoute`，`moveType = 3` 时自主调用路线；`updateSelfMovement` 还受事件锁定、距离屏幕和移动频率影响。命令 `205` 则强制角色移动路线，并在 `wait` 为真时让解释器等待。拥有 `setMovementRoute(...)` helper 并不能保存页面自主移动。[N2][N3][R2]
5. **路线标志有行为作用。** `repeat` 会循环路线；移动失败时只有 `skippable` 为真才继续索引。对于等待中的强制路线，这些条件可能影响等待何时结束。页面 `moveRoute.wait` 也属于原生持久化结构，但所查页面安装路径没有读取它来等待；不能把该字段在两种使用位置的效果说成完全一样。[N3]
6. **`note` 并非可安全删除的开发备注。** 本地 `DataManager.onLoad` 对地图、Map Event 和数据库中带 `note` 的条目生成 `meta`；`<Flag>` 得 `true`，`<Key:Value>` 得字符串。插件可以读 `note` 或派生 `meta`。反过来，`meta` 是加载时派生数据，不是本地原始事件 JSON 字段。本次没有证明任何具体插件对此项目的使用约定。[N4；上游 U2]
7. **事件注释与事件 `note` 是不同载体。** `108/408` 是事件命令列表中的注释，核心保存到解释器 `_comments`；它们并不替代事件层 `note`。`355/655` 是 JavaScript 执行片段，`356` 拆分字符串后进入可由插件覆写的 `pluginCommand`。保留参数不等于已经理解其依赖或副作用。[N3]

## 标准数据库、System Data 和地图数据

### 标准文件与身份关系

本地核心 `DataManager._databaseFiles` 和公开上游列出相同的十四类启动数据文件：`Actors.json, Classes.json, Skills.json, Items.json, Weapons.json, Armors.json, Enemies.json, Troops.json, States.json, Animations.json, Tilesets.json, CommonEvents.json, System.json, MapInfos.json`。地图本体另按地图 ID 加载 `Map%1.json`，最少补到三位数字。标准列表不包含任意插件 JSON、插件参数文件或图像／音频文件。[N4][U2]

除 `System.json` 外，本地这些标准文件为带槽位的数组，样本首槽为 `null`；常规数据库条目有 `id/name`。运行时大量使用 `$dataX[id]`，因此需要保留槽位和 ID 的对应关系，不能删除数组空洞后整体压缩。`System.switches/variables` 则是按槽位表示 ID 的名字字符串数组，通常没有条目对象的 `id` 字段。Map Event 身份是 `(mapId, eventId)`，Common Event 为其库内 ID，Troop 内敌人索引又是不同的运行选择器。[N1][N3][N4][R8]

下面列出影响路线的结构和引用，不把一个样本的全部字段库存当作闭合 schema。`note` 不应无条件添加到原生没有它的类别；例如所查 Troops、Animations、CommonEvents 条目没有 `note`。

| 文件 | 结构／关系 |
| --- | --- |
| `Actors` | `classId → Classes`；`equips` 按装备槽关联 Weapons／Armors；图像字段是分类素材名；另有 traits、等级和 note。 |
| `Classes` | `learnings[] = { level, note, skillId }`；`skillId → Skills`；`params` 为参数成长表，另有 expParams、traits、note。 |
| `Skills` | `animationId → Animations`（存在特殊哨兵）；`stypeId/requiredWtypeId* → System` 类型表；含 damage、effects、费用、作用范围和 note。 |
| `Items` | `itypeId` 为种类枚举；含 damage、effects、价格、消耗设置和 note。 |
| `Weapons / Armors` | `wtypeId/atypeId/etypeId → System` 类型数组；含 params、traits、note；武器另有 animationId。 |
| `Enemies` | `actions[].skillId → Skills`；行动条件由 `conditionType/conditionParam1/conditionParam2` 组合解释；`dropItems[].kind` 决定 `dataId` 是物品／武器／防具，另有概率分母 denominator。 |
| `Troops` | `{ id, members, name, pages }`；`members[] = { enemyId, x, y, hidden }`，`enemyId → Enemies`；战斗页有 `conditions, list, span`，不等同 Map Event 页。 |
| `States` | 含解除时机、持续回合／步数、限制、动作／图标、traits 和 note；这些索引／枚举不都是数据库引用。 |
| `Animations` | 图像名关联 `img/animations`；`frames` 为 cell 数据；`timings[]` 含 `flashColor, flashDuration, flashScope, frame, se`。 |
| `Tilesets` | `{ id, flags, mode, name, note, tilesetNames }`；九个素材名关联 A1–A5、B–E；`flags[tileId]` 决定通行／地形属性。 |
| `CommonEvents` | `{ id, list, name, switchId, trigger }`；`0` 无触发、`1` 自动执行、`2` 并行；自动／并行开关是 System switch ID；命令 `117` 可显式调用。 |

表的直接来源为本地相应 `data/*.json` 第一个非空条目；版本与全部指纹列在文末。[N1][N5] 行动、装备、技能和物品不能按“凡是以 `Id` 结尾就验证为正数”的规则泛化：`traits = { code, dataId, value }`、`effects = { code, dataId, value1, value2 }`、`damage = { critical, elementId, formula, type, variance }` 的数值含义依赖代码和上下文。比如样本技能伤害 `elementId = -1`，效果中存在 `dataId = 0`；普通 Project Data Reference 规则不足以概括所有哨兵值。[N5]

`damage.formula` 是执行表达式；本地 `Game_Action.evalDamageFormula` 使用 `eval`，并提供 `a/b/v` 上下文。所以完整数据库编写的执行输入面不只在事件 Script Input；是否沿用现有 Script Command Gate 或另建规则，是后续边界决定，本文不替代该选择。[N3：1690 起][R1]

### System Data

本地 `System.json` 是单一对象，包含起始队伍／位置、载具、类型／属性名表、游戏选项、标题与战斗素材、音效、用语、测试设置、版本号，以及 `switches/variables` 名字数组。`partyMembers` 引用 actor ID；`startMapId/startX/startY` 和各载具位置指向地图坐标；`testTroopId` 指向 Troops；`elements/skillTypes/weaponTypes/armorTypes/equipTypes` 服务于数据库相应 ID；图像字段、BGM／ME／SE 对象关联分类素材名。[N1][N4][H2]

`switches/variables` 的字符串是开发名字，实际值存于 `$gameSwitches/$gameVariables`，新游戏分别表现为 false／0。无名槽位仍然可以有 ID，运行时 `setValue` 的合法范围依赖数组长度。因此“无名项”与“没有这个槽位”不是同一件事。[N3：523–575、4868 起][H2]

核心 `DataManager.onLoad` 还读取 `hasEncryptedImages/hasEncryptedAudio`；这些字段不在所查开发工程的 System 顶层中。由此能证明“本地开发样本字段集合”没有囊括部署变体；还不能据此列出 1.6.1 部署器写入的全部字段和默认值。[N4：146–149]

### 地图目录与布局

本地 `MapInfos.json` 的每个非空条目为 `{ id, expanded, name, order, parentId, scrollX, scrollY }`。`parentId` 表达编辑器地图树关系，并不是地图传送连接；`name` 也不同于地图本体的运行显示名 `displayName`。当前工具 `parseMapInfos` 只投影 `id/name/parentId`，Snapshot 仍保留原文件。[N1][R9][H3]

本地 `Map001.json` 顶层完整字段集合：

```text
autoplayBgm, autoplayBgs, battleback1Name, battleback2Name, bgm, bgs,
disableDashing, displayName, encounterList, encounterStep, height, note,
parallaxLoopX, parallaxLoopY, parallaxName, parallaxShow, parallaxSx,
parallaxSy, scrollType, specifyBattleback, tilesetId, width, data, events
```

- `tilesetId → Tilesets`；`bgm/bgs = { name, pan, pitch, volume }`；`encounterList` 关联 Troops 和可选 Region；滚动类型 `0/1/2/3` 分别为无／纵／横／双向循环。`parallaxShow` 是编辑器显示设置，不能据其直接判断游戏显示。[N1][N3：5663–5691][H3]
- `data` 是按 `(z * height + y) * width + x` 索引的扁平数组；原生地图四个 tile 层为 `z = 0..3`，`z = 4` 存阴影位，`z = 5` 存 Region ID。地图不是只有一个“地面 tile”的二维数组。[N3：5926–6006][N6：4866–4879]
- tile ID 不是资源文件 ID。核心将普通 tile 的 B/C/D/E/A5 分段，并以 `2048 + kind * 48 + shape` 编码 autotile；`Tilesets.flags[tileId]`、所选 tileset 的九个素材名一起解释地图数据。[N6：5273–5301]
- 通行除四方向阻挡位外，还涉及上层星标、tile 事件、人物碰撞、当前页面等。本地 `Game_Map.allTiles` 把 tile 事件加入地块检查；`checkPassage` 按顺序读取 flags。静态地块检查不是运行时可达性或触发保证。[N3：5911–6006][R10]

### 资源名与数据库 ID 的区别

素材字符串通常是**分类目录内的文件名 stem**：如 `image.characterName` 对应 `img/characters/<name>.png`，`Tilesets.tilesetNames` 对应 `img/tilesets`，角色脸图对应 `img/faces`。本地 `ImageManager.loadBitmap` 对非空名编码并加 `.png`；空名返回空图。角色素材前缀 `!`、`$` 有核心含义，不能把它们当可清理的文件名装饰。音频对象的 `name` 也不是数据库 ID，格式由运行环境选择。[N4：803–867][H4]

这支持现有术语对 Project Data Reference 与 Asset Reference 的区分；它不决定未来数据库作者接口一定要复用哪一套 helper。

## 当前 decompile / compile 的保留、重建与遗漏

以下均是 `da26d4e` 基线事实，主路径为 `clone/pull → DSL Decompilation → Compile → Diff/Push`。Snapshot 保存完整标准文件和纳入目录的地图文件，并不意味着所有字段都进入 DSL。[R3][R4][R11]

| 内容 | 目前行为 | 保真意义 |
| --- | --- | --- |
| Map Event `id/name/x/y`、页面顺序 | 反编译读取并输出；按声明编译重建 | 正常数据可表达这些字段；`mapId` 来自 MapInfos 遍历和文件上下文。 |
| Map Event `note` | 反编译事件投影不读取；作者 schema 没有；编译不输出 | 原字符串消失，加载时产生 metadata 的条件也改变；无法用事件 `comment(...)` 等价补回。 |
| Event Page `conditions/trigger/list` | 反编译和编译的页面主体 | 有正常原生语义覆盖，但不是所有原始字段值原封不动保存。 |
| 页面图像、自主移动、选项、优先级 | 反编译页面投影只留三字段；编译写固定值 | 现有事件即使不改命令，也会改变这些非默认行为；没有页面／事件结构级 raw passthrough。 |
| 未启用条件的 ID | 反编译只输出启用条件；编译对无条件写 `0` | 按原生运行判断可能等价，编辑器状态和 JSON 值不同。 |
| Raw Event Command | 已知合法形状优先 helper；未识别／不匹配形状退到 `rawDslCommand`，保留 `code/indent/parameters` | 是命令级 escape hatch，不能承诺插件执行语义、未知附加字段或事件层结构。 |
| 列表结束标记与非法数据 | 反编译移除 code `0`；编译加标准终止项；无效对象会被过滤、缺失页面可补空页 | 已存在规范化／容错，不是 byte-for-byte 往返。若要严格异常报告，需要后续决定。 |
| Common Event | 输出 `id/name/trigger/switch/list`；仅非 `none` trigger 输出 switch；未指定时编译 `switchId = 1` | 未启用 trigger 的旧 switch 选择未保留；未知扩展属性不保留。 |
| System switch/variable 名字 | 只对非空名字生成声明；按最高 ID 与原数组长度重建字符串数组 | 原数组长度保留；空槽位重建为空串；运行值本来不在此 JSON 中。 |
| 地图非 `events` 字段 | `{ ...snapshotMapData, events }` | `data/width/height/tilesetId/note/...` 随 carrier 保留；当前无法通过作者接口新增／改变它们。 |
| System 非 switch/variable 属性 | `{ ...snapshotSystem, switches, variables }` | 其他系统设置随 carrier 保留；这不等于已经提供系统配置编写能力。 |
| 其他标准数据库、MapInfos | Snapshot 捕获；没有对应 DSL-Owned Declaration，也不在 Compile Output 物化表内 | 可以作为只读引用基础；不能称已支持编写或回写。 |
| 任意插件数据和游戏脚本／资源 | 不在 Standard Project Data Snapshot 计划内 | `clone` 不等于完整游戏备份或插件依赖采集。 |

证据：公开 schema 与 authoring helper [R1][R6]；`readMapEvents/readMapEventPages` 的字段投影、过滤和空页回退 [R3]；反编译 source 输出 [R4]；编译器固定字段 [R2]；条件、raw 命令和结束项 [R7][R12]；命令 fallback [R13]；carrier 和全域重建 [R5]；Snapshot 标准文件表及地图选择 [R11]。

还需避免一个工作流误解：物化并非“只覆盖源码里提到的几项，其他旧事件自动留在原位”。地图 events、CommonEvents 和系统名字域按**完整声明集**重建数组；Snapshot 有而声明没有的条目产生 Snapshot-Only Owned Entry，属于删除候选，Push 另有 destructive 检查。当前 ADR-0003 与 ADR-0004 就采用全域接管与保留 ID 空洞的模型。[R5][R8][R14] 因而保真导入对已有工程尤其关键，不能用选择性复制一页命令代替接管验证。

现有 [decompiler 测试](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/test/decompiler.test.ts#L667) 对顶层编辑器命令族和移动路线子命令有专门覆盖；这证明测试意图集中于命令表达。仓库 [Map Inspection fixture](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/test/map-observation-fixture.ts#L69) 是程序构造样本，写入 `RPGMV 1.6.2`，不能拿来证明零售 MV 1.6.1 默认值。本文未运行测试，未把现有测试通过状态当作新的实证。

## 可候选的后续验证样本

以下是支持后续人工决定的样本集合，不是已经批准的验收契约：

1. **精确版本来源样本**：记录 Windows MV 编辑器版本、安装模板及核心文件指纹，分别保存新建／清空／选角色／选 tile 的页面，以及 Door／Treasure 等快速事件，核对默认值和编辑器再次保存后的规范化。
2. **事件结构矩阵**：五种 trigger、三种 priority、四种 moveType、各显示／穿透选项、角色／tile／无图、非默认 direction/pattern、空／非空 note、自定义路线及两个开关等全部条件；包含高页覆盖低页、无页满足、ID 空洞与重复显示名。
3. **隔离的往返样本**：在复制的受控工程中做 `clone → decompile → compile → diff`，分别观察 JSON 值、编辑器重新打开／保存结果和运行行为；不能只以命令列表一致判定事件保真。
4. **Note 与未知扩展**：最小插件只读取 event/map/database note 或 metadata；另放一个未知字段，观察当前工具是否报告、保留或删除。这里涉及的通用策略须由保真契约决定。
5. **跨容器引用**：Common Event 调用、Troop 战斗页、Enemy action skill、drop kind/dataId、skill/item effects、System 起始位置、地图 encounter Region、资源 stem 和特殊哨兵值；先确定纳入范围再生成边界样本。
6. **同版本运行回归**：宝箱／委托领取一次、离图返回、保存并读回当前版本状态；这些可检验 ID、Self Switch 与进度保持。按用户已确认的路线，跨版本旧存档迁移不作为默认门槛。

## 未知项与后续决策指针

| 尚未确定 | 本次能说到哪里 | 后续定位 |
| --- | --- | --- |
| 零售 Windows 1.6.1 全部编辑器默认值与部署变体 | 有标记为 1.6.1 的合法工程与核心，可以证实所读行为；没有原始安装来源链或编辑器操作矩阵 | 《确定已有事件保真接管的支持契约》需决定何种样本／来源足够建立兼容基线。 |
| 保真定义是 JSON 值、编辑器状态、运行语义中的哪些层 | 已列出现有三类差异和直接行为丢失 | 《确定已有事件保真接管的支持契约》；《确定首个完整事件功能的验收门槛》。 |
| 未知字段、未知 note 约定、插件修改原生方法的处置 | 原生 note 会派生 metadata；未知参数仅靠数值引用分析无法理解 | 保真和插件边界决策，不能在研究票里默认承诺“任意插件保真”。 |
| 数据库范围及脚本公式的输入策略 | 已识别尚不可编写的类别及 JS-bearing `damage.formula` | 《确定数据库与系统配置的编写边界》。 |
| 地图作者接口是否涉及 MapInfos／tileset／Region／布局 | 已识别它们不同的数据结构和运行关系 | 《确定功能所需地图数据的编写边界》。 |
| 源码／编辑器对账时保留未启用编辑器选择值的要求 | 现有语义投影会规范化这些字段 | 《确定编辑器改动对账与源码冲突的处理契约》。 |
| 脚本与插件对变量、ID 和资源的动态引用 | 不可能从字段后缀或静态 command 列表直接完整证明 | 《确定跨事件影响分析与 ID 使用的查询契约》需明确查询结果的可证范围。 |

这些候选验证工作不自动进入本轮实施。本次没有发现必须改变“Windows 优先、完整事件功能闭环”的用户路线事实；但精确版本证明、原生 note、页面结构、Troop 与 Map Page 差异，以及数据库内执行公式，都值得在对应人工决策票中显式考虑。

## 本地样本的可复核定位与指纹

本节所有路径相对于本地只读样本根 `F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project`。JSON 在工程内通常为一条目一行或紧凑格式，下面同时给出 JSON 路径和核心函数行号，避免仅凭格式化显示引用错行。

- [N1] `data/Map001.json`：`events[1..3]`、各 `pages[0]`；`data/MapInfos.json`：`[1]`；`data/System.json` 顶层与各 ID 数组。
- [N2] [rpg_objects.js:8436](/F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project/js/rpg_objects.js:8436)：`Game_Event.initialize/event`；8512 起自主移动；8610–8711 页面选择、条件和设置。
- [N3] [rpg_objects.js:523](/F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project/js/rpg_objects.js:523)：Switch／Variable；1690 起伤害公式；3432 起 Actor；4868 起初始队伍；5546 起地图事件实例；5911–6006 地图层与通行；6174 起公共自动事件；6201–6236 并行公共事件；6917 起路线设置；7192–7209 路线循环／跳过；9173 注释；9368 公共事件调用；9783 强制路线及等待；10494–10514 Script／Plugin Command。
- [N4] [rpg_managers.js:48](/F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project/js/rpg_managers.js:48)：标准数据文件；106 起地图加载；130–168 note metadata；803–867 分类图片加载。
- [N5] `data/{Actors,Classes,Skills,Items,Weapons,Armors,Enemies,Troops,States,Animations,Tilesets,CommonEvents}.json` 各第一个非空条目和其嵌套数据。
- [N6] [rpg_core.js:183](/F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project/js/rpg_core.js:183)：版本标记；4866–4879 tile／阴影层读取；5273–5301 tile 常量和 autotile 编码。

| 文件 | SHA-256 |
| --- | --- |
| `Game.rpgproject` | `4EAE50E6C5388B12856CCA9B6955192C8F04FC913BF37832B3C061BCFEBC5118` |
| `js/rpg_core.js` | `9AD9914CC421AF6D054C3F01B022B7383863B047EC3F6F76AA897E6CFBF864C6` |
| `js/rpg_objects.js` | `2D43DD9D8974C88A1B82FFA493D6D8A02C4CE1D0DFC8F05E6C0AB731E3F0573E` |
| `js/rpg_managers.js` | `B3D5C746CF52234BDD34AF746DBF3CAECF96BB3477CC6D24121C4A1A11241114` |
| `data/Actors.json` | `D75B1E928E64343BC761316030C5FC692284A6032F6A841A5C07F88BC9C9B132` |
| `data/Animations.json` | `AEEA23A6290B14202DC41982427EA78FACDA1F4E7A57A82E5D6BE5E7D4BBCB24` |
| `data/Armors.json` | `45B3DF06BFD2F99EAEC7F5B05ACE3BCE6522D6D2F388BCA26F791B6B6D8525C1` |
| `data/Classes.json` | `E5C8053B1759EB7EBE325B3331209AD11164DAA6D0F01B2EB9CD9B7812CB9F88` |
| `data/CommonEvents.json` | `B90DDFF49AA5950C8E3CDC245A70285F367F886CAED26B5AE4A1DA6D41197B80` |
| `data/Enemies.json` | `0BE1BB28BD3FAEF61D98923DCAC8E37115B0225F6D92ECD4A22C9D0D1E685C93` |
| `data/Items.json` | `4EB71F4D281A7D1022D9A8A677EE146BED8E8C5DF99325890CEB65D9022200F6` |
| `data/Map001.json` | `A7582A8279397D80DCD2DEB3B93A7043E5AC90E358AD36ABD58D69747F2D5112` |
| `data/MapInfos.json` | `944328BA48FB58BE0D05E44D9BAEC955B91A149C119430897F749B850F862B62` |
| `data/Skills.json` | `11E6D55E657C8D949C9448F765BC179DA889C72EBDA7F9802D0F2DF581259982` |
| `data/States.json` | `EC46FE60E73C35E22C3393911365385570BB15C2B51B03BEE850CA315334E6E7` |
| `data/System.json` | `317C1B546C339FEF261A2BB1B465D5C70C961573CF57DDAE89DDB309345CC89C` |
| `data/Tilesets.json` | `6C464F1EB3C1951BBEDCF7E7D15F8EA7F50946F1CDB6B3DF3D21A62ACD500789` |
| `data/Troops.json` | `18103BBB9BF9E2339A807B32DFF09DFA8B9424F31F8276ABAB9AB1C3F0B989FE` |
| `data/Weapons.json` | `0D94789174DD2F9735A95A321268C39D6A3A5CCDB09CC21AA98D82C65ACECC4E` |

## 公开来源索引

以下仓库链接均固定提交；官方 Help 为 2026-10-18 读取的在线文档。

- [R1] [DSL-Owned Declaration、MapEventDefinition、EventPage](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/domain/declarations.ts#L4-L66)。
- [R2] [compileMapEvent／compileCommonEvent／compilePage](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/compiler/events.ts#L44-L111)。
- [R3] [readMapEvents／readMapEventPages／raw list 读取与规范化](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/decompiler/core.ts#L92-L216)。
- [R4] [反编译输出 Map/Common/System/Page](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/decompiler/project.ts#L123-L260)。
- [R5] [完整域物化与 Snapshot carrier](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/project-data/materialization.ts#L44-L210)。
- [R6] [mapEvent／page 作者 helper](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/authoring/declarations.ts#L15-L98)。
- [R7] [compileConditions 的未启用值和 trigger 编码](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/compiler/dispatch.ts#L1051-L1081)。
- [R8] [ADR-0004：Entry identity uses explicit MV IDs](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/docs/adr/0004-explicit-mv-id-entry-identity.md)。
- [R9] [parseMapInfos](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/project-data/project.ts#L101-L120)。
- [R10] [ADR-0009：Read-only map inspection and preview](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/docs/adr/0009-read-only-map-inspection-and-preview.md)。
- [R11] [标准文件表](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/workspace/state.ts#L18-L33)、[Snapshot 计划](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/workspace/state.ts#L208-L233)。
- [R12] [raw 编译与结束项](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/compiler/dispatch.ts#L1035-L1048)。
- [R13] [反编译命令派发与 raw fallback](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/decompiler/dispatch.ts#L230-L324)。
- [R14] [ADR-0003：Workspace compile and push model](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/docs/adr/0003-workspace-compile-push-model.md)、[Push destructive 检查](https://github.com/zyz23333/rpgmaker-event-dsl/blob/da26d4ef5aaa2b997c75eb51cc405985178b21e2/packages/rpgmaker-event-dsl/src/workspace/push.ts#L348-L375)。
- [U1] [community-1.3b Game_Event](https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Event.js#L188-L289)：公开对照，不能代替零售版本来源证明。
- [U2] [community-1.3b DataManager](https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_managers/DataManager.js#L45-L165)：数据库、地图文件和 metadata。
- [H1] [官方 Map Event Settings](https://rpgmakerofficial.com/product/MV_Help/page/01_09_03.html)、[Map Event System](https://rpgmakerofficial.com/product/MV_Help/page/01_09_01.html)。
- [H2] [官方 System Settings](https://rpgmakerofficial.com/product/MV_Help/page/01_08_12.html)。
- [H3] [官方 Map Properties](https://rpgmakerofficial.com/product/MV_Help/page/01_07_03.html)。
- [H4] [官方 Asset Standards](https://rpgmakerofficial.com/product/MV_Help/page/01_11_01.html)。

## 对研究问题能够确定的回答

已有工程接管的事实基础至少包括：事件身份和页面顺序、条件、图像、触发与自主行为、完整命令容器和 event note；还包括跨库的上下文相关 ID、System 名字与运行状态的区别、地图多层布局／tileset flags／Region 和资源 stem 之间的关系。所查本地 1.6.1 核心直接使用这些结构。当前工具可编写事件命令和一部分事件／System 结构，以 Snapshot carrier 保留地图与 System 其他内容，但尚不能完整表达非默认 Event Page 和 Map Event note，也不能编写其他标准数据库类别。精确零售默认值、部署变体和插件覆盖仍需专门验证。**这些是后续支持契约的事实输入；具体承诺哪些结构、何种等价性、哪些异常拒绝，仍由后续人工决策确定。**
