# Ticket16 — Workspace operation mutual exclusion

本票交付同 Workspace 的 Clone/Pull/Decompile/Compile/Check/Diff/Push 互斥，以及公开 `isGeneratedProjectDataFresh` 查询的相同保护。锁在读取 Workspace Config、Snapshot、manifest、Generated 或 pending 之前取得；争用立即报告 `Workspace is busy`，没有排队或自动重试。当前平台范围沿用项目已声明的 Windows / Node22，不新增跨 Workspace 或跨机器协调。

## Kernel lease and abandoned owners

锁采用持久 `.rpgmaker-event-dsl/operation.lock` 文件和 Windows 独占打开句柄。实现集中封装 libuv 的 `UV_FS_O_EXLOCK=0x10000000`，与 Node `O_RDWR|O_CREAT` 组合；不使用 `O_TRUNC`。Node 的 `fs.constants` 未公开此常量，所以代码明确命名、注明来源，并在非 Windows 平台显式拒绝，避免忽略标志后静默失去互斥。

官方可复核依据：

- [libuv v1.51.0 include/uv/win.h](https://github.com/libuv/libuv/blob/v1.51.0/include/uv/win.h#L692) 定义 `UV_FS_O_EXLOCK` 为 `0x10000000`。
- [libuv v1.51.0 src/win/fs.c](https://github.com/libuv/libuv/blob/v1.51.0/src/win/fs.c#L478) 在该位存在时设置 `share=0`；普通打开才允许 read/write/delete sharing。
- [libuv 文件系统文档](https://docs.libuv.org/en/v1.x/fs.html#c.uv_fs_open) 说明 exclusive open；Windows 从 libuv1.17.0 支持。
- [Node v22.23.0 fs 文档](https://github.com/nodejs/node/blob/v22.23.0/doc/api/fs.md#file-system-flags) 允许数值 flags。本机验收基线为 Node22.23.0 / libuv1.51.0。

文件存在性、内容中的 PID 和 mtime 都不代表活跃 owner。Windows 成功授予独占句柄就是前 owner 已不再持有该内核资源的证明；活跃句柄持有期间，其他进程打开或 unlink 都得到 `EBUSY`。正常返回、抛错的 `finally` 关闭句柄，进程终止或未捕获异常则由内核关闭。文件始终保留，不运行“读旧记录后删除 pathname”的 stale-cleaner，因而多个清理者不会删除新 owner 的锁。遗留文件复用也不改写其字节或 inode。锁模块完全不读取或修改 pending。

Workspace 根目录先经 `realpath`，同一目录的 junction 别名使用同一持久文件。不存在的 Workspace 不由普通命令创建。其他非争用 I/O 错误原样失败。该保护覆盖本工具的 Workspace 工作流，不宣称阻止外部编辑器修改项目文件。

## Public seams and independent observations

输入复用独立编写的 `common-event-project.json`，SHA256 `5c02c51a1460d192644983035fe10a36737dcbe2a220cb2e4b2e0a81404007d1`。公开 API 真正执行初始化、Clone、Decompile、Discovery、TypeScript 检查/求值和 Compile；子进程实际调用同一公开 API 或真实 CLI。

T1 已批准的系统边界控制位于测试 helper，限定暂停一次真实配置读取、Snapshot 安装 rename 或 Push 首次项目替换。IPC 通知父进程到达边界，再等待显式 release；其余文件操作保持真实。产品代码没有新增测试开关或公开测试 API。检查使用独立输入与操作前后的完整字节比较，不验证内部调用顺序。

| Case | 实际验收 |
| --- | --- |
| MV-S4-LOCK-001 | 八个公开入口分别持锁，64个 API 竞争组合全部报忙；七条 CLI 命令在故意不完整的配置前先报忙；CLI Check 持锁也挡住所有 API；同进程并发一成一忙。 |
| MV-S4-LOCK-002 | Pull 已移走旧 Snapshot、新 Snapshot 尚未安装的实际空档，API/CLI Check/Diff 和其他读取入口经真实 junction 仍报忙；另一 Workspace 同时 Check/Diff/Push 成功。释放后重新 Compile，完整状态恢复到独立基线。 |
| MV-S4-LOCK-003 | 锁文件预置很旧的 mtime 和伪 PID 内容，活跃 owner 仍报忙且 unlink 失败。真实 SIGTERM 与未捕获异常退出后可立即重用。同一遗留文件的六个 barrier 同步子进程仅一胜、五个在胜者仍存活时完成报忙；文件 inode/内容保留，最终用户状态不变。 |
| MV-S4-LOCK-004 | 真实 Push 建立 pending 后、替换项目文件前终止；锁释放后所有非 Push API 和 CLI Check 继续报告 pending，完整状态逐次不变。只有 Push 按原内容恢复规则继续并完成写入。另测源码检查失败保留全部状态，修复源码后正常 Check 证明句柄已释放。 |

每例比较源码全树、配置、Project Root 标准 JSON、完整 Snapshot、Generated、manifest、manifest 中的实际 Discovery 集合，以及完整 pending 树。锁竞争失败不产生用户内容改动；pending 被独立比较，未用“锁已释放”替代恢复验收。

## Red before green and verification

首个真实子进程测试在 `2026-10-19T08:41:33Z` 红灯：Clone 停在读取配置，竞争的公开 API Check 成功返回 `undefined`，违反应报忙的预期。加入共享锁后该测试通过，再扩展上述矩阵与故障场景。失败临时目录 `operation-lock-ylL3sO` 保留在 Windows temp。测试 harness 的 Windows preload 路径最初需修正为 file URL；一次 Diff 文案预期也修正为公开 `short:true` 模式。失败记录仍保留实际失败状态，没有改标通过。

全量检查还发现既有 Check 测试精确枚举 Workspace Data State 时需要计入 Clone 已建立的持久锁文件。测试现同时要求 Check 前后目录集合完全一致，并独立列出 `operation.lock`、Snapshot 和 manifest；没有放松 Generated 或 freshness 不发布的断言。

Windows / Node22.23.0、pnpm10.33.0 的首次完整 `pnpm check` 已通过：typecheck、lint、format、20 files /165 tests；`pnpm build` 已通过（node22目标）。构建后 CLI/API 互斥矩阵和集成后复验结果在完成时追加到下方，机器记录包含精确受测源码/测试/配置指纹。

本票未分配独立编辑器或游戏场景，所有机器记录明确 `native: not-executed`。最终 E1–E7 逆向输出比较与 R1–R7 实际游戏运行仍由指定后续票完成。
