# 13: Interrupted Push 恢复与当前素材条件分离

Status: resolved
Blocked by: 11
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 16](../history/2026-10-24/issues/16-recovery-and-current-asset-policy.md)

**What to build:** 作者能按内容证据恢复已完成或尚未开始的 data 写入，随后独立判断本次 Push 的当前依据和素材条件。

## Acceptance criteria

- [x] 全生成可完成记账、全旧可放弃；混合、缺失、未知或不一致拒绝自动恢复。素材缺失不阻止已完成 data 记账。
- [x] 恢复完成后继续正常 freshness／drift／素材门槛；本次素材失败不重新创建已经清除的 pending。
- [x] 独立构造历史 pending，覆盖旧格式／hash、原依据过期和当前配置改变；保留原编译依据与绑定，不升级旧输出或授权新写入。
- [x] 验证同 Workspace 互斥、非 Push 遇 pending 停止、目标重绑前按原目标恢复；报告区分恢复结果与当前失败，素材不参与恢复写入或备份。
- [x] 使用独立内容证据及真实中断场景验证，无需等待 12 制造写后失败；最终联合验收由 14 完成。

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
| W15 | 全部现行内容恢复、原依据或互斥／原绑定分支。 |
| W16 | 全部现行内容恢复、原依据或互斥／原绑定分支。 |
| W18 | 全部现行内容恢复、原依据或互斥／原绑定分支。 |
| W19 | recovery。 |

## Dependencies

- [11：Push 写前及无差异路径的素材检查](11-push-generated-asset-preflight.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

Interrupted Push 依据内容证据完成全生成记账、放弃全旧状态，拒绝混合／缺失／未知；保留原绑定和编译依据，再独立判断当前 freshness、drift 和素材。

## Verification

W15／W16／W18 及 W19 recovery 的历史 pending 格式、原目标、互斥与真实中断分支见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)，源码与构建后运行通过。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
