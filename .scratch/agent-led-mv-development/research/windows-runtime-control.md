# Windows MV 实际运行与自动控制：事实研究

研究日期：2026-10-18（Asia/Shanghai）。对应决策票：《确认 Windows MV 实际运行与自动控制的可行接口》。本报告只调查事实与候选路径，不选择运行架构，不实现桥接，不执行样本游戏、引擎或插件。

## 研究结论与证据边界

MV 1.6.1 核心机制已经提供启动、键鼠输入处理、运行状态、事件页选择、解释器等待、异常处理和场景截图的底层入口；NW.js 有开发插件、远程 DevTools 和定制 ChromeDriver 三类可利用路径。现有资料足以支持“最小运行闭环可调查、可实验”的路线判断，还不能证明指定 Windows 宿主能被指定客户端可靠控制。[MV-source] [NW-debug] [NW-driver]

必须区分三个版本对象：编辑器／项目标记、工程实际携带的核心脚本、实际启动的 NW.js／Chromium／Node。工具的 Node.js 22 基线属于工具进程，不能据此给游戏插件采用同一运行要求。官方 NW.js 0.29.0 的版本组合是 Chromium 65.0.3325.146、Node.js 9.7.1；本研究没有找到足以把“MV 1.6.1”与“所有工程必定使用 NW.js 0.29.0”绑定的一手证据。[MV-version] [NW-release] [Repo-runtime]

首里程碑可以保留同一测试构建内的存档／读档检查。跨版本、跨插件升级的历史存档迁移不应成为默认门槛；这是已确认的范围偏好，不能从引擎的读档接口反推为一项兼容承诺。

证据分为三层：

| 层级 | 本次依据 | 能证明什么、不能证明什么 |
| --- | --- | --- |
| 本地文本 | 只读 `references/rmmv-test-project`，项目标记和核心版本均为 1.6.1；文件指纹见文末 | 能证明这份样本源码有哪些入口；不能证明来自未修改的官方安装模板，也不能证明其宿主运行成功。样本已启用额外插件。 |
| 第一方公开核心源码 | `rpgtkoolmv/corescript` 固定提交 `182e31449707ba7e406db0485c44c2a9d11e2dcd` | 该提交同时标记 `MV 1.6.1` 与 `community-1.3b`。可核对核心机制，不能冒充每一份原生 1.6.1 工程的字节级基准。 |
| 宿主／浏览器资料 | NW.js `nw29` 固定提交、0.29.0 发布说明，以及 Chromium 65／对应 V8 的协议源码 | 能证明候选宿主和协议当时已有相关接口；不能证明本机将启动哪份二进制、何种 flavor、端口是否可连接及最终画面是否正确。 |

特别排除：community 核心的增强错误信息、`setEventInfo` 等，不作为本地样本或所有 MV 1.6.1 的既有能力；本地样本的 `command355` 是直接 `eval`，没有 community 提供的命令区间错误包装。见本地 `js/rpg_objects.js:10494` 与公开 [MV-interpreter] 的 `command355`／`setupChild`。

## 1. 宿主识别与启动

| 问题 | 已证实事实与代码位置 | 运行前仍须确认 |
| --- | --- | --- |
| 游戏如何进入核心 | 样本 `package.json:3` 的 `main` 为 `index.html`；页面按顺序加载引擎、`plugins.js`、`main.js`。`main.js:5` 调用 `PluginManager.setup($plugins)`，窗口加载后 `SceneManager.run(Scene_Boot)`。公开模板与入口一致。[MV-entry] [NW-manifest] | 实际工程可能替换页面、入口、核心和插件；需以所测副本的清单为准。 |
| Windows 上如何运行 NW 应用 | NW.js 的应用由 manifest 与宿主共同组成；文档支持启动指定应用目录和 `--nwapp`，也允许将应用与宿主一起分发。可执行文件名称不足以识别版本。[NW-start] [NW-package] [NW-cli] | 需确定已授权的宿主位置、二进制及依赖文件、架构、工作目录、退出与清理方式。样本根目录只观察到项目文件、页面与 manifest，没有据此确认捆绑的宿主。 |
| 如何识别 MV | `Utils.RPGMAKER_NAME`、`Utils.RPGMAKER_VERSION`；样本 `js/rpg_core.js:183` 为 `1.6.1`。`Game.rpgproject:1` 也标记 1.6.1。[MV-version] | 常量可被更改；版本值之外还需核心脚本哈希，不能仅看编辑器版本或项目文件。 |
| 如何识别宿主 | 在游戏窗口上下文读取 `process.versions.node`、`process.versions.nw`、`process.versions.chromium`、`process.versions['nw-flavor']`；NW.js 文档明确后三项及 `sdk`／`normal` flavor。[NW-node] [Node-process] | 这些是待采集的指纹，本次没有运行游戏取得值。记录 `process.execPath`、`process.arch`、`process.platform`、实际启动参数和 manifest，有助于确定所测对象。 |
| 如何判断 NW 环境 | 样本 `Utils.isNwjs()` 只检查 `require` 函数与 `process` 对象；不是精确版本探测。[MV-version] | 这项启发式判断不保证某个 NW API 或调试能力可用；仍须探测。 |
| 两种 Node 的关系 | ADR-0002 要求工具 Node.js 22。NW.js 0.29.0 的游戏端 Node 是 9.7.1；其浏览器／Node 上下文也有区分。[Repo-runtime] [NW-release] [NW-context] | 游戏端桥接脚本的语法、内置 API、依赖、原生模块 ABI，须按实际宿主另行验证。不能把工具的 Node 22 依赖直接塞进游戏。 |

`Utils.isOptionValid(name)` 从 URL 查询参数或 `nw.App.argv[0]` 的 `&` 分段中识别选项，未提供通用场景描述入口。本地位置为 `js/rpg_core.js:193`，公开实现见 [MV-version]。因此可调查 `test`、`btest`、`etest`，但这些选项的作用不能混为一谈：

- `test`：已有测试环境开关，例如样本 `SceneManager.onKeyDown` 在 NW 环境且 `test` 为真时让 F8 打开 DevTools；`test` 本身不跳过标题、不选择指定地图。还须满足宿主 DevTools 可用条件。[MV-scene-manager] [NW-debug]
- `btest`：进入战斗测试，读入带 `Test_` 前缀的数据库并使用测试敌群。[MV-data]
- `etest`：进入事件测试，读入 `Test_` 数据库与 `Test_Event.json`；初始化把玩家传送到地图 `-1` 的测试环境，地图解释器消费 `$testEvent`。它不是“在原工程任意真实地图中运行一个事件”的现成入口。本地 `js/rpg_managers.js:65,233`，`js/rpg_objects.js:6152`。[MV-data] [MV-boot] [MV-map]

现成入口允许候选测试驱动在数据库就绪后创建新游戏、通过 `reserveTransfer(mapId,x,y,d,fadeType)` 预约进入地图，再遵守 `Scene_Map` 的加载与初始化顺序。本地 `js/rpg_objects.js:7451`、`js/rpg_scenes.js:552`。这是可调查的启动方式；直接改 `$gameMap._mapId` 或绕过地图加载，不能据此声称复现正常地图进入行为。[MV-player] [MV-map-scene]

## 2. 输入、条件等待与观察

| 能力 | 可用入口及证据 | 边界 |
| --- | --- | --- |
| 方向、确认、取消等键盘操作 | `Input` 向 document 注册 keydown／keyup，使用 `keyMapper[event.keyCode]` 更新状态；每次 `Input.update()` 根据当前和前次状态计算触发、长按和方向。本地 `js/rpg_core.js:3073,3224,3236,3277`。[MV-input] | 发出键事件不等于游戏已经消费。按下与释放须跨越有意义的更新时机；同一帧前按下并释放可能不产生触发。私有字段注入只是候选，不能等同于完整键盘路径。 |
| 鼠标／触摸 | 原生 `TouchInput` 注册 DOM 输入，再在更新中计算状态；Chromium 65 协议已包含 `Input.dispatchMouseEvent`。[MV-touch] [CDP-browser65] | 要明确 CSS 像素、游戏画面坐标、缩放与窗口尺寸；插件可能自行监听 DOM 或替换输入，原生 `Input` 注入未必覆盖它们。 |
| 条件等待 | `SceneManager.updateMain()` 按时间累积驱动输入／场景；解释器通过 `_waitCount` 与 `_waitMode` 等待消息、传送、路线、动画、气泡、聚集、战斗行动、视频、图片等。本地 `js/rpg_managers.js:1970`，`js/rpg_objects.js:8871`。[MV-scene-manager] [MV-interpreter] | 没有现成的外部 `waitUntil` API，需要驱动实现带截止时间的状态条件；“固定睡眠若干秒”不能证明剧情完成。帧数与墙钟时间、窗口后台行为须分开验证。 |
| 当前地图／玩家／状态 | `$gameMap.mapId()`、`$gamePlayer.x/y`、`$gameSwitches.value(id)`、`$gameVariables.value(id)`、`$gameSelfSwitches.value([mapId,eventId,ch])`；本地 `js/rpg_objects.js:527,559,594,5461`。[MV-map] [MV-player] [MV-switches] [MV-variables] [MV-self-switches] | 对象只在相应初始化后存在；读档会替换对象实例。通过运行桥接返回受控的可序列化快照，比假设所有时刻都存在对象更可验证。 |
| 当前活动事件页 | `Game_Event.page()` 使用 `_pageIndex`；`refresh()` 从末页向前选择首个满足条件的页面，被擦除或无匹配时可能为 `-1`。本地 `js/rpg_objects.js:8465,8602,8610`。[MV-event] | 原始索引从 0 开始；不是编辑器显示的从 1 开始页号。状态变动与地图刷新之间有时序，不能刚设开关便宣称页已切换。插件可改条件和选择规则。 |
| 解释器位置 | `Game_Interpreter` 有 `_mapId`、`_eventId`、`_list`、`_index`、`_waitMode`、`_waitCount`、`_childInterpreter`；`currentCommand()` 读 `_list[_index]`。本地 `js/rpg_objects.js:8788,8800,8964`。[MV-interpreter] | 这些大多是内部字段，不是稳定外部调试协议。`_index` 可在命令内部推进并在等待前指向下一条／续行附近；应同时记录当前命令、等待原因和来源，不能直接把它当“正在执行的 DSL 行号”。 |

解释器不是单一对象。地图主解释器、并行 Map Event 解释器、并行 Common Event 解释器及子解释器同时存在；只看 `$gameMap._interpreter` 会漏掉并行执行。本地 `js/rpg_objects.js:6113,6214,6229,8743,9377`；公开实现见 [MV-map] [MV-common] [MV-event] [MV-interpreter]。

还存在一个需要设计解决的来源问题：活动页可能已经刷新，而某个解释器仍持有之前的命令列表；公共事件子解释器在本地样本中只存 list 和调用上下文 eventId，没有持久记录“当前 Common Event ID”的字段。因此“当前活动页”与“解释器命令来源”不能合并成一个猜测值。若要可靠回溯到地图页、公共事件和 DSL 源码，需要在初始化／调用边界记录来源，或有等效映射；采用哪种方式留给后续决策。本地 `js/rpg_objects.js:8602,8800,9368`。[MV-event] [MV-interpreter]

窗口后台行为也不能只靠资料认定：NW29 文档提供 `--disable-raf-throttling`，表明隐藏／最小化与帧回调有关，但不证明某份 MV／插件组合在隐藏状态会照常前进。应把前台、失焦、隐藏、最小化作为独立待实验条件，不预先承诺无界面运行。[NW-cli]

## 3. 失败证据与截图

本地核心在 `SceneManager.update()` 中捕获帧循环异常，`catchException()` 打印错误和 stack、停止音频与更新；还注册了 window `error` 事件处理。路径为 `js/rpg_managers.js:1889,1900,1918,1946`。加载插件失败有 `PluginManager.checkErrors()`；存档／读档错误则会被 `DataManager` 自己 catch 后 `console.error` 并返回 `false`。所以仅监听 window `error` 或仅观察进程退出，不足以完整判断失败。[MV-scene-manager] [MV-plugin] [MV-data]

| 证据 | 已有机制 | 不能直接保证的部分 |
| --- | --- | --- |
| 同步异常、console、执行上下文 | Chromium 65 对应 V8 协议包含 `Runtime.enable`、`Runtime.evaluate`、`Runtime.callFunctionOn`，以及 `consoleAPICalled`、`exceptionThrown`、`executionContextCreated` 事件。[CDP-js65] | 核心／插件已捕获且不再抛出的异常、被忽略的 Promise、插件吞掉的日志不一定成为异常事件；需结合错误接口、日志、返回值和场景断言。 |
| 原生场景截图 | `SceneManager.snap()` 返回 `Bitmap.snap(this._scene)`，后者渲染 PIXI 舞台到纹理／画布；样本 `js/rpg_managers.js:2108`、`js/rpg_core.js:925`。[MV-scene-manager] [MV-bitmap] | 舞台快照不等于整个窗口；HTML 错误层、DOM 覆盖、视频和插件自行绘制的画面可能不在其中。 |
| NW 窗口截图 | NW29 `win.capturePage(callback, config)` 捕获窗口可见内容，支持 png／jpeg 与 buffer／datauri 等输出。[NW-window] | 真实宿主下 WebGL、隐藏窗口、视频、插件叠层能否正确捕获仍待实验。 |
| 外部页面截图 | Chromium 65 协议已有 `Page.captureScreenshot`，支持 png／jpeg 与 clip；`fromSurface` 当时标记 experimental。[CDP-browser65] | 新版 CDP 参数不可直接套用到旧宿主；须探测协议并做实际像素验证。它也不是崩溃／事件循环锁死后的必达截图机制。 |
| 超时／卡死 | 核心 `Game_Interpreter.checkFreeze()` 在单帧大量事件命令后让出；样本阈值为 100000，并不把任务判失败。本地 `js/rpg_objects.js:8941`。[MV-interpreter] | `eval` 内部无限循环或插件同步锁死仍可阻塞同进程的桥接与定时器。需要外部截止时间和进程监督；超时时只能保证收集已取得的最后状态，不能承诺再成功调用游戏内截图。 |

“事件一直等待”“主循环停止但进程还活着”“渲染器崩溃”“断言失败”是不同故障证据。后续接口至少要能区分这些情况；这不要求本研究现在决定错误 schema。

## 4. 三类候选控制路径

| 候选 | 第一方依据与前提 | 对决策有用的能力 | 关键限制／最小实验 |
| --- | --- | --- | --- |
| 开发期插件桥接 | `plugins.js`、`PluginManager.setup` 与脚本加载提供接入点；也有 manifest `inject_js_start/end`。游戏对象位于浏览器窗口上下文，Node 模块默认可能在另一上下文。[MV-entry] [MV-plugin] [NW-manifest] [NW-context] | 可以定义明确的观察、输入、就绪、来源记录和断言接口；不必把每次操作写成散落的任意求值。 | 需要放入测试副本并确认加载时机／顺序、旧宿主语法和通信方式；桥接本身会影响运行，游戏锁死也会锁住它。插件通信协议和作用域仍待决。 |
| 外部 DevTools／CDP | NW29 SDK 调试文档支持 `--remote-debugging-port=<port>`；Chromium 65 的协议源码包含输入、求值、console／异常和截图所需原语。[NW-debug] [CDP-browser65] [CDP-js65] | 外部驱动可以发现目标、进入正确窗口执行观察／控制并收集证据；可与小型游戏内适配器组合，二者不必互斥。 | 真实二进制需支持并启用调试能力；须选择游戏页面而非背景 Node 页，确认协议和断连行为。现代浏览器自动化库不能仅因支持 CDP 就被认定支持 Chromium 65／NW29。 |
| NW.js 定制 ChromeDriver／WebDriver | NW29 官方文档提供定制 ChromeDriver，要求来自 NW SDK 并与 NW 二进制放在一起，支持 `nwapp` 与 `nwargs`。[NW-driver] | 键鼠、JavaScript 执行和测试生命周期有官方自动化路径可查。 | 需匹配实际 NW 发行版本，并验证所用客户端与旧 driver 的兼容。历史文档的 Selenium 调用示例不是对当前 API 的承诺。测试不是网页 DOM 表单时，仍需观察游戏内部状态。 |

远程调试接口的 `/json/version`、`/json/list`、`/json/protocol` 是可探测的版本／目标／协议入口，当前官方 CDP 文档有明确说明；本研究不据当前说明断言所有旧 NW 都实现同一返回结构。应以实际实例返回的 capability 为准。[CDP-discovery]

普通浏览器加载同一页面可用于某些游戏逻辑实验，但不是 Windows NW 游戏宿主的等价证据：`Utils.isNwjs()` 分支、Node 文件访问、原生模块、存档后端和插件行为都可能不同。本地 `StorageManager.isLocalMode()` 正是按 `Utils.isNwjs()` 选择后端。[MV-version] [MV-storage] [NW-context]

以上三类路径均为候选，不是已选架构，也不表示每条路径都需要实现。它们共同缺少的证明是：在已识别的实际宿主上，从启动到交互、观察、失败与退出的一次最小实验。

## 5. 测试副本、存档与资源的隔离

有两个不同的存储根需要处理：

1. MV 本地存档：样本 `StorageManager.localFileDirectoryPath()` 根据 `dirname(process.mainModule.filename)` 定位 `save/`；其内包含 `config.rpgsave`、`global.rpgsave`、`fileN.rpgsave` 及备份。因此仅设置 `--user-data-dir` 不会自动把 MV 原生本地存档移出游戏目录。位置：`js/rpg_managers.js:755,762`。[MV-storage]
2. NW 配置／浏览器数据：`--user-data-dir` 指定 profile、缓存和 crash dumps 等目录；缺省 Windows 路径与 manifest 的 `name` 相关。复制工程但沿用同一 profile，也不能认定浏览器状态已隔离。[NW-cli] [NW-app] [NW-manifest]

由这些已证实机制推导，未来测试方案应逐项说明下列隔离边界，而不把“复制 data/”当作完整答案：

- 测试副本到底对应 Push 前的基线、Generated Project Data 叠加结果，还是 Push 后 Project Root；将文件清单／哈希与执行记录关联。运行测试不应静默改写 Project Root 或同步元数据，否则会越过 ADR-0003 的写入边界。[Repo-push]
- 副本需要实际页面、引擎、`js/libs`、插件清单与参数、插件文件、资源和插件额外数据；本地 `DataManager.onLoad` 还根据 System Data 配置加密资源读取。样本本身就有额外启用插件，不能作为纯原生行为测试夹具直接执行。[MV-entry] [MV-data] [MV-plugin]
- 存档目录与 NW profile 都要有独立归属；测试应明确使用空白新游戏还是指定测试存档，避免隐式继承玩家存档和 config。插件可能另选文件路径、写日志、调用 Node 或网络；复制项目不是 OS 级沙箱，不能声称隔绝任意插件副作用。[MV-storage] [NW-context]
- 共享资源、符号链接或硬链接方案的写入影响需要单独判断。为每次运行记录资源清单／哈希能说明测试过什么，但不能恢复已经被外部改写的资源；这与 ADR-0010 的资源来源说明一致。[Repo-render]
- 调试端口、profile、临时目录和进程应归本次测试所有，避免第二实例被既有 NW 实例接收；官方命令行文档明确已有实例时可能通过 App 的 `open` 事件接收新命令行。[NW-cli]

这些是待选择的测试设计约束，不是本次已创建的测试副本方案。

## 6. 同一构建内的存读档检查

样本 `DataManager.saveGame(id)`／`loadGame(id)` 是同步布尔返回接口，内部捕获错误、打印 console，并分别写入／读回保存内容。保存内容包含开关、变量、独立开关、角色、队伍、地图和玩家，不包含 `$gameTemp`、`$gameMessage` 和 `$gameTroop`。读档会建立并替换游戏对象；已缓存的对象引用可能失效。位置：`js/rpg_managers.js:337,352,383,430,446`。[MV-data]

但直接调用这两个方法不完整等价于用户走存读档界面：`Scene_Save` 先调用 `$gameSystem.onBeforeSave()`；`Scene_Load` 成功后进入地图、按 versionId 判断是否重新加载地图，并在场景终止时调用 `$gameSystem.onAfterLoad()`。位置：`js/rpg_scenes.js:1704,1742,1761,1770,1783`。[MV-save-scene] [MV-load-scene]

因此后续要决定场景测试走真实菜单，还是由测试适配器显式遵守这些生命周期；不能把仅返回 `true` 当作“读档后功能正确”。首里程碑可在固定引擎／数据／插件／资源的同一测试构建中检查：交付奖励后保存，结束该次运行，再加载测试存档，确认奖励和防重复状态。跨发布版本迁移、旧插件状态升级不随之成为默认验收项。

## 7. 插件与动态脚本的可观察性边界

`PluginManager.setup` 读取启用状态和参数并按清单加载脚本，不为命令提供存在性／语义注册。原生 `command356` 按空格拆分字符串，调用默认空实现、留给插件覆盖的 `pluginCommand`；所以“运行时没有抛错”不能证明某条命令确实被任何插件处理。原生 `command355` 合并后续 `655` 命令后直接 `eval`。位置：`js/rpg_managers.js:2801`、`js/rpg_objects.js:10494,10505,10512`。[MV-plugin] [MV-interpreter]

运行观察可以报告某一时刻的原生状态、页面、解释器、错误、截图和已接入插件公开的状态。它不能只凭静态事件数据断言最终通行、任务完成、所有插件等待均已结束，不能普遍理解插件闭包／自定义存储的语义，也不能证明未覆盖路径上无故障。插件可能改写原型、替换引擎类、添加 wait mode、绕过默认存储和输入。因此支持“明确接入的第三方插件”需要实际插件指纹、测试场景，以及必要的专门观察或断言；这不是可以从 MV 版本号推导的通用兼容保证。[MV-interpreter] [MV-event] [MV-storage]

## 8. 尚未证实与后续最小实验

以下事实必须通过授权后的测试副本实验取得，不能在本次研究中标为成功：

1. 实际可用的 Windows 宿主路径、二进制哈希、NW／Chromium／Node 版本、架构、SDK flavor；与所测核心／插件组合是否启动成功。
2. 命令行参数在该宿主中的真实传递、调试端口／driver 可连接性、正确页面上下文及连接／退出清理。现代客户端与旧协议的组合是否可用。
3. 一次方向输入、确认／选项选择、跨地图加载和条件等待；前台、失焦、隐藏／最小化时帧推进和按键释放是否可靠。
4. 两页事件切换、并行事件及公共事件子调用的观察结果；解释器来源记录是否能保持准确，尤其在页面刷新和读档后。
5. 普通错误、被捕获的存档失败、资源失败、永远等不到的条件、同步锁死，能否分别收集可解释的结果；进程监督能否在游戏内接口失效时仍结束本次测试。
6. 原生场景截图、NW／CDP 页面截图，在 WebGL 与插件覆盖层上的实际内容；不把纯黑图、未就绪帧当成成功证据。
7. 同一测试构建的存档、关闭、重启和读档，是否保留委托状态并阻止重复奖励；同时核对所有写入位置均属于测试环境。

实验用于消除路线不确定性；本研究没有创建、运行或宣布这些场景通过。

## 9. 对后续决策图的影响

- “运行验收怎样接入现有 Workspace”已经可以精确成票：需要决定被测数据来源、独立运行能力与 Compile／Push／Map Preview 的关系，以及结果如何关联来源。不能为实现运行验收而让静态 Map Preview 隐式执行游戏；这会改变 ADR-0009／0010 的边界。[Repo-preview] [Repo-render]
- “首里程碑最低运行能力与故障证据是什么”已经可以精确成票：从普通事件闭环所需的启动、交互、状态条件、多解释器来源、错误、截图和终止边界取舍；不必先支持所有数据库、插件及无界面 CI。
- “用哪条控制路径”仍是需要比较与实验的架构决定：资料使三类候选明确，但真实宿主和客户端兼容性必须先由最小实验提供事实。也可以决定小型桥接与外部驱动组合，不能从本报告直接宣告某一种胜出。
- “测试状态如何隔离与复现”是已清晰的问题：工程目录／本地 save 和 NW profile 是两个维度；插件额外副作用需要按实际依赖处理。
- 存档验收仅默认覆盖同一构建内的功能持久化；历史存档迁移保持低优先级，遇到明确产品需求再讨论，不作为当前路线的阻塞前提。

本报告不替用户作这些取舍，也不产出实现规格。

## 来源与可复核指纹

公开核心仓库自己的 README 说明其为社区改进、通过 KADOKAWA 分发，且使用 ES5；公开提交与本地样本均已分别辨认，未把二者合并成一个“官方 1.6.1 模板”。[MV-source]

本地样本以 `F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project` 为根，仅作文本读取；未复制引擎到研究分支。下列为本次读取时 SHA-256，远端读者若没有该样本，可查公开固定提交核对机制，但不能声称已复核本地字节：

| 文件 | SHA-256 |
| --- | --- |
| `js/rpg_core.js` | `9AD9914CC421AF6D054C3F01B022B7383863B047EC3F6F76AA897E6CFBF864C6` |
| `js/rpg_managers.js` | `B3D5C746CF52234BDD34AF746DBF3CAECF96BB3477CC6D24121C4A1A11241114` |
| `js/rpg_objects.js` | `2D43DD9D8974C88A1B82FFA493D6D8A02C4CE1D0DFC8F05E6C0AB731E3F0573E` |
| `js/rpg_scenes.js` | `A76EA8C14EC7414A0E2BB488B19734603CC3D8AACE3F163E3AA82FC3D0D20D20` |
| `package.json` | `E06B7C1A22AF5E72CE574D9A0B4D11C7A00F2935AE6C3976E1ABB984FCE283D9` |
| `index.html` | `A1B290CE648F027248D4903CB12486CDD744FDC145A6DF0CE31CDE027BC02E7B` |

第一方公开来源固定点：

- MV CoreScript：`182e31449707ba7e406db0485c44c2a9d11e2dcd`，2019-01-07；`Utils` 标记 `1.6.1 / community-1.3b`。
- NW.js `nw29` 文档：`8c2782ac550b2b950c2a99cdc7590949b6a8b82c`。它是历史分支的固定文档点，不冒充本机二进制指纹。
- Chromium：`65.0.3325.146` 的 browser protocol；其 DEPS 的 `v8_revision` 为 `7199784766ca3b3926eefc39ab7d748e954acc24`，用于核对 Runtime 协议。两份 schema 都声明 protocol 1.3；协议版本号相同不等于所有方法／参数等同于今天的版本。[CDP-deps65]
- 当前 CDP 发现接口说明：`ChromeDevTools/devtools-protocol` 的 `gh-pages` 固定提交 `a43ddf9e84369f465e93b42047d642baeb87c375`；仅用于指出可探测项，历史宿主行为仍待实验。
- 仓库 ADR 基线：研究分支起点 `da26d4ef5aaa2b997c75eb51cc405985178b21e2`。

[MV-source]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/README.md
[MV-version]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_core/Utils.js#L29
[MV-entry]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/template/index.html
[MV-data]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_managers/DataManager.js
[MV-boot]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_scenes/Scene_Boot.js#L61
[MV-map]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Map.js
[MV-map-scene]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_scenes/Scene_Map.js
[MV-player]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Player.js
[MV-event]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Event.js#L178
[MV-interpreter]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Interpreter.js
[MV-common]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_CommonEvent.js
[MV-switches]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Switches.js
[MV-variables]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_Variables.js
[MV-self-switches]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_objects/Game_SelfSwitches.js
[MV-input]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_core/Input.js#L119
[MV-touch]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_core/TouchInput.js
[MV-scene-manager]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_managers/SceneManager.js
[MV-bitmap]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_core/Bitmap.js
[MV-plugin]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_managers/PluginManager.js
[MV-storage]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_managers/StorageManager.js#L194
[MV-save-scene]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_scenes/Scene_Save.js
[MV-load-scene]: https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_scenes/Scene_Load.js
[NW-start]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/For%20Users/Getting%20Started.md
[NW-package]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/For%20Users/Package%20and%20Distribute.md
[NW-manifest]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/References/Manifest%20Format.md
[NW-node]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/References/Changes%20to%20Node.md#process
[NW-debug]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/For%20Users/Debugging%20with%20DevTools.md
[NW-cli]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/References/Command%20Line%20Options.md
[NW-window]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/References/Window.md#L394
[NW-app]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/References/App.md#L28
[NW-driver]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/For%20Users/Advanced/Test%20with%20ChromeDriver.md
[NW-context]: https://github.com/nwjs/nw.js/blob/8c2782ac550b2b950c2a99cdc7590949b6a8b82c/docs/For%20Users/Advanced/JavaScript%20Contexts%20in%20NW.js.md
[NW-release]: https://nwjs.io/blog/v0.29.0/
[Node-process]: https://nodejs.org/download/release/v9.7.1/docs/api/process.html#process_process_versions
[CDP-browser65]: https://chromium.googlesource.com/chromium/src/+/65.0.3325.146/third_party/WebKit/Source/core/inspector/browser_protocol.json
[CDP-js65]: https://chromium.googlesource.com/v8/v8/+/7199784766ca3b3926eefc39ab7d748e954acc24/src/inspector/js_protocol.json
[CDP-deps65]: https://chromium.googlesource.com/chromium/src/+/65.0.3325.146/DEPS
[CDP-discovery]: https://github.com/ChromeDevTools/devtools-protocol/blob/a43ddf9e84369f465e93b42047d642baeb87c375/index.html
[Repo-runtime]: ../../../docs/adr/0002-technical-architecture-and-toolchain.md
[Repo-push]: ../../../docs/adr/0003-workspace-compile-push-model.md
[Repo-preview]: ../../../docs/adr/0009-read-only-map-inspection-and-preview.md
[Repo-render]: ../../../docs/adr/0010-static-map-rendering-with-project-image-assets.md
