# 事件素材存在性检查：实施任务索引

Published: 2026-10-24
Updated: 2026-11-03
Source: [现行实施规格](../asset-validation/asset-validation-spec.md)
Breakdown: [已确认拆分与验收责任](ticket-breakdown-draft.md)

用户审阅简化后的 14 票建议并要求重新编号，现已按依赖顺序发布为连续的 01–14。当前有效任务仅为下表及 issues 目录中的 14 个文件；旧 17 票和原发布记录在 [历史目录](history/2026-10-24/README.md)。01–14 均已记录结果与验证并 resolved；维护者已审阅[首版验收回执](evidence/14-current-acceptance/README.md)和公开说明，确认交付。

## 领取规则

- Blocked by 的直接依赖全部 resolved 才能开始；ready-for-agent 表示任务明确，不等于解除依赖。
- 01–14 的当前首版范围均已完成；维护者最终确认见[第 14 票](issues/14-integrated-acceptance.md)。
- 每票承担自己的测试、fixture、说明和证据。14 汇总当前 86 个有效族及 N01–N05 的保留分支，11 个延后族不进入首版门槛。
- Compile／Check／Push 各一次素材检查，写后素材变化不妨碍正常 data 记账；旧票中的多次素材复查、调用链展开及初始候选要求不再生效。
- 原生观察发现的契约反例必须按现行规格处理，不能以静态资料或环境 skip 代替必验结果。

## 当前实施票

| 编号 | 任务 | 直接阻塞 | 状态 |
| --- | --- | --- | --- |
| 01 | [核实原生媒体定位与特殊名称](issues/01-native-media-locations.md) | 无 | resolved |
| 02 | [显示图片在 Compile／Check 中完成最小检查路径](issues/02-picture-compile-check.md) | 无 | resolved |
| 03 | [准确名称、链接与文件查询失败的检查](issues/03-exact-file-observation.md) | [02](issues/02-picture-compile-check.md) | resolved |
| 04 | [事件页、图像指令与移动图像的检查](issues/04-direct-image-uses.md) | [02](issues/02-picture-compile-check.md) | resolved |
| 05 | [音频与影片的直接检查](issues/05-direct-audio-and-movie-uses.md) | [04](issues/04-direct-image-uses.md) | resolved |
| 06 | [动画、图块组与固定技能正动画的检查](issues/06-animation-tileset-and-skill-assets.md) | [05](issues/05-direct-audio-and-movie-uses.md) | resolved |
| 07 | [固定敌群与敌人变身素材的检查](issues/07-enemy-asset-dependencies.md) | [06](issues/06-animation-tileset-and-skill-assets.md) | resolved |
| 08 | [Game Over 与 Return to Title 素材的检查](issues/08-game-over-and-title-assets.md) | [06](issues/06-animation-tileset-and-skill-assets.md) | resolved |
| 09 | [精确素材例外与可定位诊断](issues/09-exceptions-and-actionable-diagnostics.md) | [03](issues/03-exact-file-observation.md)、[06](issues/06-animation-tileset-and-skill-assets.md) | resolved |
| 10 | [Compile／Check 的单次素材检查与发布保护](issues/10-compile-check-single-gate.md) | [09](issues/09-exceptions-and-actionable-diagnostics.md) | resolved |
| 11 | [Push 写前及无差异路径的素材检查](issues/11-push-generated-asset-preflight.md) | [10](issues/10-compile-check-single-gate.md) | resolved |
| 12 | [Push 写后记账与输入一致性保护](issues/12-push-postwrite-consistency.md) | [11](issues/11-push-generated-asset-preflight.md) | resolved |
| 13 | [Interrupted Push 恢复与当前素材条件分离](issues/13-recovery-and-current-asset-policy.md) | [11](issues/11-push-generated-asset-preflight.md) | resolved |
| 14 | [首版集成验收与使用说明核对](issues/14-integrated-acceptance.md) | [01](issues/01-native-media-locations.md)、[07](issues/07-enemy-asset-dependencies.md)、[08](issues/08-game-over-and-title-assets.md)、[12](issues/12-push-postwrite-consistency.md)、[13](issues/13-recovery-and-current-asset-policy.md) | resolved |

## 依赖与验收

02 → 03／04、04 → 05 → 06、06 → 07／08、03／06 → 09 → 10 → 11 → 12／13 的依赖已由各票 resolved 满足。14 的直接依赖 01、07、08、12、13 均 resolved；维护者最终确认已完成。

N01／N02 由 01 负责；N03 与 N04 的 Change Tileset 分支由 06 负责；N05 由 07 负责。精确分支分配见[责任表](ticket-breakdown-draft.md#验收责任分配)，规范预期仍取自[子用例索引](../asset-validation/implementation-acceptance-cases.md)。

## 新旧编号对照

| 原编号 | 新编号 | 迁移结果 |
| --- | --- | --- |
| 01 | 01 | 原生证据保留 |
| 02 | 02 | 补入公共事件独立根／循环输入的范围验证 |
| 03 | 03 | 文件规则保留 |
| 04 | 04 | 直接图像保留，补页初始 Tileset 排除 |
| 05 | 05 | 直接音频／影片保留 |
| 06 | 06 | 合并固定 Skill 正动画，接收 N04 整组图块 |
| 07 | — | 传送／页图块关系延后；N04 保留部分转新 06，范围反例由新 04／06 承担 |
| 08 | 07 | 仅固定敌群／变身；Actor 候选与 N06 延后 |
| 09 | 08 | 仅 Game Over／Return to Title |
| 10 | — | 调用报告延后；独立根测试转新 02，effects 范围验证转新 06 |
| 11 | 06 | 正动画和默认攻击未检查说明合并；其余延后 |
| 12 | 09 | 精确例外与诊断减重 |
| 13 | 10 | 改为单次素材门槛 |
| 14 | 11 | 当前事实写前／无差异检查 |
| 15 | 12 | 写后素材不影响记账，保留真正输入保护 |
| 16 | 13 | 依赖改为新 11，可与新 12 分别推进 |
| 17 | 14 | 只验收当前 86 族 |

## Comments

- 2026-10-24：原 17 票经用户确认后发布；原文见历史目录。
- 2026-11-02：用户在审阅收缩为 14 票的建议后要求“重新编号吧”。据此连续编号、同步直接依赖与 86 族责任，并保留旧票历史；未修改父规格或执行产品实现。
- 2026-11-03：冻结提交 `403b39aa` 的当前技术验收及原始运行日志见[第 14 票证据](evidence/14-current-acceptance/README.md)。维护者随后确认首版验收并关闭；01–14 与父规格均已 resolved。
