# 01：图片特殊名称政策处置与当前原生义务对账

日期：2026-11-02。状态：**实施01 resolved；实施03仍 claimed。** 本文件追加维护者决定及证据复核，不重写[原始观察](observations.md)、原始失败或运行退出码。当前支持域的 N01／N02 均有既存原生成功证据；其他票、产品实现及17最终验收仍按各自责任完成。

## 决定出处与范围

维护者在主实施会话明确选择：

> 将图片含 % 或 # 统一列为不支持；音频保持支持（推荐，规则简单）

此直接人类答复由主实施代理交接，原交接记录位于 `M:/Shuen/Codex/asset-validation-notes/accepted-image-policy-2026-11-02.md`。仓库内的权威政策已记录在[源设计票03现行 Answer](../../../asset-validation/issues/03-asset-file-existence-contract.md#answer)及[ADR0017](../../../../docs/adr/0017-exact-asset-file-existence-in-editing-projects.md)，并同步源票01、地图、规格、验收矩阵／索引及实施01／03职责。该答复取代先前“等待维护者决定”的状态，采用原观察中的第一个选项；其余选项保留为历史。

所有图片名称只要含任一 `%` 或 `#` 就不受支持，包含普通 `image%percent` 和看似编码的 `literal%20image`；不猜测更细的 URL 安全集合。音频继续按原始名称查询字面文件，影片原有排除不变。不 URL 解码、不修复、不搜索替代文件、不改写保存值，helper 的保存值表达能力保留。普通使用 error；Conditional Asset Candidate 或明确非活动保存配置 warning 并标记该部分未检查；Asset Check Exception 不能豁免。以上为支持政策，非声称所有百分号图片在原生均失败。

## 原始运行保持不变

[native-results.json](native-results.json) 仍是15个有效媒体样本、13成功、2失败；原外围运行退出码1。另有两组保持红色原名文件、只加入绿色 URL 解释后目标的因果对照，均加载绿图。普通 `image%percent` 成功也保留。运行环境仍是原始 Windows10、MV1.6.1、NW.js0.29.0／Chromium65／内置Node9.7.1；外围生成器Node22和产品验证环境不混淆。没有重新执行探针、把原失败改判通过或以例外签收反例。

| 历史图片分支／样本 | 原始观察 | 当前处置 |
| --- | --- | --- |
| `AV.N02.image-percent.native-run.case.observed` / `literal%20image` | failed；底层URL指向空格文件；加入绿图后加载绿图 | 人类明确排除；不属当前成功义务，原失败及因果对照保留 |
| 同一历史ID / `image%percent` | observed；原名字面红图加载成功 | 人类统一排除；成功事实保留，不恢复产品支持 |
| `AV.N02.image-hash.native-run.case.observed` / `image#hash` | failed；底层URL的fragment使实际目标为无后缀 `image`；加入绿图后加载绿图 | 人类明确排除；不属当前成功义务，原失败及因果对照保留 |

两个旧图片ID只在历史原始回执中保留，不另造同义通过ID，不把排除记作原生成功。反例触发的决定重开已通过上述明确人类选择闭合；产品03还需实现新的检查行为。

## 当前 N01／N02 义务

以下12个支持域样本均直接复用原始真实运行，逐项保留其原始ID、类别、保存名称、请求和文件SHA-256。[机器对账](policy-resolution-2026-11-02.json)独立列出当前义务和排除的历史观察。N02有四个当前ID、九个成功样本；样本数不冒充独立规范ID数。

| 当前 canonical ID | 原始成功样本 | 当前核对 |
| --- | --- | --- |
| `AV.N01.image-png.native-run.case.observed` | `image-png` | `.png`目录／请求／同名磁盘文件一致，原生canvas红图 |
| `AV.N01.audio-ogg.native-run.case.observed` | `audio-ogg` | 原生XHR与有效OGG解码成功 |
| `AV.N01.movie-webm.native-run.case.observed` | `movie-webm` | 原生选WebM并成功loadeddata |
| `AV.N02.chinese.native-run.case.observed` | 图片、音频、影片中文名各一 | 三类保存名、请求与磁盘定位一致 |
| `AV.N02.space.native-run.case.observed` | 图片、音频、影片空格名各一 | 三类URL编码与磁盘空格对应 |
| `AV.N02.audio-percent.native-run.case.observed` | `audio%percent`、`literal%20audio` | 请求分别保留字面百分号／编码样式的原名磁盘目标，均成功解码 |
| `AV.N02.audio-hash.native-run.case.observed` | `audio#hash` | 编码请求定位原名字面OGG，成功解码 |

当前支持域无未执行项、环境限制或未解决映射反例。这一有限对账不扩张为全素材尺寸、布局或播放保证，也不签收N03–N06或产品全套验收。

## F06 产品职责与历史ID迁移

[权威索引](../../../asset-validation/implementation-acceptance-cases.md#2026-11-02-f06-身份修订与历史回执)保留F06七个分支并明确以下身份修订。03须用新ID验证独立输入预期，通过Windows／Node22公共Workspace API及实际CLI分别执行源码和构建入口；本次01没有改产品或提前计为通过。

| 旧ID（仅历史） | 当前canonical ID | 当前义务 |
| --- | --- | --- |
| `AV.F06.image-percent.filesystem.case.expected` | `AV.F06.image-percent.input.case.expected` | 图片百分号名称不支持，查询前拒绝 |
| `AV.F06.image-hash.filesystem.case.expected` | `AV.F06.image-hash.input.case.expected` | 图片井号名称不支持，查询前拒绝 |
| `AV.F06.literal-percent20.filesystem.case.expected` | `AV.F06.literal-percent20.input.case.expected` | 看似编码的图片名称同样不支持，不解码或改目标 |

音频 `AV.F06.audio-percent.filesystem.case.expected`／`AV.F06.audio-hash.filesystem.case.expected` 维持filesystem及原名字面查询，由已分配的05负责；影片两个input ID不变。三个旧图片filesystem ID对应的六条源码／构建 `not-executed-policy-pending` 位于[03原机器回执](../03-file-observation-acceptance.json)，全部保持字节不变；新input结果另行记录。阶段回执中“用户尚未回复”仍是原运行时的事实，现已附当前政策指针。产品03完成前继续claimed，12的依赖不因01文档收尾而解除。

## 证据完整性与文档核对

使用Windows／Node `v22.23.4` 进行只读SHA-256复核：10份原生raw／样本／探针文件与最初提交 `9181a023` 的Git blob逐字节哈希相同；03原机器回执与合入基准 `9d860dac` 的blob相同。原运行目录15份媒体及两组对照的红／绿文件匹配回执哈希；三份runtime原文件和当次复制文件匹配输入清单，Game.exe／nw.dll匹配原观察记录，共22项输入复核成功。`.gitattributes`为原N01／N02输入、raw、样本与探针增加字节保全规则。

| 原始文件 | SHA-256 |
| --- | --- |
| [native-results.json](native-results.json) | `a44d131f4be8f2519fb8fd84f73caf1b2974bddbf5dbb349cf6bcc6d357e4a47` |
| [input-manifest.json](input-manifest.json) | `46068130ab8e4d98a8acb28a360ee0b83728af6845c4ede0769c8abe2cd25b7b` |
| [nw.log](nw.log) | `989d8d7205d73138af2bf7a76cdcdcdbac5a67402c503a7648c0871c8a07be76` |
| [03历史机器回执](../03-file-observation-acceptance.json) | `a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071` |

全部10份存档哈希与22项输入核对详见[机器对账](policy-resolution-2026-11-02.json)。复核脚本位于共享笔记 `M:/Shuen/Codex/asset-validation-notes/verify-01-policy-closure.mjs`；其只检查既有输入并生成新对账，不启动原生执行或产品测试。本次变更Markdown共297个本地链接及46个Markdown锚点核对通过；其中61个历史首方源码指针在原始 `F:/Shuen/RPG/rpgmaker-event-dsl/references/` 下复核，独立worktree不复制该忽略目录。ADR0017和包README的定向oxfmt检查、政策与ID一致性核对及 `git diff --check` 通过。格式器使用integration已安装的同版本工具，未给原生文档worktree新增依赖。01只关闭文档及原生证据职责；无需重跑完整原生probe或产品全套，03／17继续承担各自产品验证。
