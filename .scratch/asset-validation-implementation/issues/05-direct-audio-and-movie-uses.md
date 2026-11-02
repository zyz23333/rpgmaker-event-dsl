# 05: 音频与影片的直接检查

Status: ready-for-agent
Blocked by: 04
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 05](../history/2026-10-24/issues/05-direct-audio-and-movie-uses.md)

**What to build:** 四类音频、保存音频设置、路线 SE 及影片在 Compile／Check 中使用正确目录和固定扩展名。

## Acceptance criteria

- [ ] 覆盖 A03–A06、A08–A12、A18，复用两种路线容器和镜像语义；保留音量等独立参数、None 和明确非活动条件。
- [ ] OGG／WebM 不能由 M4A／MP4 或加密后缀替代；音频字面量百分号／井号可查，影片对应名称不支持且不查询。
- [ ] 仅解释存在相应使用类别的加密标志，缺失／false、true、错误类型及影片不受影响分别验证。
- [ ] 逐字段正常与缺失、准确类别匹配及正式／raw 一致性通过实际 Workspace 和 CLI 验证。

### 共通要求（限本票范围）

- [ ] 按本票责任表完成现行索引的有限子用例，正式／已识别 raw 各自对照独立预期，不用被测实现计算期望。
- [ ] 在 Windows / Node.js 22 的真实临时 Workspace 中，经指定 API／实际 CLI 验证诊断与允许的状态变化；内部语义测试只作补充，故障注入留在测试子进程接口。
- [ ] 仅解释已选关系必要字段，保留 None、保存值、外部字段及所有权；实时素材不进持久基线、快照、备份或写入，素材政策仍属于编译依据。
- [ ] 保留现有公共 API／CLI，不增加测试开关、全局跳过或通用扫描框架；在本票内补 fixture、适用说明及构建后 CLI 场景，协调 Compile Contract Version。
- [ ] 记录完整用例 ID、独立预期、实际结果、环境和证据；未执行／环境受限不计通过。只有本票保留范围完成并记录 outcome 与验证后才改为 resolved。

## Acceptance ownership

下表只分配本票保留分支；准确预期、表示、字段及完整用例 ID 以[现行索引](../../asset-validation/implementation-acceptance-cases.md)为准。不得重新加入延后族。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| A03 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A04 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A05 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A06 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A08 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A09 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A10 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A11 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A12 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A18 | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| C03 | route-mirror／independent-command 的 se 字段；205／505 关联一次，其他真实来源保留。 |
| C06 | 本票 A03、A04、A05、A06、A08、A09、A10、A11、A12、A18 的原生合法 None。另含 saved-audio-controls。 |
| C08 | route-fixed／route-random／route-approach 的路线 SE。 |
| C11 | 路线 SE 正式／raw 一致性的补充验证。 |
| F01 | bgm／bgs／me／se／movie。 |
| F02 | audio-m4a-only／movie-mp4-only／audio-encrypted-only。 |
| F06 | audio-percent／audio-hash／movie-percent／movie-hash。 |
| F13 | 全部 audio 标志分支。 |
| F14 | no-audio-use／movie-only。 |

## Dependencies

- [04：事件页、图像指令与移动图像的检查](04-direct-image-uses.md)。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Verification

按现行验收索引执行本票分支及指定 CLI 路径，记录适用检查、构建、Windows 验证和实际结果。当前均待实施／执行；不能将失败或缺口留给最终汇总票后关闭本票。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
