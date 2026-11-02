# 01: 核实原生媒体定位与特殊名称

Status: claimed
Blocked by: None
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 用 MV 1.6.1 的真实请求和磁盘定位确认图片、音频、影片及受支持特殊名称的规则，为实施提供可复核的原生事实。

## Acceptance criteria

- [ ] 完成 N01／N02 全部分支：PNG、OGG、WebM；中文、空格及图片／音频中的字面量百分号、井号。
- [ ] 记录版本、有效自制输入、保存名称、原生请求、实际文件、执行方式与证据；区分 URL 编码与磁盘名称。
- [ ] 如有反例，给出最小复现和受影响决定，按规格处理；静态研究、旧重放或空文件自动化不能代替这次原生观察。

### 共通要求（限本票适用范围）

- [ ] 完成 N01／N02 中全部原生子用例，采用有效自制媒体；记录原生执行与静态／合成证据的区别。
- [ ] 每项保留完整用例 ID、MV 与宿主版本、输入、原名、请求和磁盘定位、实际结果、执行方式及证据；必验项未执行、环境受限或反例未解决时不关闭本票。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| N01 | 图片、音频、影片原生定位 |
| N02 | 全部支持特殊名称原生映射 |

## Dependencies

None（可立即开始）。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

本票交付原生证据，不要求为文档采集运行产品测试。当前 N01／N02 均为待执行；完成后追加实际步骤、结果、证据与反例处理。先前静态研究、部署重放及其他 Node 版本微测不替代本票验收。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
- 2026-11-02：从 `codex/asset-validation-integration`（`f6a00f25`）建立独立 worktree 后领取；准备使用本地 MV 1.6.1 原生 NW.js 与有效自制媒体留证。
- 2026-11-02：执行 N01／N02 共 15 个有效媒体样本，13 个原生观察通过、2 个与现行契约矛盾；另完成 2 个绿色／红色文件因果对照。N01、中文／空格及全部音频特殊名称通过；图片 `literal%20image` 与 `image#hash` 的原名文件存在且有效，但 MV 1.6.1 最终 URL 分别读取空格名称和 fragment 前名称。完整[回执、最小反例及待决选项](../evidence/01-native-media/observations.md)、[原生结果](../evidence/01-native-media/native-results.json)和[可复现探针](../probes/native-media/run-native-media.mjs)已保存。依规格反例规则提出重开 ADR 0017 和相关决策；尚未修改政策或原验收预期，票继续 claimed，不能宣称全部原生验收完成。
