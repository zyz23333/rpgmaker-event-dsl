# 06: 动画与更换图块组的间接检查

Status: resolved
Blocked by: 05
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 播放动画／战斗动画及更换图块组会沿捕获的标准数据检查每个关联文件，并显示完整 Asset Dependency Chain。

## Acceptance criteria

- [x] 建立窄的必要字段读取和带关系来源的问题表达，读取同一 Snapshot；不补读实时 data，不把全库素材字段加入严格 schema。
- [x] 动画两图及所有 timing SE、图块组全部非空槽分别检查；同名槽不丢来源，合法空、坏字段、缺目标与缺文件分别验收，未选动画／字段不扩张扫描。
- [x] 完成 N03：记录动画双图及 timing SE 的原生来源与条件，区分预加载和执行。每种关系均经正式／raw 的 Compile／Check 验证。

### 共通要求（限本票适用范围）

- [x] 完成本票验收族中分配给本票的全部有限子用例；共享族按下表分支签收，不减少字段、表示、时机或结果，不把其他票负责的分支误记为通过。
- [x] 正式表达与已识别 raw 各自对照独立预期；按适用范围核对完整 Event Asset Use、Asset Dependency Chain、条件、None、必要字段问题及文件事实。预期不得调用被测收集器、匹配器或政策函数生成。
- [x] 在 Windows / Node.js 22 的真实临时 Workspace 中，按原索引指定的 API／实际 CLI 入口和边界验证结果及允许的状态变化。纯语义测试只作补充，故障注入位于测试子进程操作系统边界。
- [x] 保留现有公共 Workspace API 和 CLI；不新增产品测试开关、JSON CLI、全局跳过或通配符例外。素材不进入持久编译基线、快照、备份、复制或写入范围。
- [x] 补齐本票影响的既有成功 fixture 所需真实文件与必要标准字段，保留旧断言与未知字段。同步适用使用说明、样例及构建后 CLI 用例清单；行为变更协调 Compile Contract Version。
- [x] 记录完整子用例 ID、契约出处、输入、预期、实际、环境、执行方式及证据；未执行、能力受限和失败分别记录，不能以 skip 计为通过。反例按规格回到责任行为或决定处理。
- [x] 完成本票指定的原生必验并留下实际证据；原生执行条件、预加载、附带请求与候选分别说明。确需人工的操作由维护者执行留证，缺必验证据时不关闭本票。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| B01 | 两个动画入口的双图与逐 timing SE |
| B02 | 更换图块组的全部非空槽 |
| C04 | repeated-tileset-name：同名图块槽保留每个来源。 |
| C06 | 本票 B01、B02 所有原生允许 None 的到达字段，按上游有限子用例展开。 |
| C07 | 本票 B01、B02 到达字段的 target-missing／field-missing／field-wrong-type／field-empty／file-missing 适用变体；固定目标与 System 字段按原索引分别处理。 |
| C10 | unrelated-animation／unrelated-field：不解释未选条目或非必要字段。 |
| N03 | 动画双图与 timing SE |

## Dependencies

- [05：音频与影片的直接检查](05-direct-audio-and-movie-uses.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。

2026-11-02 完成：规范 ID 175 个，源码 173／173、构建 173／173、原生 N03 两个 ID 全通过；独立计划集合与实际回执精确匹配。完整构建组合 233／233（规范 173、补充 4、旧功能 56），源码旧功能 53 通过后修复 Battle fixture 缺 import 并重试 3／3。收尾增强最早两项测试的完整结构／CLI 记录，源码两项加补充／契约共 7／7，构建两项加契约共 3／3；过滤未选项不计通过。typecheck、lint、format:check、build、diff 检查通过，contract30。

Outcome：212／337 到达所选 Animation 双图及所有 timing SE，282 到达所选 Tileset 全命名槽；以同一捕获 Snapshot 的窄只读字段叶及完整来源链检查，不从外部载体恢复事件根。None、坏必要字段、缺目标、缺文件分别签收，同名槽、未知字段及旧断言保留；README 与显式 Windows 构建后清单同步。未改图片特殊名称政策或其他票状态。原生实际消费、先前失败尝试、全部输入／预期／实际／哈希详见 [验收说明](../evidence/06-dependency-acceptance.md) 与 [逐项机器合册](../evidence/06-dependency-acceptance.json)。

2026-11-02 分发 Skill 说明回补：已修正 `skills/rpgmaker-event-authoring/references/event-patterns.md` 的指定段落，明确 helpers 保留引用与保存设置，Workspace 按共享文件规则沿捕获标准数据检查所选 Animation 双图、逐 timing SE 和 Tileset 全部命名槽；文件存在或 Tileset 引用有效均不保证布局、解码、加载或运行时使用。未将文件检查归给 helper，也未扩为全库扫描。与包 README 共用规则核对一致；`oxfmt --check` 该参考文件、`git diff --check`、两份变更 Markdown 的 12 处本地链接目标检查，以及“参考全文只改指定段落”的文本比对通过。主 Skill／router、Face 和其他 pattern、产品、Compile Contract Version、测试及全部既有证据均未变；此次无产品测试或广测执行，保留上文原 Outcome 与历史验收记录。本票重新 resolved，交回 17 继续公开说明核对。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-11-02：native_01 完成本票；产品 `6af35138`、完整早期图像回执增强 `d4f1fa11`，已 merge 最新 integration `0a8546c3`（仅其他票 ID 文档）。175 ID 与原生 N03 证据已审阅签收，工单 resolved，整规格最终签收留给 17。

- 2026-11-02：native_01 在独立工作树 `M:/Shuen/Codex/asset-validation-06-dependencies`、分支 `codex/asset-validation-06-dependencies` 领取；已 fast-forward integration `4a8fbe71`，contract29，干净基线 Picture 相关 Compile／metadata 检查 2/2 通过。按已确认 Workspace／CLI 与补充纯语义 seam 实施 TDD，N03 单独实际执行留证。

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。

- 2026-11-02：按 [17 的公开说明核对](17-integrated-acceptance.md)回补分发 Skill 的说明遗漏，短暂重新领取。06 worktree 开始 clean，已 fast-forward 到集成提交 `d0a53fb939065f337d363738dba0566cfcee9de1`；`references/event-patterns.md` 的 map appearance 段仍称 Workspace 不扫描素材文件，与当前选定 Animation／Tileset 有限关系的文件门槛矛盾。沿用已读 writing-for-agents／SKILL-MECHANICS 核对上下文，本次只修该段，保留主 Skill、Face、其他 pattern、原 Outcome 与全部验收证据；不修改产品、Compile Contract Version 或测试。
