# 13: Compile／Check 重查与输出有效性

Status: ready-for-agent
Blocked by: 12
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** Check 返回、Compile 发布及 Manifest 提交都根据新观察确认结果；作者不会得到使用了操作内过时素材条件的成功输出。

## Acceptance criteria

- [ ] Check 的 initial／fresh／stale × success／error／warning 全部只读；Compile 发布前失败不发布，发布已开始后的失败沿用无效输出语义，成功重编译才能恢复。
- [ ] 在三个完成边界验证全部相关变化，包含改善和 warning 到 warning；忽略内容、大小、时间、文件身份及无关目录项变化。每检查点／每命令新观察且逻辑计数稳定。
- [ ] 验证快照与实时素材的区别、未 Pull 标准数据改变及 Pull 后重编译、规则／绑定／政策新鲜度；Clone／Pull／Decompilation／Diff 不新增实时素材扫描。
- [ ] 受控子进程验证 API 和指定 CLI 路径、编译输入保护及只读边界，不承诺持续监控或原子隔离。

### 共通要求（限本票适用范围）

- [ ] 完成本票验收族中分配给本票的全部有限子用例；共享族按下表分支签收，不减少字段、表示、时机或结果，不把其他票负责的分支误记为通过。
- [ ] 正式表达与已识别 raw 各自对照独立预期；按适用范围核对完整 Event Asset Use、Asset Dependency Chain、条件、None、必要字段问题及文件事实。预期不得调用被测收集器、匹配器或政策函数生成。
- [ ] 在 Windows / Node.js 22 的真实临时 Workspace 中，按原索引指定的 API／实际 CLI 入口和边界验证结果及允许的状态变化。纯语义测试只作补充，故障注入位于测试子进程操作系统边界。
- [ ] 保留现有公共 Workspace API 和 CLI；不新增产品测试开关、JSON CLI、全局跳过或通配符例外。素材不进入持久编译基线、快照、备份、复制或写入范围。
- [ ] 补齐本票影响的既有成功 fixture 所需真实文件与必要标准字段，保留旧断言与未知字段。同步适用使用说明、样例及构建后 CLI 用例清单；行为变更协调 Compile Contract Version。
- [ ] 记录完整子用例 ID、契约出处、输入、预期、实际、环境、执行方式及证据；未执行、能力受限和失败分别记录，不能以 skip 计为通过。反例按规格回到责任行为或决定处理。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| C03 | 图像和 SE 的 repeated-checkpoint；重查不增加逻辑使用数。 |
| C13 | check-success／check-failure：外部字段与名称保留；素材树不复制、写入或备份。 |
| W01 | 全部三态 × 结果 × API／CLI |
| W02 | Check 完成前删除／改善／稳定 warning |
| W03 | Compile 发布前错误／变化 |
| W04 | Manifest 前变化／发布 I/O 失败 |
| W09 | 动画／图块未 Pull 改名与 Pull 后重编译 |
| W10 | 内容／大小／mtime／身份／无关目录项全部分支 |
| W11 | Check 完成前、Compile 发布前、Compile Manifest 前：每个边界都执行 presence／case-match／path-type／path-link／queryability／failure-location／improvement。 |
| W12 | same-point-reuse／next-point-fresh／next-command-fresh；Push 新命令由 14 再验证 |
| W14 | pull／rebind／contract-change／check-does-not-refresh。 |
| W17 | Clone／Pull／Decompilation／Diff 全部不增加文件查询 |
| W19 | compile-success／compile-failure：联合检查全部状态载体和素材只读。 |

## Dependencies

- [12：准确例外与完整的多来源诊断](12-exceptions-and-complete-diagnostics.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。当前所有产品测试和原生检查均为待实施／未执行，完成时追加实际结果。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
