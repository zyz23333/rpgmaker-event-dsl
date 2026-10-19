# Ticket18 — Compilation input capture and Generated Freshness

本票基于集成 `db40b83dea753ae0bb07d338b97d462c18711af3` 开工，完成前合入 `31b5461b68a4d1d9e24f25f024736e789c2dcd23`。产品实现提交 `54c70f2`；合并后的验证提交为 `a84eb8485b8cd2b945f86cf9c8c41fddb915f1db`。

## Captured compilation basis

同一 `TypeInputCapture` 贯穿一批真实 Discovery 源码的 TypeScript host。源码的 AST、类型验证和受限求值使用同一次读取的字节；捕获源文件、传递声明依赖、标准库和包元数据的原始 SHA256。host 的 getSourceFile 显式从捕获内容构造 AST，避免标准 host 内部闭包绕过替换后的 readFile。多个源码入口共享同一捕获会话。

输入还记录实际 fileExists、directoryExists、getDirectories、readDirectory 和 realpath 观察，包含不存在的解析候选。Freshness 重查这些查询以及实际内容；因此先前加载的文件未改，也不能掩盖新增高优先级 name.ts、自动类型目录或 package.json 的变化。目录结果排序且给 host 返回副本。TypeScript 当前目录显式绑定 Workspace，API 与 CLI 不再因调用进程 cwd 不同而选择不同的自动类型目录。

Compile Baseline 将这些观察、发现源码及其实际字节哈希、相关配置、完整 Snapshot 集合/内容、规范化 Project Root Binding 和 Compile Contract Version 一起哈希。缺版本、不同版本或缺类型依赖捕获的旧输出均不 fresh，Diff/Push 要求重新 Compile，没有迁移或部分重试。Push 只更新已写入 Snapshot 的哈希时保留原来的版本与类型输入，不把旧编译依据改写成新依据。

Compile Contract Version 唯一内部拥有点为 `src/workspace/type-inputs.ts` 的 `compileContractVersion`。后续19–47等票改变 DSL 类型、验证、Compiler Defaults 或输出语义时，须相对当时集成版本更新；并行改动合并时应协调，不能将两个同名下一版本误当成两个有效递增。ADR0013及公开 README 已同步，不引入 Git/runtime 源码哈希生成系统。

## Snapshot and publication checks

验证和物化均读取同一份已捕获 Snapshot Buffer 集合。集合必须仍与已验证 manifest 一致；不通过后续读到的新 Snapshot 偷换原验证依据。Compile 在生成暂存内容后、安装 Generated 目录前复查；Check 在成功返回前复查；Decompile 在生成全部候选文本且检查既有目标后、首次写源码前复查。复查覆盖完整 Snapshot 集合/内容、真实 Discovery 集合、源码与类型查询、配置字节及规范化目标。观察到变化则明确失败并要求重跑，不隐式重新求值、局部重读或重试。

Decompile 在本票仅捕获现有 discovered source 的字节和集合，不提前增加其完整类型/引用/Gate 验证；20仍负责身份提取、隔离全批候选、最终目标及目录发布。19仍负责完整物化输出验证及 Check/发布模型；21负责完整实时 Drift；22负责恢复的完整矩阵和原契约保存。本票的发布前检查是明确检查点，不承诺外部编辑器在最后检查后不能保存。

## Public seam evidence

使用独立合成 fixture `common-event-project.json`，SHA256 `5c02c51a1460d192644983035fe10a36737dcbe2a220cb2e4b2e0a81404007d1`。正常准备实际经过 Clone、Decompile、Discovery、TypeScript 验证、受限 AST 求值和 Compile；Generated CommonEvents 与独立 fixture 完整比较，保留 CR/空字符串、顺序和终止记录。

| Requirement     | Actual matrix                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| MV-S4-INPUT-001 | 外部 import type 内容更改、删除、替换分别使 Freshness 为 false；Diff/Push 拒绝；恢复原内容又 fresh                                                |
| MV-S4-INPUT-002 | Compile/Check 各在捕获后修改源码和类型依赖；失败且保留用户修改以及既有输出                                                                        |
| MV-S4-INPUT-003 | 新增高优先级 name.ts、改变 package.json 模块模式、新增自动类型目录；已加载声明未改也 stale                                                        |
| MV-S4-INPUT-004 | Compile/Check 各遇 Discovery 新增/删除和 MapInfos/注册地图集合变化，拒绝发布                                                                      |
| MV-S4-INPUT-005 | Compile/Check 各遇 Script Gate 配置、目标、Snapshot 原始内容和新解析候选变化，拒绝发布                                                            |
| MV-S4-INPUT-006 | Decompile 遇既有源码、Discovery、配置和 Snapshot 变化，全部源码均未发布；复原后成功                                                               |
| MV-S4-INPUT-007 | 真实 Push 保留版本与类型依据；四种相关配置变化、缺/旧版本和缺捕获元数据均 stale；CLI Diff 拒绝；CLI Check 只读且不创建 Freshness；新 Compile 恢复 |
| MV-S4-INPUT-008 | 普通 helper 值导入明确拒绝，import type 不执行会抛错的模块；开启 Gate 后会抛错的事件脚本仅编成355文字，不执行                                     |

失败路径比较配置、源码全树、真实源码候选集合、外部类型依赖、包元数据、Project、Snapshot、Generated、manifest、pending 的完整字节状态。控制只在既有测试 helper 的真实 fs.readFile 边界暂停一个实际子进程；产品没有测试标志或新增公开测试 API。源入口与构建入口均执行同一测试矩阵。

## Red before green

| UTC      | Actual failure                                       | Retained Windows sandbox  |
| -------- | ---------------------------------------------------- | ------------------------- |
| 09:46:27 | 修改外部 name.d.ts 后 Freshness 仍为 true            | type-dependency-TWXRwU    |
| 09:48:24 | Compile 完成类型验证后源码被改，命令仍成功发布       | compile-input-race-k9NhiH |
| 09:52:16 | API 沿用调用者 cwd，Workspace 新增 @types 后仍 fresh | resolution-inputs-w8CBR0  |

第三项保留原始 failed 机器记录，随后显式绑定 Workspace 目录，003聚焦转绿。008同轮也有一份原始 failed，但原因是测试期待的文案与既有 Unsupported import source 诊断不符；产品当时正确拒绝且未执行模块。修正预期文案后通过，不把该失败冒称为产品红灯。最早001/002红灯在机器记录包装加入前观察，保留原始工具输出与上述失败 sandbox，不补造旧源码指纹。

## Runner resources

base vitest 配置现在默认 `maxWorkers: 2`，built配置继承，因此正常 `pnpm check` / `pnpm test` 路径也采用已在16/14/17验证可靠的并发。早先默认高并发曾导致原断言超时；这是执行资源稳定性调整，全部既有断言和10s/30s timeout均保留。争用测试仍显式启动多个真实进程，未减少其并发覆盖。

## Verification

Windows / Node22.23.0、pnpm10.33.0，在提交 `a84eb8485b8cd2b945f86cf9c8c41fddb915f1db`：

- 正常 `pnpm check`：typecheck、lint、format:check及完整源码回归全部通过；24 files /233 tests，91.31s。使用 base配置默认并发2，没有额外 maxWorkers 参数。
- `pnpm build`：node22目标成功，生成实际CLI/API及声明文件。
- 正常 `pnpm --filter rpgmaker-event-dsl test:windows-baseline`：5 files /26 tests通过，58.51s；包括本票8项实际构建入口矩阵。
- 18份新原始记录入库后，验收索引/schema、来源/夹具/执行记录及基础独立往返再次通过：1 file /3 tests，3.84s。

results保留8份最终源码记录、8份最终构建记录以及003/008的2份原failed记录。最终源码指纹统一为 `fdf2ec8f93335a04ad1328d96a0f9471f65345007f874d8352972e5ab1b28abd`；构建指纹统一为 `860b71ef5d796ab9b96e6e6184b1cfc561cd676d7241e9d009b03622fb1fa046`，后者包括实际dist字节。验收索引现有143项要求，其中本票新增8项。源码、测试、配置和requirements未在上述最终执行间改变。

全部本票机器记录为 `native: not-executed`；本票未分配独立编辑器或游戏场景，不替代最终 E1–E7 逆向比较或 R1–R7 实际游戏回归。
