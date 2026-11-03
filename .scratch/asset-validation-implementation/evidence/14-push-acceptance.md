# 14：Push 生成事件素材预检验收

本票独立计划为 **30 个 primary 规范 ID：29 W＋1 C13**。源码及构建入口各 **30／30**，共 60 条规范回执；新 suite 每入口另有四项补充检查，因此 runner 是 **34／34**，没有过滤项。W12 支持项沿用13的原唯一回调与 owner，各另选执行一项；每入口 64 个过滤项没有计通过。完整输入、手写预期、实际进程、状态、断言及源码哈希在[机器合册](14-push-acceptance.json)，原始报告在 [14-run-history](14-run-history/)。

依据为[规格](../../asset-validation/asset-validation-spec.md)、[矩阵](../../asset-validation/acceptance-matrix.md)、[有限索引](../../asset-validation/implementation-acceptance-cases.md)、[14 票](../issues/14-push-generated-asset-preflight.md)及 ADR0019。本票在干净工作树快进到 `81a4284ad674bd4e5f7e607ffd8d7e461bfd2161` 并确认13 resolved 后领取；冻结实现与断言提交为 `7e6970f6`。Compile Contract Version 升至 **`mv-1.6.1/38`**，明确旧 `/23` baseline 不会由 Check 刷新。

## 产品行为

Push 先验证 Snapshot、生成完整性、Freshness 和完整标准 data 漂移，再从当前 Generated Project Data 重建事件根及定义内使用。素材关系的外部标准字段来自同一份按 Manifest 哈希核对的完整 Snapshot 捕获，包含未列入 generated 文件集的 Skills、Animations 等数据。当前例外政策随 Workspace Config 传入。Snapshot 中已移除的 Common／Map 根和旧 Troop Page 不回流，DSL 不重新求值，历史素材成功不授权新命令。

有数据差异时先暂存，只在唯一素材门槛成功后建立 pending 并开始替换。单纯素材失败清理 staging，不建立新 pending、备份或替换。无差异 Push 同样检查当前素材。门槛后仍要在首次替换或无写入完成前重新核对 source、验证依赖、config／exceptions、Snapshot、generated 与绑定；本票真实 red 促成了这几项缺失保护的修复。早期依据失败明确输出正确 Push 命令的 `asset check not run`；实际素材失败不会被伪装为已经发生 Project Root replacement 的中断。

CLI 阶段说明直接放在 checker 的命令上下文中，门槛错误清理后原样抛出。初版新增 outer Error 与 cause 同时包含整份报告，Node stderr 因而重复展示素材成员和调用上下文；完整 stderr 的六成员断言复现后修复。最终测试使用完整原始 stderr，要求六个成员和八条直接调用边，且各手写调用位置与目标出现一次，没有截取首报告隐藏重复。原有 I/O cause 通道保持原样。

## 有限责任

| 族 | primary ID 数 | 实际边界与结果 |
| --- | ---: | --- |
| W05 | 3 | API／真实 CLI 暂存后删图，失败无 pending／替换且 staging 清理；查询前修复可正常 Push。 |
| W07 | 3 | 无差异 API／CLI 仍拒绝当前缺图；完整标准 data 漂移在素材查询前拒绝，明确 not-run、零素材查询。 |
| W08 | 2 | API／CLI Compile→删图→Diff→Push 拒绝→补图→不 Compile 重试成功；删媒体不使 baseline 自动 stale。 |
| W11 | 7 | presence、case-match、path-type、path-link、queryability、failure-location、improvement 在唯一查询前真实变更；按当前事实判断，改善及 warning 可成功。 |
| W13 | 8 | source／validation-dependency／config／exception／snapshot／generated／binding 七项 API prewrite，source 另有真实 CLI；均在已建 pending 后、首次替换前变更，输入保留，正常记账与写入停止。 |
| W19 | 2 | Push 成功及写前间接素材失败，完整项目及状态树证明媒体不进 Snapshot、备份、复制或写入。共享 failure 回调只在本票签收写前分支，15仍需扩展写后失败。 |
| W20 | 4 | API／CLI 当前生成根与有限共享／循环关系；source／built 真实求值观察器；新命令不信历史报告并实际查询。 |
| C13 | 1 | Push 成功仅更新已 owned data 和正常元数据；保留外部必要字段、名称、自定义字段和全部媒体。 |

每入口有 **5 个实际 CLI primary ID**。source／built 是同一规范 ID 的执行轴，没有扩成新 AV 标识。W12 是 **reference-only**：保留13原注册与 owner，选跑原回调，并以本票 W08 和 W20 的真实 Push 当前查询作为交叉证据，没有另造同义回调。四项普通补充检查分别覆盖早期 freshness、integrity、invalid-exception 的 not-run，以及 no-write 门槛后 source 保护，不登记新的 canonical ID。

## 生成图及求值观察

图 fixture 独立手写五个当前根、三个定义内图片使用、六条直接117边、两条 Skill Common Event effect 边及三个 Skill→Animation 素材使用。Map／Common／Troop 都在实际 Push 的生成根内；Common11／12 互相调用且被共享引用，八条有限直接边不展开调用路径。Snapshot-only Common9、Map event9 和旧 Troop Page 的 `ObsoletePoster` 文件故意不存在，仍须排除。未选 Skill 的坏动画不进入范围。三个间接素材来自完整 captured Skills／Animations；完整 Event Asset Use、原始位置、条件、依赖链、直接边和无问题／stop 对照手写预期，collector 只计算实际值，不用于生成预期。

Compile 成功后删去六个真实媒体文件，API／CLI Push 各报告六组、六文件、六个定义位置及八条直接边，并保留全部持久字节；补齐后用现有 `allowDestructive` 能力完成正常 Push。测试适配层只传递既有选项，没有产品测试 flag 或 bypass。成功断言完整比较 Manifest 形状，只允许受影响 Snapshot 项哈希及 baseline 对应项／hash变化，并经公开 Freshness 检查证明正常权威；地图非 events 字段及敌群非 pages 字段逐字值保留。

求值观察器是测试自有 child 的 Node Inspector Debugger 非暂停条件断点。它先预热公开 Compile，再读取实际 V8 运行文本，唯一定位 `evaluateModule` 首个必经可执行语句，验证断点解析位置，并保存 URL、scriptId、文本／磁盘哈希、函数及首语句范围和 breakpointId。正式普通 Compile 正控制、正常 Push、同一份 source 的 Check 后置正控制，两个入口实际均为 **1／0／1，paused=[]**。source 绑定当前 `definitions.ts`；built 动态找到当次 `operations-Cz2qzFp2.mjs`，没有硬编码 chunk 名。

计数由同一个已初始化且在前后公开 Compile 路径命中的整数观察器提供，Push 的零是明确数值，不能以 coverage 未返回函数替代。没有给 `.events.ts` 写任意副作用，没有产品源码／AST／导出补丁，没有把合法 source 字节读取当求值。观察范围是当次哈希绑定的实际解释器入口；未来重构或未能唯一定位必须令测试失败并重定位，不声称这是任意未来 JavaScript 求值的通用探测。

## 状态与历史

每个相关回调观察完整 Project Root 与整个 `.rpgmaker-event-dsl` 树，并记录 config、source 树、自写 `types/push-input.ts`、fixture package、公有类型入口及 Workspace package 字节。只排除活跃 kernel lease 的 `operation.lock`；绑定变更的另一个根单独完整比较。媒体内容读取在真实测试子进程的 OS 边界被拒绝。大小写两次真实改名、目录替代及 junction 使用真实 Windows 文件系统；queryability 的 EACCES 明确是测试子进程 OS 适配层注入，不冒称真实 ACL。

首次 fixture 准备误删既有 owned entries，先触发 Destructive Changes，这是准备失败，不计为产品 red。真正产品 red 包括原 Push 接受已删媒体、pending 后 source／config／generated 变化仍写入、no-diff 异步门槛后缺少输入保护、早期漂移缺少 not-run，以及新增 Error cause 重复 CLI 报告。原日志及失败临时项目的真实 source／data／config／state／process records 均保留，不把失败覆盖成成功。历史代码处于以81a为基底的逐片未提交阶段，未假称每个 red 都绑定最终冻结源码。

冻结的首次 source／built 34／34 runner 有约五秒尾部重叠，真实起止保留；独立 sandbox 中两组均为有效通过。当时已派发的同 shell 顺序队列继续完成两入口34／34和支持项，并在源码旧回归的环境准备失败后按既定规则停止。没有人工中断或改写先前时间线；随后窄修复及构建旧回归由第二脚本顺序执行。支持项及旧广回归均为串行、`--maxWorkers=1`。

13 个受影响旧 suite 共476项。源码首次 **474通过／2失败**，失败均为F03真实大小写共存目录的 `fsutil setCaseSensitiveInfo` 在M盘准备阶段收到 Access denied，未进入产品检查；M与默认C TEMP的窄能力记录保留。工作树继续留在M盘，只将两项测试输入移至支持此能力的默认C TEMP，原回调 **2／2通过、169过滤不计通过**。因此源码最终是两次执行组成的 **476个唯一成功**，没有把首次报告改成单次476／476，也没有重跑其余474项。构建入口的同13 suite 在默认C TEMP执行，实际 **476／476**，无过滤或失败。这里不转移原规范所有权。

typecheck、lint、format、build、Git 空白检查及证据链接／哈希核对记录一并保留。原始 PowerShell CRLF 字节以 base64 和原 SHA 归档；Git 中 history text 使用 LF，并按实际 Git blob 校验哈希。15 的写后正常记账、16 的恢复授权、17 的全仓与原生最终验收不在本票提前签收。
