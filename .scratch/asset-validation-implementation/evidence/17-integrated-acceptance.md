# 17 整体验收：技术证据与待审状态

当前为**进行中的组合技术验收，待D05局部补证与首次构建后覆盖**。票17保持 `claimed`，未取得或代填维护者最终确认。03／04／06／09／16与17-support补修已集成；最近完整执行冻结为 `af748ee5067f41096a296a79f81b078415096606`，集成基点 `0b5195c4095e9b21b8e345541c4ae7859bc2d66a`，Compile Contract `mv-1.6.1/40`。该次完整check自然exit1、唯一D05 timeout；c5完整check六失败与首次Contract39取消历史分别保留，均不能写成最终整仓通过。用户随后明确“完整跑一次耗时太长了，尽量减少全量运行”，因此后续沿用经身份核验的实际通过集合，仅补失败项／直接受影响项和仍未执行的built责任，不再从头重复源码全量。

17-support已集成至`0b5195c4095e9b21b8e345541c4ae7859bc2d66a`，并在af新干净冻结实际完整重验。[独立修复审计](17-regression-repair-audit.json)核对六个完整文件：只归一明确允许的局部deadline参数／传递和final-review三处CURRENT字符串后，完整AST与c5原文件一致，保留122个callback、295个literal arrays、936个字符串输入／diagnostic。Picture007及全部15种Input003预算10→30秒；三批Audio002及Movement003预算30→60秒；Screen002预算30→90秒。全局10000ms、2workers及正常Windows include保持原样。这些是完整流程的局部预算，不是产品性能修复、业务断言放宽或对旧timeout原因的证明；静态重审与输入准备安排在完整命令前后，同样不能作为旧失败的因果解释。

legacy final-review单独登记CURRENT38→40：严格版本expect、标题、sandbox描述恰好三个字符串；历史`mv-1.6.1/23`赋值以及全部stale／fresh／Check不升级断言完整保留。这一更新与09标题计数2→1、16 CURRENT39→40为三个独立纠正，不能混称所有原expect字面不变。support真实source／built各22passed、0failed、115filtered，六个suite实际执行，分别21个helper；85份原raw与332项helper来源文件独立核验。final-review真实由runner通过，Movement的实际CLI入口和其余Workspace API的src／dist入口均单独核对。上述窄验证不替代三条完整验收命令，也没有重跑原生。

## 命令与失败历史

Windows10 `10.0.19045` x64、Node `v22.23.4`、pnpm `10.33.0`；默认 `C:\Users\Shuen\AppData\Local\Temp`，仓库 `maxWorkers:2`，无全局 CLI entry 覆盖。先做 setup build，再顺序执行 `pnpm check`、`pnpm build`、`pnpm --filter rpgmaker-event-dsl test:windows-baseline`。[命令记录器](17-run-history/run-final-validation.mjs)已经提交在上述执行冻结；它记录初始干净状态、受保护源码／测试／配置哈希、真实命令原始输出与退出、两次构建产物及每条实际回执，拒绝陈旧或命令时间窗外的回执。运行期间不提交、合并或修改产品／测试／配置。

af748ee5这轮setup build与check的typecheck／lint／format实际通过，完整source自然exit1：[原始输出](17-raw/history/af748ee5-contract40-whole-check-failed/01-pnpm-check.log)与[命令历史](17-raw/history/af748ee5-contract40-whole-check-failed/command-history.json)记录103文件=102passed＋1failed、3409测试=3408passed＋1failed、2380.17秒，没有skip或过滤。唯一明确失败为`AV.D05.incomplete.native.case.expected`，错误为`Test timed out in 10000ms`，定位asset-diagnostics-workspace.test.ts561及asset-evidence.ts19。该项helper最后写passed，13:26:57.389Z至13:27:08.936Z约11.547秒；仍必须按runner判为failed，不能用最终body完成代替runner通过，也不由该耗时推断产品性能根因。正式第二build及Windows baseline按记录器fail-fast均未启动。

[af封存处置](17-raw/history/af748ee5-contract40-whole-check-failed/disposition.json)保存2152份工件、270257664字节，含原日志／历史、1241份真实source素材回执、896份本轮原legacy helper、同输入的3409项注册收集以及af计划／静态审计。仅收集命令不执行callback；收集前后1561个受保护输入及source回执字节一致。[组合验证底表](17-af-source-composite-base.json)与[完整身份索引](17-raw/history/af748ee5-contract40-whole-check-failed/source-case-identities.json)明确方法：完整runner总数3409、0skip／filter、唯一明确failed集合，加上同冻结输入3409注册集合，对集合减法得到3408项逐名pass；这些是推导身份，不是逐名pass日志观察。全部1241素材helper虽然写passed，但其中D05因runner失败必须排除，因此当前可沿用1194 canonical source＋46 supplementary source，尚不能声称1195自动化或built轴完成。与最终修复冻结的产品／输入／断言身份仍须逐项核验。

c5f7ead7这一轮Contract40完整check自然exit1，原始[命令历史](17-raw/history/c5f7ead7-contract40-whole-check-failed/command-history.json)、[完整输出](17-raw/history/c5f7ead7-contract40-whole-check-failed/01-pnpm-check.log)及[封存处置](17-raw/history/c5f7ead7-contract40-whole-check-failed/disposition.json)保留真实总结：103文件为97通过、6失败；3409测试为3403通过、6失败，运行2750.83秒，无skip或过滤。setup build和check的typecheck／lint／format通过；正式第二build及Windows baseline由记录器fail-fast而未启动。

完整错误明确五项为test timeout：Picture007、actorRef Input003各10000ms；Audio002第二批、Movement003、Screen002各30000ms。原因超出这一真实错误的部分尚未建立，不能自行改断言或把它们改称通过。另一失败是final-review-workspace.test.ts136的严格CURRENT期待`mv-1.6.1/38`实际收到`mv-1.6.1/40`；下一行才写历史`/23`，后续历史／状态断言未到。真实失败sandbox的44个业务文件和process-results已按原字节保存，node_modules未跟随。

该轮素材source实际有1241条完成且通过的回执：1195 canonical、39活动原补充、7设备名补充。source轴不增加canonical数，也不能替代失败的完整check；built未执行。五项timeout的原ignored helper记录仍写passed／断言完成，已[原样保留](17-raw/history/c5f7ead7-contract40-whole-check-failed/current-legacy-regression-evidence/observation.json)并与Vitest runner failure单列，不能用helper覆盖runner结论。封存共1320份原文件、127487998字节，含完整source收据、命令输出、独立计划与该冻结静态审计。该轮没有终止、重复测试或修改产品／测试／配置；后续由主任务退责任修复并建立新冻结重跑。

[失败checkpoint工件清单](17-failed-checkpoint-manifest.json)另涵盖17现有历史、全部当前审计／脚本、正文和票17；提交后按清单逐字节核验Git blob，结果写入`17-failed-git-verification.json`。这个checkpoint只交接已保存的真实失败和准备性审计，不标记17技术完成。

首次真实运行完整保存在 [取消处置](17-raw/history/11e52e3c-contract39-canceled/disposition.json)、[原命令记录](17-raw/history/11e52e3c-contract39-canceled/command-history.json)和[原始输出](17-raw/history/11e52e3c-contract39-canceled/01-pnpm-check.log)：

- setup `pnpm build` exit0；`pnpm check` 的 typecheck、lint、format检查已通过。
- source测试取消前落盘631条真实完成回执：630 passed、1 failed；没有全量测试总结。
- 真实失败 `AV.C07.shared-system-field.formal.case.expected` 在取消前发生：旧断言要求两个 `error MV-ASSET-INVALID-DATA` 标题，实际得到一个。第一次API断言已中止callback，后续来源／状态／CLI断言未到，原失败不能证明丢失来源。09随后经独立真实API Check／Compile及CLI捕获确认共同字段正确合为一组，两个独立来源均保留；[09纠正证据](09-grouping-compatibility/acceptance.md)记录标题期待2→1及增强的成员／统计／状态断言。原failed回执和原坏预期源码不改写。
- 根协调端另确认设备名后、点号前ASCII空格的Windows保留设备名识别缺口，退责任03修复；属于原文件支持契约实现缺口，不重开政策。
- 只终止已验证属于本记录器的 `pnpm check` 进程树；记录器收到非零退出后落盘原始日志和631条回执。复查无本次残留测试进程，正式第二条build与Windows baseline均未启动。

## 有限义务与原始证据

[独立重展开计划](17-raw/final-canonical-id-plan.json)仅从现行规格、验收矩阵、有限子用例索引和已确认责任表展开，不导入产品、测试或运行回执。本次Contract40执行冻结仍有97族、1209项义务，其中1195自动化、14原生；与外部独立旧计划的义务、责任和方法形状完全一致。独立计划的准备性旧正文不构成本票最终结论。

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

[原断言保留审计](17-original-assertion-preservation.json)在本次冻结比较2528个仍活动的原回执定义位置（包括1195当前义务的原证据、15／16追加记录及39个活动补充ID的原记录），归并为208个原／现callback版本对；17对callback文本变化。四个callback存在需解释的原expect文本差异：C08 route-approach和C11 route-script的变化仅格式，语法树相同；09的两个过时标题期待2→1按规格共同依据分组规则纠正，并增强两来源、统计和状态核对，原直接状态查询改为已捕获的after／afterCli相等断言；16的CURRENT Contract39→40包含一个严格版本断言与一个记录值更新，以隔离当前配置变化原因。没有未分类的断言语法差异。原09及16/f03/39的源码／回执／失败历史均保留，不能笼统声称所有原expect字面未改。静态保留不单独证明fixture参数、辅助函数或真实行为，仍需语义审阅和最终运行共同证明。

原03六条 `not-executed-policy-pending` 原字节哈希 `a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071` 保留；退出义务的旧图片filesystem ID不改写为通过。D09三条旧formal ID迁移到native后不构成别名双计。B14的两个host-target-missing为不适用；宿主载体不是另选固定目标。W12由13唯一注册，14的记录仅引用；W19保留14／15共同责任，原断言及独立成功／失败callback不重复注册。15、16的原失败、过滤、准备错误及重跑经过均保留，不能改写成一次全过。

## 当前实现与测试语义核对

Compile／Check在完整候选验证后调用同一个素材门槛：当前事件来自Staged Data Graph，外部关系与必要System字段来自对应捕获Snapshot，文件元数据来自绑定的实时Project Root。Push由验证过的完整Generated Project Data与对应捕获Snapshot重建相同使用和直接调用；不重新求值DSL。Common Event定义为独立根，调用关系单独保留，循环与共享图不复制素材使用；强制Skill的effects也只增加直接关系。

直接字段、双动画图和timing SE、九Tileset槽、页图块B–E单槽、前／侧视Enemy、Actor初始候选、固定传送Map及System字段均以独立文字预期核对完整使用集合、原生保存位置、事件内链、执行条件和必要的候选／非活动原因。formal/raw指向各自真实合法原生字段；205／505镜像只计一次，第二真实命令及重复成员／槽保留独立位置。None保留独立控制值并省略查询；已知兄弟关系不会因为另一路动态停止而消失。C07的首次失败是旧标题计数预期与共同字段分组规则冲突；09实际捕获证实1组、0合法问题文件、2成员／2使用，list[0]和list[1]各一次，安全标题兄弟关系继续查询且状态不变，没有产品丢来源结论。

文件观察器从根realpath逐层枚举准确名称并lstat；不读媒体内容或跟随根以下链接。只有合法名称形成目标；图片与影片任一`%`／`#`在查询前拒绝，音频按原名查询。普通文件、缺失、大小写不符、类型不符、支持范围、查询错误和查询内矛盾分开。03已修复保留设备token后、首个点号前ASCII空格的识别，规则只增加`[ ]*`，不trim原名、不扩大Unicode空白，也不允许例外豁免。28个设备token在图片／音频／影片均作为不支持输入；candidate／inactive保留警告与覆盖不完整，八个真实普通文件正控制及可豁免的缺失文件对照保留。新增七个`SUPPLEMENT.device-space-*`回归单列，不增加canonical义务。

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

README的例外JSON示例准确提供四个字段和理由，正文解释准确PNG／OGG／WebM、存在性不保证内容／尺寸、修复后再Check／Compile／Push、同一命令单次门槛及恢复后当前门槛。04已回补package README与authoring skill的Face说明，06已回补authoring skill的Animation／Tileset说明；最终冻结的正文明确所选文件要经过共享素材门槛，内容／尺寸／布局／解码仍不承诺。

[补修集成审计](17-integrated-corrections-audit.json)重读452份原始补修工件（03有395份、09有34份、16有23份），核对每份长度、SHA256、Git blob与磁盘字节。03旧F07尾部3168字节哈希保持`21b202d79f5ce591d1b99d72381301cc7c7809c5ff2d11bacdc6ab4833e4f216`；09归一换行后指定callback以外完全相同；16原文件只替换两个CURRENT字面量便等于当前文件。03真实red、09原失败及CRLF观察器失败、16版本兼容red和全部历史过滤均原样保留，后来的成功不追写旧结果。

尚需：D05有界局部修复与失败／直接受影响source定向补证；正式build及首次built baseline，包含1195 canonical和46 supplementary的真实built结果；跨冻结产品／原输入／断言身份及最终逐项责任绑定；诚实标明af完整check失败的组合覆盖审计；最终Standards与Spec双轴独立评审；维护者实际审阅确认。遵照用户减少全量指令，不再重跑源码已通过集合。维护者确认前，本票不能设为resolved。
