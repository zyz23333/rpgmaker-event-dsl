# 04: 事件页、图像指令与移动图像的检查

Status: resolved
Blocked by: 02
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 页图像、脸图、两层战斗背景、远景、角色／载具图像及两种路线中的图像均在现有编译流程被检查。

## Acceptance criteria

- [x] 补齐 A01／A02／A13–A17 的每个原生字段，正式／raw 按适用表达分别验收；Compiler Defaults 只用于已有可选字段，合法 None 不查询且保存索引等其他值。
- [x] 自主路线即使不是 custom 仍收集保存名称；图块页保存的角色图像标注非活动。页条件或未执行分支不能成为降级依据。
- [x] 205 路线与 505 镜像作为一次逻辑使用并保留两处位置，独立命令仍是独立使用；路线图片的正常、缺失、镜像、非活动和定位经 Workspace 验证。

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
| A01 | 页 characterName |
| A02 | Show Text 脸图 |
| A13 | 两层战斗背景 |
| A14 | 远景 |
| A15 | 角色三种图像 |
| A16 | 载具图像 |
| A17 | 两种路线的图像 |
| C03 | 图像的 route-mirror／independent-command；关联 205／505 两个位置但只计一次。 |
| C06 | 本票 A01、A02、A13、A14、A15、A16、A17 所有原生允许 None 的到达字段，按上游有限子用例展开。另含 default-page-image／default-page-route／saved-image-index。 |
| C08 | route-fixed／route-random／route-approach 的路线图像，以及 tile-with-character。 |
| C11 | route-script：保持原有脚本边界，不猜动态素材。 |

## Dependencies

- [02：显示图片在 Compile／Check 中完成最小检查路径](02-picture-compile-check.md)。

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
- 2026-11-02：按 [17 的公开说明核对](17-integrated-acceptance.md)回补本票的一处说明遗漏，短暂重新领取；开始前 04 worktree clean，已 fast-forward 到集成提交 `29f19dfd3ed943df2e0c9ae2b7c446ada248d501`。发现点为包 README 的 Message Commands 段仍称“image files and dimensions are unchecked”，与当前 Show Text 脸图文件检查及后文素材规则不一致。本次仅修正文案，保留既有 Outcome 与验收证据；不修改产品、Compile Contract Version 或测试。
- 2026-11-02：17 的公开说明核对另发现 authoring skill 的 `references/event-patterns.md` Face 段仍有同一句旧说明，本票再次短暂领取。04 worktree 从 clean 的 `58c218c2` fast-forward 到集成提交 `80c945e43cd96677c31429ee411863c76ec2e69b`；已按 writing-for-agents 及其 SKILL-MECHANICS 核对技能参考与主 Skill 上下文。本次仅回补 Face 的保存值／文件检查边界，保留主 Skill、其他 pattern（含另归 06 的 Tileset 段）、既有 Outcome 与证据。

## Outcome

2026-11-02：完成本票所有 A01／A02／A13–A17、C03 image、C06、C08 图像和 C11 route-script 分支；补齐既有成功流程的明确 PNG，保留原始 CR/LF 保存值和 Decompilation 断言，新增政策拒绝／无发布覆盖。Compile Contract Version 为 28，已合并当前集成分支 `e476b77e`，保留公共事件调用定位。

[验收记录](../evidence/04-image-acceptance.md)及[138 条逐项结果](../evidence/04-image-acceptance.json)记录 69 个所属 ID 的源码／构建入口结果。最终选定源码 75／75、构建入口 75／75；既有受影响工作流 177／177，地图外观 8／8，构建、typecheck、lint、format:check、diff 检查通过。未把过滤器未选择的其他用例或原生政策待决定部分记为通过。全量及最终 Windows 汇总由 17 负责。

2026-11-02 说明回补：已修正包 README 的 Message Commands 段，明确所选脸图按共享素材规则检查准确普通文件存在性，图像尺寸、布局和解码仍不检查，None 的索引保存与告警边界保持原说明。与同一 README 后文素材规则核对一致；仅此文案与本票记录变更，既有 Outcome 和全部验收证据保留，产品、Compile Contract Version 与测试未变。`oxfmt --check packages/rpgmaker-event-dsl/README.md`、`git diff --check` 及两份变更 Markdown 的 11 处本地链接目标检查通过；此次未新增或重跑产品测试，也不把既有测试结果作为此次新执行记录。17 的公开说明核对可继续据此验收。本票重新 resolved。

2026-11-02 技能参考说明回补：已修正 `skills/rpgmaker-event-authoring/references/event-patterns.md` 的 Face 段，明确 helper 保留保存名称、索引与消息设置，Workspace 素材检查按共享文件规则验证所选文件；图像尺寸、布局和解码仍在检查边界外。与包 README 的脸图说明一致。`oxfmt --check` 该参考文件、`git diff --check`、两份变更 Markdown 的 12 处本地链接目标检查及“参考文件只改 Face 段”的完整文本比对通过；主 Skill、其他 pattern（含 Tileset）、产品、Compile Contract Version、测试与全部既有验收证据均未变。本次没有执行产品测试或广测，原证据继续保留为其原执行记录。本票重新 resolved，交回 17 继续核对。
