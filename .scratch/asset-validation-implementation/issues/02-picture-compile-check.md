# 02: 显示图片在 Compile／Check 中完成最小检查路径

Status: resolved
Blocked by: None
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 02](../history/2026-10-24/issues/02-picture-compile-check.md)、[旧 10](../history/2026-10-24/issues/10-common-event-dependency-chains.md)

**What to build:** 当前 Map／Common／Troop Event 中正式和已识别 raw 的 Show Picture 能在 Compile／Check 中获得可定位的文件结果。

## Acceptance criteria

- [x] 从已验证原生保存状态收集当前事件根，覆盖页、嵌套体与未调用公共事件；排除旧快照移除根和空白 Troop Event Reset。
- [x] 建立准确 PNG 的元数据检查及缺目录、缺文件、错误类型、相关加密标志诊断；非法路径和根以下链接在查询前拒绝，03 完成特殊形态和失败细分。
- [x] 正常文件可通过，普通缺失在发布前阻止本次输出；Check 保持只读，CLI 显示稳定标识及全部已知定义位置。
- [x] 公共事件始终独立检查；共享调用、自调用与互调不复制素材来源，不收集调用图，不生成循环诊断。既有固定引用与结构校验不变。
- [x] 合法 None 和独立保存值保留；未知脚本、插件、raw 负载与插件素材声明不增加猜测扫描。

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
| A07 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| C01 | 全部保留分支；当前三类根、嵌套及移除／重置。 |
| C02 | 全部保留分支；当前三类根、嵌套及移除／重置。 |
| C04 | two-callers／common-independent-root；只报告公共事件定义位置。 |
| C05 | self-cycle／mutual-cycle／shared-callers；独立根检查，不构造调用图。 |
| C06 | 本票 A07 的原生合法 None。 |
| C08 | false-page-condition／unreached-branch 不自动降级。 |
| C11 | script-command／plugin-command／unknown-raw／recognized-raw。 |
| C12 | plugin-declaration。 |
| F01 | image。 |
| F08 | 全部基本缺失／类型分支。 |
| F13 | 全部 images 标志分支。 |
| F14 | no-images-use。 |

## Dependencies

None（可立即开始）。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

当前 Map／Common／Troop 根、嵌套和已识别 raw Show Picture 均进入 Compile／Check 的文件检查；公共事件各按定义独立检查，不展开 caller 图。

## Verification

A07、C01／C02 及本票 C／F 分支见[最终 ID 回执](../evidence/14-current-acceptance/id-receipts.json)；源码和构建后入口均随[冻结运行](../evidence/14-current-acceptance/README.md)通过，包含 Check 只读与 CLI 来源断言。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
