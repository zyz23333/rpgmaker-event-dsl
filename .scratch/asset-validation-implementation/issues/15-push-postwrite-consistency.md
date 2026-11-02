# 15: Push 写后记账与完整输入保护

Status: resolved
Blocked by: 14
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 全部项目 data 替换后保留完整输入及 data 证据保护；不再查素材，素材变化本身不阻止正常同步记账。

## Acceptance criteria

- [x] 写后素材缺失或类型变化不追加扫描；data 证据一致则记账并清 pending，下一次无差异 Push 按当前素材失败且不创建 pending。
- [x] 完成写后 source、验证依赖、config／exceptions、snapshot、generated、binding 变化；保留全标准 data 漂移和逐文件旧内容保护，不把自身合法写入当外部漂移。
- [x] API 及指定 CLI 在真实边界暂停后核对 data、Snapshot、Manifest、pending 与素材树；稳定文件事实正常成功，素材不加入备份／写入。

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
| W06 | 全部 data 写后删除／类型变化不阻止记账；下一次无差异 Push 当前检查失败。 |
| W11 | 素材当前事实判定由 13／14 在唯一门槛验证，本票验证记账前不追加素材检查。 |
| W13 | source／validation-dependency／config／exception／snapshot／generated／binding 全部 postwrite；source 另有指定 CLI 边界。 |
| W19 | 素材变化正常记账；编译输入／data 证据写后失败保留既有 data 写入及 pending，素材保持只读。 |

## Dependencies

- [14：Push 从生成事件检查素材及无差异路径](14-push-generated-asset-preflight.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。当前所有产品测试和原生检查均为待实施／未执行，完成时追加实际结果。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Outcome

2026-11-02完成。普通 Push 在全部 Project Root data 替换后、正常记账前复核 Workspace／真实根绑定、generated integrity 和完整 Freshness，保留完整标准 data 末端漂移和逐文件旧内容保护。历史恢复产品代码未改；写后素材缺失／类型变化正常记账，下一次无差异 Push 实查当前素材失败而不建 pending。Compile Contract Version 为 `mv-1.6.1/39`。

最终产品与断言冻结 `5dbf1c41447ffe52fca954e9bed0305f0e33add8`。本票12个 primary ID，source／built各12条，共24条通过；W19 success supporting各一条，共2条通过。14原唯一W19 failure／success callback保留原断言并扩展为owner `14,15`，C13仍owner14。source／built完整Push suite各45／45、零过滤。旧五suite source首轮85／86，仅normal写后更早integrity诊断的旧文字断言失败；保留全部状态保护，窄补原失败1项通过，43过滤不计，与原85项为86唯一成功。built同集86／86、零过滤。build／typecheck／lint／format／Git空白检查通过。

详见[验收说明](../evidence/15-postwrite-acceptance.md)、[机器合册](../evidence/15-postwrite-acceptance.json)及[原始记录](../evidence/15-raw/)。首个真实source写后红例、两次binding测试边界／观察器失败、首轮hash预期31／45失败、旧回归85／86及补验均保留，未改写成单次全通过。原红例断言由记录插入和Git基底重建，并按实际red回执SHA核对字节完全一致后归档。canonical执行冻结0212a757与最终5dbf1c41仅相差旧诊断断言，产品／canonical／适配器Git差异为空，未伪称重复执行。

本票仅签收W06、W13 postwrite和W19写后数据保护及支持成功场景；无新增W11后置素材门槛，不提前签收16历史恢复新义务或17全仓与原生最终验收。所有真实测试为Windows／Node22、默认C TEMP、单worker；worktree保持M盘。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：acceptance_exploration 在 `M:/Shuen/Codex/asset-validation-15-postwrite`、`codex/asset-validation-15-postwrite` 领取。工作树原先clean，已快进并验证包含integration `88fc6f95ead560784fd0128e951058f7f8eab008`，14已resolved，Contract38。按已确认公共Workspace API／实际CLI／真实测试子进程OS边界执行TDD；独立12个主责ID和W19 success协作引用，原地扩展14唯一W19 callback并保留其断言。测试输入沿用默认C TEMP，Node22，maxWorkers1；不提前实现16或给历史恢复加当前freshness／素材条件。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
