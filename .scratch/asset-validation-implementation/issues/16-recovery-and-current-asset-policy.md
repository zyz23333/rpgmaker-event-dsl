# 16: 恢复记账与当前素材条件分开判定

Status: resolved
Blocked by: 15
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 作者能恢复已完成的 data 写入，即使素材仍缺失；恢复完成后按当前依据继续判断本次 Push。

## Acceptance criteria

- [x] 全生成内容可完成记账，再因当前素材失败时 pending 已清且不重建；全旧快照可放弃后进入正常检查；混合、缺失、未知拒绝自动恢复。
- [x] 独立历史 pending 证据覆盖旧编译政策／hash、当前配置改变及 stale 原依据：保留原结构和版本，恢复不能升级旧输出或获得新写权限。
- [x] 验证锁、非 Push 遇 pending、重绑先按原目标处理；报告区分恢复结果和当前失败，素材不进入恢复备份或写入。完成真实中断与指定 CLI 回执。

### 共通要求（限本票适用范围）

- [x] 完成本票验收族中分配给本票的全部有限子用例；共享族按下表分支签收，不减少字段、表示、时机或结果，不把其他票负责的分支误记为通过。
- [x] 正式表达与已识别 raw 各自对照独立预期；按适用范围核对完整 Event Asset Use、Asset Dependency Chain、条件、None、必要字段问题及文件事实。预期不得调用被测收集器、匹配器或政策函数生成。
- [x] 在 Windows / Node.js 22 的真实临时 Workspace 中，按原索引指定的 API／实际 CLI 入口和边界验证结果及允许的状态变化。纯语义测试只作补充，故障注入位于测试子进程操作系统边界。
- [x] 保留现有公共 Workspace API 和 CLI；不新增产品测试开关、JSON CLI、全局跳过或通配符例外。素材不进入持久编译基线、快照、备份、复制或写入范围。
- [x] 补齐本票影响的既有成功 fixture 所需真实文件与必要标准字段，保留旧断言与未知字段。同步适用使用说明、样例及构建后 CLI 用例清单；行为变更协调 Compile Contract Version。
- [x] 记录完整子用例 ID、契约出处、输入、预期、实际、环境、执行方式及证据；未执行、能力受限和失败分别记录，不能以 skip 计为通过。反例按规格回到责任行为或决定处理。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| W15 | 五种恢复 data 状态及当前素材结果 |
| W16 | 原依据过期与当前配置改变；12 提供格式兼容并先验证历史 hash |
| W18 | 竞争／非 Push 遇 pending／pending 下重绑 |
| W19 | recovery：只允许恢复数据记账语义，素材不参与恢复写入或备份。 |

## Dependencies

- [15：Push 写后复核与完整输入保护](15-push-postwrite-consistency.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。当前所有产品测试和原生检查均为待实施／未执行，完成时追加实际结果。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Outcome

- 2026-11-02：已完成本票 12 个唯一规范 ID，最终 source **12/12**、built **12/12**，均零失败、零过滤，共 24 条最终 receipt；另有12个 focused callback 各实际1 pass及匹配回执，其余过滤注册不计通过。真实 API／CLI data 中断、五种恢复状态、独立 synthetic 历史 O/N/hash、当前 Contract39 下配置变化、互斥／非 Push／原绑定、三类完整恢复状态 profile 均已落实。
- 既有 `push-recovery`、`snapshot-binding`、`workspace-locking`、`compile-inputs`、`push-drift` 五套件 source **86/86**、built **86/86**，均零失败、零过滤。typecheck、lint、format、build 已通过。所有测试 Node22、默认 C TEMP、maxWorkers1；不重复无关 F/D 矩阵。
- 产品既有行为已满足这些分支，**产品代码未改，Compile Contract仍为 `mv-1.6.1/39`**；断言、帮助代码、Windows built include 与说明冻结于 `f03e66e6e4550da8a72f98c118fbc36c3af4d1d5`。15正常写后 guards 没有移入历史恢复。12 schema金样未被用作真实runtime pending；新的历史事务明确为真实临时根下的 synthetic 原始证据，原政策省略／版本／source／type／binding及原hash验证保持。
- 两次实际测试准备失败、03–10零执行过滤报告的注册错误与更正、一次built parser启动错误均如实保留，未计为产品违约反例或通过。之后AST核对11个顶层声明展开12唯一ID、两计划一致，再以实际pass/receipt和完整矩阵签收。
- 详见[验收说明](../evidence/16-recovery-acceptance.md)、[机器合册](../evidence/16-recovery-acceptance.json)、[原始字节索引](../evidence/16-raw/manifest.json)。本票 resolved 不代表17及整套规格最终验收完成；交由merger合入integration，保留工作树供最终核对。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：picture_02 在 `M:/Shuen/Codex/asset-validation-16-recovery`、`codex/asset-validation-16-recovery` 领取。确认原工作树 clean 后已快进到含已 resolved 15 的 integration `5aab331ae7bf1f3d038a0fb7a595087b5d09156a`，Contract39。沿用已确认公共 Workspace API／实际 CLI／真实测试子进程 OS checkpoint，独立完成 12 个主责 ID；历史 runtime pending 使用明确 synthetic 临时根、实际 O/N bytes 与独立原式 hash，12 的 schema 金样只作格式出处。按当前 Contract 隔离 current-config 变化；不将正常写后 guards 移入历史恢复。Node22、默认 C TEMP、maxWorkers1，广测窗口已由主代理独占授权；baseline green 如实记录，无须制造产品补丁。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
