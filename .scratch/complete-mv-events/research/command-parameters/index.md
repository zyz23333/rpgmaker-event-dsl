# MV 1.6.1 原生指令逐参数契约证据索引

研究日期：2026-10-19（Asia/Shanghai）。研究基准 `efb78e3e52ba93459402cce32e1224b16a2932c4`；独立研究分支 `research/mv-command-parameter-evidence`，只发布原创研究报告，不开PR、不合并。研究目标见[原生指令逐参数契约还缺哪些证据](../../issues/11-native-command-parameter-evidence.md)。

## 研究结论与状态

已建立 **105类顶层事件指令、45类移动指令的逐参数证据表**，包括原生槽位/参数数量、模式与枚举、控件值域、None、独立保存配置、默认和省略依据、项目引用/Runtime Selector/Gate、结构归属及待执行样本。已逐项对照[原库存](../native-command-fidelity.md)，无重复或缺项；不是只重新统计helper名称。

事实调查已完成到可供设计决策使用的粒度；它没有解决新出现的保存形态与支持边界选择，也不代表产品完整支持。当前产品没有在本轮改动，未执行产品测试、真实编辑器打开保存或游戏运行。下文每项“已列”仅指静态证据和明确责任已记录。

| 分片 | 覆盖 | 详细内容 |
| --- | --- | --- |
| [核心指令](core.md) | 24族 | 文本/流程/变量/物品，全部14种条件模式及Actor7子型、Game Data8来源和全部status，Script/Plugin |
| [系统、画面、音频与地图](visual-map.md) | 48族 | 位置和目标模式、图片全部字段、音频/None、系统保存配置、205父记录 |
| [角色、战斗与场景](actors-battle.md) | 33族 | 角色/敌人selector、数量operand、Battle/Shop结构、装备动态槽、图片与完整单字符串 |
| [移动子指令](movement.md) | 45码 | 全部无参和11种有参子指令、M0终止、共享route flags、505镜像和记录外壳 |
| [共享控件与保存链](shared-controls.md) | 共用证据 | 实际REA+Ghidra SpinBoxValidator反编译、随包Qt alias链、JSON最终保存、证据留存与关闭 |

## 如何区分契约、证据与未知

- 正式约束依据[原生指令契约](../../issues/05-native-command-contract.md#answer)、[保存结构往返](../../issues/06-semantic-roundtrip-policy.md#answer)、[Workspace输入](../../issues/07-workspace-domain-integration.md#answer)及ADR0009–0014。表中未获批的具体schema拼写/省略是候选；当前实现不是依据。
- 本体嵌入QML/JS、随包帮助、NewData runtime、模板、Ghidra原生函数是不同来源；完整静态保存路径加JSON规则的推导仍不等于实际UI生成文件。全部报告给出源码offset/行号、长度和SHA以便复核。
- 数值控件整数/范围描述普通编辑路径，不把runtime接受任意JS number当支持授权；不把重新确认对话框的归一化行为当保存结构等价。
- 只有已决字段可省略，反编译仅省略可精确恢复者；其他字段完整显式表达即可覆盖，不需要先猜新的Compiler Default。是否增加便利默认交接口定稿明确决定；研究不自动审批。
- 固定引用缺失、未知模式、已知异常与未知code的政策仍按已决契约。对正常原生反例必须回到模型讨论；不能raw、丢字段、补空数组、删0、修镜像后标“无损”。

## 需要用户讨论的保存形态

下列事实已锐化为主工作区决策票 **原生保存形态差异如何进入正式 DSL**（tracker文件 `issues/12-native-saved-shape-model.md`）。研究分支不携带tracker修改；事实在本索引与分片自足，正式决定将记录在该票。

| ID | 原生事实与证据强度 | 需要决定什么 |
| --- | --- | --- |
| S1 | E124新建stop只写[1]；普通start83改stop保留[1,83]。Q@793186:62–70及基类表明没有截断；静态保存路径已闭合，UI样本未执行 | stop正式schema如何保留秒数槽缺失/存在及值，不补0或删除 |
| S2 | 无参移动可缺parameters；M0工厂有缺键与[]两种；移动插入器在缺indent上算术，静态推导保存indent:null。205/505不清理 | 正式Movement Route/子记录如何保留这些外壳差异、终止和镜像；是否需要复用的保存形态字段 |
| S3 | 空body的0前普通插入命令会留下0；已读同body删除路径不删尾0；Conditional/Choices/Battle重确认保留非空body已有0 | 子体如何保留已证尾0；确定生成规则的边界，不能根据尚未证明的无尾0形态擅自统一 |

S3没有证明“同内容有/无尾0都可由普通UI生成”；完整上下文见core的有界核查。S2 indent:null是代码路径推导，未伪造保存样本。若真实目标样本反驳推导，应更新证据，不以已经写了票替代事实复核。

## 需要用户讨论的支持边界

主工作区另建 **原生控件范围与保存值的支持边界如何划定**（`issues/13-native-value-domain-boundaries.md`），在完整支持范围不变的前提下澄清以下具体参数域与诊断；不要求用户凭偏好裁定源码事实。

| ID | 已知事实 | 精确待决/责任 |
| --- | --- | --- |
| B1 | 官方脸图规范2×4、144px帧；目标picker固定4列但高度动态，576×432可选8..11。E101/E322保存index，None与index独立 | “原生合法”是否涵盖普通编辑器可选的非标准尺寸素材；faceIndex域、资产尺寸依赖/诊断。未确认前不能宣称硬0..7覆盖所有可达原生数据 |
| B2 | E201/202/203/285直接坐标由地图picker取得，无固定9999硬界；地图缩小后既存位置可超范围；Common Event地图动态 | 直接坐标形式域、当前越界warning/error、Map Reference与运行位置区别。不统一声称越界返回0：tileId索引可别名到下一行，terrain/region有边界检查 |
| B3 | E118/119/320/324、Profile及若干Script Input均单个完整字符串保存；普通UI单行/两行等控件限制与原生记录个数不同 | 这些槽的CR/LF/长度支持边界；不得套四类行记录的拆分/条数规则。Plugin Command Line和355之外Script Input已定原则保留，新增限制须明示，不倒改已决规则 |

B3相关Script Input包括E111、E122和M45；E356完整原样字符串已有明确决定，不再提议trim或拆分。B1/B2/B3分别需要正式编写、已有数据反编译、容器重存及参数重确认四个层面的准确约束。

## 已有原则可直接应用的事实

- E127/E128在gain模式仍保存includeEquipment，E129在remove仍保存initialize；E337的allEnemies独立于index；E138灰度隐藏仍保存四元素tone。这些按已决“独立保存配置保留”，不另起模型投票。
- 所有已调查素材槽的None由实际picker支持路径证明，编码空串；音频参数、图像index不随None删除。引用空名字与显式null仍区分。
- Picture scale负数是普通控件允许的−2000..2000，不能因现实现假设正数排除。
- 连续范围和Random在编辑器保存时排序；DSL逆序报错为已决产品策略，静态事实不撤销它。
- 319 slotIndex+1映射、运行时装备表选择；335/336/Force Action主体不能借runtime接受负数泛化为all；各分片保留精确子集。
- 132/133/138/139/140/322/323等初值可能取当前项目，不能变成固定DSL默认；205原生新建flags为false/false/true，与已定共享DSL true/false/false明确区分。
- E315本体QML上限9,999,999（Q@803041:23–26），帮助写99,999,999（Help/page/01_10_05.html:125）。两条事实同时记录；参数表按目标控件描述，不把帮助值当已证UI可输入。V1真实输入保存样本交验收；若拟主动扩域则在B类边界讨论中明示，不能把投票当事实取证。

## 顶层事件指令完整索引

每项的参数数目、全模式、默认/显式要求与正负样本见链接。状态只列额外前置，**所有项都尚未执行真实验收**；无额外前置不表示产品已实现。

| code | 参数报告 | 状态 / 跟踪项 |
| --- | --- | --- |
| E101 | [Show Text](core.md#e101--show-text) | 参数已列；B1 脸图索引 |
| E102 | [Show Choices](core.md#e102--show-choices) | 参数已列；S3 子体尾0 |
| E103 | [Input Number](core.md#e103--input-number) | 静态参数证据已列；真实验收待执行 |
| E104 | [Select Item](core.md#e104--select-item) | 静态参数证据已列；真实验收待执行 |
| E105 | [Show Scrolling Text](core.md#e105--show-scrolling-text) | 静态参数证据已列；真实验收待执行 |
| E108 | [Comment](core.md#e108--comment) | 静态参数证据已列；真实验收待执行 |
| E111 | [Conditional Branch](core.md#e111--conditional-branch) | 参数已列；S3 子体尾0；B3 Script Input单槽 |
| E112 | [Loop](core.md#e112--loop) | 参数已列；S3 子体尾0 |
| E113 | [Break Loop](core.md#e113--break-loop) | 静态参数证据已列；真实验收待执行 |
| E115 | [Exit Event Processing](core.md#e115--exit-event-processing) | 静态参数证据已列；真实验收待执行 |
| E117 | [Common Event](core.md#e117--common-event) | 静态参数证据已列；真实验收待执行 |
| E118 | [Label](core.md#e118--label) | 参数已列；B3 单槽文本 |
| E119 | [Jump to Label](core.md#e119--jump-to-label) | 参数已列；B3 单槽文本 |
| E121 | [Control Switches](core.md#e121--control-switches) | 静态参数证据已列；真实验收待执行 |
| E122 | [Control Variables](core.md#e122--control-variables) | 参数已列；B3 Script Input单槽 |
| E123 | [Control Self Switch](core.md#e123--control-self-switch) | 静态参数证据已列；真实验收待执行 |
| E124 | [Control Timer（发现正常保存形态，新增设计依赖）](core.md#e124--control-timer发现正常保存形态新增设计依赖) | 参数已列；S1 停止秒数槽 |
| E125 | [Change Gold](core.md#e125--change-gold) | 静态参数证据已列；真实验收待执行 |
| E126 | [Change Items](core.md#e126--change-items) | 静态参数证据已列；真实验收待执行 |
| E127 | [Change Weapons](core.md#e127--change-weapons) | 静态参数证据已列；真实验收待执行 |
| E128 | [Change Armors](core.md#e128--change-armors) | 静态参数证据已列；真实验收待执行 |
| E129 | [Change Party Member](core.md#e129--change-party-member) | 静态参数证据已列；真实验收待执行 |
| E132 | [Change Battle BGM](visual-map.md#e132--change-battle-bgm) | 静态参数证据已列；真实验收待执行 |
| E133 | [Change Victory ME](visual-map.md#e133--change-victory-me) | 静态参数证据已列；真实验收待执行 |
| E134 | [Change Save Access](visual-map.md#e134--change-save-access) | 静态参数证据已列；真实验收待执行 |
| E135 | [Change Menu Access](visual-map.md#e135--change-menu-access) | 静态参数证据已列；真实验收待执行 |
| E136 | [Change Encounter](visual-map.md#e136--change-encounter) | 静态参数证据已列；真实验收待执行 |
| E137 | [Change Formation Access](visual-map.md#e137--change-formation-access) | 静态参数证据已列；真实验收待执行 |
| E138 | [Change Window Color](visual-map.md#e138--change-window-color) | 静态参数证据已列；真实验收待执行 |
| E139 | [Change Defeat ME](visual-map.md#e139--change-defeat-me) | 静态参数证据已列；真实验收待执行 |
| E140 | [Change Vehicle BGM](visual-map.md#e140--change-vehicle-bgm) | 静态参数证据已列；真实验收待执行 |
| E201 | [Transfer Player](visual-map.md#e201--transfer-player) | 参数已列；B2 直接坐标 |
| E202 | [Set Vehicle Location](visual-map.md#e202--set-vehicle-location) | 参数已列；B2 直接坐标 |
| E203 | [Set Event Location](visual-map.md#e203--set-event-location) | 参数已列；B2 直接坐标 |
| E204 | [Scroll Map](visual-map.md#e204--scroll-map) | 静态参数证据已列；真实验收待执行 |
| E205 | [Set Movement Route](visual-map.md#e205--set-movement-route) | 参数已列；S2 路线外壳 |
| E206 | [Get on/off Vehicle](visual-map.md#e206--get-onoff-vehicle) | 静态参数证据已列；真实验收待执行 |
| E211 | [Change Transparency](visual-map.md#e211--change-transparency) | 静态参数证据已列；真实验收待执行 |
| E212 | [Show Animation](visual-map.md#e212--show-animation) | 静态参数证据已列；真实验收待执行 |
| E213 | [Show Balloon Icon](visual-map.md#e213--show-balloon-icon) | 静态参数证据已列；真实验收待执行 |
| E214 | [Erase Event](visual-map.md#e214--erase-event) | 静态参数证据已列；真实验收待执行 |
| E216 | [Change Player Followers](visual-map.md#e216--change-player-followers) | 静态参数证据已列；真实验收待执行 |
| E217 | [Gather Followers](visual-map.md#e217--gather-followers) | 静态参数证据已列；真实验收待执行 |
| E221 | [Fadeout Screen](visual-map.md#e221--fadeout-screen) | 静态参数证据已列；真实验收待执行 |
| E222 | [Fadein Screen](visual-map.md#e222--fadein-screen) | 静态参数证据已列；真实验收待执行 |
| E223 | [Tint Screen](visual-map.md#e223--tint-screen) | 静态参数证据已列；真实验收待执行 |
| E224 | [Flash Screen](visual-map.md#e224--flash-screen) | 静态参数证据已列；真实验收待执行 |
| E225 | [Shake Screen](visual-map.md#e225--shake-screen) | 静态参数证据已列；真实验收待执行 |
| E230 | [Wait](visual-map.md#e230--wait) | 静态参数证据已列；真实验收待执行 |
| E231 | [Show Picture](visual-map.md#e231--show-picture) | 静态参数证据已列；真实验收待执行 |
| E232 | [Move Picture](visual-map.md#e232--move-picture) | 静态参数证据已列；真实验收待执行 |
| E233 | [Rotate Picture](visual-map.md#e233--rotate-picture) | 静态参数证据已列；真实验收待执行 |
| E234 | [Tint Picture](visual-map.md#e234--tint-picture) | 静态参数证据已列；真实验收待执行 |
| E235 | [Erase Picture](visual-map.md#e235--erase-picture) | 静态参数证据已列；真实验收待执行 |
| E236 | [Set Weather Effect](visual-map.md#e236--set-weather-effect) | 静态参数证据已列；真实验收待执行 |
| E241 | [Play BGM](visual-map.md#e241--play-bgm) | 静态参数证据已列；真实验收待执行 |
| E242 | [Fadeout BGM](visual-map.md#e242--fadeout-bgm) | 静态参数证据已列；真实验收待执行 |
| E243 | [Save BGM](visual-map.md#e243--save-bgm) | 静态参数证据已列；真实验收待执行 |
| E244 | [Replay BGM](visual-map.md#e244--replay-bgm) | 静态参数证据已列；真实验收待执行 |
| E245 | [Play BGS](visual-map.md#e245--play-bgs) | 静态参数证据已列；真实验收待执行 |
| E246 | [Fadeout BGS](visual-map.md#e246--fadeout-bgs) | 静态参数证据已列；真实验收待执行 |
| E249 | [Play ME](visual-map.md#e249--play-me) | 静态参数证据已列；真实验收待执行 |
| E250 | [Play SE](visual-map.md#e250--play-se) | 静态参数证据已列；真实验收待执行 |
| E251 | [Stop SE](visual-map.md#e251--stop-se) | 静态参数证据已列；真实验收待执行 |
| E261 | [Play Movie](visual-map.md#e261--play-movie) | 静态参数证据已列；真实验收待执行 |
| E281 | [Change Map Name Display](visual-map.md#e281--change-map-name-display) | 静态参数证据已列；真实验收待执行 |
| E282 | [Change Tileset](visual-map.md#e282--change-tileset) | 静态参数证据已列；真实验收待执行 |
| E283 | [Change Battle Back](visual-map.md#e283--change-battle-back) | 静态参数证据已列；真实验收待执行 |
| E284 | [Change Parallax](visual-map.md#e284--change-parallax) | 静态参数证据已列；真实验收待执行 |
| E285 | [Get Location Info](visual-map.md#e285--get-location-info) | 参数已列；B2 直接坐标 |
| E301 | [Battle Processing](actors-battle.md#e301--battle-processing) | 参数已列；S3 子体尾0 |
| E302 | [Shop Processing](actors-battle.md#e302--shop-processing) | 静态参数证据已列；真实验收待执行 |
| E303 | [Name Input Processing](actors-battle.md#e303--name-input-processing) | 静态参数证据已列；真实验收待执行 |
| E311 | [Change HP](actors-battle.md#e311--change-hp) | 静态参数证据已列；真实验收待执行 |
| E312 | [Change MP](actors-battle.md#e312--change-mp) | 静态参数证据已列；真实验收待执行 |
| E313 | [Change State](actors-battle.md#e313--change-state) | 静态参数证据已列；真实验收待执行 |
| E314 | [Recover All](actors-battle.md#e314--recover-all) | 静态参数证据已列；真实验收待执行 |
| E315 | [Change EXP](actors-battle.md#e315--change-exp) | 参数已列；V1 EXP帮助差异待真实样本 |
| E316 | [Change Level](actors-battle.md#e316--change-level) | 静态参数证据已列；真实验收待执行 |
| E317 | [Change Parameter](actors-battle.md#e317--change-parameter) | 静态参数证据已列；真实验收待执行 |
| E318 | [Change Skill](actors-battle.md#e318--change-skill) | 静态参数证据已列；真实验收待执行 |
| E319 | [Change Equipment](actors-battle.md#e319--change-equipment) | 静态参数证据已列；真实验收待执行 |
| E320 | [Change Name](actors-battle.md#e320--change-name) | 参数已列；B3 单槽文本 |
| E321 | [Change Class](actors-battle.md#e321--change-class) | 静态参数证据已列；真实验收待执行 |
| E322 | [Change Actor Images](actors-battle.md#e322--change-actor-images) | 参数已列；B1 脸图索引 |
| E323 | [Change Vehicle Image](actors-battle.md#e323--change-vehicle-image) | 静态参数证据已列；真实验收待执行 |
| E324 | [Change Nickname](actors-battle.md#e324--change-nickname) | 参数已列；B3 单槽文本 |
| E325 | [Change Profile](actors-battle.md#e325--change-profile) | 参数已列；B3 单槽文本 |
| E326 | [Change TP](actors-battle.md#e326--change-tp) | 静态参数证据已列；真实验收待执行 |
| E331 | [Change Enemy HP](actors-battle.md#e331--change-enemy-hp) | 静态参数证据已列；真实验收待执行 |
| E332 | [Change Enemy MP](actors-battle.md#e332--change-enemy-mp) | 静态参数证据已列；真实验收待执行 |
| E333 | [Change Enemy State](actors-battle.md#e333--change-enemy-state) | 静态参数证据已列；真实验收待执行 |
| E334 | [Enemy Recover All](actors-battle.md#e334--enemy-recover-all) | 静态参数证据已列；真实验收待执行 |
| E335 | [Enemy Appear](actors-battle.md#e335--enemy-appear) | 静态参数证据已列；真实验收待执行 |
| E336 | [Enemy Transform](actors-battle.md#e336--enemy-transform) | 静态参数证据已列；真实验收待执行 |
| E337 | [Show Battle Animation](actors-battle.md#e337--show-battle-animation) | 静态参数证据已列；真实验收待执行 |
| E339 | [Force Action](actors-battle.md#e339--force-action) | 静态参数证据已列；真实验收待执行 |
| E340 | [Abort Battle](actors-battle.md#e340--abort-battle) | 静态参数证据已列；真实验收待执行 |
| E342 | [Change Enemy TP](actors-battle.md#e342--change-enemy-tp) | 静态参数证据已列；真实验收待执行 |
| E351 | [Open Menu Screen](actors-battle.md#e351--open-menu-screen) | 静态参数证据已列；真实验收待执行 |
| E352 | [Open Save Screen](actors-battle.md#e352--open-save-screen) | 静态参数证据已列；真实验收待执行 |
| E353 | [Game Over](actors-battle.md#e353--game-over) | 静态参数证据已列；真实验收待执行 |
| E354 | [Return to Title Screen](actors-battle.md#e354--return-to-title-screen) | 静态参数证据已列；真实验收待执行 |
| E355 | [Script](core.md#e355--script) | 静态参数证据已列；真实验收待执行 |
| E356 | [Plugin Command](core.md#e356--plugin-command) | 静态参数证据已列；真实验收待执行 |

## 移动子指令完整索引

| code | 参数报告 | 状态 / 跟踪项 |
| --- | --- | --- |
| M1 | [moveDown](movement.md#m1--movedown) | 参数已列；路线外壳待决（S2） |
| M2 | [moveLeft](movement.md#m2--moveleft) | 参数已列；路线外壳待决（S2） |
| M3 | [moveRight](movement.md#m3--moveright) | 参数已列；路线外壳待决（S2） |
| M4 | [moveUp](movement.md#m4--moveup) | 参数已列；路线外壳待决（S2） |
| M5 | [moveLowerLeft](movement.md#m5--movelowerleft) | 参数已列；路线外壳待决（S2） |
| M6 | [moveLowerRight](movement.md#m6--movelowerright) | 参数已列；路线外壳待决（S2） |
| M7 | [moveUpperLeft](movement.md#m7--moveupperleft) | 参数已列；路线外壳待决（S2） |
| M8 | [moveUpperRight](movement.md#m8--moveupperright) | 参数已列；路线外壳待决（S2） |
| M9 | [moveRandom](movement.md#m9--moverandom) | 参数已列；路线外壳待决（S2） |
| M10 | [moveTowardPlayer](movement.md#m10--movetowardplayer) | 参数已列；路线外壳待决（S2） |
| M11 | [moveAwayFromPlayer](movement.md#m11--moveawayfromplayer) | 参数已列；路线外壳待决（S2） |
| M12 | [moveForward](movement.md#m12--moveforward) | 参数已列；路线外壳待决（S2） |
| M13 | [moveBackward](movement.md#m13--movebackward) | 参数已列；路线外壳待决（S2） |
| M14 | [jump](movement.md#m14--jump) | 参数已列；路线外壳待决（S2） |
| M15 | [wait](movement.md#m15--wait) | 参数已列；路线外壳待决（S2） |
| M16 | [turnDown](movement.md#m16--turndown) | 参数已列；路线外壳待决（S2） |
| M17 | [turnLeft](movement.md#m17--turnleft) | 参数已列；路线外壳待决（S2） |
| M18 | [turnRight](movement.md#m18--turnright) | 参数已列；路线外壳待决（S2） |
| M19 | [turnUp](movement.md#m19--turnup) | 参数已列；路线外壳待决（S2） |
| M20 | [turn90Right](movement.md#m20--turn90right) | 参数已列；路线外壳待决（S2） |
| M21 | [turn90Left](movement.md#m21--turn90left) | 参数已列；路线外壳待决（S2） |
| M22 | [turn180](movement.md#m22--turn180) | 参数已列；路线外壳待决（S2） |
| M23 | [turn90RightOrLeft](movement.md#m23--turn90rightorleft) | 参数已列；路线外壳待决（S2） |
| M24 | [turnRandom](movement.md#m24--turnrandom) | 参数已列；路线外壳待决（S2） |
| M25 | [turnTowardPlayer](movement.md#m25--turntowardplayer) | 参数已列；路线外壳待决（S2） |
| M26 | [turnAwayFromPlayer](movement.md#m26--turnawayfromplayer) | 参数已列；路线外壳待决（S2） |
| M27 | [switchOn](movement.md#m27--switchon) | 参数已列；路线外壳待决（S2） |
| M28 | [switchOff](movement.md#m28--switchoff) | 参数已列；路线外壳待决（S2） |
| M29 | [changeSpeed](movement.md#m29--changespeed) | 参数已列；路线外壳待决（S2） |
| M30 | [changeFrequency](movement.md#m30--changefrequency) | 参数已列；路线外壳待决（S2） |
| M31 | [walkAnimation On](movement.md#m31--walkanimation-on) | 参数已列；路线外壳待决（S2） |
| M32 | [walkAnimation Off](movement.md#m32--walkanimation-off) | 参数已列；路线外壳待决（S2） |
| M33 | [stepAnimation On](movement.md#m33--stepanimation-on) | 参数已列；路线外壳待决（S2） |
| M34 | [stepAnimation Off](movement.md#m34--stepanimation-off) | 参数已列；路线外壳待决（S2） |
| M35 | [directionFix On](movement.md#m35--directionfix-on) | 参数已列；路线外壳待决（S2） |
| M36 | [directionFix Off](movement.md#m36--directionfix-off) | 参数已列；路线外壳待决（S2） |
| M37 | [through On](movement.md#m37--through-on) | 参数已列；路线外壳待决（S2） |
| M38 | [through Off](movement.md#m38--through-off) | 参数已列；路线外壳待决（S2） |
| M39 | [transparent On](movement.md#m39--transparent-on) | 参数已列；路线外壳待决（S2） |
| M40 | [transparent Off](movement.md#m40--transparent-off) | 参数已列；路线外壳待决（S2） |
| M41 | [changeImage](movement.md#m41--changeimage) | 参数已列；路线外壳待决（S2） |
| M42 | [changeOpacity](movement.md#m42--changeopacity) | 参数已列；路线外壳待决（S2） |
| M43 | [changeBlendMode](movement.md#m43--changeblendmode) | 参数已列；路线外壳待决（S2） |
| M44 | [playSe](movement.md#m44--playse) | 参数已列；路线外壳待决（S2） |
| M45 | [script](movement.md#m45--script) | 参数已列；路线外壳待决（S2）；单槽文本边界B3 |

M0为结构终止而非第46个公开移动指令。事件code0、401/405/408/655续行、402/403/404、411/412/413、601/602/603/604、605和505均按各自父记录在上述分片覆盖，不遗漏也不重复计为独立helper。

## 验收责任与研究完成条件

研究交付物是证据、完整覆盖和可跟踪前置；“原生指令逐参数契约还缺哪些证据”可在此结果与后续决策依赖记录后完成，但实施规格仍受保存形态与支持边界两票阻塞。

[如何证明 MV 事件支持完整并划定实施顺序](../../issues/08-completion-evidence-and-sequencing.md)承接全部分片的正负fixture与真实样本设计，至少包括：三类事件容器；所有模式及枚举；None/非激活参数；四种文本行组边界；新建/容器重存/参数重确认；镜像/尾0/route外壳；上下文和递归Gate/引用；真实Workspace反编译到push与失败隔离。不得先过滤保存差异再比较。

REA本次确实使用Ghidra分析编辑器附带Qt插件，证据已导出、session已关闭。研究发布只含原创Markdown；不提交目标EXE/DLL、游戏资产、runtime源码或完整反编译输出。本研究没有测试通过声明，无法以覆盖数量替代最终验收。

## 本轮文档核验

- 对照既有原库存，E类105码及M类1..45完全一致，未遗漏或重复。
- 五个证据分片共195条EXE资源身份行（跨报告重复引用分别计）已逐条对原始字节解码核对offset、stored、encoding、decoded长度及SHA-256；无不符。DLL SpinBox资源和runtime身份另作独立核对。
- 全部212个相对Markdown链接及带片段链接已核对文件和标题；三个研究代理交叉复核参数/结构/来源，没有遗留已发现的报告错误。
- 修正M44正式audio.asset与原生name的区分，并把Battle非空子体尾0明确关联到S3前置。上述是研究文档校验，不是产品或真实运行测试。
