# 原生指令的完整参数与结构应如何表达和校验

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 02, 09
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[原生事件指令的参数与结构还存在哪些保真缺口](02-native-command-fidelity.md)、[编辑器如何保存分支与移动路线及不启用的字段](09-editor-serialization-evidence.md)。

根据指令保真调查，与用户确定补齐原生合法参数、分支、续行与移动路线的正式 DSL 契约，包括术语与 helper 命名、互斥参数、默认值、地图/公共/战斗上下文的校验边界，以及脚本输入门禁与原生插件命令的行为。

所有合法原生事件形态都必须有正式表达，不能靠 rawDslCommand 把缺失功能包装成支持。对研究发现的每类缺口选择表达与校验原则，明确编译和反编译遵循的共同语义；实现仍沿用 ADR 0008 的 command-family 所有权。

## Comments

### 2026-10-18 — 已决地图页模型输入

[03 号票](03-map-event-page-model.md#answer) 已经用户最终确认并解决。自主移动与 Set Movement Route 共用 Movement Route 对象 `{ commands, repeat?, skippable?, wait? }`，commands 必填且可为空，标志默认 true / false / false；命令形状改为 `setMovementRoute({ target, route })`。wait 在 Set Movement Route 中控制解释器等待，在自主移动中只保留保存值。所有保存路线均执行完整指令、引用与 Script Command Gate 校验，非 custom 页不豁免。

本票继续确定移动子指令的完整参数、原生续行/终止结构及其他命令族契约，沿用该共享对象与默认值，不引入页专用的另一套路线。禁用条件槽的保存 ID 例外不适用于路线指令。长期依据见 [ADR 0009](../../../docs/adr/0009-preserve-native-map-page-saved-state.md)。
