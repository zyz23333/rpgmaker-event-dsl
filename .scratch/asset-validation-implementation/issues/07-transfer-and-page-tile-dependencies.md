# 07: 传送地图与页图块的素材检查

Status: resolved
Blocked by: 06
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 固定传送地图检查其图块组、远景和 BGM／BGS；页图块只检查宿主初始图块组对应的一张 B–E 图片。

## Acceptance criteria

- [x] B08／B09 的每个字段、全部合法 B–E 选择分别验收；页图块是候选，关闭 autoplay 的保存音频仍检查并标注非活动。
- [x] 保留覆盖及播放条件；不扩展目标地图事件网络、目标地图战斗背景或整组页图块，不用运行状态猜测。
- [x] 完成 N04：原生更换图块组与页图块单图对照，区分地图绘制附带请求。补齐字段错误、None、范围反例和候选 warning 的操作验收。

### 共通要求（限本票适用范围）

- [x] 完成本票验收族中分配给本票的全部有限子用例；共享族按下表分支签收，不减少字段、表示、时机或结果，不把其他票负责的分支误记为通过。
- [x] 正式表达与已识别 raw 各自对照独立预期；按适用范围核对完整 Event Asset Use、Asset Dependency Chain、条件、None、必要字段问题及文件事实。预期不得调用被测收集器、匹配器或政策函数生成。
- [x] 在 Windows / Node.js 22 的真实临时 Workspace 中，按原索引指定的 API／实际 CLI 入口和边界验证结果及允许的状态变化。纯语义测试只作补充，故障注入位于测试子进程操作系统边界。
- [x] 保留现有公共 Workspace API 和 CLI；不新增产品测试开关、JSON CLI、全局跳过或通配符例外。素材不进入持久编译基线、快照、备份、复制或写入范围。
- [x] 补齐本票影响的既有成功 fixture 所需真实文件与必要标准字段，保留旧断言与未知字段。同步适用使用说明、样例及构建后 CLI 用例清单；行为变更协调 Compile Contract Version。
- [x] 记录完整子用例 ID、契约出处、输入、预期、实际、环境、执行方式及证据；未执行、能力受限和失败分别记录，不能以 skip 计为通过。反例按规格回到责任行为或决定处理。
- [x] 完成本票指定的原生必验并留下实际证据；原生执行条件、预加载、附带请求与候选分别说明。确需人工的操作由维护者执行留证，缺必验证据时不关闭本票。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| B08 | 固定传送 Map 全部所选字段 |
| B09 | 页图块 B–E 单槽 |
| C06 | 本票 B08、B09 所有原生允许 None 的到达字段，按上游有限子用例展开。 |
| C07 | 本票 B08、B09 到达字段的 target-missing／field-missing／field-wrong-type／field-empty／file-missing 适用变体；固定目标与 System 字段按原索引分别处理。 |
| C08 | autoplay-bgm-off／autoplay-bgs-off：保存名称仍检查，明确非活动原因保留。 |
| C12 | transfer-network：不沿目标地图事件网络展开。 |
| N04 | 整组图块与 B–E 页单图 |

## Dependencies

- [06：动画与更换图块组的间接检查](06-animation-and-tileset-dependencies.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。

2026-11-02 完成：独立主规范157个ID（自动化155、N04原生2）全部覆盖；补充10个自动化ID与原位扩展的共享C08一个，源码／构建各166条最终通过回执，各含168次真实CLI进程。完整构建主矩阵165／165；源码主矩阵160通过、5个fixture缺目录而非缺文件的失败，补齐准确目录后全部重试通过，原始失败与最终8／8保留。五套受影响旧回归源码178／178、构建178／178、零跳过。最终合08／09组合源码16／16、构建16／16；过滤未选415项不计通过。根build、typecheck、lint、format:check与diff检查通过。

N04两个规范ID由五次独立首次实际原生进程完成（整组282一次、页B／C／D／E各一次），49项独立断言、outer exit0、status observed全部通过。native_01只读peer审阅无发现，440次SHA256核对匹配；预加载、实际282、页单图消费者与地图绘制附带请求分别记录。没有重跑已过原生，也没有将空占位文件或静态分析当作原生执行。

Outcome：固定201检查捕获目标Map的Tileset全命名槽、远景与保存BGM／BGS，保留覆盖／autoplay条件与关闭后的非活动原因。Map Event Page仅检查捕获宿主初始Tileset所选B–E单槽候选；变量201停止于明确原生来源并继续安全兄弟检查。外部资料只读，不恢复被移除事件根，不扩展目标Map事件网络或battleback。既有成功fixture补足准确普通文件与必要字段，原断言／未知字段保留；README与显式Windows构建后清单已同步。

已将08集成4cf15625和09最新集成9d860dac合入，最终产品组合提交68d7205a，Compile Contract Version `mv-1.6.1/33` 高于当前集成32。产品／测试／构建的阶段哈希、336次真实CLI结果、逐项输入／独立预期／实际、TDD red／green、失败／修正和原始报告见 [验收说明](../evidence/07-map-acceptance.md) 与 [机器合册](../evidence/07-map-acceptance.json)。父任务后续接受的图片 `%`／`#` 不支持决定由其对应票落实；本票普通名称与N04关系观察不受影响，未关闭其他票或整规格。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：picture_02 完成07并签收N04；产品8030b14f、缺文件fixture修正3bcc85c5、合08为8b645aaf、合09及contract33为68d7205a。全部本票最终回执与受影响旧回归通过，native_01 peer无发现；未将原始失败、过滤未选项或计划ID当作通过。工单resolved，等待父任务merger集成；工作树保留至父任务清理。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。

- 2026-11-02：基于 integration 898b87db（06 resolved）领取；干净工作树快进，包 typecheck 与既有 dependency-data 4/4 基线通过。按已确认 Workspace/API、实际 CLI、纯关系补充及原生 N04 seams 使用 TDD 实施。
