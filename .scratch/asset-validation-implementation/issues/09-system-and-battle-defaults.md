# 09: 结束、标题与战斗默认素材的检查

Status: claimed
Blocked by: 06
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** Game Over、Return to Title、Battle Processing 中已选的 System 和宿主地图素材关系在编译时可见。

## Acceptance criteria

- [x] B11–B14 完整覆盖：Game Over ME；标题两图与 BGM；战斗 BGM／胜败 ME 默认候选和 sounds 槽 7；Map Event 宿主地图两层战斗背景候选。
- [x] 保留胜败、地图启动、specifyBattleback 及运行时覆盖条件；动态敌群只停止该分支，已知系统关系继续。
- [x] 不加入硬编码 GameOver／标题 UI、地形推导、Battle Test 背景；Common／Troop Event 不推断调用地图。字段错误和共享 System 失败保留全部来源。

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
| B11 | Game Over ME |
| B12 | 标题两图与 BGM |
| B13 | 战斗系统默认与 start SE |
| B14 | Map Event 宿主地图两层背景 |
| C05 | dynamic-target／known-sibling：动态敌群停止该路径，已知系统关系继续。 |
| C06 | 本票 B11、B12、B13、B14 所有原生允许 None 的到达字段，按上游有限子用例展开。 |
| C07 | 本票 B11、B12、B13、B14 到达字段的 target-missing／field-missing／field-wrong-type／field-empty／file-missing 适用变体；固定目标与 System 字段按原索引分别处理。 |
| C08 | battleback-off：specifyBattleback 关闭时保留候选和非活动原因。 |
| C12 | hardcoded-system／terrain-background／battle-test-background：不扩张已排除系统／地形／测试背景。 |

## Dependencies

- [06：动画与更换图块组的间接检查](06-animation-and-tileset-dependencies.md)。

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
- 2026-11-02：重新领取 `AV.C07.shared-system-field.formal.case.expected` 的分组兼容缺口。09 worktree 开始 clean，已 fast-forward 到集成提交 `126b1980014e5c9a4c9bd877505e04a30f097759`。17 的 Contract 39 run 在取消前真实触发旧 header 计数 2／实际 1 的失败；原失败与现场、09 原有 passed 历史均保留。按规格 §7 先捕获完整公共 API／实际 CLI 的分组与全部来源，再决定兼容更正；沿用已确认的 Workspace API／CLI seam，不新增产品报告 API。准备阶段遵守 03 独占测试窗口，未运行产品或测试；本次新证据将单独归档到 `09-grouping-compatibility`，不改写原 Outcome／证据。

## Outcome — 2026-11-02

Implemented B11–B14 in the independent `asset-system-relations.ts` collector. Current candidate events are the only roots; selected System and host Map fields use the captured external data reader. Default audio/background candidates, victory/defeat/map-launch conditions, disabled background reasons, complete origins and field chains remain explicit. Dynamic 301 Troop targets retain an unchecked stop while known siblings continue. Common/Troop roots do not infer a caller Map; hardcoded UI/GameOver, terrain and Battle Test fields remain excluded. External data and media stay read-only.

The 96 assigned normative IDs plus 9 supplemental boundaries passed through real Windows / Node.js 22.23.4 Workspace API and actual source/built CLI paths:105/105 source and 105/105 built. Shared C05 callbacks remain unique for 11 to append Skill/weapon scenarios. Two provisional B14 target-missing candidate IDs are not applicable because preserving a current Map Event requires its host Map carrier; the real missing-map reference prerequisite is separately demonstrated, without claiming an unreached asset pass.

Merged latest integration `4cf156255d077f06614578dd7bf11b5e85cdfd54` (08), preserved both collectors and shared fixture changes, and reconciled Compile Contract Version to 32. Post-merge affected old regressions passed 61/61 source and 61/61 built; selected C05/B13/B14 cases passed 27/27 source and 27/27 built. Typecheck, lint, formatting and build passed. Native acceptance and the overall spec gate remain outside this ticket’s completion claim.

Evidence: [per-ID summary](../evidence/09-system-acceptance.md) and [full210 receipts plus verification](../evidence/09-system-acceptance.json). The evidence preserves tracer red/green outcomes and the initial fixture/expectation corrections.
