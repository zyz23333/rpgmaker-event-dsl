# Ticket20 — Complete Decompile directory publication

本票从集成 `d0fb2dde20ff0a5ec3906932ddb20339422d2fda` 开工，在独立工作树实现。主要产品／测试提交为 `55f75ab`，合并复核发现的无关named import过早校验由 `66c04d4` 修复并重新完整验证。本票不签收后续容器／指令族或最终 E／R 验收。

## Complete candidate and final-location validation

Decompile 先从17／18捕获的同一 Snapshot 渲染整个源码批次。全部文件在最终 `sourceRoot/decompiled/` 文件名上建立同一 TypeScript Program；虚拟文件、缺失目录、物理路径别名和真实捕获输入分别处理。依赖文件、包作用域、正负解析查询仍经过18的不可变输入捕获，不把候选的虚拟事实误记为真实磁盘事实。完整候选经过真实受限求值、Staged Data Graph 和19的内存 Compile Output 构造／验证。

现有实际发现的源码只作语法和可靠 Entry Identity 投影。实现不执行 JavaScript、不调用命令构造器、不读取无关 commands/pages/name/引用或 Gate 字段，也不对旧源码运行完整类型校验。投影支持声明构造器、直接对象、常量别名、namespace／改名 import、局部 export alias、字符串计算属性、对象展开和属性读取；无法可靠确定身份时失败。对象自身 `undefined` 与字段缺失明确区分。候选自己的 owned 引用不能由旧源码补足，候选身份与旧身份冲突时拒绝整次操作。

## Isolation and single publication

实际 Discovery 和发布前候选检查共享 sourceRoot 解析、include 并集、空 include 的 ordinary-file fallback、文件及祖先目录 excludes。Discovery 按实际物理位置永久排除 `.rpgmaker-event-dsl/decompile-candidates/`，包括显式 junction alias 以及进程 kill 后残留；物理文件别名去重。保留命名空间自身不接受 reparse entry，防止将普通用户源码伪装成隔离区。候选暂存文件用 exclusive `wx` 创建，发布前比较完整文件集合、文件字节 hash 及候选目录身份。

固定目标整个目录必须不存在。检查使用 lstat，因此已有空目录、非空目录、文件、junction 和悬空 junction 都会被拒绝。最终原子拒绝覆盖来自 Windows PowerShell5.1／.NET 的一次 `Directory.Move`，没有覆盖 rename、逐文件 copy、合并、自动编号或最终目录回滚。PowerShell 通过固定脚本、base64结构化路径、直接 spawn 参数和隐藏窗口调用，不拼接用户 shell 代码。

发布前捕获逻辑和物理祖先的路径映射与文件身份。PowerShell 对这些目录／reparse entries 持有 FILE_LIST_DIRECTORY(1)、share READ|WRITE(3)、BACKUP_SEMANTICS|OPEN_REPARSE_POINT 句柄，拒绝外部 delete／rename。收到 PINNED 后，Node 在句柄仍存活时重验路径身份、完整候选、实际 Discovery、配置、源码、依赖和 Snapshot；随后才发送 publish，子进程只做一次目录移动并释放句柄。外部 actor 在检查后占据最终名称，仍由 Directory.Move 拒绝。独立 primitive 探针只是准备材料；016在实际公开流程重新验证逻辑junction、物理父及Workspace祖先拒绝操作，并验证完成释放后可操作。

当前支持布局要求 sourceRoot 已存在，且与 Workspace state 在同一文件系统；默认 init 建立 src。缺失 sourceRoot 不会被操作补建，避免对未固定的缺失祖先做创建／替换；文档明确要求自定义 root 预先建立。Windows host缺失、隔离目录为junction、无法固定的路径或跨卷安排均在发布前失败。失败只保留永久隔离的残留，不删除不确定的最终目录。进程在完整移动后丢失成功回报时，重试只报告目录已存在。

另外在实际C:／F:两个卷执行了一次公开Workspace API补充验证，而非重复primitive探针。`20-history/mv20-cross-volume-public-workspace-result.json`记录两边实际dev值233706315／233706805、明确same-filesystem／cross-volume拒绝，以及源码、外部源根、整个Project Root、Snapshot／state和Discovery的逐字节before／after相等。执行脚本和其SHA256一并保留；原sandbox `mv20-cross-volume-E4JmPi`及外部空源根`F:/Shuen/RPG/mv20-cross-volume-jRlVSN`保留，没有在不具备第二卷的通用测试中伪装执行。

唯一内部 Compile Contract Version 从19的 `mv-1.6.1/3` 更新为 `mv-1.6.1/4`。本票未改 Common／Map／Troop 完整容器模型、后续指令参数或原生保存默认值。

## Public seam matrix

独立基础 fixture 为 `common-event-project.json`，SHA256 `5c02c51a1460d192644983035fe10a36737dcbe2a220cb2e4b2e0a81404007d1`。控制仅发生在既定 T1 文件系统／子进程边界；产品没有测试 API 或测试标志。失败比较实际 Discovery、完整源码树、Project Root、Snapshot、Generated、manifest／pending和配置；隔离残留另行记录。

| Requirement | Actual coverage |
| --- | --- |
| MV-S4-DECOMPILE-001 | 旧源码无关类型错误、非法raw构造器参数、未知command标识符和未知命令named import别名不影响身份投影；相同common身份拒绝，不同身份成功且旧字节保持；身份本身依赖未知helper仍拒绝 |
| MV-S4-DECOMPILE-002 | final-location近层类型声明及CommonJS包作用域决定诊断；改成允许输入和module后成功，不从stage位置解析 |
| MV-S4-DECOMPILE-003 | own undefined spread覆盖早先id，不能退回旧id |
| MV-S4-DECOMPILE-004 | 目标已有五种目录／文件／junction形态，均整次拒绝并保持状态 |
| MV-S4-DECOMPILE-005 | 宽glob与显式junction路径无法发现既有malformed残留；成功后仅完整final批次可发现 |
| MV-S4-DECOMPILE-006 | capture后替换sourceRoot，拒绝而保留外部改变 |
| MV-S4-DECOMPILE-007 | 已PINNED且Node最终检查完成后，外部创建五种目标形态；实际Directory.Move拒绝且外部字节保持 |
| MV-S4-DECOMPILE-008 | 实际stage只写出一部分时kill进程；残留不被发现，显式重试完整发布并通过Check |
| MV-S4-DECOMPILE-009 | 实际子进程完成目录移动、close回调交付前kill父进程；重试只报已存在，完整批次保持且Check成功 |
| MV-S4-DECOMPILE-010 | 任一system或empty-map模块及包含目录被exclude则整次拒绝；空include fallback成功发现全部文件 |
| MV-S4-DECOMPILE-011 | 直接对象、namespace helper别名、展开／属性读取和__proto__ export alias身份冲突，以及未知身份失败 |
| MV-S4-DECOMPILE-012 | 旧源码存在Common2也不能满足候选Snapshot缺失的Common2引用 |
| MV-S4-DECOMPILE-013 | source、Discovery、config、Snapshot、dependency、候选字节／集合／目录替换八种捕获后变动均拒绝 |
| MV-S4-DECOMPILE-014 | absolute、parent-relative及含Unicode/空格/引号/$的junction根，实际CLI Decompile→Check→Compile；完整Common/System与独立fixture比较 |
| MV-S4-DECOMPILE-015 | 缺失sourceRoot、reserved isolation junction、真实stage写失败、实际找不到PowerShell host，均无业务状态变化；后续正常操作恢复 |
| MV-S4-DECOMPILE-016 | 实际PINNED期间unlink逻辑junction、rename物理src和Workspace祖先被OS拒绝；完成后删除alias和移动／复原src成功，发布数据保持 |

## Verification

在Windows／Node22.23.0、pnpm10.33.0，沿用默认2 workers与原有timeout：

- 最终产品的正常`pnpm check`通过typecheck、lint、format:check和完整源码回归，28 files／293 tests，176.78s。没有删除断言或放宽timeout；原始日志为 `20-history/mv20-full-check-lazy-import.txt`。
- `pnpm build`在本工作树重新构建node22目标CLI、Workspace API、DSL与声明文件成功；不使用primary旧dist。
- 本工作树66c04d4的实际构建入口执行 `pnpm --filter rpgmaker-event-dsl test:windows-baseline` 全部通过：7 files／68 tests，103.98s。原始日志为 `20-history/mv20-built-windows-lazy-import.txt`，未修改默认workers、timeout或断言。构建原始日志为 `20-history/mv20-build-lazy-import.txt`。

最终源码33份通过记录统一fingerprint `fda8e4a46f0b4687b8f600ba22e3fd57530e82a1ade592e70dacc395f9e8d45e`，由实际src／test／配置／requirements逐文件hash列表计算，revision记录当时真实HEAD55f75ab，随后修复提交66c04d4保存同一文件内容。最终构建33份通过记录统一fingerprint `4ff36868b68bc84241cb1a7a2384ae1aad938b75d668240fdbf1bb958cd8ea32`，包含本工作树实际dist文件hash，revision为 `66c04d4a8535450485d4d509d77a0264e1f8512a`。共66份最终passed标准记录；另保留66份修复前passed与4份标准历史failed：001无关import、011 helper-spread及LOCK-004／SNAPSHOT-003两项前置顺序回归，共新增136份原始标准记录。原始JSON字节复制入库，不格式化或回写；最终源码／构建结果和日志的逐字节复核与SHA256在 `20-history/lazy-import-source-final-checksums.json`及 `20-history/lazy-import-built-final-checksums.json`。原160项requirement记录逐条深比较保持，新增16项，总176项。

修复前完整检查的28 files／293 tests、173.48s与built Windows 7 files／68 tests、101.56s均保留原日志；对应33份源码fingerprint为 `3d01ea8b70651c8e4689d6d07ffbc75bbe92beebec1c5913ed5f48d10370b6a4`，33份built fingerprint为 `be4401219bfb7186bace107ec56be42258b8f1582a61f0b7b7d72f7c3b29243b`。这些是55f75ab修复前历史，通过记录不能替代66c04d4的最终验证。

最终归档后，证据索引定向验证 `vitest run test/mv-evidence.test.ts` 为1 file／3 tests通过，4.75s，原始日志为 `20-history/mv20-evidence-final.txt`。另逐文件核对最终source／built记录所列hash与当前工作树实际内容一致，所有已归档checksum保持，`git diff --check`通过。

`20-history/.gitattributes`只对本票原始归档禁用Git文本转换，原始命令日志按binary diff保留CRLF与空白；已逐文件确认暂存Git blob等于原始工作树字节，防止提交时被autocrlf归一化而破坏checksum。

所有本票机器记录均为 `native: not-executed`；20不承担独立编辑器或游戏场景，不替代49–54的最终验收。

## Red before green and retained corrections

`20-history/`逐字节保留最初identity-only、final-location类型、own undefined spread、existing destination与physical Discovery五轮实际产品红灯。之后011新增“commonEvent helper展开本身没有mapId”的公开红灯：投影误把没有字段当成own undefined，实际可靠的map身份被拒绝；字段missing修正后通过。早期报告是在现有记录器接入前取得，保留的是原始Vitest JSON及checksum，不伪造当时未采集的完整源码指纹。后加的011红灯通过标准记录器保留实际源码文件hash和fingerprint。

测试夹具错误也保持原样：第一次final-location green命名报告实际failed，是合成类型包漏了生成模块会import的variableDefinition；初始path-swap报告是状态观察器试图读取仍被内核独占的operation.lock，尚未到产品断言；旧workflow fixture缺src与module package scope则在更严格的实际最终位置验证下失败，补建明确fixture并保留原报告。这些都不作为产品红绿证明。

首轮正常全量检查的两项真实回归是20的destination已存在检查遮住16的Interrupted Push和17的Project Root Binding前置诊断。原始`mv20-full-check-first.txt`保留2failed／291passed；恢复前置检查优先顺序后，两项定向回归通过，随后正常全量293项通过。最后011新缺失字段红灯修正后再进行最终全量检查和构建验收，不把早一次绿色替代最终源码验证。

合并复核随后在55f75ab实际built Workspace API发现一个新增反例：旧源码从DSL包named import不存在的command，且只在commands中使用，可靠commonEvent:99仍被扫描import时过早校验拒绝。`20-history/mv20-merger-unrelated-import-result.json`与执行脚本保留该公开失败；`mv20-lazy-import-red.json`保存001新增的实际红灯。修复仅将named import的helper存在性校验延后到身份投影真正读取该绑定时；001同时验证commonEvent:1仍报告身份冲突、commonEvent:99成功且旧源码字节不变，以及id本身调用未知helper时仍拒绝并保持业务状态。`mv20-lazy-import-green.json`保留公开定向绿灯；合并复核用原执行脚本在66c04d4重建后独立公开复验成功，结果为 `mv20-merger-unrelated-import-green-result.json`。以上结果和新增001标准failed记录均逐字节归档，并附checksum；55f75ab的通过记录作为修复前历史保留，最终验证使用修复后的实际文件指纹。
