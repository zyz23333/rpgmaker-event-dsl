# 04：页图像、直接图像指令和路线图像验收

日期：2026-11-02。环境：Windows x64、Node.js v22.23.4；运行时位于 `M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe`。票据：[04](../issues/04-direct-image-uses.md)。契约：[实施规格](../../asset-validation/asset-validation-spec.md)、[有限子用例索引](../../asset-validation/implementation-acceptance-cases.md)、ADR 0016–0019。

[逐项机器回执](04-image-acceptance.json)记录 69 个独立 ID 在源码和构建入口的 138 条结果，包括明确输入、独立断言及其源文件哈希、环境、执行时间、入口、真实 CLI 结果和实现文件哈希。测试在含中文及空格的实际临时 Workspace 中运行；零字节 PNG 只证明普通文件存在，不代表图像解码或原生游戏运行证据。

实现扩展 02 的同一 Compile／Check 门槛，从通过完整原生验证的当前候选输出读取页图像、101、283、284、322、323，以及自主路线和 205 路线内的 41。505 只作为对应路线使用的附加保存位置，不新增使用；真实重复命令仍保留独立来源。None 不查询；明确非活动保存配置仍收集，允许的文件问题为 warning，必要数据问题和实际查询失败始终为 error。分组采取最高级别，每个来源保留自己的级别和非活动原因。公共事件直接调用的既有诊断后缀保留。Compile Contract Version 更新为 28。

| 所属验收 | 本票实际覆盖 |
| --- | --- |
| A01、A02、A13–A17 | 页 characterName、脸图、两层战斗背景、远景、角色的 character／face／battler、载具、两种路线的每个原生字段；按适用的 page／formal／raw 分别执行 present 和 missing，共 40 个 ID。完整使用预期为独立字面量，含身份、目录、原名、保存位置、镜像、空的链与条件。缺失分别检查 Check 和 Compile 无发布；已有成功输出可保留。 |
| C06 | 所有上述允许 None 的 11 个原生字段、默认页图像、默认页路线、独立保存索引，以及额外 raw 231 None，共 15 个 ID。保留脸图索引 9、路线及页图像索引 7、图像指令其他非默认保存值。未提供素材目录时合法 None 仍通过。 |
| C03 | image 的 route-mirror、independent-command、repeated-command；205／505 一次且两处定位完整；不同命令独立，重复 Check／Compile 不累加计数，共 3 个 ID。 |
| C08 | fixed／random／approach 路线、tile-with-character；共享目标有活动和非活动来源时仍 error；非活动 unsupported-name／encryption 为明确 unchecked warning，损坏必要数据及注入 EIO 查询均为 error，共 9 个 ID。注入在测试子进程的 OS lstat 边界进行，不是实际 ACL 能力声明。 |
| C11 | 路线 Script 仍受原 Script Gate 约束；启用后字符串不变成推测素材。另保留历史远景 CR/LF 名称的 Decompilation 原值，并证明 Check／Compile 拒绝且无发布，共 2 个 ID。 |
| 实际 CLI 与状态 | 源码／构建 CLI 的路线镜像错误、非活动 warning、共享目标级别以及非活动查询错误；Check 核对源、配置、项目与素材树、Snapshot、生成数据、Manifest 全部不变。 |

旧成功 fixture 明确增加所用 PNG：消息脸图 `UnscannedFace`，角色与载具的 `$Big`／`Character`／`Vehicle`／`Face`／`Battler`，移动指令的 `Actor1`／`People1`／`!$Huge`，页图像 `!$Big`，以及外观指令的 `Castle1`／`Brick`／`Sky`。原始 `" Sky\r\n "` 保存数据文件未修改；单独的成功外观矩阵使用明确的 `Cloud` 保存值和准确文件，原值由新增历史保留／政策拒绝测试覆盖。没有名称修复、通配符放行或全局绕过。

验证结果：

- 实现按各图像族先观察缺失文件的 Check 错误成功，再补上对应原生字段收集；页图块夹具先纠正必需 Tileset 数据，随后观察真正缺图的 red，再加入非活动级别规则。
- 受影响源码工作流回归：177／177，包括当时的 67 个图片用例、角色呈现 3、消息 6、移动指令 14、地图事件 80、最终版本工作流 7。地图外观完整源码套件另为 8／8。此轮位于合入 03 最新观察器之前，随后最终矩阵重新覆盖当前观察器。
- 最新集成 `e476b77e` 合入、契约版本为 28 后：源码选定用例 75／75，构建入口选定用例 75／75；两轮各含本票全部 69 个 ID、03 的 F11／F12 查询回归 5 个、当前版本输出回归 1 个。过滤器未选择的其他用例明确未计入通过。
- 最新构建、仓库 typecheck、lint、format:check 和 `git diff --check` 通过。新套件已列入显式 Windows 构建后用例清单。
- 外部完整 Vitest 报告：`M:/Shuen/Codex/asset-validation-notes/04-source-affected.json`、`04-source-final.json`、`04-built-final.json`；最终两份报告的哈希在机器回执中记录。

本票所属自动化分支没有未执行项。页图块的间接候选关系由 07 承担；它扩展当前 tile 用例时需补上 `BaseB.png` 并增加对应使用预期。音频、间接数据库关系、例外和 Push 由后续责任票实施。01／03 的 `%`／`#` 原生映射决定仍待用户决策，本票未改变该政策，也未将其未执行部分记为通过。最终仓库全量检查和完整 Windows baseline 由 17 汇总。
