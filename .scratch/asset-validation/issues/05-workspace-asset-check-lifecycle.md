# 素材检查如何接入 Compile 与 Push 并保持结果有效

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: 02, 03, 04
Parent: [事件素材引用检查的决策地图](../map.md)
Assignee: Codex（与用户进行 HITL 设计讨论）

## Question

前置输入：[事件直接与间接素材依赖的检查边界如何统一](02-direct-asset-reference-coverage.md)、[素材文件存在性应如何判定](03-asset-file-existence-contract.md)与[素材检查结果如何诊断并影响编译](04-asset-diagnostics-and-policy.md)。

素材文件来自实时 Project Root，而现有 Project-Aware Validation 主要依据 Staged Data Graph 和 Project Data Snapshot。新的存在性检查应在 Compile、Compile Check、Diff、Push 及必要的接管步骤中何时运行，并承诺结果在哪一时刻有效？

确定是否在 Push 前重新检查、是否记录素材读取依赖或纳入 Compile Baseline/Generated Freshness，区分文件存在性所需的变化与文件内容变化。处理编译途中、编译后至 Push 前的删除/增加/重命名、目标 Project Root 切换及同 Workspace 操作互斥，明确能检测的检查点与不承诺的跨进程原子性。

确定间接依赖读取哪份标准项目数据，如何使事件、依赖条目、素材字段与实时文件查询的输入一致。分别处理动画/图块等条目的素材名称变化、素材文件变化、Pull 更新及未发生 Pull 的 Project Drift；不能混用不同版本的标准数据来证明结果新鲜，也不能将现有标准 data 漂移检查当成素材已被保护的证据。

检查失败遵守既有发布和 Project Root 写入隔离；不得把素材纳入快照、复制或 Push 写入范围作为未经选择的副作用。指出需要修订的 ADR 0011/0013 契约和文档范围，保留未被修改的项目数据同步语义。

间接检查仅按已知消费位置解释所需标准字段；明确与 ADR 0012 外部数据保留边界的衔接，不扩大 DSL 所有权、不改写数据库条目，也不因此校验无关条目或插件私有字段。

## Answer

2026-10-24 — 用户已逐轮确认 Q1–Q12，并在阅读完整合并契约、ADR 草案及完成边界后最终回复“确认”，确认整体共同理解并同意完成本票。以下为已接受的完整契约；本票 resolved，[ADR 0019](../../../docs/adr/0019-asset-checks-at-workflow-boundaries.md) 已 accepted。完成的是工作流设计，不是产品实现或验收。

### 1. 一致的数据视图与检查范围

沿用票 [02](02-direct-asset-reference-coverage.md#answer) 的事件起点及有限直接／间接覆盖、票 [03](03-asset-file-existence-contract.md#answer) 的准确文件存在性契约、票 [04](04-asset-diagnostics-and-policy.md#answer) 的严重性、例外与诊断政策。本票不扩大关系清单，不把未知动态路径视作检查通过，也不改变候选或非活动保存配置的判定。

Compile／Compile Check 使用本次 DSL 构建的 Staged Data Graph 确定当前事件及公共事件关系。动画、图块组等外部条目与所需 System 配置，包括仅对使用类别解释的加密标志，均来自同一份捕获的 Project Data Snapshot；素材文件查询访问该操作绑定的实时 Project Root。已选素材名称、关系和政策不能从另一版实时标准 data 中补读或替换。

Push 在验证生成数据完整性、Generated Freshness 和完整标准 data 的 Project Drift 后，以待推送的 Generated Project Data 中完整当前事件状态及对应的当次捕获快照重建 Event Asset Uses，再查询绑定的实时 Project Root。它不重新编译 DSL，不信任历史素材报告，也不把快照中已从当前 DSL 移除的事件补回扫描起点。覆盖与条件规则须与 Compile 相同，保留原生保存位置和完整 Asset Dependency Chain；DSL 源码位置只有可靠时才提供。

例如实时 Animations 中动画 5 从 Fire 改成 Ice 而未 Pull，Compile 仍检查快照指定的 Fire。标准 data 漂移会阻止 Push，不能以 Ice 文件存在证明原输出可推送。Pull 后快照更新、旧生成状态失效，重新 Compile 才使用 Ice。素材文件变化与标准字段变化是不同输入；标准 data 漂移检查不能替代素材查询。

必要外部字段只按已选消费位置解释，保留 ADR 0012 的所有权边界：不扫描无关条目，不通用校验外部条目的全部字段或插件私有字段，不改写数据库条目。合法 None、缺失项目引用、必要字段无法解释和实际素材文件问题继续分别处理。

### 2. 各操作的检查职责

| 操作 | 素材文件检查与成功边界 |
| --- | --- |
| Compile | 默认检查；发布 Generated Project Data 前及提交对应 Sync Manifest 前重新核对素材观察及本次编译依据 |
| Compile Check | 同样默认检查，成功返回前重查；不发布生成数据、不更新 Manifest、不创建或刷新 Generated Freshness |
| Diff | 不扫描实时素材；保留既有生成数据完整性和编译基线检查，比较生成数据与快照；成功不证明当前素材可用 |
| 有待写文件的 Push | 第一次 Project Root 文件替换前检查；全部替换完成、刷新快照与同步元数据前再次核对 |
| 无待写文件的 Push | 保留完整标准 data 漂移等既有前置检查，成功返回前完成当次素材检查；素材失败不单独制造 pending |
| Clone／Pull | 继续捕获标准项目数据，不新增素材文件扫描或缺失门槛 |
| DSL Decompilation | 保留保存状态可表达性及既有固定引用检查，不新增素材文件扫描或缺失门槛；接管后使用 Compile Check 获取素材诊断 |

Compile、Compile Check 和 Push 使用票 04 相同的诊断政策：有效 error 阻止该操作成功，稳定的 warning 或信息停止点本身不阻止成功。逐素材例外不能豁免无法检查、无法确认或操作内相关观察改变。更早的配置、数据完整性、引用或同步错误已使输入不可信时，不强行运行素材检查；保留未运行／不完整原因，不承诺穷尽所有问题。

素材始终不进入 Standard Project Data Snapshot、复制、备份或 Push 写入范围；写入与恢复备份仍只覆盖 Affected Project Data Files。没有新增独立素材扫描命令、素材修复、全局跳过开关或额外通用报告接口承诺。

### 3. Compile Baseline 与实时素材条件分开

实时素材的存在状态、内容、大小、修改时间和文件身份不加入持久化 Compile Baseline。Generated Freshness 只证明生成数据属于当前编译输入，不能证明素材现在存在或可播放。操作内查询记录用于核对本次观察，不是以后命令的成功凭证。

素材例外配置属于 Workspace 的编译政策输入，改变后须重新 Compile；检查规则的实际实现或变更须遵守 ADR 0013 的 Compile Contract Version 更新规则。旧版本输出不能通过单独重查素材升级为新契约输出。现有源代码、验证依赖、配置、快照和 Project Root Binding 的新鲜度要求继续适用。

Compile 成功后删除图片，可出现“生成数据仍新鲜，但当前素材检查失败”。把文件补回且其他依据未变后，可以直接重试 Push，不因文件曾删除而要求重新 Compile。若同时改变例外配置、发生 Pull 或切换项目目标，则仍需满足各自的重新编译要求。Compile Check 的成功不改变旧生成数据的新鲜度。

### 4. 操作内的相关变化、复用与结果有效性

每个检查点观察准确路径、与所查名称有关的匹配情况、必要路径组成的类型／链接状态及元数据是否可查询。以下变化视为相关变化：存在与缺失互换、相关名称或大小写匹配改变、普通目录／文件变成错误类型或链接、查询由可完成变成无法完成、具体失败位置改变（例如缺目录变成目录存在但缺文件）。查询失败与已确认缺失继续区分。

同名普通文件的内容、大小、修改时间或文件身份变化，在所需路径及存在性事实相同时不构成相关变化；同目录无关素材增删改不构成相关变化。不读取或哈希媒体内容，不通过全目录变化让无关文件影响本次检查。已有支持边界、名称准确性与链接规则不因此放宽。

在一个检查点内，相同目标及必要目录查询可以复用，但每个 Event Asset Use、调用来源、依赖链、候选／非活动条件和例外判定独立保留。下一个检查点必须取得新的文件系统观察，不能以旧缓存代替；不同命令间也不能靠缓存或持久成功记录跳过查询。固定项目数据视图中的依赖关系可以复用，实时文件结论必须重查。重复查询不增加逻辑使用次数。

只要本次操作观察到上述相关变化，即失败并要求重跑，不在同一次操作中静默接受新结果继续；缺失后来补齐等改善也一样。稳定的、已被允许为 warning 的缺失可以通过政策，但 warning 对应事实发生变化仍是无法确认本次一致性的 error。已得诊断与变化原因应保留，明确失败检查点和受影响来源，遵守票 04 的分组、不完整检查与无实际作用例外政策。

这些检查点不构成连续监控、整棵素材树的同时快照或跨进程原子隔离。两次观察之间短暂删除又恢复而未被观察到，或者最后检查后被修改，均不承诺发现。存在性通过仍不证明媒体内容可读、可解码、可播放或运行时一定使用。

### 5. 发布、写入与操作内输入变化

Compile 在本地生成数据发布前发现 error 或相关变化，不发布本次输出；若已进入本地发布过程，则沿用 ADR 0013 的发布失败和无效状态边界，不额外承诺保留上一份可用输出。无效本地状态必须由成功 Compile 恢复后才能用于 Diff／Push。Compile／Check 不写 Project Root。

Push 在第一次实际项目数据替换前完成素材检查；若暂存等前序阶段已经建立观察记录，写入前须重新核对。此时失败不开始替换。所有替换结束后、同步记账前再查，发现素材 error 或相关不一致，则 Push 失败并保留 Interrupted Push，不自动回滚已经写入的项目数据。素材检查的失败不能被描述为整个项目均未写入。

在这些 Push 边界，同时确认本次所用源代码及验证依赖、相关配置（含素材例外）、快照、生成数据与捕获依据一致，Project Root Binding 未变，并保留实时标准 data 的完整漂移检查与每个受影响文件替换时的旧内容检查。最终实时 data 预期仍是已写文件的生成内容及其他标准文件的原快照内容，不把本次合法写入误判为外部变化。任何必要依据改变时，写前停止，写后保留 pending；不在中途换例外、重新编译或转向另一个项目继续。

同一真实 Workspace 的操作继续互斥，竞争立即失败；包括 Compile Check 和 Diff。此锁不阻止外部编辑器改源代码、配置或文件，不新增跨 Workspace／跨机器协调。操作之间切换 Project Root 仍须显式 Pull，旧生成状态随之失效；有 pending 时先按原绑定目标处理。既有 Project Root 别名规则保留，素材路径下链接的禁止也保留。

### 6. Interrupted Push 恢复与当前检查分别判定

仅 Push 处理 pending，非 Push 命令继续停止。恢复要求原目标绑定、已理解格式及一致的既有恢复证据，不因素材问题跳过数据内容检查，也不改变现有 mixed／missing／unknown 状态的处理。

| 受影响项目文件的已观察状态 | 恢复处理 | 后续检查 |
| --- | --- | --- |
| 全部等于 pending 对应的生成内容 | 可以完成已发生写入的快照与同步记账，即使当前仍缺素材 | 保留原编译依据，继续当前 Push 的正常新鲜度、漂移和素材检查 |
| 全部等于 pending 对应的原快照内容 | 可以放弃该次操作并继续正常 Push | 新写入仍须通过全部当前条件 |
| 混合、缺失、未知或证据不一致 | 不能自动完成或放弃，停止并要求明确恢复数据 | 不以素材检查替代或放宽恢复要求 |

恢复已完成写入的记账不追认那次素材检查成功，不刷新为新的 Compile Contract Version，也不准许新的项目写入。记账恢复后如果当前素材仍报 error，本次 Push 仍失败，但不会为了已经完成的数据写入继续保留 pending。报告须能区分“同步记账已恢复”和“当前素材检查失败”。旧配置或旧契约导致新鲜度失败时，同样不能通过恢复获得新写入权限。

### 7. 关键场景的合并结论

| 场景 | 结论 |
| --- | --- |
| Compile 后删图，其他输入不变 | Diff 可照常审阅；Push 的当次素材政策决定通过或失败，生成新鲜度本身不因该删除失效 |
| 上述删图导致 Push 失败后补回 | 其他依据仍当前且无未处理 pending 时，可直接重试 Push |
| 同名图片换了内容，存在性事实相同 | 不单独失效或报输入变化，不宣称新内容可加载 |
| 实时动画／图块素材字段改名但未 Pull | Compile 使用快照旧字段；Push 因标准 data 漂移停止，不混读新字段 |
| Pull 捕获新字段或绑定另一个项目 | 旧生成状态失效，重新 Compile 使用新快照与绑定 |
| Compile 期间原本按例外允许缺失的文件被补齐 | 若检查点观察到变化，本次失败并要求重跑；例外不能豁免一致性错误 |
| Push 写完 data 后素材删除且被观察到 | 本次失败并留 pending；之后按已写 data 恢复记账，再判当前素材，不能自动回滚或声称未写入 |
| Push 无数据差异但当前素材有阻断问题 | 当前 Push 失败，单纯素材失败不制造 pending |
| 老项目缺图，需要先取得 DSL | Clone／Pull／Decompilation 不新增文件门槛；接管后 Compile Check 提供素材诊断 |

### 8. 文档修订与完成边界

- [ADR 0019](../../../docs/adr/0019-asset-checks-at-workflow-boundaries.md) 已接受本票的真实取舍：一致标准数据与实时文件分开、实时条件不进生成基线、各操作检查职责、存在性观察比较及恢复记账边界。
- [ADR 0013](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 已明确素材政策属于基线而文件观察不属于，补充 Compile／Push 检查点与 Push 对捕获输入的边界重查，保留全部标准 data 漂移、受影响文件写入及非原子性语义。
- [ADR 0011](../../../docs/adr/0011-native-command-state-and-validation.md) 已接回已选素材政策的工作流职责；[ADR 0012](../../../docs/adr/0012-event-saved-state-roundtrip-boundary.md) 已明确必要外部字段读取与接管无新增文件门槛，保留保存值、已识别 raw 规则及外部数据所有权。
- [ADR 0006](../../../docs/adr/0006-interrupted-push-recovery.md) 已补充素材写后失败的交接与恢复记账不代表当前素材成功；[ADR 0016](../../../docs/adr/0016-event-rooted-asset-use-coverage.md)、[0017](../../../docs/adr/0017-exact-asset-file-existence-in-editing-projects.md)、[0018](../../../docs/adr/0018-asset-check-diagnostics-and-explicit-exceptions.md) 已更新工作流交接指针，既定覆盖、准确文件和诊断政策继续有效。
- GLOSSARY.md 已澄清 Project-Aware Validation、Compile Baseline 和 Generated Freshness；不把操作内观察记录新增为持久素材凭证或泛化术语。
- [票 06](06-asset-validation-acceptance.md) 继续负责独立预期、自动化与必要原生核对，覆盖上述操作、变化、失败和恢复场景；本票不设计完整测试矩阵，不执行产品实现、不拆实施任务、不开展原生加载验收。

本票已完成设计契约与文档交接。地图仍待验收票；没有因源码只读核查或文档检查而认定产品功能已经实现。

## Comments

### 2026-10-24 — 开始工作流与结果有效性讨论

用户明确要求以 grill-with-docs 讨论本票。前置票 02／03／04 均已 resolved；已读取地图、领域术语及 ADR 0011–0013、0016–0018，认领本票开展 HITL 讨论。只读子代理核查现有 Workspace 操作顺序、Compile Baseline、Generated Freshness、Project Root Binding 与互斥机制，代码事实不代替用户的设计选择。

本轮只讨论并记录工作流设计，不实现产品功能，不推进验收票。沿用已接受的覆盖、文件契约和诊断政策；标准数据输入版本、Push 重查、Diff 与接管步骤的检查职责、文件变化和结果有效性均待本次逐轮确认。

### 2026-10-24 — 第一轮 Q1–Q4 已确认

用户回复“确认”，接受以下四项建议。本票继续 claimed；素材观察与 Compile Baseline 的关系、具体检查点、操作内变化、缓存及中断恢复仍待后续讨论，尚未确认完整契约或本票完成。

- **Q1：标准数据采用同一次编译的完整一致视图。** 事件与公共事件关系来自本次 DSL 构建的 Staged Data Graph，动画、图块组等外部条目及所需 System 配置来自同一份捕获的 Project Data Snapshot；素材文件存在性查询访问绑定的实时 Project Root。实时 Animations 已由 Fire 改成 Ice 而未 Pull 时，Compile 仍按快照中的 Fire 检查；Push 由既有完整标准 data 漂移检查拒绝未同步的数据，Pull 后重新编译才采用新关系。只解释已选消费关系所需的标准字段，不扩大 DSL 所有权、外部条目或插件字段校验范围。
- **Q2：Push 当次重新检查素材。** 允许新的 Project Root 写入前，重新检查待推送事件涉及的素材，应用票 04 相同的 error／warning、候选、非活动配置和逐素材例外政策；即使没有 Affected Project Data Files 也检查。检查通过条件来自当次观察，不能以 Compile 的历史成功替代。输入来源、具体时点、写入期间变化及恢复边界待后续决定。
- **Q3：Diff 不承担实时素材检查。** 继续比较 Generated Project Data 与 Project Data Snapshot，保留既有生成数据完整性及编译基线检查；不新增素材扫描，不因实时素材文件缺失阻止审阅差异，也不把 Diff 成功或历史素材报告表述为当前素材已通过。当前检查使用 Compile Check，Push 承担 Q2 的当次检查职责。
- **Q4：接管步骤不新增素材文件门槛。** Clone／Pull 继续捕获标准项目数据，DSL Decompilation 保留保存状态可表达性及既有固定引用检查，不新增素材文件扫描或因素材文件缺失阻止接管。之后通过 Compile Check 取得素材诊断。素材不进入快照、复制或 Push 写入范围。

已建立 [ADR 0019 草案](../../../docs/adr/0019-asset-checks-at-workflow-boundaries.md)，记录已确认的输入与操作职责取舍；完整契约仍待逐轮讨论和最终确认。Project-Aware Validation 术语已补充素材检查的实时 Project Root 边界。

### 2026-10-24 — 当前工作流的只读事实核查

以下来自当前源码及已有测试内容的只读核查，未运行测试，不代表素材功能已经实现：

- [Compile／Check](../../../packages/rpgmaker-event-dsl/src/workspace/operations.ts) 共用捕获到内存的 Snapshot、graph 与完整 emitted data 校验；普通 Compile 在 generated 与 Manifest 发布边界重查输入，Check 在返回前重查且不制造 Generated Freshness。当前必要输入视图尚未覆盖全部间接素材字段及加密标志。
- [Compile Baseline](../../../packages/rpgmaker-event-dsl/src/project-data/materialization.ts) 包含来源、类型依赖、配置、快照、绑定及 Compile Contract Version；尚无素材读取观察或 Asset Check Exception 配置。现有类型查询记录不能直接充当素材判定器，例如 Windows 路径折叠大小写不满足准确名称规则。
- Diff／[Push](../../../packages/rpgmaker-event-dsl/src/workspace/push.ts) 检查 baseline 和生成数据完整性，不重新编译；Push 的完整标准 data 漂移检查包含无写入情形，并在写入前和全部替换后重查。它没有覆盖素材文件，不能证明素材未变。
- [Workspace 锁](../../../packages/rpgmaker-event-dsl/src/workspace/operation-lock.ts) 是 Windows 内核独占句柄机制，覆盖 Clone／Pull／Decompile／Compile／Check／Diff／Push，竞争立即失败；不能阻止外部编辑器或另一个 Workspace 修改同一 Project Root。
- [绑定检查](../../../packages/rpgmaker-event-dsl/src/workspace/checks.ts) 要求切换目标通过显式 Pull，pending 操作须先按原目标处理。[恢复](../../../packages/rpgmaker-event-dsl/src/workspace/push-recovery.ts) 根据已观察到的 data 内容处理完成或未开始的写入，保留原编译契约；恢复记账和准许新的 Push 写入是不同边界。当前 Push 没有直接调用 Compile 使用的配置发布前重查辅助函数，不能把一般设计承诺误记为所有代码路径均已实现。

### 2026-10-24 — 第二轮 Q5–Q8 已确认

用户回复“确认”，接受以下四项建议。Q1–Q8 已逐项确认；相关变化的精确定义、缓存、恢复与操作内输入／绑定变化仍待讨论，尚未确认完整契约或本票完成。

- **Q5：实时素材条件与 Generated Freshness 分开。** 素材文件的存在状态、内容与修改时间不加入持久化 Compile Baseline；Generated Freshness 不证明当前素材可用。Compile 成功后删图导致 Push 检查失败，随后补回文件且其他输入不变时，可直接重试 Push，无需仅因该文件变化而重编译。素材例外配置属于编译政策输入，变化需要重新编译；未来实际引入素材规则须按 ADR 0013 更新 Compile Contract Version，旧契约输出不能被当作已满足新规则。操作内素材查询记录与持久化编译基线是不同用途。
- **Q6：Push 从待写入事件数据重建素材依赖。** 在生成数据完整性、Generated Freshness 与标准 data 漂移检查通过后，以 Generated Project Data 中完整当前事件状态及对应的当次捕获 Project Data Snapshot 重建 Event Asset Uses 和依赖链，再查询绑定的实时 Project Root。外部字段仍来自一致快照；同一覆盖、条件、级别和例外政策适用。Push 不重新编译 DSL，不把旧素材报告当成证据，至少保留可靠原生保存位置与依赖链，DSL 源位置只在可靠时提供。
- **Q7：编译在完成边界重查，相关观察改变则重跑。** Compile Check 成功返回前重查；Compile 在发布 Generated Project Data 前及提交对应 Sync Manifest 前核对本次素材查询记录。观察到影响存在性判定的变化时本次失败，明确要求重跑，不静默切换新结果继续；缺失后来补齐等改善也按观察变化处理。发布前失败不发布；进入本地发布后的失败沿用既有无效状态和发布失败边界，不额外承诺保留旧输出。Check 不刷新 Generated Freshness。相关变化的具体判据尚待下一轮确认。
- **Q8：Push 在实际替换前及同步记账前重查。** 第一次 Project Root 文件替换前完成素材检查，已有观察记录须重新核对；失败不开始数据替换。全部替换完成、刷新 Snapshot／Manifest 前再次核对，发现素材 error 或相关观察不一致则报失败并保留 Interrupted Push，不自动回滚已写数据。无 Affected Project Data Files 时在成功返回前完成当次检查即可；素材失败不单独制造 pending。只承诺检查点，不承诺外部程序无法在最后检查后改动。如何处理已全部写入但尚未记账的恢复，继续由下一轮决定。

已更新 ADR 0019 草案及 Compile Baseline／Generated Freshness 术语，明确生成数据新鲜度与当前素材条件不同；没有新增持久素材凭证、素材快照或产品实现。

### 2026-10-24 — 第三轮 Q9–Q12 已确认，合并契约待最终核对

用户回复“确认”，接受以下四项建议。Q1–Q12 已逐项确认，已整理上方完整 Answer 并补齐 ADR 0019 草案；仍待确认整体共同理解和本票完成边界，本票继续 claimed。

- **Q9：相关变化只比较存在性所需事实。** 存在／缺失、相关名称和大小写匹配、路径类型／链接、元数据可查询性或失败位置改变均需处理；内容、大小、修改时间、文件身份在必要存在性事实相同时不触发失败，无关同目录文件变化也不触发。未被观察到的短暂变化与最后检查后变化不承诺发现。
- **Q10：查询只在同一检查点内复用。** 同目标及必要目录查询可复用，但全部逐次来源、链、条件和例外结果保留；下一检查点及不同命令均重新访问文件系统，不能凭旧缓存或持久成功记录跳过查询。固定项目数据依赖关系可复用，重复查询不增加逻辑使用次数。
- **Q11：恢复已写 data 的记账与当前素材判断分开。** 全部受影响文件等于生成内容时可以记账，全部等于原快照时可以放弃操作，混合／缺失／未知按既有规则停止；素材缺失不永久阻塞可证明已完成写入的记账。之后仍执行当前新鲜度、漂移和素材检查，素材 error 使当前 Push 失败但不为已完成写入保留 pending。恢复不追认素材成功，也不更新原编译依据。
- **Q12：Push 边界同时重查捕获输入与绑定。** 写入前和同步完成前核对源代码及验证依赖、相关配置、快照、生成数据、目标绑定，并保留完整标准 data 漂移检查。变化时写前停止、写后 pending，不半途换政策、重编译或转向另一项目。目标切换仍须显式 Pull，pending 先处理原目标；沿用同 Workspace 互斥，不增加跨 Workspace／跨机器锁或最后检查后的原子性承诺。

以上合并稿没有新增实施或验收承诺。最终确认后再将本票设为 resolved、ADR 0019 设为 accepted，并向地图和相关 ADR 同步完成指针；验收票此时才解除本票的阻塞。

合并稿核对：只读子代理核对 Answer、Q1–Q12、ADR 0019 与既有 ADR 0006／0013，未发现实质不一致。四份本轮文档的 45 个本地文件链接目标均存在，未发现尾随空白，git diff --check 通过；票 05 claimed、ADR 0019 proposed、票 06 open 且仍被阻塞。仅完成文档核对，没有运行产品测试或原生验收。

### 2026-10-24 — 完整契约最终确认并解决

用户在阅读完整 Answer 的合并摘要、ADR 0019 草案与设计完成／后续工作边界后回复“确认”，确认整体共同理解并同意完成本票。已设为 resolved，ADR 0019 设为 accepted，并同步决策地图及 ADR 0006／0011／0012／0013／0016／0017／0018 的契约与交接指针。历史 Comments 中的待决、claimed 和 proposed 保留为讨论记录，以当前 Answer 和本次最终确认为准。

本轮完成工作流设计与文档交接，没有产品代码修改、产品测试执行或原生素材加载验收。票 06 的前置 02／03／04／05 现均已解决，票 06 保持 open；本轮没有认领或开始验收票，地图仍未完成。

验证：核对本轮 11 份交接文档的 96 个本地文件链接目标均存在、无尾随空白，git diff --check 通过；相关 ADR 已无将本票工作流决定列为尚待解决的当前表述。确认票 05 resolved、ADR 0019 accepted，票 06 保持 open 且所有前置 resolved，地图保持 open。文档验证不代表产品测试通过。
