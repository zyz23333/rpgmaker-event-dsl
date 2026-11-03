# 03: 准确名称、链接与文件查询失败的检查

Status: resolved
Blocked by: 02
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 03](../history/2026-10-24/issues/03-exact-file-observation.md)

**What to build:** 作者通过 Compile／Check 区分准确文件、名称不符、不支持形式及查询失败，不将异常或替代文件当成存在。

## Acceptance criteria

- [x] 覆盖每级目录、文件名、扩展名大小写，以及双后缀、中文、空格、点号、前缀、Unicode；图片 `%`／`#`（含看似编码的 `%20`）在查询前按不支持形式拒绝，音频继续按字面名称查询。
- [x] 按最终追加文件名核对禁止字符、控制字符和保留设备名；不规范化原值或解析穿越路径。
- [x] 根别名沿用绑定规则，根以下 symlink／junction 不访问目标；硬链接、空文件和仅元数据可查的普通文件符合存在性边界。
- [x] 真实文件树与明确标注的故障注入验证枚举／元数据错误、查询内消失或类型变化；独立可检查路径继续，失败位置可定位，不回退到其他根或部署树。

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
| F02 | image-encrypted-only／other-only／exact-plus-alternative。 |
| F03 | 全部现行分支及按索引展开的实例。 |
| F04 | 全部现行分支及按索引展开的实例。 |
| F05 | 全部现行分支及按索引展开的实例。 |
| F06 | image-percent／image-hash／literal-percent20。 |
| F07 | 全部现行分支及按索引展开的实例。 |
| F09 | 全部现行分支及按索引展开的实例。 |
| F10 | 全部现行分支及按索引展开的实例。 |
| F11 | 全部现行分支及按索引展开的实例。 |
| F12 | 全部现行分支及按索引展开的实例。 |
| F14 | no-www-fallback／no-other-root。 |

## Dependencies

- [02：显示图片在 Compile／Check 中完成最小检查路径](02-picture-compile-check.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

文件观察按准确名称、目录、扩展名和普通文件元数据分类；不支持名称／链接、加密、查询失败与大小写近似项各有独立诊断，不接受替代文件。

## Verification

F02–F07、F09–F12、F14 当前责任分支的真实 Windows 文件树和明确注入用例见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)；最终源码与构建后运行均通过，原生图片特殊名称反例另见[对账](../evidence/14-current-acceptance/native-reconciliation.md)。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
