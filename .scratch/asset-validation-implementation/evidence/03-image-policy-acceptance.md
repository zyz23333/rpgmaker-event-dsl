# 03：图片百分号／井号政策收尾回执

日期：2026-11-02。状态：**03 resolved。** 本次落实维护者已确认的图片名称边界，补齐三个现行F06 input ID及必要交互验证；[原阶段机器回执](03-file-observation-acceptance.json)的332条通过和六条待决记录保持字节不变。[新机器回执](03-image-policy-acceptance.json)单独记录本次执行，不把旧filesystem待决项覆盖为通过。

## 行为与职责

[维护者政策处置](01-native-media/policy-resolution-2026-11-02.md)、[ADR0017](../../../docs/adr/0017-exact-asset-file-existence-in-editing-projects.md)和[权威ID修订](../../asset-validation/implementation-acceptance-cases.md#2026-11-02-f06-身份修订与历史回执)规定：所有image类别名称包含任一 `%` 或 `#` 均为不支持名称，包含普通百分号和看似编码的 `%20`。`observeAssetFile` 在构造目标路径、realpath及目录／元数据查询之前返回 `MV-ASSET-UNSUPPORTED-NAME`，没有替代target或失败文件路径，不URL解码、不修复、不改写保存值。该判断依赖category，不按某个图片folder或具体命令放行。音频字面查询继续支持；影片已有排除保持不变。

共用 `assetUseLevel` 已覆盖不支持名称，本次不再增加级别分支：ordinary为error，Conditional Asset Candidate或明确非活动保存配置为warning，保留未检查说明、条件和事件来源。窄补充用例使用Actor初始characters／sv_actors候选及固定Autonomous Movement的characters保存名，验证非pictures目录及直接／间接路径共用政策。候选／非活动Compile成功时原名仍在捕获外部字段或生成保存值中；正式helper仍能表达这些名称。例外不能豁免的政策保持既定，由12实现完整例外功能；本票未提前新增例外schema或公共开关。

## 新旧ID与证据保全

| 旧ID，仅历史 | 新canonical ID | 新独立预期 |
| --- | --- | --- |
| `AV.F06.image-percent.filesystem.case.expected` | `AV.F06.image-percent.input.case.expected` | 普通 `image%percent` 图片也不支持；准确原名文件存在仍拒绝 |
| `AV.F06.image-hash.filesystem.case.expected` | `AV.F06.image-hash.input.case.expected` | `image#hash`不支持；无后缀URL解释目标不能代替 |
| `AV.F06.literal-percent20.filesystem.case.expected` | `AV.F06.literal-percent20.input.case.expected` | `literal%20image`不支持；空格文件不能代替 |

每个新canonical callback分别构造正式Show Picture与已识别raw231。在真实Windows Workspace中，准确原名文件及可能的替代文件同时存在；公共API的Compile Check／Compile均失败且不发布。实际CLI的Compile Check在测试子进程OS边界设置img访问守卫，既报正确名称错误，又没有进入类别查询或把拒绝伪装为query-failed；实际Compile CLI也失败。所有回执记录原始输入、独立断言、源码哈希、Node版本和实际CLI结果。三个ID没有注册别名或复用另一callback的回执文件。

新 `AV.F06.image-candidate.input.case.expected` 和 `AV.F06.image-inactive.input.case.expected` 是两个补充ID，不冒充原规范三个ID。无img目录时，公共API和实际Check／Compile CLI均成功并给warning+未检查；来源、candidate／inactive原因、Actor字段链和生成保存名称不变，OS守卫未被触发。测试控制留在既有测试子进程系统边界，产品无新增测试入口。

旧机器回执SHA-256仍为 `a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071`，与原03提交 `1a382bf8` 相同。旧六条 `not-executed-policy-pending` 保留当时“政策尚未答复”的原因；现行政策及新ID通过另行记录。`.gitattributes`保全该历史JSON及本次原始捕获。01的原生15样本13成功2反例及两组对照也未改动或重跑。

## TDD与实际执行

先新增image-percent tracer并运行公共Compile Check：准确 `image%percent.png` 使旧实现成功，独立断言要求unsupported-name，因此测试失败；[原始red回执](03-image-policy/red-image-percent.source.json)已在改产品前存档。然后只扩展共用category名称判断并将Compile Contract Version提升为 `mv-1.6.1/35`，原tracer转绿；再补齐井号／`%20`和候选／非活动交互。原始失败没有覆盖成green回执。

所有新执行均为Windows／Node `v22.23.4`，`--maxWorkers=1`。公共Workspace API与实际源码／构建CLI分别验证，没有只测内部匹配器或用产品函数计算预期。

| 执行范围 | source | built | 证据与计数边界 |
| --- | --- | --- | --- |
| 三个新F06 input canonical ID | 3/3 | 3/3 | 每ID包含正式／raw、API Check／Compile及实际CLI Check／Compile |
| candidate／inactive补充 | 2/2 | 2/2 | Actor两类候选与固定路线非活动，warning+未检查及保存值保全 |
| 原F04八种合法名称、F05双后缀／Unicode两支 | 10/10 | 10/10 | 旧ID原样复核，合法名称未因新排除扩大而误拒 |
| 05拥有的原F06 audio-percent／audio-hash、movie-percent／movie-hash | 4/4 | 4/4 | 复用既有callback，不新增重复ID；仅为本票回归证据 |
| 既有asset-picture-workspace、compile-publication | 42/42 | 42/42 | 原成功fixture与发布断言不改；完整两套轻量回归 |

本次新机器回执包含38条定向通过（10条新政策／补充、28条合法名称及音频／影片复核）；旧两套回归另保留Vitest原始报告及日志。定向source19条；built图片／合法名15条加音频／影片4条。过滤未执行项只记为本次未执行，不计入通过。对应JSON报告和日志位于[03-image-policy目录](03-image-policy/)，每份报告的计数和SHA-256见新机器回执。

原03的166个独立ID已在历史源码／构建完整运行中分别通过；其中10个合法名ID本次刷新，其余156个未受影响ID沿用原证据。本次补足3个新canonical ID后，03现行主用例169个，另有2个补充；这个累计覆盖对账不表示本次重新执行全部171个用例，也不将旧六条退役ID待决记录计为通过。

`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build`及 `git diff --check` 通过。已合入07及其最新integration，保留其新collector、Windows显式清单和原有回归fixture；名称行为版本35高于整合前33。交付前再次合入最新integration并复核版本，不将本票版本覆盖为较旧的33／34。完整仓库测试及最终Windows baseline由17汇总，本票未运行全仓测试。

本次收尾变更Markdown的90个本地链接、6个Markdown锚点均核对存在；阶段与原生证据只增加后续状态指针，原始JSON和raw未改写。

## Outcome

03剩余职责已完成，票设resolved。名称、文件事实及必要旧回归已有源码／构建证据；全部旧回执和原生反例保全。说明沿用01已同步的README，不新增产品开关、目录扫描、媒体读取／写入或持久素材凭证。12仍应按03、07、10的实际resolved状态领取；03本次不提前实施12。
