# 06: 动画、图块组与固定技能正动画的检查

Status: resolved
Blocked by: 05
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 06](../history/2026-10-24/issues/06-animation-and-tileset-dependencies.md)、[旧 07](../history/2026-10-24/issues/07-transfer-and-page-tile-dependencies.md)、[旧 11](../history/2026-10-24/issues/11-forced-action-dependencies.md)

**What to build:** 播放动画、更换图块组及 Force Action 的固定 Skill 正动画沿一致快照检查素材，并提供事件内 Asset Dependency Chain。

## Acceptance criteria

- [x] 覆盖 B01／B02／B05：动画双图与逐 timing SE、全部非空 Tileset 槽、固定 Skill 到 Animation 的字段链；共享文件保留真实字段来源。
- [x] 必要字段只按消费关系读取；合法空、坏字段、缺目标与缺文件分别定位，不补读实时 data、不扫描无关条目或扩大所有权。
- [x] Skill animationId 为 0 不查询动画；默认攻击保留位置和未检查原因，不查询武器、Animation 1 或系统攻击 SE。Skill effects 不生成调用边或复制公共事件素材。
- [x] 固定传送初始化、传送网络和初始装备不增加素材查询；相应无关字段不因本检查被强制解释。
- [x] 完成 N03 动画双图／时序 SE 和 N04 Change Tileset 整组图片的原生核对；页图块单图分支不属于本票。

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
| B01 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B02 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B05 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| C04 | repeated-tileset-name／repeated-common-effect；同名槽保留局部来源，effects 不复制根使用。 |
| C05 | default-attack；保留未检查原因，不查询回退素材。 |
| C06 | 本票 B01、B02、B05 的原生合法 None。另含 zero-skill-animation。 |
| C07 | 本票 B 族全部适用 target-missing／field-missing／field-wrong-type／field-empty／file-missing；System 不伪造固定引用。 |
| C10 | unrelated-animation／unrelated-field。 |
| C12 | initial-equipment／transfer-network／actor-default-attack／enemy-default-attack／transfer-initial-assets。 |
| N03 | animation-images／animation-timing-se。 |
| N04 | 仅 change-tileset；page-tile 延后。 |

## Dependencies

- [05：音频与影片的直接检查](05-direct-audio-and-movie-uses.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

Show Animation、Change Tileset 和固定 Skill 正 Animation 的到达素材均保留事件内依赖链；默认攻击记录动态停止，Skill effects、传送及页图块延后关系不扩展。

## Verification

B01／B02／B05 与本票 C04–C07／C10／C12 分支，包括新增所选字段矩阵，随[冻结运行](../evidence/14-current-acceptance/README.md)通过。N03 的 2 项和保留 N04 Change Tileset 的 1 项来自历史真实运行，并与最终代码完成[原生对账](../evidence/14-current-acceptance/native-reconciliation.md)。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
