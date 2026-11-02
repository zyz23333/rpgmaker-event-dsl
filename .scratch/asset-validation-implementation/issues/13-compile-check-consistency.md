# 13: Compile／Check 单次素材门槛与输出有效性

Status: resolved
Blocked by: 12
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** Check 返回前、Compile 发布前各执行一次当前素材检查；保留发布与 Manifest 提交的既有编译输入一致性保护。

## Acceptance criteria

- [x] Check 的 initial／fresh／stale × success／error／warning 全部只读；Compile 发布前失败不发布，发布已开始后的失败沿用无效输出语义，成功重编译才能恢复。
- [x] 唯一素材门槛按当前事实判断，包含补齐后成功和 warning 到 warning；检查后删图不追加扫描、不使本次发布失败。内容、大小、时间、文件身份及无关目录项不比较；新命令重新查询且逻辑计数稳定。
- [x] 验证快照与实时素材的区别、未 Pull 标准数据改变及 Pull 后重编译、规则／绑定／政策新鲜度；Clone／Pull／Decompilation／Diff 不新增实时素材扫描。
- [x] 受控子进程验证 API 和指定 CLI 路径、编译输入保护及只读边界，不承诺持续监控或原子隔离。

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
| C03 | 图像和 SE 的重复命令检查；新命令不累积逻辑使用数。 |
| C13 | check-success／check-failure：外部字段与名称保留；素材树不复制、写入或备份。 |
| W01 | 全部三态 × 结果 × API／CLI |
| W02 | Check 完成前删除／改善／稳定 warning |
| W03 | Compile 发布前错误／变化 |
| W04 | 素材门槛后删图仍可发布／发布 I/O 或编译输入保护失败 |
| W09 | 动画／图块未 Pull 改名与 Pull 后重编译 |
| W10 | 内容／大小／mtime／身份／无关目录项全部分支 |
| W11 | Check／Compile 各自唯一素材门槛前的 presence／case-match／path-type／path-link／queryability／failure-location／improvement，只判断当前事实。 |
| W12 | same-pass-reuse／next-command-fresh；Push 新命令由 14 再验证，不建立跨点比较。 |
| W14 | pull／rebind／contract-change／check-does-not-refresh。 |
| W17 | Clone／Pull／Decompilation／Diff 全部不增加文件查询 |
| W19 | compile-success／compile-failure：联合检查全部状态载体和素材只读。 |

## Dependencies

- [12：准确例外与完整的多来源诊断](12-exceptions-and-complete-diagnostics.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

已按上游索引执行63W＋4C：源码／构建分别67／67，共134条规范回执；每入口12个实际CLI ID，过滤项不计通过。受影响的8个既有suite源码／构建分别299／299，无过滤项。typecheck、lint、format、build、空白差异及本地链接检查通过。最终全仓与原生核对仍由17负责。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Outcome

2026-11-02：本票完成。现有产品在 integration37 已有单次 Compile／Check 门槛，本票以真实 Windows／Node22 API／CLI 和 OS 暂停边界补全有限验收，保留全部输入保护及只读语义；没有产品行为变更，Contract仍为 `mv-1.6.1/37`。测试子进程释放 checkpoint 时移除残留 message listener，使成功 CLI 能真实退出。image重复命令复用04原唯一callback（共享owner04,13），SE重复命令新增唯一callback，不累积使用数。新suite加入构建后Windows清单，使用说明同步。

完整结果、边界、独立预期、失败fixture修正及范围见[13验收说明](../evidence/13-workflow-acceptance.md)与[逐ID机器合册](../evidence/13-workflow-acceptance.json)。所有原始red／失败及修复报告保留；134条最终receipt的断言源SHA与冻结后的最终Git测试工件逐一核对。14–16的新增Push／pending／恢复责任没有提前签收。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：13 实施代理在独立工作树确认 clean，并快进到 integration `1f01ba534e5eee1047a1f3cc6665370924707f32`（Contract37）后领取。沿用已确认 Workspace API／实际 CLI 和测试子进程 OS 适配层 seam，按 TDD 验证本票 63W＋4C 责任；不提前签收14–16。

- 2026-11-02：仅澄清 W01 既有状态 × 结果组合的 ID 编码：按状态、结果顺序用连字符合成分支，分别展开 api／cli，共 18 个 ID；case 字段和 expected 结果段保持固定，行为范围、入口与数量不变。见原索引 W 组引言。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
