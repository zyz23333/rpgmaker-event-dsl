# 原生指令逐参数契约还缺哪些证据

Type: research
Labels: wayfinder:research
Status: resolved
Mode: AFK
Assignee: codex
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

## Answer

2026-10-19：逐参数事实调查与责任归口已完成，研究票 resolved。交付[完整参数证据索引](../research/command-parameters/index.md)及五个分片：核心24族、系统/地图48族、角色/战斗33族、移动45码、共享Qt/保存链。105+45逐项与原库存一致，包括完整条件模式、Game Data来源、原生续行/分支/终止/镜像，而非仅统计helper。

各参数表分别给出正式字段/候选、原生槽位与数量、值域/None、初值与已决Compiler Default、引用/Runtime Selector/Gate和待执行样本。能机械应用既决原则的保存配置已记录；新的模型和范围选择没有由研究代理代决。

### 证据与验证

- 本体内嵌QML/JS及随包帮助/runtime均只读核查；五分片195条EXE资源身份行逐条验证长度/编码/解码SHA，无不符。212个相对链接及标题片段核对通过；三位研究代理完成交叉审阅，已修正发现的字段表述与结构前置关联。
- 本轮实际使用REA + Ghidra 12.1.4检查编辑器随附 `QtQuick/Controls/qtquickcontrolsplugin.dll` 的SpinBoxValidator构造、元属性和getter，补齐整数、基础value0/step1/min0/max99证据。没有将DLL分析冒称为全面反编译编辑器。详细Evidence ID、二进制身份与初始化时序限制见[共享控件报告](../research/command-parameters/shared-controls.md)。
- REA Evidence bundle和snapshot仅留本地 `C:/Users/Shuen/.codex/research-evidence/mv-command-parameters-20261019/`，已成功关闭native session。研究分支不含原软件、资产、runtime源码或完整反编译输出。
- 六份原创Markdown已提交并推送到[研究分支](https://github.com/zyz23333/rpgmaker-event-dsl/tree/research/mv-command-parameter-evidence/.scratch/complete-mv-events/research/command-parameters)，提交 `7e3f137ccc5f5891c8e602e7b67810538817ae46`；远端ref与本地HEAD一致。未开PR、未合并；同内容报告已同步到当前工作区。`git diff --cached --check`通过。

### 新的明确设计依赖

1. [原生保存形态差异如何进入正式 DSL](12-native-saved-shape-model.md)：计时器Stop的缺失/存在秒数槽；移动记录省略parameters、终止外壳与静态推导indent:null；普通编辑留下的非空子体尾0。需要补充正式表示，不能补默认、删记录或raw。
2. [原生控件范围与保存值的支持边界如何划定](13-native-value-domain-boundaries.md)：非标准尺寸脸图可选索引、直接坐标随地图变化的越界与诊断、完整单字符串槽与控件行数的边界。EXP本体/帮助上限差异明确记录，目标真实输入核查交验收，不以用户选择代替事实。

两票仍open、未进行HITL讨论；[验收与实施顺序](08-completion-evidence-and-sequencing.md)继续被它们阻塞。本研究完成不等于全参产品契约已经定稿，更不等于完整支持已实现。后续决定须回写参数表及必要ADR；尚未执行的真实保存与运行样本由验收票接收。

本轮没有产品代码修改、产品测试、编辑器打开保存或游戏运行。原生工厂/插入/保存路径的静态推导与真实文件观察始终分开，未把所有未发现的形态宣布为非法。

## Comments

### 2026-10-18 — 从指令契约讨论中分出的明确后续调查

用户已同意 Q24，将逐参数证据表设为实施规格完成前置要求。本票据此创建；创建时尚未认领或执行，原生指令契约讨论尚待最终共同理解确认。研究遵循地图的首方资料、版本基准与发布边界，不提交本地编辑器、游戏资产或提取的首方源码副本。

### 2026-10-18 — 前置契约已最终确认

用户已最终确认 [原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md#answer)，前置讨论已 resolved，ADR 0011 已 accepted。本研究现在满足已声明的前置依赖，仍保持 open、未认领；本次没有执行全量参数调查。按正式 Answer 开展后续取证，新增模型冲突仍须用户决策。

### 2026-10-18 — 语义往返讨论对证据表的补充约束

[06 号票 Answer](06-semantic-roundtrip-policy.md#answer) 的 Q1–Q16 及完整契约已最终确认，06 已 resolved，ADR 0012 已 accepted。后续参数表应据此明确区分已知原生契约、未知载荷和待证形态，不将拒绝策略冒充原生非法证据：

- 各原生命令族的合法参数个数/对象键、必需字段、模式和值域须有明确证据；已知 code 不能因 recognizer 失败而自动 raw，未实现正式 helper 也不是未知命令。
- 逐项列出正常终止、空体 code 0、续行、402/505 镜像及分支组合；未证结构保留为待证，正常原生反例引出明确模型决策。自动修复、删记录与镜像择一均未获批准。
- 05 当前 Answer 已按 06 Q13 明确：四类行记录命令只以 LF 分隔，CR 字面保留，单条原生文本槽内部 LF 与已有超长组按当前模型拒绝；这不证明其一定不是正常原生形态。Qt 及实际编辑器保存证据继续独立取得，不能以选择了字符映射代替实验。
- 原生脚本槽及可识别 raw 内引用遵循同一校验；路线采用同一模型，未知移动指令拒绝。证据表需覆盖所需递归位置、例外和错误/警告等级。

本次仅转交设计输入，未认领或执行全量调查，不改变本票 open 状态或实施规格完成门槛。

### 2026-10-19 — 开始逐参数研究

由主代理认领并协调按命令族划分的 research 子代理；以本次已提交的领域契约和首方 MV 1.6.1 资料为依据。用户已配置 REA + Ghidra，并授权在必要时查看所提供的 MV 编辑器实现。研究报告区分已决产品规则、目标静态证据、推断与真实观察；新增模型冲突形成独立决策依赖，不自行改变已决规则。

### 2026-10-19 — 研究结果已发布并交接

详见正式Answer和参数总索引。已创建两项必要HITL依赖并接入验收票；本轮只解决本研究票，没有替用户解决新增设计选择。
