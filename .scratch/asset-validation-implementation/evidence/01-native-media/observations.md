# 01 原生媒体定位回执与图片特殊名称反例

执行日期：2026-11-02。执行者：实施代理。状态：**N01 已观察通过；N02 有两个未解决反例；票 01 保持 claimed，不能关闭。** 本记录只交付原生事实，没有接受新的产品政策，也没有修改产品代码或旧验收预期。

## 可复核输入与执行方式

实际在 Windows 10 `10.0.19045`、x86 NW.js `0.29.0`、Chromium `65.0.3325.146`、其内置 Node `9.7.1` 中运行版本头 `v1.6.1` 的 MV 脚本；外围生成器使用 Windows x64 Node `v22.23.4`。生成器 Node 与游戏内置 Node 的版本分别记录，不把后者说成产品 Node.js 22 验收。

- 完整原生结果：[native-results.json](native-results.json)。含每个用例的原始名称、请求入口和 URL、磁盘路径与 SHA-256、加载／解码结果、原生错误事件，以及两个对照实验。
- 精确运行输入：[input-manifest.json](input-manifest.json)。含原始 runtime／NW.js 路径、脚本哈希和每份媒体的 ffmpeg 生成参数。
- 原生进程日志：[nw.log](nw.log)。GPU shared-context 警告没有阻止本次 canvas 图片、WebAudio 音频和 video 加载。
- 有效自制媒体样本：[red.png](samples/red.png)、[green.png](samples/green.png)、[tone.ogg](samples/tone.ogg)、[blue.webm](samples/blue.webm)。PNG 为 16×16 色块，OGG 为 440Hz 短正弦，WebM 为 16×16 蓝色视频；均非空文件或第三方作品。
- 可复现探针：[run-native-media.mjs](../../probes/native-media/run-native-media.mjs)、[native-media.js](../../probes/native-media/native-media.js)、[index.html](../../probes/native-media/index.html)。探针复制原始游戏脚本及 NW.js shell 到新的独立目录；包装器只记录参数并原样调用原生实现，没有替换加载路径或媒体实现。窗口 `show:false`，进程使用独立 profile 并自动退出。

运行命令（PowerShell；最后参数必须是尚不存在的目录）：

```powershell
& 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe' `
  '.scratch/asset-validation-implementation/probes/native-media/run-native-media.mjs' `
  'F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-local-runtime-1.6.1' `
  'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win/Game.exe' `
  'M:/Shuen/Codex/tools/media-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe' `
  'M:/Shuen/Codex/asset-validation-notes/native-media-run-10'
```

本次回执对应 `native-media-run-10`，运行退出码 **1**，因为保留了两个与现行预期矛盾的真实结果。共 15 个媒体样本，13 个观察通过、2 个观察失败，另有 2 个证明实际 URL 映射的对照实验。N02 的 chinese／space／percent 用例各有多个媒体样本；同一规范用例 ID 下的 `category` 和 `savedName` 标识样本，不虚增通过的验收族数。

本地原始 `rpg_managers.js` SHA-256 为 `b3d5c746cf52234bdd34af746dbf3caecf96bb3477cc6d24121c4a1a11241114`，与既有研究采用的文件以及 `references/RPGMV/NewData/js/rpg_managers.js` **字节相同**。本次没有把另一个较新 upstream checkout 当作 1.6.1 替身。配套 `Game.exe` 哈希为 `487bd28f3d0b43ed9827ba519d6d113c4f31059bd62b4492da586c7bc82a9474`，`nw.dll` 为 `4a3f39e9476288d109dbfe0b0c245f032ebf920c5142af36a2a15b31f9ff2139`。

REA 的静态分析 parent Evidence 为 `ev_e53fde6dd0cd5ad143534eeecf81657e5cc6ff629b0c3d3ef08a169f4dc22602`，只选 core／managers／objects，存在未分析范围和静态语义截断；它不构成本次原生执行通过依据。

## 规范用例结果

以下 ID 均按原索引的 `AV.<族>.<分支>.native-run.case.observed` 展开。契约出处为[实施索引 N 组](../../../asset-validation/implementation-acceptance-cases.md#n-原生必验6-族)、[验收矩阵](../../../asset-validation/acceptance-matrix.md)及[规格文件定位规则](../../../asset-validation/asset-validation-spec.md)。图片使用 `ImageManager.loadPicture`，音频使用 `AudioManager.createBuffer('se', name)` 经过 WebAudio 真实 XHR 和解码，影片由 `Game_Interpreter.command261` 选择扩展名并调用 Graphics／video。通过证明请求和有效自制文件在该样本中相符，不承诺全部图片布局或可听／可见播放效果。

| 用例分支 | 独立原预期 | 实际结果 |
| --- | --- | --- |
| N01.image-png | `image-png` → `img/pictures/image-png.png` | 通过；16×16，红色像素 `#fd0000` |
| N01.audio-ogg | `audio-ogg` → `audio/se/audio-ogg.ogg` | 通过；实际 XHR 后成功解码，单声道、48kHz、约 0.222 秒 |
| N01.movie-webm | `movie-webm` → `movies/movie-webm.webm` | 通过；原生选择 WebM，loadeddata 后16×16、0.2 秒 |
| N02.chinese | 图片／音频／影片的中文原名分别指向同名磁盘文件 | 三类通过；URL 层编码，磁盘名称保留中文 |
| N02.space | 三类含空格原名分别指向同名磁盘文件 | 三类通过；URL 层 `%20` 对应磁盘空格 |
| N02.image-percent | `literal%20image` 和 `image%percent` 分别读取原名 PNG | **前者失败，后者通过**；不能用普通百分号通过抵销编码形态反例 |
| N02.image-hash | `image#hash` 读取 `img/pictures/image#hash.png` | **失败**；原生 Image error，准确文件存在且有效 |
| N02.audio-percent | `literal%20audio` 和 `audio%percent` 读取同原名 OGG | 两者通过；前者请求 `%2520`，后者请求 `%25`，没有提前解码 |
| N02.audio-hash | `audio#hash` 读取同原名 OGG | 通过；请求为 `audio/se/audio%23hash.ogg` |

每个失败保留了实际 Image `error` 事件，不靠等待超时推断错误。独立路径继续检查，全部音频特殊名称结果仍保留。Probe deadline 只用于异常退出保护。

## 最小反例及因果对照

原 `rpg_managers.js:859` 的 `loadBitmap` 先 `encodeURIComponent(filename)`，但 **同文件 `loadNormalBitmap` 的 885 行又执行 `Bitmap.load(decodeURIComponent(path))`**。原生最终收到的图片 URL 已恢复字面特殊字符。既有研究只引用了前一个编码步骤，遗漏了后一个解码步骤。

1. 只放有效红色 `img/pictures/literal%20image.png`，不放 `literal image.png`；调用 `ImageManager.loadPicture('literal%20image')`。上层参数 `img/pictures/literal%2520image.png`，底层 Image 请求 `img/pictures/literal%20image.png`，原生报错。保持原名红图不动，仅加入绿色 `literal image.png`，清空图片缓存后重复相同调用；成功加载 **绿色** `#007f00`。这证明该 URL 的 `%20` 被宿主解释为磁盘空格，没有读取原名红图。
2. 只放有效红色 `img/pictures/image#hash.png`，不放无后缀文件 `image`；调用 `ImageManager.loadPicture('image#hash')`。上层参数为 `img/pictures/image%23hash.png`，底层 Image 请求 `img/pictures/image#hash.png`，原生报错。保持原名红图不动，仅加入绿色无后缀 `img/pictures/image`，清空缓存后重复调用；成功加载 **绿色**。`#hash.png` 成为 URL fragment，宿主取的是无后缀 `image`。

对照实验见结果 JSON 的 `counterexamples`，原名文件的存在、红图哈希、替代项之前不存在、加入后绿色哈希、原样请求和实际像素均分别记录。它们不是原 N02 用例通过，也不是向产品建议自动修复／解码名称。

## 需要重开的决定与可审阅选项

受影响的是 ADR 0017 关于图片字面 `%`／`#` 的支持依据、原生研究票 01、文件规则票 03、实施票 01 的 N02 与最终票 17。本回执形成时 ADR 为 accepted；同日集成核对已将 ADR 0017 重开为 proposed，源研究票 01、文件规则票 03 与地图设为 needs-info，等待维护者决定政策。原名称预期尚未改动，音频现有编码规则本次得到实际支持。

可选择的政策（**均未接受**）：

1. **建议：将图片含 `%` 或 `#` 统一列为不支持名称，音频继续支持。** 范围简单；普通 `%percent` 虽在本机能加载，仍属于主动收窄支持，不能把“全部百分号均失败”写成原生事实。规格、ADR、F06／F07、N02、CLI 说明与测试责任需一起修订；保存值不改写，候选／非活动使用按现行支持范围 warning 政策处理。
2. **保留更多图片名称，但明确筛掉可被 URL 解释的形态。** 至少 `#` 和合法 `%HH` 编码形态需要边界；仍须决定更宽 URL／Unicode 解码行为和异常编码的责任。需要新增有限证据后才可定义，不在本票临时猜测完整规则。
3. **保留“只检查原名磁盘文件”的产品行为，但撤销该部分原生定位一致承诺。** 名为 `literal%20image.png` 的准确普通文件仍能通过存在性；文档必须承认原生可能加载其他文件或失败，N02 不再能要求当前映射通过。这是产品目标取舍，不能悄悄把失败记成“存在性不保证播放”后宣称原生验收通过。

自动把名称解码成其他目标、忽略 fragment、修改引擎、加入例外或更换 1.6.1 输入都不能当作本反例的修复。决策确认前，票 01 与完整产品验收保持未完成。

## 供后续原生票复用

`run-native-media.mjs` 已完成原生 shell 隔离、真实脚本复制、有效媒体生成、独立 profile、隐藏窗口与结果落盘。N03–N06 可复用该准备方式，在独立新目录按对应票添加 Animation／Tileset／Enemy／Actor／Map 的最小状态和真实消费入口；分别保留它们自己的 ID、条件和请求，不把本票 N01 的通过扩充成这些关系已验收。完整 copied js 目录已有 sprites／scenes／windows，所需时在 HTML 明确加载。

Node.js 22 外围工具位于 `M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe`；其官方 archive SHA-256 已对照发布页核实为 `cbc74b5e0982c9dbb41525fd8fb5dcd32fbee237863f7829072f4639a1ce5f20`。运行产品 pnpm 命令时将该目录置于 PATH 首位。ffmpeg 来自 `imageio-ffmpeg==0.7.0` Windows wheel 内的 `ffmpeg-win-x86_64-v7.1.exe`，探针仅用它生成自制媒体。
