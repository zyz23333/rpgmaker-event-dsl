# 原生保存形态差异如何进入正式 DSL

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 11
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

逐参数研究发现三类由原生编辑路径产生、但当前已决接口尚不能充分区分的保存结构。如何补充正式 DSL，使编译、反编译和 Push 保留字段/槽位存在性、原始值、结构终止及镜像，并继续拒绝真正未知字段？

本票由用户参与决定；不能用 raw 兜底、静默补默认或清理记录来绕过已定的完整原生支持与保存结构往返要求。

## Research inputs

- [逐参数研究总索引](../research/command-parameters/index.md#需要用户讨论的保存形态)、[核心参数证据](../research/command-parameters/core.md)、[移动参数证据](../research/command-parameters/movement.md#原生移动记录外壳的待决差异)和[共享保存链](../research/command-parameters/shared-controls.md)。原始目标身份、精确偏移/行号和证据强度均在报告中。
- **停止计时器的可选保存槽**：新建 Stop 保存 `[1]`；普通 Start 83 秒后改 Stop，保存器只修改操作槽，可保留 `[1,83]`。完整静态路径已闭合，真实编辑器样本尚未执行。只有 action 的 Stop schema 无法表达差异；统一删 seconds 或补 0 都改变保存结构。
- **移动记录外壳**：无参按钮只创建 code，参数化工厂创建 parameters 数组；新建路线和空白页模板的 M0 分别可缺 parameters 或含 `[]`。插入器对缺失 indent 做算术，沿最终 JSON 保存路径推导 `indent:null`；205/505不清洗子记录。该 null 结论是静态推导，没有冒称真实文件观察。它不应未经调查就被当作插件额外字段。
- **子体末尾 code 0**：在空体的 0 前普通插入命令保留原 0；已读的同体删除/剪切路径不会单独删掉该尾0。Conditional/Choices/Battle重确认只给零长度体补0，既不删除非空体已有0，也不为已载入的非空无0体统一补0。尚未证明同内容有/无尾0都能由普通UI创建；不能根据这个未知直接选择全量强加或全量移除。

## Decisions required

1. Control Timer 的停止模式如何表达秒数槽缺失、存在且为 0、存在且非 0；选定正式字段、编写默认、反编译输出及校验边界。
2. 共享 Movement Route 是否需要明确的原生保存形态信息，如何表达无参 parameters 的缺失/空数组、子项 indent:null 及终止项外壳，并复用于页自主移动和 Set Movement Route。只允许已证形态，不演变为任意 JSON 通道。
3. 子体记录终止如何建模或生成；哪些已证结构可机械恢复，哪些差异必须显式表达。选择应覆盖 Choices、Conditional、Loop、Battle 及嵌套；如需继续取证某个精确普通编辑路径，再独立形成研究前置。
4. 编译/反编译的精确比较、205/505镜像、异常诊断与递归引用/Gate如何复用现有约束；无法表达的正常形态必须先补模型。

候选可以是有限的显式保存字段、结构对象或有证唯一生成规则；研究没有批准其中任何一种。讨论时给出具体输入/原生输出例子，不替用户作决定。

## ADR impact

可能需要补充或重开 ADR 0009 的共享 Movement Route、ADR 0011 的正式指令/子体表示，以及 ADR 0012 的原生记录外壳与终止约束。当前已接受 ADR 不在研究收尾时自动改写；保存结构和值等价这一底线不因此放宽。

## Completion and handoff

正式 Answer 应明确所有字段、缺失语义、默认、原生映射、诊断及必要样本；同步受影响的参数报告和领域记录，再解除本票对 [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md) 的阻塞。实际编辑器创建/重存/重确认和游戏运行由验收规划承接；不能把尚未执行的样本记为通过。

## Comments

### 2026-10-19 — 从逐参数研究中形成明确设计依赖

本票记录已发现的保存结构问题，未认领、未开始 HITL 讨论、没有新模型决议。研究报告保留静态事实、路径推断与真实观察的区别。
