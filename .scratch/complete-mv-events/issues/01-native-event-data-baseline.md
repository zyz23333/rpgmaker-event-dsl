# MV 原生事件数据的完整边界与版本基准是什么

Type: research
Labels: wayfinder:research
Status: resolved
Mode: AFK
Assignee: mv_reference_inventory
Blocked by: none
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

依据首方编辑器帮助、随包模板与明确标注 1.6.1 的 runtime，完整列出 Map Event / Common Event / 敌群战斗事件的原生字段、页条件、触发与执行跨度、默认值、合法值，以及共享指令列表的上下文边界。

需要确认：地图事件 note、页图像与图块、移动与页选项；公共事件 trigger/switchId；敌群页 conditions/span/list 与其所属 troop 的非事件字段边界。对照当前实现区分已支持、缺失、会丢失的数据。

记录资料路径、版本证据、精确行号或稳定定位与必要的摘要。帮助、模板、runtime 和编辑器实际保存行为必须分开标识；不能仅凭 runtime 证明编辑器本体版本或保存行为。列出仍需编辑器行为证据的问题；有具体必要性时才用 REA，记录 Evidence 与覆盖限制。

产物为一份可供事件模型和所有权决策复用的研究报告；不设计最终 DSL、不实现功能。

## Comments

- 2026-10-18：由 `mv_reference_inventory` 认领，在临时 `research/mv-native-event-data` 分支保存研究；主代理负责本票状态和地图索引，避免并发改写。

## Answer

已建立三类原生事件容器、全部字段、主要枚举和执行上下文的首方基准，并定位当前事件备注、页属性、战斗页与非激活槽位的缺口。详细结论、版本/哈希和逐项源码出处见 [MV 1.6.1 原生事件数据边界研究](../research/native-event-data.md)。

本票的字段边界调查完成，不表示所有原生控件或运行行为已经验证。已明确的剩余事实调查由 [原生事件属性的合法值与创建默认值是什么](10-editor-event-defaults-and-limits.md) 和 [编辑器如何保存分支与移动路线及不启用的字段](09-editor-serialization-evidence.md) 承接；不得将模板/样例值当作所有创建路径的默认值。

研究分支 `research/mv-native-event-data`，提交 `ccdacbf31874e6fae553742659dce7e4338f6e40`，已推送；仅含原创报告，不开 PR、不合并。核验了单文件提交、干净研究工作树、报告引用与本地副本；未执行编辑器、游戏或产品测试。
