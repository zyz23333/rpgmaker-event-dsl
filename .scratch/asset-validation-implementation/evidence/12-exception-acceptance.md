# 12：准确例外与完整多来源诊断验收

2026-11-02 已完成签收：最终 source／built 组合各 114／114，适用旧兼容测试各 100／100，通过数不包含过滤项。

票据 [12](../issues/12-exceptions-and-complete-diagnostics.md)，依据[实施规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)、[有限用例索引](../../asset-validation/implementation-acceptance-cases.md)及 ADR0016–0019。工作树 `M:/Shuen/Codex/asset-validation-12-exceptions`，分支 `codex/asset-validation-12-exceptions`；从干净 `cfe4d505` 快进集成 `e103e373` 后领取，再合入 `a3ee3133` 的 11。Compile Contract Version 为 `mv-1.6.1/37`。

## 行为

严格配置只接受准确 category／folder／原始 name／带非空白内容的 reason，拒绝非法组合、缺字段、重复和额外字段。新初始化写入空数组，实时配置省略与空数组等价。配置能准确表达不支持名称，但例外不能扩大支持范围。

仅已确认缺目录／缺文件、名称不符和类型不符可以把普通 error 降为 warning。逐次报告保留事实、基础／有效级别、原名、定义位置、事件内链、条件、匹配例外和原因；候选及非活动配置的原 warning 保留，配置匹配不被误算为实际降级。支持范围问题不被例外豁免，必要字段和单次查询失败／矛盾始终 error。独立安全关系继续检查，内部报告保留全集；warning／信息继续使用既有 console 通道，error 及总统计／调用上下文使用失败通道，CLI 可以取得全部结果且不重复动态停止。

无实际降级项定位到配置项。检查完整性保留全局 incomplete，同时按准确目标抑制其作用不可判定的例外；A 的查询失败不会吞掉已可判定 B 的 repaired／unused／warning-only 提示。没有合法目标的坏字段及未知动态关系保守抑制无法归属的范围，不制造无用结论。

问题分组与合法问题文件、真实使用分别计数。直接 Common Event 调用单独保留，不复制或乘算定义中的素材；Skill/effect 链和 11 的 uses／problems／stops 保留。可靠源码位置来自同次捕获 AST 对象与 native／DSL 路径的瞬时对应，使用一基行列；raw 负载回退到原生及 DSL 对象位置。没有重读实时源码猜行列，也不持久化来源映射或媒体事实。

早期配置、结构和引用失败明确说明素材检查未运行。现有 API 参数、成功返回方式和 CLI 命令保持；没有公共报告 API、JSON CLI、产品测试开关、全局跳过或通配符。例外政策进入基线及已理解 Manifest／pending 结构，改变政策使旧输出 stale，成功 Check 不升级旧依据。

## 有限集合与执行

[机器合册](12-exception-acceptance.json)从实施前独立转录的计划逐项对账：100 个规范主 ID（D01–D10 共 99，加 W14 exception-change），2 个共享 C11 ID，以及 2 个补充 ID；source／built 各执行一次所需回执，共 208 条。额外 10 个组合回归是 11 的四个 B 族 tracer 与六个共享 C05，不冒充新增规范义务。

- D01：27 个事实／角色／合法表示组合，各自通过真实 Workspace API，独立断言原生位置、必要链和基础／有效级别。
- D02：24 个事实／角色组合及 3 个先行 Gate／引用／结构错误；查询故障和查询内矛盾在真实子进程 OS 边界控制。
- D03–D08：准确多来源 SE 三类降级、准确键区别、全部配置错误、相关范围无用提示、独立计数、共同失败及独立结果继续。D06 same-file-two-groups 仅用独立聚合输入，不假称磁盘同时有矛盾状态。
- D09：原 10 的三个 callback 一次迁移 formal → native，保留其原断言并追加 API、统计、可靠／未知来源场景；不注册别名。另补页、嵌套体、路线和可靠源码四支。
- D10：七支全部使用实际 CLI，核对退出、来源、链、例外原因、有限循环关系和 incomplete。C11 Script／route Script 在原唯一 callback 内补匹配例外不能绕过 Gate；结构不可豁免另由 D02 验证。
- W14：政策 reason 改动使旧输出 stale，成功 Check 保持原 Manifest，重新 Compile 才恢复 Freshness。

最终组合按 `--maxWorkers=1` 串行执行，每个入口 114 个 callback；所影响的既有 Workspace／workflow／compile-inputs／publication／recovery 五个 suite 每个入口 100 个 callback。最终具体运行、环境、原始报告、独立输入、断言及实际结果以机器合册为准；过滤／pending 注册不计通过。本票没有运行全仓测试或重跑原生媒体样本，最终全仓验收属于 17。

## 历史依据和红绿记录

[独立旧格式样本](../../../packages/rpgmaker-event-dsl/test/fixtures/asset-legacy-policy-evidence.json)明确省略新政策键：pre-policy 保存 contract35 与 typeInputs，pre-contract 继续省略这两个旧可选键。原 baseline 和 originalManifest 四个哈希固定为字面预期。新 persisted schema 不补默认；验证证明错误补空数组会改变旧哈希。这里只签收格式／原 hash 兼容，不提前注册 16 的 W16 或宣称完成运行时恢复义务。

配置、实际降级、可靠源码以及相关范围 incomplete 的红绿报告保留在 [12-run-history](12-run-history/) 中。既有兼容性首次运行有 44 个失败，定位到新 baseline config 字段顺序与 persisted schema 顺序不一致；修复后重新执行原五个 suite，未删除其负面断言或把历史 hash 按新默认重算。历史样本最初的补充测试曾误用解析对象的属性枚举顺序计算旧 basis，改为该旧格式明确规定的顺序，固定原 hash 未改。

旧 03、01 和 10 的历史证据没有改写。10 的旧 formal D09 回执继续作为历史；当前 native ID 下另有组合后的回执。

最终组合还保留了 C05 known-sibling 的原 warning／info 通道断言。首次组合的该项失败定位到把全部诊断只放入 throw 的展示回归；修复为原来的两条输出通道，CLI 不重复任何动态记录。失败报告和随后的完整组合结果分别保存。

## 检查与边界

最终 typecheck、lint、format、build、差异空白检查和本地链接检查的实际记录纳入机器合册。媒体文件只由测试 driver 明确构造或在查询内暂停点变更；工具没有媒体复制、备份、写入、内容读取或名称修复。Check 逐项比较配置、源码、Project Root、Snapshot、生成数据、Manifest 与 pending 的允许变动。操作结束后的文件可变化；本票不增加跨检查点素材比较或写后扫描。
