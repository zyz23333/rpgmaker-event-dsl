# 23 — Common Event 完整往返

本票仍在实施；以下是实际完成的产品与 E1 核对记录。R1/R4 完整配对、合并最新 integration 后的全量 Windows / Node 22 与 built 验证仍待执行，未据此关闭票或签收最终 49–55。

## 产品与独立预期

实施分支 `codex/mv-ticket-23`，初始真实 dependency baseline 为已合入 22 的 `520a2e5d3a034299bedf8d1051b8559da2d3e648`。执行时产品为该基线上的实际 dirty 文件；标准结果逐文件记录实际源码与测试 SHA256，不将 dirty 基线冒称干净提交。

公共编写入口为 `commonEvent({id,name,trigger,switch?,commands})`；active trigger 在公开类型和运行时均要求有效 Switch。none 的显式 Switch 保留原生独立保存值；省略仅重建既有固定默认 1。显式引用正常遵守槽容量与名称范围。名称精确保留，空名与重复名均是实际条目；Common scope 的名称引用只接受唯一匹配，System 空槽规则没有扩大。

E117 正式入口为 `callCommonEvent({commonEvent: commonEventRef(...)})`。旧位置参数和内部 `ref` 字段均移除。输入形状与引用类别在投影前检查，直接导出定义和命令同样验证；引用失败包含调用者身份、E117 与命令字段路径。Compile 的 Common 范围仅取当前声明；Decompile 从完整 captured 原生候选构造范围，不借手写源码修复目标。

原生 Common 五个拥有字段 `id,name,trigger,switchId,list` 全部必需且精确验证；未知键和非 null 坏条目不能被丢弃。验证 ID 与数组位置、三种 trigger、合法 saved Switch 与完整命令列表后才发布完整候选。已复用 20–22 的隔离发布、保守 Push 与恢复行为，没有另加旁路。Entry Removal 保留数组长度及 null 孔。

`test/common-event-workspace.test.ts` 的独立预期为手写原生记录及正式 TypeScript 输入，经过实际 Discovery、类型检查与求值。覆盖三 trigger、none 非默认开关、空/空白/CRLF/重复名称、向后/自身/互相引用、旧 Snapshot 不回退、晚坏条目无部分发布、Script Gate、已知117与未知 raw、逐字段 Diff、真实 Push 编辑和破坏性删除、ID1001及无固定 Map 上下文。失败与 Check 比较 config、完整 Discovery、源码、Game 与 Workspace 业务字节。仅排除允许遗留的空 `decompile-candidates/` 父目录标记，任何子文件仍在比较中。

## 实际 red / green 与测试修订

原始 JSON/文本保持在仓库外 `C:/Users/Shuen/.codex/tmp/`；本目录 `23-history/` 复制保留实际 runner JSON 与原创核对工具，未重写失败。`mv23-named-call-red.json`、`mv23-saved-switch-red.json`、`mv23-native-owned-red.json`、`mv23-authored-container-red.json`、`mv23-call-shape-red.json` 分别真实复现旧 API、none 保存值丢失、原生默认修复/条目跳过、编写输入形状以及 E117 形状缺口。`mv23-switch-reference-red.json` 的三项是已有候选拒绝缺少字段定位，新增直接原生 Switch 诊断后转绿；`mv23-call-diagnostic-red.json` 同样记录 E117 精确路径缺口。

保留命名为 green 但实际失败的原始记录：原生缺字段诊断曾错误使用严格 JSON renderer；修复为 `describeValue` 后，业务状态比较又发现仅新增空隔离父目录。`mv23-native-owned-observation.txt` 保留具体差异，最后 `mv23-native-owned-green-final.json` 才真实通过。Diff 初测误写现有 identity 格式，下一轮误用未来的 Wait 对象 API；`mv23-diff-scope-initial.json`、`mv23-diff-scope-green.json` 均仍是失败。对应现有 `commonEventId N`、`wait(3)` 改正后重新通过。唯一空名调用的真实失败遵照 ADR0004 / spec I7 修复，重复空名继续报歧义。

已有 workflow 合成 Common fixture 补全五字段后，与编译默认完全相同，使旧预构造 Interrupted Push 的硬编码 affected 集合不再真实；恢复安全门准确拒绝三项（`mv23-focused-source-initial.json`）。以独立 Snapshot 名称 `Snapshot Common` 保留真实 Common 变更后，四个原恢复场景重新通过（`mv23-existing-recovery-fixture-recheck.json`）。恢复实现与安全断言未为此放宽。

已完成源级 Common 首批 87/87（`mv23-common-source-recorded.json`），补充公开类型、直接定义、未知调用上下文 8/8（`mv23-types-direct-context-initial.json`，其他87项是显式 skipped）。关联标准结果以 `MV-S5-COMMON-001`–`016` 追加，不修改原 210 个 requirement rows 或其旧结果。后续交付检查结果在本报告追加。

随后完整 Common 源级执行 `mv23-common-source-complete96.json` 为 96/96 通过，Node22.23.0、原始 deadline、默认2 workers。额外 accessor 案例通过公开 authoring 入口验证拒绝不会执行 getter；首次通过 Workspace 编写 getter 的两轮被已有源码安全语法门在求值前拒绝，均保留失败。改在公开 authoring 边界后，`mv23-accessor-public-red.json` 实际复现诊断读取 getter，own descriptor 修复后 `mv23-accessor-public-green.json` 及完整96项通过。标准记录默认输出 `test-results/mv-evidence`，已按原字节复制至 `evidence/results`，未根据最终状态改写历史执行。源级 typecheck / format:check 通过；清理本票三个已失效 import 后的最终 lint 与全检仍将随集成执行。既有22历史工具的 lint warning 保持原文件。

## E1 编辑器身份与代码事实

验收索引 `MV-S5-COMMON-E1`：本票分配的只读编辑器事实核对，独立于后续完整游戏配对。

按 `reverse-engineer-anything` 复用已留存的编辑器资源路径后重新核对实际 `RPGMV.exe`：19,595,264 bytes，SHA256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。本次 target-free REA PE 资源清单 Evidence 为 `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd`，保留在 `23-history/mv23-e1-rea-pe-resources.json`。旧版本 Evidence ID 在当前会话 summary 中无 retained 记录，只作为历史指针。新清单确认整个目标和版本 payload 范围；原创 verifier 从固定版本词读取 FileVersion 1.6.1.0，字符串含自报 1.6.1，不认证发行渠道。

`23-history/e1-identity-recheck-v3.json` 的 SHA256 为 `d3975b3c81f3c00a1bcdd87f2ac98ab4cd813efab5ac93002a8766e9df9033fa`。Windows / Node22.23.0 只读重新解码并核对全部 34 份选中资源的 stored/decoded 长度、哈希、完整 zlib 消费和已留存全文；再补 E117 与对象选择器。原始全文只在仓库外。v1 错把 E117 plaintext 作为 zlib 解码，v2 错把固定版本 1.6.1.0 当成字符串，二者均真实失败且工具字节保留；v3 按明文编码和 VS_FIXEDFILEINFO 分别处理后通过。这些是 verifier 修正，不是编辑器行为改变。

| 路径 | 实际代码事实及位置 | 产品比较 |
| --- | --- | --- |
| 工厂/增容/Clear | Q346222:18 Common 五字段默认；Q934867:124–130 绑定 Common 模板/数据库；Q963372:192–209,248–259 解析模板并恢复槽 ID | 独立显式默认 fixture 与 ID1001 场景；不将 UI 最大值作为产品上限 |
| 已有载入与直接编辑 | Q909009:71–89 JSON 载入；Q966730:42–56 Loader 直接取数据库条目；Q967367:24–43 独立绑定 name/trigger/switchId，none 只控制 enabled；:53–57 使用实际 list | 完整三 trigger、非默认 none Switch、空/重复/CRLF 名称往返 |
| 开关载入/选择 | Q596373:53–58 读取现有 switchId；:28–43 选择确认才写新 ID，没有 none→1 联动赋值 | none3、显式槽容量/未命名正 ID、失效引用拒绝 |
| OK/Apply 与保存 | 数据库 Q934867:178–186 标记/备份；Q909009:163–177 保存数据库，:357–383 按实际数组槽序列化完整条目并保留 null 孔 | 编辑生成源码后真实 Diff/Push，逐字段比较，删除保孔 |
| E117 重新确认 | Q710524:15–34 `commonEvents` 固定选择器，load/save 参数0；Q607446:12 的初始 ID1 是 UI 初始值 | 正式调用必需显式引用；没有隐式目标或位置参数别名 |

E117 Q710524 stored840 / decoded836 / plaintext，decoded SHA256 `6e3cfa0ad6ea408dc7a1cdbac1789aeee31eb7d38ad7faae4ed69c53cd2d166e`。对象选择器 Q607446 stored741 / decoded2580 / zlib，decoded SHA256 `8c2bc0bf8b611a96c4ab50889c74051e540af35d3ebd553c158081417d05c7bf`。其余逐资源身份见保留 JSON。

这是代码事实与有条件保存推导；没有启动编辑器、观察 Qt 信号/焦点/异步时序或进行 UI 捕获。页面禁用 ID 例外是独立已接受产品契约，未扩展到 Common none。以上 E1 比较不替代 R1/R4 实际运行或最终49。

## 尚待交付

等待 24/25 实际合入后 merge 最新 integration，协调 Compile Contract Version，重建实际产物并执行完整 R1 Map/Common、共享 Parallel、低 ID Autorun 与 R4 同一 Common 从 Map/Troop 调用的 literal/compiled 配对。使用 v5 严格布尔比较与 fresh explicit NativeProfile；保留所有15个数据 carrier、loaded 实际输入、真实 Push 安装、host/modules/7engine 哈希、PID/PPID/profile 和日志/退出。随后执行共享槽中的全量 `pnpm check`、build、完整 built Windows baseline，追加真实结果后才更新本票状态。
