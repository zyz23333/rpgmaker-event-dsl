# 原生事件指令的参数与结构还存在哪些保真缺口

Type: research
Labels: wayfinder:research
Status: resolved
Mode: AFK
Assignee: mv_support_inventory
Blocked by: none
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

以首方 MV 1.6.1 runtime、编辑器帮助和可得编辑器数据形态为基准，对照当前 authoring / compiler / decompiler / validation / tests，建立原生事件指令及移动路线的支持矩阵。区分“有 helper / 不走 raw”的种类覆盖，与合法参数、分支、续行、嵌套和往返覆盖。

优先核查已有疑点：Transfer Player 的保持朝向值 0；Show Choices 分支记录中的文本；Shop Processing 第五参数含义与 allowSelling 命名；Set Movement Route 的嵌套 route 与续行记录；code 0 终止标记与结构边界。疑点不是结论，必须找到原生证据才能判定影响。

说明哪些原生合法形态缺正式 DSL、哪些会编译出不同语义、哪些只是编辑器表示差异、哪些测试缺少往返证据。明确静态调查的覆盖范围与残余未知，不用少量 happy-path 证明全部组合正确。

产物为一份带出处的研究报告及有证据的缺口清单；不修复实现、不决定最终 API。

## Comments

- 2026-10-18：由 `mv_support_inventory` 认领，在临时 `research/mv-native-command-fidelity` 分支保存研究；主代理负责本票状态和地图索引，避免并发改写。

## Answer

逐项静态库存和有界保真缺口调查完成，见 [MV 1.6.1 原生事件指令库存与有界保真审计](../research/native-command-fidelity.md)。105 个原生顶层指令族、45 个移动代码均已关联 authoring / compiler / decompiler / validation / tests 与首方入口；矩阵明确区分种类定位、局部结构审查与尚未逐参数深审。

已由首方静态证据确认 Transfer Player 的方向 0 缺少正式表达、Shop 的 allowSelling 与 purchaseOnly 字段语义相反。另从静态调用链定位 Loop 子列表未完整验证和 Workspace animation/tileset 引用源未装配。原生插件命令的空白限制不能仅凭现有 malformed 测试判为原生非法。402/505/空 Choice 的 code 0 依据独立编辑器报告确认了表示缺口。

本票不证明其余参数组合完整、不声称任何产品测试已通过。正式参数契约、全部子列表的校验原则由 [原生指令的完整参数与结构应如何表达和校验](05-native-command-contract.md) 决定；code 0 与镜像冲突策略由 [语义无损往返与未知数据处理的精确契约是什么](06-semantic-roundtrip-policy.md) 决定；其余合法参数和嵌套的逐项证据必须进入 [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md) 的验收矩阵，需要的新事实调查继续成票，不能将本库存当作完成证明。

研究分支 `research/mv-native-command-fidelity`，提交 `b351793f7f600e34c4505259c3470e7c2df91d76`，已推送。复核了 105+45 行数、本地报告与发布 blob 一致和单报告提交；未安装依赖或运行产品测试、编辑器和游戏。
