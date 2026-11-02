# 12: 准确例外与完整的多来源诊断

Status: resolved
Blocked by: 03, 07, 10
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 作者可为准确素材填写原因，将允许的问题降为 warning，并在 CLI 获取分组结果、全部来源及检查未完成原因。

## Acceptance criteria

- [x] 增加严格 assetCheckExceptions 配置，省略等同空数组，新初始化写入空数组；category／folder／name／reason、重复、额外字段和准确匹配分别验证。
- [x] 三类允许问题只降 error → warning；候选／非活动和普通使用保留独立级别。支持范围问题在候选／非活动为 warning 并标明未检查，普通仍 error，例外不得降级；必要字段、查询失败及单次查询矛盾始终 error。无实际降级警告及不完整时抑制正确。
- [x] 完成 D01–D10 的全部组合：稳定代码、组／文件／使用统计、共同失败、独立结果继续、位置／链／条件／原因及实际 CLI 退出。必要信息不压成第一条异常。
- [x] 配置政策进入基线、Manifest 及已理解 pending 格式；测试旧格式按原结构验证，不先填新默认重算历史 hash。完整运行恢复的责任仍在 16。

### 共通要求（限本票适用范围）

- [x] 完成本票验收族中分配给本票的全部有限子用例；共享族按下表分支签收，不减少字段、表示、时机或结果，不把其他票负责的分支误记为通过。
- [x] 正式表达与已识别 raw 各自对照独立预期；按适用范围核对完整 Event Asset Use、Asset Dependency Chain、条件、None、必要字段问题及文件事实。预期不得调用被测收集器、匹配器或政策函数生成。
- [x] 在 Windows / Node.js 22 的真实临时 Workspace 中，按原索引指定的 API／实际 CLI 入口和边界验证结果及允许的状态变化。纯语义测试只作补充，故障注入位于测试子进程操作系统边界。
- [x] 保留现有公共 Workspace API 和 CLI；不新增产品测试开关、JSON CLI、全局跳过或通配符例外。素材不进入持久编译基线、快照、备份、复制或写入范围。
- [x] 补齐本票影响的既有成功 fixture 所需真实文件与必要标准字段，保留旧断言与未知字段。同步适用使用说明、样例及构建后 CLI 用例清单；行为变更协调 Compile Contract Version。
- [x] 记录完整子用例 ID、契约出处、输入、预期、实际、环境、执行方式及证据；未执行、能力受限和失败分别记录，不能以 skip 计为通过。反例按规格回到责任行为或决定处理。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| C11 | 既有 Script Gate／结构失败不被 Asset Check Exception 绕过。 |
| D01 | 全事实 × 合法普通／候选／非活动表示组合 |
| D02 | 全部不可豁免组合及 reference／structure／script Gate |
| D03 | 三类可降级、多来源与准确键区别 |
| D04 | 全部配置错误 |
| D05 | repaired／unused／warning-only／incomplete |
| D06 | 混合级别及组／文件／使用独立计数 |
| D07 | 公共目录／字段失败及无合法目标 |
| D08 | 独立结果继续及各早期失败完整性 |
| D09 | 全部列出定位／链／源码可靠性；各来源票先验收自身位置 |
| D10 | 全部实际 CLI 结果分支 |
| W14 | exception-change：例外政策改变使编译依据过期，不能以当前检查升级旧输出。 |

## Dependencies

- [03：准确名称、链接与文件查询失败的检查](03-exact-file-observation.md)。
- [07：传送地图与页图块的素材检查](07-transfer-and-page-tile-dependencies.md)。
- [10：公共事件调用链与有界停止](10-common-event-dependency-chains.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。实际结果见下方 Outcome 及[验收合册](../evidence/12-exception-acceptance.md)。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：D05局部预算修复在 `154ad2cd30cf07d254ab17a819e4181ae2a95b79` 冻结后，四个既有D05 source全部通过，另外95个注册仅过滤，typecheck／lint／format:check均通过。本票恢复resolved；未运行99项完整诊断suite、103文件完整source、built或Windows baseline。新证据独立追加，原Outcome和31份旧证据保持；17仍claimed。

- 2026-11-02：因17在冻结 `af748ee5067f41096a296a79f81b078415096606` 的完整 source `pnpm check` 自然结束时，唯一 D05 incomplete callback 超过默认10秒预算，本票重开为 claimed。原 Outcome、Contract37签收及全部旧证据保留；本轮只修复本票既有测试的局部预算，不改产品、政策、Contract、业务分支、fixture、输入或断言。仅定向运行四个既有 D05 source 用例，默认2 workers／Node22／C TEMP；不重跑99项诊断 suite、103文件完整 source 或built。原始失败和随后11.547秒helper完成记录将分别保存于 [D05修复证据](../evidence/12-d05-budget-repair/red-and-baseline.json)，17保持claimed，等待独立验收。

- 2026-11-02：从干净预建工作树快进集成35后领取；实现并合入11／36，最终再次合最新集成显示 Already up to date，保留自身行为版本37。全部本票有限分支及组合／兼容验证通过，追加 Outcome 后设 resolved；没有提前注册16的W16，也未改原规格／地图状态。

- 2026-11-02：仅澄清既有验收 ID 编码，行为范围与数量不变，见原索引新增的 D02–D10 标识展开。D02 使用角色分支与事实字段，D03 eligible 使用事实字段，其余单因子 D02–D10 使用默认 native 表示与 case 字段。扩展 10 已有 D09 三个协作 callback 时将其 formal 表示统一为 native，保留旧断言、来源和历史回执，不另注册同义测试。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。

## Outcome

实现严格准确 `assetCheckExceptions`、初始化空数组及实时省略语义；政策进入 Compile Baseline、Manifest 和已理解 pending 的结构／hash。新 persisted config 的键顺序与新基线构造一致，旧格式的缺省键保持缺省；独立旧结构样本的原 baseline／originalManifest 固定 hash 通过验证，未用新默认重算旧依据。政策改变使旧输出 stale，成功 Check 不刷新旧输出。

三类已确认文件问题只把普通 error 降为 warning，保留逐次基础／有效级别、匹配例外与原因。候选／非活动、不可豁免、unused 及相关 incomplete 范围分别处理；已知 A 查询失败不吞掉已可判定 B 的提示。安全独立检查继续，组／合法问题文件／真实使用独立计数，全部原生来源、事件内链、条件、直接调用及可靠来源坐标保留。现有 warning／info console 与 error 失败通道保持，CLI 不丢失或重复记录，早期失败明确素材检查未运行。

D09 的原三个10协作 callback 一次迁移为 native 并扩展；原 Script／route Script Gate callback 扩充为共享所有权，未注册同义测试。11 的 forced-action uses／problems／stops 和 Skill/effect 直接调用链在合并后继续通过组合验证。没有新增公共报告 API、JSON CLI、产品测试开关、全局跳过、通配符或媒体持久状态。

验证环境为 Windows／Node22.23.4，pnpm10.33.0，所有回归串行 `--maxWorkers=1`。100 个规范主 ID、2 个共享 C11 ID、2 个补充 ID 的 source／built 共208条回执全部通过；加10个关系组合回归，最终每入口114／114。受影响既有 Workspace／workflow／compile-inputs／publication／recovery 五 suite 每入口100／100。typecheck、lint、format:check、build、diff空白及本地链接检查通过。具体 ID、输入、独立预期、实际、环境、执行方式、原始红绿及失败历史见[机器合册](../evidence/12-exception-acceptance.json)和[说明](../evidence/12-exception-acceptance.md)。过滤项未计通过；本票未运行全仓或原生媒体探针，17及16各自剩余责任保持。

产品实现提交 `099b2f06ca1bc3e9a924c1f32b3f87c8e45923cc`；工作树 `M:/Shuen/Codex/asset-validation-12-exceptions`，分支 `codex/asset-validation-12-exceptions`，Compile Contract Version `mv-1.6.1/37`。完成证据与闭票提交后以干净最终 tip 交集成 merger。

## D05 局部预算修复 Outcome（2026-11-02）

17在Contract40冻结 `af748ee5067f41096a296a79f81b078415096606` 的完整source自然结束后，唯一失败为本票D05 incomplete超过默认10000ms（runner10037ms）。原helper后来11547ms完成只作为业务体最终完成的历史记录，不当作完整runner通过。该分支包含三种独立sibling各自API／CLI的六个真实子进程边界，完整输入、诊断、状态及清理全部保留。

`createAssetTest`增加可选局部timeout参数并直接转发Vitest，仅既有D05 incomplete传30000ms；另外三个D05和全部其他helper调用继续使用默认10000ms。64个诊断callback AST全同；移除唯一外部timeout表达式后整个诊断AST全同，helper移除可选参数与转发后整个AST全同，完整async／finally回执体保持。`independentlyDeterminableExceptions`原文、所有业务输入、断言、fixture、ID及六个真实边界未改。产品源码、政策、全局配置和Compile Contract `mv-1.6.1/40`均未改。

修复代码／测试冻结 `154ad2cd30cf07d254ab17a819e4181ae2a95b79`；Windows／Node22.23.4／pnpm10.33.0、默认2workers、默认C TEMP。实际定向source runner退出0，4通过／0失败／95过滤（99注册）；incomplete耗时13478.5886ms。四条fresh source回执及六个真实子进程结果完整，typecheck／lint／format:check均退出0。本轮没有运行99项完整诊断suite、103文件完整source、built或Windows baseline。原12验收JSON／说明／raw共31份文件的字节和Git blob保持，旧Contract37 Outcome不改写。具体记录见[独立机器合册](../evidence/12-d05-budget-repair/12-d05-budget-repair.json)、[说明](../evidence/12-d05-budget-repair/12-d05-budget-repair.md)和[原始red](../evidence/12-d05-budget-repair/red-and-baseline.json)。12恢复resolved，17保持claimed，最终验收不由本次定向结果替代。
