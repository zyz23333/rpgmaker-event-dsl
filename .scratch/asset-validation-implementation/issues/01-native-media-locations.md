# 01: 核实原生媒体定位与特殊名称

Status: ready-for-agent
Blocked by: None
Created: 2026-11-02
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [拆分及重新编号记录](../ticket-breakdown-draft.md#comments)
History: [旧 01](../history/2026-10-24/issues/01-native-media-locations.md)

**What to build:** 以 MV 1.6.1 的真实请求和磁盘定位，核实普通媒体及支持的特殊名称，为文件规则提供可复核的原生证据。

## Acceptance criteria

- [ ] 完成 N01／N02 的全部保留分支：PNG、OGG、WebM，中文、空格及图片／音频的字面量百分号、井号。
- [ ] 使用有效自制媒体，记录 MV／宿主版本、输入、保存名称、实际请求、文件定位、执行方式与证据；区分 URL 编码和磁盘名称。
- [ ] 原生观察发现反例时保留最小复现并按规格处理；静态源码、旧重放和空文件自动化不替代本票证据。

## Acceptance ownership

下表只分配本票保留分支；准确预期、表示、字段及完整用例 ID 以[现行索引](../../asset-validation/implementation-acceptance-cases.md)为准。不得重新加入延后族。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| N01 | 全部现行原生分支。 |
| N02 | 全部现行原生分支。 |

## Dependencies

None（可立即开始）。

仅在直接依赖均 resolved 后领取；ready-for-agent 表示范围明确，不代表已解除依赖。各票完成只代表其保留范围，首版最终验收由 14 汇总。

## Verification

完成 N01／N02 的真实原生观察，记录输入、请求、定位及反例处理；无需为单纯证据采集运行产品测试。

## Sources

- [实施规格](../../asset-validation/asset-validation-spec.md)
- [验收矩阵](../../asset-validation/acceptance-matrix.md)
- [已确认拆分与验收责任](../ticket-breakdown-draft.md)
- [实施任务索引](../tickets.md)

## Comments

### 2026-11-02 — 简化与重新编号

用户在审阅 14 张票的修订建议后要求“重新编号吧”。按该要求连续编号并发布当前范围，原票及历史讨论保留在 History 链接中。此记录仅表示任务更新，未实施产品或执行验收；父规格及决策票不因本次编号修改。
