# 素材存在性检查：验收对照表与证据清单

本文件展开[如何验收素材存在性检查并交接实施规格](issues/06-asset-validation-acceptance.md#answer)的 Q1–Q11。用户已于 2026-10-24 最终确认合并契约、本矩阵及设计完成边界；验收票与决策地图均已 resolved。**下列验收项全部待实施／执行，没有任何一行表示产品测试或原生验收已通过。** 本文件是已接受的交接用验收设计，不是实现规格、测试代码或运行回执。

## 使用约定与最小项目

契约依据分别为[覆盖](issues/02-direct-asset-reference-coverage.md#answer)、[文件事实](issues/03-asset-file-existence-contract.md#answer)、[诊断政策](issues/04-asset-diagnostics-and-policy.md#answer)和[工作流](issues/05-workspace-asset-check-lifecycle.md#answer)。各表标明对应依据，不以本表改写上游产品契约。

- 下表每一行是验收项族，列出的分支均须有独立预期；合并成一个参数化测试不减少覆盖责任。实施规格为具体子用例分配唯一标识，记录输入、原生位置、操作或变化时机、预期、方式、责任、状态与证据。
- 自写合成项目采用 `.rpgproject`、必要标准 data、Workspace Config 和 Definition Source；只为用例增加必要条目及素材。选用固定且互不混淆的事件、Animation、Tileset、Actor、Enemy、Troop、Skill 与 Map ID。材料可跨用例复用，但不依赖真实大项目或原版素材库的隐式完整性。
- 每个素材字段默认使用可区分的原始名称。基本变体是所有必要文件准确存在，再只删除一个指定文件；重复来源用例才刻意共享名称。空名称和错误字段另外构造，避免同时缺条目、缺文件而遮蔽预期。
- 自动化预期手写或从独立契约数据声明，不调用被测实现来计算期望集合、路径、级别或状态。DSL 编译可作为被测操作，不能作为预期生成器；正式与 raw 分别比对预期。
- 自动化负责人为实施方，环境为 Windows / Node.js 22；标为“真实文件”的项目确实操作临时文件树；标为“注入”的项目记录注入边界。原生组由实施方准备并尽可能执行，确需人工时由维护者执行留证。产品验收最终由维护者审阅报告确认。
- 下列所有项的当前执行状态统一为“计划，未执行”。环境受限的未来回执须单独记为未执行并说明原因，不可计为通过。标准数据、素材、输出与同步状态的比较使用各用例独立预期，不能只凭退出码判断。

## A. 直接字段：覆盖契约第二节

每行先以合法明确名称和准确普通文件证明发现全部使用，再逐字段删文件，预期该普通使用为缺失 error。另为允许 None 的字段验证无查询、保存的其他参数保留；明确非活动变体按 C／D 组断言 warning。一般页条件不满足或分支不执行不改变普通级别。事件命令及路线指令均验证正式与已识别 raw；页字段没有虚构的 raw 命令对照。

`p[n]` 是从 0 开始的原生参数。测试通过收集／诊断断言与真实 Workspace 编译验证，各种公共文件异常见 F 组，不对每行重复全部文件异常。

| ID | 最小输入位置 | 应发现的字段与目标 |
| --- | --- | --- |
| A01 | Map Event Page 图像 | `image.characterName` → `img/characters/<name>.png` |
| A02 | Show Text 101 | `p[0]` → `img/faces/<name>.png` |
| A03 | Change Battle BGM 132 | `p[0].name` → `audio/bgm/<name>.ogg` |
| A04 | Change Victory ME 133 | `p[0].name` → `audio/me/<name>.ogg` |
| A05 | Change Defeat ME 139 | `p[0].name` → `audio/me/<name>.ogg` |
| A06 | Change Vehicle BGM 140 | `p[1].name` → `audio/bgm/<name>.ogg` |
| A07 | Show Picture 231 | `p[1]` → `img/pictures/<name>.png` |
| A08 | Play BGM 241 | `p[0].name` → `audio/bgm/<name>.ogg` |
| A09 | Play BGS 245 | `p[0].name` → `audio/bgs/<name>.ogg` |
| A10 | Play ME 249 | `p[0].name` → `audio/me/<name>.ogg` |
| A11 | Play SE 250 | `p[0].name` → `audio/se/<name>.ogg` |
| A12 | Play Movie 261 | `p[0]` → `movies/<name>.webm` |
| A13 | Change Battle Back 283 | `p[0]`、`p[1]` 分别 → `img/battlebacks1`、`img/battlebacks2` 下 PNG |
| A14 | Change Parallax 284 | `p[0]` → `img/parallaxes/<name>.png` |
| A15 | Change Actor Images 322 | `p[1]`、`p[3]`、`p[5]` 分别 → characters、faces、sv_actors 下 PNG |
| A16 | Change Vehicle Image 323 | `p[1]` → `img/characters/<name>.png` |
| A17 | Movement Route Change Image 41 | `p[0]` → `img/characters/<name>.png`；自主路线与 205 路线分别覆盖 |
| A18 | Movement Route Play SE 44 | `p[0].name` → `audio/se/<name>.ogg`；自主路线与 205 路线分别覆盖 |

## B. 间接关系：覆盖契约第三、四节

逐行创建合法最小标准条目与必要字段，先所有非空素材存在，再逐字段删除文件，核对关系及相应级别；存在性规则与直接来源相同。标为候选者缺文件为 warning，其余普通使用为 error；明确非活动设置按 D 组处理，不凭一般执行条件推断候选。每行均需正常使用及单字段缺失证据，合法空值、必要字段损坏与目标条目缺失另按 C06–C07 分支验证。

| ID | 最小事件与标准关系 | 预期与必须区分的分支 |
| --- | --- | --- |
| B01 | Show Animation／Show Battle Animation → Animation | 两张图片字段与全部 `timings[].se.name`；每个 SE 条目保留来源，预加载与按帧条件分别记录；分别覆盖两个入口 |
| B02 | Change Tileset → Tileset | 全部非空 `tilesetNames[]`，不按地图实际使用筛选；多个槽相同名称仍保留不同字段来源 |
| B03 | 固定 Battle Processing → Troop members → Enemy | 所有成员含 hidden；`battlerName` 随 System.optSideView 只选 enemies 或 sv_enemies；重复 Enemy 保留成员路径 |
| B04 | Enemy Transform → 指定新 Enemy | 同样验证前／侧视目录；运行时目标可能不存在不丢弃保存的新 Enemy 关系 |
| B05 | Force Action → 固定 Skill 正 animationId | 继续到 B01 图片与 SE；0 不产生动画关系，但不能丢弃该 Skill 其他已选关系 |
| B06 | Force Action → 角色默认攻击 | Animation 1 图片与 SE 为无当前武器时的候选；缺失 warning；当前武器分支未知停止，不用初始装备替代 |
| B07 | Force Action → 敌人默认攻击 | `System.sounds[9].name` → audio/se；不能伪造 Animation ID 或套用角色空手关系 |
| B08 | 固定 Transfer Player → Map | tilesetId → 全部 Tileset 图片，加 parallaxName、bgm.name、bgs.name；保留 autoplay 与覆盖条件，关闭 autoplay 的保存名称仍检查；不引出 battleback |
| B09 | Map Event Page 非零图块 → 宿主初始 Tileset | `tilesetNames[5 + floor(tileId / 256)]` 一张 B–E 图片为候选；分别取 B–E 对应合法值，不检查整组作为此页图块的依赖；运行时换图块组条件保留 |
| B10 | Change Party Member 加入 → Actor | 初始 characterName 与 battlerName 都为候选，分别 characters／sv_actors；侧视及队员条件另记，不加入 faceName 或移除重排关系 |
| B11 | Game Over → System | gameoverMe.name → audio/me；不加入引擎硬编码 GameOver 图片 |
| B12 | Return to Title → System | title1Name、title2Name、titleBgm.name；分别 titles1、titles2、audio/bgm，不展开全部 UI 资源 |
| B13 | Battle Processing → System | battleBgm、victoryMe、defeatMe 的名称为默认候选；sounds[7].name 保留地图启动条件；动态敌群只截断敌群关系，不丢已知系统关系 |
| B14 | Map Event 内 Battle Processing → 宿主 Map | battleback1Name、battleback2Name 为条件候选；specifyBattleback 关闭仍保留名称与条件；Common／Troop Event 不推演调用地图，System Battle Test 背景不代替 |
| B15 | Common Event 命令 → 当前公共事件 | 公共事件中继续按已选关系检查；每个调用位置与独立事件起点来源保留，和 C04–C05 组合 |
| B16 | Force Action → Skill 的 Common Event effects → 公共事件 | 每个保存的 effect 关系继续检查；不因 reservation 可能覆盖丢掉关系；和 B05 的动画路径并存 |

## C. 起点、保存状态、来源与范围反例

依据覆盖契约第一、四至六节及诊断政策；方式为独立集合／来源断言和代表性真实 CLI 编译。每个变体的其他引用均有效，避免更早错误遮蔽目标分支。

| ID | 最小输入／变化 | 独立预期 |
| --- | --- | --- |
| C01 | Map／Common／Troop 当前定义，各含一处缺图；Common 未被调用 | 三种当前根均检查；多页与嵌套 Child Command Body 来源可定位；不依赖运行可达性 |
| C02 | 旧快照有缺图事件，当前 DSL 已移除；另有当前事件 | 旧事件不补回素材根；当前事件正常检查；既有删除／同步政策另保持 |
| C03 | 同一路线 205 主记录及 505 镜像；另一个真实命令同名 | 主／镜像一次逻辑使用且关联保存位置，另一真实指令独立计数；重复检查点不增加使用次数 |
| C04 | 两个调用位置进入同一公共事件；公共事件也为独立根 | 文件查询可复用，独立根与每个调用链来源都保留；全局去重不能抹掉来源 |
| C05 | 公共事件 A → B → A；另加多跳无环链及动态目标 | 当前链闭环有界停止，保留原因；无环链不受任意统一深度截断；动态目标不当 None 或成功，其他已知关系继续 |
| C06 | 合法空名、可省 DSL 字段及其默认值；音量／索引等非默认保存值 | 合法 None 不查询；Compiler Default 后按最终字段处理；独立保存值保留，不把空名构造成 Asset Reference |
| C07 | 同一间接用例分别删除目标条目、缺必要字段、字段类型错误、合法空字段、删素材文件 | 依次为引用／关系问题、数据解释问题、合法无素材或文件缺失；不补空值、不扩大外部字段校验 |
| C08 | 非 custom 自主路线、图块页保留角色名、关闭 autoplay／specifyBattleback；另有条件不满足页与不执行分支 | 明确非活动保存状态仍收集，已确认文件问题可 warning；页条件和分支推演不产生同样降级；候选与非活动理由均保留 |
| C09 | 只修改 HP 且 Actor 图像缺失；只设置交通工具位置且其图像／BGM 缺失 | 不建立未选素材关系；不把已排除倒下副作用偷加为本版范围 |
| C10 | 未引用数据库条目缺图或无关字段损坏；Troop Event 宿主 Enemy 缺图但无选中入口 | 不做全库校验，不因 Troop Event 身份扫描全敌群；不扩大外部数据所有权 |
| C11 | Script／Plugin／未知 raw 内有看似素材字符串，另有合法已识别 raw | 不猜测未知负载，已识别 raw 使用同规则；既有 Script Gate／结构诊断保留，素材例外不能绕过 |
| C12 | 插件声明、Enemy AI 技能、初始装备、地图传送网络、硬编码／地形资源、Battle Test 背景 | 按覆盖契约的明确排除，不自动加入；记录排除依据，不能以本行存在就宣称支持 |
| C13 | 对含外部数据库及自定义字段的项目执行成功／失败检查及合法 Push | 检查不改写外部条目或名称；允许 Push 的数据写入遵守已有所有权，素材树不复制、不备份、不写入 |

## F. 文件事实：文件存在性契约

除明确注入项外，用真实 Windows / Node.js 22 临时文件树；输入不支持项不尝试创建非法文件或解析穿越路径。每个事实结果均保留具体失败位置与全部使用关联，再以 D 组验证级别。

| ID | 输入／变化 | 独立预期及方法 |
| --- | --- | --- |
| F01 | 图片／四类音频／影片分别建立准确 PNG／OGG／WebM | 元数据确认普通文件即存在；每个已选类别目录由 A／B 组覆盖 |
| F02 | 只保留 m4a／mp4／其他格式或加密后缀；再与准确目标并存 | 替代格式不满足；准确项存在时通过且不因其他格式并存产生歧义 |
| F03 | 类别目录、basename、扩展名分别只大小写不符；准确项与变体并存；多个近似项 | 无准确项为名称不匹配，不选替代；准确项存在则通过；大小写并存能力不足的真实案例保留待补验 |
| F04 | 中文、空格、纯空白非空 stem、点号、`$`／`!`、stem 末尾空格／点 | 原值追加扩展名后按准确目标；不 trim、不丢前缀；纯空白不是 None |
| F05 | `Forest.png`；Unicode 规范等价但字节不同的名称 | 前者只匹配 `Forest.png.png`；后者不做 Unicode 规范化替换 |
| F06 | 图片／音频名称含字面量 `%`、`#`，以及看似编码的 `%20`；影片含 `%`／`#` | 图片／音频按原名，不 URL decode；影片为不支持名称；原生定位核对另见 N02 |
| F07 | 斜线、反斜线、绝对形式、穿越、Windows 禁止字符／控制字符、保留设备名及带后缀形式 | 不支持名称，保存原值，不查询逃逸路径或编造安全目标；采用输入用例，大小写／加扩展名不能绕过设备名规则 |
| F08 | 删除所需类别目录；保留目录但删文件；所需目录变文件；所需文件变目录 | 缺目录、缺文件和类型不符分别辨认及定位，不统一冒充缺文件 |
| F09 | Project Root 本身通过有效 alias 访问；根下各级目录或最终文件为 symlink／junction，目标在根内／根外／不存在 | 根别名沿既有绑定规则；根下链接一律不支持且不访问目标，拒绝不取决于目标存在或是否在根内 |
| F10 | 准确目标为普通硬链接、0 字节文件；元数据可见但拒绝内容打开的受控边界 | 前两者按普通文件通过；不需要打开或读取媒体，内容读取失败不能被未经调用的读取流程变成新 gate；注入证据不冒充真实 ACL |
| F11 | 目录枚举或元数据查询拒绝／I/O 故障 | 注入验证无法完成检查及位置，不能当缺失；其他独立可安全路径继续 |
| F12 | 一次查询内枚举后文件消失或必要路径类型改变 | 可控注入／暂停证明无法确认，区别于稳定缺失；跨检查点变化另见 W 组 |
| F13 | 对有图片／音频使用的 System 加密标志分别缺失、false、true、null／数字／字符串 | 缺失／false 普通检查，true 对相应类别不支持，非 boolean 为必要字段错误；普通文件存在不覆盖 true 结果 |
| F14 | 无对应类别使用，或只有另一媒体类别／影片 | 不因无关加密标志失败；不读取或校验无关类别标志；不自动切入 www 或部署目录寻找文件 |

## D. 诊断、例外、聚合与 CLI：诊断契约

| ID | 最小输入／变化 | 必须观察的结果 |
| --- | --- | --- |
| D01 | F 组缺失／名称不符／类型不符，分别用于普通使用、候选、明确非活动配置 | 普通 error，候选／非活动 warning；直接、raw、间接同政策；一般执行条件不自动降级 |
| D02 | 不支持名称／链接／加密、必要字段损坏、不可查询、观察不一致，分别附候选、非活动及例外 | 始终 error，不能降级；固定引用、结构和 Script Gate 错误也不受素材例外影响 |
| D03 | 缺失、准确名称不符、类型不符分别加入带原因的准确例外；代表性组合含同类别原名的直接、raw、间接多处使用 | 三类适用 error 均 → warning，保留查询事实、基础／有效级别及各处原因；不同类别、大小写、空白、后缀、编码形式不误匹配 |
| D04 | 类别非法、空名称、无原因／纯空白原因、重复同目标例外 | 配置 error，不用最后一项覆盖；未运行后续检查时明确说明，不制造素材通过 |
| D05 | 例外对应文件补齐、无当前使用、所有使用本来为 warning；另造检查未完成 | 完整检查中没有降级则定位配置项 warning；不完整不能确定作用时不下无用例外结论；不自动改配置 |
| D06 | 同文件两处普通 error 和一处候选 warning；另一文件制造不同问题；另在诊断聚合层构造同一合法目标对应两个不同问题组 | 组级别取最高有效级别，每处级别保留；问题组、不同文件与使用次数分别正确；同目标多组只计一个文件；聚合输入测试不要求伪造同时发生的文件状态或新增产品 API |
| D07 | 公共目录或必要字段失败影响多处；不支持名称无合法目标 | 按真实失败依据关联来源，不伪造多个已确认缺失文件或安全目标路径 |
| D08 | 一条关系坏字段，另一条缺文件，第三条稳定 warning；另造更早输入错误 | 安全独立检查继续、已得结果保留；受损路径停止并说明完整性；早期无可信输入不强求穷尽 |
| D09 | 跨事件／页／嵌套体／路线／公共事件的重复链 | 问题标识、阶段、原名、根、目录、后缀、目标与失败位置可核对；每步标准类别、ID、字段及条件完整；无可靠 TS 行列时不编造 |
| D10 | 真实 CLI 执行 error、warning、例外、动态／循环和不完整样例 | 退出结果符合政策，用户可获取问题、事件／原生位置、关键链、原因和未完成说明；不对无意义排版做整段快照锁定，不要求新增 JSON 输出 |

## W. 工作流：工作流契约

使用真实临时 Workspace、源码与标准 data。每项按指定边界暂停后修改，再继续；文件系统错误另注明注入。记录退出结果、诊断、项目 data、生成数据、Snapshot、Sync Manifest、pending 和素材树状态。覆盖真实 CLI，同时允许通过现有操作进程工具稳定控制边界。

| ID | 初始输入／变化时机 | 必须观察的结果 |
| --- | --- | --- |
| W01 | Check 在 initial／fresh／stale 下分别成功、普通素材 error、稳定 warning | 不发布、不刷新 Manifest 或 Generated Freshness、不写 Project Root；状态依原值保留 |
| W02 | Check 首次观察后、成功返回前删文件或使 warning 缺失改善 | 新观察发现相关变化即失败要求重跑，例外不能豁免；稳定 warning 可成功 |
| W03 | Compile 发布前出现素材 error 或相关变化 | 不发布本次输出，Project Root 不变；独立诊断仍保留 |
| W04 | Compile 已开始本地发布、提交 Manifest 前出现相关变化／故障 | 按已有发布失败边界留无效状态，不额外承诺旧输出保留；重新成功 Compile 后方可继续 Diff／Push |
| W05 | Push 第一次 Project Root 替换前出现普通素材 error 或此前观察改变 | 不开始 data 替换；不声称整个操作从未产生本地准备状态 |
| W06 | Push 全部替换后、同步记账前删图或观察改变 | 当前 Push 失败、保留 Interrupted Push，不自动回滚；明确 data 已写而记账未完成 |
| W07 | 无 Affected Project Data Files 的 Push，当前素材缺失 | 当次检查失败但不因素材失败制造 pending；既有标准 data 漂移等前置仍检查 |
| W08 | Compile 成功后删图，运行 Diff／Push，再补回并重试 Push | Diff 不扫描素材；生成新鲜度不因删图失效；Push 按当前政策失败，补回且其他依据不变可不重编译重试 |
| W09 | 实时 Animation／Tileset 名称改为另一文件，尚未 Pull；随后 Pull 与重新 Compile | Compile 使用一致快照旧字段；Push 因 data 漂移拒绝；Pull 使旧生成状态失效，新 Compile 使用新字段，不混读两版 |
| W10 | 改写同名普通文件的内容／大小／时间戳／身份；同目录无关文件增删 | 存在性必要事实不变则不因这些变化失败；不读或哈希媒体内容 |
| W11 | 在各完成边界改变匹配、路径类型／链接、可查询性、失败位置，包含缺目录变缺文件和缺失补齐 | 任何被观察到的相关变化均失败要求重跑，即使改善或两个状态本来均 warning；不承诺检测未被观察到的瞬时变化 |
| W12 | 同目标多来源；下一检查点及下一次命令中改变文件 | 单点可复用，但后续点取得新文件观察，不能信任旧报告／缓存；依赖关系复用不抹来源或增加逻辑使用次数，不锁定具体 syscall 次数 |
| W13 | Push 的写前／记账前分别改变源或验证依赖、相关配置／例外、快照、生成数据或根绑定 | 按边界停止或留 pending；不半途换政策、重编译或换目标；合法工具 data 写入不被误判为外部漂移 |
| W14 | 例外配置变化、Pull、显式目标重绑、Compile Contract Version 变化；旧生成状态与 Check 成功 | 仍须重新 Compile 满足各自基线；Check／恢复／单独素材重查不把旧输出升级；有效根别名沿既有绑定 |
| W15 | pending 全部匹配生成内容且仍缺素材；另测全部匹配旧快照、混合／缺失／未知 | 全生成可先完成记账再因当前素材失败，pending 不为已完成 data 保留；全旧可放弃后按正常 gate；混合等拒绝，素材不能代替恢复证据 |
| W16 | W15 恢复时原编译依据已过期或当前配置不同 | 恢复不刷新为新依据，不授权新写；当前 freshness／drift／素材检查分别判定并清楚报告 |
| W17 | 缺素材项目执行 Clone／Pull／Decompilation／Diff | 不新增素材文件门槛或扫描；既有捕获、表达、引用、完整性与 freshness 规则仍适用 |
| W18 | 同 Workspace 并发操作、pending 时非 Push、目标切换 | 继承互斥及恢复要求，pending 按原目标处理；不引入跨 Workspace 锁或最后检查后的原子保证 |
| W19 | 所有操作的成功／失败路径，包含间接依赖 | 素材不进入快照、复制、备份或 Push 写入；必要外部字段只读，保存值不被修复；按各操作允许的 data／元数据变更精确比较 |
| W20 | 完整性／freshness／drift 通过后的 Push，生成事件含当前公共事件关系和间接素材；旧快照另有已移除事件；稳定观察 DSL 是否重新求值 | 从已校验 Generated Project Data 完整当前事件及对应 Snapshot 重建使用，独立核对根集合、原生位置、每条调用来源与依赖链；不重新编译或求值 DSL、不信任历史素材报告；可靠 DSL 源码位置可选，具体观测手段交实施规格 |

## N. 原生运行必验项与证据

依据验收票 Q7，均待实际执行。准备 Windows / MV 1.6.1 普通编辑测试项目与有效自制媒体，记录 MV 与 NW.js／宿主版本、输入指纹、操作、原生实际请求及文件定位。可观测运行不能仅以源码拼接字符串或单函数重放代替。播放现象可作为辅助记录，不把它扩大成媒体内容保证。

| ID | 最小场景 | 核对目标 |
| --- | --- | --- |
| N01 | 普通名称的图片、音频、影片事件 | 所用类别目录、PNG／OGG／WebM 请求与实际文件定位；音频／影片记录宿主选择结果，不从 CLI 系统类型推测能力 |
| N02 | 支持范围的中文／空格名称；图片／音频分别含 `%`、`#` 与看似编码名称 | 原始名、请求 URL 和实际定位的对应；不 URL 解码为另一个磁盘名称；影片排除 `%`／`#` |
| N03 | 双图 Animation，至少两条时序 SE | 图片及各时序 SE 的请求来源与条件；完整路径可追到标准字段 |
| N04 | Change Tileset 与合法 B–E 页图块场景分别运行 | 整组图片和页图块单图是不同消费关系；观测区分地图绘制附带加载，不把场景总请求误当页图块单独依赖 |
| N05 | 同一 Enemy 分别在前视和侧视模式 | enemies／sv_enemies 的目录选择与实际文件定位 |
| N06 | 已选初始候选被运行时设置覆盖，例如 Actor 图像 | 保存候选和当前运行值可以不同；不据运行替换删除静态候选或把候选描述成必然加载；区分预加载与执行 |

不把已排除的部署加密、子路径、影片 `%`／`#`、picker 行为列为本版全面实测责任。必验未执行或支持范围内证据冲突未解决，阻止宣布产品验收完成；不阻止以明确待执行项交接实施规格。

## 已有依据、待执行责任与完成门槛

| 证据／任务 | 当前状态及证明范围 | 后续责任 |
| --- | --- | --- |
| [原生文件定位研究](research/native-asset-file-resolution.md)及覆盖票首方函数出处 | 已有静态依据；不证明 Windows 宿主完整运行 | 实施方据此编写独立预期，完成 N 组及必要反例核对 |
| [部署筛选研究](research/native-unused-assets-scope.md)及[重放回执](evidence/native-deployment-filter-replay.json) | 既有 12/12 原函数受控重放；不是完整部署／加载，也不是事件素材检查 | 只作为范围差异背景，不用其全库集合生成本功能预期 |
| 文件存在性票的 500 文件查询微测 | 既有 Node v24 实验，无媒体读取、无影片样本；不是产品验收或性能承诺 | 不据此声称 Node.js 22 性能达标，不新增未经选择的耗时阈值 |
| [Windows sandbox](../../packages/rpgmaker-event-dsl/test/support/windows-sandbox.ts)、[发布测试](../../packages/rpgmaker-event-dsl/test/compile-publication.test.ts)、[Push 测试](../../packages/rpgmaker-event-dsl/test/push-drift.test.ts)、[恢复测试](../../packages/rpgmaker-event-dsl/test/push-recovery.test.ts) | 已有代码／测试定义；本次只读核对，未执行；无新增素材功能验收结果 | 实施方补 fixture、检查点及上述素材用例，执行并留证 |
| A／B／C／F／D／W 全部验收项 | 计划，未实施／执行 | 实施方在 Windows / Node.js 22 验证；特殊能力受限项保留未执行并在合适环境补验 |
| N01–N06 | 计划，未执行 | 实施方准备并尽可能执行；确需人工由维护者执行并留证 |
| 仓库检查、构建、含素材用例的构建后 CLI 验证 | 计划，未执行 | 实施方执行并提供实际回执、版本／环境和失败原因；维护者审阅 |

用户已确认合并 Answer 与本矩阵，设计范围内没有未决产品政策，已满足编写实施规格的交接条件。后续规格将用例族展开为具体 fixtures／测试、实施任务及相应代码接口，保留独立预期、证据类型、责任和未执行状态。

实施顺序为：独立预期与 fixture／尽早核对原生疑点 → 分别验证依赖、文件与诊断 → Compile／Check → Push／恢复及一致性边界 → Compile Contract Version、说明、构建后 CLI 及完整验收。内部阶段完成不等于对外首版完成。当前仓库命令为 `pnpm check`、`pnpm build`、`pnpm --filter rpgmaker-event-dsl test:windows-baseline`；与全部必验和反例结果一起交由维护者确认。

反例按验收票 Q8 分流：修实现并加回归；或重开被事实推翻的决策／ADR 并追踪下游；或记录范围扩展提议。任何未解决的契约反例、必验未执行或证据矛盾均须明确保留，不能靠改预期、放宽断言或新增例外宣称产品通过。稳定 warning、有效例外和信息停止按政策允许，不要求报告清零。
