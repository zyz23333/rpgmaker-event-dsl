# Ticket17 — Snapshot capture and Project Root Binding

本票基于集成 `b2f2acd627434273abca2093fb1b10f5e6a26496`，交付 Clone/Pull 的一致捕获、规范化目标绑定贯穿现有工作流、未知/损坏格式和不安全集合的明确拒绝。本票不宣称完成18的编译/类型依赖捕获、19的编译输出发布、21的完整实时 Drift 或22的旧契约恢复矩阵。

## Captured inputs and publication

Snapshot 从一次读取的 MapInfos 原始 Buffer 确定地图集合，各标准文件也只读取一份 Buffer 用于暂存内容和 SHA256。发布前逐文件复查整份字节，并复查实际 Workspace Config 字节及规范化目标；发现变化失败，要求重跑，没有自动部分重读/重试。对 UTF-8 使用 fatal 解码检查，保留实际原始字节而不经 JSON 重串行化。解析只确定集合与 carrier 位置，不验证或补全外部数据库的所有字段。

MapInfos 必须为数组，非 null 项必须具有正安全整数且不重复的 id，以及后续消费者所需的非负安全整数 parentId；空名称和其他原始字段保留，不添加 index=id 约束。非法根、条目、ID、重复、缺注册地图或目录代替文件均明确拒绝。System 必须为对象，其他标准数据库为数组，登记地图须为含 events 数组的对象。插件数据与未登记地图保持在集合之外，不因它们损坏而拒绝完整标准集合。

暂存目录安装完成后才提交 manifest。文件级 manifest rename 保留旧文件；若 manifest 安装失败，则恢复旧 Snapshot。各读取命令也重新计算 Snapshot 的 MapInfos 集合及原始内容哈希，与 manifest 比较，拒绝混合发布或本地损坏状态。公开 Freshness 查询保留内容变化返回 false 的现有行为。

检查点之间仍可能发生外部编辑；本票不提供外部编辑器锁或跨 Workspace 原子隔离。

## Binding and format safety

Project Root Binding 使用 `realpath` 后的路径，Windows 大小写归一，绑定保存在 Snapshot manifest、Compile Baseline、baseline hash 以及 version2 pending。目录 junction 到同一目标保持身份。更改配置目标后 Clone、Decompile、Compile、Check、Diff、Push 和 Freshness 查询拒绝旧绑定；无 pending 时只有显式 Pull 建立新绑定，并丢弃旧 generated metadata。Generated 字节可保留，但 Diff/Push 不再认可它们，必须重新 Compile。

有 pending 时先检查其原目标再分类和删除；错误目标拒绝且原项目、新项目及 pending 全部保留。回原目标后由 Push 按现有可理解内容状态恢复。未知版本、缺绑定、未知字段、损坏 JSON、不完整 pending 目录、安全文件名/hash 形状错误、重复受影响项、backup/snapshot/generated per-entry 元数据矛盾和备份/生成字节损坏均明确停止，无自动迁移或删除。完整旧版本/类型依赖保留、恢复矩阵和后续普通检查由18/22完善。

## Public seam evidence

十例 `MV-S4-SNAPSHOT-001`–`010` 关联在验收索引。输入使用独立合成 `common-event-project.json`，SHA256 `5c02c51a1460d192644983035fe10a36737dcbe2a220cb2e4b2e0a81404007d1`。实际调用公开 API/真实 CLI，正常准备经过 Clone、Decompile、真实 Discovery、TypeScript 类型检查和源码求值，再 Compile。有限的 fs 边界控制只存在于测试子进程 helper，暂停真实 readFile 或对一次实际 manifest rename 抛出 I/O 错误；产品没有新增测试开关或公开测试 API。

每项失败比较源码全树、配置、原项目和第二项目、Snapshot、Generated、manifest、manifest 中的 Discovery 集合及完整 pending。字节按 hex 比较，原始格式与 CR 不归一。机器记录保留完整最终状态、真实子进程 argv/环境/诊断以及精确源码/测试/配置指纹。

## Red before green

以下真实红灯都在产品修复前观察到，失败 sandbox 保留于 Windows temp，未改标为成功：

| UTC | Counterexample | Retained sandbox |
| --- | --- | --- |
| 09:09:05 | 捕获 Actors 后外部修改，Pull 错误成功且发布与原 hash 不同的内容 | snapshot-consistency-c6tP6g |
| 09:10:34 | 改 Project Root 后 Check 仍成功 | project-binding-dtHplk |
| 09:12:04 | 改 Project Root 后 Push 迟报错，却已删除原目标 pending | pending-binding-L2bu3A |
| 09:17:38 | 无效 UTF-8 被有损复制，Pull 错误成功 | snapshot-bytes-Kk7LKn |
| 09:18:32 | MapInfos 重复 ID 被 Set 静默去重，Pull 错误成功 | snapshot-collection-HcHTak |
| 09:19:35 | manifest rename 故障后丢旧 manifest，Snapshot 已替换 | snapshot-publication-w12uaG |
| 09:20:14 | manifest 带 ../outside.json 仍通过 Check | snapshot-metadata-GndGcS |
| 09:20:54 | 本地 Snapshot 与 manifest 不符仍通过 Check | snapshot-integrity-9my7vz |
| 09:21:38 | 登记地图 events 为对象仍被捕获 | snapshot-carrier-XsE4ea |

每个新增行为都遵循先红后绿。之后逐步扩展正常与失败边界：Clone/Pull 各四种实际并发编辑；十种非法 MapInfos；完整目标消费者矩阵；显式 Pull/新 Compile/junction 正例；真实 pending 错目标及原目标恢复；十种 pending 元数据异常、损坏 JSON、缺 manifest、backup/generated 字节损坏和全 generated 收尾。

## Verification

Windows / Node22.23.0、pnpm10.33.0。十组聚焦测试通过（24.69s）；工作流、操作锁和本票联合回归3 files /48 tests通过（46.28s）。完整静态检查 typecheck、lint、format:check 已通过。最终全量源码、构建和构建后基线结果在合并集成后追加。

本票没有独立编辑器或游戏分配；全部机器记录 `native: not-executed`。最终 E1–E7 逆向比较和 R1–R7 游戏运行仍保持未完成门槛。
