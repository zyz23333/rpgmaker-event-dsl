# 21：Push 全输入漂移与写入复核

本报告记录工单 21 的公开 Workspace API/CLI、实际 Windows 文件系统及真实子进程验证。没有给本票分配独立 E/R 原生场景；原始自动化记录的 `environment.native` 均为 `not-executed`。最终游戏运行验证仍由后续对应工单交付。

## 实现与范围

实现基于集成提交 `415da017f2018069b3a7da0087d13cb74b07771a`，产品、测试、索引提交为 `fbce1ed`，旧 workflow 断言同步提交为 `be41bc5`。分支为 `codex/mv-ticket-21`。

每次 Push（包含语义 no-op）都按已验证 manifest 的完整 Snapshot 集合检查原始字节：14 个固定标准数据库文件和捕获 MapInfos 登记的全部地图。插件 JSON、未登记孤立地图保持既定排除范围。该完整集来自已经经过工单 17 验证的 Snapshot 集合，不能被当前 live MapInfos 缩小。

只有语义 Affected 文件进入备份和写入。暂存 Generated 使用实际 Buffer 并与已验证 generated hash 复核；pending 备份复制实际 Snapshot Buffer 并核对原始 hash。在 pending 发布后、首次替换前再次检查完整原始集合。每次捕获旧文件后核对实际捕获字节；所有替换后、任何 Snapshot/manifest 刷新前再次核对完整集合，已写路径预期 generated hash，其余路径预期原始 Snapshot hash。

替换使用同卷硬链接安装，目标已存在时原子拒绝。不存在覆盖 rename/copy 回退。恢复旧对象也使用非覆盖安装；如果出现外部目标或文件系统拒绝恢复，则保留 `push-staging.tmp-*/original` 及 staging，诊断写出保留路径。捕获对象可能包含 Snapshot 备份没有的独有外部文件字节、目录或 junction，不能被外层清理删除。写后冲突保留已写 generated 与外部改动及 pending，不进行全工程回滚。

Diff 比较已解析 JSON 结构和值，忽略对象键顺序、格式和等价转义。键存在性、数组长度和顺序、精确字符串/CR 与负零继续有意义；这不改变 live Drift 的字节语义。Map 文件判断复用相同的安全正整数与规范文件名规则，支持 `Map1001.json`，拒绝非规范前导零、零 ID、非安全整数和穿越路径。

当前 Compile Contract Version 仍为 `mv-1.6.1/4`。本票修改 Push 同步保护、Diff 相等比较与既有规范地图名规则的统一，没有改变 DSL 类型、Compile 验证、Compiler Defaults 或 Generated 输出语义。

## 用例索引

所有用例实际经过独立合成输入 → init → Clone → Decompile → Definition Source Discovery/类型验证/源码求值 → Check/Compile；在公开操作处观察完整配置、源码、Discovery 集合、Project Root、Snapshot、Generated、manifest、pending 及真实子进程 stdout/stderr/退出状态。独立 fixture 身份、执行环境和实际产品文件 hash 记录在每个原始结果中。

| Requirement | 验证内容 |
| --- | --- |
| MV-S4-DRIFT-001 | 全部 14 标准文件及 Map001/Map1001 的 no-op 字节 Drift，删除/目录替换，排除插件与未登记地图 |
| MV-S4-DRIFT-002 | live 合法 U+FFFD 被 invalid FF 替换、解码文本相等时，无关 no-op 与 Affected Push 都拒绝 |
| MV-S4-DRIFT-003 | 反序对象键仍 clean/no-op；live 格式/等价转义是 Drift；键、数组、CR、负零差异不丢失 |
| MV-S4-DRIFT-004 | 实际 pending 发布后外部改写 Actors，首次替换前完整复核保证零业务文件替换 |
| MV-S4-DRIFT-005 | 最后一次安装后外部改写无关 Actors，写后完整复核拒绝并保留已写文件及旧 metadata |
| MV-S4-DRIFT-006 | 旧 Common 捕获后目标文件到达，实际安装不覆盖、不搬移外部目标 |
| MV-S4-DRIFT-007 | Common 已写后 System 旧内容被外部改成解码相同的 invalid FF，逐文件捕获校验并精确保留外部字节 |
| MV-S4-DRIFT-008 | 四个独立模式：外部独有文件、恢复不支持、捕获目录、捕获 junction，恢复失败后原对象均保留 |
| MV-S4-DRIFT-009 | Map1001 实际事件 Diff、CLI filter、安全 pending；安装后真实 SIGTERM，fresh CLI Push 识别并记录已完成写入 |
| MV-S4-DRIFT-010 | 正常成功仅备份/写入 Common/System，其他标准文件与源码/Discovery 不变，Snapshot 只更新 Affected |
| MV-S4-DRIFT-011 | 初次 Generated 完整性读取后发生 invalid UTF-8 外部改写，实际暂存消费复核在任何 live 替换前拒绝 |
| MV-S4-DRIFT-012 | 已写 Common 在最后一次安装后再被外部改动，写后复核保留外部 Common、generated System、旧 metadata 和 pending |
| MV-S4-DRIFT-013 | 三个独立模式：空目录到达、junction 到达、不支持安装；外部对象保留或旧文件安全恢复，无覆盖回退 |
| MV-S4-DRIFT-014 | Common 已写后 System 在捕获前被外部删除，保持 Common generated、System 缺失与 pending |
| MV-S4-DRIFT-015 | 实际 manifest rename 失败，保留 live generated、已刷新 Snapshot、旧 manifest/编译基础和 Snapshot-derived pending 备份 |

008 和 013 按独立对象模式注册为各自测试执行，15 条 requirements 共 20 次用例执行；保持默认两 workers 和每例原有 30 秒时限，没有降低断言或提高 timeout。

## Red/green 与失败分类

001–006 的原始失败分别证明 no-op/full-set 检查缺失、解码哈希误判、键顺序误报、首次替换前复核缺失、写后复核缺失、覆盖安装竞态。009 首个失败证明高编号地图在 Diff 丢失事件身份；首个断言使用的身份分隔符后来按既有公开格式改为逗号，原始输出仍确实缺少完整地图事件 domain。011 原始失败实际错误地成功 Push，证明暂存解码修复掩盖了已消费 Generated 的字节变化。这八个独立产品 reds 均有后续 green。

007、008、010、012–015 是对已修复共同行为的完整回归，不能另冒称独立观察到新的产品 red。009 的第二个失败与 010 的暂存目录断言失败是测试预期遗漏了真实暂存目录，修正后显式比较其完整保留/暂存内容；没有删除业务状态断言。010 曾尝试让 Clone 捕获 invalid UTF-8，实际按工单 17 的既有契约被正确拒绝；该失败是无效测试前提，没有放宽 Clone、迁就数据或认作产品缺陷。相关已生成原始失败记录仍保留。第一次无效前提中 finally 观察 manifest 不存在掩盖原错误，观察器改为记录缺失 manifest 后重跑得到了正确 Clone 拒绝诊断。

009 的真实进程终止可以留下 Project data 下的内部 staging。当前恢复不会删除该无引用目录，测试完整记录并断言它保持原样。完整 recovery 冻结/收尾重试与 retirement 的验收属于工单 22；本票只证明规范高地图名不会被拒为 unsafe pending。015 同样记录收尾失败的事实，未声称本票已实现工单 22 的恢复矩阵。

首轮正常 `pnpm check` 实际完成 29 文件 / 313 测试，312 通过；唯一失败是原有 workflow 用例明确要求 affected-only Drift，已接受 I12 则要求完整标准输入。提交 `be41bc5` 将该用例同步为外部 Actors 必须拒绝，精确恢复 Actors 后 Push 成功并保持排除的 PluginData 原字节；没有放宽当前保护或移除相应用例。最终检查在该提交上重新执行，不能把首轮整体失败记为通过。

## 最终检查

最终检查使用 Windows `10.0.19045` / x64、Node `22.23.0`、pnpm `10.33.0`、Vitest `4.1.9`、TypeScript `5.9.3`。每个测试命令均保留 `MV_KEEP_WINDOWS_SANDBOXES=1`，所有工作树、junction 和测试沙箱留待最终统一清理。

- `pnpm check`：29 文件 / 313 测试全部通过，237.99 秒；包含 typecheck、lint、format check 和默认两 worker 的全量测试。
- 本工作树自己的 `pnpm build`：通过，target 为 Node 22，生成 15 个 dist 文件。
- 正常 `pnpm --filter rpgmaker-event-dsl test:windows-baseline`：8 文件 / 88 测试全部通过，163.70 秒；其中本票为 20 次实际 built 用例执行。
- `pnpm --filter rpgmaker-event-dsl exec vitest run test/mv-evidence.test.ts`：1 文件 / 3 测试通过，4.22 秒；包含索引、来源、fixture hash、测试链接、全部已保存原始结果 schema 与 fingerprint 自洽检查。

最终 source 记录为 `be41bc528ecd55a744e2de708e60a30d8329dcab` 上的 20 条通过记录，时间 `2026-10-19T12:19:00.262Z` 至 `12:21:05.125Z`。统一 source fingerprint 为 `35a6d4bcf619017da807735549de3be6fed2809c26694337720572ca6e85fa6e`；逐个 captured file SHA256 与当前文件匹配。原始 records 只做字节复制，不经 formatter 重写。此前 176 条 requirements 已 deep-equal，378 个已有 immutable result Git blobs 已逐个保持相同。新保留的历史原始失败记录共 11 条，包含上述产品 red 与已解释的测试前提/预期错误；没有将它们改为通过。

同一提交的新鲜 built 记录为 20 条通过记录，时间 `2026-10-19T12:23:22.788Z` 至 `12:25:13.523Z`，统一 fingerprint 为 `af98a46a2551fdc1b41a718dd8d30d1f2b65dac6ea4a2867682e7e65432c33ec`，包含本工作树实际 dist 的全部文件身份。40 条最终通过记录的全部文件 hash 均再次与当前 source/test/config/index/dist 核对通过；51 条新保存记录逐个与测试输出原文件按字节比较相等。既有 results 目录的 378 个 blobs 包括 377 条 JSON 原始记录和目录说明，均未改变。全目录现有 428 条 JSON 记录，run ID 唯一性与状态检查通过。

规范高地图的 source 与 built 原始代表记录分别为 [source Map1001](results/MV-S4-DRIFT-009-2026-10-19T12-19-06-621Z-29959435-b440-4327-96ca-d97ca9ae1ed0.json) 和 [built Map1001](results/MV-S4-DRIFT-009-2026-10-19T12-23-27-998Z-47eadc77-15e6-4109-b051-ab3fb6caf8f7.json)。两份都记录了实际子进程 `exitCode: null / signal: SIGTERM`，其后 fresh CLI recovery `exitCode: 0`；没有将单个原语试验当成公开 Push 验收。

本次实际 build 的主要产物身份：

| Artifact | SHA256 |
| --- | --- |
| `dist/cli.mjs` | `fa9a87ee86b9baa168a814049af541f44cf2be387c0e26a2030626d9d486b4b2` |
| `dist/workspace-api.mjs` | `c41706efadc07c3a05285040be0fc2822f1890838c048f6069ccfb9d2c2a27da` |
| `dist/operations-CsO0JPw_.mjs` | `4de986dec6451a1d9bd38329822d8d3817b440debe1e1b36a47ae1ba6d059eda` |

这些实际检查点不承诺与外部编辑器原子隔离，也不承诺外部编辑器在最后一次校验后无法保存。硬链接不支持的文件系统允许安全失败，不能用覆盖安装回退。
