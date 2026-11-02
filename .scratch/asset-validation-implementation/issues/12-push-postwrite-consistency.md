# 12: Push 写后记账与输入一致性保护

Status: ready-for-agent
Blocked by: 11
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 15](../history/2026-10-24/issues/15-push-postwrite-consistency.md)

**What to build:** 完成素材门槛后只改变素材不会妨碍一致的 data 写入正常记账；真正输入或 data 不一致仍按既有规则处理。

## Acceptance criteria

- [ ] 写完 data 后删图或改变素材类型不追加扫描，证据一致则刷新 Snapshot／Manifest 并清除 pending；下一次无差异 Push 重新检查当前素材并可失败。
- [ ] 写后源、验证依赖、配置／例外、快照、生成数据或绑定异常仍保留 Interrupted Push；不把素材变化单独当作 data 恢复条件。
- [ ] 保留完整标准 data 的末端预期及受影响文件旧内容保护，不把本工具合法写入误认为外部漂移，不增加回滚或素材备份。
- [ ] 使用受控真实边界和指定 CLI 路径验证写后结果、同步状态、pending 以及素材树；不新增写后素材门槛。

### 共通要求（限本票范围）

- [ ] 按本票责任表完成现行索引的有限子用例，正式／已识别 raw 各自对照独立预期，不用被测实现计算期望。
- [ ] 在 Windows / Node.js 22 的真实临时 Workspace 中，经指定 API／实际 CLI 验证诊断与允许的状态变化；内部语义测试只作补充，故障注入留在测试子进程接口。
- [ ] 仅解释已选关系必要字段，保留 None、保存值、外部字段及所有权；实时素材不进持久基线、快照、备份或写入，素材政策仍属于编译依据。
- [ ] 保留现有公共 API／CLI，不增加测试开关、全局跳过或通用扫描框架；在本票内补 fixture、适用说明及构建后 CLI 场景，协调 Compile Contract Version。
- [ ] 记录完整用例 ID、独立预期、实际结果、环境和证据；未执行／环境受限不计通过。只有本票保留范围完成并记录 outcome 与验证后才改为 resolved。

## Acceptance ownership

下表只分配本票保留分支；准确预期、表示、字段及完整用例 ID 以[现行索引](../../asset-validation/implementation-acceptance-cases.md)为准。不得重新加入延后族。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| W06 | 全部写后只改素材的分支：正常记账，下一次 Push 再检查。 |
| W13 | 全部 postwrite 依据变更及 source 的 CLI 边界；素材变化不算依据变更。 |
| W19 | 真正 data／输入异常的 push-failure 写后部分。 |

## Dependencies

- [11：Push 写前及无差异路径的素材检查](11-push-generated-asset-preflight.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Verification

按现行验收索引执行本票分支及指定 CLI 路径，记录适用检查、构建、Windows 验证和实际结果。当前均待实施／执行；不能将失败或缺口留给最终汇总票后关闭本票。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
