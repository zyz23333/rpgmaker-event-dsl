# 26 — Timer 完整保存槽位实施记录

## 当前开发边界

本记录对应独立分支 `codex/mv-ticket-26`，起点为实际集成 `205334338d8e64e3d00e485849c9ddf67bd7e3b1`。05/23 已 resolved，已有 274 个 requirements。此处为 DEV / focused checkpoint，26 保持 claimed；未运行全量 check、build、built Windows baseline，未增加最终 Compile Contract 版本，未标记 READY。最终化等待33、36及协调队列，随后合并实际最新集成并重新验证受影响部分。

实现遵循已接受的 E124、12 Answer 与 ADR0015。编辑器验收采用用户已批准的 REA；本票分配 E4，没有独立游戏组。最终 E4 产品比较与52–54游戏回归分别负责；此处 source 聚焦通过不表示这些验收完成。

## 产品行为

- Start 必填 seconds，精确生成 `[0,seconds]`。Stop 省略或显式 undefined 生成 `[1]`，显式0/83分别生成 `[1,0]`、`[1,83]`。
- 有值 seconds 为整数0..5999，保留数字负零。反编译使用已有精确字面量渲染，Stop存在的0不省略。原生 action 为分类编码0/1，负零拒绝。
- helper在选择字段前验证有限自有数据外壳，拒绝未知字段、访问器和非普通对象；编译器再次检查直接导出的正式对象。原生与已知 raw 共用命令族槽数、action及seconds规则。
- raw错误从原生位置映射到DSL时保留参数后缀，例如 `commands[0].parameters[1]`，不丢到整条命令。未放宽共享数值校验器，也未修改其他指令族值域。

## 公共边界与独立预期

[聚焦测试](../../../packages/rpgmaker-event-dsl/test/timer-workspace.test.ts)使用独立 [Timer保存数组](../../../packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/timer-saved-slots.json)，并复用已存在的原创完整Map/Troop默认夹具。预期不来自待测编译器。真实Workspace包含全部14个标准数据库文件和Map001，共15个carrier。

测试实际执行Clone、Decompile、Discovery、发布源码求值、Check、Compile、Diff与Push；通过修改Common/Map名称和Troop拥有的Comment验证写回已发生。完整比较15个carrier，保留外部carrier数据；Check和失败路径比较配置、源码、Discovery、Project Root、Snapshot、generated、manifest完整业务状态。空的候选隔离父目录没有业务内容；其中任何子文件继续进入比较。

13条新增自动化requirements分别为：

- `MV-S6-TIMER-001`：正式Stop省略/undefined/0/83与Start边界。
- `MV-S6-TIMER-002`：独立原生数据在三容器及完整15个carrier往返和安装。
- `MV-S6-TIMER-003`：seconds负零在实际生成源码、正式Start、已知raw Stop及三容器完整安装中保真。
- `MV-S6-TIMER-004`：helper与直接正式对象的域外seconds错误及不变状态。
- `MV-S6-TIMER-005`：三容器原生seconds在发布前给出精确阶段、身份和参数路径。
- `MV-S6-TIMER-006`：公共helper的未类型化类型、范围、外壳及访问器拒绝。
- `MV-S6-TIMER-007`：原生与实际loader已知raw的槽数、类型、范围、action一致拒绝及参数路径。
- `MV-S6-TIMER-008`：命令编译拒绝undefined、稀疏洞与非有限参数，保留原输入描述符。
- `MV-S6-TIMER-009`：结构类型局部const的额外字段在helper前校验，不被先行删除。
- `MV-S6-TIMER-010`：实际loader局部未类型化值的缺字段、类型和数值校验。
- `MV-S6-TIMER-011`：实际loader的undefined已知raw槽在Check/Compile前拒绝。
- `MV-S6-TIMER-012`：合法已知raw的三容器完整往返与Push。
- `MV-S6-TIMER-013`：公共类型要求Start秒数及合法action/seconds类型。

## Red → green 与历史维护

每次原始输出保存在 [26-history](26-history/README.md)，包括失败；首方编辑器、runtime、引擎源码、数据、资产与截图未纳入Git。

1. Stop公开类型不接受seconds，实际loader失败；补类型/helper及编译映射后通过。
2. 原生Stop `[1,0]`不能正式反编译，Map精确位置报不支持；补显式保存槽后，三容器完整15个carrier通过。
3. 原生seconds `-0`被插值输出成0；改精确literal后完整源码与Push保真。
4. helper与直接正式对象的6000在Check被接受；补有限正式校验后一致拒绝。
5. 原生6000仅在后续源码求值失败，缺少原生阶段/身份/路径；补族原生校验后发布前精确拒绝。
6. raw参数错误仅剩`commands[0]`；保留原生参数后缀后精确定位。

真实测试前提错误也保留：初次未安装依赖；原测试漏声明已有System Switch导致预期/Destructive门槛错误；Diff完整/short文案混淆；期待数据共享数组引用导致误向Common/Map添加Troop Comment；误把raw helper当作参数校验终点。它们分别修正测试前提，不记为产品反例。

相关回归曾捕获新校验器间接引用导致的模块循环，已改为族内有限外壳检查而解除。旧测试把 `[1,83]`列为“当前未表示”以及只检查命令级raw错误位置，是被本票细化的当前预期；原要求行与历史captured结果保持原字节，旧Timer保存义务由新增完整正例承接。

## 聚焦验证

Windows / Node22.23.0，原Vitest2workers与期限保持。首次完整聚焦Timer60例通过；随后Timer、command-boundary、events、decompiler和architecture共5文件91例通过。包类型检查通过。最终checkpoint的复核输出及原始结果清单在history；source运行的结果明确标识entry，不能作为built结果。

末次Timer与证据索引2文件63例通过；追加E4待执行行后，索引单例再次通过。末次包类型检查、改动TS的lint均退出0，lint无输出。累计归档120个自动化source通过结果及29个原始日志，requirements共288行（原274深度相等，追加13自动化+1待最终化E4）。2,722个原历史文件与原README前缀逐字节一致。DEV产品源文件指纹为`f4d381676efe01adffd0de7c39700148987bdd92f29af7f57f6f73ff2cdf22b4`（97文件，真实dirty基线保留）。没有候选dist或最终契约版本身份。

## E4 产品比较（待 finalization）

`MV-S6-TIMER-E4-COMPARE`尚未执行。最终化须使用实际候选build输出，对照[05逆向报告](05-timer-stop-reverse.md)的同身份资源事实及独立数组，比较新建Stop、已保存Start0/83改Stop、Stop重确认和仅容器序列化的完整保存结果。05为有边界静态证据，不能冒称编辑器UI或磁盘捕获；本票的source合成数组不是原生创建实测。检查身份metadata、所有受影响产物及最终契约版本后，才可登记实际E4结果与resolved。

## 最终化构建与 E4 产品比较 — mv-1.6.1/12

2026-10-20 的当前交付在手工 Git 注册的独立工作树 `M:/Shuen/Codex/mv-events-implementation-20261020/worktrees/mv-ticket-26-final`、分支 `codex/mv-ticket-26-final` 完成。原 C 盘 DEV checkpoint `f27ee63f95f65b59a738460615c95b9afdf53e60` 原样保留。先合并真实集成 `888b95019192806b88c73d7804f0662e4cce7e8b`（含 Map24 完整数值修正），合并提交为 `d89f61ebcdf48706873ca65a045e5a7d6927d052`；当前实际执行的干净产品提交为 `3c7aad677b489dec22d1ff21ba4c94272e47fea8`。Compile Contract 的唯一 owner 从入站 `/11` 增为 `mv-1.6.1/12`。

合并保留通用 raw 原生诊断后缀，以及 Timer 与最新 Map appearance 两组原生参数验证。首次全量 check 原样保留：42 文件中 1,061 通过、8 失败，包含七个旧整条指令诊断路径断言及一个原 10 秒证据索引超时。只把七个断言细化到实际 `.parameters` / `.indent` 字段后，Loop、Movement、Timer、索引四文件 140 例通过；随后当前干净提交的 `pnpm check` 完整通过，42 文件 / 1,069 测试，typecheck、lint、format 均退出 0。原双 worker 与期限不变，历史 lint 警告未隐去。

新工作树此前没有 dist。fresh `pnpm build` 退出 0，生成 15 个文件；随后 `test:windows-baseline` 在该实际 dist 上通过 18 文件 / 455 测试（317.30 秒）。[完整原始记录](26-final-history/README.md)保留失败、修正、通过的原输出和真实 dirty/clean 输入身份。

当前构建的 [189 文件冻结清单](26-final-history/built-inputs-v1/manifest.json)同时对应实际文件和仓库外 nlink=1 的普通物理副本：source 99 文件指纹为 `2fe2c69db4583c49d68af70d3ed3af703d38a6428bda3ba7b0c1429f6475e613`；test/fixture 61 文件为 `1dcae4b6f043c3ec1a56a10aff823379c1164a27c6c5033ceec515e813505802`；dist 15 文件为 `5342718948fcdbf73210a3d1f49153e3f16b30ddd8eeaaf2075e7d962483efe9`；完整 source/test/config/dist 为 `ff26c6971616a1a96fd6f3412628d4819fa6e2b608331285970503fb9bcdd022`。Node 22.23.0 可执行文件 SHA-256 为 `17347995af08dadcc73a1a154f0942559fbc3f37b9ba57d4576b4d2bcb2834a2`；所有本轮 TEMP/TMP、Windows sandbox、日志和输出留在仓库外 M 盘目录。

### 当前 E4 已完成

`MV-S6-TIMER-E4-COMPARE` 已用当前 fresh built 公共 Workspace API 实际执行并通过，[原报告](26-final-history/e4/report.json)记录 8 个产品阶段、14 个独立场景与 10 个负例。先重新验证当前 F 盘 EXE/Qt 的完整 SHA-256 与 10 条资源身份（外层长度、压缩消费边界、decoded 长度和 SHA），再复用 05 完整 load/save/container 事实。没有重复打开原生 session，也没有创建或冒用新 Evidence ID。

独立场景分别包括新建 Stop、已保存 Start0/83 改 Stop、三种 Stop 重确认、未确认 Start83 切 Stop、三种 Stop 仅容器序列化、Start 的 0/5999 边界，以及两个单独标识的合成数字负零案例。前十二项对应 05 的有边界代码事实或推导；负零证明已接受的保存值能力，不声称由编辑器创建。

产品实际经过 init → Clone → Decompile → 发现并求值发布源码 → Check → 编辑三容器正式源码 → Check → Compile → Diff → 真实 Push。Common/Map 名称与 Troop 拥有的 Comment 都产生真实差异；对四个生成 carrier 和十五个 live carrier 做完整独立相等比较，并另外检查槽位存在性、数组长度和 Object.is 负零。两次 Check 的配置、源码、Project Root、Snapshot、manifest 与 generated 完整业务状态保持不变。

八种畸形原生参数和两种实际 loader 正式/raw 源码均按预期拒绝，保留精确阶段、事件身份与参数路径，Check/Compile 及原生发布失败后业务状态不变。实际执行前后全部冻结的产品输入及 dist 字节一致。

这次通过是实际构建产物与同身份 REA 契约的产品比较。Qt Loader/信号时序、TkoolAPI 原生写盘成功及编辑器 UI 捕获仍不由静态事实证明；仓库只保存原创结果、合成 carrier 与身份 metadata。26 没有分配游戏组；最终 50 的 E4 汇总以及 52–54 的实际游戏验收继续由后续票负责。

## 最终归档与工单闭合

最终证据索引在原10秒/2workers下通过：1文件1通过、2筛除，测试4.11秒，总5.66秒。新增1458条机器结果；初始归档1507个文件的外部原件/仓库副本SHA完全相等；后续13个已关闭的audit/archive/index捕获单独追加，初始索引保持原字节。现314条requirements保留入站300条原顺序深度相等与DEV288条按ID深度相等。6084个unique历史文件的raw Git blob身份、适用旧报告精确前缀、原26报告与merged README前缀均通过；189个实际与物理保留的执行输入及15个dist字节未变。

[字节审计](26-final-history/final-byte-audit-v1.json)、[初始归档映射](26-final-history/archive-index-v1.json)、[闭合后追加映射](26-final-history/post-archive-index-v1.json)和[最终索引原输出](26-final-history/post-archive/final-index-v1/stdout.log)给出完整关联。工单26的适用门槛均已完成，按本地tracker改为resolved；元数据提交不改变上述已执行产品。提交后以独立外部receipt记录完整Git SHA/tree及实际committed blob回读，不制造提交自引用。
