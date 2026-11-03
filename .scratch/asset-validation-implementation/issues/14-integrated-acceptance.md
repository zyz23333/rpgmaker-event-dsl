# 14: 首版集成验收与使用说明核对

Status: resolved
Blocked by: 01, 07, 08, 12, 13
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 17](../history/2026-10-24/issues/17-integrated-acceptance.md)

**What to build:** 维护者获得当前首版的完整集成结果和可审阅回执，确认保留范围可交付。

## Acceptance criteria

- [x] 逐实例核对 86 个有效验收族及其保留分支，验证 Compile／Check／Push 对完整当前根与七族间接关系使用同一规则。
- [x] 复核 N01–N05 当前保留分支的真实证据；11 个延后族及撤销子分支不属于首版门槛，不作为通过或环境 skip。
- [x] 执行现行规格要求的 Windows / Node.js 22 仓库检查、构建与构建后 CLI 验证，核对源码及构建入口覆盖。
- [x] 审阅公开说明、例外示例、文件存在性边界、补图重试／恢复流程和延后范围；缺口退回责任票，保留行为测试不能转交本票补写。
- [x] 没有当前范围内未解决的契约反例、必验未执行或证据矛盾后，提供实际回执供维护者确认；不以本票发布宣称功能已完成。

## Acceptance ownership

下表只分配本票保留分支；准确预期、表示、字段及完整用例 ID 以[现行索引](../../asset-validation/implementation-acceptance-cases.md)为准。不得重新加入延后族。

审计全部 **86 个有效族**：A01–A18、B01–B05／B11–B12、C01–C13、F01–F14、D01–D04／D06–D10、W01–W20、N01–N05 的保留分支。实施责任见[责任分配](../ticket-breakdown-draft.md#验收责任分配)，本票不替前票补写欠缺的实现或测试。

## Dependencies

- [01：核实原生媒体定位与特殊名称](01-native-media-locations.md)。
- [07：固定敌群与敌人变身素材的检查](07-enemy-asset-dependencies.md)。
- [08：Game Over 与 Return to Title 素材的检查](08-game-over-and-title-assets.md)。
- [12：Push 写后记账与输入一致性保护](12-push-postwrite-consistency.md)。
- [13：Interrupted Push 恢复与当前素材条件分离](13-recovery-and-current-asset-policy.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Outcome

当前首版 86 族的技术验收已取得完整自动化运行和 12 个保留原生 ID 的证据对账。维护者已审阅公开说明和回执，并确认首版交付。

## Verification

冻结提交 `403b39aa` 的 Windows 10 / Node.js 22.23.0 最终运行：`pnpm check` 退出 0（105 文件、3064 测试通过），`pnpm build` 退出 0，`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 退出 0（44 文件、1494 测试通过）；源码与构建后入口各含相同的 895 个互不重复 `AV.` ID，当前有限 ID 无缺失、无 skip。原始日志、逐 ID 回执、86 族对照和 N01–N05 的 12 个历史真实原生 ID 与最终代码政策核对，见[当前技术验收回执](../evidence/14-current-acceptance/README.md)。先前中断／失败的中间提交运行没有计作本次通过。

**维护者最终确认已完成。** 公开使用说明、例外示例、存在性边界、补图重试／恢复流程及延后范围已审阅；本票与父规格按现行首版范围关闭。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。

### 2026-11-03 — 维护者确认首版验收

维护者审阅[当前技术验收回执](../evidence/14-current-acceptance/README.md)及公开说明后，回复“确认验收并关闭（推荐）”。当前 86 族的自动化、N01–N05 保留原生证据及三条 Windows / Node.js 22 命令均已实际核对；没有未解决的当前范围反例、必验缺口或证据矛盾。按已接受完成门槛，本票设为 resolved，父规格同步关闭；11 个延后族不计入本次通过。
