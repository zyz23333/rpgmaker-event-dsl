# 07 / N04 原生整组图块与页图块单图观察

执行日期：2026-11-02。两个规范 ID 已实际观察通过：`AV.N04.change-tileset.native-run.case.observed` 和 `AV.N04.page-tile.native-run.case.observed`。后者包含 B、C、D、E 四次独立真实进程；没有把它们重复注册成四个规范 ID。本目录只证明 N04 的原生关系，不替代正式／raw、Workspace API 或实际 CLI 验收。

## 保存输入与实际路径

每个运行均创建独立的有效 MV 项目、原样复制的 NW shell 与 profile。原生 DataManager 读取保存数据并建立游戏对象，SceneManager 创建真正的 Scene_Map、解释器及 Sprite_Character。九张有效自制 RGBA PNG 分别为 N04-A1、A2、A3、A4、A5、B、C、D、E；颜色彼此不同。A1/A2 为 768×576，A3 为 768×384，A4 为 768×720，A5 为 384×768，B–E 均为 768×768。PNG 由 CRC32／zlib 编码，非空占位文件；输入清单保留内容、生成方法与 SHA256。

Map 背景数据为空，事件1作为被观察目标，事件2是一次性 autorun 控制页。场景启动所需的 Window、Loading、Shadow、Balloon、States、IconSet、Damage、Weapons1–3、ButtonSet 另有有效中性 PNG，在输入清单中标为 background，不计入本关系。没有需要消费的音频。所有记录通过原样委托包装器获取：保存原方法，调用 `original.apply(this, arguments)` 并原样返回，没有改变入参、返回值、文件路径或原生方法体。Bitmap 加载回调与 Canvas drawImage 提供真实消费证据。

## Change Tileset：一组九张

`change/` 对应外部原始目录 `M:/Shuen/Codex/asset-validation-notes/n04-maps-20261102/run-change-01`。Map 初始 Tileset1 的九槽均为空；控制事件实际执行原生 282[2]。解释器 setup/requestImages 预加载 Tileset2 的九张命名图片；实际 command282 另按同样槽顺序 reserveTileset，并记录每次返回和重试，最后将实时 Tileset1 改为2。随后 Spriteset_Map.loadTileset 的独立地图绘制栈又消费全部九张。事件1为空白页，没有页图块消费者。

九张图片都有原生 Bitmap._requestImage、准确 img/tilesets 路径、普通文件哈希、真实加载回调和正尺寸，最终全部 ready。最终原生 frame3、Scene_Map、liveTilesetId2、Canvas renderer2，控制完成标记已到达。9 项独立断言全部通过。

## Map Event Page：B–E 分别一张

四次运行的宿主初始 Tileset1 均有全部九个名称。事件1的保存页分别选择下列合法值，预期是独立写入的原生48像素格；不是由产品收集器或匹配器生成。

| 运行 | 保存 tileId | 槽 | 准确文件 | 格坐标与尺寸 | 最终 frame |
| --- | ---: | ---: | --- | --- | ---: |
| tile-b | 1 | 5 / B | img/tilesets/N04-B.png | x48,y0,48×48 | 4 |
| tile-c | 256 | 6 / C | img/tilesets/N04-C.png | x0,y0,48×48 | 3 |
| tile-d | 512 | 7 / D | img/tilesets/N04-D.png | x0,y0,48×48 | 3 |
| tile-e | 768 | 8 / E | img/tilesets/N04-E.png | x0,y0,48×48 | 3 |

每次原生 Sprite_Character.tilesetBitmap 对事件1只调用一次 ImageManager.loadTileset，且只选择表中一张。日志中的同步来源栈将其与 Spriteset_Map.loadTileset 的地图绘制请求分开；后者每次调用全部九张，不能归为页图块整组依赖。被选图片加载为768×768、准确独立颜色，原生 updateTileFrame 产生表中格；真实 Canvas drawImage 将对应 bitmap 的 image/canvas 作为源，确认实际绘制。没有 command282 或 reserveTileset 归入页选择。四次各10项独立断言全通过，最终 liveTilesetId1。

## 环境、完整证据与复跑

实际宿主 Windows10 10.0.19045；MV1.6.1，NW.js0.29.0 x86、Chromium65.0.3325.146、内置 Node9.7.1；外围生成器 Node22.23.4 x64，分开记录。window.show=false、windowsHide=true，使用独立 profile。所有原生 rpg_*.js、复制库与 shell 的源／运行副本均记录哈希，可核对原样字节；没有把静态源码分析当作实际运行。

`acceptance-receipts.json` 恰有两个规范 ID、五份运行、原始文件 SHA256、输入、独立预期、实际断言与逐事件位置。各场景子目录保存未清洗的 native-results.json、input-manifest.json、launcher-result.json、nw.log、probe-input.json，以及准确保存 Map、Tilesets、System 数据。`samples/` 保留九张自制有效图片。完整原 shell、profile、项目与背景媒体留在上述外部原始目录的同级 run-tile-b-01 至 run-tile-e-01，不把大量运行时二进制复制入仓库。仓库 `.gitattributes` 保持此 evidence 与 probe 的原始字节。

五个原生场景均在首次实际执行完成，outer exit code0、status observed；没有失败原生运行。归档脚本最初读取了错误的 launcher exitCode 字段而拒绝归档，随后改用原始 exit.code；这不是原生运行失败，也没有重跑已过场景。源矩阵与其他检查的失败／重试另记录在本票自动化说明。

探针在 [native-maps](../../probes/native-maps/run-n04.mjs)，完整命令保留在每份 input-manifest.json。复跑命令的目标目录必须尚不存在，末尾场景可选 change、tile-b、tile-c、tile-d、tile-e：

~~~powershell
& 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe' '.scratch/asset-validation-implementation/probes/native-maps/run-n04.mjs' 'F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-local-runtime-1.6.1' 'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win/Game.exe' 'M:/Shuen/Codex/asset-validation-notes/n04-reproduction-new' 'tile-b'
~~~

此处仅观察有效自制样例的关系、准确文件加载和 Canvas 消费，不声称所有布局、插件或媒体内容皆可运行。普通自动化存在性用例中的零字节文件不能代替此处原生执行。没有改图片 `%`／`#` 政策，没有消除 N02 反例或关闭01／03，亦不宣称整规格已完成。
