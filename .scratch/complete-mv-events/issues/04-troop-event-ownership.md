# 敌群战斗事件的身份与数据所有权如何划定

Type: grilling
Labels: wayfinder:grilling
Status: resolved
Mode: HITL
Blocked by: 01
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

前置资料：[MV 原生事件数据的完整边界与版本基准是什么](01-native-event-data-baseline.md)。

与用户确定 Troops.json 中战斗事件的定义边界、Entry Identity、页顺序与条件/span 模型：DSL 如何定位所属 troop、如何表达原生有序事件页、所属 troop 不存在时如何处理，以及删除/清空事件页的含义。

敌群成员与其他非事件字段不自动成为 DSL-Owned Project Data。明确事件页的 Data Domain 与 carrier 合并边界，使修改战斗事件不能意外覆盖 troop 名称、成员及其他外部数据。比较可行的领域模型与失败场景；若需要修改 ADR 0003 / 0004 的既有原则，明确提出而不暗中绕过。

## Answer

用户于 2026-10-18 在逐轮确认 Q1–Q11 后，对完整模型最终回答“确认”。以下为本票已决答案；长期取舍记录在已接受的 [ADR 0010](../../../docs/adr/0010-troop-event-ownership-and-reset.md)。本票完成设计决策，产品实现与后续验收由相关票继续承接。

### 所有权与身份

Troop Event 是一个既有敌群的完整有序 Battle Event Page 列表，整个工程的此数据域由 DSL 接管。正式顶层声明为 `troopEvent({ troopId, pages })`，以显式 troopId 确定 Entry Identity；同 ID 重复声明报错，不增加另一事件 ID，不使用名称绑定。troopId 沿用既有 ID 规则并必须在 Snapshot 中实际存在，不额外施加编辑器 2000 上限。空名称、空成员的实际敌群仍合法；不存在时编译报错，不自动创建或跳过。

DSL 只拥有 pages。敌群的 id、name、members、成员站位及其他非事件 carrier 数据继续来自 Project Data Snapshot，不以事件支持为由重建。Battle Event Page 没有独立 ID，编译和反编译保留数组顺序；MV 优先选择最低页号的可执行页，不沿用地图页的最高页号优先规则。部分删页不留 null 孔。

### 正式 Battle Event Page Schema

`battlePage({ conditions?, span?, commands })` 使用以下保存模型；conditions 可省略或为空，未提供的整槽补固定默认，已提供的对象槽必须包含 enabled 与全部配置字段。完整页从 DSL 和固定默认构建，不继承旧页。

| 字段 | 正式表达 | 固定默认与原生映射 |
| --- | --- | --- |
| conditions.turnEnd | boolean | false；turnEnding |
| conditions.turn | `{ enabled, a, b }` | false / 0 / 0；turnValid / turnA / turnB |
| conditions.enemy | `{ enabled, index, hpAtMost }` | false / 0 / 50；enemyValid / enemyIndex / enemyHp |
| conditions.actor | `{ enabled, ref, hpAtMost }`，actorRef | false / ID 1 / 50；actorValid / actorId / actorHp |
| conditions.switch | `{ enabled, ref }`，switchRef | false / ID 1；switchValid / switchId |
| span | battle / turn / moment | battle；0 / 1 / 2 |
| commands | 必填，可为空的 DSL Command 列表 | list；[] 编译为原生事件结束标记 |

所有启用条件按 AND 组合；没有启用条件的页合法且不会运行。A/B 为整数 0..9999；HP 为整数 0..100，禁用仍校验类型与范围。B=0 匹配 n=A；B>0 保留原生 n>=1、n>=A、n%B=A%B 的语义。span 保留原生战斗检查时机，不解释成任意时刻即时回调。pages 必填且非空；超过 20 页警告并完整保留，不裁剪或重排。

### 条件引用与成员位置

启用 actor/switch 条件的引用必须解析到现有条目。禁用时仅显式非负整数保存 ID 可以没有目标，允许 0；默认禁用占位 ID 1 同样不检查存在性。名称引用即使禁用也必须唯一解析，DSL-owned 开关名称不回退 Snapshot。此例外不扩展到页内指令引用。

enemy.index 为非负整数、0 起始成员位置，不是 Enemy 数据库 ID。启用时位置必须存在，并检查整个所属敌群的成员 Enemy 引用均有效；任何坏 Enemy 引用会造成 runtime 过滤和后续索引偏移，编译应报错，不模拟过滤后自动绑定。hidden 成员占据位置。禁用时保留当前成员数之外的旧位置，不要求成员存在，但 index 的非负整数要求和 HP 范围仍校验。该存在性例外不因为隐藏、死亡或其他运行状态而扩大。

成员插入、删除、重排或替换之后，条件仍按新列表中的位置解释，不追踪先前的敌人身份。05 / 07 继续统一指令内敌人选择器和真实 Workspace 输入路径；本票的启用条件检查不意味着对所有外部数据库字段做全面验证。

### 空白状态、缺失声明与 Destructive Change

Blank Troop Event 精确指一张固定默认 Battle Event Page：全部条件关闭，保存值与上表默认完全一致，span=battle，原生 list 只有默认结束标记。只要保存值、指令或页数有差异，就不属于此状态；不按运行时是否可达判断空白。

| 操作或差异 | 结果与分类 |
| --- | --- |
| 显式 `pages: [battlePage({ commands: [] })]` | 生成 Blank Troop Event |
| 某个实际存在敌群没有 DSL 声明 | 同样生成 Blank Troop Event，不回填 Snapshot 页 |
| `pages: []` | DSL 编译报错；不以零页作为正常输出 |
| 原非空白事件变成 Blank Troop Event | Troop Event Reset，属于 Destructive Change，Push 要求显式允许 |
| 原本已是 Blank Troop Event，声明省略或仍写空白 | 无事件变化，不是 Destructive Change |
| 局部删页、清指令或改条件，结果仍非空白 | 普通内容修改；不属于本次新增的整体 Reset 分类 |

Reset 是否发生取决于 Snapshot 与 Generated Project Data 的前后内容，不取决于源码是显式空白还是省略声明。它不删除 troop，不改变 members/name，不向 Troops 的 ID 槽或 pages 写 null，不绕过 Generated Freshness、Project Drift 或 Interrupted Push 规则。它是对既有 Destructive Change 定义的明确扩展；Entry Removal 仍描述 Snapshot-Only Owned Entry 的实际移除，二者不能混用。

ADR 0003 的全域完整输出、Snapshot carrier 来源与保守 Push 模型保持；ADR 0004 的显式 ID 保持，其 null 孔规则只适用于 Map/Common 事件 ID 数组，不适用于无独立 ID 的战斗页。事件所有权不使所属 troop 本身变成 DSL-owned 定义，也不使已有 troop 项目引用改指战斗页定义。

### 反编译与后续边界

对正式支持的数据，为每个实际存在的 troop 输出一个声明，包括默认空白事件。保持页顺序；commands 始终输出。仅省略固定默认能精确重建的字段：battle span 可省略，条件槽只有整槽完全等于默认才省略；禁用但非默认的保存值必须输出。不因页当前不会运行而省略页、事件或指令。

- 05：页内指令的完整参数、执行上下文、敌人选择器及 Script Command Gate；禁用条件例外不传播到指令。
- 06：未知字段、异常 JSON、范围外数据、零页输入的保留或拒绝与诊断阶段，以及全局往返契约；本票未授权静默丢失、未知字段归零或 raw 页替代正式原生表达。默认空白判定不得只挑已知字段比较后忽略额外数据。
- 07：将此领域接入 Staged Data Graph、反编译、物化、Structured Diff、Freshness、Drift 和 Interrupted Push；保持 Snapshot 中的非事件 carrier 数据，区分 troop 引用与 Troop Event 身份，并核验空名称存在性与完整成员上下文。
- 08：规划空白/Reset 的 diff 与 destructive gate、成员变化与引用例外、页顺序与三种 span、数量边界、编辑器重存和游戏运行验收。超过普通编辑器范围的保存能力不等于真实编辑器已验证。

同步细节继续由 07 明确：现有 Push 只对 Affected Project Data Files 做整文件漂移检查。因此沿用现有规则时，若 Troops.json 是将写文件，外部对 name/members 的修改也会阻止该文件写入；本票未批准实时细粒度合并或绕过重编译。

## Comments

### 2026-10-18 — 开始设计讨论

用户通过 grill-with-docs 指定讨论本票；按 grilling 与 domain-modeling 分轮确认设计。前置 01 已解决，并参考 03 的地图页保存状态决策及 09 / 10 的编辑器静态证据。本票认领仅表示讨论进行中；尚无新增已决结论，不表示产品实现开始或验收完成。

### 2026-10-18 — 第一轮：Q1–Q3 已确认

用户对 Q1–Q3 回答“同意”。以下为本轮已决内容，整票仍待后续讨论和最终共同理解确认。

1. **Q1 定义边界与身份**：一个 Troop Event 是指定敌群的完整 Battle Event Page 列表，以显式 `troopId` 定位所属敌群并确定 Entry Identity，不增加独立事件 ID，不按名称绑定。同一个敌群最多一个定义。声明不拥有 troop 的 name、members 或成员站位；这些非事件字段继续来自 Project Data Snapshot。`troopEvent({ troopId, pages })` 是已确认的概念形状，具体公共 helper 命名待完整 API 核对。
2. **Q2 页顺序与身份**：Battle Event Page 没有独立 ID，按所属 Troop Event 中的数组位置区分。编译和反编译保留原数组顺序，不自动排序；MV 从最低页号开始选择满足条件的页，重排属于有意义的行为变更。
3. **Q3 保存状态**：以固定 Battle Page Condition Slots 表达回合结束、回合数、敌群成员 HP、角色 HP、开关；除回合结束布尔值外，各槽分别保存启用状态与配置。禁用配置必须保留；省略时补固定空白战斗页默认值，不从旧页继承。启用条件按 AND 组合，全部关闭的页合法且不会运行。具体字段、默认值和禁用引用校验例外尚待下一轮。

对应领域词条已更新到 GLOSSARY.md。本轮尚未决定全域接管下的缺失定义、零页/空白页、移除分类、所属 troop 缺失、条件数值与引用校验、详细反编译策略；不得把这三个基础结论扩写为这些问题的默认答案。

只读核对发现：当前产品只将 Troops.json 用于 Snapshot 与项目引用，没有 Troop Event 的完整编写链路。现有同步按 Snapshot 构造 carrier，Push 对 Affected Project Data Files 检查整文件漂移；现有条目删除判定不覆盖条目内部删页。当前名称引用索引还会略过空名称 troop，不能用它代替所属 troop 的原始 ID 存在性判断。原生常规战斗页按钮路径保持 1..20 页，零页装载/重存尚无真实编辑器验证。证据见 [原生事件边界](../research/native-event-data.md)、[编辑器默认与边界](../research/event-defaults-and-limits.md) 及当前 `project-data/materialization.ts`、`project-data/structured-diff.ts`、`workspace/push.ts`、`validation/snapshot.ts`。

### 2026-10-18 — 第二轮：Q4–Q7 已确认

用户对 Q4–Q7 回答“同意”。

4. **Q4 整体接管**：整个工程的 Troop Event 数据域由 DSL 定义，不采取逐敌群接管或未声明事件从 Snapshot 回填的模式。首次接管通过反编译生成现有声明。缺失声明到底报错还是构成移除、移除的原生表示与安全分类仍待后续确认。
5. **Q5 所属敌群**：`troopId` 必须对应 Snapshot 中实际存在的敌群；缺失时编译报错，不自动创建，不跳过声明。真实存在但名称为空或成员为空的敌群仍合法；成员引用另行校验。仅改名不影响身份。
6. **Q6 正式 Schema 与固定默认**：采用 `troopEvent({ troopId, pages })` 与 `battlePage({ conditions?, span?, commands })`。条件为 `turnEnd: boolean`、`turn: { enabled, a, b }`、`enemy: { enabled, index, hpAtMost }`、`actor: { enabled, ref, hpAtMost }`、`switch: { enabled, ref }`。actor/switch 使用相应 Project Data Reference；enemy.index 从 0 开始，不是 Enemy 数据库 ID。省略条件槽时，turnEnd=false，其余 enabled=false，A/B=0/0，enemy index/HP=0/50，actor ID/HP=1/50，switch ID=1；提供槽时 enabled 与配置必填。A/B 为整数 0..9999，HP 为整数 0..100，禁用仍验证类型与数值范围。B=0 匹配第 A 回合，B>0 保留 MV 周期语义，不额外匹配第 0 回合。span 为 battle/turn/moment，默认 battle，对应原生 0/1/2。commands 必填且允许 []，空指令编译为原生结束标记，不表示删除页面。
7. **Q7 禁用角色／开关引用**：启用时必须解析到现有条目；禁用时显式非负整数 ID 可无目标，允许 0。名称引用即使禁用也必须唯一解析，DSL-owned 开关名不回退 Snapshot。默认禁用 ID 1 同样不依赖条目存在。例外仅限禁用条件，不扩展到页面内指令引用。enemy 成员位置的检查尚待单独确认。

补充事实：零售 runtime 的 `Game_Troop.setup` 会过滤 Enemy 数据库目标不存在的成员，可能使后续运行时索引前移；hidden 成员不会被过滤。正常成员引用有效时，enemyIndex 对应原生 members 的 0 起始位置；成员没有稳定独立身份，重排不会自动重绑定条件。精确源码为 `references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:5233,5250,5325`；该事实不预先决定坏引用的验证政策。

### 2026-10-18 — 第三轮：Q8–Q11 已确认

用户对 Q8–Q11 回答“同意”。

8. **Q8 删除与清空**：清空采用一张完全默认空白页。显式空白与删除声明生成相同空白状态；pages=[] 报错，局部删页不留 null，清 commands 保留其他配置。Snapshot 非空白变成默认空白一律是 Troop Event Reset，Push 要求 allow-destructive，不区分源码写法；原本默认空白则无变化。空白判定精确覆盖全部保存状态，不等同于所有条件关闭。局部变化后仍非空白继续属于普通内容修改。敌群及外部字段始终保留，Destructive Change 定义作相应有限扩展。
9. **Q9 成员位置**：index 非负整数。启用 enemy 条件时位置存在且所属敌群全部成员 Enemy 引用有效，否则报错以避免 runtime 过滤引起索引偏移；hidden 成员不跳过。禁用时可保留超出成员数的旧位置，类型和 HP 范围仍检查。成员变动后按新位置解释，不自动跟踪原 Enemy；条件规则不越权决定指令选择器的最终契约。
10. **Q10 数量限制**：战斗页超过 20 页警告并保留；troopId 不额外施加编辑器 2000 上限，仍检查既有身份规则与实际存在性。不把这项支持选择视为超限数据已通过真实编辑器保存。
11. **Q11 反编译**：每个现有敌群都输出声明，包括默认空白事件；commands 始终输出，battle span 可省略，整条件槽仅在保存状态完全等于默认时省略；保留非默认禁用配置，不按当前运行效果省略页或事件。

已将上述结果整合为票首 Decision draft，并记录 ADR 0010 proposed；等待用户核对完整模型、确认共同理解后再结案。只修改设计文档，未运行产品、编辑器或游戏验收。

### 2026-10-18 — 最终确认与结案

用户对完整模型、代表性声明、Reset 分类和后续票分工回答“确认”。据此将本票标记 resolved，汇总转为 Answer，ADR 0010 转为 accepted；同步更新 GLOSSARY、ADR 0003 / 0004 的适用范围说明、决策地图以及 05 / 06 / 07 / 08 的输入索引。

本票完成了事件所有权、显式身份、页序、条件/span、默认值与引用校验、空白/Reset 语义、数量边界和反编译规则的设计。核验依据包括前置研究、当前代码与零售 runtime 静态源码；文档通过 git diff --check 和相对 Markdown 文件链接检查。只修改设计文档，没有实施功能或运行产品测试、真实编辑器与游戏验收；后续票继续承接这些工作。
