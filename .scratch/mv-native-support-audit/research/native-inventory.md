# RPG Maker MV 1.6.1 原生指令与事件类别库存独立复核

审计日期：2026-10-20（Asia/Shanghai）。产品基线：`298a407535debfdd75afc70d03f0ff49a546e972`，编译契约 `mv-1.6.1/23`（`packages/rpgmaker-event-dsl/src/workspace/type-inputs.ts:9`）。本文件仅负责类别、指令、续行库存与部分保存结构的独立核对；事件容器与全参数域由同次审计的其他研究分支负责。

## 结论

**指令类别覆盖确实齐全：首方 Help 独立列出的 105 类事件指令，与随附 1.6.1 runtime 的 105 个主指令 handler 一一对应；当前产品对每类都存在正式编译和反编译路径，没有发现整个家族遗漏或只能通过 Raw DSL Command 表达的原生命令家族。45 个非终止移动码也全部覆盖。**

这个结果支持“完整覆盖 MV 1.6.1 的原生事件指令类别”这一较窄表述。它不能单独支持“所有正常原生工程、全部保存形态和所有参数都已完整支持”的结论。存在一个正式 case、甚至一个样本往返成功，都不能证明该家族的参数域和周围结构没有遗漏。

本分支没有找到新的、已确认的正常编辑器操作反例。曾发现 Jump 的 Help 与产品范围冲突；回到同一首方编辑器实际控件后，确认产品范围正确，不能把 Help 的文本当成缺陷证明。

## 身份与证据边界

| 来源 | 身份 / 用途 |
| --- | --- |
| references/rmmv-local-runtime-1.6.1/js/rpg_objects.js | SHA-256 2d43dd9d8974c88a1b82ffa493d6d8a02c4ce1d0dfc8f05e6c0ab731e3f0573e；runtime 是指令码与执行入口的首方来源，未把静态阅读冒充运行观察 |
| references/RPGMV/Help/page/01_10.html | SHA-256 e5717954d0f30155b31c467e00a6da2a60deb727b8b4a07517aa6bb31f1523a8；事件命令页的 105 个链接是独立类别库存 |
| `references/rmmv-local-runtime-1.6.1/js/rpg_core.js:2` | 首方标注 `rpg_core.js v1.6.1` |
| `references/RPGMV/RPGMV.exe` | SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`；父调查只读提取的 QML 与此字节身份绑定 |
| 本轮 REA `inspect_pe_resources` | Evidence `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd`。它证明当前目标资源身份与静态资源事实；QML 文本另外通过只读候选解码取得，不声称 PE 图标资源工具替代 Qt 层级解析 |
| `C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/inventory.json` | 457 个解码候选的原始偏移、长度、解码 hash。QML 文件名对应原文件偏移；此轮未执行原生编辑器 UI |

本研究没有复用旧完成报告的“105 + 45”作为库存真相。下面的数量由当前 Help 与 runtime 重算；旧规格与测试只在理解产品边界时作线索。

## 事件类别

首方 `references/RPGMV/Help/page/01_09.html:31` 明确说事件分三种；`:33` 是 Map Events，`:37` 是 Battle Events，`:39` 是 Common Events。runtime 在 `references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:8461` 从 `$dataMap.events` 读取地图事件；`references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:56` 与 `:60` 分别载入 Troops 与 CommonEvents。产品有 `src/compiler/events.ts:17` 的 Battle Event Page、`:97` 的 Map Event、`:112` 的 Common Event 编译入口。未发现漏掉第四种首方原生事件类别。

这个类别结论不等于对承载文件的每种原生保存形态作保证。例如无事件地图的 `events` 数组形态，需要单独审计，不能靠存在 Map Event 定义类型排除。

## 105 类指令逐项对照

下表中的原生行号均相对于 `references/rmmv-local-runtime-1.6.1/js/rpg_objects.js`。正式反编译行号相对于 `packages/rpgmaker-event-dsl/src/decompiler/dispatch.ts`；编译位置为完整仓库相对路径。`case` 和编码存在是静态观察，不宣称该行覆盖所有参数。Help 行号和具体锚点在机器可读的 `../probes/inventory/inventory.json` 中保留。

| 编码 | 首方名称 | Runtime 行 | 正式反编译行 | 编译编码位置 |
| --- | --- | ---: | --- | --- |
| 101 | Show Text | 9057 | 342 | `packages/rpgmaker-event-dsl/src/commands/message/compile.ts:7` |
| 102 | Show Choices | 9087 | 344 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:773` |
| 103 | Input Number | 9130 | 486 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:192` |
| 104 | Select Item | 9144 | 496 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:207` |
| 105 | Show Scrolling Text | 9158 | 346 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:222` |
| 108 | Comment | 9172 | 348 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:279` |
| 111 | Conditional Branch | 9182 | 350 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:239` |
| 112 | Loop | 9328 | 352 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:311` |
| 113 | Break Loop | 9341 | 482 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:327` |
| 115 | Exit Event Processing | 9361 | 484 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:331` |
| 117 | Common Event | 9367 | 404 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:335` |
| 118 | Label | 9382 | 413 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:342` |
| 119 | Jump to Label | 9387 | 418 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:346` |
| 121 | Control Switches | 9415 | 423 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:351` |
| 122 | Control Variables | 9423 | 434 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:359` |
| 123 | Control Self Switch | 9571 | 436 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:370` |
| 124 | Control Timer | 9580 | 446 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:378` |
| 125 | Change Gold | 9590 | 469 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:390` |
| 126 | Change Items | 9597 | 506 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:397` |
| 127 | Change Weapons | 9604 | 520 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:407` |
| 128 | Change Armors | 9611 | 535 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:418` |
| 129 | Change Party Member | 9618 | 550 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:429` |
| 132 | Change Battle BGM | 9634 | 563 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:440` |
| 133 | Change Victory ME | 9640 | 565 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:447` |
| 134 | Change Save Access | 9646 | 567 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:454` |
| 135 | Change Menu Access | 9656 | 569 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:461` |
| 136 | Change Encounter | 9666 | 571 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:468` |
| 137 | Change Formation Access | 9677 | 573 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:475` |
| 138 | Change Window Color | 9687 | 575 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:482` |
| 139 | Change Defeat ME | 9693 | 577 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:489` |
| 140 | Change Vehicle BGM | 9699 | 579 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:496` |
| 201 | Transfer Player | 9708 | 581 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:586`; `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:604` |
| 202 | Set Vehicle Location | 9728 | 583 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:635` |
| 203 | Set Event Location | 9747 | 585 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:648` |
| 204 | Scroll Map | 9770 | 587 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:659` |
| 205 | Set Movement Route | 9782 | 335, 589 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:672` |
| 206 | Get on/off Vehicle | 9795 | 591 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:682` |
| 211 | Change Transparency | 9801 | 598 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:689` |
| 212 | Show Animation | 9807 | 600 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:696` |
| 213 | Show Balloon Icon | 9819 | 602 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:707` |
| 214 | Erase Event | 9831 | 604 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:511` |
| 216 | Change Player Followers | 9839 | 609 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:718` |
| 217 | Gather Followers | 9850 | 611 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:725` |
| 221 | Fadeout Screen | 9859 | 618 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:733` |
| 222 | Fadein Screen | 9869 | 625 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:741` |
| 223 | Tint Screen | 9879 | 632 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:749` |
| 224 | Flash Screen | 9888 | 634 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:757` |
| 225 | Shake Screen | 9897 | 636 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:765` |
| 230 | Wait | 9906 | 638 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:504` |
| 231 | Show Picture | 9912 | 647 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1089` |
| 232 | Move Picture | 9927 | 649 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1105` |
| 233 | Rotate Picture | 9945 | 651 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1123` |
| 234 | Tint Picture | 9951 | 653 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1130` |
| 235 | Erase Picture | 9960 | 655 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1137` |
| 236 | Set Weather Effect | 9966 | 657 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1145` |
| 241 | Play BGM | 9977 | 659 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1152` |
| 242 | Fadeout BGM | 9983 | 661 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1159` |
| 243 | Save BGM | 9989 | 663 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1166` |
| 244 | Replay BGM | 9995 | 670 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1173` |
| 245 | Play BGS | 10001 | 677 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1180` |
| 246 | Fadeout BGS | 10007 | 679 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1187` |
| 249 | Play ME | 10013 | 681 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1194` |
| 250 | Play SE | 10019 | 683 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1201` |
| 251 | Stop SE | 10025 | 685 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1208` |
| 261 | Play Movie | 10031 | 692 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1216` |
| 281 | Change Map Name Display | 10053 | 694 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1223` |
| 282 | Change Tileset | 10063 | 696 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1230` |
| 283 | Change Battle Back | 10085 | 698 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1237` |
| 284 | Change Parallax | 10091 | 700 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1244` |
| 285 | Get Location Info | 10098 | 702 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1252` |
| 301 | Battle Processing | 10129 | 354 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:520` |
| 302 | Shop Processing | 10176 | 361 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:809` |
| 303 | Name Input Processing | 10190 | 704 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:824` |
| 311 | Change HP | 10201 | 706 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:831` |
| 312 | Change MP | 10210 | 708 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:842` |
| 326 | Change TP | 10219 | 736 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:982` |
| 313 | Change State | 10228 | 710 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:852` |
| 314 | Recover All | 10245 | 712 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:863` |
| 315 | Change EXP | 10253 | 714 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:870` |
| 316 | Change Level | 10262 | 716 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:881` |
| 317 | Change Parameter | 10271 | 718 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:892` |
| 318 | Change Skill | 10280 | 720 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:903` |
| 319 | Change Equipment | 10292 | 722 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:914` |
| 320 | Change Name | 10301 | 724 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:925` |
| 321 | Change Class | 10310 | 726 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:932` |
| 322 | Change Actor Images | 10319 | 728 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:943` |
| 323 | Change Vehicle Image | 10331 | 730 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:957` |
| 324 | Change Nickname | 10340 | 732 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:968` |
| 325 | Change Profile | 10349 | 734 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:975` |
| 331 | Change Enemy HP | 10358 | 738 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:992` |
| 332 | Change Enemy MP | 10367 | 740 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1003` |
| 342 | Change Enemy TP | 10376 | 756 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1067` |
| 333 | Change Enemy State | 10385 | 742 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1013` |
| 334 | Enemy Recover All | 10402 | 744 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1023` |
| 335 | Enemy Appear | 10410 | 746 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1026` |
| 336 | Enemy Transform | 10419 | 748 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1030` |
| 337 | Show Battle Animation | 10428 | 750 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1037` |
| 339 | Force Action | 10446 | 752 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1048` |
| 340 | Abort Battle | 10458 | 754 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1063` |
| 351 | Open Menu Screen | 10464 | 758 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1076` |
| 352 | Open Save Screen | 10473 | 760 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1079` |
| 353 | Game Over | 10481 | 762 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1082` |
| 354 | Return to Title Screen | 10487 | 764 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:1085` |
| 355 | Script | 10493 | 363 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:562` |
| 356 | Plugin Command | 10504 | 766 | `packages/rpgmaker-event-dsl/src/compiler/dispatch.ts:577` |

其中四个 runtime 注释名与 Help 名字不同，已按编码及实际实现核对：136 `Change Encounter Disable` 对应 Help `Change Encounter`；206 `Getting On and Off Vehicles` 对应 `Get on/off Vehicle`；244 `Resume BGM` 对应 `Replay BGM`；246 Help 有尾随空格。没有把名字差异误计为缺失。

## 结构与续行

105 个主命令之外，当前产品的 `src/validation/native-parameters.ts:25` 起的 signatures 表识别下列 17 个原生结构码，编反编译由对应父命令负责；单独列为“还缺 17 个 public helper”会重复计算：

`0, 401, 402, 403, 404, 405, 408, 411, 412, 413, 505, 601, 602, 603, 604, 605, 655`。

父子关系还可从 `src/validation/command-structure.ts:134` 起 continuationParents 与 branchCodes 直接核对。native runtime 有 112 个 `commandNNN` 方法，即 105 个主方法加 7 个分支/回环方法；401、405、408、505、605、655 等续行由父方法或编辑器结构消费，因此仅按 runtime 方法数量作清单也会漏掉保存结构。

同一编辑器 `922020.qml:25` 中确实残留 code 114 `Continue Loop`，`:129` 有 999 `Undefined Command`。有表项不等于可用事件命令：本次对全部解码 QML 和 1.6.1 runtime 的有限搜索，没有发现 114 的选择入口或 `command114` 实现，Help 105 项也没有它。因此 114 不能据此升格为第 106 类可用原生指令。该有限搜索不证明所有历史版本都没有 114。

## 45 个移动指令与 270 组精确往返

runtime 的 `Game_Character.ROUTE_*` 常量独立枚举 0..45：0 是终止记录，1..45 是 45 个非终止移动指令。全部非终止码在 `src/commands/movement/compile.ts` 和 `decompile.ts` 中有正式路径（31..40 将 ON/OFF 合并为 5 个布尔字段）；validator 接受码域 1..45，未知码被明确拒绝，不是隐式 raw 支持。

| 编码 | Runtime 常量 | 原生行 |
| --- | --- | ---: |
| 0 | ROUTE_END | 6841 |
| 1 | ROUTE_MOVE_DOWN | 6842 |
| 2 | ROUTE_MOVE_LEFT | 6843 |
| 3 | ROUTE_MOVE_RIGHT | 6844 |
| 4 | ROUTE_MOVE_UP | 6845 |
| 5 | ROUTE_MOVE_LOWER_L | 6846 |
| 6 | ROUTE_MOVE_LOWER_R | 6847 |
| 7 | ROUTE_MOVE_UPPER_L | 6848 |
| 8 | ROUTE_MOVE_UPPER_R | 6849 |
| 9 | ROUTE_MOVE_RANDOM | 6850 |
| 10 | ROUTE_MOVE_TOWARD | 6851 |
| 11 | ROUTE_MOVE_AWAY | 6852 |
| 12 | ROUTE_MOVE_FORWARD | 6853 |
| 13 | ROUTE_MOVE_BACKWARD | 6854 |
| 14 | ROUTE_JUMP | 6855 |
| 15 | ROUTE_WAIT | 6856 |
| 16 | ROUTE_TURN_DOWN | 6857 |
| 17 | ROUTE_TURN_LEFT | 6858 |
| 18 | ROUTE_TURN_RIGHT | 6859 |
| 19 | ROUTE_TURN_UP | 6860 |
| 20 | ROUTE_TURN_90D_R | 6861 |
| 21 | ROUTE_TURN_90D_L | 6862 |
| 22 | ROUTE_TURN_180D | 6863 |
| 23 | ROUTE_TURN_90D_R_L | 6864 |
| 24 | ROUTE_TURN_RANDOM | 6865 |
| 25 | ROUTE_TURN_TOWARD | 6866 |
| 26 | ROUTE_TURN_AWAY | 6867 |
| 27 | ROUTE_SWITCH_ON | 6868 |
| 28 | ROUTE_SWITCH_OFF | 6869 |
| 29 | ROUTE_CHANGE_SPEED | 6870 |
| 30 | ROUTE_CHANGE_FREQ | 6871 |
| 31 | ROUTE_WALK_ANIME_ON | 6872 |
| 32 | ROUTE_WALK_ANIME_OFF | 6873 |
| 33 | ROUTE_STEP_ANIME_ON | 6874 |
| 34 | ROUTE_STEP_ANIME_OFF | 6875 |
| 35 | ROUTE_DIR_FIX_ON | 6876 |
| 36 | ROUTE_DIR_FIX_OFF | 6877 |
| 37 | ROUTE_THROUGH_ON | 6878 |
| 38 | ROUTE_THROUGH_OFF | 6879 |
| 39 | ROUTE_TRANSPARENT_ON | 6880 |
| 40 | ROUTE_TRANSPARENT_OFF | 6881 |
| 41 | ROUTE_CHANGE_IMAGE | 6882 |
| 42 | ROUTE_CHANGE_OPACITY | 6883 |
| 43 | ROUTE_CHANGE_BLEND_MODE | 6884 |
| 44 | ROUTE_PLAY_SE | 6885 |
| 45 | ROUTE_SCRIPT | 6886 |

本轮执行独立 probe `../probes/inventory/movement-roundtrip.ts`：45 个移动码 × 非终止 indent 的 absent/null/zero 3 个已接受形态 × M0 参数键 absent/empty 2 个形态，共 **270/270** 组。每组都从手写 native record 反编译为正式 DSL，再编译并以 `deepStrictEqual` 比较完整 route；没有使用 raw helper。M45 样例还包含 CRLF 与 LF，M41/M44 使用 None 配合独立保存参数。

观察边界：这是当前产品模块级数据往返，没有启动 MV、没有执行脚本、没有跑 Workspace push，也没有穷举各参数的所有值或所有 UI 编辑序列。它提高“全部移动码具有精确保存路径”的信心，但不证明 270 个形态都由编辑器 UI 亲手创建过。

## 被排除的伪反例：Jump 的 -100 / 100

首方 Help `references/RPGMV/Help/page/01_10_06_01.html:59` 写 Jump 坐标各在 -100..100，产品 `src/commands/movement/validation.ts:184` 与 `:185` 中 M14 的两条 integer 调用只接受 -99..99，乍看是缺口。

但本轮绑定同一 RPGMV.exe 的 `C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/811221.qml:23`、`:24` 与 `:30`、`:31` 明确设置两轴为 -99..99（该解码文件 SHA-256 `d1822b652c597f6a06cf1fd343a3b731047942e17bad8aee49e6ee4b079fa033`）。因此这里是 Help 与实际控件冲突，不能以 Help 文字证明产品漏支持正常 UI 值。runtime `jump` 可接收更大数字，也不能单独证明编辑器正常保存域。

另一个排除项是 code 203 不能选择 Player：实际 `711364.qml:19` 设置 `includePlayer: false`，所以产品的非负事件 selector 域不能仅因 runtime `character(-1)` 可访问 Player 就判为遗漏。

## 覆盖状态与仍未知

| 审计问题 | 状态 | 证据 / 限制 |
| --- | --- | --- |
| 首方有几种事件类别？ | 已回答 | Help 明确 3 种，产品有 3 种正式入口 |
| 105 是否由旧表自证？ | 已回答 | 当前 Help 105 个命令链接与 runtime 105 主 handler 独立重建、一一匹配 |
| 是否存在漏掉整类或仅 raw 的原生主指令？ | 本次边界内未发现 | 全部有正式 dispatcher 与 compiler 编码位置；不等于所有参数已验证 |
| 是否遗漏原生结构/续行码？ | 库存层已回答 | 17 种，结构位置与父 ownership 另行验证 |
| 45 移动码是否都能精确往返？ | 已回答有限样例 | 270 组通过，参数值与全 Workspace 流程未穷举 |
| 所有正常原生事件保存形态是否支持？ | 本分支未回答 | 由并行事件容器/编辑器保存域调查负责；本库存结果不能为其背书 |
| 所有参数与参数组合是否支持？ | 部分回答 | 排除了 Jump 与 203 的两个误报；没有穷举全部参数和状态转移 |
| 原生 UI 与游戏运行表现是否全一致？ | 未覆盖 | 本轮静态阅读与 Node 模块 probe，不是 UI 或游戏执行 |

复现：在仓库根运行 `node .scratch/mv-native-support-audit/probes/inventory/inventory.mjs`；运行移动 probe：`pnpm --filter rpgmaker-event-dsl exec tsx F:/Shuen/RPG/rpgmaker-event-dsl/.scratch/mv-native-support-audit/probes/inventory/movement-roundtrip.ts`。结果 JSON 分别保存在同目录。未改产品源码、未改旧票、未提交或推送、未运行全量测试。
