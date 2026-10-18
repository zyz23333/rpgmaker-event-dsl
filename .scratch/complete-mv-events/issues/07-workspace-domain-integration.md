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
