# MV 原生素材文件定位研究

研究日期：2026-10-20（Asia/Shanghai）。对应问题：[MV 原生素材名称如何定位到项目文件](../issues/01-native-asset-file-resolution.md)。研究分支：`research/mv-asset-file-rules`。

本文提供文件存在性检查所需的事实输入。目标为 Windows 上 RPG Maker MV 1.6.1 的编辑项目与事件直接保存的素材名称；报告不决定首版支持政策、诊断级别或 Compile / Push 契约，也不扩展为图片尺寸、索引、媒体解码或实际播放研究。

## 结论及证据边界

原生图片加载路径固定追加 `.png`；音频与影片在运行时选择一个扩展名，再加载该路径。官方帮助对 Windows 桌面游戏分别要求 Ogg 与 WebM。原生实现没有在这几个选择函数中通过“某个文件缺失”来尝试另一个格式。因而“找到任意一个同名媒体文件”与“存在原生目标环境会请求的文件”是不同的判定契约。证据见下文的逐项出处。

普通编辑项目与加密部署输出也有不同契约：帮助明确说不能在项目目录中使用加密文件，部署 runtime 才依照 System 标志改写图片/音频扩展名。因此不能仅凭加密候选文件存在，就认定普通编辑项目的素材引用有效。是否识别、拒绝或另外支持部署树，仍需后续设计票决定。

本次做了首方帮助与完整 JavaScript 源码的静态检查、模板数据/目录的只读核对；未启动编辑器、NW.js、游戏或浏览器媒体加载。报告中的“请求”“选择”描述源码分支，不代表实际播放验收。没有复制原生源码或资产到研究分支。

## 来源及可复核定位

- 首要 runtime：本地 `references/rmmv-local-runtime-1.6.1/js/`。版本头为 [rpg_core.js:2](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:2)。本轮三份文件的 SHA-256 为：
  - `rpg_core.js`：`9AD9914CC421AF6D054C3F01B022B7383863B047EC3F6F76AA897E6CFBF864C6`。
  - `rpg_managers.js`：`B3D5C746CF52234BDD34AF746DBF3CAECF96BB3477CC6D24121C4A1A11241114`。
  - `rpg_objects.js`：`2D43DD9D8974C88A1B82FFA493D6D8A02C4CE1D0DFC8F05E6C0AB731E3F0573E`。
- 首方帮助：随本地 RPGMV 资料保存的 [Asset Standards](../../../references/RPGMV/Help/page/01_11_01.html:21)、[Output Formats](../../../references/RPGMV/Help/page/01_11_04.html:70) 和 [Resource Manager](../../../references/RPGMV/Help/page/01_05.html:202)。帮助是文档依据，不把它的更新说明时间当成本机运行观察。
- 随包模板：`references/RPGMV/NewData/`。其 [package.json:3](../../../references/RPGMV/NewData/package.json:3) 以根目录的 `index.html` 为入口；[index.html:20–25](../../../references/RPGMV/NewData/index.html:20) 使用同级 `js/`。这与 runtime 的相对类别目录相配合，不代表所有部署包装的外层目录均相同。
- 交叉核对：本地首方 `references/rpg-maker-mv-corescript/` checkout 为 `182e31449707ba7e406db0485c44c2a9d11e2dcd`。其分拆源码只作定位逻辑的佐证；不以它替代上述 v1.6.1 文件或宣称两个 checkout 全部字节相同。相关出处为 [ImageManager.js:76–84](../../../references/rpg-maker-mv-corescript/js/rpg_managers/ImageManager.js:76)、[AudioManager.js:370–398](../../../references/rpg-maker-mv-corescript/js/rpg_managers/AudioManager.js:370)、[Game_Interpreter.js:1302–1321](../../../references/rpg-maker-mv-corescript/js/rpg_objects/Game_Interpreter.js:1302)、[Decrypter.js:106–116](../../../references/rpg-maker-mv-corescript/js/rpg_core/Decrypter.js:106)。
- Windows 大小写事实：Microsoft 文档源文件 [WSL/case-sensitivity.md:21–26](https://github.com/MicrosoftDocs/WSL/blob/7b28cc1ee9b8ff672ada5e1c6c326d3573d703e5/WSL/case-sensitivity.md#L21-L26)，本次读取于 2026-10-20。它说明文件系统一般行为及例外，不是 MV 专属兼容声明。

`references/` 是本地资料，研究分支只保存本报告。复核本地行号需要相同资料；哈希用于识别 v1.6.1 研究输入，而非要求产品哈希运行时。

## 类别目录与扩展名

以下都是相对于游戏内容入口的原生目录；在普通编辑项目中对应 Project Root 下的这些目录。帮助说明将素材放入适当目录后可在编辑器选择，见 [Asset Standards:21–22](../../../references/RPGMV/Help/page/01_11_01.html:21)。表中目录的 runtime 依据为各加载函数本身，不依赖仅看模板目录名来推断。

| 原生类别 | 目录 | 普通文件扩展名 | v1.6.1 原始出处 |
| --- | --- | --- | --- |
| Character | `img/characters/` | `.png` | [rpg_managers.js:819–820](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:819) |
| Face | `img/faces/` | `.png` | [rpg_managers.js:823–824](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:823) |
| Picture | `img/pictures/` | `.png` | [rpg_managers.js:831–832](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:831) |
| Side-view Actor | `img/sv_actors/` | `.png` | [rpg_managers.js:835–836](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:835) |
| Battleback 1 / 2 | `img/battlebacks1/`、`img/battlebacks2/` | `.png` | [rpg_managers.js:807–812](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:807) |
| Parallax | `img/parallaxes/` | `.png` | [rpg_managers.js:827–828](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:827) |
| BGM | `audio/bgm/` | `.ogg` 或 `.m4a`，见下文 | [rpg_managers.js:1117](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1117)、[1180–1185](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1180) |
| BGS | `audio/bgs/` | 同上 | [rpg_managers.js:1269–1270](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1269) |
| ME | `audio/me/` | 同上 | [rpg_managers.js:1331–1336](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1331) |
| SE（含 Movement Route 的 SE） | `audio/se/` | 同上 | [rpg_managers.js:1364–1369](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1364)、[rpg_objects.js:7089–7090](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:7089) |
| Movie | `movies/` | `.webm` 或 `.mp4`，见下文 | [rpg_objects.js:10032–10049](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:10032) |

上表服务于事件直接引用的设计讨论，不是完整使用位置清单。哪些事件字段、命令、保存但未启用的字段需要访问，由覆盖范围票决定；本研究没有将数据库间接引用纳入范围。

为避免目录混淆，其他原生图片类别为 `img/animations/`、`img/enemies/`、`img/sv_enemies/`、`img/system/`、`img/tilesets/`、`img/titles1/` 和 `img/titles2/`，加载函数同样转入 `loadBitmap`，见 [rpg_managers.js:803–855](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:803)。目录存在不使这些类别的数据库间接引用自动进入本 effort。

### 平台选择的准确含义

| 媒体 | 官方帮助对 Windows / Mac 桌面游戏的要求 | v1.6.1 实际选择条件 | 对存在性判断的事实限制 |
| --- | --- | --- | --- |
| 图片 | 全部使用 PNG：[Asset Standards:31–32](../../../references/RPGMV/Help/page/01_11_01.html:31) | `loadBitmap` 为非空名称固定追加 `.png`：[rpg_managers.js:859–867](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:859) | 这里没有 JPG、WebP 或大小写扩展名枚举 |
| 音频 | 桌面只需 Ogg；网页/Android/iOS 准备 Ogg 与 AAC 两份同名文件：[Asset Standards:197–206](../../../references/RPGMV/Help/page/01_11_01.html:197) | 浏览器报告可播放 Ogg 且不是 mobile device 时选 `.ogg`，否则选 `.m4a`：[rpg_managers.js:1484–1490](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1484) | 选择函数不检查某一文件是否存在，也不因缺失而改选另一份 |
| 影片 | 桌面只需 WebM；网页/Android/iOS 准备 WebM 与 H.264 MP4 两份同名文件：[Asset Standards:211–220](../../../references/RPGMV/Help/page/01_11_01.html:211) | 浏览器报告可播放 WebM 且不是 mobile device 时选 `.webm`，否则选 `.mp4`：[rpg_objects.js:10045–10051](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:10045) | 同样不是按现存文件选择或自动回退 |

这里的 mobile 判定为 user-agent 正则，并非读取操作系统配置，见 [rpg_core.js:217–220](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:217)。音频能力来自 HTML audio 的 `canPlayType`，见 [rpg_core.js:7784–7789](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:7784)；影片能力来自 video 元素的 `canPlayType`，见 [rpg_core.js:2158–2160](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:2158)。因此不能把“CLI 正在 Windows 上运行”单独当成任意 runtime 环境能力探测结果。本地图的 Windows 范围并未承诺网页或移动端兼容；上述分支只解释代码为什么存在多个扩展名。

## 保存名称、编码与目录边界

1. **名称是追加扩展名前的值。** 图片与音频加载器直接在完整名称后追加扩展名，没有先剥掉输入中已有的扩展名，见 [rpg_managers.js:859–867](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:859)、[1464–1473](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1464)。影片同样追加所选扩展名，见 [rpg_objects.js:10034–10037](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:10034)。模板 [Actors.json:3](../../../references/RPGMV/NewData/data/Actors.json:3) 中 `Actor1` 等名称没有 `.png`，是这一保存方式的例子；不是要求校验器限制为模板中的字符集合。
2. **图片与音频把整个名称交给 `encodeURIComponent`。** 目录由类别函数添加，名称没有先按 `/` 切成子目录，也没有先进行 URL decode 或 trim，见上述两处加载器。磁盘扫描不能把编码后的 URL 字符串直接当成磁盘名称；同样不能先对保存名称做 URL decode 再认为它等价于原生名称。保存名称包含百分号等特殊字符时，需要保持“原始保存值”与“生成的请求 URL”两个层次。
3. **影片名称没有使用同一编码步骤。** 指令把 `movies/`、保存名称、扩展名直接相连，之后交给 video 元素的 `src`，见 [rpg_objects.js:10034–10037](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:10034)、[rpg_core.js:2130–2135](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:2130)。含 URL 分隔符的影片名称不能据此宣称与普通磁盘 basename 一一对应。这里没有实测特殊字符的 URL 解析结果。
4. **特殊前缀属于文件名。** 帮助为 Character 定义 `$`、`!` 及组合前缀，为 Parallax 定义 `!`；见 [Asset Standards:46–48](../../../references/RPGMV/Help/page/01_11_01.html:46)、[59](../../../references/RPGMV/Help/page/01_11_01.html:59)。runtime 的前缀识别只影响其图像行为，加载器仍使用完整名称，见 [rpg_managers.js:905–917](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:905)。文件定位不应从这些事实推导出可以删掉前缀。
5. **不能把 None 当成名为 `.png` 的缺失文件。** 图片加载器在空名称时返回空 Bitmap，影片在空名称时不启动播放；四种音频播放入口也用名称的真假值决定是否建 buffer。原始出处：[rpg_managers.js:859–867](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:859)、[1180](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1180)、[1269](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1269)、[1331](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1331)、[1365](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1365)、[rpg_objects.js:10035](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:10035)。具体字段如何表达 None，以及独立保存参数是否保留，仍遵守字段契约，不能用一个全局素材规则替代。

### 子目录与编辑器选择：已知及未知

原生 JS 已确认的是名称拼接规则：图片/音频整名编码，影片直接拼接。帮助只说选择适当类别目录、列出该目录中的资源文件，并没有在这些章节明确承诺递归子目录选择、路径穿越或绝对路径；见 [Resource Manager:202–216](../../../references/RPGMV/Help/page/01_05.html:202)。本轮没有读取编辑器二进制来补全这项契约，也未进行 picker 实测。

因此，本报告不声称“所有原生素材类别均支持子目录”，也不声称“runtime 必然拒绝所有含斜线名称”。URL 到本地文件的处理还取决于宿主层。后续文件匹配票应明确首版的子目录与路径边界，并将无法证明的输入作为支持政策选择；直接用操作系统路径归一化放行 `../`，并不能由这些源码事实推出。

## 名称大小写：三层事实不能合并

- **原生加载器层：** 上述图片、音频、影片路径构造保留传入名称大小写；没有把名称转成全大写或小写，也没有枚举大小写候选。扩展名字符串按源码中的小写追加。出处：[rpg_managers.js:861](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:861)、[1466](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:1466)、[rpg_objects.js:10037](../../../references/rmmv-local-runtime-1.6.1/js/rpg_objects.js:10037)。
- **Windows 文件系统层：** Microsoft 文档说明一般文件/目录名不区分大小写，同时支持逐目录设置大小写敏感，见 [case-sensitivity.md:21–26](https://github.com/MicrosoftDocs/WSL/blob/7b28cc1ee9b8ff672ada5e1c6c326d3573d703e5/WSL/case-sensitivity.md#L21-L26)。这意味着“Windows 必定忽略大小写”和“MV 自己主动忽略大小写”都不是本研究能给出的准确结论。
- **具体项目、编辑器与宿主层：** 未查询任意目标 Project Root 的目录标志；未对 Windows NW.js 的资源 URL、编辑器 picker 或大小写碰撞进行实测；未确认 Unicode 规范化等价名称的全部规则。存在性扫描按实际磁盘查询，还是另外检测大小写不一致/冲突，属于待决产品契约，不自动由上述一般事实确定。

## 普通编辑项目与部署/加密文件

官方部署文档区分图像加密与声音加密选项，并明确“不能在项目目录中使用加密文件”，见 [Output Formats:83–99](../../../references/RPGMV/Help/page/01_11_04.html:83)。另有部署时排除未使用 `img/`、`audio/` 文件的选项，见 [70–81](../../../references/RPGMV/Help/page/01_11_04.html:70)。所以编辑项目存在性检查不能据此承诺部署后仍完整，也不应混同为部署清单审计。

runtime 从加载的 System 数据读取 `hasEncryptedImages` / `hasEncryptedAudio`，见 [rpg_managers.js:146–149](../../../references/rmmv-local-runtime-1.6.1/js/rpg_managers.js:146)。加密分支按同一逻辑路径替换最终扩展名：

| 普通扩展名 | 加密扩展名 | 原始出处 |
| --- | --- | --- |
| `.png` | `.rpgmvp` | [rpg_core.js:9253–9262](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:9253) |
| `.ogg` | `.rpgmvo` | 同上 |
| `.m4a` | `.rpgmvm` | 同上 |

图片在加密标志开启且不属于忽略表时进入解密路径，见 [rpg_core.js:1682–1686](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:1682)、[9173–9177](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:9173)。忽略表包含 `img/system/Window.png`，见 [9159–9169](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:9159)；所以即使另行支持部署检查，也不能假设所有图片都只查加密后缀。音频的 WebAudio 加载器依加密标志改写 URL，见 [8163–8175](../../../references/rmmv-local-runtime-1.6.1/js/rpg_core.js:8163)。影片路径仍由上述 Movie 逻辑生成，本轮没有找到对应的影片加密扩展名映射，不把图片/音频规则外推给影片。

加密候选存在只证明候选路径存在，不证明解密密钥或文件内容有效。本轮没有解密、解码、读取媒体尺寸或验证播放。部署包装的外层 `www/`、单文件封装、第三方插件改变的路径也不形成首版支持承诺。

## 给后续决策的输入与保留问题

这些问题在当前地图的引用覆盖、文件匹配、诊断与工作流票内可以处理，本研究不替用户回答：

- Windows 首版按官方桌面要求检查 `.ogg` / `.webm`，还是允许 `.m4a` / `.mp4` 等候选；若允许，“任一存在”是否只是自定义支持规则，需要明确，不能描述成原生缺失回退。
- 普通 Project Root 中只存在加密候选、System 加密标志异常或目标其实为部署树时，工具如何报告支持边界。
- 名称大小写、特殊字符、子目录、路径归一化与真实文件类型的判定契约。源码可以给出 URL 构造事实，不能代替编辑器/宿主运行验收。
- Native Saved Value 在文件删除、重命名后仍可保存的情况，以及未启用但已保存的字段、None、可识别 Raw DSL Command 的覆盖和严重性。存在性事实本身不决定是否阻断或改写保存状态。
- 文件在 Compile 后被删改时，由哪些工作流检查点重查、是否进入 freshness/baseline；本研究没有建立素材快照机制。

与现有决定的交界应显式保留：[ADR 0011](../../../docs/adr/0011-native-command-state-and-validation.md) 当前不扫描素材文件和尺寸；本 effort 有意重开“文件不扫描”的边界，尺寸仍排除。[ADR 0012](../../../docs/adr/0012-event-saved-state-roundtrip-boundary.md) 的保存状态和已识别 raw 校验约束、[ADR 0013](../../../docs/adr/0013-bind-generated-data-to-compilation-assumptions.md) 的编译/推送输入契约尚未因本报告改变。

研究问题已经获得足够的可追溯事实与明确未知，足以交给后续设计票；仍无任何产品行为或原生编辑器/游戏验收结论。
