# Ticket 08 — 脸图索引、换图与保存链逆向核对

2026-10-19；范围为 E6 中 E101 Show Text 和 E322 Change Actor Images 的脸图。结论来自已定位 MV 1.6.1 编辑器随包 QML 的只读路径核对；没有启动编辑器、执行抽出代码、生成图片、写入游戏工程或运行游戏。本文的尺寸和参数数组是独立说明输入，不是截图或原生保存产物。后续 E6 产品比较及 R6 实际显示仍有自己的验收责任。

已接受的有限保存值域与本次发现一致：名称与 index 独立保存；第三行可以通过普通 picker 代码路径产生；主动换图可能调整 index，但容器序列化及 DSL 保存不因此获得按图片尺寸修复的规则。特别保留单行图不进入 adjustCursor 主体及图片源变化 1 ms 定时器的时序限制。

## 目标、身份与复核边界

目标为 `references/RPGMV/RPGMV.exe`，19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。版本 1.6.1 / FileVersion 1.6.1.0 是已存在 PE 自报记录 `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`，复用自[03 证据](03-branches-and-battle-reverse.md)及[参数来源索引](../../complete-mv-events/research/command-parameters/index.md)，没有为本票虚构新 REA ID。本次重新核对原 EXE 的长度和 SHA-256，并核对每个资源的外层长度、zlib 输入消费边界、解码长度及 SHA-256。

[资源身份文件](08-resource-identities.json)记录 16 个选定 QML 资源和首方帮助 HTML 的完整身份。Q@ 后的十进制数为原 EXE 的资源外层长度字段偏移，行号来自本机抽出文本。基础对话框、事件列表及序列化资源与 03/06 的身份相同；不重复进行无关原生反编译。新增预览继承链的查找边界是该 EXE 中长度有效、能解码的 QML 候选，按 framePosition 别名/声明或 LabeledImageBox 根类型选择，再读完与 FaceImageBox 有关的三个资源；不声称这是整个程序的全局无写入证明。

首方帮助 `references/RPGMV/Help/page/01_11_01.html`，15,765 bytes，SHA-256 `cf1aa93ec2795b4e6fe5e9205451ff6c21d184758fab9b2fe029a057532b2cdf`，53–55 行说明标准脸图为每格 144×144、四列两行。该规范不证明 picker 硬限八格。

原始首方文本、发现清单及解码脚本只留仓库外：`C:/Users/Shuen/.codex/research-evidence/mv-editor-08-20261019/`；脚本为 `C:/Users/Shuen/.codex/tmp/mv-decode08.cjs` 与 `mv-scan08-preview.cjs`。实际抽取和预览链扫描使用 Node v24.14.0；独立索引校验使用 Windows/Node v22.23.0。仓库内只发布原创结论、资源元数据和独立核对结果，没有复制首方代码。

## 初始化、加载与编辑确认路径

1. **新建与父参数加载。** Q@679418 的新命令对话框传入 null eventData；Q@656916:24–40 分别调用命令 load/save。FaceImageBox 经 ObjImageBox 的名称初值为空字符串、int index 初值 0（Q@8723218:24–25）。E101 加载既有 p0/p1（Q@729658:139–151），保存 p0/p1 时分别读两个属性（:158–174）。新建 E101 的脸图初值据此有条件推导为空名称和 0；没有将其提升为额外可省略的 Compiler Default。
2. **E322 项目初值。** Q@788887:15–20 的 actor 选择变化调用 refresh；:47–55 从当前项目 actor 读取 faceName/faceIndex。既有命令 onLoad(:58–67)先选 actor，再显式赋入 p3/p4；onSave(:70–80)独立写入这两个槽。按正常完成初始化与同步信号路径，既有保存值覆盖该次 actor 刷新；主动另选 actor 则可能换成其项目初值。没有把项目初值当成固定编译默认，也没有断言所有 Qt 调度顺序。
3. **只显示父窗口预览。** Q@625536:11–20 设 faces 子目录、固定 144×144 帧、四列及由 index 派生的帧位置。继承链是 ObjImageBox Q@8723218 → LabeledImageBox Q@8797197 → ImageBox Q@832674 → ImageClip Q@880199。后三者分别转发图像/帧属性、提供打开动作及裁切绘制；ImageClip 的图片状态回调只安排重绘，没有向父 imageIndex 写回。读取的这条预览链没有按当前图片尺寸夹紧 index；绘制越界区域会显示什么仍未观察。
4. **主动打开脸图子选择器。** ObjImageBox Q@8723218:34–62,65–72 将分帧设置及当前名称/index/hue 交给 Dialog_ImageSelector，子 OK 后复制名称/index/hue 回父控件；父确认才写回事件参数。ModalWindow Q@878315:64–67 的内容 Loader 由窗口可见性控制。这里区分只打开父命令、打开子选择器和两次确认，不假定未打开子选择器也执行了游标调整。
5. **文件列表与 None。** FileListBox Q@618109:199–264 刷新 PNG 列表时先插入 None 空项，其 baseName 为空且没有 filePath；:63–64 的成员读取使其路径默认为空。Dialog_ImageSelector Q@8787441:50–65 在 None 上确认写空 imageName，没有直接把 imageIndex 赋 0；:125–145 把子 view 的 index 变化反馈到对话框。因此 None 名称独立已证，但本次打开子窗口全过程是否还曾被游标调整，仍需结合下面的尺寸和时序条件。

## 固定列、动态行、缩图与异步条件

ImageSelectorView Q@638194:21,25–44 以 int 保存 index，按当前图片宽/高除以帧宽/高得到 frameMaxX/Y；faces 的 maxColumns 固定 4。frameActive 同时要求横向格数大于 1、纵向格数大于 1；adjustCursor 只在这个条件为真时检查 x/y 并把越界 index 赋 0。源变化 :161–163 启动 interval=1 的定时器（:99–103）；箭头键 :133–158 也会调用 adjustCursor。

以下只用整格尺寸，排除非整倍数尺寸向 QML int 转换的未核对细节。设图片已加载并暴露所列实际尺寸、scale=2/3，点击点在显示格内部，且用户可以滚动到目标位置；MouseArea :87–97 以点击点所在行列生成 index，未按 frameActive 提前挡住点击。

| 独立尺寸输入                          | 代码派生状态             | 可定位的选择或调整路径                                                                  | 证据范围                                         |
| ------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 576×288 标准两行                      | 4×2，frameActive=true    | 第二行末格中心显示坐标 (336,144) 推导 index7，第一格为0                                 | 点击公式的有条件推导；未创建/点击实际图片        |
| 576×432 三行                          | 4×3，frameActive=true    | 第三行第一/末格中心 (48,240)/(336,240) 推导8/11；从4/7向下键加4也到8/11                 | 同一普通选择器代码路径；未执行 UI 或显示验证     |
| 三行 index8/11 换576×288              | 4×2，frameActive=true    | 若 adjustCursor 在新尺寸生效后执行，frameY=2 超出两行，归0并反馈子对话框                | 有条件归零；不能从1ms推定必然已经加载            |
| 三行 index8/11 换576×144              | 4×1，frameActive=false   | adjustCursor 主体跳过，原 index 不因这个函数归0；箭头移动也被挡住；点击单行仍可另选0..3 | 保留的反直觉边界；未断言全部 Qt/用户操作不会改值 |
| None/空源，且该时点 frameActive=false | 不进入 adjustCursor 主体 | 当前独立 index 不被此函数归0，确认可把空名称与当前 index 回传                           | 条件推导；没有测量空图的尺寸、缓存或加载时序     |

**异步边界。** 读完 Q@638194 的完整 165 行，只见源变化定时器和按键调用 adjustCursor，没有该 view 自己的 Image.status/尺寸变化重新触发调整处理。1 ms 是调度参数，不能当作图片已完成解码的屏障；回调可能面对旧尺寸、零尺寸或新尺寸。父预览 ImageClip 有 status→重绘，但不等于子 view 的 status→adjust。故不能声称“换小图后必然归零”，也不能声称“点 None 后必然保留”。额外触发键盘动作、再次换源或不同缓存状态都可能改变结果。当前有限保存值契约不依赖消除这类时序差异。

**缺文件边界。** FileListBox Q@618109:287–297 先找匹配名称（Windows 忽略大小写），只在 currentIndex<0 时显式回退0；若先前位置仍非负而新名称未找到，该函数本身没有无条件回退0。模型清空/重建、信号与初始选择顺序未运行；Dialog_ImageSelector 的 currentBaseName 变化又可能写名称。因此仅容器保存缺文件名称与主动打开子选择器的反应不同，后者不能静态简化为必然 None、必然原名或必然 index0。

## 保存结构结果与推导

每行是独立证据义务。passed 只表示这行限定的源码路径/条件及契约比较完成；并不表示这里的参数由 UI 实际生成、写盘或在游戏中显示。合成极值、None+非零和换图输入均保留自己的起点说明。

| Case ID                    | 独立输入/操作起点                                              | 预期结果或保留结论                                                                                          | 证据等级及限制                                         |
| -------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| MV-E08-GRID                | 官方帮助与 faces 控件分帧设置                                  | 官方标准144格/4列2行；FaceImageBox固定144格/4列，而行数由子view图片高度派生，没有7硬上界                    | 首方规范及随包代码观察；不证明全部尺寸都能加载         |
| MV-E08-STANDARD            | 合成576×288已加载，点击第一格及第二行末格内部                  | 普通点击公式可分别产生0/7；有效格仍由当前尺寸决定                                                           | 有条件静态推导；没有实际图片/点击捕获                  |
| MV-E08-THIRD-ROW           | 合成576×432已加载，第三行点击或从4/7向下                       | 同一选择器路径可产生8/11，反馈到dialog并可回传父控件                                                        | 有条件静态推导；滚动/焦点及完成初始化为前提            |
| MV-E08-E101-LOAD-SAVE      | 既有101的独立名称/index；只开父参数后确认                      | onLoad读取p0/p1，onSave独立写p0/p1，预览链不按尺寸改index；只核对脸图槽                                     | 代码观察与有条件保存推导；不扩大到文字尾行等其它参数   |
| MV-E08-E322-LOAD-SAVE      | 既有322六槽，face为p3/p4；不主动另选actor或子图                | actor选择后的显式load恢复p3/p4，save独立写回；不是运行时actor图像值                                         | 代码观察与正常同步初始化推导；未知Qt调度不冒充执行     |
| MV-E08-NEW-PROJECT-DEFAULT | 新101及新322、主动改变actor                                    | 101脸图控件初值空名/index0；322可从选中actor读取项目faceName/index，主动换actor可刷新                       | 有条件初值推导；项目值不成为Compiler Default           |
| MV-E08-PREVIEW             | 父窗口显示独立index8/11/2147483647，图片缺失或较小             | 已读Face→Obj→Labeled→ImageBox→ImageClip预览链派生裁切区域，没有向index写回尺寸夹紧                          | 有界代码观察；极值是合成域输入，不声称可点选/绘制正常  |
| MV-E08-NONE-PARENT         | 合成101空名/index11；独立322空face名/index11，仅父参数确认     | 名称与index分别load/save，没有None就归0的父保存规则                                                         | 有条件静态推导；不是原生创建样本，不打开child picker   |
| MV-E08-NONE-CHILD          | 打开子选择器选None，当前index11，该时点frameActive=false       | None确认只写空名；adjustCursor跳过，index11可回传；若其它时点active需重新按边界分析                         | 有条件静态推导；未观察空图尺寸和完整信号顺序           |
| MV-E08-SMALLER-ACTIVE      | 三行index8/11换已加载576×288，新尺寸后调用adjust               | active为true且row2越界，index变0并沿child反馈；父/容器没有因此必修复                                        | 有条件静态推导；不是换图后无条件保证                   |
| MV-E08-SMALLER-INACTIVE    | 三行index8/11换已加载576×144，调用adjust，无额外点击           | active为false，adjust不改index，键盘移动受guard；单行点击仍可另选0..3                                       | 有条件静态推导；保留反直觉分支和用户动作区别           |
| MV-E08-ASYNC-MISSING       | 源变化1ms timer、缺文件名称及未知旧列表位置                    | 未见view自己的ready/尺寸重试；缺名只在currentIndex<0显式回退0；完整结果依赖未运行的图片/模型时序            | 有界负向观察及未知条件已界定；不把待观察的UI反应记通过 |
| MV-E08-CONTAINER           | 既有标准/第三行/None+非零/缺文件参数，仅保存事件容器           | 已读DataManager JSON序列化不调用命令或子picker，保留名称/index原值与原生命令参数结构                        | 容器责任代码观察；未验证实际磁盘成功、产品输出或游戏   |
| MV-E08-FINITE-DOMAIN       | 已接受0..2147483647与负零/域外规则；非None索引8/11和None索引11 | 保存域独立于图片和当前picker；非None>=8警告超标准布局且尺寸未查，None保留index不报缺图/图片越界；无需改契约 | 已批准契约一致性核对；极值非普通可选值，产品验证仍后置 |

## 容器责任、契约比较与后续验收

DataManager Q@909009:163–178,194–213,357–424 的保存及 stringify 路径序列化现有工程数据，未调用 E101/E322 load/save 或图片选择器。事件列表 Q@667573 的命令编辑接收已确认的数据并统一插入缩进；这与仅保存已有容器不同。对本票允许的字符串及有限整数，容器保存路径没有资产尺寸查询或 index 归零规则。没有用“JSON 文本完全相同”替代解析后的 Native Saved Shape，也不声称原生写盘成功。

与[决定13](../../complete-mv-events/issues/13-native-value-domain-boundaries.md#answer)、[ADR0011](../../../docs/adr/0011-native-command-state-and-validation.md)、[ADR0012](../../../docs/adr/0012-event-saved-state-roundtrip-boundary.md)、[规格I6](../complete-mv-events-implementation-spec.md#i6--文本素材与-native-saved-value)、[E101](../../complete-mv-events/research/command-parameters/core.md#e101--show-text)及[E322](../../complete-mv-events/research/command-parameters/actors-battle.md#e322--change-actor-images)逐项比较：本票没有发现与已接受保存契约冲突的正常原生形态。QML int声明与已接受有限值域保持分工；不能从int声明或计算出的裁切坐标推导2147483647可以用普通选择器创建。负零和域外拒绝由后续产品校验负责，JSON本身无法保留负零符号也不改变检查责任。

保留的反例针对“任意缩图都必然归零”这一过强推断，而不是针对已接受契约。第三行8/11正常路径、单行active=false、None独立index、缺文件与异步局限均已界定；没有未解决且会要求改变已接受保存域的问题。因此本票可解除自身逆向前置，不代表产品中相关字段、警告或往返已实现。素材文件/尺寸不扫描、非None>=8警告、None不报缺图/图片越界、非法数值拒绝、输出比较和真实游戏显示由后续实现及49–54负责。

纯文档和证据元数据不改变产品或harness，无需新增TDD测试；沿用已批准T1证据索引边界核对真实source section、review row、唯一ID、fixture hash及执行记录。最终Windows/Node22索引、格式、链接与空白校验结果记在本票 Outcome and verification。原始首方输出保持本机仓库外，所有未运行层均明确为not-executed。
