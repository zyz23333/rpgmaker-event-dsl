# 11: 强制行动的技能、默认攻击与公共事件 effects

Status: resolved
Blocked by: 06, 10
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** Force Action 的固定 Skill 能同时检查动画和公共事件 effects；默认攻击按角色／敌人规则产生准确候选或停止记录。

## Acceptance criteria

- [x] B05／B16：正动画继续到 Animation，零动画只关闭动画路径，所有保存的 Common Event effects 仍逐项记录直接调用关系，不用 reservation 覆盖裁掉来源；目标作为独立根，不复制传递素材。
- [x] B06：角色默认攻击保留无武器时 Animation 1 候选及当前武器未知分支；不读初始装备冒充当前武器。
- [x] B07：敌人默认攻击选 System.sounds 槽 9，不伪造动画 ID。完整验证共用链、循环、已知兄弟路径继续以及正式／raw 的独立预期。

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
| B05 | 固定 Skill 正动画 |
| B06 | 角色默认攻击候选与未知武器停止 |
| B07 | 敌人默认攻击 sound9 |
| B16 | Skill 的全部 Common Event effects |
| C04 | repeated-common-effect：同一 Skill 的重复 effect 指向同一 Common Event 时，逐项保留直接调用位置，被调用事件的素材仍按定义位置计数。 |
| C05 | Skill effects／Common 直接关系有限表示及角色默认攻击的动态武器路径；已知动画／effects 兄弟路径继续。 |
| C06 | 本票 B05、B06、B07、B16 所有原生允许 None 的到达字段，按上游有限子用例展开。 |
| C07 | 本票 B05、B06、B07、B16 到达字段的 target-missing／field-missing／field-wrong-type／field-empty／file-missing 适用变体；固定目标与 System 字段按原索引分别处理。 |
| C12 | initial-equipment：不以初始装备替代当前武器。 |

## Dependencies

- [06：动画与更换图块组的间接检查](06-animation-and-tileset-dependencies.md)。
- [10：公共事件调用链与有界停止](10-common-event-dependency-chains.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

完成113个primary和4个supporting规范ID，源码／构建各117个精确回执，包含API与实际CLI，预期均独立。contract34的完整定向检查每入口143／143（主116、Common／Battle／契约25、System共享2）；合入03最新集成并升contract36后，代表B05／B06／B07／B16、六共享C05、契约及图片名称政策组合各入口20／20。所有矩阵串行、`--maxWorkers=1`，Windows10／Node22.23.4。typecheck、lint、format:check、build及diff检查通过。

实际实现、完整集合、测试与进程／Workspace证据、五个行为red／green切片及两次已修正测试预期失败详见[人工验收记录](../evidence/11-action-acceptance.md)与[机器合册](../evidence/11-action-acceptance.json)。本票无所属未执行分支或未修复失败，不要求新增N组原生执行。最终全仓和整规格验收属于17，原规格、决策地图及其他票状态保持各自责任。

## Outcome

当前339按捕获Skill追踪正动画、无武器Animation1候选／未知当前武器停止、敌人sound9，以及每个code44 effect的独立当前Common目标关系。零动画不抑制effects，损坏必要字段不阻断安全兄弟；直接调用有限且素材按Common定义位置计数。旧Battle fixture、文档、示例和构建Windows清单同步，公共API／CLI与素材所有权不变。完成结果和验证已记录，状态设resolved。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：native_01 完成11，合入03集成 `e103e373c26771f5ed117d7703614466c31b32cc`（此前含07／08／09／10），合并提交 `32273bef`，最终Compile Contract Version `mv-1.6.1/36`。source／built规范集合各117，完整contract34各143通过，最终36各20组合通过，仓库静态检查及build通过；具体完整日志、实际输入、独立预期、进程和SHA256见验收合册。历史98／18主矩阵及24／1契约回归失败保留，修正测试自有预期后相关完整矩阵已重跑成功，无失败转交17。

- 2026-11-02：native_01 在 `M:/Shuen/Codex/asset-validation-11-action`、`codex/asset-validation-11-action` 领取。干净工作树已 fast-forward 当前集成 `4cf156255d077f06614578dd7bf11b5e85cdfd54`，06／10 已 resolved，contract31。沿已确认 Workspace API／实际 CLI 与补充语义 seam 使用 TDD；与07／09协调大矩阵和两个共享 C05 回调，保留公共事件独立根。

- 2026-11-02 实施责任核对：上游索引已明确要求 `AV.C04.repeated-common-effect.formal.case.expected`，B16 也要求同目标重复 effect；原责任表遗漏 C04 行，现显式归属本票，不增加产品范围或新验收 token。共享规范 ID 的合并测试保留既有独立断言，避免重复注册及回执覆盖。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
