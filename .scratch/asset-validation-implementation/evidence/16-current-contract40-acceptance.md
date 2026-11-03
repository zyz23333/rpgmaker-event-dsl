# 16：CURRENT40 fixture 预期兼容

03 的现行 Windows 设备名修复把工具契约推进到 `mv-1.6.1/40`。16 的 `AV.W16.changed-current-config.api.case.expected` 有两处明确表示 CURRENT 的 `/39` 字面量，需同步为 `/40`，才能继续以原本 fresh 的 pending 隔离随后 current config 改变的原因。**本次是测试预期兼容，产品行为未改，没有新增 Contract bump、测试或 AV ID。**

完整原始运行、输入、回执和哈希在[机器合册](16-current-contract40-acceptance.json)及[原始资料](16-current-contract40/)，提交前字节与链接核验见[Git审计](16-current-contract40-git-verification.json)。依据为[16票](../issues/16-recovery-and-current-asset-policy.md)、[规格](../../asset-validation/asset-validation-spec.md)、[有限索引](../../asset-validation/implementation-acceptance-cases.md)、ADR0006／0013／0019和原16 preparation的 then-current 隔离要求。

原工作树 `M:/Shuen/Codex/asset-validation-16-recovery` clean 于 `3bd97e41d129883caafb6f2921f2190fe0d68bf5`，已快进 integration `f79bacb496b18f59562663b7fc9e9d10e86c747f`／Contract40 后重新 claim。最终测试字节冻结于 **`0fb8b677c1c8679a334cae034b6823a776ace789`**。该冻结的整个 `src` Git tree 与基底完全相等；test 范围仅此文件改变，原 `f03e66e6e4550da8a72f98c118fbc36c3af4d1d5` 源码替换两处 `/39` 为 `/40` 后与最终源码逐字节相等。

## 实际 compatibility red 与窄复核

| 执行 | 通过 | 失败 | 过滤 | 实际含义 |
| --- | ---: | ---: | ---: | --- |
| compatibility-red source | 0 | 1 | 11 | 原 CURRENT39 预期对实际 CURRENT40；失败于原 fresh fixture 的版本断言。 |
| 更新后 source | 1 | 0 | 11 | 唯一 W16 changed-current-config callback 完整通过。 |
| 更新后 built | 1 | 0 | 11 | build40 后同一 callback 通过，使用 built 公共 API。 |

red 在 HEAD `631ff14bb4755a5c396885f050d41ec35a04b45d`，原断言源码与原 `f03` 完全相同；实际错误是 `expected 'mv-1.6.1/40' to be 'mv-1.6.1/39'`。原 before 输入及完整状态、runner、receipt 和断言字节归档。此失败来自过期 fixture 期待，不能记录为产品违约或恢复行为失败。

只更新原第221行的版本预期及第252行的 `recordAssetInput.currentContract`，各一处 literal。更新后源码仍为25,202 bytes，SHA-256 `cd16f06cf4bfbc3ca09a3bab9cec3bc245bba9af2b07cfce60ebb3ae134e162f`；原源码 SHA-256 `6b9f56c923b3840195fd96cf7c37c2a331029404d11ca39b1ea85e7c835e0eb2`。三个 runner 均注册相同12个原 ID，唯一执行此 callback，其余11个 filtered 不计通过。

完整原断言保留并实际通过：原 Compile Baseline 是 CURRENT40、原空 exception 政策且 freshness 为 true；冻结独立 pending 和 all-N live 后仅改变合法准确的当前 policy，再删媒体；恢复按原 basis 完成记账并清 pending，原 Compile Baseline 保留空政策，当前 config 保留新政策；后续 Push 因 current config 导致 stale 而拒绝新写，报告 `asset check not run`，没有伪造 missing-file 诊断、没有素材查询。整个 state 对照原独立完成预期，live data 与其余树保留。最终 freshness 为 false。

历史 `AV.W16.stale-original-basis...` 的原 `/35`、原 policy 省略、contract／type-inputs 省略和 pre-Troops `/6` 变体全部原样保留，没有被改成 CURRENT40。本次没有弱化 fresh 前置、独立原 hash、原 binding、数据证据或恢复后的当前权限判断。

## 执行范围与历史保全

仅运行上述一个现有 callback；没有重跑其余11项、原86兼容回归或不相关矩阵，没有声称当前12／12或86／86。最终17负责完整 repository／Windows baseline 验证。build、typecheck、lint、format:check 和 Git diff 空白检查均实际通过。所有本次执行为 Windows／Node `v22.23.4`、默认 C TEMP／TMP、`maxWorkers=1`，root 在09释放后授权独占 targeted 窗口；执行顺序为 compatibility-red→两literal→build40→source→built，之后只做静态与证据整理。

原[16验收说明](16-recovery-acceptance.md)、[原机器合册](16-recovery-acceptance.json)、[原Git审计](16-git-verification.json)、原链接记录、[原100份raw索引](16-raw/manifest.json)及全部100份raw均与integration基底字节一致。原Contract39最终source／built各12/12、24条回执及86/86历史结果继续属于原冻结执行，没有改写为Contract40结果。新合册逐项记录并核对这些105份历史资料的长度、SHA-256和Git对象。

本次23份新raw、3条原始receipt（1条compatibility失败＋2条通过）、20个冻结Git输入和15份built工件均单独绑定来源；raw的`-text`属性保留原始输出字节，提交前审计核对磁盘、index blob、完整receipt对象和本地链接。没有执行原生MV，也没有将操作系统适配控制当作新产品接口。16恢复resolved后交回集成流程，原工作树保留。
