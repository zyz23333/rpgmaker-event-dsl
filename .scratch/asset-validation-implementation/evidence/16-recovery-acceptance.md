# 16：Interrupted Push 恢复与当前素材政策验收

本票的有限责任是 **12 个唯一 canonical ID**，source／built 为执行轴，不增加 ID。最终断言和帮助代码冻结于 `f03e66e6e4550da8a72f98c118fbc36c3af4d1d5`，基于已含 resolved 15 的 integration `5aab331ae7bf1f3d038a0fb7a595087b5d09156a`。**产品代码没有变化，Compile Contract 保持 `mv-1.6.1/39`。** 逐切片真实执行表明现有恢复行为已满足这些分支，新增独立验收、Windows built 清单和使用说明，没有人为制造产品失败。

依据为[规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)、[有限索引](../../asset-validation/implementation-acceptance-cases.md)、[16 票](../issues/16-recovery-and-current-asset-policy.md)和 ADR0006／0013／0019。完整独立输入、预期、真实进程、断言、环境及哈希在[机器合册](16-recovery-acceptance.json)，所有实际尝试在 [16-raw](16-raw/)，原始字节由 [manifest](16-raw/manifest.json) 索引。

## 实际入口与有限责任

全部用例在 Windows、Node.js `v22.23.4`、pnpm `10.33.0` 下，以默认 `C:\Users\Shuen\AppData\Local\Temp` 的中文含空格临时 Workspace 执行。工作树位于用户指定的 M 盘；Vitest 始终 `--maxWorkers=1`，相关广测独占窗口。公共 Workspace API 和实际 CLI 保持原样；IPC 及故障控制仅位于测试自有子进程 OS 适配层。新增 suite 已加入 `vitest.windows.config.ts` 的显式 built include。

| 规范 ID | 独立输入与可观察结果 |
| --- | --- |
| `AV.W15.all-generated-missing-asset.api.case.expected` | 真实 Push 在第一份 affected Snapshot 安装后 SIGTERM。先核对两个 live 均为明确 N、Snapshot 一新一旧、Manifest 仍原始且 pending／两份 O backup 完整，再删除图片。新 Push 完成原记账、清 pending，随后当前无差异素材门槛报 missing，状态不再变化或重建 pending。 |
| `AV.W15.all-generated-missing-asset.cli.case.expected` | 完整序列由实际 CLI 重复，包括真实被终止的 CLI 与之后返回失败码的当前 CLI；恢复完成由独立 Snapshot／Manifest／pending 断言证明，不把全命令失败误写成恢复失败。 |
| `AV.W15.all-snapshot.api.case.expected` | 独立冻结 all-O pending；retirement IPC 时 data／Snapshot／Manifest 仍原始，只有旧 pending 被移动为退休证据，且至此零素材查询。释放后，另一次普通 Push 通过当前检查，才写入两份 N 并正常记账。 |
| `AV.W15.mixed.api.case.expected` | Common live=N、System live=O；缺图不能替代 data 证据。明确报告 generated／snapshot，拒绝恢复，完整剩余树不变，零素材查询。 |
| `AV.W15.missing.api.case.expected` | 分别删除必要 live System 或其 backup；拒绝并保留完整剩余树。 |
| `AV.W15.unknown.api.case.expected` | 独立场景覆盖第三种 live bytes、pending version999、错误原 Manifest hash、错误原 baseline hash。一次只破坏一种证据，均在新素材门槛前拒绝。 |
| `AV.W16.stale-original-basis.api.case.expected` | 三种明确 synthetic 历史证据：旧 `/35` 政策缺省、contract／typeInputs 都省略、已理解 `/6` 完整 pre-Troops 输出集。实际临时根和 O/N/backup bytes 配独立旧式 hash；完成记账保留原 config、版本／省略字段、source、type inputs、binding，之后当前 stale 或输出集 integrity 拒绝。缺图不阻止恢复，也不生成未执行门槛的素材诊断。 |
| `AV.W16.changed-current-config.api.case.expected` | 原 pending 使用当前 `/39`，并先证明原本 fresh。冻结后只改一个有效、准确的当前 Asset Check Exception，再令 live 全 N。原依据记账完成且仍保留原空政策，随后 current config 引起 stale，零素材查询；没有用旧 contract 掩盖配置变化的因果。 |
| `AV.W18.concurrent-workspace.api.case.expected` | 真实 owner 在 pending 安装后暂停，明确允许既有两份 N staging 而 live 仍 O。原路径 API、Workspace junction API／CLI 竞争者立即 busy，原证据不变。owner 终止只释放 lease，pending 及原有 staging 保持；后继 Push 才恢复。没有扩展为跨 Workspace 锁或承诺清理进程死亡留下的旧 staging。 |
| `AV.W18.pending-non-push.api.case.expected` | all-O／all-N 两种 pending 下，Clone、Pull、Decompilation、Compile、Check、Diff、Freshness 的真实 API 子进程均在 pending guard 拒绝，14 次操作分别核对完整树和零素材查询。 |
| `AV.W18.pending-rebind.api.case.expected` | 真实中断后配置切到另一合法 Project Root；其 data 即使可匹配也不能继承原 pending。两个真实项目／素材树分别不变。恢复精确原 config 与 binding 后才完成旧记账，另一根始终不变。 |
| `AV.W19.recovery.api.case.expected` | completed／abandoned／refused 三种 joint profile，分别核对整个 Project Root、media、config、source、own types、package／public types、generated、全部 Snapshot、Manifest、pending／backup。只允许该恢复分支的记账／退休；当前缺图禁止新写，媒体不进入备份或同步。 |

## 预期及历史 hash 的独立性

真实输入有两个固定 affected 载体：`CommonEvents.json` 的完整已知 Picture command 和 `System.json` 的命名 Switch。编译后的完整 Common Event 数组及 System 除 switch names 外的全部保存字段先对照字面预期，再冻结真实 O／N raw bytes。Affected 集合固定为这两个文件，不调用产品 affected-file 派生器。

独立构造器没有导入产品 JSON writer、baseline builder、pending creator、recoverer 或政策函数生成预期。测试自有有限 JSON 格式、实际字节 SHA256 和明确字段顺序用于计算原 basis、原 Manifest evidence hash 及仅替换指定 Snapshot hash 后的完成 basis。完成 hash 应当变化；旧 basis hash 则必须先在其原结构下成立。错误 baseline hash 与错误 Manifest hash 的独立反例证明不能以默认字段重建依据后继续。

12 的 `asset-legacy-policy-evidence.json` 是 schema／旧结构 hash 金样：它的 `c:\legacy-game` 和 a／b／c 占位 digest **未被当作运行时 pending**。本票新历史对象明确标为 synthetic，绑定真实临时根并保存实际 O／N／backup bytes；原省略的 `assetCheckExceptions` 不是 `[]`。原 contract／typeInputs 省略、原 config 与其余 basis 字段均在完成 Manifest 中保持。已完成的基线只变指定 Snapshot rows 及相应 hash，不升级 contract 或采用当前新政策。

15 的正常写后 Workspace／integrity／freshness guards 没有移动到共享历史恢复器。历史恢复仍按原 binding 和一致内容证明处理；之后的当前 integrity、freshness、完整标准 data drift 及素材检查是新的权限判断。相关旧 `RECOVERY-005/006/003` 等断言保留，用于继续检查配置／输入变化及恢复后的当前 drift，不能由缺素材绕过。

## 完整执行及诚实保留的失败

| 执行 | 真实通过 | 过滤／失败 |
| --- | ---: | --- |
| 最终 source 规范矩阵 | 12/12 | 0/0 |
| 最终 built 规范矩阵 | 12/12 | 0/0 |
| 12 条 focused source callback 的并集 | 每条各实际 1 pass，并有匹配 receipt | 每个 runner 的另11个 filtered 明确不计通过 |
| 既有五套件 source | 86/86 | 0/0 |
| 既有五套件 built | 86/86 | 0/0 |

五个旧套件为 `push-recovery`、`snapshot-binding`、`workspace-locking`、`compile-inputs`、`push-drift`。未机械重跑与本票无关的 F/D 矩阵；最终17全量核对另行承担。

原始尝试全部保留：

1. 首次真实 API 尝试失败于测试将 backup 目录条目误算成文件；保存原失败 runner、receipt、原 test／helper 字节与失败 sandbox，修正 file-list 断言后实际通过。它是测试预期失败，产品未改变。
2. 随后的03–10草稿 callback 误插入首测试内部，筛选 runner 是 **0 pass、2 filtered**。退出码0一度被误读，发现后已向主代理及用户明确更正；原误插入源、原 runner 及修复脚本均保留。这些报告从未提升为最终通过。修复后 AST 静态核对11个顶层声明展开12个唯一 ID、零嵌套，与两份独立计划精确相等；再逐项强制实际1 pass／匹配 ID／新 receipt，最终完整12项零过滤。
3. 并发分支首次真正执行失败于观察预期遗漏合法 pre-pending staging。保存原失败断言／helper／receipt／sandbox；改为精确两份 N staging、live 仍 O，并保留 owner 死亡遗留的原 stage。竞争者仍需立即 busy，所有状态断言保留。没有产品违约反例或产品补丁。
4. built 启动脚本首次将 PowerShell 数组合为一个 `--config` 参数；Vitest parser 在执行测试前拒绝，没有结果 JSON。原 log／script 保存，修复 argument splatting 后执行最终完整 built 矩阵。该启动错误不计为测试通过或产品失败。

机器合册严格匹配两份预先独立计划、24条最终规范回执、每个实际 runner 的 ID 集合与 pass／filter 数、冻结 Git blob 的 test／helper SHA、原失败断言字节和 source／built 环境。每份最终 receipt 的 input、expected、actual、完整 callback 与执行进程均可回溯。最终原始字节、构建文件、局部链接和 Git 持久化核验将在交付前写入索引。
