# 05: 音频与影片的直接检查

> 历史归档，不可领取。正文保留当时的范围与状态，仅重定位链接；现行任务见[当前索引](../../../tickets.md)。

Status: ready-for-agent
Blocked by: 04
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** BGM、BGS、ME、SE、载具／战斗音频设置、路线 SE 及影片都能在 Compile／Check 中得到准确结果。

## Acceptance criteria

- [ ] 补齐 A03–A06／A08–A12／A18，路线复用已完成的两个容器和镜像语义；保留音量等独立保存值和合法 None。
- [ ] OGG／WebM 扩展固定，M4A／MP4 或加密后缀不能替代；音频允许字面量百分号／井号，影片两者属于不支持名称且不查询。
- [ ] 只解释有使用类别对应的加密标志；缺失／false、true、错误类型和影片不受影响分别验证。补齐直接媒体命名空间的 API／CLI 场景。

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
| A03 | 战斗 BGM |
| A04 | 胜利 ME |
| A05 | 失败 ME |
| A06 | 载具 BGM |
| A08 | Play BGM |
| A09 | Play BGS |
| A10 | Play ME |
| A11 | Play SE |
| A12 | 影片 |
| A18 | 两种路线的 SE |
| C03 | SE 的 route-mirror／independent-command；两个路线容器遵循相同逻辑身份。 |
| C06 | 本票 A03、A04、A05、A06、A08、A09、A10、A11、A12、A18 所有原生允许 None 的到达字段，按上游有限子用例展开。另含 saved-audio-controls。 |
| C08 | route-fixed／route-random／route-approach 的路线 SE。 |
| C11 | 路线 SE 的已识别 raw 与正式表达共用规则。 |
| F01 | bgm／bgs／me／se／movie：准确 OGG／WebM 普通文件。 |
| F02 | audio-m4a-only／movie-mp4-only／audio-encrypted-only。 |
| F06 | audio-percent／audio-hash 可检查；movie-percent／movie-hash 不支持且不查询。 |
| F13 | audio-absent／audio-false／audio-true／audio-null／audio-number／audio-string。 |
| F14 | no-audio-use／movie-only：无音频使用不解释其标志，影片不受图片／音频加密标志影响。 |

## Dependencies

- [04：事件页、图像指令与移动图像的检查](04-direct-image-uses.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。当前所有产品测试和原生检查均为待实施／未执行，完成时追加实际结果。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
