# 09: 精确素材例外与可定位诊断

Status: resolved
Blocked by: 03, 06
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 12](../history/2026-10-24/issues/12-exceptions-and-complete-diagnostics.md)

**What to build:** 作者可为一个准确素材填写原因，将允许问题降为 warning，并在 CLI 获得分组结果、全部定义来源及未检查说明。

## Acceptance criteria

- [x] 严格解析 assetCheckExceptions：省略等同空数组，新初始化写入空数组；准确 category／folder／name／reason、重复、额外字段与错误类型分别验证。
- [x] 仅已确认缺失、名称不符、类型不符的 error 可降级；普通／明确非活动使用保留各自结果。支持范围、必要输入、实际查询失败及既有 Gate／引用／结构错误不能被例外绕过。
- [x] 保留事实、稳定标识、基础／有效级别、例外原因、原生位置、局部链和完整性；分组取最高有效级别、排序稳定，独立安全检查继续，不压成第一条异常。
- [x] 不收集公共调用报告、不要求三套精确统计、不诊断合法例外是否实际降级；无使用例外不扩大扫描。
- [x] 例外进入 Compile Baseline、Manifest 与已理解 pending 的政策格式；历史依据按原结构验证，不填新默认重算旧 hash，政策改变要求重编译。

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
| C11 | Script Gate／结构／引用错误不能由素材例外绕过。 |
| D01 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D02 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D03 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D04 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D06 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D07 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D08 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D09 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D10 | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| W14 | exception-change。 |

## Dependencies

- [03：准确名称、链接与文件查询失败的检查](03-exact-file-observation.md)。
- [06：动画、图块组与固定技能正动画的检查](06-animation-tileset-and-skill-assets.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

带原因的精确例外仅降级可豁免的已确认文件问题；报告保留全部定义位置、事件内链、条件、基础／有效级别和未检查说明，非法配置阻止操作。

## Verification

D01–D04、D06–D10、C11 和 W14 例外变更的 API／CLI 断言见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)，源码与构建后运行通过；D05 延后规则未恢复。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
