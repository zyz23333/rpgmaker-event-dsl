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

2026-11-02 修订：用户要求按过度复杂评估进行简化。以下 Answer 是现行首版契约；此前 Comments 仅记录历史。延后能力不属于首版完成门槛。

本次只减少收集范围与报告责任，不改变单次门槛、编译依据或 data 恢复契约。

### 1. 数据视图与检查时点

沿用票 02 的定义事件起点和事件内依赖链；文件规则及严重性分别按票 03／04。Compile／Check 使用当前 Staged Data Graph 和同一捕获 Snapshot，Push 使用已验证生成事件与对应快照；素材查询绑定实时 Project Root，不补读实时标准 data。未 Pull 的标准字段变化仍由 Project Drift 拒绝，不扩大外部数据所有权。

| 操作 | 素材职责 |
| --- | --- |
| Compile | 完整候选与必要输入校验后、发布生成数据前检查一次；Manifest 前不重查素材 |
| Compile Check | 完整候选与必要输入校验后、成功返回前检查一次；不写生成数据、Manifest 或 Freshness |
| 有写入的 Push | 现有完整性／freshness／drift 前置通过、暂存完成后，在创建本次 pending 和首次替换前检查一次 |
| 无写入的 Push | 既有前置通过后、返回前检查一次；失败不创建 pending |
| Diff、Clone、Pull、DSL Decompilation | 不新增素材扫描或文件门槛，既有职责与配置合法性要求保持 |

早期错误使输入不可信时不强行检查，报告未运行。普通 error 阻止操作；warning、动态停止和支持范围警告不等同于文件已通过。

### 2. 单次结果与新鲜度

素材检查按本次所见事实判定，允许同一检查共享目标／目录查询，下一命令必须查询当前文件。取消跨检查点观察比较、改善也失败、发布期间与写后复查。不承诺同时快照、检查后持续存在或跨进程隔离。单次枚举／元数据查询内部矛盾仍属于无法完成查询的 error；不伪装为已确认缺失，也不通过额外时点比较检测变化。

实时素材条件不进入 Compile Baseline。例外政策、Compile Contract Version、源文件与依赖、快照和绑定仍属于编译依据。Compile 后删图可保持 Generated Freshness 而使下次 Push 失败；补齐且其他依据当前可直接重试。Check／恢复不升级旧输出。素材不读内容、不哈希、不进入快照、复制、备份或写入范围。

### 3. data 发布、写入及恢复

Compile 发布前的素材 error 不发布本次输出；检查后素材变化本身不再使发布失败。原有编译输入一致性检查及发布 I/O 失败边界继续有效，无效生成状态仍须成功 Compile 才可用于 Diff／Push。

Push 素材检查失败不开始 data 替换、不创建本次 pending，并按既有规则清理暂存。写入后不再查询素材，素材变化不产生或保留 Interrupted Push；data 写入与证据一致即正常完成 Snapshot／Manifest 记账。

写前／完成边界的源文件、验证依赖、相关配置、Snapshot、Generated Project Data、绑定保护继续有效，并保留完整标准 data 漂移及受影响文件旧内容检查。此类依据或 data 失败，写前停止、写后仍留 pending。不半途换政策或目标，不把本工具合法 data 写入当外部漂移。

仅 Push 按原绑定、已理解格式和一致内容证据恢复：全生成可完成记账、全旧可放弃，mixed／missing／unknown 或证据不一致拒绝自动恢复。缺素材不阻止已完成 data 记账；保留原编译依据，随后本次 Push 继续正常 freshness、drift 与素材门槛，即使无写入也检查。当前素材失败不重新保留已完成 data 的 pending。非 Push 遇 pending、同 Workspace 互斥、显式 Pull 重绑规则继续适用。

### 4. 关键场景

| 场景 | 结论 |
| --- | --- |
| 素材在本次门槛前补齐 | 按当前存在事实判定；不因改善而额外失败 |
| Check／Compile 的素材检查后文件变化 | 本次不追加素材扫描；下一操作检查当前文件 |
| Push 全部 data 写后删图 | data 正常记账，无素材引起的 pending；下次 Push 即使无差异也检查并可失败 |
| 真正 data 中断，恢复时仍缺图 | 先按 data 证据恢复；当前素材检查另行判定 |
| 标准数据库改名但未 Pull | Compile 用一致快照；Push 由标准 data 漂移拒绝 |
| 媒体内容／时间／无关目录项变化 | 不作为存在性输入或变化条件 |

### 5. 决定与交接

[ADR 0019](../../../docs/adr/0019-asset-checks-at-workflow-boundaries.md) 保留 2026-10-25 已接受的检查时点，ADR 0006／0013 的恢复及编译输入契约不变。原因是素材不决定生成字节，也不是 Push 写入对象；多轮事实相等要求增加失败与恢复分支，却不提供隔离。素材政策和作用范围仍来自票 02–04。

[验收矩阵](../acceptance-matrix.md)与[实施规格](../asset-validation-spec.md)已同步门槛前当前事实、检查后不复查、写后正常记账和原有输入保护。设计修订完成，产品实现、自动化和原生验收仍待执行。

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

### 2026-10-25 — 设计减重修订

用每次操作的一次素材门槛替换多点观察一致性，取消写后素材检查和由此引起的 pending。源／配置／快照／生成 data／绑定的保护及真正 data 中断恢复保留。此前 Q7／Q9 的变化必失败及写后素材 pending 规则被本次修订替代。

本票继续 resolved，表示本次设计修订已完成；产品实现与验收仍待执行。

### 2026-11-02 — 首版范围再次简化

Compile／Check 和 Push 重建的输入不再含公共事件调用关系；单次当前素材门槛、无差异 Push、素材不进基线、政策进基线及 data 恢复保护保持。现行 Answer、实施规格、ADR 及验收材料已同步；历史 Comments 保留。设计状态保持 resolved，产品实现和验收仍待执行。
