# 08 / N05–N06 原生敌人目录与 Actor 候选覆盖观察

2026-11-02，实际执行三个独立项目／profile：[三条规范回执](acceptance-receipts.json)。N05 前视、侧视各 7 项独立断言通过；N06 覆盖场景 8 项通过，合计 22 项。每项均从保存 JSON 经原生 DataManager、Scene_Map 与事件解释器执行，再由真正 Scene_Battle 和精灵消费；没有直接调用假的 Sprite／Bitmap 或替换原生返回值。所有包装器使用 `original.apply(this, arguments)`，只附加观察。

环境为 MV 1.6.1、Windows 10.0.19045、NW.js 0.29.0、Chromium 65.0.3325.146、内置 Node 9.7.1；外围运行器为 Windows x64 Node 22.23.4。六个原生 JS、全部复制脚本、Game.exe／nw.dll 的源／副本及输入／媒体均记录 SHA256。自制 RGBA PNG 用 PNG CRC32 与 zlib 生成；Scene 支持资源单独标为背景，不计入所选 Event Asset Use。

N05 两个项目使用相同 Enemy1、Troop1 member0、`battlerName:ModeEnemy`、`battlerHue:0`，只改变 System.optSideView。两个项目都放置准确 `img/enemies/ModeEnemy.png` 和 `img/sv_enemies/ModeEnemy.png`，分别为红色 80×96、绿色 96×80。保存的 Map001.events[1].pages[0].list[0] 为 301 `[0,1,false,true]`。原生 Game_Troop.setup 创建相同 Enemy，Sprite_Enemy 依据 System 模式选择准确目录；请求、原生图像 load 回调、ready 位图的独立像素及 Canvas drawImage 均一致。前视在原生帧 59 有一条实际绘制，侧视在帧 59／60 有两条；绘制 source 对象等于所选 Bitmap 的原生图像／canvas／baseTexture source。另一目录真实存在，未作为该 Enemy 的图片请求，未做回退选择。

N06 的 Actor1 初始保存为 `InitialCharacter`、index0、`InitialBattler`。起始队伍为空，真实 Actor 实例由原生工厂建立。保存事件依次执行 322 `[1,CurrentCharacter,3,"",0,CurrentBattler]`、129 `[1,0,false]`、观察标记与自开关结束。原生322改变运行值，129 的 initialize:false 保留替换；两次操作后的保存数据库名称均未变。解释器 setup/requestImages 在命令执行前确实预请求了初始行走图，也预请求322的当前名称。该预加载没有被当成初始候选实际绘制。

真实玩家在帧2绘制 `img/characters/CurrentCharacter.png` 的 index3 格，位图为576×384、青色 `#00ffff`。观察器见到该实际绘制后仅打开已保存第二事件页的 switch1 条件；该真实事件再执行301进入侧视战斗。Sprite_Actor 在帧63实际绘制 `img/sv_actors/CurrentBattler.png`，为576×384九列六行、蓝色 `#0000ff`。两个绘制 source 均与其选中 Bitmap 原生源对象相同；没有任何初始行走图或初始SV图的实际 Canvas 绘制。最终保存字段仍是初始名称，当前运行值仍是替换名称。

N06 只证明这个运行时覆盖场景。静态129关系仍保留初始 character／battler 两个条件候选，不模拟前面的322，不删除候选，不把 face／初始装备／移除重排加入范围。观察真实位图和绘制，不承诺所有动画布局、插件、完整战斗或整规格通过。

首次 front/run-01 未通过：探针把消费 metadata 的 `kind:enemy` 覆盖到事件类别 `native-sprite-consumer`，独立查询未找到已观察消费记录。保留原始失败／输入／命令／日志及哈希；修正事件标签后 front/run-02、side/run-01、override/run-01 均通过，随后补充精确 Canvas source 对象身份和当前像素断言，最终以 front/run-03、side/run-02、override/run-02 为三个签收运行。早先通过运行仅记为补充，不重复计规范 ID，没有产品消费关系反例。

原始完整成功目录分别是 `M:/Shuen/Codex/asset-validation-notes/n05-front-run-03`、`n05-side-run-02`、`n06-override-run-02`，保留 shell、项目、所有背景／选定媒体、profile 与日志。仓库各子目录保存原始 native-results、input-manifest、launcher-result、nw.log 和必要数据输入；samples 保存六个相关自制 PNG。`.gitattributes` 保留这些原始字节及 NW PixiJS 横幅空格，不能清洗后仍沿用旧哈希。

复跑使用 [run-battlers.mjs](../../probes/native-battlers/run-battlers.mjs)，最后输出目录必须尚不存在：

~~~powershell
& 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe' '.scratch/asset-validation-implementation/probes/native-battlers/run-battlers.mjs' 'F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-local-runtime-1.6.1' 'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win/Game.exe' front 'M:/Shuen/Codex/asset-validation-notes/n05-front-reproduction-new'
~~~

将 front 分别改为 side、override 并使用另外两个新目录，可重跑其余场景。已有明文原生源码和实际调用观察足够；按 reverse-engineer-anything 的证据边界使用，未把静态源码或准备方案计为执行，也未建立额外 REA 分析会话。没有重跑 N01／N02 或改变 `%`／`#` 政策。
