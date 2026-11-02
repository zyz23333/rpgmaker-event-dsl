# 素材检查实施验收子用例索引

所属规格：[事件素材文件存在性检查实施规格](asset-validation-spec.md)
规范预期：[已接受的验收矩阵](acceptance-matrix.md)
建立日期：2026-10-24
修订日期：2026-11-02（沿用 2026-10-25 设计减重，并落实维护者确认的图片 `%`／`#` 排除；以下现行预期取代旧版本）

本附件为已接受的 97 个用例族分配有穷的子用例标识、fixture 和执行入口，供实施时逐项落实。**本索引定义现行义务，实际执行状态及证据见各实施票；索引自身不代表通过。** 以下事实预期来自已决契约，不能由产品收集器、判定器或诊断策略生成。

## 标识、公共输入与回执

完整标识为 `AV.<族>.<分支>.<表示>.<字段>.<结果>`。表中逗号分隔的值须逐个展开，斜线只在正文中描述关系；多列均有备选值时取表内明确要求的组合，不能任选代表值。没有适用维度时使用 `base`、`native`、`case`、`expected` 四个固定默认值。每格列出的 token 是确定值，不是让实施方日后再选择的占位符；表明只配对的场景不做无意义笛卡尔积。

例如直接显示图片缺失的两个实例是 `AV.A07.base.formal.p1.missing` 和 `AV.A07.base.raw.p1.missing`；它们分别对照独立预期。页图像无 raw 命令实例；自主移动也不虚构 raw 页或未知移动指令接口。新增回归用例沿族追加唯一分支。此次尚未实施的设计修订保留族 ID，撤销的分支由下表的新分支替代；旧版本分支不再是实施要求。

公共输入与规则：

- Windows / Node.js 22 的真实临时 Workspace 和普通 MV 编辑项目，根含中文与空格；沿用现有 Windows sandbox 的版本断言及进程记录。所有必要标准文件、固定引用和事件结构合法。
- Map 1 为宿主、Map 2 为传送目标；各有自己的 Tileset。Map Event 1、Common Event 10 与 11、Troop Event 1 提供当前独立根。Actor 1、Enemy 1／2、Troop 1、Skill 1／2／3、Animation 1／2 为固定条目；只启用当前用例所需关系，其他字段使用合法最小值。
- Animation 1 用于空手候选，Animation 2 用于显式选择；两者各有两张不同名图和两个不同名 timing SE。Tileset 至少区分各合法槽，全部非空槽使用不同名文件。Troop 的两个成员分别为普通和 hidden，重复成员变体另设；Skill 1 有正动画与两个 Common Event effects，Skill 2 为默认攻击，Skill 3 的动画为 0。
- System 提供所需 optSideView、标题、BGM／ME 及 sounds 槽 7／9；未被选中的字段可以另用有意损坏值证明不解释它们。普通文件默认准确存在，加密标志为 false。每个到达字段的素材名由用例标识与字段标记组成，基本变体之间不共享文件。
- A／B 的 `present` 变体全部所需文件存在；`missing` 只删除当前字段的文件，其余字段仍正常。多次使用同名、同目标不同级别等只在专门的共享用例中构造。
- A／B 的普通使用缺失为 error；明确标注的候选为 warning，明确非活动由 C／D 另测。原生执行条件本身不把普通使用改成候选。
- 每个 A／B 实例核对完整使用集合、原名、类别、具体保存位置、事件内链、直接调用关系、条件及诊断，而非只检查一个 expected message。所有失败都核对各操作允许改变和必须保持的文件／同步状态。
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

## B. 间接使用：16 族

结果列均展开 `present,missing`；除 B09 使用 page 外，表示展开 `formal,raw`，从对应事件入口分别生成合法表达。字段 token 标记到达的独立字段；Animation 的图与两个 SE、Tileset 的全部非空槽分别验证，不能只测其中之一。多个入口或条件按下表的有限分支展开。

| 族 | 分支 token | 字段 token／到达关系 | 预期补充 |
| --- | --- | --- | --- |
| B01 | show-animation,show-battle-animation | image1,image2,se0,se1 | 两个入口分别验证；SE 条目位置独立，保留预加载／按帧条件 |
| B02 | change-tileset | slot0,slot1,slot2,slot3,slot4,slot5,slot6,slot7,slot8 | 整组全部非空槽；另由 C04／D09 类共享断言保证同名来源保留 |
| B03 | front,side | member0-battler,member1-battler | member1 为 hidden；目录只取对应模式，成员不被过滤 |
| B04 | front,side | transformed-battler | 指定新 Enemy；目标是否实际存在不改变保存关系 |
| B05 | positive-animation | image1,image2,se0,se1 | 固定 Skill 正动画，链含 Skill 与 Animation |
| B06 | actor-default | image1,image2,se0,se1 | Animation 1 候选，缺失 warning，当前武器分支停止记录同时保留 |
| B07 | enemy-default | sound9 | 敌人默认攻击 SE；不是动画 |
| B08 | transfer-fixed | slot0,slot1,slot2,slot3,slot4,slot5,slot6,slot7,slot8,parallax,bgm,bgs | 固定 Map 关系；普通保存值，保留 autoplay／覆盖条件，不引入 battleback |
| B09 | tile-b,tile-c,tile-d,tile-e | selected-slot | 表示为 page；合法 tileId 分别选择 B–E 的一张图，均为候选，不展开整组 |
| B10 | add-actor | character,battler | 两个初始候选；独立保留侧视／队员／覆盖条件，不加入 face |
| B11 | game-over | gameover-me | 只选系统 ME |
| B12 | return-title | title1,title2,title-bgm | 各字段独立；不展开标题 UI |
| B13 | battle-system | battle-bgm,victory-me,defeat-me,start-se | 前三者候选；start-se 为槽 7 且保留地图启动条件 |
| B14 | map-battle-background | battleback1,battleback2 | 两个宿主地图背景候选，不使用 Battle Test 字段 |
| B15 | call-common | called-picture | 目标 Common Event 的素材定义位置独立核对，直接调用位置另记，不复制使用 |
| B16 | skill-common-effects | effect0-picture,effect1-picture | 两个不同目标各自独立检查并保留各 effect 关系；同目标重复 effect 由 C04 验证不重复使用；正动画路径共存 |

B02／B08 使用上述九个非空槽的合法基础 Tileset；C06 另证明合法空槽不查询。关系若在当前测试表达中已由完整原生结构验证拒绝，不得靠坏 fixture 使本组“缺文件”变成提前引用错误。

## C. 起点与范围：13 族

本组结果统一为 `expected`。未另外列出时表示使用 `formal`，字段使用 `case`；C11 的 recognized-raw 分支表示 raw，其他未知负载采用它们既有合法表达。每个分支独立执行，不是要求一个大项目同时包含所有反例。

| 族 | 确定分支 token | 输入与预期 |
| --- | --- | --- |
| C01 | map-pages,common-uncalled,troop-pages,nested-choice,nested-loop | 三类当前根、多个页及嵌套体均有可定位使用；普通缺失 error；不依赖运行可达性 |
| C02 | removed-map,removed-common,reset-troop | 旧快照保留缺图但当前已移除；不补回素材根，不改变删除／重置规则 |
| C03 | route-mirror,independent-command,repeated-command | 205／505 一次，另一真实命令独立；新命令检查不累计使用次数；图像和 SE 字段分别为 image,se |
| C04 | two-callers,common-independent-root,repeated-enemy,repeated-tileset-name,repeated-common-effect | 公共事件定义使用只计一次，所有直接调用点独立保留；成员／槽是真实不同路径而各计一次；文件查询可共享 |
| C05 | self-cycle,mutual-cycle,long-acyclic,shared-dag,dynamic-target,known-sibling | 循环不递归展开、不新增循环诊断；12 跳链及多层双调用共享图只核对全部定义位置和直接边，使用次数不按路径增长；动态不当通过，已知兄弟关系继续 |
| C06 | none-direct,none-indirect,default-page-image,default-page-route,saved-audio-controls,saved-image-index | none-direct 字段展开 A 表全部素材字段和两种路线容器，使用各字段既有合法 None 编码；none-indirect 展开 B 表原生允许空值的到达字段（动画图／SE、Tileset 槽、Enemy／Actor 名称、Map 图像／音频、System 名称），不把缺字段当空值；默认仅在已有可选字段应用；音频／索引非默认独立值保留 |
| C07 | target-missing,field-missing,field-wrong-type,field-empty,file-missing | 字段问题／合法空／缺文件对 B 表到达字段分别变体；target-missing 只用于有固定数据库目标的关系，System 直接保存字段使用 field-missing，不虚构固定引用；只损坏当前关系必要位置，非法空编码仍按原输入规则失败 |
| C08 | route-fixed,route-random,route-approach,tile-with-character,autoplay-bgm-off,autoplay-bgs-off,battleback-off,false-page-condition,unreached-branch | 保存名称仍收集；前七种明确非活动按政策 warning；页条件／分支推演不降级，候选与非活动原因都保留 |
| C09 | actor-hp,vehicle-position | 只做所述操作，无额外角色图像、载具图像／BGM、倒下副作用素材检查 |
| C10 | unrelated-actor,unrelated-animation,unrelated-field,troop-host-only | 不扫描未选条目／字段，不以 Troop Event 身份引出宿主所有 Enemy 图片 |
| C11 | script-command,route-script,plugin-command,unknown-raw,recognized-raw | 未知字符串不猜素材；recognized raw 同规则；已存在 Script Gate／结构失败不被例外绕过 |
| C12 | plugin-declaration,enemy-ai,initial-equipment,transfer-network,hardcoded-system,terrain-background,battle-test-background | 各自缺素材仍不引入已排除关系；独立记录排除依据 |
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
| F06 | image-percent,image-hash,audio-percent,audio-hash,literal-percent20,movie-percent,movie-hash | image-percent／image-hash／literal-percent20／movie-percent／movie-hash 为 input；不支持名称、查询前拒绝且无替代目标，普通 error、候选／非活动 warning + 未检查且例外不能豁免。audio-percent／audio-hash 仍为 filesystem，按原名查询，不 URL 解码 |
| F07 | slash,backslash,absolute,drive-relative,parent-traversal,forbidden-character,control-character,device-name,device-name-extension,device-name-case | input；不支持名称、不穿越查询；forbidden-character 子字段逐一枚举普通 Windows 禁止字符，control-character 为 U+0000–U+001F，device 三支按决策票首方保留设备名清单逐项构造，不用单个 NUL 代表全集 |
| F08 | missing-category,missing-file,directory-is-file,file-is-directory | filesystem；分别辨认原因与具体位置 |
| F09 | root-alias,top-symlink,category-junction,file-symlink,link-in-root,link-outside-root,dangling-link | filesystem；root-alias 沿既有规则；根以下拒绝且目标不可被访问，目标位置与存在性不改变拒绝 |
| F10 | hard-link,zero-byte,metadata-only | 前二为 filesystem，metadata-only 为 injected；普通文件可通过；受控拒绝内容读取边界证明产品没有 open／read 媒体要求，不冒充真实 ACL |
| F11 | enumerate-denied,metadata-denied,io-failure | injected；无法检查而非缺失，独立路径继续 |
| F12 | disappears-after-enumeration,type-changes-during-query | injected；查询内矛盾无法确认，不能改成稳定缺失 |
| F13 | images-absent,images-false,images-true,images-null,images-number,images-string,audio-absent,audio-false,audio-true,audio-null,audio-number,audio-string | input；只解释相应有使用类别；absent／false 普通，true 不支持，即使普通文件存在；其他为必要字段错误 |
| F14 | no-images-use,no-audio-use,movie-only,no-www-fallback,no-other-root | input 加 filesystem；无关标志不解释，不切换资源根 |

F07 的字符和设备名实例把具体 Unicode 编号／设备名追加到字段 token，名称大小写及带后缀的实例分支明确区分。设备名枚举为 CON、PRN、AUX、NUL、COM1–COM9、LPT1–LPT9、COM¹／COM²／COM³、LPT¹／LPT²／LPT³，独立转录自文件判定决定的首方列表。禁止字符枚举为小于号、大于号、冒号、双引号、斜线、反斜线、竖线、问号、星号；控制字符为 U+0000–U+001F。不能导入产品验证函数或常量作为预期；本族不以非法名称真的能在磁盘创建为前提。

### 2026-11-02 F06 身份修订与历史回执

维护者确认图片含 `%` 或 `#` 统一不支持，音频继续支持。三个图片分支各自保留独立 canonical ID：`AV.F06.image-percent.input.case.expected`、`AV.F06.image-hash.input.case.expected`、`AV.F06.literal-percent20.input.case.expected`。音频仍为 `AV.F06.audio-percent.filesystem.case.expected`、`AV.F06.audio-hash.filesystem.case.expected`，影片两个 input ID 不变。

旧 `AV.F06.image-percent.filesystem.case.expected`、`AV.F06.image-hash.filesystem.case.expected`、`AV.F06.literal-percent20.filesystem.case.expected` 已退出当前义务；[03 历史机器回执](../asset-validation-implementation/evidence/03-file-observation-acceptance.json)中的源码／构建共六条 `not-executed-policy-pending` 必须原样保留，不能覆盖成通过或别名复用。实施03须在新 input ID 下通过公共 Workspace API 与实际 CLI 分别验证源码／构建行为，并保留独立预期。F06族和其七个分支不减少，改变的是三个图片分支的输入语义及ID。

## D. 诊断与例外：10 族

结果固定 `expected`，字段为问题事实或配置项。普通／候选／非活动使用各自核对基础和有效级别。除 D06 的纯聚合分支外，以真实 Workspace 编译及结构化内部预期相互支持；D10 全部经实际 CLI。

| 族 | 分支 token 与有穷组合 | 预期 |
| --- | --- | --- |
| D01 | ordinary,candidate,inactive × missing,name-mismatch,wrong-type | ordinary 为 error，其余 warning；采用下方明确配对的表示，不虚构直接候选或 raw 页 |
| D02 | unsupported-name,unsupported-link,encrypted,required-field,unqueryable,inconsistent × ordinary,candidate,inactive,exception | 前三类在 candidate／inactive 为 warning + 未检查，ordinary／exception（普通使用加例外）为 error；其余全部 error；另设 reference-error、structure-error、script-gate 保留既有错误；inconsistent 限单次查询 |
| D03 | eligible × missing,name-mismatch,wrong-type；exact-namespace,case-distinct,space-distinct,suffix-distinct,encoding-distinct | 三类 error 可降级并保留原因；同目标 formal／raw／间接多来源均生效；不同准确键不误匹配 |
| D04 | invalid-category,invalid-folder,category-folder-mismatch,empty-name,missing-name,missing-reason,blank-reason,duplicate,unknown-field | 配置 error，指出配置项，不最后覆盖；后续检查未运行不得写成通过 |
| D05 | repaired,unused,warning-only,incomplete | 完整无降级时 warning 定位配置项；incomplete 不下无用例外结论；不改配置 |
| D06 | mixed-levels,multiple-files,same-file-two-groups | 组取最高有效级别而保留成员；分别数组／文件／使用；最后一支为独立内部聚合输入，不伪造同时磁盘状态 |
| D07 | shared-directory-failure,shared-field-failure,invalid-target | 共同失败关联所有来源，无合法目标不制造路径或已确认缺失文件 |
| D08 | independent-results,early-config,early-structure,early-reference | 独立错误／warning 均保留；早期输入不可信明确未运行，不强求穷尽 |
| D09 | map-page,nested-body,route,common-definition,shared-callers,reliable-source,unknown-source | 定义位置、事件内链和每个直接调用点可核对；使用计数不按调用路径增长；有可靠源码才给行列 |
| D10 | cli-error,cli-warning,cli-exception,cli-dynamic,cli-cycle-relations,cli-unchecked-warning,cli-query-failure | 循环关系不产生循环诊断；支持范围 warning 标记未检查且可成功，查询失败 error；退出及来源信息符合政策 |

### D01 的表示约束

ordinary 的表示展开 `direct-formal,direct-raw,indirect-formal,indirect-raw`；candidate 展开 `indirect-formal,indirect-raw`，使用已选初始化关系；inactive 展开 `page,indirect-formal,indirect-raw`，分别使用非 custom 自主路线和关闭 autoplay 的固定传送目标地图音频。raw 修饰事件入口的表达，不表示给地图字段添加 raw 接口。缺失／名称不符／类型不符分别作为字段 token；不虚构直接字段天然候选或 raw 页，也不通过篡改内部条件标记制造用例。

### D02–D10 的标识展开

未另列表示组合的 D02–D10 使用全局默认表示 `native`；这里的表示 token 不代表执行了原生游戏，D10 的实际执行入口仍全部为 CLI。单因子分支使用表内 token 作分支、`case` 作字段，例如 `AV.D09.common-definition.native.case.expected`。

D02 的 24 个事实与角色组合使用角色作分支、事实作字段，例如 `AV.D02.candidate.native.unsupported-name.expected`；四种角色与六种事实全部展开。另三支使用 `AV.D02.reference-error.native.case.expected`、`AV.D02.structure-error.native.case.expected`、`AV.D02.script-gate.native.case.expected`。D03 的三个 eligible 组合使用 `eligible` 作分支、事实作字段，例如 `AV.D03.eligible.native.missing.expected`；其余五支使用各自 token 作分支、`case` 作字段。

2026-11-02 实施编码核对：以上只明确既有行为组合的完整 ID，不改变场景、入口、级别或数量。早期 D09 协作回执曾采用 `formal`；12 在扩展原有唯一 callback 时统一为上述 `native`，保留旧断言和历史回执，不为同一行为再注册别名测试。

## W. 工作流：20 族

真实操作子进程与文件树为主要入口，字段为 `case`、结果为 `expected`。除 W01 已特别指定外，每个分支至少用 API 执行精确状态断言；W02–W08、W13、W15、W20 还必须把每行列出的第一个分支经真实 CLI 重复执行，使用表示 token `api`／`cli` 分别记录。正常 CLI 路径由 W01 的 success 组合及这些序列的正常准备操作覆盖；其余变化分支以 API 加 D10 补充展示覆盖。W13 的 source 分支保留 prewrite、postwrite 两个 CLI 边界。

W01 的状态与结果两个因子按表内顺序用连字符合成分支，例如 `AV.W01.initial-success.api.case.expected`、`AV.W01.stale-warning.cli.case.expected`。三种状态与三种结果分别经 API、CLI，完整展开为 18 个 ID；`expected` 仍是结果段，不把 success／error／warning 移入该段。

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
| W12 | same-pass-reuse,next-command-fresh | 多定义使用及直接调用点保留；新命令取得当前事实，不读历史成功缓存、不按路径复制使用、不锁定 syscall 次数 |
| W13 | source,validation-dependency,config,exception,snapshot,generated,binding | 各分支在 Push 写前及记账前分别变更（字段 prewrite,postwrite）；停止或 pending，不半途采用新输入，合法自身写入不误判 |
| W14 | exception-change,pull,rebind,contract-change,check-does-not-refresh | 基线过期需重编译；Check／恢复／素材通过不能升级旧输出；根别名规则保留 |
| W15 | all-generated-missing-asset,all-snapshot,mixed,missing,unknown | 全生成可完成记账后当前失败而不重新留 pending；全旧放弃后正常检查；其他拒绝自动恢复 |
| W16 | stale-original-basis,changed-current-config | 恢复保留原依据；当前 freshness／drift／素材分别判断，不获得新写权限 |
| W17 | clone,pull,decompile,diff | 缺素材不新增文件门槛，原有数据／表达／新鲜度规则保持 |
| W18 | concurrent-workspace,pending-non-push,pending-rebind | 互斥与原绑定恢复保持，不新增跨 Workspace 协调 |
| W19 | compile-success,compile-failure,push-success,push-failure,recovery | 仅允许各操作的数据／元数据变更；素材不进快照、备份、复制、写入，必要字段只读 |
| W20 | generated-roots-and-relations,no-dsl-reevaluation,no-historical-report | 从生成事件重建定义内使用、事件内链和直接调用关系；共享／循环不展开全部路径，排除旧快照移除根；哨兵证明不重求值 DSL；新命令实际查询 |

W11 的变化发生在唯一素材门槛的查询开始前，不构造并不存在的首轮素材检查；改善分支可从缺失恢复到准确文件，按当前事实通过。W04／W06 则在素材检查后只改素材，用于证明不做后续复查。W13 的改动不混淆当前绑定项目与其他项目。W15／W16 保留独立构造的 pending 证据及真实 data 中断先例；pending 不能由写后素材变化制造，仍需覆盖原有数据恢复条件，不能调用被测恢复决策生成预期状态。

## N. 原生必验：6 族

表示固定 `native-run`，字段为 `case`，结果为 `observed`。所有项要求版本、输入、请求／文件定位和证据；实际状态以各责任票证据为准。真实有效自制媒体用于观察，不能把自动化空文件拿来判断原生解码行为。

| 族 | 确定分支 token | 必须记录的事实 |
| --- | --- | --- |
| N01 | image-png,audio-ogg,movie-webm | 代表性原生目录、追加扩展名与磁盘定位；不从播放结果推导全面保证 |
| N02 | chinese,space,audio-percent,audio-hash | 当前支持域的成功映射；chinese／space 各含图片、音频、影片，audio-percent 含普通百分号及看似编码字串，audio-hash 为音频井号；区分 URL 编码与磁盘文件名 |
| N03 | animation-images,animation-timing-se | 双图与逐时机 SE 消费来源及条件，区分预加载与实际帧播放 |
| N04 | change-tileset,page-tile | 整组和单张不同关系；页图块实例包含 B–E 对应合法值的定位记录，区分场景中地图绘制附带请求 |
| N05 | enemy-front,enemy-side | 同一 Enemy 在两种模式的原生目录选择 |
| N06 | runtime-overrides-initial-candidate | 一个已选初始候选被运行时设置覆盖的场景；保存候选与当前运行值区分 |

2026-11-02 的人类政策明确排除图片含 `%`／`#`。旧 `AV.N02.image-percent.native-run.case.observed` 和 `AV.N02.image-hash.native-run.case.observed` 仅作为历史观察 ID 保留，不再是当前支持域原生成功义务，也不另造通过 ID。原始15样本13成功2反例、普通百分号图片成功与两个红绿因果对照均不改写；[政策处置](../asset-validation-implementation/evidence/01-native-media/policy-resolution-2026-11-02.md)按当前四个 N02 ID 对账九个成功样本。N01 三个样本亦已原生成功，证据票01交付不代表其他 N 族或产品完成。

## 覆盖与执行交接

本表包含 A 18、B 16、C 13、F 14、D 10、W 20、N 6，共 97 个族；与已接受矩阵逐族对应。完整子用例标识由上述有限展开唯一确定。实施方将其写入测试名称和验收回执；可以参数化组织、共用 fixture，但不得减少本次修订后仍列出的字段、分支或指定边界。撤销的跨点素材比较与全传递路径预期不再执行。

类别组合、控制字符、合法空字段等枚举须独立按上游契约转录；该转录是测试数据准备，不是新增政策。因能力不足未执行的真实案例保留缺口并安排补验。产品验收前交付每项实际状态、证据及任何反例处理结果；在此之前本索引的计划身份不变。
