# MV 1.6.1 部署「排除未使用文件」的帮助与嵌入资源范围

调查日期：2026-10-20。用户指定目标：`references/RPGMV/`。

本文为 REA 调查的独立帮助／随包资源子报告，主调查另行保存 REA 原生证据。这里只读取本地首方帮助和 EXE 内完整的 QML／JavaScript 文本；没有启动编辑器或游戏，没有执行被提取的代码，没有修改原软件、项目、地图或决策票。本报告是研究输入，不代表接受新的产品支持政策。

## 结论与证据边界

MV 的这项功能在部署时生成一个必需文件名集合，再过滤**输出包中的 `img/` 和 `audio/` 文件**。它不是先证明所有文件均会在游戏中用到的可达性分析，也不是缺失素材诊断器。扫描同时包含全部角色／敌人／图块组等指定数据库字段、所有已登记地图和全部事件页，以及插件显式声明的资源；它不是从某个事件出发才追踪数据库条目。

这些范围由完整嵌入文本的实际分支和规则表直接支持，属于静态观察。本文涉及实际复制、删除、运行时加载是否成功的说法，只限于已展示调用参数的路径推断，没有真实部署验收。

## 目标与来源身份

`references/RPGMV/RPGMV.exe`：19,595,264 字节，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。与已有原生审计使用的字节身份相同。

首方可读文件（下表的行号直接对应仓库原文件；链接从本文目录解析）：

| 标识 | 来源 | 大小／SHA-256 |
| --- | --- | --- |
| H-DEPLOY | [部署帮助](../../../references/RPGMV/Help/page/01_11_04.html) | 5,446 字节；`d5a333e020f9457a594d45e2691bf83aa9b49fcfe2d38c30964cdb7474c25fca` |
| H-PLUGIN | [排除功能的插件配置帮助](../../../references/RPGMV/Help/page/01_11_11.html) | 5,358 字节；`4bf3fe3baa7f9210d4d418b11c21b824967a6a4bf01a272a38d4302222ae07fe` |
| P-MADE | [随包 MadeWithMv 插件](../../../references/RPGMV/NewData/js/plugins/MadeWithMv.js) | 10,927 字节；`eb4f8afed8e68a326b681bc70aea2bb5c597664cc84b99b8fad48943e531be80` |

复用的本地解码缓存为 `C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/`，其 `inventory.json` 记录了 457 个候选文本。**本轮重新从当前 EXE 的指定偏移解码并逐字节比对缓存**，没有只信任缓存名称。没有重建 Qt resource name/tree，表中「角色」由完整内容及调用关系识别，不冒充已验证的 qrc 路径。

| 标识／角色 | EXE 内 0 起始偏移 | 存储字节数 | 格式 | 解码字节数 | 解码 SHA-256 |
| --- | ---: | ---: | --- | ---: | --- |
| Q-PACK：Dialog_Packaging 形态／部署过滤管线 | 393812 | 2821 | qCompress | 15207 | `248435cfcd038d50a484c8a6d48077652fa074d88b898f19a51665bfc0e5d5f8` |
| Q-ENCRYPT：SimpleEncrypter 形态 | 398646 | 2847 | plain | 2843 | `2d399162e06984e4a3d4d7a5b198236c36e7d379bb5bb884163083f51e9daf04` |
| Q-STRIP：AssetStripper 形态／完整规则与收集逻辑 | 401493 | 4169 | qCompress | 29764 | `79fb5f2d2a36feb46ff26d3ab69125f7a4292a9fed8c9c772591162278463cdf` |
| Q-DEPLOY：Dialog_Deployment 形态 | 415359 | 1421 | qCompress | 6468 | `87da156a5c313013a2798241fc77614e5ea4121a1c0240b8712a75636f8f58c4` |
| Q-OPTIONS：DeploymentOption 形态 | 425759 | 785 | qCompress | 3180 | `69e37055b8998ca48b40f76606ec78a18b7ba79e6a98263fa09038ff5def27fa` |
| Q-ROOT：部署窗口入口／信号连接 | 426544 | 3371 | qCompress | 17252 | `8d2d161cc2d663a7246bf7b7717430a4eebc000f1f04d8704685d5f222cac776` |
| Q-COPIER：FileCopier 形态 | 431140 | 1265 | plain | 1261 | `e0420c1faedad2f73d6f3dc336c1760bd805da54475286aaaf177af768229bca` |
| Q-PARSER：PluginParser 形态 | 905331 | 2113 | qCompress | 10763 | `42e6740bb89200f7974d6af0d511dadcfcee04815b798ce1e03f791eb3c2ace8` |
| Q-DATA：DataManager 形态 | 909009 | 4291 | qCompress | 24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |

`Q-ID:行号` 指上述完整解码 UTF-8 文本按 CRLF／LF 分行的一基行号。完整原生文本留在用户本机缓存，不随本报告发布。

可复现读取方法：用 Node `fs.readFileSync` 读 EXE；校验整文件 SHA-256。偏移处先读 4-byte 大端外层长度，必须等于「存储字节数 - 4」。plain 内容从偏移 + 4 开始；qCompress 从偏移 + 4 再读 4-byte 大端解码长度，使用 `zlib.inflateSync(image.subarray(offset + 8, offset + storedBytes), {info:true})`；校验输出长度及 `result.engine.bytesWritten === storedBytes - 8`，再校验解码 SHA-256。不要 eval 或加载这些代码。已有[序列化研究](../../complete-mv-events/research/editor-serialization.md)提供同格式的原创读取示例，可按该文第 101 行的读取示例定位。

## 官方帮助说了什么

- H-DEPLOY:28–44 将部署描述为导出各平台发布包；:70–81 的选项说明说为了减小发布包，排除 `Project Folder/img/` 和 `Project Folder/audio/` 下不需要的文件。帮助没有声称直接删除原项目文件。
- Q-OPTIONS:12 把 `assetStrip` 暴露为复选框状态，:32–36 的文案为 `Exclude unused files`，提示为部署中排除，默认 `checked: false`。
- H-PLUGIN:25–49 明确警告：插件直接以 `ImageManager.loadBitmap(...)` 使用的必要图片仍可能被排除；要求在插件注释中用 `@requiredAssets img/example/image_1` 这样的无扩展名相对路径保留；HTML 使用的图像也需同样处理。这是显式声明机制，并非帮助承诺自动理解任意 JavaScript／HTML。
- H-PLUGIN:55–82 记录 `@require 1`、`@dir`、`@type file`／`animation` 的插件参数声明；:87–138 记录 `@noteParam`、`@noteRequire 1`、`@noteDir`、`@noteType`、`@noteData`。`@noteData` 的帮助枚举为 maps、events、actors、classes、skills、items、weapons、armors、enemies、states、tilesets。
- P-MADE:15–21、:29–35 的首方随包插件实际使用 `@require 1`、`@dir img/system/`、`@type file`，证明不只是帮助中的假设例子。

## 入口、数据流与输出范围

Q-ROOT:243–246 先经过 `confirmSave` 再打开部署窗口；:66–92 把所选 platform、packageUrl、assetStrip 和加密参数传给打包窗口。Q-DEPLOY:41 把包目录设为用户位置加项目名，:55–73 接收并输出所选项。

Q-PACK:69–80 在勾选时启动 `assetStripper.start()`；:156–158 实例化 AssetStripper。Q-STRIP 根对象是 `QtObject`，:8 的输出是 `requiredFileList`，:13–40 顺次执行系统、通用数据库、地图、事件、插件参数、备注规则，并在末尾展开动画；:43–122 初始化默认规则并补入启用插件声明。

Q-PACK:291–336 用 `TkoolAPI.recursiveFileList(projectFolderPath)` 取得**源项目中已经存在**的文件，对每个候选运行 `needToCopy` 和 `needToCopy2`。源地址是 `projectFolderUrl + "/" + name`，目标地址是 `contentsUrl + "/" + name`，通过后才加入 copier／encrypter。Q-COPIER:23–35 的移除参数是 `data.dest`，随后调用 `TkoolAPI.copyFile(data.source, data.dest)`；Q-PACK:485–486 的目录删除仅针对非空且启用压缩的临时目录。由这些参数可推断此功能通常是在输出选择复制什么，**不对源项目运行“删除未使用素材”操作**。此结论不取消正常部署前保存确认，也不保证用户选择错误的输出路径时的行为。

`needToCopy2`（Q-PACK:417–447）是关键：

| 候选文件顶层目录 | 开启排除时的处理 |
| --- | --- |
| `img`、`audio` | 名称在 `requiredFileList` 中才允许复制 |
| 其他任意目录，包括 `movies`、`js`、`data`、`fonts`、`icon` | 本过滤器直接通过；仍经过另一层通用部署过滤 |

所以，规则表虽有 code 261 的 `movies/` 收集规则，**“排除未使用”本身不剔除未引用影片**。帮助列 img／audio 与实际应用点一致，不能仅看收集规则就宣称清理影片。

独立的 `needToCopy`（Q-PACK:373–415）按平台筛扩展名：ogg／webm 留给 windows、mac、linux、web；m4a／mp4 留给 mobile、web；同时排除项目文件、存档、`test.html`、`debug.log`。这些规则即使不启用“排除未使用”也适用，不等于影片被按引用分析。

## 默认收集范围：全库字段与地图

Q-STRIP:604–950 的默认规则对象经文本截取后作为 JSON 解析核对，包含 system 33 条、general 20 条、map 6 条、event 22 条；没有执行原始函数。

| 来源 | 被保留的素材名称 | 证据 |
| --- | --- | --- |
| **全部 Actors 条目** | `battlerName` → sv_actors；`characterName` → characters；`faceName` → faces | Q-STRIP:641–653；:400–407 遍历完整数组。SV actor 规则没有 side-view 条件 |
| **全部 Enemies 条目** | `battlerName`；`System.optSideView === false` 用 enemies，严格等于 true 用 sv_enemies | Q-STRIP:654–663；:146–154 条件判断 |
| **全部 Tilesets 条目** | 每个 `tilesetNames[]` → tilesets | Q-STRIP:684–687；:437–451 |
| System 图像 | airship／boat／ship 的 characterName、title1Name、title2Name | Q-STRIP:664–683 |
| System 音频 | airship／boat／ship BGM、battleBgm、titleBgm、defeatMe、gameoverMe、victoryMe、sounds[].name | Q-STRIP:688–724；:409–416 展开 sounds |
| **全部 MapInfos 登记地图** | 所有事件页 image.characterName；battleback1Name、battleback2Name、parallaxName、bgm.name、bgs.name | Q-STRIP:159–177；:726–751 |

它不从初始队伍、起始地图、事件调用链或数据库条目可达性计算闭包。角色没入队、图块组未被任何地图使用等情况不会在以上完整数组遍历中被过滤。未登记在 MapInfos 的孤立 Map 文件不属于此地图扫描；复制候选仍由项目文件遍历取得。Q-DATA:88–103 的 `loadAllMaps` 只对登记且未缓存地图加载，任一失败返回 false；Q-STRIP 的地图和地图事件扫描在 mapValid 为 false 时跳过，没有在这些收集函数中产生缺失素材诊断。

此处保存状态的读取是有选择的：地图 BGM／BGS 规则不检查 autoplay 标志；事件页 image.characterName 不检查页条件、页是否会执行或 tileId 是否让行走图处于非活动状态。它们只要存有 truthy 名称就会进入集合。与之不同，保存的 Autonomous Movement 路线仅在 `page.moveType === 3` 时扫描，见下节。

## 默认事件规则与动画展开

Q-STRIP:179–246 扫描所有已登记地图中的所有 Map Event Pages、全部 Common Events、全部 Troops 的全部 Battle Event Pages，不看触发方式、页条件或分支是否运行。分支指令已经存在于原生扁平 command list 中，逐项匹配即可；没有控制流执行分析。

| 原生 code／参数（0 起始） | 收集内容 | 规则位置（Q-STRIP） |
| --- | --- | --- |
| 101，p0 | Show Text 脸图 → faces | :754–762 |
| 231，p1 | Show Picture → pictures | :763–771 |
| 322，p3／p1／p5 | Change Actor Images 脸图／行走图／SV 图像 | :772–798 |
| 323，p1 | Change Vehicle Image → characters | :799–807 |
| 283，p0／p1 | Change Battle Back 两层图像 | :808–825 |
| 284，p0 | Change Parallax → parallaxes | :826–834 |
| 261，p0 | Play Movie → movies（被收集，但不用于按引用剔除 movies） | :835–843 |
| 241／245／249／250，p0.name | Play BGM／BGS／ME／SE | :845–880 |
| 132／133／139，p0.name；140，p1.name | Change Battle BGM／Victory ME／Defeat ME／Vehicle BGM | :881–916 |
| 212／337，p1 | Show Animation／Show Battle Animation：正数 animationId | :917–930 |
| 移动 code 41，p0；44，p0.name | Change Image → characters；Play SE → se | :931–948 |

Q-STRIP:354–398 对 code 505 解包 `parameters[0]` 的移动指令，然后使用同一规则；这依赖 Set Movement Route 的保存镜像记录，不是递归解读 code 205 内嵌 route。Q-STRIP:204–209 仅在页的 `moveType === 3` 时扫描页保存的路线，其他移动类型下保留的路线不会被这条路径收集。脚本中的资源和动态 Plugin Command 不在此表；完整 `searchEventList` 仅按这些 code／字段规则分类，没有 JS 或插件命令语义分析。

动画使用另一层选择性展开：Q-STRIP:309–352 从**所有 Items、Skills、Weapons** 的正 `animationId` 收集；再加事件 212／337 和插件声明的动画 ID。然后读取所选动画的 `animation1Name`、`animation2Name` 以及所有 `timings[].se.name`（:494–521），保留图片与 SE。它**不是对 Animations.json 所有动画无条件保留**；也不必先证明 Item、Skill、Weapon 实际会获得或使用。默认规则不存在按所有事件的 Project Data Reference 一般化追踪任意数据库图的逻辑。

## 无条件保留清单

Q-STRIP:606–640 固定保留 33 个完整无扩展路径；不是整个系统目录全部保留：

- `img/system/` 的 Balloon、ButtonSet、Damage、GameOver、IconSet、Loading、Shadow1、Shadow2、States、Weapons1、Weapons2、Weapons3、Window，共 13 个。
- `img/battlebacks1/` 的 Wasteland、DirtField、Desert、Lava1、Lava2、Snowfield、Clouds、PoisonSwamp、Grassland、Ship，共 10 个。
- `img/battlebacks2/` 的 Forest、Cliff、Wasteland、Desert、Lava、Snowfield、Clouds、PoisonSwamp、Grassland、Ship，共 10 个。

Q-PACK:22–26 的 `ignoreList`（Window.png、Loading.png、icon/icon.png）用于 :450–453 的**加密例外**，不能把它当成另一个剔除白名单或“keep all”功能。Q-OPTIONS 没有用户自定义 keep-all 目录设置；用户可关闭整个排除选项，插件可补充具体声明。此为本次完整部署选项与扫描器文本的有界观察，不排除其他工具或其他版本提供扩展。

## 插件、参数与备注

| 机制 | 静态实现 | 证据 |
| --- | --- | --- |
| 启用条件 | 只为 `DataManager.plugins[i].status` truthy 的插件读取 `js/plugins/<name>.js` 并增加规则 | Q-STRIP:50–85；:248–267 |
| `@requiredAssets` | 注释字段取值直接加到 system 保留集合，完整路径逐字匹配；不会先分析插件函数是否调用了它 | Q-PARSER:169–171；Q-STRIP:81–84、:131–136 |
| 参数 `@require 1` + `@type file` | 已保存插件参数的值加 `@dir`，经 slash 规范化后作为文件路径。空值跳过 | Q-PARSER:141–148；Q-STRIP:258–261、:293–306 |
| 参数 `@type animation` | 把正数值作为 animationId，沿上节动画图片／SE 展开 | 同上 |
| 数组、struct 参数 | parser 对 `[]`、`struct<...>` 形式 JSON 递归，再让每个基本值进入 file／animation 分类；无效 JSON 或缺失定义会返回 | Q-PARSER:235–284 |
| 备注声明 | `@noteRequire` truthy 时从 `@noteData` 指定数据集取得 `<name:value>`，用 `@noteType`／`@noteDir` 分类 | Q-STRIP:64–78、:269–306、:524–602；Q-PARSER:172–187 |
| 备注数据范围 | maps 和 events 特别扫描全部登记地图／地图事件；其他名称以实际存在且为数组的 `DataManager[dataName]` 处理 | Q-STRIP:530–572。帮助支持列表见 H-PLUGIN:123–135 |

Q-PARSER:11–60 解析特定 `/*: ... */` 注释块并按 locale 选择本地或英文块；这不是执行插件脚本。:85–99 每个 `@` 字段取首行。:214–215 的 slash 规范化合并 `/`／`\` 并移除首尾 slash。上述 file 参数／备注路径会经过该规范化；直接 requiredAssets 则没有这一步。

普通 Script 指令 355／655、移动脚本 45、Conditional Branch／Control Variables 中 JS 表达式、Plugin Command 356 的动态拼接路径没有默认提取规则。H-PLUGIN 对 `loadBitmap` 示例仍需声明的说明与此边界相互支持。插件声明可以扩大保留集合，但不构成推断任意脚本行为的证据。

## 文件名匹配、空值与诊断差别

- Q-PACK:436–445 使用 `name.split(".").shift()` 取得**第一个点之前的全部相对路径**，然后用 `===` 与集合匹配。不是 `startsWith`、子串、glob、忽略大小写比较，也不是正确移除最后扩展名的一般路径算法。带点的文件 stem 或目录可能被提前截断并被误排除，这是未运行的静态推断。
- 集合记录带目录、无扩展名路径，因此正常同名 ogg／m4a 可以共用同一保留项；实际复制哪个由平台过滤再定。它不验证另一种格式一定存在。
- `addRequiredFile`（Q-STRIP:460–475）只按严格相等去重，最终集合不保留每次使用的来源链和多处使用位置。上层绝大多数普通 filename 用 truthy 判断跳过空字符串，**没有 trim**；不能把这理解为检测非法素材名。动画 SE 收集只判断 se 对象，再取 name，空 name 可能形成 `audio/se/` 这样的集合项（:494–505）；底层去重函数本身没有普遍过滤空值。
- 整个打包候选循环从现存文件出发。已缺失的引用文件根本不在这些候选中；收集器也没有把 requiredFileList 与磁盘候选逐项求差并报告 missing。可以据此认定这条管线**不提供我们规划的逐引用缺失诊断**，但不能据此宣称游戏实际加载一定无错，或软件其他入口完全不会报文件错误。

## 问题清单与未决

| 问题 | 状态 | 依据／剩余边界 |
| --- | --- | --- |
| 功能是不是原项目素材删除？ | 静态已答 | 是发布包复制过滤；移除目标为 dest／临时目录。没有真实 UI 部署实验 |
| 排除哪些素材目录？ | 静态已答 | 仅 img／audio；movies 虽有收集规则但本筛选不作用于它 |
| 扫整个数据库还是从事件出发？ | 静态已答 | 全量指定数据库字段＋全部登记地图／事件；没有一般事件可达性分析 |
| 事件页、嵌套分支和移动路线？ | 静态已答 | 所有事件页扁平指令；505 解包；仅 custom Autonomous Movement 路线；不判断分支可达性 |
| 动画的间接图片／SE？ | 静态已答 | items／skills／weapons、212／337、插件声明选动画，再展开两张图片和 timings SE |
| 插件和脚本？ | 帮助与静态已答 | 显式声明／typed 参数／note 元数据，未自动分析任意脚本和动态插件命令 |
| 目录保留、名称匹配和默认例外？ | 静态已答 | 固定 33 项；完整相对路径首点截断后严格相等；无 glob 或 case-fold |
| 真机部署是否完全按这些路径产生结果？ | 未运行 | Qt 信号时序、TkoolAPI 文件 API、FileEncrypt 等原生辅助方法内部及所有异常输入没有在本子调查验证 |

可交给原生调查的 focused seeds：`TkoolAPI.recursiveFileList`、`TkoolAPI.copyFile`、`TkoolAPI.removeFile`、`TkoolAPI.createDirectories`、`FileEncrypt.fileEncrypt`；实际素材范围规则在已列嵌入文本中，无须仅凭原生字符串重新猜测。若需要运行验收，后续应以隔离测试项目实测未引用数据库素材、动态脚本素材、inactive route、movies 和带点 stem，但本报告不执行或默认接受这些测试范围。
