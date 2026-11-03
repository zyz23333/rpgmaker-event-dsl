# 07: 固定敌群与敌人变身素材的检查

Status: resolved
Blocked by: 06
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 08](../history/2026-10-24/issues/08-enemy-and-actor-candidates.md)

**What to build:** 固定 Battle Processing 与 Enemy Transform 的战斗图得到检查，目录随前／侧视模式选择，错误可追溯到成员或 Enemy 字段。

## Acceptance criteria

- [x] 覆盖 B03／B04，hidden 成员仍检查，重复成员保留各自路径；System.optSideView 只选择对应敌人目录。
- [x] 动态敌群目标保留位置及未检查原因，不推导战斗默认音频或背景；必要字段错误与素材缺失分开。
- [x] 加入 Actor、修改 HP、载具位置、无关 Actor、敌人 AI 和仅有 Troop Event 宿主身份均不扩大素材范围；Actor 初始图像不作为候选检查。
- [x] 完成 N05 前视／侧视目录的实际原生观察及正式／raw、字段变体的自动化。

### 共通要求（限本票范围）

- [x] 按本票责任表完成现行索引的有限子用例，正式／已识别 raw 各自对照独立预期，不用被测实现计算期望。
- [x] 在 Windows / Node.js 22 的真实临时 Workspace 中，经指定 API／实际 CLI 验证诊断与允许的状态变化；内部语义测试只作补充，故障注入留在测试子进程接口。
- [x] 仅解释已选关系必要字段，保留 None、保存值、外部字段及所有权；实时素材不进持久基线、快照、备份或写入，素材政策仍属于编译依据。
- [x] 保留现有公共 API／CLI，不增加测试开关、全局跳过或通用扫描框架；在本票内补 fixture、适用说明及构建后 CLI 场景，协调 Compile Contract Version。
- [x] 记录完整用例 ID、独立预期、实际结果、环境和证据；未执行／环境受限不计通过。只有本票保留范围完成并记录 outcome 与验证后才改为 resolved。

## Acceptance ownership

下表只分配本票保留分支；准确预期、表示、字段及完整用例 ID 以[现行索引](../../asset-validation/implementation-acceptance-cases.md)为准。不得重新加入延后族。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| B03 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B04 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| C04 | repeated-enemy；每个成员路径保留。 |
| C05 | dynamic-troop；不伪造已确定目标或检查通过。 |
| C06 | 本票 B03、B04 的原生合法 None。 |
| C07 | 本票 B 族全部适用 target-missing／field-missing／field-wrong-type／field-empty／file-missing；System 不伪造固定引用。 |
| C09 | actor-hp／vehicle-position，均不扩展素材。 |
| C10 | unrelated-actor／troop-host-only。 |
| C12 | enemy-ai／actor-initial-images。 |
| N05 | enemy-front／enemy-side。 |

## Dependencies

- [06：动画、图块组与固定技能正动画的检查](06-animation-tileset-and-skill-assets.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

固定 Troop 的全部成员及 Enemy Transform 通过 Enemy.battlerName 选择前／侧视目录；动态目标停止且不推断延后 Actor／默认攻击素材。

## Verification

B03／B04 与本票 C04–C07／C09／C10／C12 分支见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)，源码与构建后运行通过。N05 前／侧视 2 项来自历史真实运行并完成[原生对账](../evidence/14-current-acceptance/native-reconciliation.md)。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
