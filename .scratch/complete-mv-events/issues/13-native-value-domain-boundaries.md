# 原生控件范围与保存值的支持边界如何划定

Type: grilling
Labels: wayfinder:grilling
Status: open
Mode: HITL
Blocked by: 11
Parent: [完整支持 MV 原生事件的决策地图](../map.md)

## Question

对于目标 MV 1.6.1 的参数，如何区分官方素材规范、普通编辑控件范围、已保存值以及运行时上下文，使“全部原生合法形态”的正式支持边界和错误/警告可精确执行？本票解决研究暴露的具体边界，不泛化成支持任意非标准 JSON，也不以当前实现能否接受为合法性依据。

## Research inputs

详见[逐参数总索引](../research/command-parameters/index.md#需要用户讨论的支持边界)及其分片。

| 问题 | 已有首方事实 | 需要明确的契约 |
| --- | --- | --- |
| Show Text / Change Actor Images 的 faceIndex | 官方脸图144×144、2行4列；目标picker固定144px帧和4列，高度按实际图计算。576×432图第三行的8..11有静态选择保存路径，真实UI样本未执行 | 非标准尺寸但原生picker可选择的素材是否在正式支持范围；faceIndex值域、是否依赖素材尺寸、None/图像替换后的保存索引如何校验 |
| Transfer / Vehicle / Event Location / Get Location Info 的直接坐标 | 原生地图picker依赖地图宽高，没有通用9999上界；地图缩小可使已有指令位置超界；Common Event的运行地图不固定 | 形式整数域与当前地图越界如何分别检查；固定Map Reference缺失与Runtime Selector上下文问题的错误/警告，避免借页初始位置规则裁剪 |
| Label、Jump to Label、Name、Nickname、Profile和单参数Script Input | 原生存一条完整字符串；UI单行或两行等限制不同于401/408/655物理续行。保存器不按四类行记录规则拆分这些槽 | 正式编写和已有数据反编译的CR/LF/长度边界、是否拒绝、何时警告、如何保持；既有Plugin完整原样与Script Input原则不自动收紧 |

位置的运行后果需准确描述：Get Location Info 的terrainTag/regionId检查边界，tileId直接算数组索引，越界x可能指到下一行；不能统一写“越界返回0”。原生None与独立保存index的原则仍有效。

Change EXP另有首方资料差异：本体QML明确9,999,999上限，帮助写99,999,999。研究已分别定位，当前参数表按目标控件描述；真实输入/保存核查交验收。如果希望主动支持更大字面量，须明确作为扩域选择；不让用户投票替代对目标事实的取证。

## Discussion constraints

- 保留 [原生指令契约](05-native-command-contract.md#answer) 与 [语义往返契约](06-semantic-roundtrip-policy.md#answer) 已确认的无损底线。普通原生反例不能因为现规则拒绝就被宣布非法；不能trim、拆字符串、夹坐标或换索引。
- 将“新建编写允许什么”“已有正常保存数据可否反编译”“只保存事件容器”“重新确认参数对话框”“实际运行结果”分开，避免把UI能编辑的域当成存储格式硬约束。
- 所有未获批的便利默认保持显式表达，不从工程当前状态隐式取值；若在接口定稿增加省略字段，逐项声明固定 Compiler Default。
- 尚未证明的域外样本按现行已知异常规则明确报错/待证；新证据足以构成正常反例时先重开模型。不得以runtime容忍或任意合成JSON证明原生正常生成。
- 本票的每个选择仍由用户参与；必要时精确追加一个研究/原型前置，不能把未定字段推到实现阶段自行决定。

## Completion and handoff

Answer逐项明确值域、引用/素材/上下文依赖、诊断与保存行为；更新参数表并说明ADR0011/0012是否需补充。确定后才解除对 [如何证明 MV 事件支持完整并划定实施顺序](08-completion-evidence-and-sequencing.md) 的阻塞。真实素材/坐标/文本边界样本纳入验收，尚未执行不得标通过。

## Comments

### 2026-10-19 — 从逐参数研究中形成明确边界讨论

本票未认领、未进行HITL讨论；不代表研究已放宽faceIndex、坐标或文本限制。研究分支和本地报告保留来源差异与准确证据强度。
