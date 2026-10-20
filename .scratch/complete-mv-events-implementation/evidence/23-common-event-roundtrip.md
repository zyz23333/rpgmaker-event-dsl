# 23 — Common Event 完整往返

此前59d274e的READY被独立审查拒绝合并，原因是CommonEvents空数组补null及trigger -0重写为0。两处入口边界现已按公开Workspace red→green修复，修正候选重新完成全量检查、新构建、四组实际原生配对和完整built baseline；本票再次交付。旧候选、旧native、失败和审计保持原字节，不把它们升级成新候选证据。

## 产品与独立预期

实施分支 `codex/mv-ticket-23`，初始真实 dependency baseline 为已合入 22 的 `520a2e5d3a034299bedf8d1051b8559da2d3e648`。执行时产品为该基线上的实际 dirty 文件；标准结果逐文件记录实际源码与测试 SHA256，不将 dirty 基线冒称干净提交。

公共编写入口为 `commonEvent({id,name,trigger,switch?,commands})`；active trigger 在公开类型和运行时均要求有效 Switch。none 的显式 Switch 保留原生独立保存值；省略仅重建既有固定默认 1。显式引用正常遵守槽容量与名称范围。名称精确保留，空名与重复名均是实际条目；Common scope 的名称引用只接受唯一匹配，System 空槽规则没有扩大。

E117 正式入口为 `callCommonEvent({commonEvent: commonEventRef(...)})`。旧位置参数和内部 `ref` 字段均移除。输入形状与引用类别在投影前检查，直接导出定义和命令同样验证；引用失败包含调用者身份、E117 与命令字段路径。Compile 的 Common 范围仅取当前声明；Decompile 从完整 captured 原生候选构造范围，不借手写源码修复目标。

原生 Common 五个拥有字段 `id,name,trigger,switchId,list` 全部必需且精确验证；未知键和非 null 坏条目不能被丢弃。验证 ID 与数组位置、三种 trigger、合法 saved Switch 与完整命令列表后才发布完整候选。已复用 20–22 的隔离发布、保守 Push 与恢复行为，没有另加旁路。Entry Removal 保留数组长度及 null 孔。

`test/common-event-workspace.test.ts` 的独立预期为手写原生记录及正式 TypeScript 输入，经过实际 Discovery、类型检查与求值。覆盖三 trigger、none 非默认开关、空/空白/CRLF/重复名称、向后/自身/互相引用、旧 Snapshot 不回退、晚坏条目无部分发布、Script Gate、已知117与未知 raw、逐字段 Diff、真实 Push 编辑和破坏性删除、ID1001及无固定 Map 上下文。失败与 Check 比较 config、完整 Discovery、源码、Game 与 Workspace 业务字节。仅排除允许遗留的空 `decompile-candidates/` 父目录标记，任何子文件仍在比较中。

## 实际 red / green 与测试修订

原始 JSON/文本保持在仓库外 `C:/Users/Shuen/.codex/tmp/`；本目录 `23-history/` 复制保留实际 runner JSON 与原创核对工具，未重写失败。`mv23-named-call-red.json`、`mv23-saved-switch-red.json`、`mv23-native-owned-red.json`、`mv23-authored-container-red.json`、`mv23-call-shape-red.json` 分别真实复现旧 API、none 保存值丢失、原生默认修复/条目跳过、编写输入形状以及 E117 形状缺口。`mv23-switch-reference-red.json` 的三项是已有候选拒绝缺少字段定位，新增直接原生 Switch 诊断后转绿；`mv23-call-diagnostic-red.json` 同样记录 E117 精确路径缺口。

保留命名为 green 但实际失败的原始记录：原生缺字段诊断曾错误使用严格 JSON renderer；修复为 `describeValue` 后，业务状态比较又发现仅新增空隔离父目录。`mv23-native-owned-observation.txt` 保留具体差异，最后 `mv23-native-owned-green-final.json` 才真实通过。Diff 初测误写现有 identity 格式，下一轮误用未来的 Wait 对象 API；`mv23-diff-scope-initial.json`、`mv23-diff-scope-green.json` 均仍是失败。对应现有 `commonEventId N`、`wait(3)` 改正后重新通过。唯一空名调用的真实失败遵照 ADR0004 / spec I7 修复，重复空名继续报歧义。

已有 workflow 合成 Common fixture 补全五字段后，与编译默认完全相同，使旧预构造 Interrupted Push 的硬编码 affected 集合不再真实；恢复安全门准确拒绝三项（`mv23-focused-source-initial.json`）。以独立 Snapshot 名称 `Snapshot Common` 保留真实 Common 变更后，四个原恢复场景重新通过（`mv23-existing-recovery-fixture-recheck.json`）。恢复实现与安全断言未为此放宽。

已完成源级 Common 首批 87/87（`mv23-common-source-recorded.json`），补充公开类型、直接定义、未知调用上下文 8/8（`mv23-types-direct-context-initial.json`，其他87项是显式 skipped）。关联标准结果以 `MV-S5-COMMON-001`–`016` 追加，不修改原 210 个 requirement rows 或其旧结果。后续交付检查结果在本报告追加。

随后完整 Common 源级执行 `mv23-common-source-complete96.json` 为 96/96 通过，Node22.23.0、原始 deadline、默认2 workers。额外 accessor 案例通过公开 authoring 入口验证拒绝不会执行 getter；首次通过 Workspace 编写 getter 的两轮被已有源码安全语法门在求值前拒绝，均保留失败。改在公开 authoring 边界后，`mv23-accessor-public-red.json` 实际复现诊断读取 getter，own descriptor 修复后 `mv23-accessor-public-green.json` 及完整96项通过。标准记录默认输出 `test-results/mv-evidence`，已按原字节复制至 `evidence/results`，未根据最终状态改写历史执行。源级 typecheck / format:check 通过；清理本票三个已失效 import 后的最终 lint 与全检仍将随集成执行。既有22历史工具的 lint warning 保持原文件。

## E1 编辑器身份与代码事实

验收索引 `MV-S5-COMMON-E1`：本票分配的只读编辑器事实核对，独立于后续完整游戏配对。

按 `reverse-engineer-anything` 复用已留存的编辑器资源路径后重新核对实际 `RPGMV.exe`：19,595,264 bytes，SHA256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。本次 target-free REA PE 资源清单 Evidence 为 `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd`，保留在 `23-history/mv23-e1-rea-pe-resources.json`。旧版本 Evidence ID 在当前会话 summary 中无 retained 记录，只作为历史指针。新清单确认整个目标和版本 payload 范围；原创 verifier 从固定版本词读取 FileVersion 1.6.1.0，字符串含自报 1.6.1，不认证发行渠道。

`23-history/e1-identity-recheck-v3.json` 的 SHA256 为 `d3975b3c81f3c00a1bcdd87f2ac98ab4cd813efab5ac93002a8766e9df9033fa`。Windows / Node22.23.0 只读重新解码并核对全部 34 份选中资源的 stored/decoded 长度、哈希、完整 zlib 消费和已留存全文；再补 E117 与对象选择器。原始全文只在仓库外。v1 错把 E117 plaintext 作为 zlib 解码，v2 错把固定版本 1.6.1.0 当成字符串，二者均真实失败且工具字节保留；v3 按明文编码和 VS_FIXEDFILEINFO 分别处理后通过。这些是 verifier 修正，不是编辑器行为改变。

| 路径 | 实际代码事实及位置 | 产品比较 |
| --- | --- | --- |
| 工厂/增容/Clear | Q346222:18 Common 五字段默认；Q934867:124–130 绑定 Common 模板/数据库；Q963372:192–209,248–259 解析模板并恢复槽 ID | 独立显式默认 fixture 与 ID1001 场景；不将 UI 最大值作为产品上限 |
| 已有载入与直接编辑 | Q909009:71–89 JSON 载入；Q966730:42–56 Loader 直接取数据库条目；Q967367:24–43 独立绑定 name/trigger/switchId，none 只控制 enabled；:53–57 使用实际 list | 完整三 trigger、非默认 none Switch、空/重复/CRLF 名称往返 |
| 开关载入/选择 | Q596373:53–58 读取现有 switchId；:28–43 选择确认才写新 ID，没有 none→1 联动赋值 | none3、显式槽容量/未命名正 ID、失效引用拒绝 |
| OK/Apply 与保存 | 数据库 Q934867:178–186 标记/备份；Q909009:163–177 保存数据库，:357–383 按实际数组槽序列化完整条目并保留 null 孔 | 编辑生成源码后真实 Diff/Push，逐字段比较，删除保孔 |
| E117 重新确认 | Q710524:15–34 `commonEvents` 固定选择器，load/save 参数0；Q607446:12 的初始 ID1 是 UI 初始值 | 正式调用必需显式引用；没有隐式目标或位置参数别名 |

E117 Q710524 stored840 / decoded836 / plaintext，decoded SHA256 `6e3cfa0ad6ea408dc7a1cdbac1789aeee31eb7d38ad7faae4ed69c53cd2d166e`。对象选择器 Q607446 stored741 / decoded2580 / zlib，decoded SHA256 `8c2bc0bf8b611a96c4ab50889c74051e540af35d3ebd553c158081417d05c7bf`。其余逐资源身份见保留 JSON。

这是代码事实与有条件保存推导；没有启动编辑器、观察 Qt 信号/焦点/异步时序或进行 UI 捕获。页面禁用 ID 例外是独立已接受产品契约，未扩展到 Common none。以上 E1 比较不替代 R1/R4 实际运行或最终49。

## 预审边界与 undefined 修正

按规格 I1，完整 Common 定义收集验证移至 `validation/declarations.ts`；公开 `collectDslOwnedDeclarations` 保留同一接口，Workspace 的实文件及虚拟候选 loader 使用该边界。domain 只保留声明模型和类型判别，不再导入 validation 或拥有收集验证实现。直接 compiler 的 scope 构造同样在读取 Common 身份/名称前完成形状验证，getter-safe 身份诊断保持。

按规格 I2，可选保存字段的显式 undefined 等同省略，因此 none 的 `switch: undefined` 重建固定默认1，零 Switch 容量也无需将其误作显式引用；autorun/parallel 的必填 Switch 仍拒绝 undefined，正常显式引用没有增加容量/存在性例外。新增独立 Workspace 字面量经过真实源码 Check→Compile→Diff→Push 比较完整 Common 数据，active 两种 trigger 同时检查失败无业务状态改变。

`mv23-boundary-undefined-red.json` 是移除 domain 上层验证而尚未接入 validation 收集时的实际red：公开收集拒绝与 none undefined 两项失败，active undefined 两项已正确。`mv23-boundary-undefined-green.json` 四项通过。首轮完整 focused `mv23-boundary-undefined-focused.json` 142通过/3失败：三项旧 staged-graph 断言仍要求原非结构化 E117 消息整串，已改为同时要求 `MV-E117-REFERENCE`、精确 `commands[0].commonEvent` 和原始 Unknown/Ambiguous 细节。最终 `mv23-boundary-undefined-focused-final.json` 145/145通过，包括 Common100、公开DSL、真实定义loader、staged graph与证据索引。typecheck/lint/format通过，仅22原历史工具warning未变。此轮未执行full/build/native，票仍claimed。

## 首轮候选的实际集成与完整检查（已退回）

实际24集成 `8617d815750631d00a8b60b2410d9e5420da4e16`、实际25集成 `233db5420d6cf83da0220c6aa5aed56626798f39` 已合入；23合并提交为 `e199e958c9c1adc48c8ccbf21718a8a39789fa8a`，相对25的独立语义增量为唯一 Compile Contract `mv-1.6.1/8`。本次实际构建/四组原生执行来自干净候选 `b2c301d2dc19cc25a2265a6aa152f119d2367463`。继承完整 Map、Common、System、Troops 输出与既有安全约束。

首轮全量 `mv23-check-final-v1.txt` 实际624通过/1失败：原 command-boundary 测试在断言外构造坏 Common commands，新增公开 authoring 边界已先行拒绝。保留 null/undefined/稀疏/坏元素/多余 raw 字段的全部拒绝义务，改为同时检查公开异常的 MV-COMMON-EVENT、compile、commonEvent:1 与 commonEvent.commands；未知 kind 仍经 staged validation 检查。没有放宽产品规则。focused `mv23-command-boundary-final-v2.json` 13/13通过。

后续 `pnpm check` 36文件、625/625通过；`pnpm build` 通过并生成15个真实 dist 文件；`pnpm --filter rpgmaker-event-dsl test:windows-baseline` 13文件、348/348通过。Windows10.0.19045、工具Node22.23.0、pnpm10.33.0、Vitest4.1.9、TypeScript5.9.3；默认2 workers、原始deadline未改。仅既有22历史工具 no-unused-expressions warning 保持。完整原始日志按字节保存于23-history。Common100项在完整source和实际built轮分别通过，标准执行结果从真实默认输出 test-results/mv-evidence 原字节追加；不重写之前的成功或失败。

## R1/R4 完整产品与原生配对（首轮，已退回候选）

四组是本票分配的交付执行，均使用完整独立原生输入，没有 plumbing/narrow 模式。每组真实执行 built public init→Clone→Decompile→正式源码修改→Check→Compile→Diff→Push，再以两个 fresh NativeProfile 和唯一 appName 启动实际 MV1.6.1 / NW.js0.29.0 / Chromium65.0.3325.146 / embedded Node9.7.1。每侧15项验证均为true，严格 boolean semantic comparator 为true。操作者为 Codex Ticket23 native delivery operator。

| 验收项 | 独立预期与实际结果 | 原始外部run / pair-result SHA256 |
| --- | --- | --- |
| MV-S5-COMMON-R1-TRIGGERS | 每侧10项：五种Map触发、最高合格页选择、Common none经Map7/E117调用、autorun、parallel，完整语义序列相同。 | `C:\Users\Shuen\.codex\tmp\mv23-r1-map-common-delivery-v1-f37e5c81-73c8-43a3-94f7-f076cc2fc1cc` / `75e77d9940dbb6e613b47dfffe2055716d3893481809bd95a558335f3dee4db6` |
| MV-S5-COMMON-R1-PARALLEL | Common1/2共用switch21同帧启动；A精确等待60帧后关闭21，B的120帧后续从未执行；观察超过150帧，两个解释器已被原生refresh移除。none独立saved9保持。 | `C:\Users\Shuen\.codex\tmp\mv23-r1-shared-parallel-delivery-v1-ebd1f9b6-f612-412e-8590-8ef2df5fb794` / `84efa4c6529605793a4ffd34364b1c97f474708ca02af58bbfbca401f30c40f2` |
| MV-S5-COMMON-R1-AUTORUN | 共用switch21的两个autorun按最低ID1执行，随后关闭21；ID2未运行，none saved9也未启动，至少观察150帧。 | `C:\Users\Shuen\.codex\tmp\mv23-r1-low-autorun-delivery-v1-42804e8d-2483-42e5-962d-f62467d630b3` / `d2b8e7a1f4fe43a51ba812e0e750d45331741dc2adb9176455993a9af34fb386` |
| MV-S5-COMMON-R4-CONTEXT | Map7→117 Common1→301真实Battle→Troop turn0→117同一Common1→331胜利→返回Map。Map身份7/character7移至10,6并写selfA；Battle身份0/无character，零事件selfA未写；Common none saved9保持。 | `C:\Users\Shuen\.codex\tmp\mv23-r4-common-context-delivery-v1-0cc306f2-661c-444f-b58c-0e008da0ac0d` / `5589dbdca75cbc71335e392b25d75d5568f3a7704b3f406d8ad344850e32de3d` |

每组比较两侧所有15个完整磁盘JSON；实际loaded Map/Common/System（R4另含Troops）与独立预期完整相等，仅显式计算原生onLoad的meta派生字段。运行前后磁盘字节不变；host/modules/七个引擎脚本身份一致；实际PID/PPID/cwd/execPath/profile/appDataPath与启动参数一致；stdout/stderr均空且exit0。observer只做明示fixture启动/初态/正常Input与被动观察，没有替换解释器、命令、Scene、loader、RNG或wait。每组真实修改并Push Common拥有字段；触发组还修改Map拥有名称，R4同时删除Troop拥有指令列表内的无害seed注释，准确证明三载体安装，没有借外部Troop名称/成员制造变更。

完整pair-result含首方数据，保留在以上外部原始run。Git仅保存原创scenario/harness与安全摘要；摘要有原始路径/长度/哈希、完整carrier哈希、源/产物清单、过程身份和自创trace，没有复制首方数据库全文或loaded数据。冻结v5 helper SHA256 `68b74b84bc597402ca437f3d5a045a89044f35e7c3a46dca73ded77a3d39cdf8`，新delivery adapter仅注释和purpose metadata变更，SHA256 `c616e8a8c2320766468ca3167249214af66ea6d996eed6bb745f8ab346cfc4f5`。所有preparation结果和旧工具仍保持原字节；此四组没有替代最终52–54或宣称完整R1/R4全部场景。

## 首轮 E1 产品比较与产物身份

MV-S5-COMMON-E1追加当前交付结果：2026-10-19T16:12:50Z再次只读验证同一编辑器、34个资源及E117/picker，fresh identity JSON SHA256 `c6dd39475a45148ebfaf0b0c31b85a5cb8c64478bb2a5d41526cd3bd916fe87a`。保留原E1 fixture与此前执行不动，当前结果链接Common16组的100个source和100个built实际标准记录，对照上述工厂/独立开关/加载/编辑/序列化/E117事实。资源全文继续只在外部；没有新增UI、Qt信号时序或人工听觉/图像观察声明。

四组实际执行的97个source与15个dist文件集合及逐文件SHA256均相同：source fingerprint `264f833572b7a2cd18e2a569dbecf92a6fe99df286153e18f80b923af101a976`，dist fingerprint `bd13c477b656d56b836e3e5d0cffbfb5e642086b22d89d000c123b9683409764`，Workspace API wrapper SHA256 `81ccd8c7cdfd3fe27af50ec77e86faeb08d53eeb527ccf971d917d5921f2c11d`。清单包含CLI/API/authoring/operations/chunks/types/maps，并非仅wrapper。当前工作树完整source/dist membership和字节对全部四组实际捕获作最终审计。

合并25及首次23构建前，已将原fd3b6a2干净checkpoint的95个source文件复制至 `C:/Users/Shuen/.codex/tmp/mv23-pre25-build-archive-69f738cf-d009-4200-ad34-ece3249e37c8` 并逐文件核对原Git blob，fingerprint `c6d44ff2c57c8b7b652604d34fa116ebb450877a8826d062443fe6bac66c4efe`。当时23本地dist尚不存在，provenance明确记录；未把任何历史dirty/source执行伪称为未来build。

## 证据追加与复现

`23-history/mv23-final-immutable-build-audit-v1.json` 给出完整审计：原210行不变；e199e95是23合入25后的自身checkpoint，268行含23先前17行，该checkpoint已捕获的全部旧证据（除当前汇总报告/README/index）按原始Git blob逐字节保持；本票仅追加4个native requirements和新的真实执行，既有E1 fixture不改。首次交付保存所有历史red、误前提失败和更正后的green，未把失败结果标成成功。

复现先使用上述Node22.23.0置于PATH，运行pnpm check、pnpm build及完整built baseline。再执行23-history中四个delivery scenario，显式传入 `--repo=<references所在根> --packageRoot=<本候选实际新构建package> --seedRoot=<MV1.6.1 NewData> --host=<NW.js game.exe> --outputRoot=<新的外部父目录>`，每次创建新UUID目录，保留fresh profile。不得覆盖旧run或直接复制generated到Game来替代Push。公开README、package README、示例和Event Authoring Skill的当前Common/E117 API已同步，无旧位置参数别名。

首轮候选验收索引为272行，Common本票21行；Common标准结果将在本次E1追加后达到805份，旧结果保留其原状态。实际执行构建另完整保存在 `C:/Users/Shuen/.codex/tmp/mv23-executed-build-preserved-031c8c33-43e8-4295-99b4-c2afadf4056f`，97个source与15个dist均与四组原生捕获逐文件相同，provenance见23-history/mv23-executed-build-preservation-v1.json。

## 独立审查退回后的边界修复

MV-S5-COMMON-CARRIER-BOUNDARY 与 MV-S5-COMMON-TRIGGER-BOUNDARY 使用新的独立字面量测试文件，不修改之前272个requirement对象或原有fixture。原READY提交59d274e和四组native记录保持不变；此前97源码/15产物外部freeze已逐文件核验。三份merger原始结果和reproducer按原字节追加保存，普通[null]控制仍应no-op。修复和全量重新交付尚待完成。

诊断已在source公开Workspace形成red3/1control、green7/7（含索引3项）：readCommonEvents在遍历前校验必有null槽0，trigger -0按Object.is局部拒绝，describeValue准确保留actual -0；没有改变通用JSON的负零表达。每个拒绝重复两次，对源码/完整Game/Workspace/Snapshot/manifest/config/Discovery比较不变。新的普通[null]经Decompile→Check→Compile→Diff→Push字节no-op。实际主integration233db54具有251个requirement；e199e95是23自行合入25后的checkpoint，其268包含23先前17行，不能称为主integration既有268。旧audit原字节保留，后续审计分别比较这两个basis和本票59d274e的272行。

## 复审修复候选的最终交付

正确区分三个basis：实际主integration `233db5420d6cf83da0220c6aa5aed56626798f39` 有251个requirement；`e199e95` 是23自己合入25后的268行checkpoint，包含本票先前17行；被退回的 `59d274e` 有272行，包含本票21行。本轮只追加2个独立回归requirement，当前274=实际主integration251+本票23；旧272行对象及全部旧fixture/结果/native工具保持。最终audit v2分别核对实际主integration251和其历史blob、自身268及被退回272 basis，没有把本票记录算作主集成。

修复提交 `59de6e9745ce1508299ff5acbbf80c59fbf2c9b3` 局部修改readCommonEvents：遍历前要求存在null槽0，避免空数组绕过；categorical trigger明确Object.is拒绝-0，原describeValue保留actual `-0`。无通用JSON -0禁令、无归一化、无扩大类别或绕过隔离发布。新增独立测试不修改原Common100 fixture；red实际3失败/1普通[null]控制通过，green7/7（含索引3），后续全量629/629。两处真实静默重写和另一个槽0诊断案例分别通过同一公开Workspace重试2次；失败前后完整源码/配置/Discovery/Game/Workspace/Snapshot/manifest业务字节不变。[null]正常经实际Decompile→Check→Compile→Diff→Push且字节no-op。merger原始脚本和三个result按原字节保存于23-history，原路径保留外部。

当前候选 `59de6e9745ce1508299ff5acbbf80c59fbf2c9b3` 在新构建及四次实际配对捕获时gitStatus均为空。`pnpm check` 37文件629/629通过；fresh `pnpm build` 15文件通过；完整built Windows baseline 14文件352/352通过。Windows/Node22.23.0/pnpm10.33.0/Vitest4.1.9/TypeScript5.9.3、默认2 workers及原deadline保持。原始日志为mv23-review-*-final-v1.txt。历史原创工具的两项unused-vars和22历史unused-expression warning保留，lint退出0。

| 当前实际配对 | 完整原始外部run | pair-result SHA256 |
| --- | --- | --- |
| MV-S5-COMMON-R1-TRIGGERS | `C:\Users\Shuen\.codex\tmp\mv23-r1-map-common-delivery-v1-7ee2af75-51bf-43e0-a704-b35551bc6568` | `457b50df045eb21ccf072c347d9d2360e019116c66d04204d647bd2a6e9f78fa` |
| MV-S5-COMMON-R1-PARALLEL | `C:\Users\Shuen\.codex\tmp\mv23-r1-shared-parallel-delivery-v1-a7f6f5fb-27b9-40a5-90b5-e3b4bca915fb` | `39738c1d27141020e719f1c497563e42696c4446a51bdfe8e424aae03fad4986` |
| MV-S5-COMMON-R1-AUTORUN | `C:\Users\Shuen\.codex\tmp\mv23-r1-low-autorun-delivery-v1-97afb370-cf1d-4515-8a57-2f7806c29f3d` | `08336cbb54d036cd3ac82f19dbf3b268bc0b54b936ef02517ea813b131863e23` |
| MV-S5-COMMON-R4-CONTEXT | `C:\Users\Shuen\.codex\tmp\mv23-r4-common-context-delivery-v1-a3da72cd-5408-4880-8367-81669331aa6b` | `9f6d07a68c3605f21b0112abfc6f4af89b36f11da8c53ddd2fce03751b30417f` |

四组重新使用原始独立完整fixture与原delivery-v1工具，不重用旧游戏结果：Map/Common触发各10项；shared Parallel同帧启动、A等待60帧关21、B后续从不执行并观察150帧；最低ID Autorun；相同Common从Map7及真实Troop Battle调用，身份7/0、character7/null、地图selfA true而零事件selfA false，正常胜利返回Map。全部15完整disk carrier、实际完整loaded carrier、真实owned source编辑和Push安装、fresh profile/独立进程/PID/PPID/cwd/host/modules/七engine、空stdout/stderr/exit0和严格boolean语义比较均通过。R4还证明实际Troop owned注释移除安装；不使用外部name/members伪造变更。安全摘要追加新UUID，含首方DB的原报告和游戏沙箱只在外部。

当前source97文件fingerprint `71b81c61c14e6850bcde4fb6d63a64eb2bdac445df4e0fb9c18867f01b07b3f5`；dist15文件fingerprint `38b15fcf80d82448beaea685cd38ed7c6f5f08d45af65333631232ade1f124df`；API wrapper `9ea67671b14ec09e935fc9df5aacb852ccbdb37361fc3c06b99b1d0c4d0240c5`。最终审计比较完整成员集合和每个文件字节，涵盖CLI/API/operations/chunks/types/maps。此前b2c301d的97/15 freeze在修前核验，本轮实际构建另写新外部不可变archive，不覆盖旧archive或旧provenance。

E1再次只读核验同一编辑器34份资源及E117/picker，fresh identity JSON SHA256 `1bc3e3608413face7cbf528cb2c9d1e44b98059137be18de7b958415ff7a1b7c`；开始时间2026-10-19T16:44:12.699Z，原E1 fixture仍原字节。新E1执行链接当前100个source和100个built Common16组执行，并额外链接2个新边界requirement的4个source和4个built标准执行。它仍是编辑器代码事实/有条件推导与实际产品比较，无UI/Qt时序/人工听觉或图像观察宣称。此轮仅重新关闭23，最终49–55仍另行。

当前Common标准结果在本次E1追加后共1026份，保留旧失败原状态。修正候选完整source97/dist15 freeze位于 `C:/Users/Shuen/.codex/tmp/mv23-review-executed-build-preserved-471f85cc-617a-4ab6-9260-2749e36fe234`，provenance见23-history/mv23-review-executed-build-preservation-v2.json；旧freeze不变。审计见23-history/mv23-review-final-immutable-build-audit-v2.json。

审查者原始built公开reproducer在当前新dist重新运行三种模式：[]与trigger -0均得到精确MV-COMMON-EVENT且businessStateUnchanged=true，[null]保留deepEqual=true。三个新原始结果分别为：

- empty: `C:\Users\Shuen\.codex\tmp\mv23-merger-common-empty-1f40debb-adfe-40b2-ac04-e9ef9ff19d9f\result.json`，SHA256 `2ea021b47f984f51994d28ef265392d3f94becc8264bd1c8c90d6b45786fe82c`；原字节副本23-history/mv23-review-merger-recheck-empty-original-result.json
- null-only: `C:\Users\Shuen\.codex\tmp\mv23-merger-common-null-only-4f0f0027-c9c2-4c43-a5ee-268b84fea96f\result.json`，SHA256 `23480dd87fc42bf6066ee22dd720c4ee53dc4464f66b1b81b7c02ea2e0019967`；原字节副本23-history/mv23-review-merger-recheck-null-only-original-result.json
- negative-zero-trigger: `C:\Users\Shuen\.codex\tmp\mv23-merger-common-negative-zero-trigger-f4811bbc-0bd8-4650-b9b9-78dba7d9b053\result.json`，SHA256 `fe4f9ed5793b3c3b683f8715ca272fa20126eb1f70f55b3e5792f72cd28a4256`；原字节副本23-history/mv23-review-merger-recheck-negative-zero-trigger-original-result.json

## Final53 current R4 context receipt

The [final53 execution report](53-final-game-runtime-selectors-and-locations.md#final-requirement-receipts-and-aggregation)
records a fresh passing `MV-S5-COMMON-R4-CONTEXT` result on final candidate
`2dc639015f908de6fd524e50236e5422b5f8e990`, contract `mv-1.6.1/22`.
The complete original Common control, the unavailable-selector/context supplement
and empty/multiline Script Map/Battle supplement each passed both actual games
after the real public built Workspace Check/Compile/Diff/Push lifecycle.
The exact receipt, result hashes and retained failures are linked there. This
current R4 closure supplements the historical23 executions; final52 owns R1.
