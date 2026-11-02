# 08: 敌人战斗图与加入角色候选的检查

Status: resolved
Blocked by: 06
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 固定敌群成员、敌人变身和加入角色的已选素材关系得到检查，并正确显示前／侧视及初始候选条件。

## Acceptance criteria

- [x] B03／B04 包含 hidden 和重复成员；使用 System.optSideView 选择准确敌人目录。仅有 Troop Event 身份不扫描宿主敌群图片。
- [x] B10 只包含 Actor 初始 character／battler 候选，不增加 face、初始装备、移除重排或 HP 副作用；保留覆盖、侧视及有效战斗队员条件。
- [x] 完成 N05／N06：前／侧视目录和一个已选初始候选被运行时设置覆盖的实际场景；自动化验证每个字段、来源、问题级别和排除范围。

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
| B03 | 固定敌群成员与前／侧视 |
| B04 | 变身后 Enemy |
| B10 | 加入角色两个候选 |
| C04 | repeated-enemy：重复成员保留各成员来源。 |
| C06 | 本票 B03、B04、B10 所有原生允许 None 的到达字段，按上游有限子用例展开。 |
| C07 | 本票 B03、B04、B10 到达字段的 target-missing／field-missing／field-wrong-type／field-empty／file-missing 适用变体；固定目标与 System 字段按原索引分别处理。 |
| C09 | actor-hp／vehicle-position 均不扩大素材关系 |
| C10 | unrelated-actor／troop-host-only：不因条目或宿主身份扩大关系。 |
| C12 | enemy-ai：不展开敌人 AI 技能。 |
| N05 | 敌人前／侧视 |
| N06 | 运行时覆盖已选 Actor 初始候选 |

## Dependencies

- [06：动画与更换图块组的间接检查](06-animation-and-tileset-dependencies.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。

2026-11-02 Outcome：固定敌群所有成员及 Enemy Transform 到达准确前／侧视战斗图；加入 Actor 到达两个带条件初始候选。使用同一捕获 Snapshot 的窄外部读取，完整链／必要字段错误／安全兄弟关系／合法 None 分别保留；候选 missing 为 warning，必要输入仍 error。移除、HP、载具位置、未选 Actor、Troop宿主、Enemy AI不扩大范围。README、旧fixture和显式Windows清单同步，contract31。

Verification：89个规范ID精确对账，source86／86、built86／86、N05/N06原生3／3（22断言）。最终source／built组合各122／122，另补移除范围各1／1；旧Snapshot成功/Enemy99负例、Battle及当前契约各7／7。typecheck、lint、format:check、build及diff检查通过。所有输入、独立预期、实际CLI、原生真实绘制、失败尝试和哈希详见 [验收说明](../evidence/08-battler-acceptance.md)／[机器合册](../evidence/08-battler-acceptance.json)。未改图片特殊名称政策及其他票状态。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：native_01 完成08，产品主体 `ff477804`、旧Snapshot构建入口适配 `b029c71e`；已包含当前集成 `898b87db`，本票resolved。09单独负责动态301停止及System兄弟，最终全仓签收由17负责。

- 2026-11-02：native_01 在 `M:/Shuen/Codex/asset-validation-08-battlers`、`codex/asset-validation-08-battlers` 领取。干净工作树已 fast-forward 集成 `898b87db`，contract30，既有契约回归 1／1 通过。按已确认 Workspace／实际 CLI 与补充纯语义 seam 进行 TDD；N05／N06 将单独实际原生执行留证。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
