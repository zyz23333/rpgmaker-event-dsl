# 事件素材文件存在性检查实施规格

Status: ready-for-agent
Created: 2026-10-24
Source: [事件素材引用检查的决策地图](map.md)
Acceptance: [已接受的验收矩阵](acceptance-matrix.md) · [实施验收用例索引](implementation-acceptance-cases.md)

本规格承接六张已 resolved 的决策票、ADR 0016–0019 及已确认的验收交接。它规定首版实现和完成标准；产品功能、自动化用例与原生必验项仍待实施／执行。`ready-for-agent` 表示规格可以交给实施方，不表示功能已完成。

## Problem Statement

Event DSL 作者能通过编译确认事件结构和固定项目引用是否合法，却仍可能在游戏运行时才发现图片、音频或影片文件不存在。直接素材名称可能保存在事件页、嵌套分支、移动路线或原生 raw 指令中；播放动画、更换图块组、战斗等操作还会通过标准项目数据间接使用素材。仅验证数据库条目存在，不能确认这些文件存在。

同一素材可能被多个事件和公共事件调用链使用。只有一个去重后的文件名，无法解释具体要修改哪个事件或哪个数据库字段。初始化候选、明确未启用的保存配置、运行时动态目标也需要不同的说明，避免把保存关系误说成必然执行。

素材文件位于实时 Project Root，独立于 Standard Project Data Snapshot。编译后删除素材，当前 Generated Freshness 仍可能成立；无数据差异的 Push 也不能据此宣称素材条件满足。作者需要在日常 Compile、Compile Check 和 Push 中获得一致、可定位且有明确有效时刻的诊断。

## Solution

在 Windows / Node.js 22 验证环境、RPG Maker MV 1.6.1 普通编辑项目中，默认检查所有当前 Event Definitions 的已选直接素材及有限标准数据依赖。检查只确认准确目标是否是可观察元数据的普通文件；图片采用 PNG，音频采用 OGG，影片采用 WebM。通过不保证内容可读、布局正确、解码、播放或运行时必然使用。

普通明确使用的已确认缺失、名称不符或类型问题默认阻止 Compile／Check／Push；Conditional Asset Candidate 和明确非活动保存配置中的同类问题警告。作者可为准确的素材命名空间与原始名称配置带原因的 Asset Check Exception，将允许的 error 降为 warning。支持范围、必要输入、无法检查和观察不一致的问题仍阻止操作。

报告保留每次 Event Asset Use、完整 Asset Dependency Chain、原生保存位置、适用条件及例外原因。文件查询可以共享，独立来源不能丢失。Compile／Check 使用一致的当前事件和捕获快照；Push 从已校验的 Generated Project Data 与对应快照重建使用，并在写入边界重新检查实时文件。素材不进入持久编译基线、快照、复制、备份或写入范围。

## User Stories

1. As an Event DSL author, I want Compile and Compile Check to check asset files by default, so that missing resources are found during authoring.
2. As an Event DSL author, I want every current Map Event, Common Event, and Troop Event checked, so that uncalled events are still covered.
3. As an Event DSL author, I want removed definitions excluded from asset roots, so that obsolete snapshot events do not create unrelated findings.
4. As an Event DSL author, I want page images, nested commands, and both movement-route containers covered, so that saved references are not overlooked.
5. As an Event DSL author, I want formal commands and recognized raw commands checked consistently, so that representation does not change the policy.
6. As an Event DSL author, I want native command mirrors counted once, so that diagnostic counts reflect logical uses.
7. As an Event DSL author, I want valid None values and Compiler Defaults handled correctly, so that optional assets do not become false missing-file errors.
8. As an Event DSL author, I want inactive saved names retained and identified, so that I can repair them without losing their saved configuration.
9. As an Event DSL author, I want selected animation, tileset, enemy, map, actor, and System relationships followed, so that indirect file problems are found.
10. As an Event DSL author, I want initial and fallback asset candidates identified with their conditions, so that they are not described as guaranteed runtime loads.
11. As an Event DSL author, I want every Common Event call origin retained, so that shared dependencies remain explainable.
12. As an Event DSL author, I want cycles and dynamic targets to stop with an explanation, so that incomplete knowledge is not mistaken for successful checking.
13. As an Event DSL author, I want unrelated database entries excluded, so that editing an event does not trigger a whole-project asset audit.
14. As an Event DSL author, I want file matching to use the exact category, saved name, and required extension, so that case errors and incorrect formats are visible.
15. As an Event DSL author, I want supported Chinese characters, spaces, prefixes, and literal special characters preserved, so that validation does not rename my assets.
16. As an Event DSL author, I want unsupported names, links, and encrypted modes identified explicitly, so that they are not reported as ordinary missing files.
17. As an Event DSL author, I want missing files distinguished from inaccessible metadata and damaged dependency fields, so that I know what to fix.
18. As an Event DSL author, I want metadata-only existence checks, so that checking does not require decoding or reading every media file.
19. As an Event DSL author, I want ordinary confirmed file problems to block compilation, so that broken references are not silently accepted.
20. As an Event DSL author, I want eligible problems in candidates and explicitly inactive settings to warn, so that their uncertainty remains visible without unnecessary blocking.
21. As an Event DSL author, I want a reasoned exception for one exact asset, so that temporary authoring gaps can remain visible and nonblocking.
22. As an Event DSL author, I want malformed, duplicate, and currently ineffective exceptions reported, so that configuration remains understandable.
23. As an Event DSL author, I want grouped findings with all origins and separate use counts, so that repeated references do not hide affected locations.
24. As an Event DSL author, I want safe independent checks to continue after a failure, so that one damaged dependency does not hide unrelated problems.
25. As an Event DSL author, I want the CLI to expose dependency chains, exception reasons, and incomplete checks, so that I can act on its result.
26. As a Workspace user, I want Compile Check to leave generated and synchronization state unchanged, so that checking remains read-only.
27. As a Workspace user, I want Compile to recheck relevant observations before publication completes, so that changed inputs cannot produce a falsely successful output.
28. As a Workspace user, I want Push to check current assets even when there are no data changes, so that success reflects the current policy.
29. As a Workspace user, I want Push to reconstruct uses from generated events without reevaluating DSL, so that applying output does not produce a different event state.
30. As a Workspace user, I want assets checked again after project-data writes, so that observed post-write failures retain recoverable synchronization state.
31. As a Workspace user, I want restored files to allow another Push when other inputs are current, so that asset repair does not force unnecessary recompilation.
32. As a Workspace user, I want standard-data changes to follow Pull and recompilation rules, so that old event output is not checked against newer dependency names.
33. As a Workspace user, I want irrelevant media-content and directory changes excluded from existence comparisons, so that unrelated edits do not invalidate an operation.
34. As a Workspace user, I want any observed relevant change to require a rerun, so that an operation does not silently switch to another set of facts.
35. As a Workspace user, I want recovery bookkeeping and current asset checks reported separately, so that missing media does not trap completed data writes in recovery.
36. As a Workspace user, I want Clone, Pull, Decompilation, and Diff to retain their established responsibilities, so that missing assets do not prevent takeover or data review.
37. As a Workspace user, I want asset checking to preserve source values, external data, and media files, so that diagnosis does not modify my project unexpectedly.
38. As a maintainer, I want independent expected results and real Windows workflow tests, so that tests can detect errors in the checker itself.
39. As a maintainer, I want required native observations and environment-limited cases tracked explicitly, so that planned or skipped work is not reported as passing.
40. As a maintainer, I want counterexamples traced back to the affected contract and ADR, so that fixes preserve the agreed feature boundary.

## Implementation Decisions

### 1. 现有基础与模块职责

沿用命令家族纵向模块、Validation 横向协调、Workspace 用例及 Project Data 读写的现有职责。领域和 authoring helper 不访问文件系统；现有素材 helper 和原生保存值表达能力不因新增检查而被重写。

当前普通 Compile 与 Check 共用图校验和完整输出构造，素材 primitive inspection 仅能找到 DSL Asset Reference 对象，没有完整 raw、逐次位置或间接关系语义。当前 Push 已有完整性、新鲜度、漂移和恢复检查，但无差异路径会提前返回。现有配置和 Manifest 的编译政策结构是封闭字段集合，新增例外必须同时进入解析、基线和恢复相关的已知格式。

本次按以下职责扩展，不引入插件式扫描框架或另一个项目工作流：

| 归属 | 本次职责与输入输出 |
| --- | --- |
| Validation 的素材使用收集 | 输入明确的当前事件根、已验证原生保存结构及捕获标准数据视图；输出逐次 Event Asset Uses、依赖链、必要输入问题和有界停止记录。不能依赖实时标准 data 或执行事件脚本 |
| Workspace 的素材文件观察 | 输入绑定的 Project Root、去重后的目标和相应模式；输出各目标的文件事实及必要路径观察。每个检查点有独立生命周期，不读取媒体内容 |
| Validation 的素材诊断政策 | 结合使用来源、文件事实、例外和完整性，产生基础／有效级别、问题分组及统计；观察比较产生不可豁免的一致性错误 |
| Workspace 用例 | 捕获输入、调用同一素材检查流程、安排重查、发布／写入保护、恢复衔接，向现有命令输出保留全部诊断 |
| Project Data 读取与输出构造 | 为必要关系提供同一捕获视图中的原生条目；提供当前候选输出／已验证生成输出中的事件状态，保留外部字段及所有权 |
| Workspace Config 与编译基线 | 解析准确例外、验证重复项、记录编译政策，更新 Manifest／pending 中相应的已理解结构和 Compile Contract Version |
| CLI 与使用说明 | 展示分组、来源链、条件、例外、未完成范围和操作结果，说明存在性边界及修复后的工作流 |

Compile 与 Push 共用一个原生保存状态的素材规则实现。Compile 在固定引用和完整输出校验后，以当前 Staged Data Graph 确定根与公共事件身份，并把候选输出的原生保存值交给收集器；这样正式、raw、Compiler Default 和镜像使用同一逻辑。Push 从经过完整性和新鲜度核对的生成事件构造同类输入，不重新加载或求值 Definition Source，不调用反编译器绕一轮，也不信任历史素材报告。生成数据中的空白 Troop Event Reset 不产生素材使用；不能从旧快照补回已移除事件。

必要字段保持按消费关系读取的窄接口。Project Data 可为操作捕获原始对象供只读访问，不能因实现方便把全库素材字段加入通用严格 schema。同步的纯事件结构校验继续可独立工作；文件查询在 Workspace 层异步执行，不把所有 authoring／decompilation 入口改成文件检查入口。

### 2. 起点、直接字段与镜像

所有当前 Map Event、Common Event、Troop Event 都是独立起点，包括未调用的 Common Event。遍历全部页、完整命令列表、嵌套 Child Command Body 和两种 Movement Route 容器，不模拟执行、页条件或分支可达性。只收集下表及已选间接关系，不能搜索任意字符串来猜素材。

| 原生保存位置 | 素材字段（参数从 0 起算） | 类别／folder |
| --- | --- | --- |
| Map Event Page 图像 | image.characterName | image / characters |
| Show Text 101 | 参数 0 | image / faces |
| Change Battle BGM 132 | 参数 0 的 name | audio / bgm |
| Change Victory ME 133、Defeat ME 139 | 参数 0 的 name | audio / me |
| Change Vehicle BGM 140 | 参数 1 的 name | audio / bgm |
| Show Picture 231 | 参数 1 | image / pictures |
| Play BGM 241、BGS 245、ME 249、SE 250 | 参数 0 的 name | 各自 audio / bgm、bgs、me、se |
| Play Movie 261 | 参数 0 | movie / movies |
| Change Battle Back 283 | 参数 0、1 | image / battlebacks1、battlebacks2 |
| Change Parallax 284 | 参数 0 | image / parallaxes |
| Change Actor Images 322 | 参数 1、3、5 | image / characters、faces、sv_actors |
| Change Vehicle Image 323 | 参数 1 | image / characters |
| 路线 Change Image 41 | 参数 0 | image / characters |
| 路线 Play SE 44 | 参数 0 的 name | audio / se |

Autonomous Movement 即使不是 custom，也保留其已保存路线素材；图块页保留的 characterName 同样收集并记录明确非活动条件。Set Movement Route 205 的路线及 505 镜像是同一次逻辑使用，关联两个原生位置；既有镜像一致性检查先行，不能选一份修复另一份。不同真实字段、指令、路线位置仍为独立使用。

合法 None 不查询文件，相关音量、索引等保存值继续保留。可选 DSL 字段先使用现有 Compiler Default，再判断最终名称；捕获数据缺少必需字段不能补成 None。已识别 raw 共用上述规则；未知代码、脚本和插件负载维持既有不解释及 Script Command Gate 契约。

### 3. 有限间接关系

| 事件入口 | 必须继续的关系 | 确定性、条件与停止边界 |
| --- | --- | --- |
| Show Animation 212／Show Battle Animation 337 | Animation 两个图像名称和全部 timings 的 SE | 图像与逐项 SE 各自保留来源；预加载与按帧条件分开 |
| Change Tileset 282 | 所选 Tileset 的全部 tilesetNames | 不按地图实际使用过滤；重复名称的槽仍独立 |
| 固定 Troop 的 Battle Processing | 各 members 的 Enemy → battlerName | hidden 成员也收集；System.optSideView 选择 enemies 或 sv_enemies |
| Enemy Transform | 指定新 Enemy → battlerName | 同样选择前／侧视目录；运行目标可能不存在不抹掉保存关系 |
| Force Action 的固定 Skill | 正 animationId → Animation；全部保存的 Common Event effects → 当前公共事件 | animationId 为 0 仅取消动画路径；effects 仍展开，不以 reservation 覆盖丢弃保存关系 |
| Force Action 的角色默认攻击 | 无当前武器时的 Animation 1 → 图片与 SE | Conditional Asset Candidate；当前武器分支未知停止，不读初始装备替代 |
| Force Action 的敌人默认攻击 | System.sounds 的槽 9 名称 | audio / se；不能伪造动画 ID |
| 固定 Map 的 Transfer Player | Map.tilesetId → 全组图片，加 parallaxName、bgm.name、bgs.name | 保留 autoplay 与运行时配置覆盖条件；不扩展到战斗背景或目标地图的事件网络 |
| 非零合法 Map Event 页图块 | 宿主 Map 初始 Tileset 的槽 5 + floor(tileId / 256) | 只对应 B–E 中一张图，作为初始图块组候选；不扩大为整组 |
| Change Party Member 加入 Actor | 初始 characterName、battlerName | 两者均为候选；保留运行时图像覆盖、侧视和有效战斗队员条件；不加入 faceName 或移除后的重排 |
| Game Over | System.gameoverMe.name | audio / me；不加入硬编码 GameOver 图像 |
| Return to Title | System.title1Name、title2Name、titleBgm.name | titles1、titles2、bgm；不继续展开标题 UI |
| Battle Processing 的系统关系 | System.battleBgm、victoryMe、defeatMe 的 name，以及 sounds 槽 7 的 name | 前三者为默认候选；保留胜败与地图启动 SE 条件；动态敌群只停止敌群路径 |
| Map Event 内 Battle Processing 的背景 | 宿主 Map 的 battleback1Name、battleback2Name | 条件候选，保留 specifyBattleback 和运行时覆盖条件；Common／Troop Event 不推断调用地图；不使用 System 的 Battle Test 背景替代 |
| Common Event 117 | 固定当前 Common Event → 其已选素材关系 | 保留每个调用位置、独立根和完整链 |

只有覆盖契约明确列入的初始／默认关系可以标记 Conditional Asset Candidate。普通固定使用的执行条件不自动变成候选；直接／间接来源也不决定严重性。纯粹同属某个 Actor 或其他条目的字段不构成依赖。

沿有限关系继续到素材字段，不设置任意统一深度。使用当前展开链检测重复条目，记录闭环后停止该路径；共享展开结果可复用，但每个调用来源都必须保留。动态目标／名称没有已选固定候选时，记录已有链、位置及无法继续的原因，不生成 None、缺文件或通过结果。一个动态路径不阻止其他已知关系。

### 4. 来源模型和标准数据视图

每次使用保留类别、folder、未改写名称、事件类型及 Entry Identity、页／命令／嵌套体／路线位置、主原生字段或参数、关联镜像位置。间接使用增加每步标准数据类别、条目 ID、字段及关系依据；候选、明确非活动状态和其他执行条件分别记录。可靠时附 DSL 对象位置和 Definition Source 行列，无法准确取得时保留原生位置，不能捏造源码位置。

文件查询键为准确的类别、folder、原始名称及当前绑定项目／模式；逻辑使用身份以根、调用链和保存字段区分，不能使用对象身份或文件名全局去重。重复检查点也不能增加逻辑使用次数。损坏的关系形成带来源的问题，合法空字段形成无素材分支，动态／循环形成停止记录，均与文件事实分开。

Compile／Check 的事件和公共事件来自本次 Staged Data Graph；外部 Animation、Tileset、Actor、Enemy、Troop、Skill、Map 及必要 System 设置来自同一捕获 Snapshot。Push 使用当前完整生成事件和对应捕获 Snapshot；须捕获必要的完整标准数据视图，不能只读取发生差异的几个文件。当前事件移除、公共事件替换和生成状态必须得到相同解释。

实时标准 data 不参与补读依赖。未 Pull 的动画素材改名时 Compile 仍按快照旧名称检查，Push 由 Project Drift 拒绝；Pull 后旧输出失效，重新 Compile 使用新字段。所有必要外部字段只读，不改变 DSL-Owned Project Data，不扫描无关字段或条目。

### 5. 文件定位与事实分类

使用已绑定的普通编辑 Project Root。图片类别位于原生 img 目录并追加 `.png`，audio 的 bgm／bgs／me／se 追加 `.ogg`，movies 追加 `.webm`。直接、raw、间接和候选使用同一映射。原名直接加扩展名：带 `.png` 的原名需要再次追加 `.png`；其他格式、加密后缀不能替代。准确目标存在时，旁边的其他格式或大小写变体不造成歧义。

Project Root 以下的每一级类别目录、文件名和扩展名都要求准确大小写。不 trim、折叠大小写、Unicode 规范化、URL 解码或去除后缀。仅大小写不同项只能解释名称不符，不被选为替代，也不触发跨目录搜索。根自身沿用既有 realpath／别名／绑定语义；大小写检查不得直接使用已小写化的绑定字符串代替真实目录项名称。

只接受类别内单层原始名称。斜线、反斜线、绝对路径、穿越形式、普通 Windows 禁止字符／控制字符及保留设备名属于不支持形式；按追加扩展名后的完整文件名判定设备名等规则。普通中文、空格、点号、`$`／`!` 前缀原样保留，非空纯空白不是 None；stem 末尾的空格或点不能直接当成最终文件名尾字符而误拒绝。图片和音频允许字面量 `%`／`#`，包括看似编码的字串；影片名称含这两者属于首版不支持形式。此检查不授权规范化或修复已保存名称。

从已解析真实根逐级检查必要目录项及最终文件的元数据，避免跟随根以下链接。任一级 symlink／junction 均不支持，包括目标在根内、根外或不存在的情形；不能为了给出建议而读取目标。根别名继续支持，普通硬链接按普通文件处理。准确普通文件的元数据足以确认存在，不强制 open／close，不读内容；0 字节和内容不可读但元数据可查的文件可以通过。

仅有图片／音频待查使用时解释其对应 System 加密标志：缺失或 false 为普通模式，true 为该媒体类别不支持的加密模式，存在但不是 boolean 为必要字段错误。影片不受两个标志影响。普通模式只有加密文件时仍缺少所需普通文件；true 模式不能因为旁边有普通文件而通过。不能自动转到部署树或其他资源根。

必须区分：存在；缺类别目录；缺文件；准确名称不符；必要路径／文件类型不符；不支持名称／链接／加密模式；无法枚举或查询元数据；观察矛盾；必要字段错误；固定引用或关系解析失败；合法 None；动态／循环停止。访问错误不能推断为缺失，枚举到项后项消失不能静默改为稳定缺失。只有支持的名称才能形成待查询目标；非法路径不得先解析再报告。

### 6. 例外配置和编译政策

在现有 Workspace Config 增加可选的 `assetCheckExceptions` 数组，省略等价于空数组；新建 Workspace 写入空数组。每项只有 `category`、`folder`、`name`、`reason` 四个字段，复用现有素材 category／folder 的合法组合：image 配图片 folder，audio 配四类音频 folder，movie 配 movies。这里的类别与 folder 共同表达素材命名空间，不建立可任意指定路径的配置。

name 必须为非空字符串，按原始值准确匹配；不因其看起来有后缀、空白或编码而改写。reason 必须为字符串且含非空白内容，展示时保留用户原因。同 category／folder／name 重复、非法组合、缺字段或多余字段为配置错误，不能最后一项覆盖前项。名称仍需经过独立的文件支持规则；即使例外能准确匹配不支持名称，也不能豁免该问题。合法但当前未被选用的素材命名空间不会因此扩大扫描范围。

例外适用于该目标的所有独立使用，只将已确认缺失、名称不符、类型不符三类问题的 error 降为 warning。查询事实、基础级别、有效级别、原因和每次来源都保留，既有 warning 不被抹掉。完整相关检查结束后，未使任何 error 降级的例外产生定位到配置项的 warning；检查未完成且作用无法确定时不作此结论。没有全局关闭、全部 warning、通配符、事件级或位置级例外。

配置解析、基线配置选择、摘要／哈希、Manifest 和已理解 pending 的编译依据结构都要包含例外，不能只加入配置读取。当前配置省略与空数组使用同一默认语义；操作内仍保留既有配置字节改变的检测。必要的旧字段缺省只用于读取已理解的历史格式，不可把旧输出升级为新契约。验证历史恢复证据和 hash 时保留其原结构与计算规则，不能先填入新默认再重算旧依据。实现集成时更新唯一的 Compile Contract Version，旧输出须重新 Compile；恢复继续保留原有版本和依据。素材观察不写入这些持久结构。

### 7. 严重性、报告与现有接口

| 事实 | 普通明确使用 | 候选／明确非活动保存配置 | 例外 |
| --- | --- | --- | --- |
| 已确认缺目录／缺文件、名称不符、类型不符 | error | warning | 仅适用 error → warning |
| 不支持名称、根以下链接或加密模式 | error | error | 不允许 |
| 必要字段／引用问题、无法查询、观察矛盾／操作内相关变化 | error | error | 不允许 |
| 合法 None | 无查询／无缺失诊断 | 同左 | 无需 |
| 动态／循环停止 | 信息记录，明确停止范围 | 同左 | 不适用 |
| 准确普通文件 | 存在性通过 | 保留条件的存在性通过 | 无需 |

明确非活动必须来自可判定的保存开关／模式，不能通过页条件或分支推演得出。既有结构、值域、Project Data Reference、Script Command Gate 诊断保持自身类型与严重性；素材例外不能绕过它们。支持边界和检查可信度优先于候选／非活动条件。

报告的稳定问题标识采用下列 `MV-ASSET-` 系列；标识不随展示文案变化。同一个问题还可用原因字段细分必要位置和原始 I/O 原因，不能用文案替代稳定语义。固定引用错误复用原问题类型，不重复伪装成素材缺失。阶段包含 compile／push 及失败检查点；Check 属于 compile 阶段并标明检查模式。

| 问题标识 | 语义 |
| --- | --- |
| MV-ASSET-MISSING-DIRECTORY | 已确认缺少必要目录 |
| MV-ASSET-MISSING-FILE | 可检查目录中缺少所需文件 |
| MV-ASSET-NAME-MISMATCH | 无准确项，存在仅大小写不同项 |
| MV-ASSET-PATH-TYPE | 必要路径组成或最终目标类型不符合 |
| MV-ASSET-UNSUPPORTED-NAME | 原始名称形式超出文件定位支持范围 |
| MV-ASSET-UNSUPPORTED-LINK | 根以下出现不支持的 symlink／junction |
| MV-ASSET-UNSUPPORTED-ENCRYPTION | 相应类别加密标志为 true |
| MV-ASSET-QUERY-FAILED | 必要枚举或元数据查询无法完成 |
| MV-ASSET-OBSERVATION-CHANGED | 查询内矛盾或操作检查点间相关观察改变 |
| MV-ASSET-INVALID-DATA | 已选关系必需字段无法解释，且未由既有引用／结构错误覆盖 |
| MV-ASSET-INVALID-EXCEPTION | 例外配置项非法或重复 |
| MV-ASSET-INEFFECTIVE-EXCEPTION | 完整相关检查中该例外没有实际降级 |
| MV-ASSET-DYNAMIC-STOP | 已选动态关系无法静态继续 |
| MV-ASSET-CYCLE-STOP | 当前依赖链闭环处停止展开 |

每项保留问题原因、基础／有效级别、原名、类别、Project Root、类别目录、追加扩展名、合法目标及实际失败位置，关联完整来源和链。公共目录／字段失败按共同依据关联全部已知使用；无合法目标时不伪造文件路径。已有近似项可展示但不选择替代。停止记录明确没有继续展开，不能计为通过文件。

默认按合法目标及问题类别分组，组级别取成员最高有效级别，各使用自己的结果仍可获取。分别统计问题组数、不同问题文件数和受影响使用次数；同文件多组只计一个文件，无合法文件目标的错误组不计入已确认缺失文件。稳定顺序采用目标／问题分类和事件身份／保存位置／调用链，不能依赖异步文件请求完成顺序。

发现 error 后继续其他安全独立检查，保留已有 warning。必要路径损坏只截断其受影响路径；更早错误让检查输入不可信时明确未运行或未完成，不分析残缺输入来凑齐结果。检查完整性与“有无 error”分开；允许的动态停止可不阻断操作，但仍作为未展开覆盖记录。

保留现有 `compileWorkspace`、`pushWorkspace` 等 Workspace API 的参数与成功返回方式及现有 CLI 命令。内部素材报告承载上述结构，复用现有命令输出与失败通道；不要为测试新增公共报告 API、JSON CLI 或测试开关。CLI 必须让用户获取问题、位置、关键链、条件、例外原因和不完整说明，任何有效 error 使操作失败；仅 warning／信息不因素材政策失败。不要通过把全部内容压成第一条异常而丢失其余来源。

### 8. Compile、Check 与其他读操作

Compile／Check 在当前事件和完整候选输出通过必要校验后建立素材观察，并保留一致的标准输入及政策。Check 在成功返回前取得新观察并核对编译依据；普通 Compile 在发布生成数据前、提交其 Sync Manifest 前各重查素材及编译依据。重复点使用相同事件使用集合，不重新解释另一版本的标准数据或政策。

Check 不发布 Generated Project Data，不更新 Manifest 或 Generated Freshness；initial／fresh／stale 以及检查成功／失败均遵循该边界。普通 Compile 在本地发布前发现错误不发布本次输出；发布已开始后的失败沿用现有无效状态语义，Diff／Push 必须拒绝无效输出，成功 Compile 才恢复。两者均不写 Project Root。

Diff 保留既有生成完整性、新鲜度及数据比较，不扫描实时素材。Clone、Pull、DSL Decompilation 不增加素材文件门槛或查询，保留既有固定引用与表达检查；缺素材项目仍可取得 DSL 后执行 Check。素材配置的结构合法性继续属于 Workspace 配置要求，不能把“不查文件”解释为容许坏配置。

### 9. Push、完整输入保护与恢复

Push 先按现有原绑定和内容证据处理 pending，再验证生成完整性、Generated Freshness 和完整标准 data 的 Project Drift。由捕获的生成事件及对应快照重建使用，不重新求值 DSL，不依赖历史报告。

有待写数据时，第一次 Project Root 文件替换前完成素材检查；若暂存阶段已经建立观察，写前取得新观察比较。全部替换结束、刷新 Snapshot 和 Manifest 前再检查。无 Affected Project Data Files 时，在既有前置通过后、成功返回前同样检查，不能走现有的提前成功返回；单纯素材失败不创建 pending。

写入边界还要确认捕获的源文件和验证依赖、相关配置、Snapshot、Generated Project Data、Project Root Binding 均与操作依据一致。继续全标准 data 漂移检查及每个受影响文件替换时的旧内容检查；末端实时 data 的预期是已写文件的生成内容加其他文件的原快照内容。不能误把工具自己的合法写入当成外部漂移，也不能半途改例外、重新编译或切换目标。

写前失败不开始 data 替换；写后素材 error 或观察变化导致当前 Push 失败并保留 Interrupted Push，不回滚、不声称项目尚未写入。当前 Push 的末端素材检查必须在正常同步记账前执行，不能因已有恢复函数会完成记账而跳过。

恢复只证明已经发生的 data 状态：全部受影响文件等于 pending 生成内容时，可完成记账，即使此时仍缺素材；全部等于旧快照时可放弃并继续正常 Push；混合、缺失、未知或证据不一致仍拒绝自动恢复。记录完成后保留原编译依据，再按当前 freshness、drift 和素材条件决定本次 Push；若只因当前素材失败，不为已经记账的 data 重新保留 pending。报告明确区分恢复结果与本次检查失败。

同一真实 Workspace 继续互斥，竞争立即失败；非 Push 命令遇 pending 停止，清理死锁不清 pending。项目重绑仍需显式 Pull，有 pending 时先按原目标处理。素材不进入任何恢复备份或写入。

### 10. 观察比较与有效性

一个检查点内可共享同目标及必要目录查询；下一检查点和下一命令必须重新获取文件观察。依赖展开可复用，文件成功记录不可跨点或跨命令代替查询。不得用整棵媒体树扫描、目录总哈希或媒体内容哈希实现一致性。

比较准确名称和目标匹配、必要路径组成的类型／链接状态、元数据可查询性，以及失败的类别和位置。存在变缺失、匹配变化、普通项变链接／错误类型、变成不可查询、缺目录变为目录存在但缺文件，都是相关变化。只要操作内观察到相关变化就失败并要求重跑，改善也一样；两个状态都原本允许 warning 也不能豁免一致性错误。不能静默重试一部分并接受新结果。

同名普通文件的内容、大小、时间、文件身份变化以及目录无关项变化，不单独使存在性观察失效。检查点间短暂改变后恢复且未被观察到、或末次检查后的变化不保证发现；没有连续监控、跨进程原子隔离或整个项目的同时快照承诺。

实时素材条件不进入 Compile Baseline。编译后删图可以保持 Generated Freshness 而使当前 Push 失败；补回且其余依据当前、无未处理 pending，可直接重试 Push。改变例外、Pull、目标绑定或编译契约仍需要重新 Compile；Check 成功、恢复或单独重查素材都不能升级旧生成状态。

### 11. 实施顺序与兼容性

1. 建立独立用例预期和合成 fixture，补齐已有成功场景所需素材与必要标准字段；准备并尽早执行可能推翻文件定位或关系假设的原生核对。
2. 实现共用的有限关系收集、保存位置和链、文件事实、观察比较、诊断及例外政策，分别对照独立预期验证。
3. 接入配置、完整编译政策基线和 Compile／Check，验证三种已有生成状态、发布边界及 raw 一致性。
4. 接入 Push 当前根重建、无差异分支、写前／写后与恢复，补齐输入和绑定重查；验证内容变化与存在性变化的区别。
5. 集成更新 Compile Contract Version、公共使用说明、样例与构建后 CLI 用例列表，执行完整检查和原生必验，形成验收回执供维护者确认。

内部阶段可以分步提交，但首版交付必须满足整套契约。不能通过全局跳过、批量例外、删掉旧断言或伪造外部字段来维持旧测试通过。既有未使用素材检查前的成功 fixture 要增加真正需要的文件及字段，未知字段保留与保存值往返断言继续有效。此规格规定顺序，不另行创建实施票或改动已关闭的决策结果。

## Testing Decisions

### 1. 已确认的测试入口

沿用验收票已确认的边界：主要从现有 Workspace API 和实际 CLI 操作临时项目，联合观察诊断、退出结果、Project Root、Generated Project Data、Snapshot、Manifest、pending 及素材树。无需再选择新的产品测试入口。Windows sandbox 已支持中文与空格根及源码／构建后 CLI；操作子进程工具已能通过 IPC 在真实文件系统边界暂停并制造确定变化，复用其模式扩展素材元数据／枚举边界。

故障注入留在测试子进程的操作系统接口适配层，不给产品添加测试参数、定时 sleep 或公共 orchestration API。真实文件树验证匹配、类型和链接；可控注入稳定验证不可枚举、元数据错误与查询内矛盾。注入不冒充真实 ACL 证据。

收集、事实分类和诊断是内部纯语义边界，可用独立手写数据补充精确来源、组合和分组断言；不得把只调用内部函数当成 Workspace／CLI 验收。少量无法同时在磁盘发生的分组组合可以直接构造内部诊断输入，不新增用户 API。

### 2. fixture、预期和子用例身份

以自写最小标准项目为基础，固定互不混淆的事件／数据库 ID，并为不同字段提供不同素材名；只在重复来源测试中故意共享名称。基础项目包含当前 Map／Common／Troop 定义、所需 System 字段及按用例添加的 Animation／Tileset／Actor／Enemy／Troop／Skill／Map。每个失败变体尽量只改变一个字段或文件，防止较早引用错误遮住文件政策。

允许存在性用例用空文件，并专门断言其通过；原生核对使用有效自制媒体。正常预期包含完整使用集合、每条链及条件，失败预期增加准确事实、级别、例外及操作后状态。预期不能调用被测收集器、匹配器或政策计算器；正式和 raw 各自对照预期，不能只比较两者相等。

[实施验收用例索引](implementation-acceptance-cases.md)为 A／B／C／F／D／W／N 全部 97 个用例族规定子用例维度与唯一标识展开。每个展开实例都必须有契约出处、最小输入、原生位置／字段、操作与变化时机、独立预期、验证方式、责任和状态；共享 fixture 与参数化执行不减少分支责任。原验收矩阵中的预期是规范性输入，索引不能放宽它。

### 3. 必须覆盖的行为

- A01–A18：每个直接字段、路线两个容器，正式／已识别 raw 的准确存在与逐字段缺失；None 和明确非活动变体通过 C／D 组补充。
- B01–B16：每条有限间接关系、多个素材字段、timings／成员／槽／effect 来源、前侧视、候选、默认分支及公共事件关系；每个到达字段均有存在和单独缺失预期。
- C01–C13：当前独立根、已移除事件、镜像与独立使用、复用／循环／动态停止、合法空值与坏字段、非活动状态、无关条目和未选操作的范围反例、外部数据及素材只读。
- F01–F14：固定扩展名、准确各级名称、字面量和设备名边界、缺目录／缺文件／错误类型、根别名和根以下链接、硬链接／空文件、I/O 故障、观察矛盾、相关加密标志及无关类别不校验。
- D01–D10：全部政策分支、允许／禁止降级、配置错误、无实际降级和不完整时抑制、组与使用统计、共同失败来源、独立检查继续、完整定位和真实 CLI。
- W01–W20：Check 三态和只读；Compile 发布前后；Push 写前、写后、无差异、恢复；补图重试；未 Pull 标准字段变化；相关改善也失败；无关变化不失效；输入／绑定保护和不查询素材的操作。
- N01–N06：Windows / MV 1.6.1 的代表性媒体定位、支持的特殊字符、动画双图与 SE、整组图块与页图块单图、敌人前侧视目录、运行时覆盖初始候选。

不要求全部维度的笛卡尔积；准确覆盖每个已选字段和关系，并专门组合共享来源、不同级别、镜像、循环、失败后继续和写后变化。使用同文件内容替换验证“存在性事实不变”，不要把媒体 hash 作为产品的成功条件。

### 4. 工作流测试细节与先例

Compile 发布测试已有 initial／fresh／stale 的 Check 只读、输入改变及发布失败先例；Push 漂移和恢复测试已有无差异、真实写入、进程中断、pending 内容判断及原编译依据保护先例。新用例增加素材观察与这些状态的联合断言，不把旧测试的存在视为已覆盖新功能。

在已声明的检查点暂停真实子进程，完成受控文件／输入变化后才释放，断言整个操作结果和允许的状态变化。不靠时间延迟碰巧命中阶段，也不锁死内部 syscall 次数。后续检查点必须能观察新文件状态，同时逻辑使用次数保持稳定。

W20 用测试 Definition Source 的模块求值哨兵观测：一次 Compile 记录求值，随后清除哨兵而不改任何编译输入，再运行 Push；Push 可以读取和核对源字节及类型依赖，但不得再次触发模块求值。另用包含公共事件链的生成数据独立断言根、来源和依赖，不只检测“没有执行”。哨兵只用于自写测试 source，不执行游戏事件脚本。

CLI 测试核对稳定标识、关键定位／链／原因、完整性和退出结果，不快照锁定颜色、空格或整个段落。构建后 Windows CLI 测试采用显式文件清单，新素材场景必须加入；同时验证源码入口与构建入口。能力不足的真实链接／大小写并存用例记录未执行与原因，交合适环境补验，不能以 skip 计为通过。

### 5. 原生运行与证据责任

实施方准备并尽可能执行 N01–N06，确需人工的部分由维护者操作留证。记录 MV、宿主、输入、实际请求和磁盘定位，区分预加载、执行、地图绘制附带请求及条件候选。播放成功只是该样例证据，播放失败也不能未经分析就归为存在性规则错误。

原生静态源码为字段关系依据，部署筛选函数的 12 次重放只说明其筛选逻辑；已有 Node v24 微测不构成本功能性能要求或 Node.js 22 验收。每项均区分计划、未执行、环境受限、通过、失败及证据出处。原生必验可以作为待执行项进入实施阶段，产品验收时仍缺失或证据冲突未解决则不能完成。

### 6. 完成门槛与反例

Windows / Node.js 22 下完成仓库检查、构建、含素材场景的构建后 CLI 验证，当前命令为 `pnpm check`、`pnpm build`、`pnpm --filter rpgmaker-event-dsl test:windows-baseline`。同时提供全部自动化覆盖和 N01–N06 的实际证据，没有未解决的契约反例、必验未执行项或证据矛盾，由维护者审阅确认。若脚本重组，仍保留相同验证责任。符合政策的 warning、有效例外与信息停止无需清零。

实现违约时修实现并补独立回归。支持范围内新首方／运行证据推翻既有定位或消费关系时，保留最小复现并重开相应决定／ADR，追踪诊断、工作流与验收影响。原生支持更宽或已排除关系只进入范围扩展提议。不能靠修改预期、放宽断言或添加例外消除反例。

## Out of Scope

- 图片尺寸、脸图／行走图索引布局、媒体内容读取、解码、播放或运行时必然加载保证。
- 全库／全项目素材体检、未使用素材查找或删除、素材复制、备份、管理、自动修复或重命名。
- 插件显式素材声明、typed 参数、struct／数组及备注规则；Script、Plugin Command 或未知 raw 的动态素材推断。
- 未选的运行时连带关系：Actor HP 倒下音效、敌人 AI 技能、初始装备、队伍重排、传送网络、当前交通工具或历史步行 BGM 推断、引擎硬编码或地形派生素材、Battle Test 默认背景。
- 部署／加密模式、子路径素材、根以下 symlink／junction 跟随、其他平台、RPG Maker MZ 或其他 MV 版本承诺。
- 全局关闭／全部 warning／通配符例外、逐事件例外、独立扫描命令、额外 JSON CLI 或通用报告框架。
- 素材快照、持久文件成功凭证、内容 hash、持续监控、跨 Workspace 锁、跨进程原子隔离和项目全局回滚。
- 本次文档任务中的产品代码实现、实施票拆分、Git 发布或实际产品验收。

## Further Notes

规范来源如下；票内历史 Comments 的阶段状态不覆盖当前已确认 Answer。当前地图及六票均已 resolved，相关 ADR 均已 accepted。

| 来源 | 本规格采用的内容 |
| --- | --- |
| [MV 原生素材名称如何定位到项目文件](issues/01-native-asset-file-resolution.md#answer) | 首方定位事实和研究边界 |
| [事件直接与间接素材依赖的检查边界如何统一](issues/02-direct-asset-reference-coverage.md#answer) | 起点、字段／关系、条件、来源、停止点 |
| [素材文件存在性应如何判定](issues/03-asset-file-existence-contract.md#answer) | 普通编辑项目、准确文件、名称、链接、加密和事实分类 |
| [素材检查结果如何诊断并影响编译](issues/04-asset-diagnostics-and-policy.md#answer) | 严重性、例外、分组及完整性 |
| [素材检查如何接入 Compile 与 Push 并保持结果有效](issues/05-workspace-asset-check-lifecycle.md#answer) | 捕获视图、重查、输入保护、Freshness 与恢复 |
| [如何验收素材存在性检查并交接实施规格](issues/06-asset-validation-acceptance.md#answer) | 已确认测试边界、责任、验收矩阵及完成门槛 |
| [ADR 0016](../../docs/adr/0016-event-rooted-asset-use-coverage.md)、[0017](../../docs/adr/0017-exact-asset-file-existence-in-editing-projects.md)、[0018](../../docs/adr/0018-asset-check-diagnostics-and-explicit-exceptions.md)、[0019](../../docs/adr/0019-asset-checks-at-workflow-boundaries.md) | 本功能已接受取舍 |
| [ADR 0008](../../docs/adr/0008-command-family-module-architecture.md)、[0011](../../docs/adr/0011-native-command-state-and-validation.md)、[0012](../../docs/adr/0012-event-saved-state-roundtrip-boundary.md)、[0013](../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md)、[0006](../../docs/adr/0006-interrupted-push-recovery.md) | 模块归属、保存值、所有权、编译依据和同步恢复约束 |

代码现状核对基于当前 Workspace Config／Manifest schema、Compile 输出构造与发布、Push／恢复、素材 primitive inspection、Windows sandbox 及进程暂停工具。本轮只读核对这些实现并发布规格，没有将它们写成素材功能已存在的证据。

例外配置的具体字段、共用原生收集入口、内部报告与测试子用例身份是本规格对已决政策的实施细化。测试入口已由验收票逐轮及整体确认；本次沿用其选择，无需重新访谈。实现遇到真正改变已决语义的发现，按上面的反例规则处理。
