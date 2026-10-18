# 地图事件备注与完整事件页应采用什么 DSL 模型

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 01, 10
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[MV 原生事件数据的完整边界与版本基准是什么](01-native-event-data-baseline.md)、[原生事件属性的合法值与创建默认值是什么](10-editor-event-defaults-and-limits.md)。

基于原生事件数据基准，与用户确定地图事件 note、图像、页条件、触发、自主移动、速度频率、优先级、动画、固定朝向与穿透的完整 Schema-First DSL。

需要选择字段分组和术语、显式值与 Compiler Default 的边界、互斥表示与非法组合的表达方式、自主移动与 Set Movement Route 的共享模型，以及缺省字段在原生数据往返时的含义。不能以合并旧事件的隐式继承替代 DSL 的完整表达。

允许直接破坏现有 API，无兼容层或迁移说明。用具体原生事件例子与用户讨论；按 domain-modeling 及时记录已经共同确定的领域术语，只有符合条件的取舍才写 ADR。

## Research inputs

[原生事件的创建初值与属性控件范围](../research/event-defaults-and-limits.md) 已区分工厂模板初值、控件自身初值、可选范围、runtime 接受范围和真实 UI 行为。地图空页 priority 为 0，人物图选择会触发不同的优先级联动；不要把其中任一路径未经讨论地强加为 DSL 默认值，也不要用新建初值改写已有数据。
