# 敌群战斗事件的身份与数据所有权如何划定

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 01
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[MV 原生事件数据的完整边界与版本基准是什么](01-native-event-data-baseline.md)。

与用户确定 Troops.json 中战斗事件的定义边界、Entry Identity、页顺序与条件/span 模型：DSL 如何定位所属 troop、如何表达原生有序事件页、所属 troop 不存在时如何处理，以及删除/清空事件页的含义。

敌群成员与其他非事件字段不自动成为 DSL-Owned Project Data。明确事件页的 Data Domain 与 carrier 合并边界，使修改战斗事件不能意外覆盖 troop 名称、成员及其他外部数据。比较可行的领域模型与失败场景；若需要修改 ADR 0003 / 0004 的既有原则，明确提出而不暗中绕过。
