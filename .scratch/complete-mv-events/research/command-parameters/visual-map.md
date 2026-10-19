# MV 1.6.1 逐参数证据：系统、移动、画面、音频与地图（132–285）

研究日期：2026-10-19（Asia/Shanghai）；对应[逐参数研究票](../../issues/11-native-command-parameter-evidence.md)。覆盖本分片列出的48个顶层指令族；205的45个移动子指令见 [Movement Route 参数证据](movement.md)。

## 结论与阅读约定

本报告逐项给出原生槽位、正式表达映射、值域、默认、校验和最小样本。证据为目标编辑器内嵌QML/JavaScript及零售NewData静态源码；没有启动编辑器或游戏，没有执行提取源码，没有做产品测试。报告中的样本是待执行验收要求，不是已通过结果。

已决依据为[原生指令契约](../../issues/05-native-command-contract.md#answer)、[语义往返契约](../../issues/06-semantic-roundtrip-policy.md#answer)、[Workspace集成](../../issues/07-workspace-domain-integration.md#answer)与ADR0011/0012。当前产品接口只作为差距定位，不作为规范。

- `p[n]` 表示原生 `parameters[n]`；未另述时只产生一条同indent记录，参数数组长度恰为本节列出的槽数。无参命令是 `[]`，不接受额外槽。
- helper/kind名称按MV命令名及既决Schema-First规则机械映射；表中的对象字段给出可完整表达的候选schema，未由既决票确定的精确字段拼写不是新批准的API。全部列出字段均显式必填，只有标为**已决**的字段已经获准省略。其他列出的控件常量仅是固定Compiler Default的事实候选，是否省略仍属待定接口；不可直接采用当前编译器默认。
- 对原生未使用但保存的字段仍逐槽保留；缺字段不得以新建默认补齐。反编译只能省略已决默认且该字段精确等于默认的值；尚未获准省略的字段完整输出。
- 下文“整数/范围”指普通原生编辑控件与直接保存路径的域，不宣称runtime对任意外来JSON强制该域。LabeledSpinBox代理Qt的decimals（Q8796406:8–12），组件未覆盖时依Qt整数默认；随包框架初值的独立闭合证据见[共享控件](shared-controls.md)：Ghidra已核对SpinBoxValidator构造的decimals=0/value=0/step=1/min=0/max=99及QML alias链，本文只在未被上层覆盖时使用；若没有目标内显式初值，下文写“框架初值”，不冒充模板常量。
- 项目引用必须解析；None只在已证素材参数上写`null`并编码原生空串，不是空Asset Reference。Runtime Selector允许合法范围内当前无对象并警告；不给Common Event强制上下文，也不预测未来变量值。全部Script Input（包括205嵌套）依Script Command Gate递归校验。

## 证据身份

目标 `references/RPGMV/RPGMV.exe`，19,595,264字节，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`，自报1.6.1。复用[编辑器保存研究](../editor-serialization.md)的REA Evidence `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`（仅PE资源定位；本报告QML解析不是新的REA Evidence）。没有打开或关闭共享native session。

本次以普通Node fs/zlib/crypto在内存读取，核对长度前缀、解压输出长度与压缩输入消费字节；不eval。`Q<offset>:行号`以UTF-8解码后CRLF/LF分行，1起始。角色由完整文本识别，未重建qrc路径；offset为文件头0起始，stored包括4字节记录长度。既有报告的只读解码recipe适用。仅原创报告保存到仓库，未发布源文本。

| 引用 | offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| --- | ---: | ---: | --- | ---: | --- |
| Q754957 | 754957 | 536 | plain | 532 | `60d18bdeabbb832597096598f74c6bd0a21684a81ee5a644529c9cda3d4053d1` |
| Q728356 | 728356 | 535 | plain | 531 | `3044e8b8b7d99eed5cb82a8ee1d63a5f759eda2d70e8397b49cc646ddc8caba7` |
| Q802494 | 802494 | 547 | plain | 543 | `8ff36cfed26a29e7a6064bf056cee4fc3750dd794b5df60b9c7a871e9257d0bb` |
| Q783833 | 783833 | 541 | plain | 537 | `0949c8a803812a21309a29d0b2e768df9c6475000f70ffc178943498cf7d118d` |
| Q763630 | 763630 | 544 | plain | 540 | `8365669e6ed887de46d38840e5f26d59264792db532188db0929b88eeea5466d` |
| Q738060 | 738060 | 551 | plain | 547 | `935ac706556a6283598566cf28535441dc64b12704ff9515e39a70b7c79c1099` |
| Q716708 | 716708 | 1034 | plain | 1030 | `1aeab481185739d36726975074d3b448da007d0a445e55fc652a12b93f0227e3` |
| Q793772 | 793772 | 533 | plain | 529 | `bcbb622d1199e65c38aa59d5f0f597756fcdc86655b7a32500c11acaa2c7caab` |
| Q804465 | 804465 | 2121 | plain | 2117 | `4775cdef6633c84cf644971f098921f258f323386cfb3a9351d20daf33514827` |
| Q758295 | 758295 | 1691 | plain | 1687 | `26b948a478069a1ab482a446293cc9529777819d02b592c5decd0d44455ce046` |
| Q733751 | 733751 | 1166 | plain | 1162 | `af668eacc2a0484192bb2ba01d7159d47e960f5cb53c5c6673a90fdfe753ab12` |
| Q711364 | 711364 | 1749 | plain | 1745 | `7262f3ac20254fe2adc352b3117781409176f7945cf501fdcaeaee740f36d4d2` |
| Q791112 | 791112 | 1533 | plain | 1529 | `53769342884614d9ded6f169ef12aa474ccc7e85e3d91b89dcddc8677ecd942a` |
| Q771946 | 771946 | 1393 | plain | 1389 | `95cf5319c62eeacfbea61afa69a05be5d5788e5b795f34f776a791adcab44615` |
| Q774274 | 774274 | 523 | plain | 519 | `03c2c09f8387d5841fe690287cc3b152dd76217b66eb9d386a6ed303ad77e6fc` |
| Q753630 | 753630 | 1327 | plain | 1323 | `cc320da4a5777da6d2af82f5206a1bec603a44178615248f2fe3a4878b43b22d` |
| Q727003 | 727003 | 1353 | plain | 1349 | `d838b57fa6491efc90c8f5f984ee37444f6f3c80835f326660dcd3841ff75a08` |
| Q761958 | 761958 | 612 | plain | 608 | `f3be68b25b45d7d0f8f0261270a219f67ca3b0aa79a17bb794b01a38b6da443d` |
| Q739653 | 739653 | 1142 | plain | 1138 | `051a0356176d3d11eab1dae49489677c52e3eacc93164bd75a702d524c0771be` |
| Q717742 | 717742 | 1151 | plain | 1147 | `23c03642c8f6243dca9a7069c5949118cb719cfc5ad92ea39eb006362a190858` |
| Q794305 | 794305 | 496 | zlib | 1751 | `fc7d10c8a297fc7171c0c8b8661a0a5d48898e4ab38ece6112836b72366d3f65` |
| Q720992 | 720992 | 735 | plain | 731 | `24f06d5de14f72850a5ddfeabfb74c5b7688c3c3ca6272e2e37fd734dedd1f86` |
| Q796225 | 796225 | 516 | zlib | 1776 | `8e45a1e8f7b6c6c54973f9b1d9fc5c82a6fe96c0ae01e3ed6f03cb5204dd7372` |
| Q775953 | 775953 | 610 | zlib | 2117 | `b853dbcd7dec7fb58fb593c003afddf8a3e5aefb7e91eaf938bbdec259ed8174` |
| Q756958 | 756958 | 1337 | plain | 1333 | `41d5a9cbc9aec0cf247445e5b292396c56cb25573daec71126c618bf3781af7a` |
| Q731389 | 731389 | 1344 | plain | 1340 | `b0916188d8afc15fcdbce24a19c280a6819cd3b231bc1d7a3d63b25cc0afcb89` |
| Q708128 | 708128 | 745 | plain | 741 | `ee5e8e4a270a619f469335ba535b188936e6e56fead8ce9a4d5defa97e47e58e` |
| Q786953 | 786953 | 1934 | plain | 1930 | `27247cf0bb948840fa2aeb669573476e3e57f45b8efb1d9afde95e287ed9ff5f` |
| Q710234 | 710234 | 290 | plain | 286 | `dae8b90b241ad2658490afa54f1f74eef1482809852a0a1c62d9c8aae2202c8e` |
| Q789560 | 789560 | 796 | plain | 792 | `ebb30d5f76d7e35a99a97caa6f2747183cb010271362e97e81ff73fc69588f92` |
| Q723873 | 723873 | 290 | plain | 286 | `f2ea15e9cce619670e3ddd811c362ae2ecdd15bc22776190784003f5cac89132` |
| Q799130 | 799130 | 796 | plain | 792 | `185faf638ee4046770468c210abbb61fae774f33e38e5ff04c8822550513b514` |
| Q734917 | 734917 | 288 | plain | 284 | `f49fc9b41bbecea5e5832377cd137311c5f26bbc4314a51a44461d2820945a53` |
| Q752170 | 752170 | 288 | plain | 284 | `5b943ee6115052eae75bb8c698c793deca98256706fbc8d5df759a1a99971b7d` |
| Q738611 | 738611 | 1042 | plain | 1038 | `9ef944e106a9bbd7fe6a88edf5f0975d1222792ef5cb32d0fc26f9ae89157ba9` |
| Q770563 | 770563 | 612 | plain | 608 | `f804d816511ae3549ca7580e8c1991b9946692b448b095b0706aa12c60d78099` |
| Q747827 | 747827 | 818 | plain | 814 | `1422da144e3be3f7fa018a6ec851984b0dd9843df3d77f70607441bd4b7ba287` |
| Q722843 | 722843 | 1030 | plain | 1026 | `6c5840faf4a53d8ebd7228e10e9e5a8c0fd384af7993c890d4feb3b7cd5db9cd` |
| Q797896 | 797896 | 1234 | plain | 1230 | `792b87ef69db0fb2e4b3381fa8d978cf63ce253eb1d3bff7782ee732cfd66298` |
| Q778493 | 778493 | 1440 | plain | 1436 | `36056966f6b95a99933209e6d1b6bbc00b2f7f6ba882b423e88a010ae2fdce91` |
| Q649305 | 649305 | 918 | plain | 914 | `6447326aed6996e6a433c48846286b16e5865287cb406c43097ab8b107f700bc` |
| Q680842 | 680842 | 1335 | plain | 1331 | `0d87a64dcdc267fcbce7aca42df12a3b665df6153be84b5701eade6113ed8cc8` |
| Q662985 | 662985 | 1145 | plain | 1141 | `22c3dba561a5dc70198859750746a2aa355980f2b2a8141b5e92970ced6224db` |
| Q642887 | 642887 | 1036 | zlib | 3992 | `7134ca5457bfe1299b890ffb4c5be2eb28ec53c8029c503e9c00fd606f34f777` |
| Q618109 | 618109 | 2836 | zlib | 11083 | `2cd5a2d9b73ad52c3ebdd45e1d4ab228fe6adc05e1644be90bc29ceda2d28c36` |
| Q643923 | 643923 | 1065 | zlib | 5177 | `aacbf1a28a1cf5f976a9fe5f93cfb902bac75cac477a4bb8281cce1dae4845cc` |
| Q645983 | 645983 | 771 | zlib | 3227 | `5650b8873f5add7c1fd1842860b9e5c179b5909245319f6f6ea267f0e2b91ebb` |
| Q648210 | 648210 | 588 | zlib | 2170 | `e9fe57645db2de85774d5bd2706f8f73c43842243c6c2743c2886c85bae5779d` |
| Q666669 | 666669 | 904 | plain | 900 | `61ef2ff49e036d9ff3d41d674934e3ddb6265876bc864397ea0777d3e7e14808` |
| Q676413 | 676413 | 895 | plain | 891 | `7216d91126549a9417bd57c2978057162cf3c0cfa81fa6fdf6f733fa64522304` |
| Q687080 | 687080 | 1484 | plain | 1480 | `b84f75ac9894c217b6422a996f2c26f712ba95a3688eaea4d0190a97018205d3` |
| Q694489 | 694489 | 976 | plain | 972 | `c0f9c2f79474db31f395c22edd738b29cabf0423da73918783d0663885752a98` |
| Q695465 | 695465 | 804 | zlib | 3590 | `40b4022d10790758095ab9c9847f2f582257b3eac8d013212f257f18e68b61ba` |
| Q612052 | 612052 | 1623 | plain | 1619 | `577a37d7bc6dafbc4a5053ba6227e33066c2a6b601780d9d0fcb5dfc8ea80da2` |
| Q664736 | 664736 | 941 | zlib | 4349 | `b0ecfbc0b86b1fe5dfd0e6a9104d4ab1932205a8d6b7d5bba3f404863f7821b1` |
| Q8678030 | 8678030 | 646 | zlib | 2189 | `2e6ff7009f820d08d201854327d44a466057ea7c437e1517ddf5b89199f15d7b` |
| Q8693982 | 8693982 | 1735 | plain | 1731 | `5c108ee13343706774468a198fcfea1f0f22a350de7af604a3f1d7a59b2a643c` |
| Q8722495 | 8722495 | 723 | zlib | 2764 | `ef6561ec8e0cbf91cb07df558f9e7593c6a64b3f36a872931aea77b284f177d2` |
| Q8787441 | 8787441 | 1343 | zlib | 6236 | `07186f580840ab0cccaa2fdb5b22dec768f27b7d67ba804e07354096857c4b50` |
| Q916501 | 916501 | 5142 | zlib | 25783 | `b29ba19e1bd5ed04e2334aab57ddcbf386331dbe136751c77f05f47a9e35edd2` |
| Q922020 | 922020 | 3441 | zlib | 15177 | `dfc6ccb9eb02a7c90acc5b27aa351b912e1847cdc90d00dbb93bb29991ea32a6` |
| Q679418 | 679418 | 1424 | zlib | 7863 | `8e83b762134d12696649e6302adec9f40bbad7618b2c9cbff5ad945f005dd829` |
| Q686141 | 686141 | 939 | plain | 935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| Q665677 | 665677 | 992 | zlib | 3578 | `199459336be17ccb510d1912ef53648342e8903ea95d84b59275f6bcbf4b135e` |
| Q672838 | 672838 | 1325 | zlib | 4997 | `2180bf600ca5a34ebbf35f65a343ca95be10055e3abcc7561efd5bc4fab8f51e` |
| Q667573 | 667573 | 3694 | zlib | 17486 | `bbc1e26fa83771fc56581b1dc34ec762b3789444dacef76cb24334834e17e82c` |
| Q8796406 | 8796406 | 630 | plain | 626 | `a0810e1c287e4e2eb22bb24cf75308a7bf492a7e5a45b683f6eaec52f8c898fe` |
| Q602267 | 602267 | 521 | plain | 517 | `36f300fe57216b5d2e8cc8b95cdec472db04555aafe2ce3c7e79b39100144606` |

R为 `references/RPGMV/NewData/js/rpg_objects.js`，A为同目录 `rpg_managers.js`。

- `rpg_objects.js`：304315 bytes，SHA-256 `2d43dd9d8974c88a1b82ffa493d6d8a02c4ce1d0dfc8f05e6c0ab731e3f0573e`。
- `rpg_managers.js`：83985 bytes，SHA-256 `b3d5c746cf52234bdd34af746dbf3caecf96bb3477cc6d24121c4a1a11241114`。

## 共享参数组（各节引用即纳入该节完整契约）

| 组 | 正式表达与原生映射 | 值域/None | 编辑器初值与固定DSL默认 | 证据、校验与验证 |
| --- | --- | --- | --- | --- |
| AUDIO(folder) | audio:{asset,volume,pitch,pan} → {name,volume,pitch,pan}；asset为audioAsset对应目录或null→name空串 | volume整数0..100；pitch整数50..150；pan整数−100..100，非步长倍数也不能仅因UI箭头stepSize而拒绝；四个对象键独立保存 | 通用控件为name空、90/100/0；132/133/139/140有工程值覆盖，详各节。DSL音频/目标必填；90/100/0仅省略候选，未逐族批准 | Q662985:21–42、Q642887:12–16/54–90/129–130；Q618109:248/260–264明确None。空名不禁参数控件，保存不裁参数；Asset目录必须匹配，None不查资产。最小样本空名+volume0/pitch50/pan−100，另有名+100/150/100。 |
| TONE | tone:{red,green,blue,gray} → [r,g,b,gray] | RGB整数−255..255；gray整数0..255；准确4槽，包括138隐藏的gray | RGB/gray控件没显式value，0为已查明的框架初值；138从System读取。DSL颜色为核心显式值，无自动整组默认 | Q643923:15–20/32–74/159–164；均无None。边界色及gray非零往返；隐藏不代表可丢。 |
| FLASH | color:{red,green,blue,alpha} → [r,g,b,a] | 四项整数0..255 | 显式控件初值255/255/255/170；核心颜色仍显式 | Q645983:15–20/24–65/94–99；边界0/255，alpha非默认。 |
| DURATION | duration/frames →整数；wait→布尔独立槽（有wait的命令） | frames/seconds依命令，控件值1..999；wait不因时长或上下文被删除 | Q687080显式value60、wait=true；Fadeout音频覆盖duration10。DSL时长是核心必填，wait=true可作固定默认候选，未逐族批准 | Q687080:25–27/43–49；验证1/999以及wait两值，拒绝0/1000只按已确认控件契约，勿说runtime必拒。 |
| VEHICLE | vehicle:boat/ship/airship →0/1/2 | 固定原生运行对象类别枚举，无Project Data Reference/None | 编辑器ComboBox首项为框架初值；DSL必填 | Q916501:281–283；用三车样本。 |
| CHARACTER | {kind:runtimeSelector,scope:character,target:player/thisEvent/eventId,id?} →−1/0/正event ID | 仅player有−1，thisEvent为0；eventId必须正整数。Q612052枚举当前地图events数组所有非空位置，没有999常量上限；203不允许player | DSL目标必填，不把编辑器首项player/thisEvent当默认 | Q612052:12–16/44–64；R:9028–9037 character()区分运行上下文。合法位置当前缺失按已决警告；未知Common Event不报固定地图缺失。检验player、thisEvent、存在/缺失event位置。 |
| MAP-LOCATION | destination:{kind:direct,map:mapRef,x,y} →mode0,mapId,x,y；或{kind:variables,map:variableRef,x:variableRef,y:variableRef}→mode1,三个variable ID | direct map为固定Project Data Reference；13 Q5接受x/y整数0..2,147,483,647，拒负零。变量模式只验证引用，不限制将来值。源控件默认当前地图、0/0，无固定9999上限 | 整个目标与所选模式全部字段必填，无继承当前地图的DSL默认 | Q664736:19–27/34–88/113–125，Q8678030:15–18/31–40，Q8693982:33–55。13 Q7固定目标地图缺失error，域内坐标超Snapshot宽高warning并保留；不裁剪。 |
| CURRENT-LOCATION | location/destination:{kind:direct,x,y}→mode0,x,y；或{kind:variables,x:variableRef,y:variableRef}→mode1,两变量ID | 与MAP-LOCATION相同但无map槽；当前地图属于运行上下文 | 字段必填；编辑器direct选中、x/y0，DSL不继承 | Q664736；203另加exchange，285无exchange。不同调用地图/地图缩小样本。 |
| PICTURE | pictureId→整数1..100，属于运行图片槽；image→pictures Asset或null；origin:upperLeft/center→0/1；position:direct{x,y}/variables{x,y}→type0/1与两个值；scaleX/Y；opacity；blendMode | 直接x/y整数−9999..9999；scaleX/Y整数−2000..2000（负数合法）；opacity整数0..255；blend normal/additive/multiply/screen→0/1/2/3 | 初值pictureId由min1与Qt初值决定，image空，origin框架首项0，direct显式选中，x/y框架0，scale显式100/100，opacity显式255，blend框架首项0。DSL目标/position/image必填；其余候选默认尚待逐项定稿 | Q676413:19–32，Q695465:18–21/28–33/42–100/105–115，Q666669:19–35，Q694489:16–32，Q916501:253–258/314–316。图片槽无静态存在性要求；变量存在性照常。image None经Q8722495→Q8787441:50–64与Q618109证实。 |

以上完整显式形式可表达所有本表已证参数，不把未定可省略性误报为原生功能无法表达。可省略API定稿责任需由汇总研究的设计前置明确跟踪。

### 13号票已接受的直接坐标域与诊断

[13号票Answer](../../issues/13-native-value-domain-boundaries.md#answer)的Q1–Q8及完整契约已最终确认，13已resolved；以下为Q2/Q5/Q7的已接受坐标规则。E201/202/203/285的direct x/y在正式编写、反编译及可识别raw中统一为0..2,147,483,647整数，负数、小数、非有限、域外和负零均error。目标QML `int`声明是静态事实；该非负32位整段域是有限产品支持选择，不保证每个值可点选或目标极值已实测。不能把地图缩小后的域内越界值判成形状错误，也不改写坐标。

E201/202按固定目标map的Snapshot尺寸检查，x>=width或y>=height给warning，map缺失error。E203/285在Map Event内只按所属地图给条件性上下文warning，不将声明位置当成所有执行路径的地图证明；Common Event等无法确定地图时不猜、不要求声明，不仅因未知本身报警。变量模式验证所有输入/输出引用，不限制未来读值。既有容器不适用和selector警告继续适用，不做全程序分析；Map Event初始位置、图片坐标、相对位移与exchange的保存占位不采用本域。

验收覆盖0/边缘/最大值、负零/域外、缩图保留、缺固定地图、跨不同地图调用Common Event、条件性上下文warning和变量引用；合成支持夹具与普通UI创建分开，实际重确认和游戏后果仍未执行。

## 逐指令契约
### E132 — Change Battle BGM

**正式表达（机械映射）**：`changeBattleBgm({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]：AUDIO(bgm)，数组长1 | 保留完整四键；asset:null仅变name为空 |

**编辑器初值 / 固定DSL默认**：Q754957:17–22从System.battleBgm复制初值；并非固定90/100/0。DSL audio必填，四子字段当前完整显式，无新增默认。

**证据**：Q754957:15–22；Q662985:21–42；共享AUDIO；R:9635–9638

**校验与运行边界**：对应类别Asset Reference，不解析数据库。None设置空音频对象；不得改写为停止当前播放命令或删除该设置。

**最小验收样本（未执行）**：System音频设非默认后新建；设None并保留0/50/−100；重开事件、重确认音频分开保存，之后触发对应战斗音乐/结果音。

**参数拒绝夹具候选（未执行）**：AUDIO对象缺name/volume/pitch/pan、错目录、volume−1/101、pitch49/151、pan−101/101、小数及非布尔/非数值；null只能在asset字段。

### E133 — Change Victory ME

**正式表达（机械映射）**：`changeVictoryMe({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]：AUDIO(me)，数组长1 | 保留完整四键；asset:null仅变name为空 |

**编辑器初值 / 固定DSL默认**：Q728356:17–22从System.victoryMe复制初值；并非固定90/100/0。DSL audio必填，四子字段当前完整显式，无新增默认。

**证据**：Q728356:15–22；Q662985:21–42；共享AUDIO；R:9641–9644

**校验与运行边界**：对应类别Asset Reference，不解析数据库。None设置空音频对象；不得改写为停止当前播放命令或删除该设置。

**最小验收样本（未执行）**：System音频设非默认后新建；设None并保留0/50/−100；重开事件、重确认音频分开保存，之后触发对应战斗音乐/结果音。

**参数拒绝夹具候选（未执行）**：同AUDIO边界，使用bgm而非me类别应失败。

### E134 — Change Save Access

**正式表达（机械映射）**：`changeSaveAccess({enabled})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| enabled | p[0]仅0/1；enabled=false→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；enabled=false。DSL核心操作必填，无默认。

**证据**：Q802494:11–18；Q649305:23–35、Q680842:20/27–33；R:9647起相应函数

**校验与运行边界**：无项目引用、None或Script。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：enabled为0、字符串或缺失；原生p[0]=2；多余槽。

### E135 — Change Menu Access

**正式表达（机械映射）**：`changeMenuAccess({enabled})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| enabled | p[0]仅0/1；enabled=false→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；enabled=false。DSL核心操作必填，无默认。

**证据**：Q783833:11–18；Q649305:23–35、Q680842:20/27–33；R:9657起相应函数

**校验与运行边界**：无项目引用、None或Script。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：enabled非boolean/缺失，原生−1或2。

### E136 — Change Encounter

**正式表达（机械映射）**：`changeEncounter({enabled})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| enabled | p[0]仅0/1；enabled=false→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；enabled=false。DSL核心操作必填，无默认。

**证据**：Q763630:11–18；Q649305:23–35、Q680842:20/27–33；R:9667起相应函数

**校验与运行边界**：无项目引用、None或Script。原生还重置遇敌计数；按MV编辑器命名规则从现实现changeEncounterDisable改成changeEncounter，原生槽意义不变。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：enabled非boolean/缺失，原生2；旧disabled字段不能与新schema混用。

### E137 — Change Formation Access

**正式表达（机械映射）**：`changeFormationAccess({enabled})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| enabled | p[0]仅0/1；enabled=false→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；enabled=false。DSL核心操作必填，无默认。

**证据**：Q738060:11–18；Q649305:23–35、Q680842:20/27–33；R:9678起相应函数

**校验与运行边界**：无项目引用、None或Script。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：enabled非boolean/缺失，原生2。

### E138 — Change Window Color

**正式表达（机械映射）**：`changeWindowColor({tone})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| tone | p[0]=TONE四槽；数组长1 | gray界面隐藏仍载入与保存，不能缩为RGB三槽 |

**编辑器初值 / 固定DSL默认**：新建从System.windowTone读取；已存读取原槽。DSL tone四字段显式，无从System取默认。

**证据**：Q716708:19–24/27–41、Q643923:15–20/159–164；R:9688–9691

**校验与运行边界**：无引用/None/Script；gray可能不参与窗口渲染，仍保留编辑保存状态。

**最小验收样本（未执行）**：System.windowTone含非零gray；确认138、无操作重开保存；反编译编译必须仍四槽且gray一致。

**参数拒绝夹具候选（未执行）**：tone三槽/五槽、RGB−256/256、gray−1/256、小数；不删除隐藏第四槽。

### E139 — Change Defeat ME

**正式表达（机械映射）**：`changeDefeatMe({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]：AUDIO(me)，数组长1 | 保留完整四键；asset:null仅变name为空 |

**编辑器初值 / 固定DSL默认**：Q793772:17–22从System.defeatMe复制初值；并非固定90/100/0。DSL audio必填，四子字段当前完整显式，无新增默认。

**证据**：Q793772:15–22；Q662985:21–42；共享AUDIO；R:9694–9697

**校验与运行边界**：对应类别Asset Reference，不解析数据库。None设置空音频对象；不得改写为停止当前播放命令或删除该设置。

**最小验收样本（未执行）**：System音频设非默认后新建；设None并保留0/50/−100；重开事件、重确认音频分开保存，之后触发对应战斗音乐/结果音。

**参数拒绝夹具候选（未执行）**：同AUDIO边界，非me目录及缺独立参数。

### E140 — Change Vehicle BGM

**正式表达（机械映射）**：`changeVehicleBgm({vehicle,audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| vehicle | p[0]=VEHICLE | boat/ship/airship→0/1/2 |
| audio | p[1]=AUDIO(bgm) | 数组长2；None时全部音频参数独立 |

**编辑器初值 / 固定DSL默认**：vehicle是框架首项；切换vehicle会从System对应boat/ship/airship.bgm重填，onLoad再载入已有audio。DSL vehicle/audio显式，无工程值默认。

**证据**：Q804465:15–20/23–27/30–59/63–74；R:9700–9706；共享AUDIO

**校验与运行边界**：固定车辆类别，不是数据库引用；asset需bgm类别或null，None不等于删除车辆。

**最小验收样本（未执行）**：三车分别非默认BGM；None+非默认音量/音高/声像；切车的编辑重填与无操作往返分开记录。

**参数拒绝夹具候选（未执行）**：vehicle=3/未知枚举；audio错目录/缺字段；AUDIO全部边界外值。

### E201 — Transfer Player

**正式表达（机械映射）**：`transferPlayer({destination,direction?,fade?})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| destination | p[0..3]=MAP-LOCATION | mode0固定地图/坐标；mode1三变量；全部模式字段必填 |
| direction | p[4]=retain/down/left/right/up→0/2/4/6/8 | 0保持朝向，非down |
| fade | p[5]=black/white/none→0/1/2 | 数组长6；None是淡出枚举，不是素材null |

**编辑器初值 / 固定DSL默认**：编辑器direct显式选中、当前map及0/0；方向/fade依首项初值。**已决DSL** direction=retain、fade=black，只有精确0可反编译省略；destination必填。

**证据**：Q758295:15–32/37–56；Q916501:303–305/339–341/554–560；共享MAP-LOCATION；R:9709–9726

**校验与运行边界**：固定map缺失报错；三个variable引用存在性报错；未来地图/坐标值不预测。战斗中函数不推进_index而返回false，按已决警告可能停滞。13 Q7：direct域内值超固定目标地图Snapshot宽高warning并保留，不能静默裁剪。

**最小验收样本（未执行）**：两位置模式×五方向×三fade覆盖；含方向retain；地图缩小后旧坐标；Common Event被不同地图调用；战斗上下文停滞样本单独受控运行。

**参数拒绝夹具候选（未执行）**：mode未知或同时给direct与variables；缺map/x/y；固定map或变量不存在；direction=1、fade=3；direct x/y负数、小数、非有限、负零、2,147,483,648。域内当前越界是warning，不编造9999硬界。

### E202 — Set Vehicle Location

**正式表达（机械映射）**：`setVehicleLocation({vehicle,destination})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| vehicle | p[0]=VEHICLE | 0/1/2 |
| destination | p[1..4]=MAP-LOCATION | 数组长5；没有direction/fade |

**编辑器初值 / 固定DSL默认**：编辑器车辆首项、direct当前地图0/0；DSL两个核心字段显式，无默认。

**证据**：Q733751:15–43；共享MAP-LOCATION；R:9729–9745

**校验与运行边界**：固定地图与变量按Project Data Reference；未来运行坐标不预测。13 Q7：direct域内值超固定目标地图Snapshot宽高warning并保留。车辆类别无数据库存在性检查。

**最小验收样本（未执行）**：三车×两模式；变量给远地图；当前map缩小后的已存目标，验证未自动裁剪。

**参数拒绝夹具候选（未执行）**：vehicle未知、mode2、缺所选模式字段、固定map或variable缺失；direction/fade为不支持字段。

### E203 — Set Event Location

**正式表达（机械映射）**：`setEventLocation({target,destination,direction?})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| target | p[0]=CHARACTER子集thisEvent/eventId | 编辑器includePlayer=false；不接受player |
| destination direct/variables | p[1]=0/1，p[2],p[3]=CURRENT-LOCATION | 直接坐标/变量来源互斥 |
| destination exchange | p[1]=2，p[2]=另一个事件CHARACTER子集，p[3]=0 | 交换目标亦不含player；当前已证普通生成p[3]为0，任意非0未证为普通原生形态，不能静默丢掉 |
| direction | p[4]=retain/down/left/right/up→0/2/4/6/8 | 数组长5 |

**编辑器初值 / 固定DSL默认**：direct初选；target含thisEvent首项；方向retain为框架首项。**已决DSL** direction=retain；目标/模式所有参数必填。

**证据**：Q711364:15–33/36–59；Q664736:92–108/126–129；Q612052；R:9748–9768

**校验与运行边界**：缺当前事件位置按Runtime Selector警告；固定变量引用报错。13 Q7：Map Event内direct仅按所属地图作条件性越界warning，Common Event不猜运行地图、不仅因未知报警。exchange保存p[3]非0为未证形态，按ADR0012拒绝并标unsupported，不将其冒称运行非法；不把direct数值域推广到exchange占位。

**最小验收样本（未执行）**：三模式×retain及四向；thisEvent交换自身；缺失event；exchange规范p[3]=0；额外非0合成输入应诊断且不得重写为0。

**参数拒绝夹具候选（未执行）**：player作为target/exchange；mode3；变量ID0/不存在；direction1；exchange p[3]非0作未证形态，不修复。

### E204 — Scroll Map

**正式表达（机械映射）**：`scrollMap({direction,distance,speed})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| direction | p[0]=down/left/right/up→2/4/6/8 | 无retain |
| distance | p[1]整数0..100 | 0是正常控件值，不能要求正整数 |
| speed | p[2]整数1..6 | 数组长3；没有wait槽 |

**编辑器初值 / 固定DSL默认**：distance显式1；MovementSpeedBox默认与映射见Q602267（currentIndex3→value4）；方向框架首项down。DSL均为核心显式，无默认。

**证据**：Q791112:16–38/40–56，Q602267；R:9771–9780

**校验与运行边界**：无引用。战斗中跳过；地图已有滚动时等待旧滚动完成才启动本次，不等价自动wait当前新滚动；不能加原生没有的wait参数。

**最小验收样本（未执行）**：四方向；distance0/100；speed1/6；相邻两scroll与战斗中调用，核对启动/等待顺序。

**参数拒绝夹具候选（未执行）**：retain方向、distance−1/101、小数、speed0/7；多余wait字段。

### E205 — Set Movement Route

**正式表达**：`setMovementRoute({target,route:{commands,repeat?,skippable?,wait?,terminator?}})`。2026-10-19的12号票Q4已接受terminator和移动指令savedShape字段，详细允许组合及默认见[movement已接受外壳契约](movement.md#2026-10-19--已接受的有限外壳契约)。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| target | p[0]=CHARACTER全子集 | player/thisEvent/eventId |
| route | p[1]={list,repeat,skippable,wait} | commands必填可空；三个flag为布尔 |
| 续行505 | 每个非终止list项对应同indent 505，parameters=[该项] | 顺序及完整保存对象必须一致；终止项不镜像；父参数数组长2 |

**编辑器初值 / 固定DSL默认**：共享DSL**已决**repeat=true/skippable=false/wait=false；**编辑器Set Movement Route** Q665677:44–58是false/false/true（前两框架false，wait显式true），与自主页模板及DSL默认不同。反编译只按已决DSL默认省略。

**证据**：Q771946:22–46，Q665677:11–17/30–58/96–103，Q672838:169–177，Q667573:438–442；R:9783–9793；详[movement.md](movement.md)

**校验与运行边界**：完整递归commands与Script Gate，即使wait=false或不可达。普通无参工厂构造{code}而非{code,parameters:[]}；插入和最终JSON链静态推导indent:null，尚无真实UI保存观察。12号票Q4接受普通指令savedShape.indent为absent/null、默认absent，路线terminator.parameters为absent/empty、默认empty；M0缺indent，无参固定缺parameters，有参为精确数组。不得泛化其他组合或用raw绕过。

**最小验收样本（未执行）**：空路线；含无参/有参/Script多项及终止；205与全部505精确镜像；三flag非默认组合；正常新建无参路线的缺parameters/indent:null重点收集原生落盘样本。

**参数拒绝夹具候选（未执行）**：目标不支持的selector；缺commands、非boolean flags、未知移动code、嵌套Script且Gate关闭、505镜像不一致；移动记录外壳按12号票Q4已接受矩阵，不把被接受的缺parameters/indent:null当未知字段，也不把矩阵外组合静默归一化。

### E206 — Get on/off Vehicle

**正式表达（机械映射）**：`getOnOffVehicle()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9796起相应函数

**校验与运行边界**：无引用/None/Script。调用player.getOnOffVehicle；能否上下船依执行时位置/地形，不静态保证成功。

**最小验收样本（未执行）**：步行邻船、乘船、无法下船三场景；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：有参数记录[0]、额外helper输入字段；不能给目标参数。

### E211 — Change Transparency

**正式表达（机械映射）**：`changeTransparency({transparent})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| transparent | p[0]仅0/1；transparent=true→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；transparent=true。DSL核心操作必填，无默认。

**证据**：Q774274:11–18；Q649305:23–35、Q680842:20/27–33；R:9802起相应函数

**校验与运行边界**：无项目引用、None或Script。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：transparent非boolean/缺失，原生2。

### E212 — Show Animation

**正式表达（机械映射）**：`showAnimation({target,animation,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| target | p[0]=CHARACTER | player/thisEvent/eventId |
| animation | p[1]=animationRef ID | 现有Animations条目；无0/None选项 |
| wait | p[2]布尔 | 数组长3 |

**编辑器初值 / 固定DSL默认**：target首项player、animation首个数据库选项，wait框架false；DSL目标/引用显式，wait本表完整显式，false仅可省略候选。

**证据**：Q753630:15–50、Q612052；R:9808–9817；GameObjectBox includeZero默认false见[既有证据](../command-contract-editor-evidence.md)

**校验与运行边界**：animation固定引用缺失报错；target未命中警告；战斗中character()不返回地图角色。Workspace必须实际加载Animations。

**最小验收样本（未执行）**：player/thisEvent/eventId各一；wait两值；动画ID0和不存在ID错误；未命中事件警告保留。

**参数拒绝夹具候选（未执行）**：animationRef ID0/缺失、非animation类别、target非法selector、wait非boolean；Runtime Selector合法但缺位置只警告。

### E213 — Show Balloon Icon

**正式表达（机械映射）**：`showBalloonIcon({target,balloon,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| target | p[0]=CHARACTER | player/thisEvent/eventId |
| balloon | p[1]=1..15 | 完整序列：exclamation1/question2/musicNote3/heart4/anger5/sweat6/cobweb7/silence8/lightBulb9/zzz10/userDefined1..5为11..15；无None0 |
| wait | p[2]布尔 | 数组长3 |

**编辑器初值 / 固定DSL默认**：targetplayer、balloon首项1、wait框架false；DSL目标/balloon显式，wait显式待定省略。

**证据**：Q727003:15–50；Q916501:307–313；R:9820–9829

**校验与运行边界**：balloon是原生枚举，不是数据库ID/Asset；支持用户定义图格11..15，不要求解释其图像。目标缺失警告。

**最小验收样本（未执行）**：15种图标表驱动往返；1/15运行；0/16错误；wait两值。

**参数拒绝夹具候选（未执行）**：balloon0/16/小数，target非法模式，wait非boolean。

### E214 — Erase Event

**正式表达（机械映射）**：`eraseEvent()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9832起相应函数

**校验与运行边界**：无引用/None/Script。只在isOnCurrentMap且_eventId>0时擦当前事件；调用方上下文决定，Common Event无地图身份时不推断成功。

**最小验收样本（未执行）**：地图事件自身调用、Common Event继承事件调用、无调用事件上下文；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：原生额外参数、给eraseEvent虚构event target。

### E216 — Change Player Followers

**正式表达（机械映射）**：`changePlayerFollowers({visible})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| visible | p[0]仅0/1；visible=true→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；visible=true。DSL核心操作必填，无默认。

**证据**：Q761958:11–18；Q649305:23–35、Q680842:20/27–33；R:9840起相应函数

**校验与运行边界**：无项目引用、None或Script。原生还refresh player，不仅写followers布尔。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：visible非boolean/缺失、原生2。

### E217 — Gather Followers

**正式表达（机械映射）**：`gatherFollowers()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9851起相应函数

**校验与运行边界**：无引用/None/Script。地图中集合followers并设置gather等待；战斗中跳过。

**最小验收样本（未执行）**：地图队员分散及战斗调用；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：额外原生参数或虚构wait flag。

### E221 — Fadeout Screen

**正式表达（机械映射）**：`fadeoutScreen()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9860起相应函数

**校验与运行边界**：无引用/None/Script。原生使用fadeSpeed并等待；消息busy时先不推进。无可编写duration/wait槽。

**最小验收样本（未执行）**：默认时长淡出；消息期间排队；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：额外duration/wait参数；原生非空parameters。

### E222 — Fadein Screen

**正式表达（机械映射）**：`fadeinScreen()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9870起相应函数

**校验与运行边界**：无引用/None/Script。原生使用fadeSpeed并等待；消息busy时先不推进。无可编写duration/wait槽。

**最小验收样本（未执行）**：先淡出后淡入；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：额外duration/wait参数；原生非空parameters。

### E223 — Tint Screen

**正式表达（机械映射）**：`tintScreen({tone,duration,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| tone | p[0]=TONE四项 | 无None |
| duration/wait | p[1]=DURATION frames，p[2]=boolean | 数组长3；time1..999 |

**编辑器初值 / 固定DSL默认**：tone框架0/0/0/0，duration显式60，wait显式true；DSL完整显式，不新增省略默认。

**证据**：Q739653:15–46；共享TONE/DURATION；R:9880–9886

**校验与运行边界**：数值范围和布尔形状检查；无引用/Script。

**最小验收样本（未执行）**：RGB−255/255、gray0/255；duration1/999×wait；屏幕色调准确恢复。

**参数拒绝夹具候选（未执行）**：RGB−256/256、gray−1/256、duration0/1000/小数，wait非boolean，tone键/长度错误。

### E224 — Flash Screen

**正式表达（机械映射）**：`flashScreen({color,duration,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| color | p[0]=FLASH四项 | alpha仍独立保存 |
| duration/wait | p[1]=DURATION frames，p[2]=boolean | 数组长3 |

**编辑器初值 / 固定DSL默认**：color显式255/255/255/170，duration60、waittrue；DSL完整显式。

**证据**：Q717742:15–46；共享FLASH/DURATION；R:9889–9895

**校验与运行边界**：无引用/Script/None；不将alpha0优化成删除命令。

**最小验收样本（未执行）**：alpha0与255，非白色；duration边界×wait；检查空效果仍保留。

**参数拒绝夹具候选（未执行）**：RGBA−1/256、duration0/1000/小数、wait非boolean，缺alpha。

### E225 — Shake Screen

**正式表达（机械映射）**：`shakeScreen({power,speed,duration,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| power/speed | p[0],p[1]整数1..9 | 0不是本体控件可输入值 |
| duration/wait | p[2]=DURATION frames，p[3]=boolean | 数组长4 |

**编辑器初值 / 固定DSL默认**：power/speed显式5/5，duration60、waittrue；DSL核心操作完整显式，wait尚未逐族选默认。

**证据**：Q794305:20–35/41–64；共享DURATION；R:9898–9904

**校验与运行边界**：无引用/Script/None；不要与Scroll Map speed1..6混淆。

**最小验收样本（未执行）**：power/speed1和9；duration1/999；wait两值；不裁剪超界输入。

**参数拒绝夹具候选（未执行）**：power/speed0/10、小数，duration0/1000，wait非boolean。

### E230 — Wait

**正式表达（机械映射）**：`wait({frames})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| frames | p[0]整数1..999 | 数组长1；没有wait布尔 |

**编辑器初值 / 固定DSL默认**：Group_Duration显式60。frames为核心参数必填；旧位置参数wait(number)不作为新规范。

**证据**：Q720992:15–32；Q687080:25–27；R:9907–9910

**校验与运行边界**：无引用/Script/None。

**最小验收样本（未执行）**：1/999帧；0及1000按所选正式范围错误；不同父嵌套列表都保持等待记录。

**参数拒绝夹具候选（未执行）**：frames0/1000/小数、缺frames、旧位置参数形状。

### E231 — Show Picture

**正式表达（机械映射）**：`showPicture({pictureId,image,position,origin,scaleX,scaleY,opacity,blendMode})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| pictureId/image | p[0]图片槽1..100；p[1]素材名或空串 | image为pictures Asset或null；即使None保留整条记录 |
| origin/position | p[2]origin0/1；p[3]位置mode0/1；p[4],p[5]坐标或variable IDs | 详共享PICTURE；模式参数互斥且必填 |
| 显示参数 | p[6],p[7]scale；p[8]opacity；p[9]blendMode | 数组长10；全部范围见PICTURE |

**编辑器初值 / 固定DSL默认**：见共享PICTURE的逐控件初值；固定DSL默认未逐项接受，表中全部显式。

**证据**：Q796225:15–63；共享PICTURE；Q8722495→Q8787441；R:9913–9925

**校验与运行边界**：图片槽不是现有图片引用；变量引用须存在。None创建Game_Picture并保留位置/变换，不能改为Erase Picture。

**最小验收样本（未执行）**：None+负scale+center+非默认opacity/blend；图片槽1/100；直接/变量位置；运行确认负scale翻转及空素材记录仍存在。

**参数拒绝夹具候选（未执行）**：pictureId0/101、小数；image错目录/空名Asset；origin2；mode未知或变量缺失；直接x/y−10000/10000；scale−2001/2001；opacity−1/256；blend4。

### E232 — Move Picture

**正式表达（机械映射）**：`movePicture({pictureId,position,origin,scaleX,scaleY,opacity,blendMode,duration,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| pictureId/保留槽 | p[0]图片槽；p[1]固定0 | p[1]是编辑保存器显式写0的未使用槽，不是image、duration或boolean |
| origin/position/显示 | p[2..9]与231相同 | None素材不存在于本命令；无image字段 |
| duration/wait | p[10]1..999 frames；p[11]boolean | 数组长12 |

**编辑器初值 / 固定DSL默认**：PICTURE初值、DURATION60/waittrue；本表显式全部有意义字段，p[1]由正规结构写0。

**证据**：Q775953:15–42/44–74，特别:64；R:9928–9943忽略p[1]；共享PICTURE/DURATION

**校验与运行边界**：p[1]非0尚无普通原生生成证据；拒绝时须标unsupported，不能把它静默归0或raw。当前未显示该图片不报固定引用缺失；runtime move对无图不生效。

**最小验收样本（未执行）**：slot1/100、负缩放、变量位置、两wait；原生p[1]=0精确保留；合成非0错误且不产生部分decompile源码。

**参数拒绝夹具候选（未执行）**：同231的非素材边界；duration0/1000、wait非boolean；p[1]非0为未证形态并拒绝改写；多余image。

### E233 — Rotate Picture

**正式表达（机械映射）**：`rotatePicture({pictureId,speed})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| pictureId | p[0]图片槽1..100 | Runtime Selector |
| speed | p[1]整数−90..90 | 0停止旋转；正值逆时针；数组长2 |

**编辑器初值 / 固定DSL默认**：pictureId最小1，speed框架0；DSL目标和操作必填，无默认。

**证据**：Q756958:16–31/36–50；R:9946–9949

**校验与运行边界**：不要求当前图片已存在；不把0等价删除命令。

**最小验收样本（未执行）**：−90/0/90；未show图片再rotate；停止旋转保存语义。

**参数拒绝夹具候选（未执行）**：pictureId0/101、speed−91/91/小数。

### E234 — Tint Picture

**正式表达（机械映射）**：`tintPicture({pictureId,tone,duration,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| pictureId | p[0]图片槽1..100 | Runtime Selector |
| tone | p[1]=TONE | 四槽 |
| duration/wait | p[2]=DURATION frames；p[3]boolean | 数组长4 |

**编辑器初值 / 固定DSL默认**：pictureId最小1；tone框架0，duration60/waittrue；DSL完整显式。

**证据**：Q731389:15–54；共享PICTURE/TONE/DURATION；R:9952–9958

**校验与运行边界**：图片未存在时保留命令；变量没有本命令目标模式。

**最小验收样本（未执行）**：pictureId1/100，非零gray和RGB边界，duration1/999；wait两值。

**参数拒绝夹具候选（未执行）**：pictureId0/101、tone RGB±256或gray−1/256、duration0/1000、wait非boolean。

### E235 — Erase Picture

**正式表达（机械映射）**：`erasePicture({pictureId})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| pictureId | p[0]整数1..100 | 数组长1；不是素材引用 |

**编辑器初值 / 固定DSL默认**：picker起点1；目标必填，无固定默认。

**证据**：Q708128:15–33；Q676413:19–25；R:9961–9964

**校验与运行边界**：不要求运行时图片存在；无None/Script；本命令与Show Picture None不同。

**最小验收样本（未执行）**：存在和不存在的图片槽；1/100；与空素材Show的结构、运行状态对比。

**参数拒绝夹具候选（未执行）**：pictureId0/101/小数或缺失；不得用素材名代替槽。

### E236 — Set Weather Effect

**正式表达（机械映射）**：`setWeatherEffect({weather,power,duration,wait})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| weather | p[0]字符串none/rain/storm/snow | 完整枚举；none仍是字符串而非null |
| power | p[1]整数1..9 | none时也独立保存，不能归0或删除 |
| duration/wait | p[2]=DURATION frames；p[3]boolean | 数组长4 |

**编辑器初值 / 固定DSL默认**：weather首项none；power显式5、duration60/waittrue；DSL核心字段显式，未批准通用默认。

**证据**：Q786953:21–36/42–65；Q916501:342–347；R:9967–9975

**校验与运行边界**：无引用。战斗中整个效果和wait跳过，按上下文警告而非编译拒绝。

**最小验收样本（未执行）**：四种weather，尤其none+power9；duration边界×wait；地图与战斗场景。

**参数拒绝夹具候选（未执行）**：weather未知字符串/null；power0/10即使weather=none也不伪装成正常默认；duration0/1000，wait非boolean。

### E241 — Play BGM

**正式表达（机械映射）**：`playBgm({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]=AUDIO(bgm) | 数组长1；完整音频四键，None也保留独立volume/pitch/pan |

**编辑器初值 / 固定DSL默认**：通用AudioSelector显式name空、90/100/0；不启用restoreLast。DSL完整显式，目标asset必须写Asset或null。

**证据**：Q710234:11–14；Q662985:21–42、Q642887:12–19/54–90；R:9978起；A:1175–1194

**校验与运行边界**：对应Asset目录检查；无数据库引用/Script。None停止当前BGM且更新当前音频记录；不是删除该命令。

**最小验收样本（未执行）**：None+0/50/−100与有名+100/150/100，另volume1/pitch51/pan1验证不是只能步长倍数；空素材运行行为单独观察。

**参数拒绝夹具候选（未执行）**：AUDIO缺键、错目录、volume−1/101/pitch49/151/pan−101/101、小数；Asset空名拒绝。

### E242 — Fadeout BGM

**正式表达（机械映射）**：`fadeoutBgm({duration})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| duration | p[0]整数1..999秒 | 单位seconds；无wait槽，数组长1 |

**编辑器初值 / 固定DSL默认**：本组件显式value10，覆盖Group_Duration的60；DSL核心duration必填，无默认。

**证据**：Q789560:15–19/22–34，Q687080:25–26；R:9984起相应函数

**校验与运行边界**：无引用/Script。不能把秒误乘为frames；调用后解释器继续，不自动等fade结束。

**最小验收样本（未执行）**：1秒、999秒的编译往返；短时运行与下一条消息并行，确认未新增等待。

**参数拒绝夹具候选（未执行）**：duration0/1000/小数、单位字段误用frames或虚构wait参数。

### E243 — Save BGM

**正式表达（机械映射）**：`saveBgm()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9990起相应函数

**校验与运行边界**：无引用/None/Script。保存当前播放位置与音频信息；不应扩展为BGS。

**最小验收样本（未执行）**：播放BGM中保存后更换；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：原生非空参数或虚构目标音轨。

### E244 — Replay BGM

**正式表达（机械映射）**：`replayBgm()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:9996起相应函数

**校验与运行边界**：无引用/None/Script。恢复保存的BGM；本体命令名Replay BGM，当前resumeBgm须按已决MV命名规则替换。

**最小验收样本（未执行）**：保存BGM→换曲→Replay，另无先前保存；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：原生非空参数或虚构音轨/时长参数。

### E245 — Play BGS

**正式表达（机械映射）**：`playBgs({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]=AUDIO(bgs) | 数组长1；完整音频四键，None也保留独立volume/pitch/pan |

**编辑器初值 / 固定DSL默认**：通用AudioSelector显式name空、90/100/0；不启用restoreLast。DSL完整显式，目标asset必须写Asset或null。

**证据**：Q723873:11–14；Q662985:21–42、Q642887:12–19/54–90；R:10002起；A:1264–1276

**校验与运行边界**：对应Asset目录检查；无数据库引用/Script。None停止当前BGS且更新当前音频记录。

**最小验收样本（未执行）**：None+0/50/−100与有名+100/150/100，另volume1/pitch51/pan1验证不是只能步长倍数；空素材运行行为单独观察。

**参数拒绝夹具候选（未执行）**：同AUDIO边界及非bgs目录；Asset空名拒绝。

### E246 — Fadeout BGS

**正式表达（机械映射）**：`fadeoutBgs({duration})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| duration | p[0]整数1..999秒 | 单位seconds；无wait槽，数组长1 |

**编辑器初值 / 固定DSL默认**：本组件显式value10，覆盖Group_Duration的60；DSL核心duration必填，无默认。

**证据**：Q799130:15–19/22–34，Q687080:25–26；R:10008起相应函数

**校验与运行边界**：无引用/Script。不能把秒误乘为frames；调用后解释器继续，不自动等fade结束。

**最小验收样本（未执行）**：1秒、999秒的编译往返；短时运行与下一条消息并行，确认未新增等待。

**参数拒绝夹具候选（未执行）**：duration0/1000/小数、虚构wait参数。

### E249 — Play ME

**正式表达（机械映射）**：`playMe({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]=AUDIO(me) | 数组长1；完整音频四键，None也保留独立volume/pitch/pan |

**编辑器初值 / 固定DSL默认**：通用AudioSelector显式name空、90/100/0；不启用restoreLast。DSL完整显式，目标asset必须写Asset或null。

**证据**：Q734917:11–14；Q662985:21–42、Q642887:12–19/54–90；R:10014起；A:1329–1361

**校验与运行边界**：对应Asset目录检查；无数据库引用/Script。先stopMe；None不会创建新ME，并可能恢复此前暂停的BGM。

**最小验收样本（未执行）**：None+0/50/−100与有名+100/150/100，另volume1/pitch51/pan1验证不是只能步长倍数；空素材运行行为单独观察。

**参数拒绝夹具候选（未执行）**：同AUDIO边界及非me目录；Asset空名拒绝。

### E250 — Play SE

**正式表达（机械映射）**：`playSe({audio})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| audio | p[0]=AUDIO(se) | 数组长1；完整音频四键，None也保留独立volume/pitch/pan |

**编辑器初值 / 固定DSL默认**：通用AudioSelector显式name空、90/100/0；不启用restoreLast。DSL完整显式，目标asset必须写Asset或null。

**证据**：Q752170:11–14；Q662985:21–42、Q642887:12–19/54–90；R:10020起；A:1364–1385

**校验与运行边界**：对应Asset目录检查；无数据库引用/Script。None不播放新SE，保留已经播放的SE；不能编成Stop SE。

**最小验收样本（未执行）**：None+0/50/−100与有名+100/150/100，另volume1/pitch51/pan1验证不是只能步长倍数；空素材运行行为单独观察。

**参数拒绝夹具候选（未执行）**：同AUDIO边界及非se目录；Asset空名拒绝。

### E251 — Stop SE

**正式表达（机械映射）**：`stopSe()`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| 无参数 | parameters=[]；数组长0 | 只有固定操作，不能额外塞参数 |

**编辑器初值 / 固定DSL默认**：没有参数默认或省略问题。

**证据**：Q922020命令表相应code flag0；Q679418:202–207无对话框工厂；R:10026起相应函数

**校验与运行边界**：无引用/None/Script。停止全部SE；不等同Play SE None（后者不播放但不停止已有SE）。

**最小验收样本（未执行）**：并发两SE→Stop；与Play SE None对比；检查编译与往返保持[]。

**参数拒绝夹具候选（未执行）**：非空原生参数；不能用单个SE名限定Stop。

### E261 — Play Movie

**正式表达（机械映射）**：`playMovie({movie})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| movie | p[0]movies Asset文件名stem或null→空串 | 数组长1；编辑器列表筛webm，运行时按环境选webm/mp4，不把后缀写入槽 |

**编辑器初值 / 固定DSL默认**：movieName显式空；DSL目标必填，null显式，没有工程扫描选首文件的默认。

**证据**：Q738611:15–28/31–44；Q618109:248/260–264；R:10032–10050

**校验与运行边界**：None有本体picker证据；空名跳过视频与video wait，但命令仍推进。素材存在性不扩大为下载、运行文件扫描或动态媒体能力保证。

**最小验收样本（未执行）**：None、有名素材；视频播放与下一条事件等待；编译源保留无后缀stem。

**参数拒绝夹具候选（未执行）**：非movie类别、空名Asset、非字符串/非null目标、多余参数。

### E281 — Change Map Name Display

**正式表达（机械映射）**：`changeMapNameDisplay({enabled})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| enabled | p[0]仅0/1；enabled=true→0，另一值→1 | 布尔输入必填；数组长1 |

**编辑器初值 / 固定DSL默认**：第一RadioButton显式checked=true，保存0；enabled=true。DSL核心操作必填，无默认。

**证据**：Q770563:11–18；Q649305:23–35、Q680842:20/27–33；R:10054起相应函数

**校验与运行边界**：无项目引用、None或Script。

**最小验收样本（未执行）**：各布尔两值往返；在地图运行观察对应系统/显示状态，不按其他命令的0编码套用反转。

**参数拒绝夹具候选（未执行）**：enabled非boolean/缺失，原生2。

### E282 — Change Tileset

**正式表达（机械映射）**：`changeTileset({tileset})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| tileset | p[0]=tilesetRef ID | 数组长1；无None0 |

**编辑器初值 / 固定DSL默认**：GameObjectBox选现有tileset；DSL固定引用显式，不选第一条作为默认。

**证据**：Q747827:15–34；GameObjectBox无includeZero；R:10064–10083

**校验与运行边界**：Tilesets固定项目引用缺失报错，Workspace必须载入Tilesets；原生读取tilesetNames并等待资源，不能将缺ID当runtime selector警告。引用存在不保证图片能加载。

**最小验收样本（未执行）**：最小两套tileset切换；ID0/缺失ID报错；缺图另记录真实加载表现。

**参数拒绝夹具候选（未执行）**：tilesetRef ID0/不存在/错scope；null不是None。

### E283 — Change Battle Back

**正式表达（机械映射）**：`changeBattleBack({battleback1,battleback2})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| battleback1 | p[0]=battlebacks1 Asset或null→空串 | 单独None可选 |
| battleback2 | p[1]=battlebacks2 Asset或null→空串 | 两槽独立；数组长2 |

**编辑器初值 / 固定DSL默认**：ObjImageEllipsisBox双图初值均空；DSL两核心素材槽显式Asset或null，无互相补全默认。

**证据**：Q722843:15–39；Q8722495:17–31/39–61；Q8787441:50–64/68–117；R:10086–10089/6093–6095；rpg_sprites.js:2513–2552

**校验与运行边界**：两Asset目录严格区分；None编码空串，与Game_Map内部null自动背景状态不同；两者不折叠为一个字段。

**最小验收样本（未执行）**：四种有/无组合；Overworld与普通地图中开战，确认空串语义；无操作保存保持两槽。

**参数拒绝夹具候选（未执行）**：互换battlebacks1/2目录、空名Asset、少一槽、非Asset非null。

### E284 — Change Parallax

**正式表达（机械映射）**：`changeParallax({image,loopX,loopY,sx,sy})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| image | p[0]=parallaxes Asset或null→空串 | None不删除滚动配置 |
| loopX/loopY | p[1],p[2]布尔 | 分别启用横/纵循环 |
| sx/sy | p[3],p[4]整数−32..32 | loop=false时相应speed仍独立保存；数组长5 |

**编辑器初值 / 固定DSL默认**：image显式空，loopX/Y框架false，sx/sy框架0；DSL完整显式，不新增false/0省略默认。

**证据**：Q797896:23–43；Q648210:13–17/20–26/34–80；R:10092–10096/6098–6110；共享图像picker

**校验与运行边界**：Asset或null；非循环时速度控件disabled但onSave仍写值，禁止归零；当前图片不决定保存。

**最小验收样本（未执行）**：image None+loopXfalse/sx32+loopYfalse/sy−32；两方向循环开关组合；非零残留速度往返并在重新启用后运行。

**参数拒绝夹具候选（未执行）**：image错目录、loop非boolean、sx/sy−33/33/小数；loop=false时不豁免错误值。

### E285 — Get Location Info

**正式表达（机械映射）**：`getLocationInfo({variable,info,location})`。

| 参数或相关组 | 原生槽位/编码 | 值域与保存约束 |
| --- | --- | --- |
| variable | p[0]=variableRef ID | 输出目标必须存在，可为最终容量内无名槽 |
| info | p[1]枚举terrainTag0/eventId1/tileLayer1..4为2..5/regionId6 | 完整7种；不是通用任意layer整数 |
| location | p[2..4]=CURRENT-LOCATION | mode0坐标或mode1两个variable IDs；无exchange，数组长5 |

**编辑器初值 / 固定DSL默认**：编辑器输出variable首项、info首项terrainTag、direct0/0；DSL全部核心参数显式，不选择ID1作为默认。

**证据**：Q778493:15–52；Q916501:317–322；Q664736；R:10099–10128

**校验与运行边界**：输出与输入variable引用都验证；位置属于当前运行地图，Common Event不强推静态所属地图。13 Q7：Map Event内direct仅按所属地图作条件性越界warning，未知地图不猜也不单为未知报警；不能给tile模式增加原生没有的任意层。

**最小验收样本（未执行）**：7种info×2位置模式；输出无名有效变量；坐标原点/地图边缘，图层4与region区别；缩图后的保存位置。

**参数拒绝夹具候选（未执行）**：输出/输入variable ID0或缺失，info−1/7/小数，mode2/exchange；缺坐标字段；direct x/y负数、小数、非有限、负零或超过2,147,483,647。域内当前越界按Q7上下文warning，不作拒绝夹具。

## 需要跟踪的前置与验收交接

| ID | 事实与状态 | 责任/下一步 |
| --- | --- | --- |
| VM-MOVE-ENVELOPE | **正常创建路径的结构差异**：205内无参子项可缺parameters，插入器可能写indent:NaN并在JSON化后成为null；205/505本身不清理。源级数值/序列化推断不能冒充实际落盘观察。 | 12已最终确认与[movement.md](movement.md)共享的逐类savedShape/terminator模型；不得用raw route绕过。普通UI新建、重开、重确认路线样本仍交08验收。 |
| VM-COORDINATES | 原生位置按地图点击取得，没有9999数值控件上界，输出属性声明int；已有值可随地图缩小越界，Common Event运行地图不固定。 | 13 Q2/Q5/Q7已接受非负32位域、拒负零、固定地图/条件上下文/未知地图诊断矩阵；完整契约已最终确认，真实验收交08，不借页初始位置规则裁剪/拒绝。 |
| VM-DEFAULTS | 除已决201/203及共享Movement Route外，本分片完整表达使用显式字段。很多编辑器初值已找到，但132/133/138/139/140从工程读值，不能用作固定DSL默认。 | 未逐项接受的可省略性在最终接口定稿中明确跟踪；当前研究不新增默认。全显式源可无损，无需自动继承工程状态。Qt首项/SpinBox0等强度见shared-controls。 |
| VM-RESERVED | 203 exchange p[3]、232 p[1]普通onSave固定0，runtime不消费；任意非0尚无普通原生生成证据。 | 目前作为未证保存形态按ADR0012报unsupported；如真实正常样本出现非0，先重开正式模型，不能静默归0。不是未知code自动raw的理由。 |
| VM-SAMPLES | 全部48族的本节最小样本均未执行；本体静态代码、项目API映射、产品自动化与真实运行是四种不同证据。 | [完整性与顺序讨论](../../issues/08-completion-evidence-and-sequencing.md)须安排自动化slot/边界/round-trip测试及真实新建、无操作重开保存、重新确认参数、游戏场景。样本应包含None与独立状态、隐藏gray、负缩放、空天气残留power、禁用parallax残留速度。 |

**坐标运行边界补充。** R:5907–5909的isValid检查宽高；terrainTag（5991–6003）与regionId（6005–6007）会对越界返回0。tileId（5926–5930）直接索引数组，缺值才回0，没有调用isValid；例如x达到width可能定位下一行。E285的eventId分派（10112）调用eventIdXy（5844起），经eventsXy（5826起）和pos（6290起）按事件当前x/y精确匹配，无地图边界检查；未命中才返回0，命中返回列表中首个事件ID，事件位于越界坐标时仍可能命中。因此Get Location Info越界警告不能统一写成“返回0”。这些属于源码观察，未运行样本。

**无参数命令与全参结构。** 无参命令生成路径Q679418:202–207和表flag0已闭合；有参onSave按各表列完整槽数赋值。已有eventData原数组若包含额外槽，部分onSave并不显式截断；这并不证明额外槽能由普通原生新建得到。正式已知形态仍按ADR0012诊断，不能将“runtime忽略”自动升级为合法保存范围。

**发布边界。** 本报告包含原创归纳、来源身份和行号；没有包含编辑器源码副本、游戏资产或运行产物。无产品代码修改，无运行测试，无编辑器保存/游戏执行结论。
