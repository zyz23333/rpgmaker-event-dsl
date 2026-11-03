# 10: Compile／Check 的单次素材检查与发布保护

Status: resolved
Blocked by: 09
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 13](../history/2026-10-24/issues/13-compile-check-consistency.md)

**What to build:** Check 返回前和 Compile 发布前各完成一次当前素材检查，保留编译输入保护并使检查结果具有明确时点。

## Acceptance criteria

- [x] Check 的 initial／fresh／stale 与成功／error／warning 组合均只读；普通素材 error 不发布本次输出。
- [x] 门槛前删图或补图按当前事实判断；检查后到返回／Manifest 提交前仅改变素材不再查询、不使发布失败。发布 I/O 或编译输入变化仍按原无效状态边界处理。
- [x] 验证同次查询复用、下一命令查当前事实及不累积历史来源；内容、大小、时间、文件身份和无关目录项变化不触发比较。
- [x] 动画／图块未 Pull 改名时使用一致快照，Pull 后重新编译；配置、规则、绑定和类型依赖保持既有新鲜度要求。
- [x] Clone／Pull／Decompilation／Diff 不扫描素材；检查不改写外部数据、素材或保存名称。

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
| C03 | repeated-command 的 image／se，下一命令不累积历史来源。 |
| C13 | check-success／check-failure。 |
| W01 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W02 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W03 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W04 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W09 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W10 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W11 | check-gate／compile-gate 的全部七种门槛前变化；不比较跨时点事实。 |
| W12 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W14 | pull／rebind／contract-change／check-does-not-refresh。 |
| W17 | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W19 | compile-success／compile-failure。 |

## Dependencies

- [09：精确素材例外与可定位诊断](09-exceptions-and-actionable-diagnostics.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

Check 在返回前、Compile 在发布前各完成一次当前素材检查；输入保护、Check 只读和下一命令重新观察文件事实均保留。

## Verification

C03／C13、W01–W04／W09–W12／W14／W17 及 Compile W19 的真实检查点、状态和 CLI 断言见[ID 回执](../evidence/14-current-acceptance/id-receipts.json)，随[冻结运行](../evidence/14-current-acceptance/README.md)通过。

最终公共门槛在冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 环境执行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）。三份原始日志见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
