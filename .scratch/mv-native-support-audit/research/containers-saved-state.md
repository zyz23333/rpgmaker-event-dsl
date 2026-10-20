# MV 原生事件支持复核：容器与保存状态

调研日期：2026-10-20。代码基线：`298a407535debfdd75afc70d03f0ff49a546e972`，Compile Contract Version `mv-1.6.1/23`。范围为 Map / Common / Troop 容器、页字段、默认状态及完整工程往返；不把既有验收记录视作事实的最终来源。

## 结论

**发现一个可稳定复现的正常原生保存形态阻断：新建且从未放置事件的地图保存为 `events: []`，当前产品却把它判为非法。** 只要工程包含这样一张地图，整个 `decompileWorkspace` 失败，因而不能承诺所有正常 MV 1.6.1 工程都能完成 `decompile → compile → push`。

这是工作流和保存形态的缺口，不是“缺少某个事件指令 helper”的证明。三类事件容器和各页字段的静态模型目前没有发现另一个明显遗漏；不能据此声称已穷尽所有字段组合或排除其余缺陷。

本反例在 **Windows / Node 22.23.0** 下通过当前源代码入口与现有 built package 入口分别复现；只把 `[]` 改为 `[null]` 的两个对照都完成了全流程。失败时文件哈希证明业务状态没有改变，所以这是可接管性阻断，未观察到数据破坏。

## 首方目标、身份与证据类型

目标是用户提供的 [RPGMV.exe](F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe)，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。父调研会话本次 REA PE 资源 Evidence 为 `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd`。版本来自该 EXE 自报的 1.6.1 资源，不认证安装包发布来源。

本次直接读取由同一目标解出的完整 QML / JavaScript 文本，不依赖旧报告中的行为总结。解码资源放在 `C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/`，没有把整份首方源码放进 Git。下述资源是本地字节身份，**不是另造的 REA Evidence ID**。

| 资源 | 原 EXE offset | 解码 SHA-256 | 本报告用途 |
| --- | ---: | --- | --- |
| JsonTemplates.js | 346222 | `52fd4ca2a3f178712d94467c5770919cf716882e2ebc9a57bde0a963e9447165` | Map/Event/Common/Battle 模板 |
| MapSelectTreeBox 组件 | 8672102 | `d74ef475802a5a8cb0083a5a340968877b4352db4c2e05b1631af0bcd701cb17` | 新建地图、确认、地图数组分配 |
| DataManager 组件 | 909009 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` | 实际序列化函数 |
| Map Properties 对话框 | 8692470 | 见本次全资源 inventory.json | 其 init/OK 只改名称，无 events 初始化 |

证据分为三层：完整首方文本的静态观察；精确提取三个首方 JavaScript 函数后在隔离 VM 中的实际执行；当前产品公开 Workspace API 的实际执行。没有运行 RPGMV 编辑器 UI，也没有把隔离 JavaScript 执行称为 Qt 信号时序或原生磁盘保存观察。

## 反例：正常新建空地图被错误拒绝

### 正常原生来源

完整保存路径的各步可独立定位：

1. [JsonTemplates.js 第 20 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/346222.js:20) 的 `Map` 模板明确含 `"events":[]`。
2. [地图树第 173 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/8672102.qml:173) 的 `onMapNew` 用 `JSON.parse(JsonTemplates.Map)` 建立新地图对象并打开 Map Properties。
3. [Map Properties 第 23 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/8692470.qml:23) 的 init 载入名称，OK 写回名称；通读该完整组件未见 events 改写。
4. [地图树第 61 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/8672102.qml:61) 将 OK 连接到 `finishEdit`。[第 272 行的 finishEdit](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/8672102.qml:272) 把该对象设为 `DataManager.maps[mapId]`、标记修改，新地图仅调用 `allocateMapData(map)`。
5. [第 346 行的 allocateMapData](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/8672102.qml:346) 只为六层地图填充 `map.data`，不补 events 的 slot zero。
6. [DataManager 第 198 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/909009.qml:198) 的 `saveMap` 经 [saveDataFile 第 341 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/909009.qml:341)、`stringifyEx` 到 [stringifyMap 第 407 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/909009.qml:407)，最后对 events 调用 [stringifyDatabase 第 367 行](C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/909009.qml:367)。后者遍历 `i < data.length`，空数组循环零次，返回空 JSON 数组；没有自动插入 null。

因此，普通“新建地图 → 不放事件 → 保存”会保有 `events: []`，这是完整首方路径支持的结论。另一方面，已经存在事件后再删除可能留下 null 槽；不能从后一种地图推断所有空地图必须是 `[null]`。

随包 runtime 也没有对空数组的 slot zero 假设：[Game_Map.setupEvents](F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_objects.js:5546) 按 `$dataMap.events.length` 循环、仅实例化 truthy 元素，`[]` 安全地创建零个 Map Event。这是静态执行规则，非本次游戏运行观察。

### 生成独立输入

[定向 probe](F:/Shuen/RPG/rpgmaker-event-dsl/.scratch/mv-native-support-audit/probes/containers/new-empty-map.mts) 从上述 EXE 解码文本直接读取 Map 模板、完整 `allocateMapData`、`stringifyDatabase`、`stringifyMap` 函数；在 VM 中对该模板执行这些**原函数体**，没有让产品编译器构建 expected 数据。

产出 [first-party-new-map.json](F:/Shuen/RPG/rpgmaker-event-dsl/.scratch/mv-native-support-audit/probes/containers/first-party-new-map.json) 包含 17×13×6 的地图格数组和 `events: []`，SHA-256 `ba82d379756808bc5fdae1f5e77492bbadd59770f65f706e5b557fc990d7ede5`。这一步实际执行了所选纯 JavaScript 逻辑，但没有执行完整 QML 组件。

工作流输入拷贝自首方 `references/RPGMV/NewData/data`，保留原有 `Map001`，添加以上 `Map002` 并在 MapInfos 加入身份。工程标识为 `RPGMV 1.6.1`。对照只把新地图的 `events` 改为 `[null]`。所有执行位于独立临时 Workspace，没有修改 references 下任何文件。

### 实际公开入口结果

Node 22 的正式 [receipt](F:/Shuen/RPG/rpgmaker-event-dsl/.scratch/mv-native-support-audit/probes/containers/new-empty-map-receipt.json) 记录时间、入口及哈希、Workspace 路径、错误、成功阶段、业务文件比较。执行时间为 2026-10-20 14:54:11–14:54:18（Asia/Shanghai）。

| 入口 | Map002.events | Clone | Decompile | Check / Compile / Diff / Push |
| --- | --- | --- | --- | --- |
| 当前 `src/workspace-api.ts` | `[]` | 成功 | **失败：MV-MAP-EVENT-SHAPE** | 因失败未执行 |
| 当前 `src/workspace-api.ts` | `[null]` | 成功 | 成功 | 全部成功，Diff 为 No changes，Map002 完整值一致 |
| 当前 `dist/workspace-api.mjs` | `[]` | 成功 | **失败：MV-MAP-EVENT-SHAPE** | 因失败未执行 |
| 当前 `dist/workspace-api.mjs` | `[null]` | 成功 | 成功 | 全部成功，Diff 为 No changes，Map002 完整值一致 |

两个失败诊断相同：

```text
decompile error map:2: MV-MAP-EVENT-SHAPE:
Invalid native Map Event saved shape. at events;
expected nonempty dense event array with required null slot zero; actual
```

失败前后所有业务文件 SHA-256 比较相同，`changedFiles: []`。哈希比较排除 `node_modules` 和临时操作锁。Node 24.14.0 的先行补充运行给出相同四项结果，另存 [node24 receipt](F:/Shuen/RPG/rpgmaker-event-dsl/.scratch/mv-native-support-audit/probes/containers/new-empty-map-receipt-node24.json)，不替代 Node 22 主结果。probe 捕获这些预期反例并记录，所以脚本整体 exit 0 不代表四个 Decompile 均成功。

当前源代码 API 入口 SHA-256 为 `735839d077b0137449ff29baf7bdd094a34973b5a8b757502948b7e744f911d2`；built API 入口为 `824203f0119529a48aa4397d9ba94139abead369e650d2d528273bc726bb4d17`。probe 本身 SHA-256 为 `7ad5b413b61ae009a89d9e94281b2f507942b6757c9f751f1d82260fb724e518`。

### 产品中的原因及修订影响

[assertNativeMapEvents](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/src/map-event/native.ts:155) 一开始就拒绝 `value.length === 0`。[readMapEvents](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/src/decompiler/core.ts:93) 在处理所有地图时调用它，故一张无事件地图也会阻断整个完整候选的发布。

另外，[materializeMapCarrier](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/src/project-data/materialization.ts:224) 把输出 events 长度强制设为至少 1。**只移除 Decompile 拒绝还不够**：当前 Compile 会把无声明地图的 `[]` 变成 `[null]`。这是代码直接可见的后续保存形态差异，本次没有绕过前置拒绝再跑非法内部路径。应明确选择保留该原生载体形态，或经过决策接受有界归一化，然后验证公开往返。

历史上 [Map Event 页与备注实施票](F:/Shuen/RPG/rpgmaker-event-dsl/.scratch/complete-mv-events-implementation/issues/24-map-event-full-pages-and-note.md:65) 的 merger correction 正是发现 `[] → [null]` 后选择“拒绝缺少 mandatory slot zero”；对应 [MV-S5-MAP-011 测试](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/map-event-workspace.test.ts:178) 验证拒绝成功。该旧证据证明实现符合当时测试假设，不能证明 `[]` 不是正常原生形态。本次没有改动或重新标注旧票、测试、验收结果。

这与 [ADR 0012](F:/Shuen/RPG/rpgmaker-event-dsl/docs/adr/0012-event-saved-state-roundtrip-boundary.md:11) 的约束相关：若 unsupported form 被证明是正常 native form，需要重开正式模型。需要重开的是此处“所有地图都有 null slot zero”的假设；不是取消未知字段拒绝或整个安全校验策略。

## 其余容器与字段：本次读到了什么

以下是**静态字段/默认值对照**，不是所有组合的本轮动态验收：

| 方面 | 首方拥有该规则的来源 | 产品对应 | 本次结论 |
| --- | --- | --- | --- |
| Map Event 顶层 | JsonTemplates.js 的 Event（346222.js:22） | `map-event/native.ts`、`compiler/events.ts` | id/name/note/x/y/pages 都有正式字段；ID 不依赖 display name |
| Map Event Page 固定默认状态 | JsonTemplates.js 的 EventPage（346222.js:23） | `map-event/page.ts`、`commands/movement/page.ts` | 条件、图像、移动、优先级、四个行为开关、trigger、list 的默认值逐项一致 |
| 禁用条件仍留值 | 完整条件绑定 656030.qml；ObjCheckBox 8721360.qml | `compilePageConditions`、`renderPageConditions` | enabled 与 ref/value 独立；disabled 显式 ID 可不解析目标 |
| 非 custom 自主路线 | 701512.qml:47–66、167–180 | `commands/movement/page.ts`、`decompiler/map-page.ts` | 所有 moveType 都有 route；不是仅 custom 时才携带 |
| 图像非当前显示模式的字段 | 626433.qml 的载入/确认路径 | `map-event/page.ts`、`decompiler/map-page.ts` | characterName/index/tileId/direction/pattern 独立保留；本次未穷举交叉值 |
| Common Event | JsonTemplates.js:18；967367.qml | `validation/common-events.ts`、`compiler/events.ts`、`decompiler/project.ts` | id/name/trigger/switchId/list 均覆盖；none 仍保留非默认 switchId |
| Battle Event Page | JsonTemplates.js:24；8779077.qml、959423.qml | `battle-page-defaults.ts`、`validation/battle-pages.ts`、`compileBattlePage` | 全部五类条件、保存的 disabled 值、span 与完整 list 都有模型；默认值一致 |
| Troop carrier | JsonTemplates.js:14；Troop 编辑器、runtime | `project-data/materialization.ts` | 仅 pages 为 DSL 所有；name/members/其他载体值从 Snapshot 保留 |

首方 runtime [Game_Event.meetsConditions](F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_objects.js:8621) 与 [setupPageSettings](F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_objects.js:8678) 消费的全部原生页字段在模型中可找到对应；[Game_Troop.meetsConditions](F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_objects.js:5303) 与 setupBattleEvent 的条件及 span 语义也有对应。这里只确认字段覆盖，没有对全 Qt 加载顺序、每个参数值及实际运行触发作全量新证明。

## 有意契约边界，不计入本次新增缺陷

- Map Event 自身 x/y 放置必须落在当前地图范围内。这是 [GLOSSARY 的明确规则](F:/Shuen/RPG/rpgmaker-event-dsl/GLOSSARY.md)，与命令里历史保存的坐标范围有区别。首方地图缩小路径实际会删除越界事件（8672102.qml:379），本次没有拿合成越界 placement 当成正常保存反例。
- Common Event trigger=none 的默认 switchId=1 可省略，非默认值仍须解析已有 System Switch slot。即使 runtime 不消费 none 的 switchId，本次也没有把产品的项目引用验证政策当成漏支持的证明。
- 已启用条件的引用、非 custom 路线里的引用和脚本 gate，仍按已接受契约验证。禁用 Map/Battle 引用允许保留显式非负旧 ID。未知插件字段拒绝也是现有边界，不能算“原生指令遗漏”。
- Battle Event 至少一个 page、最多 20 页的编辑器创建上限、raw 成员位置及 ID 孔等已区分。没有用 zero-page Troop、人造坏 ID 或 sparse JavaScript array 冒充首方正常保存。

## 未知、覆盖限制与最终判定

本次有界负向调查已经找到一个足以推翻“完整原生工程往返都支持”的反例，不需要通过穷尽所有指令来建立这个否定结论。对其来源的判断是首方完整创建/保存代码推论，并由原纯 JavaScript 生成/序列化函数的隔离执行支持；若需要 UI 层最高强度佐证，可在该 EXE 新建一张地图、不放事件、保存并读取文件。

本次没有运行完整测试、没有改产品、没有 commit/push，没有从“字段都有 helper”推断运行完全正确。除 `events: []` 外，没有把未验证猜测列为确定产品缺陷。Nondefault 条件/图像/页组合和所有数量边界仍只是局部代码检查；其他子调查拥有指令域和 native runtime 的范围。

因此，当前严谨表述应包含两件事：**Map/Common/Troop 和原生指令族的覆盖很广；正常无事件新地图的保存形态目前存在确定接管阻断，尚不能无条件声称 MV 1.6.1 原生事件工作流完整支持。**
