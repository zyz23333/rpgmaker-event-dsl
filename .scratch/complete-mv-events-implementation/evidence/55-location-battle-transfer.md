# Final controlled Battle Transfer supplement

`MV-S6-LOCATION-004` 的 controlled Battle Transfer 部分已实际通过：独立字面量游戏与最终 built public Workspace 产物各执行一次，两边严格门槛全部通过。它们都从正常地图 action 输入进入真实战斗，并在 native E201 连续停留 61 个不同 Graphics 帧，跨度 60 帧。此报告只补该先前缺失项；其他 R5 variables/exchange/query 覆盖由55另行绑定保留的完整原生字面量结果与当前 built 数据比较。

## Authoritative result

- [精确安全结果副本](55-location-battle-transfer-result.json)，SHA256 `f3e45e05152763a4fc69b34c615affd331715e0ad9c9328e0c9ac961e6bd1791`。该文件为原始 receipt 的逐字节副本，未重新排版。
- [独立场景与被动观察器](55-location-battle-transfer-scenario.cjs)。执行时 SHA256 `0108a741dee2d7fc4fc9a3a44b123474cb00905fa30708e9bada88e1fb6478d3`。
- [唯一受影响 pair 的执行器](55-location-battle-transfer-runner.cjs)。导入不会启动游戏；直接执行只运行本项，不 build、不运行其他矩阵。
- 原始 receipt：`M:/Shuen/Codex/mv-events-implementation-20261020/ticket55-location-supplement/runs/execution-9018ec6e-e0a9-4394-8f80-e0756d9647f3/safe-receipt.json`。
- 原始 pair：`M:/Shuen/Codex/mv-events-implementation-20261020/ticket55-location-supplement/runs/final-location-battle-transfer-native-stall-10dd975e-c9d6-4542-90ef-a34ca34d3645/pair-result.json`，SHA256 `b96ba9ab445a220eaae33acc3b0dd577d1527ed6e8d110e6eb94ad4ba11e966b`。
- 独立 fixture SHA256 `f074e0fa9e975dbcaec8d5f1d54bd9655e2f6ae10e88c05a7023c44af8fa96ee`。原始载体与引擎资产只保留于本机原始目录。

## Exact native expectation

MV 1.6.1 随附 `references/RPGMV/NewData/js/rpg_objects.js` 的 `command201`（9709–9726）仅在 `!$gameParty.inBattle() && !$gameMessage.isBusy()` 时调用 `reserveTransfer`、设 transfer wait 并推进 `_index`。Battle 分支直接返回 `false`；`executeCommand` 也不再推进索引。因此真实结果是停滞，而非跳过后继续。

本项继承53完整 Common 场景与合法 variable99 HP 准备：Map7 的 action 输入调用 Common1，然后 native301 启动 Troop1。Troop turn0 页先正常调用同一个 Common1，再执行自写 before 标记和 E201 `[0,1,2,3,6,2]`。保存列表为 `[117,355,201,355,331,0]`，201 位于索引2。后面的 after 标记、331清理、胜利及地图后续都应保持未执行。

观察器仅 clean-start 新游戏、设置触发前朝向、脉冲正常 Input OK、记录载入数据与被动状态，并最终调用 `nw.App.quit()`。它不替换或推进 interpreter、command、Scene、wait、transfer、BattleManager、RNG 或 loader，也不强迫战斗返回地图。观察器的主动退出完成证据采集，不代表游戏自然继续。

## Actual trace, both sides

双方 expected 与 actual 完全一致：

| 观察项           | Literal                                                                                | Compiled         |
| ---------------- | -------------------------------------------------------------------------------------- | ---------------- |
| 实际场景         | `Scene_Battle`                                                                         | `Scene_Battle`   |
| 连续 Graphics 帧 | `234..294`，61条                                                                       | `234..294`，61条 |
| 解释器           | 同一对象，`index=2, code=201, waitMode="", running=true, eventId=0`                    | 相同             |
| 玩家             | Map1，`[8,6]`，方向6                                                                   | 相同             |
| 预约传送         | `false`；newMapId/newX/newY/newDirection 均0                                           | 相同             |
| 标记             | before=1，after=0                                                                      | 相同             |
| 后续             | enemy alive；victoryCount=0；returned=false                                            | 相同             |
| 地图 trace       | `before-call, after-call`                                                              | 相同             |
| Common 上下文    | Map eventId7，位置`[10,6]`，selfA=true；Battle eventId0，无 character，zeroSelfA=false | 相同             |
| 自然进入战斗     | native301，真实 `Scene_Map → Scene_Battle`                                             | 相同             |
| 退出             | exit0，无 signal、无 timeout                                                           | 相同             |

原始结果保存了61条完整逐帧状态。receipt 保存全部帧号、跨度、每条状态等于预期与相同解释器断言。两边每个被观察到的相邻帧号都相差1。

## Final product and physical protections

执行 source revision 为干净提交 `a9c63c50b9fb5a3e33c1fa31610261f471d42116`。实际 package HEAD 是 `044522ef3843e1dd5cc57fdbf316de74ed626b94`，没有将其冒充为旧 candidate HEAD。执行前、执行时及执行后，完整 source/dist 文件成员与哈希均等于已发布 candidate `2dc639015f908de6fd524e50236e5422b5f8e990`：

| 身份                                  | 值                                                                 |
| ------------------------------------- | ------------------------------------------------------------------ |
| Compile contract                      | `mv-1.6.1/22`                                                      |
| Product source Git tree               | `b3129c0fc5814e35b71bd203ad48a40c813e5c63`                         |
| Complete source SHA256                | `4837d1fb0ed97e7badf66830dacd3ad3e90221e68f8d31b89a3719192440cfd6` |
| Complete dist SHA256                  | `e9dd263ea99d4baebe9f074f59427970dc34afeedacd4e3bd6089b591e9759c9` |
| Built public Workspace API SHA256     | `24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788` |
| Unchanged shared harness SHA256       | `085091b1b316eaab2d76257e9f7d119fc13df95ffaa84ad2fd321e3c45954c0b` |
| Installed observer SHA256, both sides | `2fd975d3c69948738fd34738394f48de6dc36d0b1f4538fe14707858fceaf08b` |

真实 public Init/Clone/Decompile/source edits/Check/Compile/Diff/Push 全部通过。Map、Common、Troop 三份正式 source 均有实际编辑，已确认没有 `rawDslCommand`；Push 三份完整载体的实际替换均由前后哈希证明。Check 未发布状态。全部15份完整 JSON carrier 与独立字面量相等，游戏读入的四份完整载体亦与独立预期相等，运行后数据输入不变。

实际引擎为 MV1.6.1、NW0.29.0、Node9.7.1、Chromium65.0.3325.146。双方均记录声明 host、fresh explicit profile、真实 appDataPath、独立 appName、cwd、owned PID/PPID、各引擎文件哈希。literal observer PID22480，compiled PID31172。所有15项物理保护验证均为true，包括 stdout/stderr 为空、exit0、engine identity、loaded carriers、data unchanged。public API 对 Battle201 输出的预期 stall 诊断不属于游戏 stdout/stderr。

本项没有编辑器 UI 实测声明；编辑器事实继续由已接受的逆向证据提供。receipt 内 `binding.native="pending"` 是执行输入快照的原始状态；最终 `passed=true`、两个 native launch/result 和全部退出记录才是已执行结果。未发生失败重试，只有本次1 pair、2个实际游戏过程。
