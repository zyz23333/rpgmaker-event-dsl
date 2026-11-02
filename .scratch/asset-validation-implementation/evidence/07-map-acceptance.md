# 07：Transfer Map 与 Map Event Page 图块素材验收

日期：2026-11-02。票据：[07](../issues/07-transfer-and-page-tile-dependencies.md)。契约：[实施规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)、[有限子用例索引](../../asset-validation/implementation-acceptance-cases.md)。实施分支 `codex/asset-validation-07-maps`，工作树 `M:/Shuen/Codex/asset-validation-07-maps`；从已完成06的集成 `898b87db` 实施。产品与原生归档提交 `8030b14f`，五项缺文件 fixture 修正提交 `3bcc85c5`。本票仍在收尾，旧回归、最终集成与契约版本将在完成后记入下方。

## 行为与范围

固定原生201从同次编译捕获的 `MapNNN.json` 读取目标 Map 的 Tileset、远景和 BGM/BGS。Tileset 沿用06的全部九个命名槽规则；没有根据当前地图实际放置图块过滤。每个真实字段保留定义事件、原生参数位置、完整 Map／Tileset 字段链和运行时可能覆盖的条件。保存音频保留 autoplay 播放条件；明确 false 的保存名称仍检查，并有非活动原因与 warning。必要 autoplay Boolean 只在有非空音频名称时解释，坏值报告必要数据错误而继续检查安全兄弟字段；None 不会因不必要的 flag 失败。

Map Event Page 的非零 tileId 读取捕获宿主初始 Tileset，B–E 只选择一张；来源同时说明地图绘制可另请求整组，以及运行时 Tileset 可覆盖初始选择。它是 Conditional Asset Candidate，确认缺文件按 warning 处理。原保存 characterName 仍由04作为独立非活动使用检查。共享 `AV.C08.tile-with-character.formal.case.expected` 在原 callback 内扩展，归属 `04,07`；没有重复登记 ID 或移除旧断言。

变量传送201保留动态停止位置、原因和未检查信息；没有猜测 Map、伪造 None 或候选。独立固定传送兄弟仍检查。当前候选事件是唯一根；外部资料只提供窄的只读字段叶，不沿目标地图事件网络、目标地图战斗背景或较新实时数据库扩展。移除的 Snapshot 事件不能恢复成当前根。没有新增公共 Workspace API、JSON CLI、产品测试开关或素材持久状态。

| 验收族 | 主要规范 ID | 分别执行的有限分支 |
| --- | ---: | --- |
| B08 | 48 | slot0–slot8／parallax／bgm／bgs × formal／raw × present／missing；准确文件、完整使用／链／条件、Compile／Check、实际 CLI 及原生输出。 |
| B09 | 8 | B／C／D／E × present／missing；只供应被选文件，防止错误整组扩展；完整候选来源、原生保存 image 与只读 Check。 |
| C06 | 16 | 上述16个到达字段各自合法 None；安全兄弟完整保留，不把缺字段当 None。 |
| C07 | 80 | 上述16个字段分别 target-missing／field-missing／field-wrong-type／field-empty／file-missing；既有引用或 Map/Tileset 结构错误与素材数据／文件事实区分。 |
| C08 | 2 | autoplay BGM／BGS 关闭后保存名称仍检查，warning、非活动原因、兄弟字段与保存值均保留。 |
| C12 | 1 | transfer-network：捕获目标 Map 的被移除事件网络、战斗背景和实时新增远景均不加入根或关系。 |
| N04 | 2 | 整组282与单张页图块；后一个 ID 包含 B–E 四次独立实际原生进程。 |

独立计划集合有157个主要规范 ID，155自动化、2原生。另有10个补充自动化 ID：formal／raw 动态传送2、必要 autoplay缺失／错型4、Map tilesetId缺失／错型／目标Tileset缺失3、None音频忽略不必要autoplay1。加共享C08一个，源码与构建各166个独立自动化 ID、原生2个，共168个不同ID。计划清单只作集合比对，不计执行结果。

## 已执行矩阵与失败记录

- 源码主矩阵165项：160通过、5失败。三个C07和两个autoplay关闭的缺文件 fixture 没有先建唯一目录，实际是缺目录，不能满足独立指定的缺文件预期。补齐准确空目录，未改产品与文件事实断言。
- 首轮修正验证6／6：三个C07、共享C08、捕获对象读取器与transfer-network。最终8／8再次签收全部五个失败用例、共享C08、读取器与transfer-network。过滤未选项均不计通过。
- 因此本票165个源码ID与共享C08现在都有通过回执。159个Map回执仍对应主矩阵提交8030b14f的断言源哈希，6个Map回执对应最终fixture提交3bcc85c5；共享callback有其独立源文件哈希。机器合册按每条实际回执记录其版本，未把旧运行伪装成最终文件版本。
- 完整构建入口矩阵165／165通过、无过滤跳过。实际公共Workspace API从dist/workspace-api.mjs载入，真实CLI从dist/cli.mjs执行；源码入口分别为对应src文件。每个ID均有真实CLI进程输入、退出码、stdout／stderr和Windows／Node22环境。当前源码166条共有168次真实CLI；构建165条共有167次，待旧回归执行共享callback后合册最终统计。
- TDD逐片保留object、parallax、Tileset、BGM、BGS、page、有效变量传送及必要autoplay的实际red／green JSON。最初变量fixture漏Variable Definition，被先行reference验证拒绝；补声明后重新得到有意义red再green。早期页图块smoke的预期pattern1与默认0不符，改为明确作者输入pattern1，保留原生预期。这些准备失败与修正均不计通过。

源码与完整构建矩阵在相同产品文件／contract31上运行，`07-main-inputs.json`保留当时产品与全部dist文件SHA256。旧回归和最新集成组合另记录最终产品及构建哈希，避免将收尾组合二进制误当主矩阵的原始输入。完整日志和JSON位于 `M:/Shuen/Codex/asset-validation-notes/07-*`。

## N04 原生结果

[原生观察](07-native-maps/observations.md)、[两份规范回执](07-native-maps/acceptance-receipts.json)、[逐项文件哈希](07-native-maps/artifact-manifest.json)保留五个独立实际进程。Change Tileset九项断言、B–E各十项，共49项全部通过；全部首次实际运行observed、outer exit0。原生 MV1.6.1／NW0.29.0 x86／Chromium65／内置Node9.7.1与外围Node22.23.4分开记录。

原样委托的解释器282实际reserve全部九个命名槽并将实时Tileset1改为2，预加载和地图绘制栈分别保留。页图块1／256／512／768分别实际只选B／C／D／E，图片真实加载为独立颜色与768×768尺寸，原生48像素格和Canvas drawImage都被观察。地图绘制的九张附带请求没有计入页图块关系。探针、原始日志、保存输入与自制有效PNG按原样字节归档；完整shell／profile留在外部原始项目。

原生审阅及最终集成签收待收尾时补入。本票没有改图片 `%`／`#` 政策，也不关闭01／03或宣称全规格完成。

## 收尾验证

待已协调的旧回归窗口、最新集成合入和最终机器合册完成后追加；本节待办不作为已执行证据，也不能据此关闭本票。
