# 语义无损往返与未知数据处理的精确契约是什么

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 01, 02, 09, 10
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[MV 原生事件数据的完整边界与版本基准是什么](01-native-event-data-baseline.md)、[原生事件指令的参数与结构还存在哪些保真缺口](02-native-command-fidelity.md)、[编辑器如何保存分支与移动路线及不启用的字段](09-editor-serialization-evidence.md)、[原生事件属性的合法值与创建默认值是什么](10-editor-event-defaults-and-limits.md)。

与用户把“原生事件 decompile → compile → push 后语义等价”变为可判定契约：哪些字段和指令结构必须保持，哪些表示差异允许归一化，脚本文本、插件命令字符串、code 0、续行、默认值与无效但已有的数据如何处理。

分别决定未知命令、已知命令的异常参数、事件/页额外字段和非事件 carrier 字段的保留或拒绝方式。明确错误发生阶段、诊断位置和禁止静默丢失的保证，检查 raw fallback 与 Script Command Gate 的边界。

讨论的目标是有边界且可测试的数据契约，不是对任意 JavaScript 程序做不可判定的行为等价证明。现有 ADR 0003 将 decompile 定为 best-effort starting point；必须明确这次原生支持范围内保证如何收紧，是否需更新 ADR，而不把对非标准数据的能力说成完美往返。

## Comments

### 2026-10-18 — 已决地图页模型输入

[03 号票](03-map-event-page-model.md#answer) 与 [ADR 0009](../../../docs/adr/0009-preserve-native-map-page-saved-state.md) 已确认：禁用条件、非 custom 路线与未显示的图像字段属于正式保存状态；不因当前模式未使用而清理。note 原样保存，反编译仅在固定默认能准确重建时省略字段，不从旧事件隐式继承。禁用条件的显式非负整数 ID（含 0）允许无目标，名称引用仍须唯一解析；该例外不扩展到路线。ID 0 的保存能力是明确设计选择，不是已验证的编辑器工厂输出。

本票继续确定范围外属性、未知字段、异常路线及其他原生结构的统一保留/拒绝机制和诊断阶段，禁止裁剪、重置或静默略过。03 未批准 raw 页或未知字段透传，也没有代替本票收紧 ADR 0003 的全局往返保证。应区分已选择的正式保存能力、普通编辑器输出与尚未验证的异常输入行为。
