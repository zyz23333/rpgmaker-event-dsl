# 17 support：旧回归局部预算与CURRENT40预期兼容

六项原整仓失败已完成窄复核：source／built均 **22实际通过、0失败、115过滤**，每入口确实执行6个suite，并各保留21份新legacy helper原始JSON。此support只处理旧回归基础设施与当前预期兼容；**产品、政策、Compile Contract、fixtures、输入和业务断言未改，17仍claimed，最终完整验收尚未完成。**

机器数据见[合册](acceptance.json)，所有原始资料见[raw](raw/)，提交前长度／SHA／Git blob／链接核对见[审计](git-verification.json)。工作树为用户指定M盘下的独立 `M:/Shuen/Codex/asset-validation-17-regression-repair`，分支 `codex/asset-validation-17-regression-repair`；Node `v22.23.4`、pnpm `10.33.0`，以原lock独立安装依赖，虚拟store属于本工作树。

## 真实red与责任范围

原 `pnpm check` 自然结束于冻结 `c5f7ead75ba78680b92ad81924ba8cb884d2b751`，完整结果为103files／97passed／6failed、3409tests／3403passed／6failed、零过滤。其产品及测试与本支基底 `f30d64d635eddc832879e1536bb72f89e82ad015` 相同。没有人工sleep、负载或另造red；[原完整log](raw/original-01-pnpm-check.log)、[原命令记录](raw/original-command-history.json)、[原处置记录](raw/original-disposition.json)及六份原测试源码、五份原helper字节均单独复制保留。17独立归档的[1320份原件索引](../17-raw/history/c5f7ead7-contract40-whole-check-failed/disposition.json)及原1241条通过的asset回执继续属于那次失败整仓运行，不能使整条check通过。

完整错误确认五项是 `Test timed out`：Picture007／actorRef INPUT003为10000ms，Audio002 batch2／Movement003／Screen002为30000ms。第六项final-review在第136行期待CURRENT38却收到40，此时尚未写入原历史23，更未执行后续stale/fresh断言。原五份helper最终记录passed，只代表其body／helper观察；它们不能覆盖runner deadline失败，也没有变成原runner通过证据。

## 有界局部预算及原业务保留

| 原用例／同构参数组 | 原预算 | 新预算 | 既有工作量和预算范围 |
| --- | ---: | ---: | --- |
| Picture007 | 10s | 30s | 15-carrier Map／Troop／Common流程，四份实际Discovery／evaluation，Check、两次Compile、Diff、Push，完整前后载体、清理和provenance。只此Picture用例明确传入预算。 |
| INPUT003全部15种Reference helper | 10s | 30s | 每个相同结构参数均执行Discovery／evaluation、Check／Compile／Diff／Push、15份data与Snapshot比较，另两种实际错误source、各自Check／Compile和stale Diff／Push及完整state。整组统一预算，其他INPUT用例仍继承原预算。 |
| Audio002三批 | 30s | 60s | 原23输入仍为8／8／7。每个满批包含16次Check／Compile、8次stale Push、32次完整state，另有初始化／Decompile／初次Compile及收尾；三批统一预算，其他Audio用例仍30s。 |
| Movement003 | 30s | 60s | 原7种malformed movement值、14次Check／Compile、14次前后完整state，另有初次Compile、最终state证据和清理；其余Movement预算不动。 |
| Screen002 | 30s | 90s | 原16输入、32次Check／Compile、16次stale Push、32次完整state及初始化／初次Compile／收尾；其他Screen用例仍30s。 |

这些是完整集成wrapper的有限预算，覆盖业务、sandbox收尾和awaited证据收集。旧helper会递归枚举并哈希全部来源，built另含dist；其completedAt也不是完整wrapper结束时间。未添加分段计时，未把某一阶段推定为根因。局部预算让现有验证完成，**不是产品性能修复、性能承诺或全局timeout调整**。仓库默认2workers、默认10000ms和Windows显式include原样保留；没有skip或全局entry覆盖。

最小改动扩展原三个wrapper的可选timeout参数，或在现有单case／参数组末尾传值。全部原callback AST、literal arrays和string输入／diagnostic核对保留：6文件、122个arrow/function callbacks、295个literal arrays、936个string输入；final-review三处允许变化的current字符串单独归一后其余仍相等。整个src、fixtures、support helpers、全局configs和lock与基底相同。[断言保留审计](raw/assertion-preservation.json)绑定每份新旧源码SHA。

final-review只将当前期待、标题和sandbox描述38→40；原23、正常Compile才升级、Check不升级、stale Diff／Push无写、freshness前后与完整state断言均保留。16 CURRENT40及其历史证据未动，没有新AV ID。

## 冻结执行与显式入口

代码／测试／targeted配置冻结于 **`14ef1dddaecc8df069a07277f449013b0cdb475c`**，Compile Contract仍`mv-1.6.1/40`。build通过后按source→built运行。targeted配置明确include全部六个文件，尤其把常规Windows include之外的final-review、control-input和screen-effects显式纳入；built配置继承既有Windows配置的`MV_CLI_ENTRY: built`，其余默认项保留。没有只传positional filter而零执行。

每入口22项是15种Reference参数＋3批Audio＋Picture／Movement／Screen／final-review各1。137个注册中其余115过滤，不计通过；source／built是执行轴，没有增加语义身份。22项完整名称集合和每项实际duration在合册，不以helper替代runner。42份当前helper分别绑定原测试SHA、实际entry和来源fingerprint；final-review本来没有helper，以实际runner为准。

| 范围 | source实际duration | built实际duration |
| --- | ---: | ---: |
| Picture007 | 13.228s | 6.832s |
| Reference组15项 | 7.909–10.794s | 5.511–7.731s |
| Audio三批 | 23.522–34.778s | 14.265–25.298s |
| Movement003 | 27.761s | 21.312s |
| Screen002 | 38.052s | 29.059s |
| CURRENT40恢复旧23场景 | 4.383s | 3.861s |

均在默认2workers下实际完成；这些观测不扩展成未来性能保证。build、typecheck、lint、format:check、AST保留及diff空白检查均通过。15份built工件和18个冻结Git输入均留实际SHA。没有重复完整103-source或42-built套件，最终17必须在新冻结重跑规格要求的精确三命令。

## 收集脚本准备错误与整合

source的runner先实际exit0、22通过；随后PowerShell收集脚本把ConvertFrom-Json的DateTime与原ISO字符串比较，误把21份新helper都过滤掉，收集步骤退出。原JSON仍在，UTC解析复制成功而没有重跑source。首次UTC复制还纠正Movement原Windows反斜杠entry比较；原JSON字节不变。[类型记录](raw/source-capture-types.json)、[原比较与UTC比较](raw/source-capture-comparison.json)及[原错误说明](raw/source-capture-first-error.txt)保留。

built使用单独固定版收集脚本，测试命令／配置／callback仍在14ef冻结，HEAD未在两次运行间改变。合册第一次匹配又发现Picture helper的expected只存描述、不含ID；聚合器改为组合原requirementId和expected，保留[原匹配器](raw/build-evidence-first-name-assumption.cjs.txt)和[说明](raw/aggregate-first-name-assumption-error.txt)。这些是证据脚本错误；未记作业务测试失败或产品反例，也没有反复执行已通过测试。

两入口及静态检查结束后，已无冲突merge17独立checkpoint integration `ea5a6b6fdf00dd8cf13294a5150ce57936c7f258`，merge为`d5aa65dee9dfc09cbff6153eb34a94ba4ebc1437`。新增只含17元数据／原失败归档；所有src、test、全局configs、package和lock与14ef仍相同，17由独立checkpoint保持claimed。support不接管01–16功能签收、不改原失败、不resolve17；干净交付由merger整合，工作树保留。
