# 17 整体验收：技术证据与待审状态

当前为**进行中的技术验收**。票17保持 `claimed`，未取得或代填维护者最终确认。首次完整命令尝试冻结在 `11e52e3cbc93fe5200cb51d0c2882a9cec222765`（集成基点 `29f19dfd3ed943df2e0c9ae2b7c446ada248d501`，Compile Contract39）；该次检查因产品缺口取消，不能作为全量通过。修复集成后必须建立新冻结，重新按原配置完成全部命令。

## 命令与失败历史

Windows10 `10.0.19045` x64、Node `v22.23.4`、pnpm `10.33.0`；默认 `C:\Users\Shuen\AppData\Local\Temp`，仓库 `maxWorkers:2`，无全局 CLI entry 覆盖。先做 setup build，再顺序执行 `pnpm check`、`pnpm build`、`pnpm --filter rpgmaker-event-dsl test:windows-baseline`。[命令记录器](17-run-history/run-final-validation.mjs)已经提交在上述执行冻结，产品／测试未在运行中改动。

首次真实运行完整保存在 [取消处置](17-raw/history/11e52e3c-contract39-canceled/disposition.json)、[原命令记录](17-raw/history/11e52e3c-contract39-canceled/command-history.json)和[原始输出](17-raw/history/11e52e3c-contract39-canceled/01-pnpm-check.log)：

- setup `pnpm build` exit0；`pnpm check` 的 typecheck、lint、format检查已通过。
- source测试取消前落盘631条真实完成回执：630 passed、1 failed；没有全量测试总结。
- 真实失败 `AV.C07.shared-system-field.formal.case.expected` 在取消前发生：两个 `gameOver()` 独立使用共享损坏 `System.gameoverMe` 字段，应保留两个诊断来源，实际只得到一处。原断言及失败回执均保留，已退责任09诊断。
- 根协调端另确认设备名后、点号前ASCII空格的Windows保留设备名识别缺口，退责任03修复；属于原文件支持契约实现缺口，不重开政策。
- 只终止已验证属于本记录器的 `pnpm check` 进程树；记录器收到非零退出后落盘原始日志和631条回执。复查无本次残留测试进程，正式第二条build与Windows baseline均未启动。

## 有限义务与原始证据

[独立重展开计划](17-raw/final-canonical-id-plan.json)仅从现行规格、验收矩阵、有限子用例索引和已确认责任表展开，不导入产品或测试。首次执行冻结仍有97族、1209项义务，其中1195自动化、14原生；与外部独立旧计划的义务、责任和方法形状完全一致。独立计划的准备性旧正文不构成本票最终结论。

| 分组 | 族数 | 有限义务 | 核对重点 |
| --- | ---: | ---: | --- |
| A01–A18 | 18 | 86 | 每个直接字段的准确原名、formal/raw、两种路线容器与present/missing配对 |
| B01–B16 | 16 | 244 | 双动画图、独立timing SE、九Tileset槽、hidden成员、模式目录、固定Map、System及Skill关系 |
| C01–C13 | 13 | 449 | 完整当前根、移除／重置、镜像一次、独立保存位置、有限直接调用、None、坏字段与排除边界 |
| F01–F14 | 14 | 201 | 准确逐级名称、普通文件元数据、替代格式、Unicode、保留设备名、链接／模式／查询错误边界 |
| D01–D10 | 10 | 99 | 事实与级别分开、例外准确键、不豁免支持边界／查询错误、全部来源／稳定分组与CLI退出 |
| W01–W20 | 20 | 116 | 单次门槛、新命令取新事实、只读Check、发布／写入输入保护、无写入Push、内容恢复 |
| N01–N06 | 6 | 14 | 原生实际加载／消费、有限样例、反例与失败探针原样保留 |

[原始证据审计](17-original-evidence-audit.json)重读真实Git blob及原JSON pointer，核对2484条原聚合自动化记录、15的26条原回执、16的24条原回执、28组原断言源码哈希绑定，以及16的100份原始工件与16项原冻结输入。每项当前义务都找到所需入口与全部主责任贡献；F07的编码拼写通过一一对应映射保留既有canonical ID，不利用别名双计。该工件的当前完整执行字段仍待后续最终命令，不能从原历史passed推断当前版本passed。

[原断言保留审计](17-original-assertion-preservation.json)比较2400个当前义务原回执位置，归并为169个原／现callback版本对。15对callback文本有扩展，其原expect表达式均保留；两处静态token差异为格式尾逗号，人工核对原义不变。静态保留只证明断言文本及注册位置，fixture参数、辅助函数与真实行为仍由语义审阅和最终运行共同证明。

原03六条 `not-executed-policy-pending` 原字节哈希 `a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071` 保留；退出义务的旧图片filesystem ID不改写为通过。D09三条旧formal ID迁移到native后不构成别名双计。B14的两个host-target-missing为不适用；宿主载体不是另选固定目标。W12由13唯一注册，14的记录仅引用；W19保留14／15共同责任，原断言及独立成功／失败callback不重复注册。15、16的原失败、过滤、准备错误及重跑经过均保留，不能改写成一次全过。

## 当前实现与测试语义核对

Compile／Check在完整候选验证后调用同一个素材门槛：当前事件来自Staged Data Graph，外部关系与必要System字段来自对应捕获Snapshot，文件元数据来自绑定的实时Project Root。Push由验证过的完整Generated Project Data与对应捕获Snapshot重建相同使用和直接调用；不重新求值DSL。Common Event定义为独立根，调用关系单独保留，循环与共享图不复制素材使用；强制Skill的effects也只增加直接关系。

直接字段、双动画图和timing SE、九Tileset槽、页图块B–E单槽、前／侧视Enemy、Actor初始候选、固定传送Map及System字段均以独立文字预期核对完整使用集合、原生保存位置、事件内链、执行条件和必要的候选／非活动原因。formal/raw指向各自真实合法原生字段；205／505镜像只计一次，第二真实命令及重复成员／槽保留独立位置。None保留独立控制值并省略查询；已知兄弟关系不会因为另一路动态停止而消失。C07共享System字段的来源丢失已由真实失败揭示，修复前本节不构成无缺口结论。

文件观察器从根realpath逐层枚举准确名称并lstat；不读媒体内容或跟随根以下链接。只有合法名称形成目标；图片与影片任一`%`／`#`在查询前拒绝，音频按原名查询。普通文件、缺失、大小写不符、类型不符、支持范围、查询错误和查询内矛盾分开。设备名空格变体缺口已退03，修复后须复核不可例外豁免的事实分类。

例外模式严格只有四字段，准确category／folder／原名匹配；同键重复失败，仅确认缺失／名称／类型三类error可降级。基础级别、有效级别、理由和全部来源均保留；查询失败、必要字段问题、结构／引用／Script Gate不能豁免。配置默认空数组参与当前Compile Baseline、摘要和新鲜度；历史Manifest与pending的省略字段保持原结构重算原hash，不填默认后假造旧依据。

Check在成功、警告和失败时保留原始／fresh／stale输出权威及持久载体。Compile只在素材门槛后发布，发布与Manifest仍保护源、验证依赖、配置、Snapshot及绑定；素材完成后变化不会触发第二扫描。Push在staging后、创建新pending和第一次替换前只查一次；无差异Push同样检查。源／依赖／配置／Snapshot／生成数据／绑定及全标准data的写前写后保护保留，写后输入冲突保留pending；素材变化本身不触发写后扫描或阻碍正常记账。

恢复只认原绑定与原内容证据：all-generated可完成、all-snapshot可放弃，mixed／missing／unknown／矛盾拒绝。原编译依据保留；已完成data即使缺素材仍能记账并退pending，新Push再过当前freshness／drift／素材门槛。真实受控子进程、公共Workspace API和实际CLI覆盖这些工作流，原生内部纯结构断言只作补充。所有canonical测试来源均被Windows配置显式包含，基础配置保留两个worker。

## 原生证据复核

[原生证据审计](17-native-evidence-audit.json)重读现有原生结果，17没有另启MV或NW.js运行。N01／N02原15个样例仍为13成功、2反例，原raw exit1保留；维护者已确认统一排除图片`%`／`#`后，七个当前媒体义务由原实际观测支持，不能把两条历史图片反例写成成功。

N03、N04、N05／N06的九次签收运行共有705条原生事件、90项通过独立断言。原生环境为MV1.6.1、NW.js0.29.0 x86、Chromium65、内置Node9.7.1，与外围Node22明确分开。源码／运行副本、输入与自制有效PNG／OGG的哈希保留；包装器原样委托，实际Scene、Interpreter、Bitmap、Canvas或WebAudio运行。

- N03保留未执行动画分支的预加载对照；选定双图各16次Canvas消费，两条timing SE在不同保存帧经真实XHR、解码及source start，不能把预加载当播放。
- N04整组Change Tileset消费九槽；页图块在四次真实运行分别选择B／C／D／E的一张，独立于地图渲染器加载整组。四次运行归入一个页图块canonical ID。
- N05同名文件在两个模式目录都存在，前／侧视各选择准确目录并实际绘制，另一目录没有被用作回退。
- N06真实322后129 initialize:false消费运行时替换图，保存初始值仍不变；因此静态初始character／battler仍是两个条件候选，不模拟前序运行或移除候选。

这些证据证明有限有效样例的原生关系和定位；不证明任意媒体内容、插件、全部布局或完整游戏均可运行。早期探针失败、未完成场景与原图像反例都保留，不影响其历史真实性，也不能充作当前passed。

## 说明核对与剩余门槛

README的例外JSON示例准确提供四个字段和理由，正文解释准确PNG／OGG／WebM、存在性不保证内容／尺寸、修复后再Check／Compile／Push、同一命令单次门槛及恢复后当前门槛。已发现并交回原责任的陈旧说明为package README208–209的Face文件未查，以及authoring skill event-patterns50–51与292–293的文件扫描旧排除；修复合入后须在最终冻结复核。

尚需：03／09产品修复和说明回补集成；新冻结的三条原样完整命令及所有1195项源码／构建实际回执；逐项最终输入／断言／责任绑定；最终Standards与Spec双轴独立评审；维护者实际审阅确认。最后一项由维护者完成前，本票不能设为resolved。
