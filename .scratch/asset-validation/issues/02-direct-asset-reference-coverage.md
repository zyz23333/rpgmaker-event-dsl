# 事件直接与间接素材依赖的检查边界如何统一

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: none
Parent: [事件素材引用检查的决策地图](../map.md)

## Question

在用户已确认的“事件直接引用及通过标准项目数据可静态追踪的间接素材依赖”范围内，哪些保存位置、原生参数和标准数据关系构成待检查的素材使用？

确定 Map Event、Common Event、Troop Event 内的页图像、正式指令、嵌套 Child Command Body、Autonomous Movement 与 Set Movement Route 的覆盖清单，说明保存但未启用或实际不执行的配置是否仍检查。确定可识别原生 Raw DSL Command 的对应位置，None、Compiler Default 与显式素材名称各自如何处理；未知代码、脚本和插件动态名称继续留在既有不解释边界。

从事件实际引用的固定项目目标出发，逐条核实可追踪的标准数据字段及原生消费路径。以播放动画关联的图片与 SE、更换图块组关联的图块图片为用例，明确首版关系清单、追踪深度与停止条件、重复或循环关系、空素材字段，以及变量决定目标或运行状态才能确定的情况。已有文件定位研究不能替代这些关系与操作相关性的证据；需要补充事实时，先收集首方依据再作决定。

区分所选操作确定需要的素材与仅与目标条目关联的素材。引用 Actor 不代表该命令会加载其脸图、行走图和战斗图，例如修改角色 HP 不得直接推导为三者均必需；确定候选关联如何保留、如何向诊断票传递确定性，不在此票预设全部报错或默认警告。不得把事件起点的追踪扩大为整个数据库或全部素材的扫描。

确定每次素材使用必须保留哪些身份和来源信息，使直接引用可定位到事件、页、指令、路线及原生参数，间接依赖还可追溯定义事件内的标准数据类别、条目 ID、字段和关系链，公共事件另保留直接调用位置，而非只有去重后的素材数组。间接素材字段不因纳入检查而变成 DSL Asset Reference 或 DSL-owned 数据。此票确定领域覆盖契约，不设计通用扫描框架或实施模块。

## Answer

2026-10-25 修订：用户在过度设计评审后要求调整；以下 Answer 已同步收缩后的契约。Comments 中此前的确认记录保留为历史，不覆盖当前 Answer。

本票原版于 2026-10-20 经用户确认完成；以下为 2026-10-25 修订后的现行契约。设计状态保持 resolved，产品实现和验收仍待执行。

### 1. 起点、覆盖对象与保存状态

首版只规划 Windows / RPG Maker MV 1.6.1 的素材文件存在性。以本次编译中全部当前 Event Definitions 为独立起点，包括未被调用的 Common Event，以及 Map Event、Troop Event。快照中残留但已从当前 DSL 移除的事件不自动成为起点。为依赖读取的标准数据库条目不成为全库扫描起点，也不获得 DSL 所有权。

覆盖每个事件的所有页、完整命令列表、嵌套 Child Command Body，以及 Autonomous Movement 和 Set Movement Route。支持位置保存了实际素材名称就纳入，不按页条件、分支可达性、autoplay、非 custom 移动模式或其他未启用状态丢弃已选字段；能够确定的条件独立保留。已识别原生 Raw DSL Command 使用同样的字段与关系规则，未知命令、脚本、插件负载不猜测素材名称。

“所有保存位置”限于下列已选清单，不是对任意字符串、任意数据库字段或运行时全部资源的泛化扫描。运行条件不会自动抹掉保存的使用；原生目录选择仍按对应关系处理，例如敌人前视／侧视选择一个目录。

### 2. 直接素材清单

`p[n]` 指原生 `parameters[n]`，从 0 开始。每个素材字段是一处独立使用。

| 保存位置／原生命令 | 素材字段 | 原生类别目录 |
| --- | --- | --- |
| Map Event Page 图像 | `image.characterName` | `img/characters` |
| Show Text 101 | `p[0]` | `img/faces` |
| Change Battle BGM 132 | `p[0].name` | `audio/bgm` |
| Change Victory ME 133／Defeat ME 139 | `p[0].name` | `audio/me` |
| Change Vehicle BGM 140 | `p[1].name` | `audio/bgm` |
| Show Picture 231 | `p[1]` | `img/pictures` |
| Play BGM 241／BGS 245／ME 249／SE 250 | `p[0].name` | 各自 `audio/bgm`、`audio/bgs`、`audio/me`、`audio/se` |
| Play Movie 261 | `p[0]` | `movies` |
| Change Battle Back 283 | `p[0]`、`p[1]` | `img/battlebacks1`、`img/battlebacks2` |
| Change Parallax 284 | `p[0]` | `img/parallaxes` |
| Change Actor Images 322 | `p[1]`、`p[3]`、`p[5]` | `img/characters`、`img/faces`、`img/sv_actors` |
| Change Vehicle Image 323 | `p[1]` | `img/characters` |
| Movement Route Change Image 41 | `p[0]` | `img/characters` |
| Movement Route Play SE 44 | `p[0].name` | `audio/se` |

共 15 个事件命令家族、一个页图像字段、两种移动指令。路线适用两个保存容器；205 内路线与其 505 镜像属于一次逻辑使用，保留主位置及关联保存位置，不重复制造缺失报告。不同真实指令或字段即便指向同一文件仍是不同使用。只设置未来使用状态的音频命令同样覆盖。

### 3. 间接关系清单

仅沿本表及下一节公共事件关系继续。名称位于标准项目数据的原生字段中，不改称或改写为 DSL Asset Reference。固定素材字段、初始化／默认候选和执行条件分开表达，不把本表任何一行解释成必然执行或加载。

| 事件入口 | 标准关系／素材字段 | 覆盖与条件 |
| --- | --- | --- |
| Show Animation／Show Battle Animation | Animation → `animation1Name`、`animation2Name`、全部 `timings[].se.name` | `img/animations` 与 `audio/se`；图像预加载、SE 按帧播放条件分别保留 |
| Change Tileset | Tileset → 全部 `tilesetNames[]` | `img/tilesets`；不按地图实际铺设图块筛选 |
| 固定 Troop 的 Battle Processing | Troop `members[].enemyId` → Enemy `battlerName` | 隐藏成员仍纳入；根据 System.optSideView 选 `img/enemies` 或 `img/sv_enemies` |
| Enemy Transform | 指定新 Enemy → `battlerName` | 同上选择目录；不因运行时目标可能不存在而跳过保存关系 |
| Force Action：正动画 ID | 固定 Skill `animationId` → Animation 图片与 SE | 0 不产生动画关系；原生默认攻击分支见下两行 |
| Force Action：角色默认攻击 | 空手回退 Animation 1 → 图片与 SE | 作为无当前武器时的 Conditional Asset Candidate；当前武器分支记录未知并停止，不追初始装备或枚举武器库 |
| Force Action：敌人默认攻击 | `System.sounds[9].name` | `audio/se`；这是敌人默认攻击音效关系，不构造虚假的动画 ID |
| 固定 Map 的 Transfer Player | Map `tilesetId` → 全部 Tileset 图片；Map `parallaxName`、`bgm.name`、`bgs.name` | `img/tilesets`、`img/parallaxes`、`audio/bgm`、`audio/bgs`；保留 autoplay 与当前配置可能被覆盖的条件；本行不引出 battleback |
| Map Event Page 图块图像 | 宿主 Map 初始 `tilesetId` → `tilesetNames[5 + floor(tileId / 256)]` | 合法非零页图块对应 B–E 中一张图片，作为初始图块组候选；不把此关系扩大为整组图片；运行时换图块组条件保留 |
| Change Party Member：加入指定 Actor | Actor 初始 `characterName`、`battlerName` | `img/characters`、`img/sv_actors` 两类名称均保留为候选；当前图像覆盖、侧视战斗及有效战斗队员条件独立记录；不加入 faceName，不推演移除后的队伍重排 |
| Game Over | `System.gameoverMe.name` | `audio/me`；不延伸到引擎硬编码 GameOver 图片 |
| Return to Title | `System.title1Name`、`title2Name`、`titleBgm.name` | `img/titles1`、`img/titles2`、`audio/bgm`；不继续展开标题 UI 所有内部资源 |
| Battle Processing：系统音频 | `System.battleBgm.name`、`victoryMe.name`、`defeatMe.name`、`sounds[7].name` | BGM 与胜败 ME 是可能被运行时覆盖的默认候选，结果条件和地图启动战斗的 SE 条件保留；敌群目标动态只截断敌群关系，不丢弃本行已知系统关系 |
| Map Event 内的 Battle Processing：背景 | 宿主 Map 保存的 `battleback1Name`、`battleback2Name` | `img/battlebacks1`、`img/battlebacks2` 条件候选；保留 specifyBattleback 与当前地图／背景可能变化的条件，关闭选项也不丢弃保存名称；Common Event／Troop Event 不经调用链推演地图来补此关系 |

Troop Event 身份本身不自动引出宿主敌群的全部图片。System.battleback1Name／battleback2Name 只属于 Battle Test，不作为普通战斗的默认背景。未明确列入的关系不因“原版部署会收集”或“运行时可能相关”自动加入。

### 4. 公共事件、复用、循环与停止点

- 所有当前 Common Events 已是独立起点，内部素材各检查一次。Common Event 命令和已选 Skill 的各个 Common Event effect 保留直接调用位置、固定目标，以及适用的 Skill/effect 路径；不因 reservation 覆盖而丢弃关系。
- 不沿公共事件调用递归复制素材使用，不拼接所有传递调用链，也不按调用路径数增加使用次数。定义事件的真实字段和事件内标准数据依赖保留；不同成员、timing、槽和指令仍独立。
- 自调用、互调、多跳和共享调用只形成有限的直接关系，不需要额外循环停止诊断。每个调用点都可追溯，目标定义位置可定位；不要求枚举无环图的所有路径。
- 其他已选标准数据关系继续到素材字段，不设任意深度截断。动态目标或名称没有已选固定候选时，保留事件内位置、已有链和原因，不当 None、无依赖或通过；已知兄弟关系继续。
- 不推演前序命令、变量、装备、队伍或调用者的运行上下文；不扩展敌人 AI、初始装备、地图事件或传送网络。

### 5. 名称、空值、确定性与来源

合法原生 None 不产生文件查询，独立保存的音量、音调、声像、图像索引等继续保留。省略可选 DSL 字段应用既有 Compiler Default，再按最终保存字段决定是否存在素材使用；不会补修捕获数据中的必需字段。间接字段仅在原生允许空值时表示不指定素材，不能形成空名 Asset Reference。

必需字段缺失、必要字段无法解释、条目或关系无法解析，与合法无素材以及确定名称但文件缺失分别记录；不通过补空值、修复数据或扩大外部条目校验来掩盖问题。文件匹配、失败分类的具体呈现与严重性由后续票决定。

每次 Event Asset Use 保留事件类型／身份、页和命令位置、嵌套体或路线位置、类别、原始名称、原生字段或参数位置；可靠时附 DSL 来源。间接使用另保留经过的标准类别、条目 ID、字段及每一步关系依据。记录已保存的明确名称、Conditional Asset Candidate、未知停止点，以及未启用／运行条件；不把“关系已确定”写成“必然执行”，也不把直接／间接来源等同严重性。

文件查询可按同一文件复用，每次定义事件内的独立使用仍保留；直接调用关系单独记录，不乘入素材使用次数。间接读取不扩展 DSL-Owned Project Data，不写入或修复依赖条目，也不修改原生素材名称。

既有 Project Data Reference 解析与验证契约继续适用；本票不通过素材检查重定义名称／ID 解析、放宽缺失目标或绕过 Staged Data Graph。标准依赖字段的数据来源与一致性由票 05 衔接。

### 6. 明确排除与下游交接

首版不做全库或全项目素材体检，不接入插件显式声明、file/animation 参数、struct／数组及备注素材规则，不解释脚本或未知负载。既有不解释边界不替代插件显式声明的独立排除决定。

不扩展角色／敌人倒下等额外状态连带音效，不从一场战斗自动遍历所有后续场景，不将当前交通工具／历史步行 BGM 猜成三个交通工具默认值。单纯修改 HP 不引出角色全部图像；单纯固定交通工具位置不引出其全部素材。

不增加引擎硬编码或地形推导的素材名称，例如固定 GameOver 图片、世界地图战斗背景、原版部署固定保留 33 项。此边界不排除表中通过已选固定数据库条目／系统音效槽最终到达保存名称的关系，例如空手动画 1、System.sounds[7]／[9]。

图片尺寸／索引布局、媒体解码／播放保证、未使用素材清理、自动修复／复制／重命名、部署与加密支持、其他平台或引擎版本均不在本票覆盖决定内。

| 下游票 | 本票提供的输入与保留决定 |
| --- | --- |
| [03 文件存在性](03-asset-file-existence-contract.md) | 原生类别和未改写名称、完整来源、None／无法解释／未知停止点的区别；路径、扩展名、匹配、链接与部署支持仍由 03 决定 |
| [04 诊断政策](04-asset-diagnostics-and-policy.md) | 直接及已选间接使用、Conditional Asset Candidates、未启用状态和未知路径；严重性、开关、例外与聚合呈现仍由 04 决定，纯粹同条目关联已排除 |
| [05 工作流](05-workspace-asset-check-lifecycle.md) | 当前事件起点与必要标准字段关系；数据来源一致性、实时文件、检查时机、Compile Baseline／Generated Freshness、Push 仍由 05 决定 |
| [06 验收](06-asset-validation-acceptance.md) | 按覆盖表、边界、条件、raw 一致性、镜像、共享与循环设计验收；本票的静态事实和函数重放不等于产品或原生运行验收 |

本契约修订 [ADR 0011](../../../docs/adr/0011-native-command-state-and-validation.md) 的“文件不扫描”设计边界，尺寸排除继续保留；[ADR 0012](../../../docs/adr/0012-event-saved-state-roundtrip-boundary.md) 的保存状态／raw／外部数据边界继续适用，[ADR 0013](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 的工作流修订留给票 05。已接受的 [ADR 0016](../../../docs/adr/0016-event-rooted-asset-use-coverage.md) 记录为何选择有限事件关系和逐次来源，而不复用原版全库部署集合。

依据为本票逐轮确认、下方首方 runtime 静态位置，以及[原版部署范围研究](../research/native-unused-assets-scope.md)与[完整字段规则子报告](../research/deployment-help-scope.md)。未进行本功能实现或真实编辑器／游戏验收。

## Comments

### 2026-10-20 — 扩展间接素材范围

按用户“调整一下，纳入规划吧”的要求，将原票扩展为直接与可静态追踪的间接素材依赖，保留文件路径与票号供既有链接继续定位。本票仍为 open，具体关系与检查语义尚未决。

### 2026-10-20 — 第一轮 Q1–Q2 已确认

用户回复“确认”，接受本轮两项建议；本票继续 claimed，尚未确认完整覆盖契约。

- **Q1：保存状态覆盖。** 在支持的原生素材位置，只要保存了实际素材名称，就纳入文件存在性检查，包括显示图块时保留的行走图、非自定义 Autonomous Movement 下保留的 Movement Route、条件不满足的页及不会进入的分支。不以模拟运行时页条件或控制流排除这些保存位置；能够从结构确定的未启用状态继续保留，交由诊断票确定呈现与级别。纳入检查不意味着缺失一律报错，也不保证运行时一定加载。
- **Q2：逐次来源。** 每次 Event Asset Use 保留事件类型及身份、页和指令位置、嵌套 Child Command Body 或路线位置、素材类别、原始名称及原生字段或参数位置；可靠时附 DSL 来源。间接使用保留完整 Asset Dependency Chain，包括标准数据类别、条目 ID、字段与每一步关系依据，并携带未启用、运行条件或目标不确定等判定信息。文件查询可以复用，来源不得去重丢失。205/505 镜像是同一次逻辑使用并可关联两个原生位置；两个独立命令使用同一素材仍为两次使用。
- 术语已写入根 GLOSSARY.md；本轮没有选择诊断级别、文件匹配政策或工作流时机，没有实施产品功能。原生直接位置清单、None/Compiler Default、间接关系清单及追踪停止点待后续轮次。

### 2026-10-20 — 第二轮前的静态事实输入

以下是仓库实现和本地 MV 1.6.1 首方 runtime 的静态事实，不是新的支持政策，也不声称编辑器或游戏运行验收。`src/` 前缀在此指 `packages/rpgmaker-event-dsl/src/`；原生文件位于 `references/rmmv-local-runtime-1.6.1/js/`。

- 直接原生位置共涉及页图像 `image.characterName`，15 个事件命令家族（101、132、133、139、140、231、241、245、249、250、261、283、284、322、323）及路线 41/44。编译位置见 `src/map-event/page.ts:37–41`、`src/commands/message/compile.ts:7–10`、`src/commands/movement/compile.ts:203–216` 和 `src/compiler/dispatch.ts` 对应分派。205 内 route 与 505 镜像由 `src/commands/movement/validation.ts:236–277` 校验一致性。
- 页行走图省略时使用空名称，省略路线使用空路线（`src/map-event/page.ts:41`、`src/commands/movement/page.ts:52`）；不能推导其他必需字段也可以省略。原生图片空名返回 empty bitmap（`rpg_managers.js:1059–1066`），影片只在非空名时播放（`rpg_objects.js:10032–10038`），音频按类别检查 name，例如 BGM `rpg_managers.js:1180`。None 不等同所有命令统一停止或删除。
- `Game_Interpreter.setup` 调用 `requestImages(list)`（`rpg_objects.js:8805`），后者遍历完整命令列表（10519），包含 route 图像（10551–10558）和更换角色图像的三种图（10614–10617）。预加载并不沿分支可达性筛选，实际执行与预加载也不等同。
- 播放动画 212/337 的预加载读取两张动画图（`rpg_objects.js:10562–10572`）；动画图字段由 `rpg_sprites.js:1301–1307` 消费，timings SE 在匹配帧时消费（1383–1391、1442–1457）。更换图块组 282 读取整组 tilesetNames 并等待图片准备（`rpg_objects.js:10064–10081`），不按地图当前用到的图块筛选。
- 固定 Transfer 关联 Map 的 tilesetId/parallaxName，BGM/BGS 消费还具有 autoplay 等条件（`rpg_objects.js:5433、5585、5790`；`rpg_sprites.js:2313、2384`）。地图 battleback 是进入战斗时的消费字段（`rpg_sprites.js:2513`），不能仅因固定 Map 目标就称其为 Transfer 的必需素材。
- 固定 Battle Processing 具有 Troop members → Enemy battlerName 消费链（`rpg_objects.js:10130、5250`；`rpg_managers.js:2139`；`rpg_sprites.js:2631、959、971`）；前视/侧视目录根据 System.optSideView 选择。隐藏成员也创建 Sprite，不能仅因 hidden 就排除。
- 修改角色 HP 的本体没有三类角色图像消费（`rpg_objects.js:10202–10207`），但允许死亡且在战斗中可能经 collapse 消费 System.sounds[15]（`rpg_objects.js:9045、4068`；`rpg_managers.js:1604`）。应分别核实消费关系，不可把“没有角色图像依赖”扩大成“没有任何间接素材”。
- Force Action 的固定 Skill.animationId 为正时可追至动画，为负时进入默认攻击分支（`rpg_windows.js:4952–4986、5041`）：Actor 当前武器或空手动画由运行态决定（`rpg_objects.js:3859–3875`），Enemy 使用系统攻击 SE（`rpg_managers.js:1580`）。Skill Common Event effects 又可进入公共事件（`rpg_objects.js:1972–1977、8816`），是否把这些关系纳入及如何终止递归仍待用户决定。

上述补充事实由只读子代理核对；未修改原生文件，未执行运行时，未新增全数据库扫描或推断运行态素材名称。

### 2026-10-20 — 原版部署排除范围研究输入

用户要求先逆向 `references/RPGMV` 的 Exclude unused files，以了解原版覆盖范围。已完成[主调查报告](../research/native-unused-assets-scope.md)及[首方帮助／嵌入资源规则表](../research/deployment-help-scope.md)：原版从全部 Actors / Enemies / Tilesets 的指定字段、System、全部登记地图及事件、插件显式声明构造名称保留集合，选择性展开动画；最终只按使用情况筛选输出包的 img / audio，movies 不受该集合筛选。它从现存文件决定复制与否，不提供逐 Event Asset Use 的缺失诊断或来源链。非 custom Autonomous Movement 保存路线不会经其页路线扫描路径收集，与本票已确认的保存状态覆盖不同。

证据为当前 EXE 完整嵌入 QML / JavaScript、REA 原始字节及帮助；对原始 `needToCopy2` 函数做了 12 个合成输入重放，全部通过，未启动编辑器或实际部署。原版字段清单可作为候选关系来源；全库扫描、33 项固定保留、首点截断匹配、插件声明支持均未自动变成我们的产品契约。本票保持 claimed，未决覆盖和诊断政策仍由用户参与后续决策。

### 2026-10-20 — 研究更新后的 Q3–Q4 已确认

用户要求基于新增原版研究重新讨论，随后回复“确认”，接受重议后的两项建议。此前未获确认的旧 Q3–Q5（直接清单、None/Compiler Default、三种确定性建议）不作为已决条款；第一轮 Q1–Q2 继续有效。

- **Q3（重议）：检查起点。** 首版继续以事件为起点，沿选定的标准项目数据关系检查间接素材。原版部署收集器的字段清单用于查漏，不采用其全量 Actors / Enemies / Tilesets / System / Maps 扫描起点。无事件关联的数据库条目不因自身存在就成为检查起点；全库素材检查留作独立能力，不属于本票首版承诺。
- **Q4（重议）：插件显式声明。** 首版不接入 `@requiredAssets`、插件 file/animation 参数、数组或 struct 参数以及声明的备注字段，留作后续扩展。这些是显式声明，和动态脚本推断有别；本次排除是独立范围选择，不以“未知脚本不解释”代替该决定。既有 Script Input、Plugin DSL Command 和未知 raw payload 的不猜测边界继续适用。
- 本票继续 claimed。直接保存位置、None/Compiler Default、具体间接关系、候选与动态停止点仍待确认；未更改诊断级别、文件匹配规则、Workspace 时机或产品实现。

### 2026-10-20 — Q5–Q7 已确认：直接清单、空值规则与六组间接关系

用户回复“确认”，接受本轮 Q5–Q7。以下按前文 Q1 的保存状态规则及 Q2 的逐次来源规则执行，不预设缺失诊断级别，不保证运行时执行或加载。

**Q5：完整直接素材清单。** 下表中的 `p[n]` 为原生 `parameters[n]`，索引从 0 开始。除页字段外，命令清单适用于 Map Event、Common Event、Troop Event 及其全部嵌套 Child Command Body；可识别的 Raw DSL Command 使用相同原生字段。

| 位置／命令 | 原生素材字段 | 素材目录 |
| --- | --- | --- |
| Map Event Page 图像 | `image.characterName` | `img/characters` |
| Show Text 101 | `p[0]` | `img/faces` |
| Change Battle BGM 132 | `p[0].name` | `audio/bgm` |
| Change Victory ME 133／Change Defeat ME 139 | `p[0].name` | `audio/me` |
| Change Vehicle BGM 140 | `p[1].name` | `audio/bgm` |
| Show Picture 231 | `p[1]` | `img/pictures` |
| Play BGM 241／BGS 245／ME 249／SE 250 | `p[0].name` | 各自 `audio/bgm`、`audio/bgs`、`audio/me`、`audio/se` |
| Play Movie 261 | `p[0]` | `movies` |
| Change Battle Back 283 | `p[0]`、`p[1]` | `img/battlebacks1`、`img/battlebacks2` |
| Change Parallax 284 | `p[0]` | `img/parallaxes` |
| Change Actor Images 322 | `p[1]`、`p[3]`、`p[5]` | `img/characters`、`img/faces`、`img/sv_actors` |
| Change Vehicle Image 323 | `p[1]` | `img/characters` |
| Movement Route Change Image 41 | `p[0]` | `img/characters` |
| Movement Route Play SE 44 | `p[0].name` | `audio/se` |

路线覆盖 Autonomous Movement 与 Set Movement Route；非 custom 保存路线也检查。205/505 镜像仍是一次逻辑使用的两个保存位置。只设置将来音频状态的命令同样纳入；同一命令内多个素材字段分别记录。页图块编号、动画 ID、图块组 ID 不属于直接素材名称。

**Q6：None、Compiler Default 与异常字段。** 合法的原生 None 不产生文件查询，独立保存设置继续保留。省略可选 DSL 字段时应用既有 Compiler Default，再根据最终保存字段是否指定素材决定查询。间接标准数据中的空名称仅在该字段允许空值时表示不指定素材，不构造成空名 Asset Reference。必需字段缺失、类型错误或非法空名 Asset Reference 仍是输入或数据解释问题，不能补空值或当成 None 跳过。合法无素材、无法解释字段、确定名称但文件缺失是不同情况；诊断级别留给票 04。

**Q7：第一批间接关系。** 六组均纳入，保留完整条目和字段关系链。

| 事件操作 | 已选关系与素材字段 | 已确认边界 |
| --- | --- | --- |
| Show Animation／Show Battle Animation | 固定 Animation → `animation1Name`、`animation2Name`、全部 `timings[].se.name` | 预加载双图与按帧播放 SE 的条件分别记录，不按分支或播放结果排除 |
| Change Tileset | 固定 Tileset → 全部 `tilesetNames[]` | 不按地图实际铺设图块筛选图片 |
| 固定 Troop 的 Battle Processing | Troop → 全部 `members[].enemyId` → Enemy `battlerName` | 隐藏成员仍纳入；依 `System.optSideView` 选择前视或侧视目录 |
| Enemy Transform | 固定新 Enemy → `battlerName` | 同上选择敌图目录；不以运行时目标是否存在排除保存引用 |
| Force Action | 固定 Skill 的正 `animationId` → Animation 图片与时序 SE | 0 不产生动画关系；默认攻击的特殊值尚待单独决定 |
| 固定 Map 的 Transfer Player | Map `tilesetId` → Tileset 图片；Map `parallaxName`、`bgm.name`、`bgs.name` | autoplay 关闭仍检查保存名称并保留状态；不保证等于运行时当前配置；Map battleback 不自动纳入此组 |

本票尚未整体解决。下一轮继续决定页图块、角色当前图像、系统默认素材、默认攻击、条件候选以及公共事件关系中的重复／循环与停止点。未新增全库扫描、插件声明支持或运行时状态推断。

### 2026-10-20 — 页图块消费路径补充事实

本地 MV 1.6.1 runtime 静态核对（文件均位于 `references/rmmv-local-runtime-1.6.1/js/`）：`rpg_objects.js:8678–8685` 在页 `image.tileId > 0` 时设置图块图像；`rpg_sprites.js:232–235` 从当前 `$gameMap.tileset().tilesetNames[5 + Math.floor(tileId / 256)]` 选择一张图片，属于页图块自身的单图消费关系。`rpg_sprites.js:238–256` 监视当前 tilesetId 变化并更新图片；所属 Map 保存的 tilesetId 只提供初始化值（`rpg_objects.js:5433–5438`），运行时 Change Tileset 可以覆盖（6088–6090）。地图绘制的独立路径 `rpg_sprites.js:2313–2319` 加载全部 tilesetNames，不应与页图块的单图消费混为一条关系。

这不改动 Q7 已确认的 Transfer／Change Tileset 整组检查；页图块初始依赖是否作为候选纳入，及如何表达运行时覆盖，仍待后续问题确认。证据为只读源码和 REA 静态分析，未运行游戏；自动语义图为 partial，以上关系另按实际函数文本核对。

### 2026-10-20 — Q8–Q10 已确认：候选、事件起点与递归边界

用户回复“确认”，接受以下三项；具体新增候选关系清单仍待下一轮选择。

- **Q8：确定性与停止点。** 保存位置或固定标准条目字段已确定的名称照常检查，执行条件另记，不承诺实际加载。已选关系中有明确原生初始化／默认回退来源、但当前值可能被运行时覆盖的，仍检查保存名称并作为 Conditional Asset Candidate 保留适用条件。若目标或名称只能由变量、当前装备、当前队伍等运行状态确定，且没有已选定的固定候选来源，记录无法继续确定的位置与原因并停止该路径，不枚举全库、不把未知当作无依赖。单纯同属一个条目、没有所选操作消费关系的素材不建立使用或候选。不按前序事件命令推演当前图像、装备或地图状态；候选必须来自明确选入的原生关系。
- **Q9：独立事件起点。** 本次编译中全部当前 Event Definitions 均独立检查，涵盖未被调用的 Common Event，以及各 Map Event、Troop Event，不要求运行时可达。已从当前 DSL 移除而只残留于旧 Project Data Snapshot 的事件不再成为素材检查起点；其删除、漂移与同步继续由既有 Workspace 契约处理。为间接关系读取的外部标准条目不因此成为全库扫描起点。
- **Q10：公共事件关系与循环。** 纳入 Common Event 命令到固定公共事件，以及已纳入 Force Action 的固定 Skill 到其保存的 Common Event effects、再到指定公共事件的关系。每个调用位置保留；共享被调用事件的检查结果可复用，不能丢失其他调用来源。只沿明确选定关系继续，不设置任意统一层数；到素材字段结束，动态目标按 Q8 停止，遇当前链内重复条目记录闭环并停止展开。A → B → A 的两个事件及调用位置仍被覆盖，循环不等同缺失文件，也不要求无限展开使用记录。
- 不因读到 Enemy 或 Map 就自动追踪敌人全部 AI 技能、地图全部事件及其传送网络；当前地图事件自身由 Q9 的独立起点规则覆盖。候选确定性与原生条件不改变 Q1 的保存状态覆盖。严重性、例外和文件／数据输入一致性仍由票 03–05 决策。

Conditional Asset Candidate 已记入 GLOSSARY.md。票 02 继续 claimed，尚未确认最终完整契约。

### 2026-10-20 — 剩余候选与系统入口的静态事实

以下为后续范围选择的事实输入，不自动纳入支持清单。来源均为 `references/rmmv-local-runtime-1.6.1/js/` 首方 runtime，未执行游戏。

| 操作／上下文 | 消费事实及源码位置 |
| --- | --- |
| Change Party Member 加入 | `rpg_objects.js:10541–10547` 预请求当前 actor.characterName；初始三种图像由 Actors 字段复制（3515），加入／移除刷新玩家与 follower（4919、7436、8030）。侧视战斗中的有效队员另有 SV actor 图片路径（`rpg_sprites.js:509、787、2660`）。没有仅因加入便加载 faceName 的对应路径；初始化重置也不能改变预请求发生在命令之前的事实。 |
| Game Over 353 | `rpg_objects.js:10482–10484` 进入 Scene_Gameover；`rpg_scenes.js:2671–2674` 消费 System.gameoverMe，2677–2679 另加载硬编码 img/system/GameOver。标准字段与引擎固定名称是不同来源。 |
| Return to Title 354 | `rpg_objects.js:10488–10490` 进入 Scene_Title；`rpg_scenes.js:469–470、526–529` 消费 System.title1Name、title2Name、titleBgm。 |
| Battle Processing 301 | `rpg_objects.js:10130–10147` 进入战斗；战斗 BGM、胜利／失败 ME 取当前覆盖值，否则取 System.battleBgm／victoryMe／defeatMe（`rpg_objects.js:193–214`；`rpg_managers.js:2215–2225、2633–2642、2668–2676`）。地图 launchBattle 播放 System.sounds[7]（`rpg_scenes.js:831–835`；`rpg_managers.js:1572–1573`）。 |
| 上下交通工具 206 | 目标由当前乘坐、位置、朝向及交通工具位置决定（`rpg_objects.js:7910–7938`）；上车播放当前交通工具 BGM 或 System 对应默认值（8308–8313、8328–8329），下车恢复历史步行 BGM（8316–8321）。单纯设置交通工具位置 202 不播放其 BGM（9729–9743）。 |
| 角色／敌人倒下 | 311／313 可经死亡变化到 actor collapse，在战斗中消费 System.sounds[15]（`rpg_objects.js:9045–9053、10229–10240、4068–4072`；`rpg_managers.js:1604–1605`）。331／333 的 enemy collapse 依当前 traits 选择普通、Boss 或即时类型，可能消费 sounds[11]、[12]、[13]（`rpg_objects.js:4443–4456、10386–10397、2559–2561`；`rpg_sprites.js:1147–1154`）。这些是已知副作用关系，但不等于当前已选覆盖。 |
| 普通战斗背景 | `rpg_sprites.js:2513–2534` 对普通战斗取当前 Map 背景或世界地图分支；System.battleback1Name／battleback2Name 只属于 Battle Test。Map 初始背景受 specifyBattleback 控制，并可被运行时 Change Battleback 覆盖（`rpg_objects.js:5596–5603、6093–6095`）。世界地图背景又由当前位置、地形或交通工具推导硬编码名称（`rpg_sprites.js:2537–2628`）。 |
| Troop Event 宿主 | `rpg_objects.js:5345–5358` 读取宿主 troop.pages 并 setup(page.list)；敌人实例和图片来自同一 troop 的战斗初始化与 sprites 路径（5246–5265；`rpg_sprites.js:2631–2641`）。共同宿主不等于执行页会另外加载全部敌图；将 Troop Event 身份本身作为宿主素材起点需要单独范围选择。 |

本轮 REA 静态 evidence 为 `ev_bad6f6a8bec10949326c3f5e5991f7329d56f01b727201dc8285acddb3bfaf25`。自动图为 partial，所列关系另按实际函数文本核对；没有将未选文件、缺图边或未执行行为当作不存在。

### 2026-10-20 — Q11–Q14 已确认；合并契约待整体确认

用户回复“确认”，接受 Q11–Q14：页图块的单张初始 Tileset 图片候选；加入角色的初始行走图和 SV 图候选；Game Over／Return to Title／Battle Processing 的有限系统素材清单；角色空手动画 1 和敌人默认攻击 SE；Map Event 内 Battle Processing 的宿主 Map 背景候选。两类角色图像均保留，SV 的侧视及队员条件另记，不附加角色脸图或推演移除后的重排。

同时确认不因 Troop Event 宿主身份自动扫描全敌群图片，不追当前武器或以初始装备替代，不加入倒下等额外状态音效，不从公共事件调用链推演当前地图，不以 System 的 Battle Test 背景代替普通战斗背景，不扩展引擎硬编码／地形推导图片或原版固定保留清单。

Q1–Q14 已合并为上方 Answer，并形成拟议 ADR 0016。此轮只整理已确认范围、交接与证据；Status 继续 claimed，等待用户对合并全文与本票完成边界作最后确认后再 resolved。

文档验证：5 份相关 Markdown 的 22 个本地链接目标存在，无行尾空白；`git diff --check` 通过。仅为文档检查，未运行产品测试或原生编辑器／游戏验收。

### 2026-10-20 — 完整契约确认并关闭

用户对合并 Answer、ADR 0016 及票 02 完成边界回复“确认”。已将本票设为 resolved、ADR 0016 设为 accepted，并将覆盖结论加入地图的 Decisions so far；ADR 0011 已注明文件扫描排除的有限设计修订，尺寸与运行保证边界继续保留。

本票的领域覆盖设计已完成。文件匹配、诊断严重性与例外、Workspace 输入一致性与新鲜度、产品验收分别交给票 03–06；没有借关闭本票解决这些后续问题，也没有实施、提交或发布产品功能。

关闭验证：6 份相关 Markdown 的 34 个本地链接目标存在，无行尾空白；resolved／accepted 状态与地图的已决索引一致；`git diff --check` 通过。票 03 的前置 01、02 均已 resolved，票 03 仍 open，尚未开始其设计决定。

### 2026-10-25 — 设计减重修订

收缩 ADR 0016 的来源要求：保留定义位置、事件内依赖链和直接调用点，不再展开全部传递路径或新增循环诊断。实际直接／间接字段清单保持不变；相关来源、计数与循环验收已同步。

本票继续 resolved，表示本次设计修订已完成；产品实现与验收仍待执行。
