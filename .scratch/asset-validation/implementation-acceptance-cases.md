# 素材检查实施验收子用例索引

所属规格：[事件素材文件存在性检查实施规格](asset-validation-spec.md)
规范预期：[已接受的验收矩阵](acceptance-matrix.md)
建立日期：2026-10-24
修订日期：2026-11-03（保留 2026-11-02 收缩后的现行预期；补记技术验收状态）

本附件为当前首版的 86 个有效用例族分配子用例标识、fixture 和执行入口；另列 11 个延后族。**当前有限 ID 的技术验收已在冻结提交 `403b39aa` 的 Windows / Node.js 22 环境完成，维护者最终审阅仍待完成；延后族不展开为首版验收。** [当前回执](../asset-validation-implementation/evidence/14-current-acceptance/README.md)记录源码与构建后实际运行、逐 ID 清单及保留原生证据。以下事实预期来自已决契约，不能由产品收集器、判定器或诊断策略生成。

## 标识、公共输入与回执

完整标识为 `AV.<族>.<分支>.<表示>.<字段>.<结果>`。表中逗号分隔的值须逐个展开，斜线只在正文中描述关系；多列均有备选值时取表内明确要求的组合，不能任选代表值。没有适用维度时使用 `base`、`native`、`case`、`expected` 四个固定默认值。每格列出的 token 是确定值，不是让实施方日后再选择的占位符；表明只配对的场景不做无意义笛卡尔积。

例如直接显示图片缺失的两个实例是 `AV.A07.base.formal.p1.missing` 和 `AV.A07.base.raw.p1.missing`；它们分别对照独立预期。页图像无 raw 命令实例；自主移动也不虚构 raw 页或未知移动指令接口。新增回归用例沿族追加唯一分支。此次尚未实施的设计修订保留族 ID，撤销的分支不再是实施要求；延后族不要求用其他新增分支凑齐原数目。

公共输入与规则：

- Windows / Node.js 22 的真实临时 Workspace 和普通 MV 编辑项目，根含中文与空格；沿用现有 Windows sandbox 的版本断言及进程记录。所有必要标准文件、固定引用和事件结构合法。
- Map 1 为宿主；Map 2 及其初始化字段仅用于传送关系未纳入的范围反例。Map Event 1、Common Event 10 与 11、Troop Event 1 提供当前独立根。Actor 1、Enemy 1／2、Troop 1、Skill 1／2／3、Animation 1／2 为固定条目；只启用当前用例所需关系，其他字段使用合法最小值。
- Animation 2 用于显式选择，含两张不同名图和两个不同名 timing SE；不为正常检查补充空手 Animation 1 素材。Tileset 至少区分各合法槽，全部非空槽使用不同名文件。Troop 的两个成员分别为普通和 hidden，重复成员变体另设；Skill 1 有正动画与两个 Common Event effects，Skill 2 为默认攻击，Skill 3 的动画为 0。
- System 只提供所需 optSideView、标题与 gameoverMe 等当前关系字段；sounds 槽 7／9 和战斗默认音频不构成素材必需输入；未被选中的字段可以另用有意损坏值证明不解释它们。普通文件默认准确存在，加密标志为 false。每个到达字段的素材名由用例标识与字段标记组成，基本变体之间不共享文件。
- A／B 的 `present` 变体全部所需文件存在；`missing` 只删除当前字段的文件，其余字段仍正常。多次使用同名、同目标不同级别等只在专门的共享用例中构造。
- A／B 的普通使用缺失为 error；明确非活动由 C／D 另测。原生执行条件本身不使普通使用降级。
- 每个 A／B 实例核对完整使用集合、原名、类别、具体保存位置、事件内链、必要条件及诊断，而非只检查一个 expected message。所有失败都核对各操作允许改变和必须保持的文件／同步状态。
- 自动化可从独立用例数据与执行结果生成回执，避免另建重复手工台账；每个回执记录完整 ID、上游族及决策出处、具体输入／字段、时机、独立预期、实际结果、环境、方式、责任和证据位置。自动化由实施方执行；N 组由实施方准备并尽可能执行，必要人工由维护者执行，最终验收由维护者确认。

## A. 直接使用：18 族

结果列均展开 `present,missing`。A02–A16 用 Map Event 的普通命令位置作为基本容器，`formal,raw` 分别对照相同的独立原生字段预期；其他容器及嵌套覆盖由 C01。raw 路线是合法 205／505 成组记录，遵守既有镜像检查，不添加 raw 移动指令类型。

| 族 | 分支 token | 表示 token | 字段 token／对应位置 | 预期补充 |
| --- | --- | --- | --- | --- |
| A01 | base | page | characterName | 页图像名称；无 raw 页 |
| A02 | base | formal,raw | p0 | 101 脸图 |
| A03 | base | formal,raw | p0-name | 132 BGM |
| A04 | base | formal,raw | p0-name | 133 ME |
| A05 | base | formal,raw | p0-name | 139 ME |
| A06 | base | formal,raw | p1-name | 140 载具 BGM |
| A07 | base | formal,raw | p1 | 231 图片 |
| A08 | base | formal,raw | p0-name | 241 BGM |
| A09 | base | formal,raw | p0-name | 245 BGS |
| A10 | base | formal,raw | p0-name | 249 ME |
| A11 | base | formal,raw | p0-name | 250 SE |
| A12 | base | formal,raw | p0 | 261 影片 |
| A13 | base | formal,raw | p0,p1 | 283 两层背景分别存在／缺失 |
| A14 | base | formal,raw | p0 | 284 远景 |
| A15 | base | formal,raw | p1,p3,p5 | 322 三种图像分别存在／缺失 |
| A16 | base | formal,raw | p1 | 323 行走图 |
| A17 | autonomous,set-route | page（仅 autonomous）；formal,raw（仅 set-route） | p0 | 路线 41；两个容器分别验证 |
| A18 | autonomous,set-route | page（仅 autonomous）；formal,raw（仅 set-route） | p0-name | 路线 44；两个容器分别验证 |

## B. 间接使用：7 个有效族

结果列均展开 `present,missing`；表示展开 `formal,raw`，从对应事件入口分别生成合法表达。字段 token 标记到达的独立字段；Animation 的图与两个 SE、Tileset 的全部非空槽分别验证，不能只测其中之一。多个入口或条件按下表的有限分支展开。

| 族 | 分支 token | 字段 token／到达关系 | 预期补充 |
| --- | --- | --- | --- |
| B01 | show-animation,show-battle-animation | image1,image2,se0,se1 | 两个入口分别验证；SE 条目位置独立，保留预加载／按帧条件 |
| B02 | change-tileset | slot0,slot1,slot2,slot3,slot4,slot5,slot6,slot7,slot8 | 整组全部非空槽；另由 C04／D09 类共享断言保证同名来源保留 |
| B03 | front,side | member0-battler,member1-battler | member1 为 hidden；目录只取对应模式，成员不被过滤 |
| B04 | front,side | transformed-battler | 指定新 Enemy；目标是否实际存在不改变保存关系 |
| B05 | positive-animation | image1,image2,se0,se1 | 固定 Skill 正动画，链含 Skill 与 Animation；0 和默认攻击边界另由 C05／C06／C12 验证 |
| B11 | game-over | gameover-me | 只选系统 ME |
| B12 | return-title | title1,title2,title-bgm | 各字段独立；不展开标题 UI |

B02 使用上述九个非空槽的合法基础 Tileset；C06 另证明合法空槽不查询。关系若在当前测试表达中已由完整原生结构验证拒绝，不得靠坏 fixture 使本组“缺文件”变成提前引用错误。

## C. 起点与范围：13 族

本组结果统一为 `expected`。未另外列出时表示使用 `formal`，字段使用 `case`；C11 的 recognized-raw 分支表示 raw，其他未知负载采用它们既有合法表达。每个分支独立执行，不是要求一个大项目同时包含所有反例。

| 族 | 确定分支 token | 输入与预期 |
| --- | --- | --- |
| C01 | map-pages,common-uncalled,troop-pages,nested-choice,nested-loop | 三类当前根、多个页及嵌套体均有可定位使用；普通缺失 error；不依赖运行可达性 |
| C02 | removed-map,removed-common,reset-troop | 旧快照保留缺图但当前已移除；不补回素材根，不改变删除／重置规则 |
| C03 | route-mirror,independent-command,repeated-command | 205／505 关联一次，另一真实命令位置独立；新操作不累积历史来源；图像和 SE 字段分别为 image,se |
| C04 | two-callers,common-independent-root,repeated-enemy,repeated-tileset-name,repeated-common-effect | 公共事件只报告定义使用，不提供 caller／effect 边；成员／槽的真实不同路径各自保留；查询可共享 |
| C05 | self-cycle,mutual-cycle,shared-callers,dynamic-troop,default-attack | 循环／共享仅按当前定义检查，无递归展开或循环诊断；动态敌群及默认攻击保留未检查原因，不猜素材 |
| C06 | none-direct,none-indirect,zero-skill-animation,default-page-image,default-page-route,saved-audio-controls,saved-image-index | none-direct 展开 A 表原生允许的 None 编码；none-indirect 仅展开当前 B 表允许空名的动画图／SE、Tileset、Enemy、System 字段；正技能动画为 0 时不查询动画；不把缺字段当空值；独立保存参数保留 |
| C07 | target-missing,field-missing,field-wrong-type,field-empty,file-missing | 字段问题／合法空／缺文件对 B 表到达字段分别变体；target-missing 只用于有固定数据库目标的关系，System 直接保存字段使用 field-missing，不虚构固定引用；只损坏当前关系必要位置，非法空编码仍按原输入规则失败 |
| C08 | route-fixed,route-random,route-approach,tile-with-character,false-page-condition,unreached-branch | 前四种明确非活动保存字段按政策 warning；页条件／分支推演不降级。已延后 Map 初始化字段不纳入 |
| C09 | actor-hp,vehicle-position | 只做所述操作，无额外角色图像、载具图像／BGM、倒下副作用素材检查 |
| C10 | unrelated-actor,unrelated-animation,unrelated-field,troop-host-only | 不扫描未选条目／字段，不以 Troop Event 身份引出宿主所有 Enemy 图片 |
| C11 | script-command,route-script,plugin-command,unknown-raw,recognized-raw | 未知字符串不猜素材；recognized raw 同规则；已存在 Script Gate／结构失败不被例外绕过 |
| C12 | plugin-declaration,enemy-ai,initial-equipment,transfer-network,hardcoded-system,terrain-background,battle-test-background,actor-default-attack,enemy-default-attack,transfer-initial-assets,page-initial-tileset,actor-initial-images,battle-default-audio,battle-map-background | 未选关系缺素材不新增素材查询，且本检查不解释不再必要的字段；默认攻击保留未检查原因。既有引用／结构验证保持，直接素材覆盖另由 A 表保证 |
| C13 | check-success,check-failure,push-success | 外部标准条目、自定义字段和名称保留；素材树不复制／写入／备份；Push 仅允许既有 owned data 改变 |

C06／C07 的到达字段映射固定来自上方 A／B 表，并在完整标识的字段段中用连字符拼接族、分支及字段，例如 `AV.C07.field-wrong-type.formal.B01-show-animation-image1.expected`。对尚未到达文件的引用错误，不伪造目录查询预期。规则覆盖与表现组合分开：C06 用正式表达验证合法 None，A／B 已分别保证正式／raw 正常与缺失，C11 额外验证 raw 不绕过政策。

## F. 文件事实：14 族

本组字段固定为 `case`、结果为 `expected`，表示为 `filesystem`、`input` 或 `injected`，按表所列。真实 Windows 能力受限分支必须留未执行，不由注入结果替代。

| 族 | 分支 token | 表示与预期 |
| --- | --- | --- |
| F01 | image,bgm,bgs,me,se,movie | filesystem；准确 PNG／OGG／WebM 普通文件通过，类别覆盖再由 A／B 保证 |
| F02 | audio-m4a-only,movie-mp4-only,image-encrypted-only,audio-encrypted-only,other-only,exact-plus-alternative | filesystem；替代不满足，准确目标与其他格式并存通过 |
| F03 | top-directory-case,category-directory-case,stem-case,extension-case,exact-plus-case-variant,multiple-case-variants | filesystem；每一级准确匹配；无准确项名称不符，有准确项通过；并存能力不足保留未执行 |
| F04 | chinese,space,whitespace-only,dot,dollar,bang,trailing-space-stem,trailing-dot-stem | filesystem；原值追加后缀，非空空白不当 None；不修复名字 |
| F05 | double-extension,unicode-distinct | filesystem；已有后缀仍追加；规范等价字符串不替代准确项 |
| F06 | image-percent,image-hash,audio-percent,audio-hash,literal-percent20,movie-percent,movie-hash | image-percent、image-hash、literal-percent20（图片）及两个 movie 分支为 input：不支持且查询前拒绝；两个 audio 分支为 filesystem：按原名字面查询，不 URL 解码 |
| F07 | slash,backslash,absolute,drive-relative,parent-traversal,forbidden-character,control-character,device-name,device-name-extension,device-name-case | input；不支持名称、不穿越查询；forbidden-character 子字段逐一枚举普通 Windows 禁止字符，control-character 为 U+0000–U+001F，device 三支按决策票首方保留设备名清单逐项构造，不用单个 NUL 代表全集 |
| F08 | missing-category,missing-file,directory-is-file,file-is-directory | filesystem；分别辨认原因与具体位置 |
| F09 | root-alias,top-symlink,category-junction,file-symlink,link-in-root,link-outside-root,dangling-link | filesystem；root-alias 沿既有规则；根以下拒绝且目标不可被访问，目标位置与存在性不改变拒绝 |
| F10 | hard-link,zero-byte,metadata-only | 前二为 filesystem，metadata-only 为 injected；普通文件可通过；受控拒绝内容读取边界证明产品没有 open／read 媒体要求，不冒充真实 ACL |
| F11 | enumerate-denied,metadata-denied,io-failure | injected；无法检查而非缺失，独立路径继续 |
| F12 | disappears-after-enumeration,type-changes-during-query | injected；查询内矛盾无法确认，不能改成稳定缺失 |
| F13 | images-absent,images-false,images-true,images-null,images-number,images-string,audio-absent,audio-false,audio-true,audio-null,audio-number,audio-string | input；只解释相应有使用类别；absent／false 普通，true 不支持，即使普通文件存在；其他为必要字段错误 |
| F14 | no-images-use,no-audio-use,movie-only,no-www-fallback,no-other-root | input 加 filesystem；无关标志不解释，不切换资源根 |

F07 的字符和设备名实例把具体 Unicode 编号／设备名追加到字段 token，名称大小写及带后缀的实例分支明确区分。设备名枚举为 CON、PRN、AUX、NUL、COM1–COM9、LPT1–LPT9、COM¹／COM²／COM³、LPT¹／LPT²／LPT³，独立转录自文件判定决定的首方列表。禁止字符枚举为小于号、大于号、冒号、双引号、斜线、反斜线、竖线、问号、星号；控制字符为 U+0000–U+001F。不能导入产品验证函数或常量作为预期；本族不以非法名称真的能在磁盘创建为前提。

## D. 诊断与例外：9 个有效族

结果固定 `expected`，字段为问题事实或配置项。普通／非活动使用各自核对基础和有效级别。以真实 Workspace 编译及内部来源预期相互支持；D10 全部经实际 CLI。

| 族 | 分支 token 与有穷组合 | 预期 |
| --- | --- | --- |
| D01 | ordinary,inactive-route,inactive-page-character × missing,name-mismatch,wrong-type | ordinary 为 error，其余为 warning；按下方真实表示配对，不虚构 raw 页或候选类型 |
| D02 | unsupported-name,unsupported-link,encrypted,required-field,unqueryable,inconsistent × ordinary,inactive,exception | 前三类在 inactive 为 warning + 未检查，ordinary／exception（普通使用加例外）为 error；其余全部 error。另设 reference-error、structure-error、script-gate 保留既有错误；inconsistent 限单次查询 |
| D03 | eligible × missing,name-mismatch,wrong-type；exact-namespace,case-distinct,space-distinct,suffix-distinct,encoding-distinct | 三类 error 可降级并保留原因；同目标 formal／raw／间接多来源均生效；不同准确键不误匹配 |
| D04 | invalid-category,invalid-folder,category-folder-mismatch,empty-name,missing-name,missing-reason,blank-reason,duplicate,unknown-field | 配置 error，指出配置项，不最后覆盖；后续检查未运行不得写成通过 |
| D06 | mixed-levels,multiple-files,shared-file-locations | 分组取最高有效级别，各处级别／来源保留且排序稳定；不要求三套计数或人工构造同文件多组输入 |
| D07 | shared-directory-failure,shared-field-failure,invalid-target | 共同失败关联所有来源，无合法目标不制造路径或已确认缺失文件 |
| D08 | independent-results,early-config,early-structure,early-reference | 独立错误／warning 均保留；早期输入不可信明确未运行，不强求穷尽 |
| D09 | map-page,nested-body,route,common-definition,shared-file,reliable-source,unknown-source | 定义位置和事件内链可核对；公共事件无 caller 输出要求；可靠源码才给行列 |
| D10 | cli-error,cli-warning,cli-exception,cli-dynamic,cli-unchecked-warning,cli-query-failure | 非活动支持范围 warning 明确未检查且可成功，查询失败 error；退出与全部定义来源符合政策 |

### D01 的表示约束

ordinary 的表示展开 `direct-formal,direct-raw,indirect-formal,indirect-raw`；inactive-route 与 inactive-page-character 均使用 `page`，分别采用非 custom 自主路线和图块页保留的 characterName。缺失／名称不符／类型不符作为字段 token；不虚构 raw 页、直接候选或已延后的传送地图音频关系。raw 一致性由 ordinary 和 A 表覆盖。

## W. 工作流：20 族

真实操作子进程与文件树为主要入口，字段为 `case`、结果为 `expected`。除 W01 已特别指定外，每个分支至少用 API 执行精确状态断言；W02–W08、W13、W15、W20 还必须把每行列出的第一个分支经真实 CLI 重复执行，使用表示 token `api`／`cli` 分别记录。正常 CLI 路径由 W01 的 success 组合及这些序列的正常准备操作覆盖；其余变化分支以 API 加 D10 补充展示覆盖。W13 的 source 分支保留 prewrite、postwrite 两个 CLI 边界。

| 族 | 确定分支 token | 时机与最终状态预期 |
| --- | --- | --- |
| W01 | initial,fresh,stale × success,error,warning | 表示 api,cli；Check 不发布、不刷新 Manifest／Freshness、不写项目 |
| W02 | delete-before-gate,repair-before-gate,delete-after-check,stable-warning | Check 唯一素材门槛前按当前事实判定；检查后到返回不再查询素材，下次命令可失败；Check 只读 |
| W03 | error-at-gate,repair-before-gate | Compile 门槛 error 不发布；门槛前修复可成功，不产生变化错误；项目不写 |
| W04 | delete-after-check-before-manifest,publication-io-failure | 素材检查后删图不追加扫描且可成功发布；独立 I/O 失败仍按原无效状态边界处理 |
| W05 | error-after-staging,repair-after-staging | 暂存后的唯一素材门槛按当前事实判定；error 不替换、不创建本次 pending；补齐可通过 |
| W06 | delete-after-writes,type-change-after-writes | data 写后只改素材，不追加扫描，正常完成记账且无 pending；再运行无差异 Push 按当前事实失败 |
| W07 | no-diff-asset-error,no-diff-data-drift | 无差异也检查；单纯素材错误无 pending；标准漂移仍优先拒绝 |
| W08 | delete-diff-push-repair | 同一序列：Compile 后删图，Diff 不查；Push 失败，补图后其他输入未变可直接重试 |
| W09 | animation-rename-unpulled,tileset-rename-unpulled,after-pull-recompile | 旧快照用于 Compile，Push 漂移拒绝；Pull 失效旧输出，重编译用新名 |
| W10 | content,size,mtime,file-identity,unrelated-directory-entry | 必要存在性事实不变，操作不因这些变化失败；不读媒体内容 |
| W11 | presence,case-match,path-type,path-link,queryability,failure-location,improvement | 每支在素材查询开始前制造变化；字段 check-gate,compile-gate,push-gate，分别只判断当前事实；改善可成功，允许 warning 也可成功，无跨点比较；查询内失败归 F12 |
| W12 | same-pass-reuse,next-command-fresh | 多定义位置与局部链保留；新命令取得当前事实，不读历史成功缓存、不重复镜像或调用路径、不锁定 syscall 次数 |
| W13 | source,validation-dependency,config,exception,snapshot,generated,binding | 各分支在 Push 写前及记账前分别变更（字段 prewrite,postwrite）；停止或 pending，不半途采用新输入，合法自身写入不误判 |
| W14 | exception-change,pull,rebind,contract-change,check-does-not-refresh | 基线过期需重编译；Check／恢复／素材通过不能升级旧输出；根别名规则保留 |
| W15 | all-generated-missing-asset,all-snapshot,mixed,missing,unknown | 全生成可完成记账后当前失败而不重新留 pending；全旧放弃后正常检查；其他拒绝自动恢复 |
| W16 | stale-original-basis,changed-current-config | 恢复保留原依据；当前 freshness／drift／素材分别判断，不获得新写权限 |
| W17 | clone,pull,decompile,diff | 缺素材不新增文件门槛，原有数据／表达／新鲜度规则保持 |
| W18 | concurrent-workspace,pending-non-push,pending-rebind | 互斥与原绑定恢复保持，不新增跨 Workspace 协调 |
| W19 | compile-success,compile-failure,push-success,push-failure,recovery | 仅允许各操作的数据／元数据变更；素材不进快照、备份、复制、写入，必要字段只读 |
| W20 | generated-roots-and-relations,no-dsl-reevaluation,no-historical-report | 从生成事件重建定义内使用及局部链；共享／循环仅按定义根检查，排除旧快照移除根；哨兵证明不重求值 DSL；新命令实际查询 |

W11 的变化发生在唯一素材门槛的查询开始前，不构造并不存在的首轮素材检查；改善分支可从缺失恢复到准确文件，按当前事实通过。W04／W06 则在素材检查后只改素材，用于证明不做后续复查。W13 的改动不混淆当前绑定项目与其他项目。W15／W16 保留独立构造的 pending 证据及真实 data 中断先例；pending 不能由写后素材变化制造，仍需覆盖原有数据恢复条件，不能调用被测恢复决策生成预期状态。

## N. 原生必验：5 个有效族

表示固定 `native-run`，字段为 `case`，结果为 `observed`。所有项要求版本、输入、请求／文件定位和证据。N01／N02 的当前支持域已有[实际运行与政策对账](../asset-validation-implementation/evidence/01-native-media/policy-resolution-2026-11-02.md)；N03–N05 的旧分支证据须由最终票按现行范围核对，不能据旧票号自动宣布通过。真实有效自制媒体用于观察，不能把自动化空文件拿来判断原生解码行为。

| 族 | 确定分支 token | 必须记录的事实 |
| --- | --- | --- |
| N01 | image-png,audio-ogg,movie-webm | 代表性原生目录、追加扩展名与磁盘定位；不从播放结果推导全面保证 |
| N02 | chinese,space,audio-percent,audio-hash | 支持范围内原始名称到请求及实际文件的映射，区分 URL 编码与文件名；audio-percent 包含看似编码的 `%20` 样本；历史图片分支保留原失败／成功事实，不属当前通过义务 |
| N03 | animation-images,animation-timing-se | 双图与逐时机 SE 消费来源及条件，区分预加载与实际帧播放 |
| N04 | change-tileset | 整组非空图片的消费来源与文件定位；区分地图绘制附带请求；旧 page-tile 分支延后 |
| N05 | enemy-front,enemy-side | 同一 Enemy 在两种模式的原生目录选择 |

## 覆盖与执行交接

当前有效表包含 A 18、B 7、C 13、F 14、D 9、W 20、N 5，共 86 个族；与修订矩阵逐族对应。另有 11 个旧族延后，N04 页图块和跨族旧要求也已移除。完整子用例标识由上述有限展开唯一确定。现行自动化测试已将其写入测试名称与[逐 ID 回执](../asset-validation-implementation/evidence/14-current-acceptance/id-receipts.json)：源码和构建后运行各包含 895 个相同、互不重复的 `AV.` ID，81 个自动化有效族的有限 ID 无缺口；N01–N05 的 12 个当前原生 ID 由历史真实运行证据与最终代码对账支持。参数化组织及共用 fixture 不减少本次修订后仍列出的字段、分支或指定边界。已撤销的跨点比较、候选检查、直接／传递 caller 报告、三套统计和未生效例外告警不再执行。

类别组合、控制字符、合法空字段等枚举须独立按上游契约转录；该转录是测试数据准备，不是新增政策。因能力不足未执行的真实案例仍须保留缺口并安排补验；本次冻结运行没有当前保留分支未执行或 skip。各项实际状态、证据及反例处理见[当前回执](../asset-validation-implementation/evidence/14-current-acceptance/README.md)，最终完成状态仍取决于维护者审阅确认。

## 延后范围与旧 ID

下列 11 个族保留 ID 追溯，状态为“延后，不属于首版”，不展开执行、不作为首版验收缺口，也不计为通过或环境 skip。后续纳入时需重新确定契约及预期。

| 旧族 ID | 延后内容 |
| --- | --- |
| B06–B07 | 角色／敌人默认攻击素材 |
| B08 | 固定传送目标地图的初始化素材 |
| B09–B10 | 页图块初始 Tileset、Actor 初始图像候选 |
| B13–B14 | 战斗系统音频与宿主地图背景 |
| B15–B16 | 公共事件直接调用报告、Skill effects 调用关系；目标公共事件仍按 C01 独立检查 |
| D05 | 合法例外未实际产生降级的告警 |
| N06 | 初始候选被运行时覆盖的原生核对 |

N04 仅保留 Change Tileset，旧 page-tile 分支延后。C／D／W 中的候选、caller 输出、三套精确统计及未生效例外告警分支已从现行表移除；保留的循环／共享调用输入只证明各事件按独立根检查，不要求调用图。C12 验证延后关系不意外产生素材查询，既有引用／结构校验继续执行。
