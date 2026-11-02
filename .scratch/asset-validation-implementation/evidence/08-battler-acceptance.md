# 08：Enemy 战斗图与 Actor 初始候选验收

2026-11-02，票据 [08](../issues/08-enemy-and-actor-candidates.md)，依据 [实施规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)及 [有限子用例索引](../../asset-validation/implementation-acceptance-cases.md)。分支 `codex/asset-validation-08-battlers`，工作树 `M:/Shuen/Codex/asset-validation-08-battlers`，基于并包含当前 integration `898b87db`。Compile Contract Version 为 `mv-1.6.1/31`。

[机器合册](08-battler-acceptance.json)对 89 个规范 ID 独立对账：源码 86／86、构建 86／86、原生 N05／N06 共 3／3。源码／构建两集合及原生集合与事先独立转录的计划集合精确匹配，无漏项或额外归属 ID；计划清单不计为执行。172 条自动化回执均有真实 CLI 进程结果，并保存字面输入、完整独立断言、测试源 SHA256、实际结果、环境、时间、准确命令和产物哈希。自动化普通零字节 PNG 只验证存在性；原生使用有效自制图片。

## 产品行为及范围

固定 Battle Processing 沿 Troop 的每个 members[].enemyId 读取 Enemy.battlerName，包括 hidden 与重复成员；Enemy Transform 读取指定新 Enemy，不因运行时目标可能不存在而删除保存关系。捕获 System.optSideView 为 false／true 时分别只选 `enemies`／`sv_enemies`。必要 mode 无法解释时为数据错误，不猜目录或制造缺文件。

加入 Actor 只选初始 characterName 与 battlerName，分别为 characters／sv_actors 下的条件候选；保留运行时替换、有效 player／follower、侧视及有效战斗队员条件。缺准确候选文件 warning，坏必要名称仍 error。没有增加 face、初始装备、移除后重排、HP 倒下副作用或 Enemy AI 技能，也不因 Troop Event 宿主身份扫描其成员图片。

关系模块复用 06 的 CapturedAssetData、AssetRelations、窄名称叶与共同链渲染，读取同一次捕获 Snapshot；当前候选事件根与外部数据保持分开。动态301只结束08的敌群分支，09独立负责其唯一停止记录及已知 System 兄弟关系。没有新增公共 API、JSON CLI、产品测试开关、全库严格字段或持久素材状态。

| 验收族 | 规范 ID 数 | 实际覆盖 |
| --- | ---: | --- |
| B03 | 16 | 前／侧视 × member0／hidden member1 × formal／raw × present／missing；反目录同名文件不能替代，完整成员／Enemy链及模式条件保留。 |
| B04 | 8 | 前／侧视 × transformed-battler × formal／raw × present／missing；保存替换 Enemy 的关系独立于运行时目标存在。 |
| B10 | 8 | 两个初始候选 × formal／raw × present／missing；实际 Compile／Check／CLI warning 及不发布／只读边界分别断言。 |
| C06 | 8 | 上述所有允许空名的到达字段；合法 None 不查询，并保留 index7、hue123、独立未知字段等保存值。 |
| C07 | 40 | 每个到达字段 × target-missing／field-missing／field-wrong-type／field-empty／file-missing；固定引用、坏必要字段、合法 None、普通／候选文件问题分别验证。 |
| C04 | 1 | 重复 Enemy 成员保留两条成员链，分组仍为一个目标、两个使用。 |
| C09／C10／C12 | 5 | actor-hp、vehicle-position、unrelated-actor、troop-host-only、enemy-ai 各有真实 Workspace／CLI 排除范围场景。 |
| N05／N06 | 3 | 同一 Enemy 的前／侧视真实目录及一个 Actor 初始候选被运行时图像覆盖的真实场景。 |

六项补充检查不增加规范 ID：坏 members 容器的完整链；坏成员／缺 Enemy 后继续后续安全成员；必要 optSideView 的缺失／错误类型；实际 API／CLI 同时报告 Enemy mode 和 Actor 候选必要字段错误；较新的实时 Actor／Enemy／System 不替代捕获视图；移除 Actor 不读取损坏初始图像字段或推断重排素材。

## 验证与兼容 fixture

- 完整源码规范矩阵先为 86／86；测试期望的 TypeScript 字面量注解修正后，最终源码组合 122／122，包含规范86、补充5、旧 Inventory/Party31。构建入口同组合 122／122。最后新增的移除范围补充在源码／构建各 1／1；其余5项过滤未选不计为通过。
- Snapshot-context 的历史成功固定 Troop4 场景、Enemy99 的原有 Compile／Decompile 负例、旧 Battle 三项与当前契约检查，在源码和构建入口各 7／7；各8项过滤未选不计通过。Snapshot-context 原来静态使用源码 Workspace，现跟随既有 workspaceApiEntry 选择，加入显式 Windows 构建后清单；两个新素材套件也均加入。
- Battle fixture 提供真正选中的 Enemy 名称与准确 PNG、optSideView:false；Inventory/Party fixture 提供 Actor 两个必要名称与准确 PNG。Snapshot-context 只在运行准备中补充 Animation／Enemy 必要字段及准确 Animation／Tileset／Enemy 文件，冻结 JSON 原样保留。仅其成功固定 Troop4 启动采用 validBattleMembers 局部选项，将不存在 Enemy99 的那一成员改为已有 Enemy1，保留成员位置、x／y／hidden／未知字段；其他调用仍保留原 Enemy99，所有旧负例／断言继续有效。没有补出虚假 Enemy99 或放宽 gate。
- TDD 为前视固定成员、侧视目录、变身、Actor候选、必要字段条件、members容器链分别保留 red／green 日志。最初 tracer 的错误 helper import 在记录行为 red 前修正；最终源码／构建回执来自完整正确输入，未把准备错误当产品反例。容器链的 green 由五项 data suite 实际运行保存。
- typecheck、lint、format:check、build 与分支 `git diff --check` 通过。日志、执行命令及 SHA256 位于机器合册，外部完整目录为 `M:/Shuen/Codex/asset-validation-notes/`。本票没有执行全仓套件；最终整规格签收由17负责。

[原生观察](08-native-battlers/observations.md)、[三份原生回执](08-native-battlers/acceptance-receipts.json)保存真实运行、22项独立断言、各原始失败／补强运行及媒体／输入／原生脚本哈希。前视红80×96与侧视绿96×80图均在两个目录真实存在，只消费相应目录。N06 帧2使用当前青色行走图，帧63使用当前蓝色SV图，精确源对象身份与像素均验证；初始行走图预加载与实际绘制分开，数据库初始名称始终保留。

本票未改图片 `%`／`#` 决策或01／03状态；原生样例不构成所有布局、插件、完整战斗或整规格完成保证。
