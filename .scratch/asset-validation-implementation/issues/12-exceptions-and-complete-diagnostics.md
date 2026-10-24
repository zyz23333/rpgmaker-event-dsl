# 12: 准确例外与完整的多来源诊断

Status: ready-for-agent
Blocked by: 03, 07, 10
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 作者可为准确素材填写原因，将允许的问题降为 warning，并在 CLI 获取分组结果、全部来源及检查未完成原因。

## Acceptance criteria

- [ ] 增加严格 assetCheckExceptions 配置，省略等同空数组，新初始化写入空数组；category／folder／name／reason、重复、额外字段和准确匹配分别验证。
- [ ] 三类允许问题只降 error → warning；候选／非活动和普通使用保留独立级别。支持范围、必要字段、查询失败及观察不一致不可豁免；无实际降级警告及不完整时抑制正确。
- [ ] 完成 D01–D10 的全部组合：稳定代码、组／文件／使用统计、共同失败、独立结果继续、位置／链／条件／原因及实际 CLI 退出。必要信息不压成第一条异常。
- [ ] 配置政策进入基线、Manifest 及已理解 pending 格式；测试旧格式按原结构验证，不先填新默认重算历史 hash。完整运行恢复的责任仍在 16。

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
| C11 | 既有 Script Gate／结构失败不被 Asset Check Exception 绕过。 |
| D01 | 全事实 × 合法普通／候选／非活动表示组合 |
| D02 | 全部不可豁免组合及 reference／structure／script Gate |
| D03 | 三类可降级、多来源与准确键区别 |
| D04 | 全部配置错误 |
| D05 | repaired／unused／warning-only／incomplete |
| D06 | 混合级别及组／文件／使用独立计数 |
| D07 | 公共目录／字段失败及无合法目标 |
| D08 | 独立结果继续及各早期失败完整性 |
| D09 | 全部列出定位／链／源码可靠性；各来源票先验收自身位置 |
| D10 | 全部实际 CLI 结果分支 |
| W14 | exception-change：例外政策改变使编译依据过期，不能以当前检查升级旧输出。 |

## Dependencies

- [03：准确名称、链接与文件查询失败的检查](03-exact-file-observation.md)。
- [07：传送地图与页图块的素材检查](07-transfer-and-page-tile-dependencies.md)。
- [10：公共事件调用链与有界停止](10-common-event-dependency-chains.md)。

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
