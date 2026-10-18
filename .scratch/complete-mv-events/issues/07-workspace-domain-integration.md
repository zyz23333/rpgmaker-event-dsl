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
