# Ticket 22 — Interrupted Push 内容恢复

本票通过公开 Workspace API/CLI、独立预造的恢复证据，以及真实 Windows 文件系统和受控子进程验证 ADR 0006 / 0013 的内容恢复契约。初始产品提交为 `7b2e70235a7e315801aebd9c98f1bfcfb8847ef1`，集成基线为 `a64dc2e0fc8b79ff3ddd45ce214fd2ded08b6bf6`。最终交付还包含独立预审发现的 pending 捕获一致性修复；其提交与最终验证见下方交付记录。

## 已交付的恢复协议

以 O 表示原 Snapshot 字节、N 表示原 Generated Project Data 字节、A 表示原 Affected Project Data File 集合、U 表示其余标准输入。pending v3 冻结完整原 Sync Manifest M0、M0 的规范对象哈希、原 Compile Baseline、目标绑定，以及 A 的 O/N/备份哈希。备份 B 必须逐字节满足 O；Generated Project Data 的完整成员集合和内容必须满足原记录。恢复还以 B(A)+S(U) 和已验证 G 重建原语义 A，拒绝漏记或多记的 affected 集合。

- L(A) 全 N 时，M0 下的 S(A) 可分别为 O/N；恢复只补齐原操作已完成写入的本地记录。M1 只允许 A 的 Snapshot 哈希以及 Compile Baseline 的 Snapshot 部分和自哈希发生确定性变化。
- 当前 M 必须是完整 M0 或确定性 M1。M1 必须伴随全 N 的 S(A) 和 L(A)。原源码、实际类型依赖、Discovery 依据、配置、目标绑定、契约版本以及原本缺失的字段均保留。
- L(A) 全 O 时，只接受 M0 和全 O 的 S(A)，先退休原 pending，再进入普通 Push。混合、缺失、未知、语义相同但原始字节不同，或其他矛盾状态明确拒绝。
- 正常 Push 和恢复共用同一个本地收尾入口。所有 N 都来自已读取且验证的 Buffer；消费前后复核证据，晚到的 G 变更不能被吸收到 Snapshot 或 M 中。
- Snapshot 文件以独占临时文件、字节哈希复核和 rename 发布；M 使用现有临时文件/rename 并带证据复核。完整证明后，将固定 pending 目录 rename 到独占的 `pending-push.retired-*/operation`，之后只清理退休内容。部分清理失败不把残缺内容放回权威 pending 位置。
- pending 与 M 严格 UTF-8 解码。恢复使用同一次 pending Buffer 读取来解析对象和建立后续 unchanged 比较基准，拒绝读取完成后被替换的未知 pending。
- 恢复后照常执行完整 Snapshot/Generated 完整性、Generated Freshness、全输入 Project Drift 和 no-op/destructive 检查。其他命令和死亡 owner 的锁清理均不能消解 pending。

这些是明确检查点和内容证明，不承诺与外部编辑器之间的全项目原子隔离或整体回滚；旧 pending 格式没有兼容迁移。退休后残留目录包含可追踪的清理诊断，但不再代表未完成写入。

Compile Contract Version 从 `mv-1.6.1/4` 升到 `/5`。本票没有改变 DSL 类型、Compiler Defaults 或生成语义；这是为更严格的证据/状态验证采用的保守失效。仅私有 pending 格式升级本身并不必然要求编译契约升级，不能把该版本变化当作新 DSL 行为的证明。

## 验收索引

[requirements.json](requirements.json) 在既有 191 行之后追加 19 行，总计 210 行；原行内容保持深度相等，原结果 blob 不变。[人工索引](README.md) 对应同一组 ID。以下 19 项因参数化共执行 39 次；每项同时记录完整源码、依赖、实际 Discovery、配置、Game、Snapshot、manifest、pending 和生成状态。

| ID 尾号 | 已执行的义务 |
| --- | --- |
| 001–002 | 实际杀死 Push，分别停在部分 Snapshot 与已发布 M 后，恢复完成并可重复执行 |
| 003 | 独立构造缺版本/类型依赖字段的可理解旧依据，记录旧写入后仍因普通 Freshness 拒绝新写 |
| 004–006 | 全 N 的 old/partial/new Snapshot 矩阵，当前源码/配置/Discovery/依赖变更或删除，恢复后的 stale/Drift/no-op 检查 |
| 007 | live、B、G、S、M、映射、版本、绑定、成员集合和格式化字节的矛盾矩阵；拒绝时完整状态不变 |
| 008 | Snapshot、M 和 pending 退休边界的连续真实进程死亡、恢复与幂等重试 |
| 009 | L/B/G/S 中有效 U+FFFD 与无效 FF 替换解码相同的原始字节反例 |
| 010–011 | 最终 live 安装后、G Buffer 读取后、Snapshot 候选写前的晚到 G 变化；真实 Snapshot、M rename、退休创建/rename/部分清理故障 |
| 012–013 | M1 与 S/live 矛盾；非 Push 命令、活 owner 争用和死 owner 锁清理不消解 pending |
| 014–015 | 漏记 A、缺 B/G、无法解释的 Snapshot 集合保持证据并给出 Interrupted Push 诊断 |
| 016–017 | 全 O 退休故障必须先于新写；独立构造 M1 被识别且不重新写 manifest 字节 |
| 018 | pending/M 中相同替换解码字段的无效 UTF-8 元数据必须拒绝 |
| 019 | 首次 pending read 完成后磁盘替换为 version999，拒绝并保持未知 P 与原 S/M 等全部状态 |

## 实际 red 与历史记录

[22-history](22-history/) 原样保存 runner JSON、完整 check/build/baseline 日志和复制审计。文件名保留原始命名；文件名中的 `green` 或 `red` 不改变真实结果。所有归档复制使用独占目标并按 Buffer 验证；该目录 `.gitattributes` 禁止文本换行转换。

实际产品 red 包括：旧实现对真实部分 S 的拒绝（`mv22-partial-red.json`）、M1+P 的错误拒绝（`mv22-committed-red.json`）、旧依据规范对象哈希不一致（`mv22-old-basis-red-valid.json`）、漏记 A 导致权威 P 丢失（`mv22-incomplete-A-red.json`）、缺证据只报裸 ENOENT（`mv22-missing-evidence-red.json`）、两个无效 UTF-8 元数据反例被错误接受（`mv22-metadata-bytes-red.json`），以及 version999 替换后 Push 错误成功（`mv22-pending-capture-red-valid.json`）。这些均有实际执行，再有修复后的通过。

晚到 G 案例是在冻结/共用收尾实现后的回归通过；此前风险判断是静态分析，不称为已执行旧实现 red。其余失败也如实保留：最初旧依据脚本非法 await、未登记 requirement、丢失 helper、自哈希字段次序、观测树根标记、正常 staging 清理误入断言、类型断言遗漏，以及旧 workflow fixture 漏记真正受影响的 CommonEvents。`mv22-committed-green.json` 和 `mv22-first-two-fixed.json` 实际失败；`mv22-matrix-first.json` 为 16/18，`mv22-expanded-first.json` 为 30/31。`mv22-pending-capture-red.json` 是误用测试 helper 的 `child.release`，不称为产品 red。保留的 failed 标准记录从未改写为 passed。

独立 merger 的首次 pending 捕获脚本使用错误 M0 哈希，产品正确拒绝，归档为 `merger-initial-invalid-fixture-*`。修正独立 fixture 后，`merger-pending-capture-product-red-*` 在本工作树 fresh built API 上实际得到错误成功、Snapshot 推进和未知 P 删除；019 重现相同真实边界，并在同 Buffer 修复后通过完整业务状态断言。

同一独立脚本在 `65fa6c2` 的 fresh built 上复核为 green（`merger-pending-capture-green-*`）：`injected=true`、两次读取，明确报告 metadata changed，version999 原样留存，Snapshot 未推进为 G。它与本票测试019互为独立复核，原始脚本和结果都保留。

最初 held IPC 复现仍以历史 red 保存：旧 build19 `00266f8`，Windows Node 22.23.0，PID 33752 在 CommonEvents Snapshot 实际写入后被 SIGTERM，L 的 Common/System 均 N、S 为 N/O、M0/P/B 完整，后续旧 Push 拒绝。原脚本 SHA-256 为 `9f615dc0bd9fb3359cc7d5604d49e9e7a111cf757a1b38b6cdd8639107bbd22d`；原报告为 `dce9fc8ed6730b90ea7a0c3118e290f7db91538b6cd72548e781f9f9ad94bec9`。对应归档文件为 `original-held-reproduction.cjs` 和 `original-held-reproduction-result.json`，不会冒充本票的新成功。

## 交付与验证记录

产品最终稳定提交为 `65fa6c200f7b354228a253e2d4d3e219430d7abf`，在初始 `7b2e702` 上修正同一 pending 的对象/Buffer 捕获一致性。2026-10-19、Windows 10.0.19045 x64、Node 22.23.0、pnpm 10.33.0、Vitest 4.1.9、TypeScript 5.9.3 下实际完成：

| 检查 | 实际结果 | 原始归档 |
| --- | --- | --- |
| `pnpm check` | typecheck、lint、format 和 30 files / 352 tests 全通过；测试 324.31s | [mv22-capture-check-final.txt](22-history/mv22-capture-check-final.txt) |
| fresh `pnpm build` | 15 个本工作树 dist 产物，构建通过 | [mv22-capture-build-final.txt](22-history/mv22-capture-build-final.txt) |
| `test:windows-baseline` | 实际调用上述 built CLI/API，9 files / 127 tests 全通过；222.62s | [mv22-capture-built-final.txt](22-history/mv22-capture-built-final.txt) |
| 归档后 evidence index 专项 | 1 file /3 tests 全通过；5.32s，含全部归档结果的 schema、fixture、source fingerprint 和链接检查 | [mv22-post-archive-index-check.txt](22-history/mv22-post-archive-index-check.txt) |
| 原始复制与历史审计 | 最终39 source +39 built、前一稳定产品76 passes、16 failed 以及124个中间 passes 全部保留；原191条 requirement 深度不变、429个原结果 blob 不变 | [archive-audit.json](22-history/archive-audit.json)、[补充历史 passes 审计](22-history/supplemental-historical-passes-audit.json) |

归档共追加294个标准结果 JSON（278 passed /16 failed）；它们分别证明各自记录的输入/阶段，不把中间通过当作最终 tip 通过。最终 source 指纹为 `1dd5fde470e43d1b3bad524866212d8b1f28e7c8d19ae7c94c40c268ca12a055`，built 指纹为 `670be9e1214e92a78e950d13f16834a5f5703e959deccfb157c9dcb8d22191c4`。

最终 source39在修复提交前执行，其真实 `source.revision` 为 `7b2e702`、当时源码有未提交的捕获修复；没有修改记录中的 revision。逐项文件 SHA-256 已与最终实际文件核对相同。built39在稳定 `65fa6c2` 与全新 build 后执行，保存了额外15个 dist 文件哈希。旧 source38来自 `a64dc2e` 加当时未提交实现，旧 built38来自 `7b2e702`；旧指纹分别为 `5d35127c63cf77395425c64b6baf0448dffd36417f9e6ea0b1cbb6c50e9e5a68` 和 `647b7091748cd93c0b664837fd1aeaa63608cbf30b66c1d7e3a6d39c4509b6dc`，它们是修复前历史，不能与最终指纹混用。

新主 chunk 为 `operations-CszINqUu.mjs`，SHA-256 `691a76e4cfc4a27d3aa85d9db2776b8e1110dcf0a28ff2f37c7063339acd3a0f`；完整15项产物清单见复制审计。后续提交只增加本报告、ticket 完成记录和原样证据；提交后的 blob 审计另核对所有复制字节、最终捕获的 tracked 文件和 dist 产物。

前一产品 tip `7b2e702` 的完整 `pnpm check` 实际为 30 files / 351 tests 通过（270.66s），fresh `pnpm build` 通过，built Windows 基线为 9 files / 126 tests 通过（165.07s）。这些原记录保留，作为捕获修复前的历史通过，不代表 version999 场景已正确。其 38 source + 38 built 标准记录也保留，并与最终39+39分别标明。旧 dist 的15个文件另按原字节保存在 `C:/Users/Shuen/.codex/tmp/mv22-pre-capture-dist`；旧产物清单归档为 `pre-capture-dist-artifact-manifest.json`。

本票未分配独立 E/R 原生组；全部自动化记录的 `environment.native` 均为 `not-executed`。没有把静态分析、合成样本、逆向事实或自动化结果写成编辑器 UI/实际游戏通过，最终原生检查仍由后续票承担。工作树、依赖 junction、dist、Windows sandboxes 和原始外部证据均保留。
