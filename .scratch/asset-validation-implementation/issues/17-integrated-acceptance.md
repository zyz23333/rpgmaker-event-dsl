# 17: 完整功能验收与使用说明核对

Status: claimed
Blocked by: 01, 08, 09, 11, 16
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 维护者得到可审阅的完整功能及验收回执，能够确认所有 97 族的有限子用例已有实际结果。

## Acceptance criteria

- [ ] 按已确认责任分配表审计全部实例的责任、测试和证据，运行 Windows / Node.js 22 的 pnpm check、pnpm build、pnpm --filter rpgmaker-event-dsl test:windows-baseline；核对源码与构建后 CLI 都包含新场景。
- [ ] 对当前集成实现核对完整根／关系在 Compile、Check、Push 的共用规则，复核 N01–N06 的实际证据与当前实现一致。没有未解决反例、必验未执行或环境限制遗留项才能提交完成验收。
- [ ] 核对公开说明、例外示例、文件存在性边界和修复／Push／恢复流程，汇总准确状态供维护者确认。发现缺口退回责任票，不用本票代替前票测试，也不修改已接受契约消除失败。

### 共通要求（限本票适用范围）

- [ ] 按已确认的 97 族责任表逐实例核对回执，不把族名存在或一个代表样例当成全部有限分支通过。
- [ ] 全部自动化与原生必验结果可追溯；未执行、环境受限、失败、证据矛盾或未解决反例清楚列出，不能据此宣布完成。最终验收由维护者审阅确认。

## Acceptance ownership

下列责任覆盖全部实例；具体规范预期与展开方式以原验收矩阵及子用例索引为准。

本票审计全部 **97 个族**：A01–A18、B01–B16、C01–C13、F01–F14、D01–D10、W01–W20、N01–N06。各实例的实施责任仍按[已确认责任分配](../ticket-breakdown-draft.md#验收责任分配)归属原票；本票不接收被推迟的功能测试。

## Dependencies

- [01：核实原生媒体定位与特殊名称](01-native-media-locations.md)。
- [08：敌人战斗图与加入角色候选的检查](08-enemy-and-actor-candidates.md)。
- [09：结束、标题与战斗默认素材的检查](09-system-and-battle-defaults.md)。
- [11：强制行动的技能、默认攻击与公共事件 effects](11-forced-action-dependencies.md)。
- [16：恢复记账与当前素材条件分开判定](16-recovery-and-current-asset-policy.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。本票是整套素材检查的最终验收门槛；全部必验结果齐备、反例解决并经维护者审阅确认后，才可记录完成。

## Verification

执行并记录规格要求的 Windows / Node.js 22 全量命令：`pnpm check`、`pnpm build`、`pnpm --filter rpgmaker-event-dsl test:windows-baseline`。核对源码和构建后 CLI、全体自动化实例及 N01–N06 证据；如脚本重组，仍保留相同责任。当前这些执行结果均待实施阶段提供。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
- 2026-11-02：01–16 已全部 resolved 并合入集成提交 `29f19dfd3ed943df2e0c9ae2b7c446ada248d501`。验收分支从干净 worktree 快进至该提交后领取本票；按既定公开 Workspace API 与真实 CLI 入口核对最终证据，使用 Windows / Node.js 22、默认 C TEMP、仓库原有 worker 配置执行完整命令。技术验收与双轴评审完成后仍保留 claimed，等待维护者实际审阅确认，不代填批准。
- 2026-11-02：首次完整运行冻结 `11e52e3c` / Compile Contract39，setup build通过，check的typecheck／lint／format通过；source测试在取消前实际630通过、1失败，共631条完成回执，无全量总结。根协调端确认Windows保留设备名后点前ASCII空格缺口退03修复，并要求取消本次运行；只停止本记录器所属进程树，后续build／Windows命令均未启动。C07共享System字段原失败（应保留两个独立gameOver来源、实际一个）已退09诊断。原始日志、部分回执和取消处置保存在[历史目录](../evidence/17-raw/history/11e52e3c-contract39-canceled/disposition.json)，不可计为最终通过。静态义务／原始证据／原生核对及未完成门槛见[技术验收进行稿](../evidence/17-integrated-acceptance.md)；票17继续claimed，等待修复集成后的新冻结全跑和实际维护者确认。
