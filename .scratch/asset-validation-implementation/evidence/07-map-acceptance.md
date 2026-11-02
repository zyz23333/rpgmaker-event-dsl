# 07：Transfer Map 与 Map Event Page 图块素材验收

日期：2026-11-02。票据：[07](../issues/07-transfer-and-page-tile-dependencies.md)。契约：[实施规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)、[有限子用例索引](../../asset-validation/implementation-acceptance-cases.md)。实施分支 `codex/asset-validation-07-maps`，工作树 `M:/Shuen/Codex/asset-validation-07-maps`；从已完成06的集成 `898b87db` 实施。产品与原生归档提交 `8030b14f`，五项缺文件 fixture 修正提交 `3bcc85c5`。已合入08和09的最新集成 `9d860dac`，最终产品组合提交 `68d7205a`，Compile Contract Version `mv-1.6.1/33` 高于当前集成32。

[机器合册](07-map-acceptance.json)保留168个不同ID：自动化166各有源码／构建通过回执，另有2个原生规范ID。每条自动化回执以ID与执行时间匹配唯一实际runner，包含断言源版本／SHA256、输入、预期、实际CLI结果及对应阶段产品／构建哈希。主规范的源码、构建、原生集合分别与独立计划精确匹配，没有漏项或重复归属。原始报告在 [07-run-history](07-run-history/manifest.json) 按字节保留，包括失败和过滤未选项。

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
- 因此本票165个源码ID与共享C08均有通过回执。机器合册区分主矩阵提交8030b14f与最终fixture提交3bcc85c5的断言源哈希；共享callback有其独立源文件哈希。后续组合只重跑适用ID，每条最终回执仍回配其实际测试源和runner，未把旧运行伪装成最终文件版本。
- 完整构建入口主矩阵165／165通过、无过滤跳过；共享C08在完整旧回归及最终组合中通过。实际公共Workspace API从dist/workspace-api.mjs载入，真实CLI从dist/cli.mjs执行；源码入口分别为对应src文件。每个ID均有真实CLI进程输入、退出码、stdout／stderr和Windows／Node22环境。最终源码166条与构建166条回执各含168次真实CLI，共336次。
- TDD逐片保留object、parallax、Tileset、BGM、BGS、page、有效变量传送及必要autoplay的实际red／green JSON。最初变量fixture漏Variable Definition，被先行reference验证拒绝；补声明后重新得到有意义red再green。早期页图块smoke的预期pattern1与默认0不符，改为明确作者输入pattern1，保留原生预期。这些准备失败与修正均不计通过。

源码与完整构建主矩阵在相同产品文件／contract31上运行，[07-main-inputs.json](07-run-history/07-main-inputs.json)保留当时产品与全部dist文件SHA256。08后旧源码回归有 [单独输入](07-run-history/07-regression-source-inputs.json)，09后完整旧构建回归及最终组合对应 [07-final-inputs.json](07-run-history/07-final-inputs.json)，避免将收尾组合二进制误当主矩阵的原始输入。完整原始日志和JSON同时留在 `M:/Shuen/Codex/asset-validation-notes/07-*`。

## N04 原生结果

[原生观察](07-native-maps/observations.md)、[两份规范回执](07-native-maps/acceptance-receipts.json)、[逐项文件哈希](07-native-maps/artifact-manifest.json)保留五个独立实际进程。Change Tileset九项断言、B–E各十项，共49项全部通过；全部首次实际运行observed、outer exit0。原生 MV1.6.1／NW0.29.0 x86／Chromium65／内置Node9.7.1与外围Node22.23.4分开记录。

原样委托的解释器282实际reserve全部九个命名槽并将实时Tileset1改为2，预加载和地图绘制栈分别保留。页图块1／256／512／768分别实际只选B／C／D／E，图片真实加载为独立颜色与768×768尺寸，原生48像素格和Canvas drawImage都被观察。地图绘制的九张附带请求没有计入页图块关系。探针、原始日志、保存输入与自制有效PNG按原样字节归档；完整shell／profile留在外部原始项目。

native_01 已只读独立审阅，无发现：两个规范ID、五次首次实际进程、49项断言及outer exit0一致，440次 evidence／外部原始项目／runtime／shell／probe／PNG／脚本／fixture SHA256比较全部匹配；同步来源栈、单槽、48px格、颜色、bitmap源身份和Canvas真实draw均分别核对。没有重跑原生或修改归档。

本票没有改图片 `%`／`#` 政策代码，也不关闭01／03或宣称全规格完成。父任务随后接受图片名含 `%` 或 `#` 统一不支持、音频仍支持的新决定，由其对应票落实；本票全部关系样例均为普通名称，N04关系观察仍适用。

## 收尾验证

已将08集成tip4cf15625合入为8b645aaf，组合后contract32；固定传送 formal／raw、页E、动态传送、autoplay关闭、坏必要flag、范围网络与敌人前视字段的8项窄源码组合全部通过。随后五组旧源码回归178／178通过、零跳过：Map Event80、图像68、数值保存22、地图定位3、依赖数据5。运行期间产品文件保持不变。

源码旧回归结束后合入09最新集成9d860dac，保留06／07／08／09全部uses／problems及201／301各自来源的动态停止信息；提高contract至33并构建。同五组完整构建回归178／178通过、零跳过。既有成功fixture只补必要标准字段和准确普通文件：Map定位提供Map音频／远景None与Tileset九空槽，完整页保存例提供被选E.png，共享图块页提供BaseB.png。旧断言和未知字段全部保留；Map定位的公共API入口同时改为真实可选择源码／构建模块。

最终源码组合16／16、构建组合16／16通过，415个过滤未选项各自保留但不计通过。组合覆盖 formal／raw固定传送、页E、两种表达的变量传送、共享C08与autoplay关闭、坏flag、None、目标网络边界、敌人、System动态／已知兄弟、战斗BGM、宿主战斗背景和旧／23编译结果过期门禁。完整命令、过滤正则、时间和结果在机器合册verificationReports中。

根 `pnpm build`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` 和 `git diff --check` 全部通过。Windows构建后显式清单包含新增Map套件及既有地图定位套件，并保留08／09新增清单。README同步固定Transfer、页单图候选、关闭autoplay与动态停止；父任务确认的Face段存在性说明一并修正，保留None索引与未检查尺寸的边界。

工单07已记录Outcome并resolved，等待父任务merger合入。宽回归窗口已释放给11；最终全仓、其他关系／例外／Push与整规格签收仍由相应票及17负责。
