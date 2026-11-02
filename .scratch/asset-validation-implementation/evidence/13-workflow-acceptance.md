# 13：Compile／Check 单次素材门槛与输出有效性验收

本票规范责任为 **63 个 W ID＋4 个 C ID**，源码及构建入口分别 **67／67**，共 134 条规范回执。两个入口各有 148 个本票未选中的注册项，均为 filtered，未计通过。完整独立计划、断言、真实进程输出、环境、精确状态观察和逐 ID 结果在[机器合册](13-workflow-acceptance.json)；原报告和检查记录在 [13-run-history](13-run-history/)。

依据为[规格](../../asset-validation/asset-validation-spec.md)、[矩阵](../../asset-validation/acceptance-matrix.md)、[有限索引](../../asset-validation/implementation-acceptance-cases.md)、[13 票](../issues/13-compile-check-consistency.md)及 ADR0013／0016–0019。独立工作树从干净旧基点快进到 `1f01ba534e5eee1047a1f3cc6665370924707f32` 后领取；测试及使用说明主提交为 `d9be9248f848242dedac4c660f15838df9ad37c5`，最终查询／空链断言和默认 fixture 证据标签收紧为 `789fef614fae06115ca16f1601ea46704edb8241`。本票没有改变产品行为，Compile Contract 保持 `mv-1.6.1/37`。

## 有限责任

| 族 | 本票规范 ID | 实际验证 |
| --- | ---: | --- |
| W01 | 18 | initial／fresh／stale × success／error／warning × API／实际 CLI；Check 保留原权威和全部持久载体。 |
| W02 | 5 | 查询前删除／修复、稳定 warning；完整 Check pass 后删除，本次返回成功，下一命令按缺失失败。 |
| W03 | 3 | 完整候选后、任何发布前按当前文件决定；error 不发布，门槛前修复成功。 |
| W04 | 3 | pass 后到 Manifest 提交之间删除仍正常发布；独立 Manifest I/O 失败留下不能授权 Diff 的输出，显式 Compile 恢复。 |
| W09 | 3 | 未 Pull 的 Animation／Tileset 改名继续使用 captured old name，Push 因标准 data drift 拒绝；单一 after-pull callback 含两种数据库。 |
| W10 | 5 | 内容、大小、mtime、真实文件身份、无关目录项变化不进入存在性条件；产品媒体内容读取在子进程被拒绝。 |
| W11 | 14 | 七种变化各经 Check／Compile 的唯一查询前边界；真实大小写改名、目录替代、junction、查询故障、warning 到 warning 及补齐均按当前事实。 |
| W12 | 2 | 独立手写共享／循环图保留两个定义使用及四条直接调用边，不乘算或累积；后续命令取得当前文件。 |
| W14 | 4 | Pull、显式 rebind、旧 contract、源依据过期需 Compile；Check 不刷新，支持的根 alias 保留规范化绑定规则。政策变化属于12。 |
| W17 | 4 | Clone／Pull／Decompilation／Diff 成功且零素材查询，保留各自原有捕获、发布及新鲜度规则。 |
| W19 | 2 | Compile 成功只更新正常 output／Manifest；失败分别验证门槛拒绝与发布开始后的无效状态。外部必要字段、未知 carrier 字段及媒体均只读。 |
| C03 | 2 | image 复用原04唯一 callback，共享 owner `04,13`；SE 在原媒体 suite 新增一次重复 route44 callback，两个真实保存位置和两组 mirror 各自固定预期。 |
| C13 | 2 | Check 成功／失败均保留原 external names、必要字段和未知字段；不复制、写入或备份媒体。 |

每入口有 12 个实际 CLI ID，其余从公开 Workspace API 进入。新 workflow suite 已加入构建后 Windows 显式清单。源／构建是同一规范 ID 的执行入口轴，不扩成新的 AV 标识。image 原共享回调保留04全部断言；SE 原05两个分支也保留并在定向 C03 回归通过，不误把它们计入本票67。

## 边界与独立预期

沿用已确认的 Workspace API／真实 CLI seam，没有新增公共报告 API、产品测试参数、sleep 或测试开关。Windows／Node22 真实子进程在 OS 适配层暂停。Snapshot MapInfos 实际捕获之后、进入 Project Root 的资产查询之前暂停，父进程变更文件后才释放；不存在虚构的首轮 pass。完整 Check pass 后的边界是其下一次输入一致性 Snapshot 读取；Compile 的发布后边界复用真实临时 Manifest 写入点。媒体查询日志证明后续没有扫描，下一新命令实际查询并失败。

必要查询失败以可控 EACCES 注入，明确为 OS 适配层行为，不冒称真实 ACL。大小写、文件／目录类型、根下 junction、文件身份及媒体内容变化使用真实文件系统。没有锁死 syscall 次数。子进程成功／失败都等待真实退出，CLI 不以 API helper 的 result 替代；finally 只作进程清理。原 checkpoint 释放后残留 IPC message listener 会使成功 CLI 不退出，本票在适配层解除该监听器，没有改变产品流程。

预期来自规范及预先独立转录计划，产品收集器、匹配器和政策函数均不用于构造预期。64／3 的首次完整组合失败未计通过：W09 fixture 的旧 System-owned entries 先触发 Destructive Changes，后以临时项目显式 `allowDestructive:true` 到达所需 drift 拒绝，并继续断言零写入；Decompilation fixture 先后暴露不支持的 owned custom 字段及已有 id10 源冲突，均按原规则修正准备输入，没有删除产品负面校验。成功 Decompilation 正常新增空 `decompile-candidates/` 目录，本票只精确允许这一项及正常 DSL 发布，仍完整保留 Snapshot／Manifest／generated 断言。

## 状态、输入及历史证据

观察器逐字节检查 Workspace Config、Definition Source 树、自写 `types/workflow-input.ts` 验证依赖、fixture package JSON、公共类型入口、Workspace package、整个 Project Root 与整个 `.rpgmaker-event-dsl` 树。rebind 的另一个真实 Project Root 单独完整比较。仅在活跃内核租约期间排除不可读的永久零字节 `operation.lock`；命令结束后的公开操作继续证明租约释放。媒体由 driver 明确构造或变更，工具的内容读取被拒绝，状态比较保留每一项允许差异。没有对整套工具内置类型文件逐字节重复快照；更广的 TypeScript lookup／依赖／输入变化保护由既有 `compile-inputs` 和 `compile-publication` 回归联合证明。

成功 Compile 只允许 generated 与 Manifest 改动；失败前后保留源、配置、依赖、Project Root、Snapshot、pending 和媒体边界。基线只含既有 contract、config（含政策）、binding、source、type inputs 和 snapshot 项；实时媒体不成为 freshness 依据。删图后可仍 fresh，Check 失败不刷新或清除原依据。正常生成 carrier 保留自写 opaque unknown 字段；必要外部 Animation／Tileset／Actor 原字段和名称保留，未复制为所有权。

原始 red、失败、修复与完整最终 JSON 报告分别保存，未覆盖成成功。最初 red 来自测试 helper 尚无新暂停边界，随后 red 来自状态观察器对 Windows 永久 kernel lock 的误判；不把这些测试基础设施或 fixture red 描述为产品规格失败。另归档了 14 个真实失败临时项目的原 process records、输入及失败后状态；未完成 finalization 的超时目录明确记录 process-results 不可得，保留原 timeout 报告，不合成进程成功。收紧前的两个 67／67 原报告另保留为 pre-tightening，实际测试源 revision 为 d9be9248；最终回执的断言源 SHA 均与789fef61最终 Git 工件核对。合册生成脚本只做独立计划与实际回执对账，不执行产品计算。全仓、原生媒体最终验收仍由17负责；14–16的 Push／pending／恢复新责任没有在本票签收。

8 个受影响旧 suite（compile-inputs、compile-publication、snapshot-binding、workspace-locking、decompile-publication、push-drift、push-recovery、asset-file-workspace）源码／构建各 **299／299**，无过滤项。typecheck、lint、format、build、空白差异及本地链接检查通过；原始记录列在机器合册及 runner history。本票没有增加 Manifest 媒体扫描、发布后复查、跨点比较、历史成功缓存或持续监控。
