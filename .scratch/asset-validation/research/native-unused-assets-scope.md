# MV 原版部署「排除未使用文件」的功能范围

调查日期：2026-10-20。用户指定目标：`references/RPGMV/`。本报告为当前素材存在性规划提供原版行为依据，不改变支持范围，不解决设计票。

## 结论

用户记忆对应原版部署选项 **Exclude unused files**，默认关闭。它收集一组需要保留的素材名称，再决定哪些**已经存在的文件**复制进发布包；按使用情况筛选的目录只有 `img/` 和 `audio/`。它不在源项目中执行未使用素材删除，也不提供我们正在规划的逐引用缺失文件诊断。[Q-OPTIONS:12、32–36；Q-PACK:69–80、291–336、417–447；Q-COPIER:23–35]

原版的扫描起点比我们当前规划宽：它读取全部角色、敌人、图块组的指定素材字段、System、全部登记地图及事件，再补充插件显式声明。它并非从事件操作出发计算素材依赖，也不证明某条目或指令在游戏中可达。保留集合按名称去重，不保存每次 Event Asset Use 的来源或 Asset Dependency Chain。[Q-STRIP:13–40、159–246、400–475、641–751]

最适合复用的是它的原生字段清单，以及动画展开、插件显式声明的事实；不宜直接采用全库扫描、默认保留集合、文件名截断算法或无来源的去重结果来定义我们的检查契约。

## 证据、目标身份和复现

- 目标：[RPGMV.exe](../../../references/RPGMV/RPGMV.exe)，19,595,264 字节，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。
- Win32 数值版本字段为 **1.6.1.0**；字符串 FileVersion / ProductVersion 为空。原生分析为 x86 PE、Ghidra 12.1.4。
- 本轮证据包括首方本地帮助、从该 EXE 字节解码的完整 QML / JavaScript、REA 对三个资源的完整字节读取，以及对一个原始筛选函数的受控重放。嵌入脚本是随包源码文本，不是由 C++ 反编译推测出的源码。
- [帮助与嵌入资源子报告](deployment-help-scope.md)记录全部规则位置、九份资源的偏移和哈希、帮助及插件示例的来源身份。下文的 `Q-ID:行号` 沿用该报告，行号针对其完整解码文本。
- 本机完整 REA Evidence bundle：`C:/Users/Shuen/.codex/tmp/mv-unused-assets-20261020/rea-evidence.json`。共有 6 条记录，0 条 unknown 记录；这不表示调查没有未运行边界。原生脚本和 bundle 留在本机临时区，报告不发布整份原生源码。

| REA 读取对象 | EXE 文件偏移（0 起始）／Ghidra VA | 读取字节数 | 解码 SHA-256 | Evidence ID |
| --- | --- | ---: | --- | --- |
| Q-PACK：部署管线 | `393812` / `0x460254` | 2821 | `248435cfcd038d50a484c8a6d48077652fa074d88b898f19a51665bfc0e5d5f8` | `ev_128153b18209139909ca97f0ae190ab1cb0687fcffa2666156989b89ca1f4496` |
| Q-STRIP：素材收集器 | `401493` / `0x462055` | 4169 | `79fb5f2d2a36feb46ff26d3ab69125f7a4292a9fed8c9c772591162278463cdf` | `ev_ee77b60c84aa7ffa1761e9881ee2a84d51f23a9930e702bf8b98f69b77b0c119` |
| Q-OPTIONS：复选框 | `425759` / `0x467f1f` | 785 | `69e37055b8998ca48b40f76606ec78a18b7ba79e6a98263fa09038ff5def27fa` | `ev_c5ade8253e5ea491e4b891aeb7977769df2cfb55c1d606c01544fef317a7d122` |

三个 `read_bytes` 的 complete 均为 true，返回字节数与请求一致；已逐字节比对当前 EXE 对应片段，并复核解压后长度与上表哈希。qCompress 外层长度、解码长度和 zlib 消耗边界的复核方法见子报告及下述自写探针。

探索性字符串查询只覆盖 Ghidra 已定义字符串，不能代表压缩资源中的全部字符串。`recursiveFileList` 字符串查询记录为 `ev_283606ad5c55fa1436b6740e630b8f118100246781c79f29a7d532bae53090ac`；其 `0x156ddd0` 的直接 xrefs 返回空，记录为 `ev_8ba158bd44724b0cb5953190e0ee9b5f799b03d65cf327cff23f5097e20959f5`。没有把该空结果解释为此 API 未被使用；完整 QML 中存在明确调用。

## 从入口到输出

1. 部署窗口把 `assetStrip` 选项传入打包窗口；勾选时启动 AssetStripper。[Q-ROOT:66–92；Q-PACK:69–80]
2. AssetStripper 收集系统、通用数据库、地图、事件、启用插件参数与备注，再展开所选动画，生成带目录且无扩展名的 `requiredFileList`。[Q-STRIP:13–40]
3. 打包器调用 `TkoolAPI.recursiveFileList(projectFolderPath)` 枚举当前项目中存在的文件，对每个候选先做普通部署筛选，再做未使用素材筛选。[Q-PACK:291–336]
4. 通过筛选的文件才加入复制或加密队列。source 来自项目目录，dest 来自发布包目录或压缩临时目录；FileCopier 删除的参数是 dest，随后 source → dest 复制。[Q-COPIER:23–35]

因此，通常所谓的“删除未使用素材”实际是**不把它们放进发布包**。这条路径不执行源项目素材清理；该结论来自静态调用及参数追踪，未执行真实部署。

| 顶层目录 | 开启 Exclude unused files 后 |
| --- | --- |
| `img/`、`audio/` | 必须命中保留名称集合 |
| `movies/` | 此筛选器直接放行；仍受另一层发布平台格式筛选 |
| `js/`、`data/`、`fonts/`、`icon/` 等其他目录 | 此筛选器直接放行；仍受普通部署规则约束 |

影片存在一个容易误读的实现差别：收集器确有 Play Movie 261 规则，但输出筛选器不对 `movies/` 应用保留集合。`.ogg` / `.webm` 面向 windows、mac、linux、web，`.m4a` / `.mp4` 面向 mobile、web；这是独立的格式选择，关闭 Exclude unused files 时也生效。[Q-STRIP:835–843；Q-PACK:373–447]

## 原版如何认定“使用”

| 来源 | 原版覆盖范围 | 需要留意的边界 |
| --- | --- | --- |
| Actors / Enemies | 全部角色的脸图、行走图、SV 图；全部敌人战斗图 | 不要求角色入队、敌人被战斗引用；敌人目录依 System.optSideView 选择 |
| Tilesets / System | 全部图块组的 tilesetNames；载具图像与 BGM、标题图、战斗与标题音频、全部 System.sounds 等 | 不要求图块组被地图使用，不从某个事件操作推导这些关系 |
| Maps | 全部 MapInfos 登记地图的事件页行走图、战斗背景、远景、BGM、BGS | 地图音频不检查 autoplay；孤立且未登记的 Map 文件不属于这条地图收集路径 |
| Events | 全部 Map Event 页、Common Events、Troop Event 页的扁平指令列表 | 不按页条件、触发方式或分支可达性排除；保存图块图像时保留的 characterName 也可能被收集 |
| Movement Route | 移动 41 图像、44 SE；Set Movement Route 通过 505 镜像记录解包 | Autonomous Movement 仅 moveType === 3 时扫描，其他类型保存的路线不会经该路径收集 |
| Animations | 所选动画的两张图像与 timings SE | 从全部 Items / Skills / Weapons 的正 animationId、事件 212 / 337 和插件声明选动画；不无条件保留全部 Animations |
| Plugins / notes | 启用插件显式声明的素材、file / animation 类型参数及声明的备注字段 | 支持数组和 struct；不执行或理解任意 JavaScript、HTML 或动态插件命令 |

来源：Q-STRIP:159–246、309–451、494–602、641–948。完整默认规则为 system 33 行、general 20 行、map 6 行、event 22 行；行数不是独立事件命令家族数量。

直接事件素材位置覆盖 Show Text、Show Picture、Change Actor Images、Change Vehicle Image、Change Battle Back、Change Parallax、Play Movie、Play BGM / BGS / ME / SE，以及 Change Battle BGM / Victory ME / Defeat ME / Vehicle BGM。Show Animation / Show Battle Animation 则先收集 animationId 后展开。逐项 code 与参数位置见子报告的事件规则表。

固定保留清单共 33 项：13 张 `img/system` 标准图和 20 个 battleback 名称。它不是保留整个 system 目录。Window.png、Loading.png、icon/icon.png 出现在另一份 ignoreList 中时，作用是**加密例外**，不能把它当作未使用筛选规则。[Q-STRIP:606–640；Q-PACK:22–26、450–453]

## 插件扩展的确切边界

原版提供显式声明机制：`@requiredAssets` 直接补充无扩展名路径；`@require 1` 配合 `@type file` / `animation` 读取保存的插件参数；数组、struct 递归读取；`@noteRequire`、`@noteType`、`@noteDir`、`@noteData` 指定标准数据备注中的依赖。[Q-PARSER:141–187、235–284；Q-STRIP:50–85、248–306、524–602]

首方[插件配置帮助](../../../references/RPGMV/Help/page/01_11_11.html)还明确说明，插件调用 `ImageManager.loadBitmap(...)` 的图片可能被排除，需要声明才能保留。普通 Script 355 / 655、移动脚本 45、条件或变量中的 JavaScript、Plugin Command 356 没有默认语义分析规则。动态拼接资源若没有其他可识别引用或显式声明，就没有在这条路径中自动得到保留的保证。

## 缺失文件、名称匹配与受控重放

这条管线从**现存文件**出发决定复制与否。例如事件引用 `img/pictures/Missing` 而文件不存在，缺失文件根本不会成为复制候选；收集器没有把每项必需名称反向对照磁盘并生成逐引用 missing 诊断。其他文件操作、坏地图或无效数据库输入可能另行失败，不能由此推断编辑器对所有异常输入都无报错。[Q-PACK:291–336；Q-STRIP:159–177、460–521]

名称匹配也只是部署实现：Q-PACK:436–445 用完整相对路径的 `split(".").shift()` 取**第一个点之前**的部分，然后与保留集合严格相等比较。没有 glob、前缀或大小写折叠；这不是正确移除最后扩展名的一般路径算法。

已编写[受控重放探针](../probes/replay-native-deployment-filter.mjs)，直接从校验哈希后的 EXE 资源中抽取原始 `needToCopy2` 函数，在 Node vm 中用合成保留集合与路径调用。执行：

```powershell
node .scratch/asset-validation/probes/replay-native-deployment-filter.mjs
```

[结果回执](../evidence/native-deployment-filter-replay.json)：**12 / 12 通过**。覆盖已引用／未引用图片与音频、影片、关闭选项、插件 JS，以及以下名称边界：

| 候选文件／保留项 | 原函数返回 |
| --- | --- |
| `img/pictures/Scene.v2.png` / `img/pictures/Scene.v2` | 排除 |
| `img/pictures/Scene.v2.png` / `img/pictures/Scene` | 保留 |
| `img/custom.v2/Scene.png` / `img/custom.v2/Scene` | 排除 |
| `img/pictures/Used.png` / `img/pictures/used` | 排除 |
| `img/pictures/Used.PNG` / `img/pictures/Used` | 此筛选器保留 |

这些结果复核的是原始函数在合成输入下的 JavaScript 行为。没有启动 RPGMV.exe、Qt、游戏或真实发布，也没有验证完整管线、原生 I/O、加密及运行时加载。回执明确记录 `editorExecuted: false`；不得把 12 个用例写成原版实际部署验收。

## 与当前素材存在性规划的关系

| 维度 | 原版部署排除 | 当前规划及未决点 |
| --- | --- | --- |
| 目的 | 缩减发布包 | Compile / Compile Check 发现事件素材文件缺失 |
| 起点 | 全库指定字段、全部登记地图和事件、插件声明、固定保留项 | Event Asset Use；事件直接引用及沿标准数据可静态追踪的间接素材依赖，详细关系待票 02 确认 |
| 检查方向 | 现存文件 → 是否复制 | 素材使用 → 对应项目文件是否存在；匹配规则待票 03 |
| 未启用保存状态 | 多数保存字段照收，但非 custom 页路线不扫描 | 票 02 已确认支持位置中保存的实际素材名均纳入，包括非 custom 保存路线；不等于缺失一律报错 |
| 来源 | 名称去重后的集合 | 票 02 已确认保留每次独立来源与完整 Asset Dependency Chain，文件查询可复用 |
| 影片 | 收集名称但不按使用情况筛选 | 事件直接素材的一类；具体文件格式契约由票 03 决策 |
| 插件与脚本 | 显式插件声明可扩展，不自动理解任意脚本 | 动态脚本与未知负载继续不猜测；原版插件声明可作为后续扩展参考，未自动纳入首版 |
| 失败与工作流 | 文件复制／部署流程自己的失败路径 | 诊断级别、例外、输入一致性、Push 前是否重查分别由票 04 / 05 决策 |

建议在票 02 中把“原版会收集”作为**候选字段的来源**，再逐条核实事件操作与原生消费关系。播放动画 → 图像 / SE、更换图块组 → tilesetNames 可以沿各自来源核实；原版全量 Actors 遍历不能证明修改角色 HP 必需该角色全部图像。原版固定保留 33 项也不等于每个事件都要检查这些素材。

本研究不扩展 DSL-Owned Project Data，不更改现有检查级别或地图的排除范围。当前 [ADR 0011](../../../docs/adr/0011-native-command-state-and-validation.md) 的“素材文件不扫描”仍是既有决定；[决策地图](../map.md)已明确重新讨论该文件边界。研究事实不是对 ADR 的修订，也没有解决 [ADR 0013](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md)下的素材输入与 Generated Freshness 契约。

## 调查问题收口

| 问题 | 状态 | 证据与剩余边界 |
| --- | --- | --- |
| 是否有该选项，删源还是过滤输出？ | 静态已答 | 复选框、参数流及复制源／目标；未做 UI 部署 |
| 哪些目录、数据库和事件位置参与？ | 静态已答 | 完整收集规则与实际应用点；特别区分 movies 和非 custom 路线 |
| 是否一般性追踪所有间接依赖？ | 静态已答 | 全量指定字段与选择性动画展开；不是事件操作起点的一般依赖分析 |
| 插件／脚本能检查多少？ | 帮助与静态已答 | 声明、typed 参数与 notes；不自动理解任意脚本 |
| 文件匹配是否精确、有何例外？ | 静态及函数重放已答 | 严格相等、首点截断、33 项固定保留；12 个重放用例通过 |
| 是否提供缺失素材诊断？ | 静态已答 | 这条管线不逐引用求差或定位 missing；不概括软件其他入口 |
| 完整编辑器真实部署是否符合所有路径与异常行为？ | 未运行 | Qt 时序、TkoolAPI 内部、FileEncrypt、真实发布包及所有异常输入未实测；不影响此次静态功能范围结论，但不是运行验收 |

本次“先看原版功能范围”的问题已经有逐项来源支持。没有把完整运行验收或我们自身覆盖政策标为完成。
