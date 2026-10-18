# MV 1.6.1 原生事件数据边界研究

研究日期：2026-10-18。对应问题：**MV 原生事件数据的完整边界与版本基准是什么**。产品源码基准为 `13f3aac9f0cf2bda068a1ee2d14819b92626a7be`。本报告供事件模型、数据所有权、无损往返与验收决策复用，不定义最终 DSL。

## 结论与证据等级

完整原生事件范围至少包括 Map Event 的备注与全部页字段、Common Event 的触发与开关字段，以及 Troop 内战斗事件的页条件、执行跨度和指令列表。三者共用 `EventCommand` 形状及解释器，执行上下文并不相同。当前实现只正式定义 Map Event 和 Common Event；地图页属性和备注没有进入 DSL 往返，战斗页没有顶层定义或生成路径。[D1][D2][D3][D4]

现有首方帮助、编辑器随包模板、零售 1.6.1 runtime 源码足以确定字段清单、主要枚举和执行语义。它们不能完全证明编辑器所有输入范围、新建默认值、重存规范化、未知字段处理或 UI 上下文限制。本轮没有运行编辑器、游戏或测试，没有执行二进制逆向，也没有 REA Evidence；所有“runtime 行为”结论都是对实际随包源码的静态观察。

证据类型在下文分为：

- **H（首方帮助）**：`references/RPGMV/Help/` 的 HTML 和所引用截图。说明编辑器概念、部分合法范围和预期行为；存在少量文字笔误。
- **T（随包模板）**：`references/RPGMV/NewData/`。直接证明随软件分发的数据取值，不自动证明每个编辑器创建入口的默认值。
- **R（零售 runtime 源码）**：`references/rmmv-local-runtime-1.6.1/js/`；与编辑器 NewData 中相应核心文件逐字节一致的核对范围见下一节。
- **F（本地参考工程样例）**：`references/rmmv-test-project/`。证明现存样例的形状和取值，没有样例生成过程的运行记录，不能称为新建默认值。
- **D（当前产品源码）**：本报告基准 commit 下的 `packages/rpgmaker-event-dsl/`。用于判断已支持与丢失路径，不代替运行验证。

本文的 repo-relative 路径均相对于 `F:/Shuen/RPG/rpgmaker-event-dsl/`；`路径:行号` 是本地原始资料位置。研究分支只发布本报告，不复制原生代码、模板、编辑器或资产。

## 版本和资料身份

| 对象 | 已观察证据 | 能确认什么 |
| --- | --- | --- |
| 编辑器所带 NewData runtime | `references/RPGMV/NewData/js/rpg_core.js:2,183` 声明 v1.6.1 / `Utils.RPGMAKER_VERSION = "1.6.1"` | 随包 runtime 明确标注 MV 1.6.1 |
| 独立本地 runtime | `references/rmmv-local-runtime-1.6.1/js/rpg_core.js:2,183`；`Game.rpgproject:1` 为 `RPGMV 1.6.1` | 本报告使用的 runtime 基线 |
| 本地参考工程 | `references/rmmv-test-project/js/rpg_core.js:2,183`；`Game.rpgproject:1` 为 `RPGMV 1.6.1` | 样例工程标注的 runtime/项目格式版本 |
| `RPGMV.exe` | 文件存在；用 Windows `VersionInfo` 只读查询得到 FileVersion、ProductVersion、ProductName 等为空 | **未确证编辑器本体版本**；不能用旁边 runtime 的版本代替 |
| 社区 CoreScript | `references/rpg-maker-mv-corescript/js/rpg_core/Utils.js:29,31` 同时声明 `1.6.1` 和 `community-1.3b`；`README.md:12,21` 说明经 KADOKAWA 分发 | 可读补充资料，有独立发行身份，不等于本地零售脚本 |

只读 `Get-FileHash -Algorithm SHA256` 的结果：

| 文件身份 | SHA-256 |
| --- | --- |
| `RPGMV/NewData/js/rpg_objects.js`、`rmmv-local-runtime-1.6.1/js/rpg_objects.js`、`rmmv-test-project/js/rpg_objects.js` | 三者相同：`2D43DD9D8974C88A1B82FFA493D6D8A02C4CE1D0DFC8F05E6C0AB731E3F0573E` |
| 上述三个目录的 `js/rpg_core.js` | 三者相同：`9AD9914CC421AF6D054C3F01B022B7383863B047EC3F6F76AA897E6CFBF864C6` |
| `references/RPGMV/RPGMV.exe` | `1B7D685FD302505B104F51CC539E2D6C997B5164D4A6A55E745283536503D281` |

上述哈希只覆盖所列文件，不声称三个工程所有文件都一致。社区树已有可见差异，例如 `js/rpg_objects/Game_Troop.js:162` 多了 `setEventInfo` 调用；报告中的 runtime 结论优先引用随包零售源码。

## Map Event 与页字段

### Map Event 外层

H 的完整属性索引位于 `references/RPGMV/Help/page/03_37.html:24–30`，编辑器解释见 `01_09_03.html:27–47`。

| 字段 | 原生含义与值边界 | 当前产品情况 |
| --- | --- | --- |
| `id` | 地图内事件 ID；H 说明在每张地图内创建时分配（`01_09_03.html:27–28`）。数组槽位和正整数 ID 的一致性仍需纳入结构验收 | 有显式 Map Event Identity |
| `name` | 字符串，H 说明主要供编辑器识别（`:29–30`）；`03_37.html:47` 标成 Number 是文档笔误，与 F 字符串样例矛盾 | 支持 |
| `note` | 字符串自由文本（`:31–32`）；不应只按“对游戏没有效果的文字”处理，见下一节 | **缺失；编译时不写，反编译时不取** |
| `pages` | 有顺序的 EventPage 数组；页号来自数组顺序，没有独立页 ID 字段。H 描述插入和删除后页号随之变化（`:33–45`） | 支持非空页列表，页内容不完整 |
| `x`, `y` | 地图坐标（`03_37.html:68–77`）。应结合对应 Map 的 width/height；本文未独立确证编辑器允许的地图尺寸上限或页数上限 | 支持并有地图范围校验 |

当前 `MapEventDefinition` 字段见 [D1] 的 `:24–32`；反编译读取见 [D5] 的 `:92–114`；编译返回值见 [D2] 的 `:46–56`。

### note 与衍生 meta

R 的 `references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:130–145` 对 Map 本身和 `events` 中带 `note` 的对象调用 `extractMetadata`。`:153–167` 将 `<tag>` 解析为 `meta[tag] = true`，将 `<tag:value>` 解析为字符串，重复键依源码顺序后者覆盖前者。

因此，`note` 是源数据字段，`meta` 是加载时衍生数据；原生模板的 Map Event 并不需要持久化一个独立 `meta` 字段。插件或 Script Input 可以观察该衍生结果，备注丢失会改变该观察。当前 Map Event 的编译和反编译都省略 `note`，[D4] 以新事件对象替换整个 events 项，不与旧事件对象合并；这是一条实际的静默丢失路径，而非“只缺新建 API”。[D1][D2][D3][D4][D5]

### EventPage 完整字段

H 属性索引：`references/RPGMV/Help/page/03_39.html:24–37`；R 应用页设置：`references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:8678–8710`。

| 字段 | 含义、枚举或边界证据 | 现状 |
| --- | --- | --- |
| `conditions` | 固定 Page Condition Slots；下表列全 | 激活条件可表达；未激活槽的原值丢失 |
| `image` | 图块或人物图像与初始方向/图案；下表列全 | 固定空图像 |
| `list` | `EventCommand[]`；可空内容，以 end marker 表示 | 通过 commands 支持，具体指令分支另有研究 |
| `moveType` | 0 Fixed、1 Random、2 Approach、3 Custom。H `01_09_03.html:78–88` 列出名称；R `rpg_objects.js:8512–8525` 给出 1/2/3 分派，0 不执行自主移动 | 固定 0 |
| `moveSpeed` | 移动速度数字；H `:79` 说明数字越大越快。R setter `:6303–6305` 不校验范围。编辑器所有可选值的上下界未在本轮文字资料中确证 | 固定 3 |
| `moveFrequency` | 移动频率数字；H `:79` 说明数字越大间隔越短；R `:8529–8530` 给出停止阈值公式，setter `:6311–6313` 不校验范围 | 固定 3 |
| `moveRoute` | 原生 MoveRoute 对象；自主移动与强制路线共享结构，见后文 | 固定只含 route end、repeat true、skippable false、wait false |
| `priorityType` | H `01_09_03.html:105–115` 为 Below / Same / Above；R `rpg_objects.js:6331–6336,6475–6476` 确认 Same 为 1、Below 为 0；Above 为第三个原生模式 2，尚无本轮编辑器保存样例补证 | 固定 1；F 空事件样例为 0 |
| `walkAnime` | Boolean，行走时播放动画（H `:93–94`） | 固定 true |
| `stepAnime` | Boolean，停止时播放踏步动画（H `:96–97`） | 固定 false |
| `directionFix` | Boolean，移动时保持朝向（H `:99–100`） | 固定 false |
| `through` | Boolean，穿过地形与事件阻挡（H `:102–103`） | 固定 false |
| `trigger` | 0 Action Button、1 Player Touch、2 Event Touch、3 Autorun、4 Parallel；H `:117–136`，R `:8705–8709,8721–8748` 及地图玩家触发逻辑共同确定 | 五种均有正式表达 |

注意：R 的字符对象构造初始值不是 EventPage 缺字段时的默认协议。页设置会直接读取并赋入字段，不能用 `Game_CharacterBase.initMembers` 的初始值证明省略字段安全。当前 compiler 写死的值属于 **Compiler Default**，也不能直接称为编辑器默认值。[D2]

### Page Condition Slots 的全部持久化字段

H：`references/RPGMV/Help/page/03_40.html:24–37`。R：`references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:8621–8656`。

| 字段 | 启用时的原生含义 | 非启用时的状态 |
| --- | --- | --- |
| `switch1Valid`, `switch1Id` | Boolean 与 System switch ID；要求 ON | ID 在 JSON 中仍存在，R 不读取它 |
| `switch2Valid`, `switch2Id` | 第二个独立 switch 槽；要求 ON | 同上；不能把两槽合并而忽视保存状态 |
| `variableValid`, `variableId`, `variableValue` | Boolean、System variable ID、数值阈值；R 使用 `>=` | ID 与阈值仍可保存在禁用槽里 |
| `selfSwitchValid`, `selfSwitchCh` | Boolean 与本 Map Event 的 A/B/C/D 自开关字母；R 键为 mapId/eventId/字母 | 字母在禁用时仍存在 |
| `itemValid`, `itemId` | Boolean 与 item ID；队伍持有该物品 | ID 仍存在 |
| `actorValid`, `actorId` | Boolean 与 actor ID；角色在队伍 | ID 仍存在 |

所有激活槽按 AND 组合，全部未激活时地图页可用；多个页可用则从数组尾部选择最高页号（R `:8610–8618`；H `01_09_03.html:56–72`）。H 第 66 行写 variable “greater than”，R 明确是 `>=`；应记录并用边界样例验证，而不是照文字写成 `>`。

ID 的可用集合来自相应工程数据库，并不是本报告给一个全局最大整数即可替代。A/B/C/D 来自项目已有领域约束；本轮 H 的属性页只给 String，字母枚举仍可在未来编辑器样例中补证。数值阈值的 UI min/max 本轮未确认；R 的比较不自行限定。

当前 `PageConditions` 将槽的存在当作启用标志，没有正式表达“禁用但保留上次值”的形状。[D1] `:53–64`、[D5] `:8–60` 只渲染激活槽；[D6] `:1051–1068` 将未激活 actor/item/switch/variable ID 改为 0，selfSwitchCh 改为 A，variableValue 改为 0。与 F 中仍存 ID 1 的禁用槽相比，这已经发生数据变化。R 原生条件计算暂不读取禁用值，但编辑器再次勾选条件、Script Input 或插件读取原始 `$dataMap` 时可能观察其区别；是否允许这种归一化属于后续等价契约决定，本报告不替用户裁定。

### 页图像全部字段

H：`references/RPGMV/Help/page/03_41.html:24–29,39–69`；R：`rpg_objects.js:8678–8695`。

| 字段 | 边界与效果 |
| --- | --- |
| `tileId` | 数字；`> 0` 时该页使用图块图像，否则使用人物图像。Tilemap 定义的通用 tile 区间见 `rpg_core.js:5273–5285`，但这不能证明事件图像选择器允许所有通用 tile ID；其精确选择集合待编辑器证据 |
| `characterName` | `img/characters` 文件名 stem；空字符串表示无人物图像；H `01_11_01.html:42–48` 说明人物图规格与 `$` / `!` 特殊文件名前缀 |
| `characterIndex` | 普通人物图内的 0 起始人物序号。H `01_11_01.html:44` 为 8 人物布局，R `rpg_sprites.js:300–315` 用 index `% 4` 与 `/ 4` 选择块，因此普通图 0..7；大图的显示块固定为 0，实际保存非零 index 的规则未确认 |
| `direction` | 2/4/6/8 对应下/左/右/上，H `01_11_01.html:44` 给四方向；R `rpg_sprites.js:322–324` 用 `(direction - 2) / 2` 取方向行；runtime setter 并不严格校验，不能据此把任意数字称为合法编辑器值 |
| `pattern` | 初始图案 0/1/2；H 同上为三图案；R `rpg_sprites.js:318–320` 取 pattern，`rpg_objects.js:6597–6602` 对动画内部 pattern >=3 显示中间帧。内部动画循环状态与可选初始图案应区分 |

图块模式会在 Game_Character 的运行状态中清空人物图名称/index（R `rpg_objects.js:6667–6671`），但这不证明编辑器源 JSON 中的非激活人物图字段可以删除或改写；源字段保留策略仍待决策。

## MoveRoute 与页自主移动的边界

H `references/RPGMV/Help/page/01_10_06_01.html:26–29` 明确：页 Custom 自主移动和 Set Movement Route 共用路线概念及窗口。数据属性见 `03_47.html:24–28,38–61` 与 `03_46.html:25–26,36–45`。

| 字段 | 原生意义与依据 |
| --- | --- |
| `list` | `MoveCommand[]`，每项 `code`、`parameters`；与外层 EventCommand 的 `indent` 无关 |
| `repeat` | Boolean；到尾部重头重复，R `rpg_objects.js:7192–7198` |
| `skippable` | Boolean；无法移动时仍推进路线项，R `:7201–7208` |
| `wait` | Boolean；205 事件指令以此设置解释器 route 等待，R `:9783–9792`；H `01_10_06_01.html:117–118` 说明编辑器仅在事件指令路线里可设置此选项，自主移动窗口不开放 |

R `rpg_objects.js:6841–6886` 明确 code 0 为 route end、1..45 为 45 个原生移动操作；`:6953–7094` 定义参数使用方式。H `01_10_06_01.html:46–108` 覆盖全部类别，明确的部分输入范围包括 Jump x/y -100..100、Wait 1..999 帧、Opacity 0..255。移动速度/频率等仍应补足 UI 上下界证据，不能把 setter 接受数字误作所有数字都合法。

R `:8502–8508` 在强制路线期间暂停自主路线推进；`:8512–8525` 仅 moveType 3 调用 Custom。由此可区分页中保存的 route、当前是否启用 Custom、强制路线运行状态。它们不应被当成同一开关。页中非 Custom 的 route 仍在数据里，保留/规范化策略待决定。

当前 EventPage 没有 route 输入，compilePage 使用固定空路线。[D1][D2] 具体移动操作 helper 的参数分支覆盖属于独立指令语义研究；本报告不以“45 个 helper 已存在”宣称完整。

## Common Event 的完整数据与执行上下文

H `references/RPGMV/Help/page/03_31.html:24–29,39–69` 列出五个字段；`01_08_11.html:24,35–55` 说明触发语义。

| 字段 | 原生含义与边界 | 当前情况 |
| --- | --- | --- |
| `id` | CommonEvents 数组内 ID | 支持 |
| `name` | 编辑器识别名称，字符串 | 支持 |
| `list` | EventCommand 数组 | 有 commands |
| `trigger` | 0 None、1 Autorun、2 Parallel。1/2 在地图画面按 switchId 激活；0 可被事件、技能、物品显式调用 | 三种支持 |
| `switchId` | 触发开关 ID；trigger 0 时在 JSON 中仍存在，原生激活逻辑不读它 | trigger 1/2 可表达；trigger 0 反编译省略该值，再编译固定变 1 |

R `rpg_objects.js:6174–6182` 按公共事件数组顺序选择第一个激活 Autorun；`:6224–6235` 使每个激活 Parallel 拥有自己的解释器并在结束后重启。**H `01_08_11.html:46` 的“同开关最小 ID”说明不能直接推广为 Parallel 互斥**：R `:5553–5555,5573–5576,6068–6070` 为全部 trigger 2 项建立独立对象并逐个更新。静态代码足以提出这个文档概括边界，最终代表性运行应覆盖两个 Parallel 共用一开关。

公共事件的声明容器不固定其调用上下文。R `:9368–9379` 的 command117 创建子解释器并在仍在同张地图时传递调用者 eventId；由地图事件调用时，“本事件”与自开关可继承调用者。R `:8800–8805,8816–8820` 的预留公共事件和地图 Autorun 设置没有传 eventId，得到 0。战斗事件里调用公共事件仍处于战斗上下文。不能一律认定 Common Event 有独立 Map Event Identity，也不能仅凭定义位置认定某个指令绝不在战斗执行。

当前丢失路径见 [D3] `:150–172` 与 [D2] `:59–68`：none 时省略 switch，编译的缺省 switchId 是 1。T `references/RPGMV/NewData/data/CommonEvents.json:3` 的初始空条目确实为 trigger 0 / switchId 1，但这不证明用户曾选择其他开关后切回 None 时，编辑器会把它重置为 1。

## Troop 内战斗事件页与非事件字段

### 容器与字段

H `references/RPGMV/Help/page/03_57.html:24–28,38–61` 明确 Troop 外层为 `id, members, name, pages`；`03_58.html` 定义成员数据。H `01_08_07.html:24,33–54` 区分敌群名称、成员、位置与 Battle Events；第 41 行说明编辑器每 Troop 至多 8 个成员。

| 字段层级 | 完整原生字段 | 对本阶段的意义 |
| --- | --- | --- |
| Troop 外层 | `id`, `name`, `members`, `pages` | `pages` 是战斗事件，其他字段是所属敌群的身份/名称/成员；它们不是战斗页字段 |
| Member | `enemyId`, `x`, `y`, `hidden` | 数据库敌人引用、战斗画面位置、是否中途出现；与敌人 index 条件和事件指令密切相关，但不自动纳入“完整数据库 DSL 化” |
| BattleEventPage | `conditions`, `list`, `span` | H `03_27.html:24–27,37–53` 的完整页字段；无 map trigger/image/movement 字段 |

T `references/RPGMV/NewData/data/Troops.json:3` 直接展示上述所有层级及字段。现有资料支持“事件页可以独立于成员/名称建模”的数据结构事实，不替产品选择所有权。无论最终是只接管每个 Troop 的 pages 还是其他 Data Domain 形状，都必须明确未接管 `id/name/members` 的保留、并发漂移与删除含义。ADR 0003 已规定 Data Domain 所有权，不能未经决策把新增事件支持变成整项敌群重建。[D4][A3]

### BattleEventPage::Conditions 全字段

H `references/RPGMV/Help/page/03_28.html:24–36,46–125`；编辑器解释 `01_08_07.html:63–78`；R `rpg_objects.js:5303–5342`。

| 字段 | 启用条件与精确 runtime 语义 |
| --- | --- |
| `turnEnding` | Boolean；要求 `BattleManager.isTurnEnd()`；它本身也是启用标志，没有独立 turnEndingValid |
| `turnValid`, `turnA`, `turnB` | Boolean 与回合参数 A/B；B=0 时仅回合数 n=A；B>0 时要求 n>=1、n>=A、且 n%B=A%B |
| `enemyValid`, `enemyIndex`, `enemyHp` | Boolean、0 起始 troop member 序号、HP 百分比阈值；成员必须存在且 hpRate*100 <= enemyHp |
| `actorValid`, `actorId`, `actorHp` | Boolean、actor 数据库 ID、HP 百分比阈值；角色对象必须存在且 hpRate*100 <= actorHp |
| `switchValid`, `switchId` | Boolean、System switch ID；要求 ON |

全部启用条件为 AND；如果五类条件一个都没启用，返回 false，**与无条件地图页不同**。敌人索引的有意义范围取决于当前 troop 成员数；actorId 不应误写成队伍位置。HP 按百分比解释，通常有意义区间为 0..100，但 H 文字只描述百分比，未在本轮明确给控件上下界；turnA/turnB 的 UI min/max 和小数排斥也需编辑器样例或可验证输入规则。R 的比较代码不能单独建立完整 UI 合法值集合。

禁用的 enemyIndex/HP、actorId/HP、switchId、turnA/B 都在原生 JSON 中存在。T `Troops.json:3` 可见所有 valid 为 false 时，仍保留 actorId/switchId 1、两个 HP 50、enemyIndex/turnA/turnB 0。是否允许这些非激活值归一化，与地图页槽位是同一类未决问题。

### span、选择顺序与战斗调度

| span | H 说明 | R 的具体实现 |
| --- | --- | --- |
| 0 Battle | 每场战斗满足条件后一次 | 运行后设置该页 eventFlag，后续不再选择 |
| 1 Turn | 每回合可运行一次 | 同样设置 flag；`increaseTurn` 清掉 span=1 页的 flag |
| 2 Moment | 条件满足时反复运行 | 不设置阻止重复的 flag，解释器空闲后可再次选中 |

H `01_08_07.html:80–88`；R `rpg_objects.js:5345–5372`。同一时刻多个页满足时，从数组头部扫描，先运行最低页号并 break；**不得沿用地图页“最后一个满足者优先”的实现**。有已预留 Common Event 时先设置该公共事件，之后才扫描战斗页。正在运行的解释器不会被新页抢占。

R `rpg_managers.js:2265–2290` 表明 BattleManager 在 start/turn/turnEnd 阶段处理事件、先处理已有解释器、检查战斗结束，再设置下一事件；强制行动另有先行分支。因此“Moment”不等于任意 JavaScript 时刻都即时检查，验收应使用真实战斗调度代表场景。

当前 `DslOwnedDeclaration` 与 `EventDefinition` 不含战斗事件，[D1] `:4–10`；反编译输出只遍历地图、CommonEvents 与 System，[D3] `:54–82`；生成路径只构造地图、CommonEvents、System，[D4] `:47–94`。项目数据读取 `Troops.json` 作为引用输入（`project-data/project.ts:48`）不等于支持编写战斗页。目前没有把 Troops pages 覆盖成默认页的路径；主要缺口是无法接管、定义、生成与反编译。

## 共享指令列表及上下文边界

三类事件的 `list` 均为 `EventCommand[]`（H `03_39.html:68–70`、`03_31.html:46–48`、`03_27.html:44–46`），元素的完整公共字段是 `code, indent, parameters`（H `03_38.html:24–27,37–53`）。参数 schema 随 code 变化，帮助属性页不提供完整位置表。

以首方帮助 `01_10_01.html` 至 `01_10_16.html` 的命令级 h2 标题计，恰有 105 个编辑器指令族。R `rpg_objects.js:9058–10514` 有 112 个 `commandNNN` handler，它们含 continuation/branch handler；两者不是互相替代的完整性计数。路线还有单独的 45 个子操作。完整分支、参数和 continuation 覆盖应由另一份指令研究建立矩阵。

对模型与验收有直接影响的上下文事实：

- R `rpg_objects.js:8800–8805` 的解释器携带 mapId 和 eventId；Map Event 开始时传入 eventId（`:6161–6168`），战斗页只设置 list（`:5354`），事件身份不能脱离调用环境解释。
- R `:9028–9037` 的地图角色选择器在战斗中直接返回 null；地图里负数取玩家，正数取指定 Map Event，0 取当前 eventId。R `:9572–9578` 的自开关控制需要 eventId>0；`:9832–9837` 的 Erase Event 也需当前地图及有效 eventId。
- R `:9007–9025` 的敌人/战斗者选择器依赖当前 troop 及 inBattle；它不是项目数据库 enemyId 引用。
- 部分指令显式在战斗跳过：例如 Transfer Player `:9709–9726`、Scroll Map `:9771–9780`、Weather `:9967–9975`、Battle Processing `:10130–10149`、Shop `:10177–10187`、Name Input `:10191–10199`、Menu/Save `:10465–10480`。运行时跳过不等于 editor 禁止写入；是否静态报错或警告是后续验证政策。
- R `:8923–8938` 对不存在 handler 的 command code 会递增跳过。这可以让某些序列“运行没有立即报错”，却不能证明它可被编辑器正确显示或保存。原生 continuation 还包括被父指令主动消费的 401/405/408/605/655（`:9063,9162,9175,10180,10496`）。
- R `:10494–10514` 的 Script 与 Plugin Command 都是原生功能；Plugin Command 先按空格拆分再交给插件 override。支持原生指令的序列化，不自动包含插件私有参数语义或任意脚本程序的正确性。

列表中的 code 0、结构结尾、路线 505 镜像等编辑器形状，不应只按“有没有独立 runtime handler”决定去留。当前反编译 `normalizeCommandList` 会移除全部 code 0（[D5] `:198–201`），需要与 canonicalization 规则及完整组合样例一起审定；本轮不把这项行为直接判定为每种输入都会出错。

## 初始值证据：随包值、样例值与 Compiler Default

| 对象 | 本轮实际观察到的值 | 证据边界 |
| --- | --- | --- |
| 随包 Map001 | `events` 里没有非空事件；本地独立 runtime 的 Map001 也没有事件 | T 的 Map 不能证明事件新建默认值 |
| F 空 Map Event（EV001） | `note:""`；禁用条件 ID 多为 1、自开关 A、variableValue 0；空图像 index0/name空/direction2/pattern0/tileId0；速度3/频率3/类型0；priority0；walk true，其余页选项 false；trigger0；route end / repeat true / skippable false / wait false | `references/rmmv-test-project/data/Map001.json:6`；仅是已保存样例 |
| 首方帮助截图 | `Help/inc/img/01_09_03_img02.png` 显示 Fixed、Speed 3、Freq 3、Below、Action、仅 Walking 勾选 | 文档图片可佐证展示状态，不能证明所有创建路径或所有合法值 |
| 随包空 Common Event | id1、name空、trigger0、switchId1、list只有 `{code:0,indent:0,parameters:[]}` | T `NewData/data/CommonEvents.json:3`，直接证明分发模板取值 |
| 随包空战斗页 | 所有启用标志 false、HP50、actorId/switchId1、enemyIndex/turnA/turnB0、span0、list只有 end marker | T `NewData/data/Troops.json:3`；该条另含成员和名称 |
| 当前 compilePage | 图像/移动/动画按前述固定值，priority1 | [D2] `:72–107`；这是产品 Compiler Default，与 F 的 priority0 不同 |
| 当前 compileConditions | 未启用数据引用 ID0，selfSwitch A，variableValue0 | [D6] `:1051–1068`；这是产品归一化，不能称为编辑器默认 |

不能以“禁用时 runtime 不读取”为由，直接声称变更所有禁用字段满足用户确认的数据语义等价。允许的等价类至少要交代：原生 runtime 当下行为、编辑器再次编辑后的行为、脚本/插件直接读取 `$data*` 的可观察状态，哪些属于承诺。该选择留给决策票。

## 对照当前实现的缺口索引

| 范围 | 已有能力 | 缺失或丢失 | 证据 |
| --- | --- | --- | --- |
| Map Event 外层 | 显式 mapId/id/name/x/y/pages | note 无输入、读取和写回 | [D1] `:24–32`；[D2] `:46–56`；[D5] `:92–114` |
| 页条件/触发/指令 | 固定槽的激活值、五类 trigger、commands | dormant 槽值被省略并重建；未知 trigger 被默认到 action | [D1] `:47–64`；[D5] `:8–60,264–280`；[D6] |
| 图像、移动与选项 | 编译会写全 runtime 所需字段 | 全部无正式 DSL 输入；反编译丢弃原值，编译固定值覆盖 | [D2] `:72–107`；[D3] `:215–222`；[D5] `:118–143` |
| Common Event | id/name/三种 trigger/active switch/commands | none 的 switchId 丢失；未知 trigger 被默认 none | [D3] `:150–172`；[D2] `:59–68`；[D5] `:253–261` |
| Troop 战斗页 | 项目读取 Troops 以解析引用 | 无顶层声明、完整页模型、生成或反编译路径 | [D1] `:4–10`；[D3] `:54–82`；[D4] `:47–94` |
| 原始未知字段 | carrier 的 Map 外层通过 spread 保留 | 事件对象、页、command 只取已知字段，未知数据不带入 DSL；重建条目会丢失 | [D4] `:141–179`；[D5] `:92–194` |

已有流程的具体风险是：`decompile → compile` 生成新的事件对象，再由 [D4] 的 carrier 重建写回；spread 保留的是 Map 外层，**不保留被替换事件的图像、备注或未知字段**。本报告由代码路径确认该风险，没有把尚未运行的端到端场景写成已验证测试。

## 必须继续求证或决策的事项

| 问题 | 已知事实 | 尚缺证据/决策 | 建议证据入口 |
| --- | --- | --- | --- |
| 编辑器本体版本 | 所带 runtime 是 1.6.1，exe 哈希已留存，文件版本属性为空 | supplied 编辑器实际版本 | Help/About 的实际观察；必要时有针对性的二进制版本资源分析 |
| 新建、清空、复制/粘贴默认值 | H 描述操作；T/F 有具体值 | 各路径是否相同、图像更换是否联动 priority、切换类型是否重置 latent 值 | 在隔离复制工程中创建并保存最小样例；只在文档/样例不能解释时 REA |
| 非激活字段的保存 | T/F 保留这些字段，R 原生激活逻辑有时不读它们 | 禁用再启用、None trigger、非 Custom route、图块/人物模式切换时怎样保存；允许的等价类 | 编辑器前后 JSON 差异；之后的无损契约 grilling |
| 合法值全集 | 已有字段类型、主要枚举、部分显式范围和 runtime 运算 | moveSpeed/frequency、条件阈值与 turn 输入 min/max、tile picker 集合、页数限制等 | 首方控件 UI、保存样例；必要时 focused REA，而非对整个编辑器先做大规模逆向 |
| 编辑器可编辑序列 | R 明确消费的指令和参数；H 有 105 族 | 505、结构 marker、跨上下文命令在编辑器中展示/重存是否规范 | 代表性原生序列重新打开和保存；和指令语义研究共用 fixture |
| 无条件战斗页、页优先级和 span | R 已给确定执行语义，H 大体吻合 | 实施验收应选哪些行为场景；尚无真实执行记录 | 地图多页高序优先、战斗多页低序优先、turn0/周期、0HP阈值、三个 span 场景 |
| 公共事件调用上下文 | R 保留调用者 eventId 的条件已知；Parallel 各自解释器 | static validation 在不同调用链如何处理；H 最小 ID 概括是否误导 Parallel | 两公共事件同开关、地图调用链与战斗调用链的代表运行 |
| Troop 所有权 | pages 与 id/name/members 可分开识别；ADR 0003 按 Data Domain 接管 | 接管粒度、无定义/删除的含义、成员变化对 index 引用与漂移检查的要求 | 所有权 grilling；无需先逆向才能作出该产品决定 |
| 未知数据/插件私有字段 | 当前读取器只取已知字段，可能丢失 | 明确保留还是拒绝、报错阶段与定位、如何覆盖所有嵌套层 | 等价与未知数据决策；保留并不要求理解插件语义 |

目前没有一个为了列清字段而必须立即打开原生二进制的阻塞。REA 的合理入口是已命名且现有帮助、模板和保存样例无法回答的编辑器问题。真实编辑器/游戏测试属于之后执行验收，本轮没有完成。

## 问题完成度

- **已答**：三类原生事件容器与全部字段；页条件及主要 trigger/span 枚举；note/meta 区分；地图页与战斗页相反的优先顺序；非激活字段真实存在；Troop 事件/非事件字段边界；共享解释器的关键调用上下文；当前实现的主要支持和丢失路径；runtime 版本与哈希基线。
- **部分已答**：所有字段的合法值集合与默认值。类型、枚举、引用上下文、部分显式输入范围已经建立；模板/样例取值已经分级记录，但完整 UI 范围、新建操作默认值和重存规范化仍缺真实编辑器证据。
- **未答且未声称完成**：supplied editor 本体版本、完整编辑器保存行为、真实编辑器重开/保存结果、真实游戏场景运行结果。最终 DSL、Data Domain 接管粒度、等价定义与未知数据策略是地图的后续设计决定，不由本研究越权代答。

## 产品源码和 ADR 引用索引

- [D1] `packages/rpgmaker-event-dsl/src/domain/declarations.ts:4–10,24–64`。
- [D2] `packages/rpgmaker-event-dsl/src/compiler/events.ts:46–107`。
- [D3] `packages/rpgmaker-event-dsl/src/decompiler/project.ts:54–82,114–183,215–222`。
- [D4] `packages/rpgmaker-event-dsl/src/project-data/materialization.ts:47–94,141–179`。
- [D5] `packages/rpgmaker-event-dsl/src/decompiler/core.ts:8–60,92–201,253–280`。
- [D6] `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1051–1080`。
- [A3] `docs/adr/0003-workspace-compile-push-model.md`，已接受的 Workspace Compile/Push 与 Data Domain 所有权模型。

复核方法：只读文本、首方帮助截图视觉检查、JSON 解析计数、限定文件 SHA-256 与 Windows 文件版本属性查询。没有通过静态推断宣称执行成功；没有发布原生源码或资产副本。
