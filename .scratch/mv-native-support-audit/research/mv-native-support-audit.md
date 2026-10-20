# MV 1.6.1 原生事件完整支持声明：独立调研

日期：2026-10-20（Asia/Shanghai）。产品基线：`298a407535debfdd75afc70d03f0ff49a546e972`，编译契约 `mv-1.6.1/23`。调查目标是验证产品是否真正完整支持原生事件；此前的票据关闭、459 项验收状态与最终报告只用作调查线索，不作为首方行为的证明。

后续修复：用户随后要求修复，当前未提交的 `/24` 改动已通过受影响的源码/构建测试及原反例重放，详见[空地图修复与定向验证](empty-map-fix.md)。下文保留 `/23` 基线的调查结论和原始失败含义。

## 判定

**当前不能无条件宣称“完整支持所有 MV 1.6.1 原生事件及其工程往返”。** 本轮确认了一个普通原生创建/保存路径产生的合法形态被拒绝：新建、尚未放置过事件的地图使用 `events: []`。工程中只要包含这样一张地图，当前源码与构建产物的公开 Decompile 都会失败，即使其他地图包含的事件本身完全受支持。

同时，较窄的 **“覆盖全部 105 类原生事件指令和 45 类移动指令”有独立来源支持**。本轮未发现遗漏整类指令或只能以 raw 表达的原生主指令；有限组合 probe 也提供了新的正证据。这不能消除已经复现的工程接管阻断，也不构成所有参数组合的穷尽证明。

前一次对话把已完成的交付/验收记录直接提升为“可以正式宣称完整支持”，判断过满；应以上述独立复核结论修正。

## 调查问题与结果

| 问题 | 当前回答 | 新证据与边界 |
| --- | --- | --- |
| 原生事件是否只有 Map/Common/Troop 三类？ | 已回答 | 首方 Help、runtime 与产品入口对照，未发现第四种类别 |
| 105 个事件指令类别是否完整？ | 库存层已回答 | 从当前 Help 105 个链接及 runtime 105 个主 handler 独立重建，每类都有正式编译/反编译路径；另核对17种结构与续行码 |
| 45 个移动指令是否有保真路径？ | 有限样本已回答 | 独立原生字面输入，45码×3种已接受缩进形态×2种终止参数形态，共270/270模块级精确往返；非UI或游戏观察 |
| 三类容器/页字段是否建模？ | 静态字段层有覆盖，完整往返不成立 | 字段和默认值与首方模板/保存代码对照；正常空地图形态确认被拒绝 |
| 分支、模式、保存状态及文本组合是否保真？ | 部分回答 | Windows/Node22.23.0公开Workspace链，25个Common Events、505条记录，包含14种Conditional根模式、全部Actor条件类型、四种Battle旗标及嵌套Choices/Loop/Movement，完整解析值相等 |
| 所有正常原生工程都能接管吗？ | **否** | 同一首方生成的 `events:[]` 输入在src/dist均失败；唯一改成`[null]`的对照均完成全部往返 |
| 所有参数值、编辑序列与实际游戏表现是否完全一致？ | 未穷尽 | 本次没有重新执行编辑器UI或游戏，没有用有限probe或历史测试状态代替这一证明 |

分项报告分别保存完整来源、精确位置、排除过程和机器结果：

- [原生指令与事件类别库存独立复核](native-inventory.md)。
- [容器与保存状态调查](containers-saved-state.md)。
- [命令参数与保存结构独立复核](command-fidelity.md)。

## 已确认缺口：原生无事件新地图阻断全工程 Decompile

### 首方行为依据

本轮对用户提供的 `references/RPGMV/RPGMV.exe` 进行 REA PE 资源检查，绑定的SHA-256是 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，文件大小19,595,264字节。资源范围内的固定版本由普通字节解析得到1.6.1.0；该版本是软件自报，不认证发行来源。

完整REA Evidence保存在 [editor-pe-resources.json](../evidence/editor-pe-resources.json)，ID为 `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd`。该ID是确定性ID，可与历史相同；本次确实重新调用了工具，但不把相同ID冒称为独立不同的历史记录。PE工具只提供资源事实，QML行为结论来自随后对同一文件内嵌文本的只读解码和阅读。

[source-identities.json](../evidence/source-identities.json) 绑定目标、版本、关键资源及Help/runtime哈希。[extract-editor.mjs](../probes/root/extract-editor.mjs) 提取了457个长度/解压消耗量已验证的QML/JS文本候选；这不是对完整Qt资源名称树的重建。完整首方源码放在Git外的 `C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/`，仓库仅保存调查脚本、元数据和必要生成输入。

关键创建/保存路径为：

1. 原EXE offset346222的 `JsonTemplates.Map` 明确包含 `events:[]`。
2. offset8672102的地图树 `onMapNew` 从该模板创建地图；Map Properties对话框及后续 `finishEdit` 没有插入事件零槽。
3. 同组件的 `allocateMapData` 只分配地图六层格数据。
4. offset909009的 `stringifyMap` 通过 `stringifyDatabase` 序列化事件数组；空数组循环零次，保持 `[]`。

上述是完整首方代码路径的静态观察与推论。此外，[new-empty-map.mts](../probes/containers/new-empty-map.mts) 精确提取并隔离执行三个原始JavaScript函数体，实际生成了 [first-party-new-map.json](../probes/containers/first-party-new-map.json)。没有在本轮启动完整Qt组件、执行编辑器UI保存或宣称观察了Qt信号时序。

随包 `Game_Map.setupEvents` 只按 `$dataMap.events.length` 遍历，并仅对非空成员创建Game_Event。`[]`创建零个事件，代码没有要求首项必须为null。该方法位于 [rpg_objects.js:5546](F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:5546)；本轮已验证它与随包NewData的同名文件哈希完全相同。

### 当前产品实际结果

环境为Windows/Node22.23.0，两个真实公开API入口分别使用当前src与当前dist。工程基于首方NewData数据，添加由上述首方函数生成的Map002，同时保留其他地图；对照的唯一语义差别是新地图的events从`[]`变为`[null]`。

| 入口 | 新地图events | 实际结果 |
| --- | --- | --- |
| src Workspace API | `[]` | Clone成功，Decompile报`MV-MAP-EVENT-SHAPE`，未发布候选源码 |
| src Workspace API | `[null]` | Decompile→Check→Compile→Diff→Push全部成功，Diff为No changes，完整Map值相等 |
| dist Workspace API | `[]` | 与src相同的Decompile拒绝 |
| dist Workspace API | `[null]` | 与src对照相同的全流程成功 |

主记录：[Node22 receipt](../probes/containers/new-empty-map-receipt.json)。两个失败案例的业务文件SHA-256在调用前后全部不变；未观察到数据损坏。捕获错误的probe进程exit0只表示调查脚本成功记录反例，不能把它误读成产品操作成功。

父调查另行阅读了复现脚本和输入，并通过built公开入口独立重放，结果同样拒绝；记录见 [root-recheck-empty-map.json](../evidence/root-recheck-empty-map.json) 与 [recheck-empty-map.mjs](../probes/root/recheck-empty-map.mjs)。这不是只转述背景代理或旧测试报告。

### 原因与应修范围

- [native.ts:155](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/src/map-event/native.ts:155) 的 `assertNativeMapEvents` 直接拒绝长度0，要求首项null。
- [core.ts:93](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/src/decompiler/core.ts:93) 对每张地图执行该验证，所以其他地图的合法事件也无法被完整接管。
- [materialization.ts:231](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/src/project-data/materialization.ts:231) 又把生成events长度强制设为至少1。只放宽读取校验仍会把原始`[]`改为`[null]`。这个后果由当前完整函数直接推导，本次没有绕过公开校验来伪造后续执行成功。
- [map-event-workspace.test.ts:178](F:/Shuen/RPG/rpgmaker-event-dsl/packages/rpgmaker-event-dsl/test/map-event-workspace.test.ts:178) 的既有 `MV-S5-MAP-011` 正在验证拒绝空events数组。通过该测试证明实现遵循既有假设，不能证明此假设符合首方正常保存域。

这触及 [ADR0012](F:/Shuen/RPG/rpgmaker-event-dsl/docs/adr/0012-event-saved-state-roundtrip-boundary.md) 的“发现正常native form后重开正式模型”条款。应重新核对并修正“所有地图均存在null零槽”的假设，同时处理读取、Compile载体输出、Diff/Push和回归用例；不应静默把`[]`修成`[null]`来绕过保存结构保证。

## 正证据与被排除的候选

270组移动路线精确往返与25事件/505记录的公开Workspace组合验证都实际通过，记录见 [movement-roundtrip.json](../probes/inventory/movement-roundtrip.json) 和 [composition-result.json](../probes/commands/composition-result.json)。它们分别是产品模块级数据执行与产品Workspace执行，不是实际原生游戏运行。

调查也保留了候选的排除过程，避免为了否定完整性而把任何差异都称为缺陷：

- Help写Jump范围为-100..100，但同一EXE的实际两轴控件为-99..99，产品范围与控件一致。
- runtime可取得Player，并不证明Set Event Location的原生选择框允许Player；实际设置为`includePlayer:false`。
- Random两个控件的输入可逆序，但完整首方保存函数显式按min/max排序。
- Actor operand的负零丢失候选未满足当前输入支持域前提；不能从模板插值单独证明合同内损失。
- Characters按整张图片固定角色网格分块，不能直接照搬Faces固定144×144产生更大索引的结论。

## 建议采用的支持声明

当前证据适合支持：

> 已覆盖RPG Maker MV 1.6.1的三类原生事件、105类事件指令和45类移动指令，具备正式DSL编反编译及Workspace同步能力。当前仍存在正常无事件新地图的接管阻断，完整工程往返支持尚需修正。

先修复并复验该普通原生反例，再重新评估完整支持声明。后续应从普通创建、删除最后事件、空地图/有事件地图混合、重新添加事件这些首方路径补充用例；不能仅把旧拒绝测试改成允许数组就结束。此次调查没有修改既有票状态、规格、ADR、产品或历史验收结果，也没有自动关闭或重开实施票。

## 操作记录与调查限界

本次调用research和reverse-engineer-anything技能，按research要求由三个背景代理独立分工，主调查负责目标身份、资源提取、最强反例复核及汇总。未运行全量测试，未重建产品，未commit/push或发布。

整理合成Workspace时，一次跨盘PowerShell Move-Item遍历了指向产品src的junction，意外移动144个源文件。这是调查操作失误。主调查先验证Git外保留文件144/144与此前最终manifest完全一致且原位置为空，再逐文件复制回原位置并重验；Git确认没有产品改动。保留目录未被删除，完整恢复记录在 [source-restoration.json](../evidence/source-restoration.json)。操作失误没有被计为产品反例。

本次没有新增原生编辑器UI或MV/NW.js游戏运行；对正常空地图的来源有首方完整代码路径和原函数隔离执行支持，但没有伪称UI落盘实测。未穷尽所有参数值、素材、工程引用、编辑序列和运行时上下文。一个确认反例已经足以否定无条件完整性；其余有限样本通过不能保证只剩这一处缺口。
