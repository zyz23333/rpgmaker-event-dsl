# 11: Push 写前及无差异路径的素材检查

Status: resolved
Blocked by: 10
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 14](../history/2026-10-24/issues/14-push-generated-asset-preflight.md)

**What to build:** Push 从已验证生成事件和对应快照重建素材使用，在暂存后且 pending／首次替换前检查一次，无差异返回前也检查。

## Acceptance criteria

- [x] 完整性、Generated Freshness 和完整标准 data 漂移前置通过后，采用完整生成事件和一致快照；公共事件只按独立根检查，旧快照移除根不回流。
- [x] 模块求值哨兵证明 Push 不再次求值 DSL，不信任历史素材报告；与 Compile 共用原生保存状态规则。
- [x] 当前素材 error 不开始替换、不创建本次 pending，并清理暂存；门槛前补齐按当前事实通过，无差异失败也不制造 pending。
- [x] Compile 后删图可保持 Freshness，Diff 不查；Push 失败后补图且其他依据当前可直接重试，无需因补图而重编译。
- [x] 验证写前源、验证依赖、配置／例外、快照、生成数据及绑定保护和原有漂移规则；素材保持只读，不进入快照、备份或写入。

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
| C13 | push-success。 |
| W05 | 现行全部分支，保留指定 API／CLI 入口。 |
| W07 | 现行全部分支，保留指定 API／CLI 入口。 |
| W08 | 现行全部分支，保留指定 API／CLI 入口。 |
| W11 | push-gate 的全部七种门槛前变化，补齐按当前事实通过。 |
| W12 | Push 的下一命令实际查询补证，不读取历史成功报告。 |
| W13 | 全部 prewrite 依据变更及 source 的 CLI 边界。 |
| W19 | push-success 及 push-failure 写前部分。 |
| W20 | 现行全部分支，保留指定 API／CLI 入口。 |

## Dependencies

- [10：Compile／Check 的单次素材检查与发布保护](10-compile-check-single-gate.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

Push 从已验证生成事件及对应快照重建使用，不重新求值 DSL；写前暂存后及无差异返回前按当前素材事实检查，素材错误不创建本次 pending。

## Verification

C13 Push、W05／W07／W08／W11–W13／W19／W20 的检查点、无差异、补图重试和模块求值哨兵见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)，源码与构建后运行通过。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
