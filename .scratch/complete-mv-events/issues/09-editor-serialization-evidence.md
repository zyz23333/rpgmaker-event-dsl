# 编辑器如何保存分支与移动路线及不启用的字段

Type: research
Labels: wayfinder:research
Status: resolved
Mode: AFK
Assignee: mv_editor_serialization
Blocked by: none
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

runtime 只消费部分事件字段，不能单独证明编辑器重新打开、显示和保存所需的数据结构。以用户指定的 `references/RPGMV` 为目标，确认其编辑器本体版本与保存形态，重点是 Show Choices 的 402 文本槽、Set Movement Route 的 505 续行镜像，以及禁用条件槽、无触发公共事件的 switchId、非自定义自主移动页的 moveRoute、图像残留字段的保留/归一化行为。

优先寻找现成的原生保存产物和首方资料。确有必要时按 reverse-engineer-anything 使用 REA 对该编辑器做聚焦静态调查；现有源码调查不启动 REA。不得把 runtime 忽略字段视为编辑器不需要字段，不得把版本常量当作编辑器版本证据。

分别标识静态观察、由代码推断的序列化约束、真实编辑器运行观察与未知项。没有执行编辑器不得声称保存实验通过；缺少工具时记录具体阻碍和可继续的最小取证任务，不为本票擅自改客户端配置或安装原生分析引擎。

产物为可供无损契约使用的证据报告。无法取得决定性证据的项目保持未决，而不是靠通行知识补写结论。

## Comments

- 2026-10-18：由 `mv_editor_serialization` 认领；仅在本地明确目标上取证，主代理负责本票状态与地图索引。

## Answer

版本与本票要求的静态保存规则已答，见 [MV 编辑器分支、移动路线与禁用字段的静态保存证据](../research/editor-serialization.md)。REA PE 资源 Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24` 定位了目标自身的版本资源，普通结构解析确认为 FileVersion 1.6.1.0 / 字符串 ProductVersion 1.6.1。

验证长度、压缩边界与哈希的完整嵌入 QML/JavaScript 显示：402 保存 choice 索引和文本，且显示函数读取文本；205 保存路线并为非终止子指令生成 505 镜像；空 choice 分支生成更深 indent 的 code 0；禁用条件、none 公共事件和非 custom 自主路线保留各自独立字段。重新确认图像选择会重建图像并可能调整优先级，不能把这种编辑操作归一化当作无操作往返规则。

以上是随包代码的静态证据，没有执行目标或做真实保存实验；403 的潜在 null 槽、信号时序及异常输入需样本检验。报告附有一次临时项目即可覆盖的最小保存实验清单，交给 [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md) 纳入真实环境验收，不标为已经通过。

研究分支 `research/mv-editor-serialization`，提交 `3f8d4fdf8711b11fe03b20fff5fab5139165869c`，已推送；仅原创报告，不开 PR、不合并。未安装原生分析引擎或修改 REA/Codex 配置。
