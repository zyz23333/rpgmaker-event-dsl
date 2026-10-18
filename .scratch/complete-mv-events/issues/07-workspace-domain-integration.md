# 扩展事件数据域后 Workspace 如何保持同步与写入安全

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 04, 06
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置决策：[敌群战斗事件的身份与数据所有权如何划定](04-troop-event-ownership.md)、[语义无损往返与未知数据处理的精确契约是什么](06-semantic-roundtrip-policy.md)。

与用户确定完整地图页与敌群战斗事件接入 Staged Data Graph、Project Data Reference、decompile、materialization、Structured Diff、freshness、drift、Destructive Change 和 Interrupted Push 的一致边界。

重点讨论 Troops.json 的事件页域如何在保留外部字段时检测变化和移除；已有页属性变化、事件页清空、所属 troop 消失和外部编辑器改动怎样在 diff/push 中呈现与阻止误写。对现有数据域整体所有权、显式 ID 与无部分写入保证，沿用既有 ADR，或明确记录重新决策的理由。

不借本次工作扩展为通用文件同步系统。需要可复用的规则与失败场景，足以指导实现与安全测试。

## Research inputs

[MV 1.6.1 原生事件指令库存与有界保真审计](../research/native-command-fidelity.md) 的 Workspace 调用链调查指出：当前 validation input 未载入 Animations/Tilesets，部分编译单测却手工注入了这两类引用。讨论和实施验收需覆盖已有原生指令的真实 Workspace 路径，不只接入新增 Troop Event 数据域。

## Comments

### 2026-10-18 — 已决地图页模型输入

[03 号票](03-map-event-page-model.md#answer) 已解决，完整 note/页字段必须贯穿实际 Workspace 读取、反编译、校验、编译、Diff 与物化路径。现有 Snapshot 已保存完整 Map JSON 与 Tilesets.json，但页面验证上下文尚未保留 map.tilesetId / tilesetNames，需要接通，不能只在单测中注入。活动图块所用 tileset 不存在时报错，对应 B/C/D/E 图组名称为空时警告并保留；本票输入不要求新增图片文件或尺寸扫描。

项目引用校验必须区分禁用条件显式保存 ID 的有限例外、名称引用的唯一解析，以及始终完整校验的 Movement Route。不得使空白页的禁用占位 ID 1 依赖实际条目存在。完整输出仍从 DSL 与固定 Compiler Defaults 构建，不与旧事件隐式合并；既有 Freshness、Drift、Destructive Change 和 Interrupted Push 安全边界继续适用。

### 2026-10-18 — 已决 Troop Event 所有权与 Reset 输入

[04 号票](04-troop-event-ownership.md#answer) 已最终确认并解决，长期依据为 [ADR 0010](../../../docs/adr/0010-troop-event-ownership-and-reset.md)。整个 Troop Event 域由 DSL 接管，显式 troopId 指向 Snapshot 中现有敌群；名称、成员及其他非事件 carrier 数据仍来自 Snapshot。现有 troop 项目引用指向外部敌群，不改指 Troop Event 定义。空名称或空成员敌群仍可拥有事件，不能用当前会丢弃空名称的名称引用索引代替原始 ID 存在性检查。

本票应将 Troops.json 贯穿声明收集、完整验证上下文、反编译、物化、Structured Diff 和 Push 文件支持。输入必须保留完整成员列表及 Enemy 存在性信息，不只保留 id/name。页条件的角色/开关禁用 ID 例外、敌人禁用位置例外，以及启用敌人条件对成员有效性的检查，应在实际 Workspace 路径成立，不能只靠手工注入的编译单测。

省略现有敌群的声明和显式默认空白定义都生成一张默认空白页；pages=[] 拒绝。Snapshot 非空白变成 Blank Troop Event 是 Troop Event Reset，属于 Destructive Change，按前后数据分类并要求显式允许；它不是 Snapshot-Only Owned Entry 的 Entry Removal，不能删除 troop 或写 null。原本默认空白没有变化，局部删页后仍非空白是普通内容修改。Diff 需保留 troop 身份、原生页序与整体 Reset 的可辨识信息；具体报告形状由本票确定。

Reset 不绕过 Freshness、Drift 或 Interrupted Push。本票继续明确实际接入和失败场景：若 Troops.json 成为 Affected Project Data File，沿用当前整文件漂移机制时，外部 name/members 改动也会阻止写入；04 没有批准实时细粒度合并。Snapshot 中所属 troop 消失且声明仍存在时报错；成员重排按新位置解释，坏 Enemy 引用不能通过 runtime 过滤悄悄改变目标。等待 06 的未知数据规则后再完成本票决策。
