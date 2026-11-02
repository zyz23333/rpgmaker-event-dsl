# 15：Push 写后记账与完整输入保护验收

本票独立计划是 **12 个 primary 规范 ID**，source／built 各 12 条；另有 W19 push-success 各一条 supporting 回执。完整输入、独立预期、真实进程、状态、断言源码哈希及构建关联在[机器合册](15-postwrite-acceptance.json)，原始失败与成功记录在 [15-raw](15-raw/)。source／built 是执行轴，没有扩成新的 AV 标识。

依据为[规格](../../asset-validation/asset-validation-spec.md)、[矩阵](../../asset-validation/acceptance-matrix.md)、[有限索引](../../asset-validation/implementation-acceptance-cases.md)、[15 票](../issues/15-push-postwrite-consistency.md)及 ADR0019。工作树在 M 盘，领取前已快进并确认包含 integration `88fc6f95ead560784fd0128e951058f7f8eab008`，14 已 resolved。Compile Contract Version 升至 **`mv-1.6.1/39`**。最终产品及断言冻结于 `5dbf1c41447ffe52fca954e9bed0305f0e33add8`。

## 产品及真实边界

普通 Push 完成全部 Project Root 替换后、正常同步记账前，再检查 Workspace 配置及真实根绑定、Generated Project Data 完整性和完整 Compile Freshness。保留原有完整标准 data 末端漂移检查及逐文件旧字节捕获／非覆盖安装保护。写后输入冲突保留已经安装的 G0、驱动变更和原 pending／backup，不把新 source、依赖、政策或生成字节半途采用为本次记账依据。素材门槛已执行的失败不会被写成 `asset check not run`。

历史内容证明恢复的产品代码未改。新的输入复核只在普通 Push；旧 pending 仍按照原目标和冻结内容证据处理，不要求当前 source 或配置重新授权历史已完成写入，也没有恢复素材扫描。

图 fixture 独立手写当前 Common／Map／Troop 根、共享／循环调用及选定 Skill→Animation 关系，并通过既有字面集合预期核对。literal affected 集合是 `CommonEvents.json`、`Map001.json`、`Troops.json`。普通写后用例在最后 Troops 的真实 `link` 完成时暂停；每次先核对全部三个 live 文件已是原 G0、其余完整 Project Root 字节保留，Snapshot 和 Manifest 仍是 S0／M0，原 pending 与三个 Snapshot backup 已存在。

独立绑定用例在最后 Troops 原对象的真实清理完成后暂停，随后保持 config 字节不变，将真实 junction 从合法根 A 切到不同合法根 B。该位置避免最后一项安装自身清理先在新根报 ENOENT。A 的已完成写入、B 的完整树和原 state 分别核对；A、B 及配置 alias 下的素材 OS 路径均被观察。切换后原 A 中可能不可访问的 staging 目录按实际状态记录，不虚构整体回滚或媒体故障 pending。

测试子进程允许写前正常元数据查询，对媒体内容读取实际拒绝，并记录完整 IPC。每个写后回调断言 checkpoint 前确有素材查询、其后到进程结束零素材查询和零内容读取尝试；没有锁定写前 syscall 次数。配置及根绑定的合法 realpath、data／Snapshot 读取不当作媒体扫描。所有控制都在测试自有 OS 适配层，公共 API 和 CLI 无新增测试参数。

## 有限责任

| 族 | primary 数 | 实际结果 |
| --- | ---: | --- |
| W06 | 3 | API／真实 CLI 写完全部 data 后删除间接 GraphSound；API 同位置将文件改为目录。当前 Push 成功更新允许的 data／Snapshot／Manifest 并清 pending；不重新 Compile 的下一条真实无差异 Push 查询当前素材并失败，完整状态不变且无新 pending。 |
| W13 | 8 | source API／真实 CLI，以及 validation-dependency、config、exception、snapshot、generated、binding API 七类写后输入变更。拒绝正常完成，已安装 G0 与显式驱动字节保留，原记账和 pending／backup 不改，媒体只读且无后续扫描。 |
| W19 | 1 | 原唯一 push-failure callback 保留14的写前间接素材失败场景，再增加全部写入后改未受影响 Actors 的真实完整标准 data 漂移，核对 G0、外部 Actors 新字节、S0／M0、pending／backup 和媒体原样保留。 |

W19 push-success 是一条 supporting callback：保留14原图成功断言，再证明全部安装而尚未记账的真实边界和无后续扫描。failure／success 两个原唯一 callback 的 owner 均是 `14,15`；同数组注册的 **C13 仍为 owner14**。14 的历史机器合册与回执原封保留，没有改写为15通过证据。W11 没有新增 postwrite 门槛或同义 ID。

验证依赖用例先证明 `types/push-input.ts` 确实在 Compile 捕获的 readFile 输入内，再仅改变其合法注释字节；config 和准确 exception／reason 分别保持合法。Snapshot 与 generated 分支改变本地对应字节，已写 live 仍以变更前 G0 为预期。成功状态独立规定只允许 affected Snapshot 项改成原 G0 hash，并保留原 source、type-input、config／policy、Contract 及 binding；用测试自有持久 JSON 格式核对精确 baseline hash，没有调用产品 finalizer 或 baseline builder 计算 expected。

## 原始失败及修正

首个 genuine red 在三份 live 已安装、S0／M0 未更新时改变 source；原产品仍 exit0，使预期失败。原回执、进程、完整输入和预期保留。原始断言文件由记录的插入补丁及未变 Git 基底重建，只有与实际 red 回执所记 SHA-256 字节完全相等后才归档；原 transformed callback 也在回执内。它属于当时未提交 TDD 阶段，没有假称运行于最终冻结源码。

第一次独立 binding 用例在最后 link 后切 alias，先触发剩余暂存清理 ENOENT；该准备边界失败保留，未计成 binding guard 通过。改用最终原对象清理边界后，原观察器只匹配 alias、漏记 checker 的 canonical A 媒体查询，断言失败也完整保留；随后明确同时观察 A／B／alias，独立绑定场景通过。

首次冻结 `0d5152cf` 的完整 source runner 为 **31／45，通过31、失败14、零过滤**。14 个失败全部在新增精确 baseline hash 的测试预期：重建 Snapshot 项时交换了 hash／relativePath 的键顺序。持久格式把该顺序计入 hash。修正测试保留原项顺序，并独立从原 G0 字节计算 hash；产品未为此改变。原41条 canonical 回执及整 runner 保留。窄验证后以 `0212a757` 完成 source／built **各45／45，零过滤**和 build。

旧 source 五 suite 首轮是 **85／86**。唯一失败是 `RECOVERY-010 (push-after-install)` 的诊断 regex：普通 Push 新 guard 更早拒绝生成字节变更，输出 `Generated Project Data integrity`，旧断言期待恢复层 `generated data integrity`。仅更新这个 normal 分支，两个历史消费边界保留原 regex，全部状态／Manifest／pending 断言保留。原失败补验 **1 通过、43 过滤不计通过**，与原85项构成 **86 个唯一成功**。首次85／86报告、断言源、原记录和补验均保留，没有写成一次86／86。

最终 `5dbf1c41` 比 canonical 执行时的 `0212a757` 仅多上述旧诊断断言。产品、canonical 断言和测试适配层 Git diff 为空，故没有重复已验证45项，也没有声称它们曾在不同 HEAD 重新执行。

## 执行及交付

完整 Push suite 的 source／built 均为 **45／45，零过滤**，各有41个唯一 canonical callback 和4项普通补充检查。本票24条 primary 及2条 supporting 回执全部通过；C13 两入口另核验仍为 owner14。旧五 suite 的 source 为上述 **85＋1＝86 个唯一成功**，built 是一次 **86／86、零过滤**。后者包含最终诊断断言，原恢复消费边界、完整标准 data 漂移、逐文件捕获／非覆盖保护、绑定、锁及编译输入测试均保留。

build、typecheck、lint、format:check 及 Git 空白检查全部通过。最终实现与断言19个 Git 输入、15个 built 工件、26条本票回执、108份原始资料均作 SHA-256／字节核对；raw 使用明确 Git 属性保留原 CRLF／LF，不经过文本归一化。机器合册还核对 source 两次旧回归的失败集合与补验通过集合恰好一致，未把43个过滤项计入成功。正常45项后没有因纯旧诊断文字修正而重复执行已通过矩阵。

所有执行均为真实 Windows／Node22，测试项目使用默认 C TEMP；M 盘限制用于 worktrees。广测使用 maxWorkers1，source→build→built→source旧回归→窄补→built旧回归→静态依次进行，没有重复14不受本次改动影响的 file／diagnostic 矩阵。15 不提前签收16历史恢复新验收或17全仓／原生最终验收；本票状态与 OS／API／CLI 义务不需要 editor／game 执行，不将原生未执行记成通过。
