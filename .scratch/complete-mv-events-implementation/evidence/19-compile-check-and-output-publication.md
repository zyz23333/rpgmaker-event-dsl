# Ticket19 — Complete Compile Output and publication

本票从集成 `1e6b3f4fbf8259bba421b2d85b78ae2a9b29cba6` 开工，包含15的有限 raw／递归 Gate 与18的输入捕获。产品及测试提交为 `5d541e98ab7f10d3808214a9ec9281f49cf49001`。交付前再次合入同一集成分支，验证时已是最新。

## Complete candidate and publication boundary

Compile 和 Check 现在先从18捕获的同一 Snapshot 与真实发现、类型验证、求值的声明构造完整候选。候选覆盖当前拥有的 CommonEvents、System 和 Snapshot MapInfos 注册的全部 Maps，先验证实际生成值的严格 JSON、事件身份、命令结构、固定引用和递归 Script Gate，再将全部文件序列化为内存字符串。Map 页的现有完整命令列表及保存 Movement Route 也通过15共享的检查边界。

Check 在上述步骤完成后重查输入并返回，不建立候选目录、不写生成文件或 manifest，不建立或刷新 Freshness。Compile 只将已经完成校验和序列化的候选暂存到真实文件系统。输入既在安装生成目录前重查，也在临时 manifest 写完、正式 manifest 提交前重查；晚到的修改要求显式重跑。

验证失败没有新产物发布。实际写入、目录安装或 manifest 提交失败，以及进程 kill／未捕获崩溃，可能留下不可用的生成状态；契约不要求生成目录和 manifest 两资源回滚。Diff／Push 在任何写入前拒绝不完整、不一致或 stale 的状态，新的成功 Compile 恢复可用性。Compile 不修改源码、Project Root 或 Snapshot。

完整性检查从已验证 Snapshot 的 MapInfos 独立推导应有文件集合，与 manifest 列表及实际目录中的 regular files 三方精确比较。清空列表、少报 Common/System/Map、多报外部数据库或未注册地图，以及实际多余文件均不能自证完整。然后直接对实际文件 Buffer 计算 SHA256，避免宽松 UTF8 解码掩盖物理字节变化。

本票将唯一内部 Compile Contract Version 从15的 `mv-1.6.1/2` 更新为 `mv-1.6.1/3`。这里没有提前增加 Troops ownership，也没有完成23／24的完整 Common／Map 容器字段、26–47的完整指令参数、21的实时 Project Drift 或22的恢复矩阵。

## Public seam matrix

独立基础 fixture 为 `common-event-project.json`，SHA256 `5c02c51a1460d192644983035fe10a36737dcbe2a220cb2e4b2e0a81404007d1`。实际准备经过 Clone、Decompile、Discovery、TypeScript host、受限求值与 Compile。Common/System 全对象与 fixture 比较；正常 placed Map 页与独立 literal 完整比较，包含当前最小页载体、终止记录、保存 Movement Route 和外部 carrier 的 CR。该 literal 是19对15＋18现有载体的回归，不签收24的原生默认值／完整字段。

| Requirement      | Actual coverage                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| MV-S4-OUTPUT-001 | 少报 CommonEvents、System、注册 Map，及清空 generatedFiles；Diff／Push 拒绝且全部业务状态保持                                                 |
| MV-S4-OUTPUT-002 | 真实 discovered untyped Map 的 undefined x 在物化后无法表示为严格 JSON；Check／Compile 均拒绝且无发布                                         |
| MV-S4-OUTPUT-003 | 生成目录已安装后、manifest 提交前修改源码；拒绝提交 Freshness，旧 manifest 保持，重新 Compile 恢复                                            |
| MV-S4-OUTPUT-004 | 初始／fresh／stale 各用真实子进程 Check，并陷获任何 generated 暂存写入；完整状态目录保持，Freshness 原状；正常非空 Map 及全部生成文件精确比较 |
| MV-S4-OUTPUT-005 | 候选文件写入、生成目录安装、manifest rename 三个实际 I/O 失败；所有受保护状态保持，Diff／Push 拒绝，重新 Compile 恢复                         |
| MV-S4-OUTPUT-006 | 生成目录安装后 kill 与未捕获崩溃，覆盖首次 Compile 及已有成功输出；拒绝不一致状态，实际 CLI Compile 恢复                                      |
| MV-S4-OUTPUT-007 | 缺文件、文件换目录、损坏内容、同自报 hash 的额外 Actors／Troops／Map999、未列额外文件；均拒绝并恢复                                           |
| MV-S4-OUTPUT-008 | 生成内容 U+FFFD 的合法 UTF8 字节 EF BF BD 换成非法单字节80；解码文本相同也必须拒绝，重新 Compile 恢复原字节                                   |
| MV-S4-OUTPUT-009 | malformed known raw108、缺失 animation 的 raw212、关闭 Gate 的空 script raw355；Check／Compile 诊断一致且无发布                               |

故障控制仅在 T1 已授权的实际文件系统／子进程边界：真实 fs.writeFile、rename 和 IPC 检查点。产品没有测试标志或新增公开测试 API。失败断言完整比较配置、源码树、源码候选 Discovery 集合、Project Root、Snapshot、Generated、manifest 和 pending。Check 另比较完整 Workspace Data State 树，证明无候选暂存文件。

## Red before green

| UTC      | Observed failure                                        | Retained sandbox        |
| -------- | ------------------------------------------------------- | ----------------------- |
| 10:22:26 | manifest 少报 CommonEvents 后 Diff 仍成功               | mv-s4-output-001-HtguMg |
| 10:24:10 | undefined x 的完整输出无法表示，但 Check 跳过物化而成功 | mv-s4-output-002-jhU6w1 |
| 10:26:17 | 已安装生成目录后修改源码，Compile 仍提交 manifest       | mv-s4-output-003-5b5xKV |
| 10:33:25 | 实际生成文件换成非法 UTF8 字节，Diff 仍成功             | mv-s4-output-008-d6NJwD |

上述四个实际产品红灯均保留原始 failed 机器记录及其当时指纹，没有回写旧记录。004／005 首轮也有 failed：004的测试 literal 误用了尚属24的原生条件默认 ID1，而现有15＋18载体输出为0；005误以为文本 Diff 会显示新名称。修正为明确的现有载体 literal，以及 Diff 条目身份加完整 CommonEvents 数据比较后通过；这两份失败也保留，不冒称产品红灯。

## Verification

在产品／测试提交 `5d541e98ab7f10d3808214a9ec9281f49cf49001`，Windows／Node22.23.0、pnpm10.33.0：

- 正常 `pnpm check`：typecheck、lint、format:check及完整源码回归全部通过；27 files／260 tests，107.15s。沿用默认2 workers与原有 timeout，没有删断言或放宽超时。
- `pnpm build`：本工作树 node22目标的新CLI、Workspace API、DSL和声明文件构建成功；不使用primary旧dist。
- 正常 `pnpm --filter rpgmaker-event-dsl test:windows-baseline`：6 files／35 tests通过，64.10s；包括本票全部9项真实构建入口矩阵。
- 24份原始记录入库后，`pnpm --filter rpgmaker-event-dsl exec vitest run test/mv-evidence.test.ts`：索引／schema／来源／夹具／原始记录及基础独立往返全部通过；1 file／3 tests，3.43s。

最终源码9份记录统一指纹 `cf01b10b0a15e4aee99df4ee97fc9523575f5ef79ac5d32bc8b056eee8520403`；最终构建9份记录统一指纹 `ba015bd184352c435102cdba9060e864ac086b787708ef9b0981884537aac481`，后者纳入本工作树实际 dist。最终执行前已追加全部要求并完成 repoformatter；这些源码、测试、配置与 requirements 文件在源码／构建执行间没有变化。记录器只写 results，不修改 index；fingerprint 是记录内逐文件 hash 列表的 SHA256，revision 为实际运行时HEAD。

结果库新增18份最终 passed 与6份历史 failed 原始记录，逐字节复制并验证，不格式化或回写。原有151项要求深比较保持，所有旧证据 blob 未改；索引现160项。这里关闭的仅是19的完整输出／发布边界。

所有本票机器记录均为 `native: not-executed`；19未分配独立 E／R 场景，不代替49–51的最终逆向比较或52–54的实际游戏回归。
