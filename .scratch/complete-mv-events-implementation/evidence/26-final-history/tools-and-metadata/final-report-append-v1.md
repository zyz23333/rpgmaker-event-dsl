
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
