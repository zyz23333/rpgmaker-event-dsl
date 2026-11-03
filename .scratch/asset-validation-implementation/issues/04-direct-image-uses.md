# 04: 事件页、图像指令与移动图像的检查

Status: resolved
Blocked by: 02
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 04](../history/2026-10-24/issues/04-direct-image-uses.md)、[旧 07](../history/2026-10-24/issues/07-transfer-and-page-tile-dependencies.md)

**What to build:** 页图像、脸图、战斗背景、远景、角色／载具图像及两种移动路线的直接图像均能在编译中检查。

## Acceptance criteria

- [x] 覆盖 A01／A02／A13–A17 每个字段，适用的正式／raw 分别对照独立预期；None、已有 Compiler Default 和独立索引值保留。
- [x] 非 custom 自主路线和图块页保留的 characterName 仍检查并标明明确非活动状态；页条件或未执行分支不因此降级。
- [x] 205／505 镜像关联同一次使用及两处原生位置，不丢失其他真实指令的独立来源。
- [x] 页图块不引出宿主初始 Tileset 素材；直接 characterName 的检查不受该关系延后影响。

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
| A01 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A02 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A13 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A14 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A15 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A16 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A17 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| C03 | route-mirror／independent-command 的 image 字段；205／505 关联一次，其他真实来源保留。 |
| C06 | 本票 A01、A02、A13、A14、A15、A16、A17 的原生合法 None。另含 default-page-image／default-page-route／saved-image-index。 |
| C08 | route-fixed／route-random／route-approach 的图像及 tile-with-character。 |
| C11 | route-script；不猜测脚本名称。 |
| C12 | page-initial-tileset；不漏掉直接 characterName。 |

## Dependencies

- [02：显示图片在 Compile／Check 中完成最小检查路径](02-picture-compile-check.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

页图像、脸图、背景、远景、角色／载具图像及两种 Movement Route 使用保留原生位置；205／505 镜像合并一次，明确非活动保存字段保留条件。

## Verification

A01／A02／A13–A17 及本票 C03／C06／C08／C11／C12 分支见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)；准确文件、逐字段缺失、正式／raw 和延后页图块范围反例在[冻结运行](../evidence/14-current-acceptance/README.md)通过。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
