# 原生指令逐参数契约还缺哪些证据

Type: research
Labels: wayfinder:research
Status: open
Mode: AFK
Blocked by: 05
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

依据 [原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md) 已确认的 Q24，将 [105 类事件指令与 45 类移动指令库存](../research/native-command-fidelity.md) 补成逐参数契约证据表。库存完整不代表参数契约完整；本票提供完成实施规格所需的事实与明确缺口，不实现产品、不替代真实验收，也不自行选择新的领域模型。

## Deliverable

在 research/ 下保存逐参数报告；可按命令族拆为文件，并由一份索引覆盖全部库存项和原生变体。每个参数或彼此关联的参数组至少记录：

| 项目 | 必需内容 |
| --- | --- |
| 正式表达 | helper/kind、schema 字段与模式、必需字段及互斥约束；区分已决规则与尚需用户决策的候选 |
| 原生映射 | command code、parameters 槽位、值编码、续行/分支/终止与镜像归属 |
| 值域 | 类型、整数/小数、枚举、数值边界、原生哨兵、空输入、None 与其他保存字段的关系 |
| 默认与省略 | 新建初值、固定 Compiler Default、反编译省略条件及对应证据强度 |
| 校验 | Project Data Reference / Asset Reference / Runtime Selector 分类、项目依赖与上下文、错误或警告 |
| 证据 | 首方帮助、模板/runtime、本体静态源码、推断或真实观察的精确出处；不混淆编辑控件与数据保存约束 |
| 验证需求 | 边界组合、原生 fixture 与编辑器/游戏最小样本，未知事项及其责任归属 |

## 已知调查重点

- 各命令族仍未深审的必填值、可省略字段、枚举/数值边界、操作数/目标模式与原生槽位。沿用已决 Schema-First 和命名规则；不能将现实现中的裸数字、位置参数或缺失字段自动认定为正式规范。
- 所有素材槽逐个确认是否允许 None，以及空素材时 index/volume/pitch/pan 等是否独立保存；以命令参数的原生编码为准，不混用 runtime 内部 null 状态。
- Change Equipment 的 slotIndex 与最终 System 装备槽容量、动态 equipment ID 的值域与候选诊断；不得误作静态 weapon/armor 项目引用。
- Control Switches/Variables 的范围控件保存与反向输入；动态来源、各 Game Data 分支和 selector 子集。先前已决定正式编写拒绝逆序，事实调查不擅自撤销它。
- 四类文本命令逐槽编码、空文本、尾部空行、超长已保存组、CR/LF/CRLF 与内嵌换行。普通编写上限已由 Q22 选择；若新证据证明正常原生形态被排除，应提出明确冲突，不能用 Raw DSL 回退掩盖。
- Choices/Conditional/Loop/Battle 的完整结构参数，包括 403 `[6,null]` 的落盘推断；205/505/路线终止与 event code 0 的差异。既有镜像冲突与异常结构政策由语义往返讨论决定。
- Transfer、Set Event Location、Shop、Battle 的隐含 Qt 默认与新建保存样本；将“已选固定 DSL 默认”与“目标编辑器实际默认已证”分别标记。
- 共享 Movement Route 各子指令的剩余字段和值域，以及 Script Input 在各槽的要求；门禁递归覆盖规则沿用已决契约。

## 完成边界

能机械应用已确认契约的项目直接记录；事实调查不能自行回答新的设计选择。发现新模型冲突、正常原生形态无法正式表达或需要改变已决规则时，建立明确的 HITL 决策依赖，再让用户讨论。缺少证据不得猜默认、照抄当前测试预期、静默归一化，或用 raw 标记为已支持。

最终报告必须完整索引所有库存项并逐项说明状态。影响接口、合法范围或原生编码的未知项需要继续取证，或形成可跟踪的前置依赖；不能仅写“实施时确认”就声称契约完成。已选固定默认仍需真实保存验证之类不再阻塞设计的实验，明确交接给 [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md)。真实自动化/编辑器/游戏验收记录与本票研究结论分开。

本票及其新增的必要决策依赖完成前，不得把完整支持的实施规格标为已定。后续往返政策与 Workspace 决策若改变相关前提，更新参数表并保持原生证据与产品选择可区分。

## Research inputs

- [原生指令参数与结构调查](../research/native-command-fidelity.md)：完整类别索引及有界静态缺口。
- [编辑器保存规则](../research/editor-serialization.md)：分支、路线、镜像及非激活保存状态。
- [本轮指令契约的编辑器静态证据](../research/command-contract-editor-evidence.md)：Choices、空体、默认、空 Shop、换装、文本、None 素材和连续范围；明确尚未执行的样本。
- [原生事件创建初值与控件范围](../research/event-defaults-and-limits.md)：相关属性及证据方法，不能代替指令逐参数检查。

## Comments

### 2026-10-18 — 从指令契约讨论中分出的明确后续调查

用户已同意 Q24，将逐参数证据表设为实施规格完成前置要求。本票据此创建；创建时尚未认领或执行，原生指令契约讨论尚待最终共同理解确认。研究遵循地图的首方资料、版本基准与发布边界，不提交本地编辑器、游戏资产或提取的首方源码副本。

### 2026-10-18 — 前置契约已最终确认

用户已最终确认 [原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md#answer)，前置讨论已 resolved，ADR 0011 已 accepted。本研究现在满足已声明的前置依赖，仍保持 open、未认领；本次没有执行全量参数调查。按正式 Answer 开展后续取证，新增模型冲突仍须用户决策。
