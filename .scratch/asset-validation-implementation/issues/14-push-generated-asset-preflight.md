# 14: Push 从生成事件检查素材及无差异路径

Status: resolved
Blocked by: 13
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** Push 从当前 Generated Project Data 重建使用，在首次项目替换前检查素材；没有数据差异时同样检查。

## Acceptance criteria

- [x] 验证完整性／Freshness／漂移后使用生成事件和对应快照，定义内使用及直接公共事件调用关系完整，移除根不回流；模块求值哨兵证明不重新求值 DSL，不信任历史素材报告。
- [x] 无差异也检查且单纯素材失败不创建 pending；写前错误／暂存后变化不开始替换。写前核对 source、验证依赖、config／exceptions、snapshot、generated、binding。
- [x] Compile 后删图仍可保持 Freshness，Diff 不查素材；Push 失败后补图且其他依据当前，可直接重试。初次写前及无差异的 CLI／API 状态断言齐备。

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
| C13 | push-success：只允许既有 owned data 改变，素材与外部字段保持边界。 |
| W05 | Push 首次替换前错误／暂存后变化 |
| W07 | 无差异素材错误／data 漂移 |
| W08 | Compile → 删除 → Diff → Push 失败 → 修复 → 重试 |
| W11 | Push 唯一写前素材门槛：七种相关变化按当前事实判断，补齐可成功，不要求因改善重跑。 |
| W13 | source／validation-dependency／config／exception／snapshot／generated／binding 全部 prewrite；source 另有指定 CLI 边界。 |
| W19 | push-success／push-failure 的写前失败：素材不进快照、备份、复制、写入。 |
| W20 | 生成根与链／不求值 DSL／不信历史报告全部分支 |

## Dependencies

- [13：Compile／Check 重查与输出有效性](13-compile-check-consistency.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口完成本票验证；最终全量核对仍由17负责。本票30个primary规范ID在源码／构建各30／30，另四项补充检查各通过，因此新suite为34／34。W12原owner13唯一callback作为reference-only支持各选跑一项（64过滤不计通过）。13个旧suite共476项：源码首次474通过、两项M盘fsutil准备失败；移至默认C TEMP补跑原两项2／2（169过滤不计通过），组成476个唯一成功。构建入口同13suite在默认C TEMP为476／476。typecheck、lint、format、build、空白差异、链接及冻结断言源哈希检查通过。原始失败与修复均保留，没有转移为17的待修项。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Outcome

2026-11-02：Push使用当前生成根及完整捕获Snapshot执行唯一写前素材门槛；无差异同样检查。门槛前素材失败不建立新pending或替换，修复媒体可用原fresh生成输出重试。source、验证依赖、配置／例外、Snapshot、generated和binding在首次替换／无写入完成前重新核对；早期拒绝明确not-run。真实Debugger观察器source／built均为Compile计数1、正常Push明确0、同source Check计数1，且无pause。CLI错误保留单份素材报告与有限直接边。Compile Contract升为`mv-1.6.1/38`。

冻结实现／断言为`7e6970f61cfc29dd7f58d16c220cfc73d16332d5`，基于integration `81a4284ad674bd4e5f7e607ffd8d7e461bfd2161`。详见[验收说明](../evidence/14-push-acceptance.md)、[逐ID机器合册](../evidence/14-push-acceptance.json)及[原始历史清单](../evidence/14-run-history/manifest.json)。W19共享回调本票只签收写前失败；15写后正常记账、16恢复、17全仓／原生最终验收仍由各票完成。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：native_01完成本票主责30个ID和适用回归，记录outcome／验证后标记resolved。工作树留给父代理通过merger集成与清理；原规格和决策票状态未改。

- 2026-11-02：native_01 在 `M:/Shuen/Codex/asset-validation-14-push`、`codex/asset-validation-14-push` 领取。已确认旧工作树clean后快进 `81a4284ad674bd4e5f7e607ffd8d7e461bfd2161` 并验证ancestor，13已resolved，contract37。按已确认公开Workspace API／实际CLI／测试子进程OS边界与真实Debugger条件观察器逐片TDD；独立计划为30个primary（29W＋C13）及W12 supporting，不提前登记15／16。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
