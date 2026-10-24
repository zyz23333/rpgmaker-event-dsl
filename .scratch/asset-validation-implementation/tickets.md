# 事件素材存在性检查：实施任务索引

Published: 2026-10-24
Source: [事件素材文件存在性检查实施规格](../asset-validation/asset-validation-spec.md)
Breakdown: [已确认任务拆分与验收责任](ticket-breakdown-draft.md)

用户已确认 17 票的范围、粒度与直接依赖。全部正式票初始状态为 ready-for-agent；当前执行状态以各票文件为准。原规格、决策地图和六张决策票保留原状。

## 领取规则

- 只有 Blocked by 中全部直接依赖已 resolved 的票可以开始；ready-for-agent 表示任务已明确，不表示已经解除依赖或完成。
- 发布时可立即开始 [01：核实原生媒体定位与特殊名称](issues/01-native-media-locations.md) 和 [02：显示图片在 Compile／Check 中完成最小检查路径](issues/02-picture-compile-check.md)；按票号顺序选择时下一票为 01。
- 01 是原生证据工作，02 是最小产品行为；已有明确契约允许分别推进。实际发现的契约反例必须按规格处理。
- 每票拥有自己的测试、fixture 和适用说明责任；17 汇总并审计完整交付。关闭前保留实际 outcome 与验证，未执行和环境受限不算通过。

## 正式票

| 票号 | 标题 | 直接阻塞 | 发布时状态 |
| --- | --- | --- | --- |
| 01 | [核实原生媒体定位与特殊名称](issues/01-native-media-locations.md) | 无 | ready-for-agent |
| 02 | [显示图片在 Compile／Check 中完成最小检查路径](issues/02-picture-compile-check.md) | 无 | ready-for-agent |
| 03 | [准确名称、链接与文件查询失败的检查](issues/03-exact-file-observation.md) | [02](issues/02-picture-compile-check.md) | ready-for-agent |
| 04 | [事件页、图像指令与移动图像的检查](issues/04-direct-image-uses.md) | [02](issues/02-picture-compile-check.md) | ready-for-agent |
| 05 | [音频与影片的直接检查](issues/05-direct-audio-and-movie-uses.md) | [04](issues/04-direct-image-uses.md) | ready-for-agent |
| 06 | [动画与更换图块组的间接检查](issues/06-animation-and-tileset-dependencies.md) | [05](issues/05-direct-audio-and-movie-uses.md) | ready-for-agent |
| 07 | [传送地图与页图块的素材检查](issues/07-transfer-and-page-tile-dependencies.md) | [06](issues/06-animation-and-tileset-dependencies.md) | ready-for-agent |
| 08 | [敌人战斗图与加入角色候选的检查](issues/08-enemy-and-actor-candidates.md) | [06](issues/06-animation-and-tileset-dependencies.md) | ready-for-agent |
| 09 | [结束、标题与战斗默认素材的检查](issues/09-system-and-battle-defaults.md) | [06](issues/06-animation-and-tileset-dependencies.md) | ready-for-agent |
| 10 | [公共事件调用链与有界停止](issues/10-common-event-dependency-chains.md) | [02](issues/02-picture-compile-check.md) | ready-for-agent |
| 11 | [强制行动的技能、默认攻击与公共事件 effects](issues/11-forced-action-dependencies.md) | [06](issues/06-animation-and-tileset-dependencies.md), [10](issues/10-common-event-dependency-chains.md) | ready-for-agent |
| 12 | [准确例外与完整的多来源诊断](issues/12-exceptions-and-complete-diagnostics.md) | [03](issues/03-exact-file-observation.md), [07](issues/07-transfer-and-page-tile-dependencies.md), [10](issues/10-common-event-dependency-chains.md) | ready-for-agent |
| 13 | [Compile／Check 重查与输出有效性](issues/13-compile-check-consistency.md) | [12](issues/12-exceptions-and-complete-diagnostics.md) | ready-for-agent |
| 14 | [Push 从生成事件检查素材及无差异路径](issues/14-push-generated-asset-preflight.md) | [13](issues/13-compile-check-consistency.md) | ready-for-agent |
| 15 | [Push 写后复核与完整输入保护](issues/15-push-postwrite-consistency.md) | [14](issues/14-push-generated-asset-preflight.md) | ready-for-agent |
| 16 | [恢复记账与当前素材条件分开判定](issues/16-recovery-and-current-asset-policy.md) | [15](issues/15-push-postwrite-consistency.md) | ready-for-agent |
| 17 | [完整功能验收与使用说明核对](issues/17-integrated-acceptance.md) | [01](issues/01-native-media-locations.md), [08](issues/08-enemy-and-actor-candidates.md), [09](issues/09-system-and-battle-defaults.md), [11](issues/11-forced-action-dependencies.md), [16](issues/16-recovery-and-current-asset-policy.md) | ready-for-agent |

## 验收与依赖

[已确认责任表](ticket-breakdown-draft.md#验收责任分配)逐族覆盖 A18、B16、C13、F14、D10、W20、N6，共 97 个族；每票已列出自己的分支责任。完整子用例仍由[原索引](../asset-validation/implementation-acceptance-cases.md)定义。

02 完成后可分别推进 03、04、10。04 → 05 → 06；之后 07、08、09 分开推进，06 和 10 一起解锁 11。03、07、10 汇合到 12，随后依次进入 13 → 14 → 15 → 16。17 等待 01、08、09、11、16，覆盖全部依赖链。

01 负责 N01／N02；06 负责 N03；07 负责 N04；08 负责 N05／N06。最终全量验证与维护者审阅由 17 汇总，原生必验不能以静态证据、合成样例或未执行记录替代。

## Comments

- 2026-10-24：用户确认拆分后，逐票发布 17 个 Markdown 文件，并核对编号、状态、直接依赖、本地链接及全部 97 族责任。发布仅创建任务文档，未执行产品实现或验收。
