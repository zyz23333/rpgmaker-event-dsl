# MV 1.6.1 原生事件指令库存与有界保真审计

日期：2026-10-18（Asia/Shanghai）
研究票：[原生事件指令的参数与结构还存在哪些保真缺口](../issues/02-native-command-fidelity.md)
地图：[完整支持 MV 原生事件的决策地图](../map.md)
产品源码基线：`13f3aac9f0cf2bda068a1ee2d14819b92626a7be`；研究分支 `research/mv-native-command-fidelity`。

## 结论与阅读边界

105 个顶层原生指令族与 45 个移动路线代码都能在当前源码中找到正式 authoring 表达、编译分派和反编译分派；仓库的反编译覆盖样例也逐项列到了它们。这是**种类库存完整**的静态证据，不是合法参数、分支、嵌套、上下文和往返的完整性证据。本报告的逐项矩阵为每项提供可复查入口，不将“有 helper / 样例不走 raw”升级为“语义完整”。

首方随包 Help 的事件指令索引 `Help/page/01_10.html` 有 105 个唯一指令链接；与当前 105 个测试 family 经四处名称归一后逐项对应：`Get on/off Vehicle` 对测试 `Getting On and Off Vehicles`、`Change Encounter` 对 `Change Encounter Disable`、`Replay BGM` 对 `Resume BGM`、`Fadeout BGS` 去掉 Help 中末尾空白。这个比对只确认清单，不证明这些不同名称的每个参数语义。45 个移动代码同时对应 `rpg_objects.js:6842–6886` 的首方常量；代码 0 是结构记录，单列讨论。

本次深入核实了 Transfer Player 方向 0 与 Shop Processing 出售旗标，确认一个原生正式表达缺口和一个命名所承诺语义与原生参数相反的问题。另外静态调用链发现 Loop 验证未递归、Workspace 没有加载 animation/tileset 引用源。它们的影响来自源码推导，尚未执行反例。独立编辑器调查随后给出了 402 文本、505 路线镜像和空 Choice 分支 code 0 的静态保存证据；本报告引用该结果，将它们从先前的未决疑点提升为已有首方静态依据的表示缺口。

所有其余参数枚举和组合均保留“未逐参数深审”状态。未安装项目依赖，未运行 Vitest、typecheck、编辑器或游戏；测试列只记录**测试源码中的样例/断言位置**。本子调查未获取真实编辑器保存产物、未执行 native 逆向、未产生 REA Evidence ID。这里的首方 runtime 是可读随包源代码，版本为 1.6.1；它不能单独证明编辑器本体版本、保存行为或 UI 序列化。编辑器补充事实来自[独立静态证据报告](editor-serialization.md)，其临时分支 `research/mv-editor-serialization`、提交 `3f8d4fdf8711b11fe03b20fff5fab5139165869c` 已推送；可通过[固定提交中的报告](https://github.com/zyz23333/rpgmaker-event-dsl/blob/3f8d4fdf8711b11fe03b20fff5fab5139165869c/.scratch/complete-mv-events/research/editor-serialization.md)复查。该报告的 REA PE 版本证据不等于 QML 行为的 REA 证据；行为结论来自其另行标明的普通只读解码。

## 来源、定位记号与证据强度

矩阵用 `记号:行号` 表示以下文件中的一基行号。`A/flow:20` 表示 `src/commands/flow/authoring.ts:20`；`D/movement`、`C/movement` 同理。行号固定于上述产品提交以及本地只读参考资料；本报告没有提交首方源码副本。

| 记号 | 文件或范围 |
| --- | --- |
| C | [src/compiler/dispatch.ts](../../../packages/rpgmaker-event-dsl/src/compiler/dispatch.ts) |
| D | [src/decompiler/dispatch.ts](../../../packages/rpgmaker-event-dsl/src/decompiler/dispatch.ts) |
| V | [src/validation/commands.ts](../../../packages/rpgmaker-event-dsl/src/validation/commands.ts) |
| U | [src/domain/command.ts](../../../packages/rpgmaker-event-dsl/src/domain/command.ts) |
| TC | [test/events.test.ts](../../../packages/rpgmaker-event-dsl/test/events.test.ts)；编译样例的 Raw Event Command 值 |
| TD | [test/decompiler.test.ts](../../../packages/rpgmaker-event-dsl/test/decompiler.test.ts)；反编译输入样例 |
| TW | [test/workflow.test.ts](../../../packages/rpgmaker-event-dsl/test/workflow.test.ts) |
| R | `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/NewData/js/rpg_objects.js` |
| Hnn#pmm | `F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/Help/page/01_10_nn.html#pmm`；矩阵末尾数字是含 section id 的行 |

| family 文件记号 | A：authoring.ts | D：decompile.ts | C：compile.ts（若独立） |
| --- | --- | --- | --- |
| actor | [A/actor](../../../packages/rpgmaker-event-dsl/src/commands/actor/authoring.ts) | [D/actor](../../../packages/rpgmaker-event-dsl/src/commands/actor/decompile.ts) | 由 C 协调或其 shared encoder |
| audio | [A/audio](../../../packages/rpgmaker-event-dsl/src/commands/audio/authoring.ts) | [D/audio](../../../packages/rpgmaker-event-dsl/src/commands/audio/decompile.ts) | 由 C 协调或其 shared encoder |
| battle | [A/battle](../../../packages/rpgmaker-event-dsl/src/commands/battle/authoring.ts) | [D/battle](../../../packages/rpgmaker-event-dsl/src/commands/battle/decompile.ts) | 由 C 协调或其 shared encoder |
| enemy | [A/enemy](../../../packages/rpgmaker-event-dsl/src/commands/enemy/authoring.ts) | [D/enemy](../../../packages/rpgmaker-event-dsl/src/commands/enemy/decompile.ts) | 由 C 协调或其 shared encoder |
| flow | [A/flow](../../../packages/rpgmaker-event-dsl/src/commands/flow/authoring.ts) | [D/flow](../../../packages/rpgmaker-event-dsl/src/commands/flow/decompile.ts) | 由 C 协调或其 shared encoder |
| map | [A/map](../../../packages/rpgmaker-event-dsl/src/commands/map/authoring.ts) | [D/map](../../../packages/rpgmaker-event-dsl/src/commands/map/decompile.ts) | 由 C 协调或其 shared encoder |
| message | [A/message](../../../packages/rpgmaker-event-dsl/src/commands/message/authoring.ts) | [D/message](../../../packages/rpgmaker-event-dsl/src/commands/message/decompile.ts) | 由 C 协调或其 shared encoder |
| movement | [A/movement](../../../packages/rpgmaker-event-dsl/src/commands/movement/authoring.ts) | [D/movement](../../../packages/rpgmaker-event-dsl/src/commands/movement/decompile.ts) | [C/movement](../../../packages/rpgmaker-event-dsl/src/commands/movement/compile.ts) |
| screen | [A/screen](../../../packages/rpgmaker-event-dsl/src/commands/screen/authoring.ts) | [D/screen](../../../packages/rpgmaker-event-dsl/src/commands/screen/decompile.ts) | [C/screen](../../../packages/rpgmaker-event-dsl/src/commands/screen/compile.ts) |
| system | [A/system](../../../packages/rpgmaker-event-dsl/src/commands/system/authoring.ts) | [D/system](../../../packages/rpgmaker-event-dsl/src/commands/system/decompile.ts) | 由 C 协调或其 shared encoder |
| variables | [A/variables](../../../packages/rpgmaker-event-dsl/src/commands/variables/authoring.ts) | [D/variables](../../../packages/rpgmaker-event-dsl/src/commands/variables/decompile.ts) | [C/variables](../../../packages/rpgmaker-event-dsl/src/commands/variables/compile.ts) |

矩阵状态说明：

- **K**：定位了种类表达、实现入口和静态样例；本次未逐参数深审。所有 K 都包含“完整参数/分支/往返未证”。
- **S局部**：另外读过父子结构聚合/分派逻辑；仍没有证实所有合法嵌套或完整参数组合。
- **F1–F5**：后文有明确事实和有界影响分析；该项其余语义仍是 K。
- **E09**：引用已解决研究票[编辑器如何保存分支与移动路线及不启用的字段](../issues/09-editor-serialization-evidence.md)及[独立报告](editor-serialization.md)的静态事实；镜像用途和生成规则已有证据，真实端到端保存、异常镜像冲突策略仍未决。
- **V 有入口**：仅表示存在该 kind 的专项验证代码，不意味着该 kind 每个字段都校验。`V:28（无该 kind 特化）` 表示已读 `validateNodes` 全函数但未找到该 kind 的处理，不能解读成“通过全参验证”。
- **TC 未定位**：在全 `test/` 的 `code: N` 搜索及主编译测试中未定位该顶层码的编译值断言；TD 反编译样例依然存在。这是有界搜索结果。

## 105 个顶层指令族逐项库存

主码与其 Continuation Event Command 分开写。404、412、604 是当前编译器的父结构结束记录，库存补充了测试 `codes` 注释未列的这些记录；它们不另算顶层指令族。205 的编辑器 505 关系由 E09 的独立静态证据补充。每一行的 R 指向主码首方解释器入口，不代表逐行方法均已深入审核。

| 序号 | 首方指令族与 Help 位置 | 主码 / 续行与分支码 | 正式 helper 与 authoring 位置 | 编译 / 反编译 / 首方 runtime 入口 | 专项 validation 入口 | 现有反编译 / 编译样例 | 本次审查状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Show Text（H01#p01:22） | 101 / 401 | `showText`；A/message:12 | C:107；D:271 → D/message:15；R:9058 | V:28（无该 kind 特化） | TD:675；TC:383 | K |
| 2 | Show Choices（H01#p02:143） | 102 / 402,403,404 | `showChoices`；A/message:86 | C:569；D:273 → D/message:75；R:9088 | V:93 | TD:684；TC:385 | S局部；E09静态：402缺文本；其余 K |
| 3 | Input Number（H01#p03:170） | 103 | `inputNumber`；A/message:39 | C:126；D:407；R:9131 | V:90 | TD:695；TC:393 | K |
| 4 | Select Item（H01#p04:187） | 104 | `selectItem`；A/message:50 | C:133；D:417；R:9145 | V:90 | TD:701；TC:394 | K |
| 5 | Show Scrolling Text（H01#p05:203） | 105 / 405 | `showScrollingText`；A/message:66 | C:140；D:280 → D/message:178；R:9159 | V:28（无该 kind 特化） | TD:707；TC:395 | K |
| 6 | Comment（H03#p08:143） | 108 / 408 | `comment`；A/flow:62 | C:171；D:282 → D/message:225；R:9173 | V:28（无该 kind 特化） | TD:716；TC:382 | K |
| 7 | Conditional Branch（H03#p01:22） | 111 / 411,412 | `conditional`；A/flow:20 | C:154；D:284 → D/flow:16；R:9183 | V:268 | TD:725；TC:849 | S局部；K（条件参数未全审） |
| 8 | Loop（H03#p02:79） | 112 / 413 | `loop`；A/flow:38 | C:185；D:291 → D/flow:70；R:9329 | V:28（无该 kind 特化） | TD:734；编译值断言未定位 | F3：验证不递归；其余 K |
| 9 | Break Loop（H03#p03:89） | 113 | `breakLoop`；A/flow:42 | C:198；D:403 → D/system:57；R:9342 | V:28（无该 kind 特化） | TD:744；编译值断言未定位 | K |
| 10 | Exit Event Processing（H03#p04:95） | 115 | `exitEvent`；A/flow:46 | C:201；D:405 → D/system:57；R:9362 | V:28（无该 kind 特化） | TD:750；编译值断言未定位 | K |
| 11 | Common Event（H03#p05:101） | 117 | `callCommonEvent`；A/flow:50 | C:204；D:331；R:9368 | V:107 | TD:756；TW:746 | K |
| 12 | Label（H03#p06:115） | 118 | `label`；A/flow:54 | C:211；D:340；R:9383 | V:28（无该 kind 特化） | TD:762；编译值断言未定位 | K |
| 13 | Jump to Label（H03#p07:129） | 119 | `jumpToLabel`；A/flow:58 | C:214；D:345；R:9388 | V:28（无该 kind 特化） | TD:768；编译值断言未定位 | K |
| 14 | Control Switches（H02#p01:22） | 121 | `controlSwitches`；A/variables:42 | C:217；D:350；R:9416 | V:41 | TD:774；TC:399 | K |
| 15 | Control Variables（H02#p02:38） | 122 | `controlVariables`；A/variables:53 | C:226；D:361 → D/variables:4；R:9424 | V:44 | TD:780；TC:398 | K |
| 16 | Control Self Switch（H02#p03:168） | 123 | `controlSelfSwitch`；A/variables:71 | C:233；D:363；R:9572 | V:28（无该 kind 特化） | TD:786；编译值断言未定位 | K |
| 17 | Control Timer（H02#p04:188） | 124 | `controlTimer`；A/variables:82 | C:240；D:373；R:9581 | V:28（无该 kind 特化） | TD:792；TC:408 | K |
| 18 | Change Gold（H04#p01:22） | 125 | `changeGold`；A/variables:97 | C:247；D:390；R:9591 | V:83 | TD:798；TC:400 | K |
| 19 | Change Items（H04#p02:38） | 126 | `changeItems`；A/variables:108 | C:254；D:427；R:9598 | V:62 | TD:804；TC:411 | K |
| 20 | Change Weapons（H04#p03:56） | 127 | `changeWeapons`；A/variables:121 | C:264；D:441；R:9605 | V:69 | TD:810；TC:412 | K |
| 21 | Change Armors（H04#p04:76） | 128 | `changeArmors`；A/variables:141 | C:275；D:456；R:9612 | V:76 | TD:816；TC:413 | K |
| 22 | Change Party Member（H04#p05:96） | 129 | `changePartyMember`；A/variables:161 | C:286；D:471；R:9619 | V:87 | TD:822；TC:414 | K |
| 23 | Change Battle BGM（H13#p01:22） | 132 | `changeBattleBgm`；A/movement:33 | C:297；D:484 → D/audio:5；R:9635 | V:28（无该 kind 特化） | TD:828；TC:687 | K |
| 24 | Change Victory ME（H13#p02:49） | 133 | `changeVictoryMe`；A/movement:40 | C:304；D:486 → D/audio:5；R:9641 | V:28（无该 kind 特化） | TD:840；TC:689 | K |
| 25 | Change Save Access（H13#p05:109） | 134 | `changeSaveAccess`；A/movement:47 | C:311；D:488 → D/system:5；R:9647 | V:28（无该 kind 特化） | TD:852；TC:693 | K |
| 26 | Change Menu Access（H13#p06:123） | 135 | `changeMenuAccess`；A/movement:54 | C:318；D:490 → D/system:5；R:9657 | V:28（无该 kind 特化） | TD:858；TC:694 | K |
| 27 | Change Encounter（H13#p07:137） | 136 | `changeEncounterDisable`；A/movement:61 | C:325；D:492 → D/system:5；R:9667 | V:28（无该 kind 特化） | TD:864；TC:695 | K |
| 28 | Change Formation Access（H13#p08:151） | 137 | `changeFormationAccess`；A/movement:70 | C:332；D:494 → D/system:5；R:9678 | V:28（无该 kind 特化） | TD:870；TC:696 | K |
| 29 | Change Window Color（H13#p09:165） | 138 | `changeWindowColor`；A/movement:79 | C:339；D:496 → D/system:23；R:9688 | V:28（无该 kind 特化） | TD:876；TC:697 | K |
| 30 | Change Defeat ME（H13#p03:71） | 139 | `changeDefeatMe`；A/movement:86 | C:346；D:498 → D/audio:5；R:9694 | V:28（无该 kind 特化） | TD:882；TC:698 | K |
| 31 | Change Vehicle BGM（H13#p04:93） | 140 | `changeVehicleBgm`；A/movement:93 | C:353；D:500 → D/audio:32；R:9700 | V:28（无该 kind 特化） | TD:894；TC:699 | K |
| 32 | Transfer Player（H06#p01:22） | 201 | `transferPlayer`；A/variables:22 | C:419；D:502 → D/movement:13；R:9709 | V:110 | TD:906；TC:415 | F1：方向 0 缺正式表达；其余 K |
| 33 | Set Vehicle Location（H06#p02:40） | 202 | `setVehicleLocation`；A/movement:104 | C:448；D:504 → D/movement:51；R:9729 | V:113 | TD:912；TC:416 | K |
| 34 | Set Event Location（H06#p03:56） | 203 | `setEventLocation`；A/movement:115 | C:455；D:506 → D/movement:87；R:9748 | V:116 | TD:918；TC:418 | K |
| 35 | Scroll Map（H06#p04:78） | 204 | `scrollMap`；A/movement:133 | C:462；D:508 → D/movement:132；R:9771 | V:28（无该 kind 特化） | TD:924；TC:421 | K |
| 36 | Set Movement Route（H06#p05:100） | 205 / 505（编辑器） | `setMovementRoute`；A/movement:146 | C:469；D:510 → D/movement:147；R:9783 | V:120 | TD:930；TC:423 | S局部；E09静态：编译缺505；其余 K |
| 37 | Get on/off Vehicle（H06#p06:116） | 206 | `getOnOffVehicle`；A/movement:172 | C:484；D:512；R:9796 | V:28（无该 kind 特化） | TD:953；TC:482 | K |
| 38 | Change Transparency（H07#p01:22） | 211 | `changeTransparency`；A/movement:178 | C:491；D:519 → D/movement:192；R:9802 | V:28（无该 kind 特化） | TD:959；TC:586 | K |
| 39 | Show Animation（H07#p04:60） | 212 | `showAnimation`；A/movement:185 | C:498；D:521 → D/movement:204；R:9808 | V:124 | TD:965；TC:587 | F4：Workspace 引用缺失；其余 K |
| 40 | Show Balloon Icon（H07#p05:83） | 213 | `showBalloonIcon`；A/movement:203 | C:509；D:523 → D/movement:219；R:9820 | V:128 | TD:971；TC:588 | K |
| 41 | Erase Event（H07#p06:104） | 214 | `eraseEvent`；A/map:82 | C:367；D:525；R:9832 | V:28（无该 kind 特化） | TD:977；TC:389 | K |
| 42 | Change Player Followers（H07#p02:36） | 216 | `changePlayerFollowers`；A/movement:221 | C:520；D:530 → D/movement:234；R:9840 | V:28（无该 kind 特化） | TD:983；TC:590 | K |
| 43 | Gather Followers（H07#p03:54） | 217 | `gatherFollowers`；A/movement:230 | C:527；D:532；R:9851 | V:28（无该 kind 特化） | TD:989；TC:591 | K |
| 44 | Fadeout Screen（H10#p01:22） | 221 | `fadeoutScreen`；A/screen:23 | C:534；D:539；R:9860 | V:28（无该 kind 特化） | TD:995；TC:592 | K |
| 45 | Fadein Screen（H10#p02:34） | 222 | `fadeinScreen`；A/screen:29 | C:541；D:546；R:9870 | V:28（无该 kind 特化） | TD:1001；TC:593 | K |
| 46 | Tint Screen（H10#p03:40） | 223 | `tintScreen`；A/screen:35 | C:548；D:553 → D/screen:4；R:9880 | V:28（无该 kind 特化） | TD:1007；TC:594 | K |
| 47 | Flash Screen（H10#p04:62） | 224 | `flashScreen`；A/screen:53 | C:555；D:555 → D/screen:19；R:9889 | V:28（无该 kind 特化） | TD:1013；TC:595 | K |
| 48 | Shake Screen（H10#p05:80） | 225 | `shakeScreen`；A/screen:71 | C:562；D:557 → D/screen:34；R:9898 | V:28（无该 kind 特化） | TD:1019；TC:596 | K |
| 49 | Wait（H09#p01:22） | 230 | `wait`；A/screen:91 | C:360；D:559；R:9907 | V:28（无该 kind 特化） | TD:1025；TC:387 | K |
| 50 | Show Picture（H08#p01:22） | 231 | `showPicture`；A/screen:95 | C:853；D:568 → D/screen:53；R:9913 | V:131 | TD:1031；TC:598 | K |
| 51 | Move Picture（H08#p02:56） | 232 | `movePicture`；A/screen:113 | C:869；D:570 → D/screen:82；R:9928 | V:131 | TD:1039；TC:599 | K |
| 52 | Rotate Picture（H08#p03:87） | 233 | `rotatePicture`；A/screen:136 | C:887；D:572 → D/screen:113；R:9946 | V:28（无该 kind 特化） | TD:1047；TC:600 | K |
| 53 | Tint Picture（H08#p04:107） | 234 | `tintPicture`；A/screen:147 | C:894；D:574 → D/screen:127；R:9952 | V:28（无该 kind 特化） | TD:1053；TC:601 | K |
| 54 | Erase Picture（H08#p05:131） | 235 | `erasePicture`；A/screen:167 | C:901；D:576 → D/screen:146；R:9961 | V:28（无该 kind 特化） | TD:1059；TC:602 | K |
| 55 | Set Weather Effect（H10#p06:98） | 236 | `setWeatherEffect`；A/screen:174 | C:908；D:578 → D/screen:158；R:9967 | V:28（无该 kind 特化） | TD:1065；TC:603 | K |
| 56 | Play BGM（H11#p01:22） | 241 | `playBgm`；A/audio:16 | C:920；D:580 → D/audio:5；R:9978 | V:28（无该 kind 特化） | TD:1071；TC:700 | K |
| 57 | Fadeout BGM（H11#p02:48） | 242 | `fadeoutBgm`；A/audio:23 | C:927；D:582 → D/audio:19；R:9984 | V:28（无该 kind 特化） | TD:1079；TC:701 | K |
| 58 | Save BGM（H11#p03:62） | 243 | `saveBgm`；A/audio:30 | C:934；D:584；R:9990 | V:28（无该 kind 特化） | TD:1085；TC:702 | K |
| 59 | Replay BGM（H11#p04:68） | 244 | `resumeBgm`；A/audio:36 | C:941；D:591；R:9996 | V:28（无该 kind 特化） | TD:1091；TC:703 | K |
| 60 | Play BGS（H11#p05:74） | 245 | `playBgs`；A/audio:42 | C:948；D:598 → D/audio:5；R:10002 | V:28（无该 kind 特化） | TD:1097；TC:704 | K |
| 61 | Fadeout BGS（H11#p06:100） | 246 | `fadeoutBgs`；A/audio:49 | C:955；D:600 → D/audio:19；R:10008 | V:28（无该 kind 特化） | TD:1105；TC:705 | K |
| 62 | Play ME（H11#p07:114） | 249 | `playMe`；A/audio:56 | C:962；D:602 → D/audio:5；R:10014 | V:28（无该 kind 特化） | TD:1111；TC:706 | K |
| 63 | Play SE（H11#p08:140） | 250 | `playSe`；A/audio:63 | C:969；D:604 → D/audio:5；R:10020 | V:28（无该 kind 特化） | TD:1123；TC:707 | K |
| 64 | Stop SE（H11#p09:167） | 251 | `stopSe`；A/audio:70 | C:976；D:606；R:10026 | V:28（无该 kind 特化） | TD:1135；TC:708 | K |
| 65 | Play Movie（H11#p10:173） | 261 | `playMovie`；A/audio:76 | C:983；D:613 → D/audio:45；R:10032 | V:28（无该 kind 特化） | TD:1141；TC:709 | K |
| 66 | Change Map Name Display（H14#p01:22） | 281 | `changeMapNameDisplay`；A/map:14 | C:990；D:615 → D/system:5；R:10054 | V:28（无该 kind 特化） | TD:1147；TC:710 | K |
| 67 | Change Tileset（H14#p02:36） | 282 | `changeTileset`；A/map:21 | C:997；D:617 → D/map:5；R:10064 | V:261 | TD:1153；TC:711 | F4：Workspace 引用缺失；其余 K |
| 68 | Change Battle Back（H14#p03:50） | 283 | `changeBattleBack`；A/map:30 | C:1004；D:619 → D/map:17；R:10086 | V:28（无该 kind 特化） | TD:1159；TC:712 | K |
| 69 | Change Parallax（H14#p04:68） | 284 | `changeParallax`；A/map:41 | C:1011；D:621 → D/map:30；R:10092 | V:28（无该 kind 特化） | TD:1165；TC:713 | K |
| 70 | Get Location Info（H14#p05:86） | 285 | `getLocationInfo`；A/map:69 | C:1024；D:623 → D/map:69；R:10099 | V:264 | TD:1171；TC:714 | K |
| 71 | Battle Processing（H12#p01:22） | 301 / 601,602,603,604 | `battleProcessing`；A/battle:10 | C:374；D:293 → D/battle:10；R:10130 | V:134 | TD:1177；TC:483 | K |
| 72 | Shop Processing（H12#p02:44） | 302 / 605 | `shopProcessing`；A/battle:51 | C:584；D:300 → D/battle:71；R:10177 | V:170 | TD:1188；TC:1025 | F2：出售旗标反转；其余 K |
| 73 | Name Input Processing（H12#p03:64） | 303 | `nameInputProcessing`；A/battle:67 | C:596；D:625 → D/actor:6；R:10191 | V:175 | TD:1197；TC:1028 | K |
| 74 | Change HP（H05#p01:22） | 311 | `changeHp`；A/actor:26 | C:603；D:627 → D/actor:19；R:10202 | V:179 | TD:1203；TC:1029 | K |
| 75 | Change MP（H05#p02:42） | 312 | `changeMp`；A/actor:46 | C:614；D:629 → D/actor:19；R:10211 | V:180 | TD:1209；TC:1030 | K |
| 76 | Change State（H05#p04:78） | 313 | `changeState`；A/actor:59 | C:624；D:631 → D/actor:52；R:10229 | V:200 | TD:1215；TC:1031 | K |
| 77 | Recover All（H05#p05:96） | 314 | `recoverAll`；A/actor:72 | C:635；D:633 → D/actor:67；R:10246 | V:181 | TD:1221；TC:1032 | K |
| 78 | Change EXP（H05#p06:110） | 315 | `changeExp`；A/actor:79 | C:642；D:635 → D/actor:19；R:10254 | V:182 | TD:1227；TC:1033 | K |
| 79 | Change Level（H05#p07:132） | 316 | `changeLevel`；A/actor:99 | C:653；D:637 → D/actor:19；R:10263 | V:183 | TD:1233；TC:1034 | K |
| 80 | Change Parameter（H05#p08:152） | 317 | `changeParameter`；A/actor:119 | C:664；D:639 → D/actor:79；R:10272 | V:184 | TD:1239；TC:1035 | K |
| 81 | Change Skill（H05#p09:172） | 318 | `changeSkill`；A/actor:134 | C:675；D:641 → D/actor:97；R:10281 | V:185 | TD:1245；TC:1036 | K |
| 82 | Change Equipment（H05#p10:190） | 319 | `changeEquipment`；A/actor:147 | C:686；D:643 → D/actor:112；R:10293 | V:207 | TD:1251；TC:1037 | K |
| 83 | Change Name（H05#p11:212） | 320 | `changeName`；A/actor:160 | C:697；D:645 → D/actor:134；R:10302 | V:216 | TD:1257；TC:1038 | K |
| 84 | Change Class（H05#p12:228） | 321 | `changeClass`；A/actor:171 | C:704；D:647 → D/actor:149；R:10311 | V:219 | TD:1263；TC:1039 | K |
| 85 | Change Actor Images（H13#p10:179） | 322 | `changeActorImages`；A/actor:189 | C:715；D:649 → D/actor:163；R:10320 | V:223 | TD:1269；TC:1040 | K |
| 86 | Change Vehicle Image（H13#p11:195） | 323 | `changeVehicleImage`；A/actor:204 | C:729；D:651 → D/actor:185；R:10332 | V:28（无该 kind 特化） | TD:1275；TC:1041 | K |
| 87 | Change Nickname（H05#p13:250） | 324 | `changeNickname`；A/actor:217 | C:736；D:653 → D/actor:134；R:10341 | V:226 | TD:1281；TC:1042 | K |
| 88 | Change Profile（H05#p14:266） | 325 | `changeProfile`；A/actor:228 | C:743；D:655 → D/actor:134；R:10350 | V:226 | TD:1287；TC:1043 | K |
| 89 | Change TP（H05#p03:60） | 326 | `changeTp`；A/actor:239 | C:750；D:657 → D/actor:19；R:10220 | V:186 | TD:1293；TC:1044 | K |
| 90 | Change Enemy HP（H15#p01:22） | 331 | `changeEnemyHp`；A/enemy:18 | C:760；D:659 → D/enemy:5；R:10359 | V:230 | TD:1299；TC:1045 | K |
| 91 | Change Enemy MP（H15#p02:46） | 332 | `changeEnemyMp`；A/enemy:38 | C:771；D:661 → D/enemy:5；R:10368 | V:231 | TD:1305；TC:1046 | K |
| 92 | Change Enemy State（H15#p04:90） | 333 | `changeEnemyState`；A/enemy:51 | C:781；D:663 → D/enemy:27；R:10386 | V:247 | TD:1311；TC:1047 | K |
| 93 | Enemy Recover All（H15#p05:112） | 334 | `enemyRecoverAll`；A/enemy:64 | C:792；D:665 → D/enemy:42；R:10403 | V:232 | TD:1317；TC:1048 | K |
| 94 | Enemy Appear（H15#p06:130） | 335 | `enemyAppear`；A/enemy:71 | C:795；D:667 → D/enemy:42；R:10411 | V:233 | TD:1323；TC:1049 | K |
| 95 | Enemy Transform（H15#p07:148） | 336 | `enemyTransform`；A/enemy:78 | C:798；D:669 → D/enemy:55；R:10420 | V:234 | TD:1329；TC:1050 | K |
| 96 | Show Battle Animation（H15#p08:168） | 337 | `showBattleAnimation`；A/enemy:89 | C:805；D:671 → D/enemy:68；R:10429 | V:235 | TD:1335；TC:1051 | F4：Workspace 引用缺失；其余 K |
| 97 | Force Action（H15#p09:188） | 339 | `forceAction`；A/enemy:100 | C:816；D:673 → D/enemy:85；R:10447 | V:257 | TD:1341；TC:1052 | K |
| 98 | Abort Battle（H15#p10:208） | 340 | `abortBattle`；A/enemy:113 | C:828；D:675 → D/system:57；R:10459 | V:28（无该 kind 特化） | TD:1347；TC:1053 | K |
| 99 | Change Enemy TP（H15#p03:68） | 342 | `changeEnemyTp`；A/enemy:119 | C:831；D:677 → D/enemy:5；R:10377 | V:236 | TD:1353；TC:1054 | K |
| 100 | Open Menu Screen（H12#p04:85） | 351 | `openMenuScreen`；A/system:8 | C:841；D:679 → D/system:57；R:10465 | V:28（无该 kind 特化） | TD:1359；TC:1055 | K |
| 101 | Open Save Screen（H12#p05:95） | 352 | `openSaveScreen`；A/system:14 | C:844；D:681 → D/system:57；R:10474 | V:28（无该 kind 特化） | TD:1365；TC:1056 | K |
| 102 | Game Over（H12#p06:105） | 353 | `gameOver`；A/system:20 | C:847；D:683 → D/system:57；R:10482 | V:28（无该 kind 特化） | TD:1371；TC:1057 | K |
| 103 | Return to Title Screen（H12#p07:111） | 354 | `returnToTitleScreen`；A/system:26 | C:850；D:685 → D/system:57；R:10488 | V:28（无该 kind 特化） | TD:1377；TC:1058 | K |
| 104 | Script（H16#p01:22） | 355 / 655 | `script`；A/flow:66 | C:394；D:302 → D/message:253；R:10494 | V:35 | TD:1383；TC:1059 | S局部；K（Script Gate 见 F3） |
| 105 | Plugin Command（H16#p02:42） | 356 | `pluginCommand`；A/flow:73 | C:408；D:687 → D/system:35；R:10505 | V:28（无该 kind 特化） | TD:1392；TC:167 | F5：空白解码边界；其余 K |

## 45 个移动路线代码逐项库存

这些是 `setMovementRoute({ route: [...] })` 内的 schema 对象，**没有 45 个独立顶层函数 helper**。正式类型在 U:372–412，父 helper 在 A/movement:146，父命令为 205。编译子路线在 C/movement:75–173；反编译聚合在 D/movement:246–276，单条解码在 D/movement:279–439。`R` 指向首方常量定义；其执行入口是 R:6953 的 `processMoveCommand`。每行只证明种类映射和样例存在，未证每个范围、资源语义、参数组合或完整往返。

原生代码 31/32 等 ON/OFF 对，在 DSL 合并为同一 `kind` 加 `enabled`；因此矩阵按 **45 个原生代码**计数，而非 45 个不同 DSL kind。自主移动页的 route 目前没有正式页属性入口，此处库存不能证明自主移动已经支持。

| 原生码 | 首方 ROUTE 常量后缀 | 正式 route kind / 值；类型位置 | 编译 / 反编译 / 首方常量位置 | 当前验证 | 反编译 / 编译样例 | 本次状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | MOVE_DOWN | `moveDown`；U:373 | C/movement:90；D/movement:389；R:6842 | V:289（无该参数特化） | TD:1416；TC:429 | K |
| 2 | MOVE_LEFT | `moveLeft`；U:374 | C/movement:92；D/movement:391；R:6843 | V:289（无该参数特化） | TD:1417；TC:430 | K |
| 3 | MOVE_RIGHT | `moveRight`；U:375 | C/movement:94；D/movement:393；R:6844 | V:289（无该参数特化） | TD:1418；TC:431 | K |
| 4 | MOVE_UP | `moveUp`；U:376 | C/movement:96；D/movement:395；R:6845 | V:289（无该参数特化） | TD:1419；TC:432 | K |
| 5 | MOVE_LOWER_L | `moveLowerLeft`；U:377 | C/movement:98；D/movement:397；R:6846 | V:289（无该参数特化） | TD:1420；TC:433 | K |
| 6 | MOVE_LOWER_R | `moveLowerRight`；U:378 | C/movement:100；D/movement:399；R:6847 | V:289（无该参数特化） | TD:1421；TC:434 | K |
| 7 | MOVE_UPPER_L | `moveUpperLeft`；U:379 | C/movement:102；D/movement:401；R:6848 | V:289（无该参数特化） | TD:1422；TC:435 | K |
| 8 | MOVE_UPPER_R | `moveUpperRight`；U:380 | C/movement:104；D/movement:403；R:6849 | V:289（无该参数特化） | TD:1423；TC:436 | K |
| 9 | MOVE_RANDOM | `moveRandom`；U:381 | C/movement:106；D/movement:405；R:6850 | V:289（无该参数特化） | TD:1424；TC:437 | K |
| 10 | MOVE_TOWARD | `moveTowardPlayer`；U:382 | C/movement:108；D/movement:407；R:6851 | V:289（无该参数特化） | TD:1425；TC:438 | K |
| 11 | MOVE_AWAY | `moveAwayFromPlayer`；U:383 | C/movement:110；D/movement:409；R:6852 | V:289（无该参数特化） | TD:1426；TC:439 | K |
| 12 | MOVE_FORWARD | `moveForward`；U:384 | C/movement:112；D/movement:411；R:6853 | V:289（无该参数特化） | TD:1427；TC:440 | K |
| 13 | MOVE_BACKWARD | `moveBackward`；U:385 | C/movement:114；D/movement:413；R:6854 | V:289（无该参数特化） | TD:1428；TC:441 | K |
| 14 | JUMP | `jump`；U:386 | C/movement:116；D/movement:293；R:6855 | V:289（无该参数特化） | TD:1429；TC:442 | K |
| 15 | WAIT | `routeWait`；U:387 | C/movement:118；D/movement:300；R:6856 | V:289（无该参数特化） | TD:1430；TC:443 | K |
| 16 | TURN_DOWN | `turnDown`；U:388 | C/movement:120；D/movement:415；R:6857 | V:289（无该参数特化） | TD:1431；TC:444 | K |
| 17 | TURN_LEFT | `turnLeft`；U:389 | C/movement:122；D/movement:417；R:6858 | V:289（无该参数特化） | TD:1432；TC:445 | K |
| 18 | TURN_RIGHT | `turnRight`；U:390 | C/movement:124；D/movement:419；R:6859 | V:289（无该参数特化） | TD:1433；TC:446 | K |
| 19 | TURN_UP | `turnUp`；U:391 | C/movement:126；D/movement:421；R:6860 | V:289（无该参数特化） | TD:1434；TC:447 | K |
| 20 | TURN_90D_R | `turn90Right`；U:392 | C/movement:128；D/movement:423；R:6861 | V:289（无该参数特化） | TD:1435；TC:448 | K |
| 21 | TURN_90D_L | `turn90Left`；U:393 | C/movement:130；D/movement:425；R:6862 | V:289（无该参数特化） | TD:1436；TC:449 | K |
| 22 | TURN_180D | `turn180`；U:394 | C/movement:132；D/movement:427；R:6863 | V:289（无该参数特化） | TD:1437；TC:450 | K |
| 23 | TURN_90D_R_L | `turn90RightOrLeft`；U:395 | C/movement:134；D/movement:429；R:6864 | V:289（无该参数特化） | TD:1438；TC:451 | K |
| 24 | TURN_RANDOM | `turnRandom`；U:396 | C/movement:136；D/movement:431；R:6865 | V:289（无该参数特化） | TD:1439；TC:452 | K |
| 25 | TURN_TOWARD | `turnTowardPlayer`；U:397 | C/movement:138；D/movement:433；R:6866 | V:289（无该参数特化） | TD:1440；TC:453 | K |
| 26 | TURN_AWAY | `turnAwayFromPlayer`；U:398 | C/movement:140；D/movement:435；R:6867 | V:289（无该参数特化） | TD:1441；TC:454 | K |
| 27 | SWITCH_ON | `switchOn`；U:399 | C/movement:142；D/movement:304；R:6868 | V:296（仅引用） | TD:1443；TC:455 | K |
| 28 | SWITCH_OFF | `switchOff`；U:400 | C/movement:144；D/movement:305；R:6869 | V:296（仅引用） | TD:1448；TC:456 | K |
| 29 | CHANGE_SPEED | `changeSpeed`；U:401 | C/movement:146；D/movement:314；R:6870 | V:289（无该参数特化） | TD:1452；TC:457 | K |
| 30 | CHANGE_FREQ | `changeFrequency`；U:402 | C/movement:148；D/movement:318；R:6871 | V:289（无该参数特化） | TD:1453；TC:458 | K |
| 31 | WALK_ANIME_ON | `walkAnimation enabled:true`；U:403 | C/movement:150；D/movement:325；R:6872 | V:289（无该参数特化） | TD:1454；TC:459 | K |
| 32 | WALK_ANIME_OFF | `walkAnimation enabled:false`；U:403 | C/movement:150；D/movement:326；R:6873 | V:289（无该参数特化） | TD:1455；TC:460 | K |
| 33 | STEP_ANIME_ON | `stepAnimation enabled:true`；U:404 | C/movement:152；D/movement:331；R:6874 | V:289（无该参数特化） | TD:1456；TC:461 | K |
| 34 | STEP_ANIME_OFF | `stepAnimation enabled:false`；U:404 | C/movement:152；D/movement:332；R:6875 | V:289（无该参数特化） | TD:1457；TC:462 | K |
| 35 | DIR_FIX_ON | `directionFix enabled:true`；U:405 | C/movement:154；D/movement:337；R:6876 | V:289（无该参数特化） | TD:1458；TC:463 | K |
| 36 | DIR_FIX_OFF | `directionFix enabled:false`；U:405 | C/movement:154；D/movement:338；R:6877 | V:289（无该参数特化） | TD:1459；TC:464 | K |
| 37 | THROUGH_ON | `through enabled:true`；U:406 | C/movement:156；D/movement:343；R:6878 | V:289（无该参数特化） | TD:1460；TC:465 | K |
| 38 | THROUGH_OFF | `through enabled:false`；U:406 | C/movement:156；D/movement:344；R:6879 | V:289（无该参数特化） | TD:1461；TC:466 | K |
| 39 | TRANSPARENT_ON | `transparent enabled:true`；U:407 | C/movement:158；D/movement:349；R:6880 | V:289（无该参数特化） | TD:1462；TC:467 | K |
| 40 | TRANSPARENT_OFF | `transparent enabled:false`；U:407 | C/movement:158；D/movement:350；R:6881 | V:289（无该参数特化） | TD:1463；TC:468 | K |
| 41 | CHANGE_IMAGE | `changeImage`；U:408 | C/movement:160；D/movement:355；R:6882 | V:289（无该参数特化） | TD:1465；TC:469 | K |
| 42 | CHANGE_OPACITY | `changeOpacity`；U:409 | C/movement:162；D/movement:362；R:6883 | V:289（无该参数特化） | TD:1470；TC:470 | K |
| 43 | CHANGE_BLEND_MODE | `changeBlendMode`；U:410 | C/movement:164；D/movement:366；R:6884 | V:289（无该参数特化） | TD:1471；TC:471 | K |
| 44 | PLAY_SE | `playSe`；U:411 | C/movement:166；D/movement:373；R:6885 | V:289（无该参数特化） | TD:1473；TC:472 | K |
| 45 | SCRIPT | `script`；U:412 | C/movement:171；D/movement:375；R:6886 | V:300（Script Gate） | TD:1479；TC:473 | K；F3 上下文会绕过 Gate |

## F1：Transfer Player 缺少方向 0 的正式表达

**观察。** `src/domain/references.ts:267` 的 `Direction` 只有 2、4、6、8；U:228–232 的 `transferPlayer.direction` 使用它。A/variables:22–39 构造该正式命令。C:419–445 对直接/变量目的地都把省略方向编码为 2；D/movement:13–48 检查 `isDirection`，该检查只接受上述四值（`src/decompiler/core.ts:357–359`）。

首方 R:9709–9725 的 201 把参数第 5 槽（索引 4）传入 `reserveTransfer`；R:7451–7457 保存方向；R:7476–7487 的实际转场调用 `setDirection`；R:6468–6472 在方向值为 falsy 时不覆盖朝向。因此**原生运行时方向 0 的效果是保留朝向**。随包 Help `page/01_10_06.html:33–34` 描述转场后的方向，其 `inc/img/01_10_06_img01.png` 配图经视觉检查，Direction 默认显示 `Retain`。

**有界结论。** 当前正式 DSL 不能选择原生方向 0；省略方向会设为朝下。已有合法 201 方向 0 反编译时会因检查失败回退 `rawDslCommand`，所以这里不能声称“反编译自动把 0 改成 2”：raw 命令编译会保留该参数。问题是合法原生行为没有正式表达，用户已经确认 raw 不能长期替代原生功能。首方 runtime 与静态 UI 配图给出一致含义；本次没有保存原生 fixture，把 UI `Retain` 所存数字钉死仍可由后续原生保存样本补强；E09 已完成的报告不包含该专门样本。

**测试界限。** TD:906–911、TC:488 起均只覆盖有明确 2/4/6/8 的形态；没有方向 0 的正式 helper / 原生往返断言。本次不决定新字段命名，也不决定省略值的新默认。

## F2：Shop Processing 的 allowSelling 与原生 purchaseOnly 相反

**观察。** U:667–671、A/battle:51–64 将字段命名为 `allowSelling`。C:584–593 原样把它（默认 false）写到 302 的参数索引 4。D/battle:81–108 同样把该原生布尔槽读成 `allowSelling`，true 时输出 `allowSelling: true`。

首方 R:10177–10187 把 302[4] 传给商店场景；`rpg_scenes.js:1849–1851` 明确将该参数叫作 `purchaseOnly`，`rpg_scenes.js:1875` 传给商店命令窗口。`rpg_windows.js:2905–2907` 的 Sell 启用值是 `!purchaseOnly`。Help `page/01_10_12.html:55–56` 明确说明 `Purchase Only` 启用后玩家不能出售物品。原生证据闭环已经足以判断参数含义，无需 binary 逆向。

**有界结论。** `shopProcessing({ allowSelling: true, ... })` 编译出的原生行为禁止出售，违反该正式字段的自然语义。`allowSelling:false` 或省略则允许出售。这是 authoring 语义问题。当前反编译和编译对该布尔槽作同样的恒等映射，**不能据此声称现有 raw 302 往返会翻转数值**：值可以保留，而源里的字段含义仍相反。后续正式契约需要裁定采用 MV 原生 `purchaseOnly` 语义还是在 DSL 明确取反；本研究不选择 API。

**测试界限。** TD:1188–1196 以 false 样例检查渲染；主编译测试按现实现预期布尔值，没有独立引用首方 purchase-only 行为的验收，也没有真实商店游戏测试。样例绿灯即使实际运行，也不能证明 `allowSelling` 语义正确。

## F3：Loop 内命令不会经过当前递归验证

**观察。** A/flow:38 创建带 `body` 的 Loop；C:185–197 递归编译 `node.body`。V:28–276 对 Choices、Battle Processing、Conditional 等递归，但函数全部没有 `node.kind === "loop"` 或对 `node.body` 的验证路径。`src/validation/references.ts:80–105` 只把页或公共事件命令交给这个函数。`src/validation/staged-graph.ts:127–138` 调用 identities 与 declaration references；同文件 :189–200 的通用输入收集器只返回收集结果，没有接到这个验证流程。

**静态推论。** `loop([script(scriptInput(...))])` 中的 Script Input 不会执行 V:35 的 Script Command Gate；编译器随后仍会递归输出 355。Loop 中缺失引用或 Choices 分支数错误等也可能跳过 `compile --check` 的特化验证；普通编译遇到缺失引用还可能被 resolver 拒绝，不能把所有情况都叫作“编译无条件成功”。这是由调用链推出的反例，**尚未实际运行**。

**测试界限。** TD:734 的 Loop 样例只含 Wait，无法暴露这个组合缺口。后续契约需要规定所有包含子命令列表的结构如何统一验证，并让 check 与普通 compile 对合法性给出一致判断。

## F4：Workspace 未加载 animation 与 tileset 的引用源

**观察。** `src/workspace/operations.ts:208–225` 的 `loadSnapshotValidationInput` 读取 actors、armors、classes、commonEvents、enemies、items、maps、skills、states、troops、system、weapons，没有读取 `Animations.json` 和 `Tilesets.json`。`src/validation/staged-graph.ts:167–185` 将缺失的 animations、tilesets 归为各自空数组；`src/validation/references.ts:29–43` 从这些数组构造解析域。V:124–127、:254–256、:261–263 要求 Show Animation、Show Battle Animation、Change Tileset 的相应引用可解析。

**静态推论。** 正常 Workspace `compile --check` / `compile` 路径不能从实际 Snapshot 解析这些外部引用，即使两个标准文件已经 clone。单独调用 compiler 并注入完整 resolver 不具有该问题。TC:124–149 的测试恰好手工提供 animations 和 tilesets，所以编译单元样例不足以覆盖 Workspace 输入装配。此处未执行失败复现，结论强度为静态调用链推导。

后续 Workspace 集成票需要将“有正式 helper / 单元编译可用”与“真实 Workspace 数据入口可用”分开验收，不只测试新增敌群域。

## F5：原生 Plugin Command 的空白不能只因 helper 限制视为 malformed

D/system:35–54 的 `renderPluginCommand` 对空串、前后空白或包含连续两个空格的原生字符串直接返回 null；TD:498 的测试将 `Plugin  keeps  spaces`（:540）与 malformed 参数同列，期待 raw。首方 R:10505–10509 的 356 使用字面量单空格拆分字符串，再把首项及其余参数交给插件；连续空格会产生空参数，原生解释器没有在这里 trim 或折叠空白。Help `page/01_10_16.html:43–58` 将它描述为输入发送给插件的 command，没有给出“重复空格即非法”的原生限制。

当前 A/flow:73–86 接收 `command:string` 与可选 `args:string[]`，C:408–417 将它们用空格连接。从纯实现上，把完整原始行放入 command 或在 args 保留空 token 都可能表达原始字符串；本次没有执行这种调用。因此不能说“类型完全不能携带重复空格”，但可以确定**反编译器人为缩小了正式 helper 的接受范围**。当前测试的 malformed 名称不足以证明这些字符串不是合法原生文本。

后续[原生指令的完整参数与结构应如何表达和校验](../issues/05-native-command-contract.md)应明确 command 是完整原始行还是命令 token、空参数/首尾空白如何正式表达、原始分隔是否要往返。这个问题属于原生 356 字符串的保真边界，不需要也不应延伸为插件私有命令语义研究。编辑器输入是否有额外规范化未在本子调查逐条验证，原生保存样本应保留该未知。

## E09 补充：编辑器镜像已取得静态证据

此节复用[MV 编辑器分支、移动路线与禁用字段的静态保存证据](editor-serialization.md)，不声称本代理再次取证或执行编辑器。独立调查以同一 `RPGMV.exe` 的 SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281` 为目标，记录 PE 自报 1.6.1 和完整嵌入 QML 的字节身份。

| 结构 | 独立首方静态依据 | 与当前产品代码对照 | 结论边界 |
| --- | --- | --- | --- |
| 402 文本 | Q-CHOICES:107–137 保存 `[index,text]`；Q-TEXT:262–274 的显示函数读第 2 槽 | `compiler/shared/branches.ts:13–19` 只写 `[index]`；D/message:117–127 仅读 index | 正式编译缺少编辑器使用的文本镜像；运行时只读 index 不能证明可删除。真实打开/显示仍未运行 |
| 505 路线镜像 | Q-ROUTE:33–46 对嵌套 list 的非终止项生成 505；Q-TEXT:680–682 读其子指令显示；Q-ROUTE:22–30 从 205 载入 | C:469 起只写 205；D 无 505 专项分派，现有 505 会走 D:309–324 的 raw fallback | 新 authored route 不生成 native 编辑器显示镜像；现有镜像以独立 raw 保留时不具备与 route 修改同步的正式关系。矛盾数据政策未定 |
| 空 Choice 分支 code 0 | Q-CHOICES:140–169 给空 block 补 topIndent+1 的 NullCommand；Q-BASE:27–33 确认为 code 0 | `decompiler/core.ts:198–201` 删除全部 0；`compiler/shared/branches.ts:13–19` 空分支不补体内 0 | 当前归一化不同于原生编辑器创建的空分支结构；是否可归一化及精确等价关系还需契约和真实样本 |
| 403 参数 | Q-CHOICES 的同一保存路径还携带取消分支索引/文本对应槽，后者可能在 JSON 数组中成为 null | `compiler/shared/branches.ts:22–27` 写空参数 | 已发现静态形态差异；磁盘最终值和取消分支各种组合仍需样本，不能标为全部已答 |

独立报告中的 Q-* 是它自定义的字节定位名，不是 REA Evidence ID；保留其原始目标身份、偏移、压缩长度、文本哈希及残余未知。402/505 用途不再是未证假设，但全体参数语义和端到端保存仍没有因此完成。

## 父子结构、续行与 code 0 的审查边界

| 结构 | 当前实现事实与定位 | 本次可以说什么 | 尚不能说什么 |
| --- | --- | --- | --- |
| Show Text / Scrolling Text / Comment / Script | D 在 101/105/108/355 聚合对应 401/405/408/655；C 对 lines 或脚本拆行输出；TD:255、:279、:362 有样例 | 父子指令有正式 helper，Continuation Event Command 并非遗漏的独立 helper | 所有合法行数、空行、换行、同 indent 连续父命令及异常续行均无损 |
| Conditional Branch | D/flow:16–68 按 indent 查 then/else/412；C:154–169 重建结构 | 已读聚合与重建逻辑，TD:321、:341 有类别/嵌套样例 | 所有条件子枚举、嵌套边界、编辑器空列表记录和缺损输入均保持原数据语义 |
| Choices | D/message:75–173 按 402/403 聚合；C:569–583 与 compiler/shared/branches.ts:5–31 重建 | 有 branches、cancelBranch、default/cancel/位置/背景字段；V:93 检查分支数量；E09 静态确认当前 402 少文本槽及空分支 0 表示差异 | 取消槽组合、全部合法 index/空分支及真实编辑器保存等价；镜像冲突政策 |
| Loop | D/flow:70–91 与 C:185–197 聚合/重建 112/413 | 基本结构存在；F3 的验证缺口成立于静态调用链 | 仅 Wait 的样例可证明任意 body 或 Break Loop 上下文合法性 |
| Battle Processing | D/battle:10–68 与 C:372 起聚合/重建 601/602/603/604；V:149–169 有 escape/lose gate 与递归 | 三类战斗结果分支有正式结构 | 地图/公共/敌群上下文、随机敌群与变量等全部组合、编辑器结果分支规范已完整核实 |
| Shop goods | D/battle:71–115 聚合 605；C:584–593 编译首商品/后续商品 | 多商品与原价/自定价有表达；F2 语义问题已确认 | 每种商品/价格/交易上下文已深审 |
| 205 route | D/movement:147–189 读嵌套 route；C:469 起只写 205 及嵌套路线 | 45 子代码有正式表达，flags repeat/skippable/wait 被读取与写出；E09 静态确认 505 显示镜像，当前编译未生成 | 205/505 已矛盾时的处理政策，以及真实打开/保存/显示结果 |
| code 0 | decompiler/core.ts:173–201 只保留 Raw Event Command 三字段并过滤所有 code 0；D:238 再跳过；C:1045 仅在要求列表终止时补一个 code 0；D/movement:258–262 也跳过路线 0，C/movement:75–82 重建一个尾 0 | 现实现是结构归一化，不保存原始 code 0 的位置/数量/额外参数；E09 静态确认空 Choice 分支会生成更深 indent 的 0 | 所有内部 0 都可删且编辑器保存稳定；所有非标准 0 都允许静默归一化 |

首方 R:8923–8938 的解释器根据存在的方法执行命令，不存在对应方法仍前进索引，直到无 currentCommand 才 terminate；本次在该文件未找到 `command0`。因此把所有 code 0 统称为“运行时遇到立即结束”的规则并不准确。`skipBranch` 的边界还依赖 indent（R:8958 起），编辑器表示又有独立规则。最终等价定义必须区分运行结果、控制流结构、可编辑表示和原始记录三者，不能仅靠“0 是 end marker”一句话裁定安全归一化。

## 反编译保留策略不是任意数据保真策略

`src/decompiler/core.ts:173–195` 读取命令时只保留 code、indent、parameters，其他对象键不进入 DSL；同文件 :198–201 过滤 code 0。D:309–324 只在特化渲染返回 null 时进入 Raw DSL Command。**成功选择 helper 不会随后重新编译并与原始参数比较**，因此已识别形态中的额外参数/未知键可能被 helper 的固定字段集合丢弃。这里没有把这些扩展形态认定为合法原生输入；它们属于未知数据策略需要界定的对象。

移动路线中任一子指令无法识别时 D/movement:167–169 令整个 205 回退 raw，较局部 helper 更能保留其参数树；不过其对象以外的记录键、code 0 和事件/页属性仍受其他读取规则影响。`rawDslCommand` 的存在本身不足以证明“任何无法表达数据都被完整保留”。

事件级别还存在独立的已知缺口：Map Event 的 note 和页图像/自主移动/优先级/动画等字段既未进入当前 DSL 也未进入项目反编译；`compiler/events.ts:46–107` 省略备注并用固定页默认，`project-data/materialization.ts:141–161` 整体重建 events。它们交由事件模型/往返票，不在本报告假装已被指令覆盖矩阵解决。

## 测试证据为何不足以宣称完整支持

| 检查层 | 已读源码中的证据 | 可证明的范围 | 缺少的独立证据 |
| --- | --- | --- | --- |
| authoring | 各 A 文件；test/dsl.test.ts:183 起构造结构值 | helper 存在、输入被封装为 DSL kind | 所有原生合法输入都能表达、数值上下文合法 |
| 编译单元 | TC:173、:517、:608、:720、:857 等按现实现期待 raw | 列出的 DSL 输入得到列出的数组 | 期待值来自真实 MV 保存样本或首方行为校验；独立语义 oracle |
| 反编译种类 | TD:667–1407 的 105 个 family；:1410–1508 的 45 子代码 | 列出的单样例不出现 raw，包含期待 helper | 全部参数子枚举、结构组合和 context；生成源再次编译 |
| 反编译 malformed | TD:498–665 | 列出的 malformed 输入会回退 raw | 所有不能表达或未知字段都被保留或报错 |
| Workspace 反编译 | TW:248–391 | 固定输出布局可发现、可加载为声明 | 重新 compile 的 Generated Project Data 与原生 fixture 数据语义等价 |
| Workspace compile/diff/push | TW:427 起和 :1121 起验证各流程安全措施 | 现有装配路径和同步案例的预期行为 | F4 之类真实 Reference Source 漏装配；全部事件域；无损接管的完整链 |
| 编辑器 / 游戏 | 本轮没有执行 | 无实际通过结论 | 编辑器打开/保存后的数据和代表性游戏场景结果 |

对整个 `test/` 搜索 `round.?trip`、`decompile.*compile`、`compile.*decompile` 后，未定位“原生 fixture → decompile → compile → 逐事件语义比对”的测试；随后阅读主反编译/Workspace 测试，确认它们主要是字符串、helper 和声明种类断言。这个有界搜索加阅读支持“本次未找到完整往返证据”，不声称只凭名字搜索就能证明不存在任何间接检查。没有运行测试，不能将上述源码断言写成已通过。

## 正式契约还需解决的问题类型

这些是交给后续决策的研究结果，不是本报告决定的 API 或实施规格。

1. **原生值域与默认值。** Transfer Player 的 0/四向，方向、位置、槽位、数值范围、特殊哨兵值与 native 默认是否都有正式表达；省略值采用何种语义。不能只按 TypeScript 的 number/boolean 声称覆盖全部编辑器约束。
2. **带反向含义的布尔槽。** Shop 的 purchaseOnly/allowSelling 已有反例；其他 Enable/Disable、移除/添加等转换需用首方运行时做同类审计，当前只定位未逐项证明。
3. **复合父结构与上下文。** Choice、Conditional、Battle、Loop、续行、分支索引、空体和终止记录的正式形态是什么；所有子列表能否一致通过验证；上下文限制由 DSL、验证器还是兼容性规则承担。
4. **运行语义等价与编辑器表示。** 402 文本镜像、505 route 镜像、内部/尾部 code 0 哪些可重建，哪些要保留；生成/显示依据见 E09，允许的归一化及矛盾镜像政策仍需契约决策。JSON 排版可变不自动意味着记录可丢。
5. **已识别 helper 的保真前提。** 渲染器除检查已知槽外，是否必须识别完整记录；未知参数/键是保留、拒绝还是允许归一化，需与[语义无损往返与未知数据处理的精确契约是什么](../issues/06-semantic-roundtrip-policy.md)对齐。
6. **正式引用与 Workspace 全链。** 把 animation/tileset 以及后续新域都接到实际 Snapshot 装配，不能用测试注入的完整 resolver 代替生产路径；`compile --check` 与 `compile` 的合法性结果需一致。
7. **Script Input / Plugin DSL Command。** 它们属于原生正式 helper；Script Gate 必须覆盖全部嵌套位置。F5 表明 356 原始分隔/空参数不能仅靠 malformed 测试名称排除。插件私有参数语义不在本次范围，未知数据不能静默丢失的约束仍适用。
8. **验收证据分层。** 独立 native fixture 参数矩阵、结构与上下文组合、反编译再编译比对、Workspace 集成、安全回归、真实编辑器保存和游戏场景各解决不同命题，不能用 helper 数量替代。

## 问题答复状态与残余未知

| 原始问题 | 状态 | 根据与残余 |
| --- | --- | --- |
| 顶层原生指令族和移动子指令各有哪些实现/测试入口 | 已答（静态库存） | 105 + 45 逐项定位，首方 Help 105 链接和 runtime 常量交叉确认 |
| Transfer Player 方向 0 是否有原生含义、DSL 是否正式支持 | 已答（含义与源码缺口）；UI 数值保存待补强 | runtime 保向明确，DSL 缺 0；未执行 editor fixture |
| Shop 第五参数与 allowSelling 是否一致 | 已答（首方静态证据） | Help、解释器、场景、窗口调用链确认 purchaseOnly，DSL 恒等映射导致字段语义反向 |
| 402 文本与 505 路线镜像的保存/显示用途 | 静态规则已答（引用独立 E09）；冲突政策与端到端未决 | Q-CHOICES/Q-ROUTE/Q-TEXT 的静态证据确认生成与消费；本代理未重复 native 调查 |
| code 0 的全部安全归一化规则 | 部分答 | 当前实现如何移除/重建已明确；runtime 非简单立即结束；E09 确认空 Choice 分支 0；完整归一化/控制流等价仍待定义 |
| 所有合法参数、分支、续行、嵌套和往返是否完整 | 部分答 | 存在明确反例、F5 原生文本边界与定位矩阵；绝大多数 family 未逐参数深审，不能标为完整 |
| 当前 validation 与实际 Workspace 入口是否足以验证所有正式命令 | 部分答 | F3/F4 静态缺口明确；未全参审计、未执行反例 |
| 编辑器与代表性游戏场景是否通过 | 未答 | 本轮没有执行，属于后续验收工作 |

## 首方参考资料身份

以下全为主工作树下只读的本地资料，不在本研究分支中复制、发布或合并。源码文件顶部均标为 v1.6.1；`rpg_core.js:183` 的运行时版本常量为 1.6.1。Help 的配图和文档身份以哈希固定，不将它们当作编辑器 EXE 的版本证明。

| 主工作树相对 references/RPGMV 的路径 | SHA-256 |
| --- | --- |
| `NewData/js/rpg_core.js` | `9AD9914CC421AF6D054C3F01B022B7383863B047EC3F6F76AA897E6CFBF864C6` |
| `NewData/js/rpg_objects.js` | `2D43DD9D8974C88A1B82FFA493D6D8A02C4CE1D0DFC8F05E6C0AB731E3F0573E` |
| `NewData/js/rpg_scenes.js` | `A76EA8C14EC7414A0E2BB488B19734603CC3D8AACE3F163E3AA82FC3D0D20D20` |
| `NewData/js/rpg_windows.js` | `2501AEA15906D84A2FB51DE20E6DC006F847249674F14802EC2AC2DD5361BB99` |
| `Help/page/01_10.html` | `E5717954D0F30155B31C467E00A6DA2A60DEB727B8B4A07517AA6BB31F1523A8` |
| `Help/page/01_10_06.html` | `E91BC544B86372E64DD1C4DE76C972D9A9752DAA62E02846B18D793D994F6426` |
| `Help/page/01_10_12.html` | `F0208062B04A08956B3BA1954B4C1AA32252D3902BB8E90146598D659B3A60CF` |
| `Help/inc/img/01_10_06_img01.png` | `6618A96008455AA8CEF68A10F0E428749111B5E5890C2AC6924CF57913754468` |

本报告只提交原创研究文字与定位，不含首方代码/资产副本，不修改产品代码、决策地图或票状态。临时研究分支按 wayfinder 约定只作上下文指针，不开 PR、不合并。
