# 插件接入、运行版本与构建交付的事实边界

研究日期：2026-10-18（Asia/Shanghai）。对应决策票：《确认插件接入、运行版本与构建交付的事实边界》。本报告只确认事实和列出仍需选择、实验的问题；没有开发插件、运行参考工程或替地图决定打包布局、发布渠道。

研究的目标边界是 MV 1.6.1 原生机制与明确接入的第三方插件，首批验收环境是 Windows 本地开发。依用户修正，按单版本、偏瀑布式的开发和发布过程考虑；跨版本旧存档迁移不是默认门槛。同版本功能在存读档后是否正确，仍属于运行正确性。

## 可以作为决策前提的结论

1. 插件接入至少涉及插件文件、`js/plugins.js` 中的启用状态、字符串参数、数组顺序、插件自身依赖和运行效果；仅生成一个 Plugin DSL Command 不能证明接入完成。[P1][C1]
2. MV 的原生插件命令只是把一行字符串按单个空格拆分，再调用插件覆盖的 hook。命令名称、参数解释、等待行为与未知命令是否报错，由具体插件决定。[P1][C3]
3. 需要分别记录工具宿主、项目核心脚本版本和最终游戏宿主。仓库的 Node.js 22 / NodeNext 决定不等于 MV 游戏中的 JavaScript / Node API 基线；不能根据“MV 1.6.1”替代实际 NW.js、Chromium、Node 版本取证。[L1][C5][N1]
4. 官方公开手册给出的完整游戏部署入口是编辑器 File → Deployment。公共 CoreScript 仓库的构建、打包命令产出核心脚本，不是已证实的完整游戏部署 CLI。NW.js 有脚本可驱动的等效打包方式，但与编辑器的资源裁剪、加密、项目特有文件处理是否等价，尚需实验。[P3][P4][C0][N2]
5. “Exclude unused files”文档只承诺排除 `img/`、`audio/` 中的未用资源，且有插件动态资源误删的已知边界；它不构成开发插件、测试数据、日志、源码映射或运行桥接的发布排除规则。[P4][P5]
6. 同版本插件状态也可能在存读档后丢失或失去原型。原生保存图是固定的；闭包变量不自动保存，局部构造函数也不能仅凭名称被 JsonEx 从 `window` 找回。插件构建和同版本验收需要考虑这些机制。[C2][C4][P7]

## 证据的版本与可信范围

| 证据 | 已确认的身份 | 可以证明什么 | 不能直接证明什么 |
| --- | --- | --- | --- |
| RPG Maker 官方在线 MV Help | `rpgmakerofficial.com/product/MV_Help/`，本次访问的页面为英文；更新历史最晚列出 2018-02-16 | 官方编辑器操作、插件约定、部署选项和公开 JS Library 文档 | 页面没有逐页绑定 1.6.1，也不能当成所有后续版本的 API 清单 |
| 官方组织公开 CoreScript 的 `c45644fe4013b39d2d31e1410e92b30ebcac0360` | 提交标题 `Merge RMMV version 1.6.1`，日期 2018-11-12；`Utils.RPGMAKER_VERSION = "1.6.1"` | 本报告引用的固定代码位置；与参考工程相互核对的原生加载、命令、metadata、保存机制 | 这是社区 CoreScript 仓库中的导入提交，不声称整个提交与商业安装模板逐字一致 |
| 同一仓库的 `182e31449707ba7e406db0485c44c2a9d11e2dcd`，tag `v1.3b` | `RPGMAKER_VERSION = "1.6.1"`，同时 `RPGMAKER_ENGINE = "community-1.3b"` | 证明仅看版本字符串不足以识别社区分支或修改过的核心 | 不能把该分支的自动存档、异常增强或保存目录回退当成原版 1.6.1 能力 |
| 本地参考工程 `references/rmmv-test-project` | `Game.rpgproject` 为 `RPGMV 1.6.1`；`js/rpg_core.js:183` 声明 1.6.1；核心文件无 `community` 标记；已有第三方和手工测试插件 | 当前样本的静态文件结构、加载配置和核心机制；见下表的内容哈希 | 未运行，不能证明插件可用；未鉴定为未修改的官方安装模板；`package.json` 不证明实际使用哪份 NW.js 二进制 |
| NW.js 的历史 tag `nw-v0.29.4` | 固定提交 `6a254feae667f1f87ceb2c61e9931605504c3a01`；2018 年文档 | 历史版本已存在的版本读取、应用打包、普通版与 SDK 版事实 | 不证明参考工程或所有 MV 1.6.1 工程实际搭载 0.29.4；现代 NW.js API 不能因此倒推可用 |

CoreScript README 明确说明这是社区改进项目，区分 Develop、RC 和经 KADOKAWA 分发的 Stable，且声明采用 ES5 以兼容插件。因此本报告使用固定提交，而不把仓库 master 当成 MV 原版安装内容。[C0][C5][C6]

本地静态核对样本的路径基准为 `F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-test-project/`。其三个核心文件的 SHA-256 为：

| 相对样本的文件 | SHA-256 |
| --- | --- |
| `js/rpg_core.js` | `9AD9914CC421AF6D054C3F01B022B7383863B047EC3F6F76AA897E6CFBF864C6` |
| `js/rpg_managers.js` | `B3D5C746CF52234BDD34AF746DBF3CAECF96BB3477CC6D24121C4A1A11241114` |
| `js/rpg_objects.js` | `2D43DD9D8974C88A1B82FFA493D6D8A02C4CE1D0DFC8F05E6C0AB731E3F0573E` |

这些本地证据没有上传进研究分支；哈希和代码位置用于后续复核。参考工程中的第三方插件及其源码映射未用于证明 MV 原生能力。

## 插件从文件到执行的原生机制

### 文件、启用和加载顺序

官方约定插件为 UTF-8 JavaScript 文件，放在 `js/plugins/`；编辑器把所用插件名称和参数写进 `js/plugins.js`。`/*:` 注释块中的 `@plugindesc`、`@author`、`@param`、`@desc`、`@default`、`@help` 等供编辑器读取，并不是运行时自动执行的参数校验器。[P1][P2]

样本的 `index.html:26` 至 `index.html:27` 先引入 `js/plugins.js`，再引入 `js/main.js`；后者第 5 行调用 `PluginManager.setup($plugins)`。原生 `PluginManager.setup` 遍历数组，只在 `plugin.status` 为真且同名脚本未登记时，先注册参数，再加载 `plugin.name + '.js'`。`loadScript` 生成经典 `<script type="text/javascript">`，设置 `async = false`，依数组次序插入到文档。因此数组顺序具有运行语义；文件存在本身不会让插件自动启用。[C1][C7]

同名脚本登记采用名称字符串比较，而参数表使用小写名称作为键。报告不把文件名大小写变化视为安全重命名：文件系统大小写、插件内部硬编码的 `PluginManager.parameters('Name')` 和插件之间的名称引用，都需要在具体工程核对。[C1][N2]

官方建议在覆盖方法前保存旧方法并适当调用，以减少插件冲突；加载顺序会影响最终生效的方法和 alias 链。原生加载器没有声明依赖图、版本约束或通用冲突检测。这个结论指已检查的 `PluginManager` 代码，不排除具体插件自行加上检查。[P1][C1]

样本中的 `js/plugins.js` 已包含启用的演示运行插件和手工测试插件。这只能说明开发设施会作为普通插件进入该加载机制，不能证明它们应出现在最终产品，也不能由名称推断它们的功能正确。

### 参数与插件命令

官方规范明确参数全部以字符串交付，插件自己转换为数值、布尔值等。`PluginManager.parameters(name)` 对未知名称返回空对象。即使编辑器以更丰富的控件展示参数，也应核对插件如何解析实际字符串，不能把参数类型声明等同于运行时类型保证。[P1][C1]

1.6.1 参考核心中的 `Game_Interpreter.prototype.command356` 实际为：

```javascript
var args = this._params[0].split(" ");
var command = args.shift();
this.pluginCommand(command, args);
return true;
```

`pluginCommand(command, args)` 的原生函数体是空 hook，等待插件覆盖。这段代码与固定导入提交一致。[C3]

由这段代码直接得到的边界：

- 原生分隔符是一个空格字符；没有通用 shell 引号、JSON 参数、自动数值转换或按命令命名空间注册的机制。连续空格会产生空的参数字符串。
- 原生 hook 不识别命令、不报告未知命令。因此拼错命令或未启用插件，可能表现为无事发生。
- 命令的大小写、参数数量、参数范围、资源解析、等待模式及错误行为，都要依据具体插件的源码、官方文档或已有工程用法建立。
- 静态目录或 Plugin Command Registry 可以提供已知约定，但不能单独证明插件实际启用、加载、成功执行或等待完成。仓库术语也明确该 Registry 是可选 lint-time catalog。[L2]

MV 1.6.1 的这套 hook 不能套用 RPG Maker MZ 的命令注册式 API。本报告不对 MZ 作兼容承诺。

### Note 与 metadata

官方规范允许数据库条目的 Note 保存插件数据；原生 `DataManager.extractMetadata` 使用 `/<([^<>:]+)(:?)([^>]*)>/g` 提取 `<name:data>` 为字符串、`<flag>` 为 `true`。`DataManager.onLoad` 会处理地图本体、地图事件和带 `note` 字段的数组条目。[P1][C2]

原生提取保持键和值原样，没有通用 schema、大小写归一化、数值转换或插件专用语义；相同键后出现的值覆盖前值。Event Page 中的注释指令也不是自动进入这一提取器的 Note 字段。插件完全可能自行读取 Note 原文、页内注释或使用另一种语法，所以保留 `meta` 的一部分并不等于保留插件输入。[C2]

对后续接管范围的事实约束是：若要承诺兼容某个插件，必须确认它读写哪些数据库字段、Note、事件注释及自定义文件；不能只检查 Plugin DSL Command。

## 运行版本发现、JS / TS 构建目标与 API 信息

### 分开识别三个环境

| 环境 | 可取证输入 | 解释 |
| --- | --- | --- |
| Event DSL 工具宿主 | 仓库 ADR-0002、包元数据和执行工具的 Node 版本 | 该仓库决定 Node.js 22 LTS、TypeScript strict、ESM / NodeNext；约束工具执行本身。[L1] |
| 游戏核心与资源栈 | Project Root 的 `Game.rpgproject`、实际 `js/rpg_core.js` 中 `Utils` 标记、其他核心脚本内容及哈希、`index.html` 的依赖 | `.rpgproject` 和 Utils 标记是线索；项目可保留旧核心、局部升级或修改，必须以实际加载文件为依据。[C5][C7] |
| 实际游戏宿主 | 真正被启动的 NW.js 路径、版本、架构、构建 flavor；在该进程内读到的 NW / Chromium / Node 信息 | 不能由项目 `package.json`、MV 编辑器版本或系统 Node 版本代替。NW.js 官方 0.29.4 历史文档已列出 `process.versions['nw']`、`['chromium']`、`['nw-flavor']`；Node 版本可从同一进程的 `process.version` / `process.versions` 取证。[N1][N3] |

以上是可用的调查方法，本次没有执行版本探针。对于更旧或改造过的 NW，上述取证字段和 `nw` 全局对象也要实际检测；本报告没有推断其他 MV 版本的默认宿主，也不假定所有历史宿主都等同现代 NW。

NW.js 官方的 0.29.4 发布说明写明 Node.js 9.11.1 与 Chromium 65；这只能证明**这一 NW 版本**的组成，不证明它就是目标工程的宿主。参考工程的 `package.json` 仅设置 `main: "index.html"`、窗口和 `js-flags`，没有锁定 NW 发行包。本次仍未知其编辑器 Playtest 和最终部署各自实际启动哪份二进制。[N3]

### 构建输出必须满足实际加载方式

原生插件加载器请求 `.js` 并按经典浏览器脚本加载，未提供 TS 编译、ESM import/export 加载或 npm 包依赖解析约定。可以使用 TS 或分模块源代码开发，再生成满足该契约的 JavaScript；是否使用何种 bundler、输出目录与包布局仍是后续决策。[P1][C1]

TypeScript 的 `target` 控制哪些语法被降级；`lib` 提供相应运行环境的声明。声明允许某个 API 并不把实现安装到目标运行时，语法降级也不自动补齐所有浏览器、Node 或 NW API。因此构建目标至少要区分：语法兼容、运行 API、依赖的传递兼容以及加载格式。[T1][T2]

特别要避免把以下内容直接当作可发布事实：

- 工具在系统 Node.js 22 能运行，所以相同代码可以原样放进 MV 插件。
- 类型检查通过，所以目标 NW 的 `fetch`、`AbortController`、Node 内置模块、模块标识符或调试 API 必定存在。
- 核心源码使用 ES5，所以所有 1.6.1 工程必须使用同一个 ES5 构建配置，或现代代码一定不可用。
- 开发期 SDK 宿主中的调试方法，在最终普通版宿主中也可用。NW.js 0.29.4 官方发布说明明确普通版没有 DevTools，SDK 版才有。[C0][N3]

### 第一方 API 与类型来源

官方 MV Help 的 JS Library 区公开 `Bitmap`、`Graphics`、`Input`、`JsonEx`、`Utils` 等类与 JSON 数据结构。公开 CoreScript 包含 JSDoc、游戏对象和管理器源码；项目里实际加载的核心文件则说明本工程的最终行为。[P6][P7][C0][C2]

所查官方帮助与公开 CoreScript 树中，没有找到覆盖全部 MV 引擎、并明确锁定本目标版本的第一方 `.d.ts` 发行物。这是本次检索结果，不能据此宣称所有历史或商业发行物都没有。后续可采用社区声明、从源码补充局部 ambient 声明或维护本项目的类型层，但需要显式记录来源、版本与校核范围；不能把类型包当作引擎实际实现。[C0][P6]

在线帮助并非完整且严格同步的实现清单。例如此次 `Utils` 帮助页列了 `RPGMAKER_NAME`，但没有列出参考核心已有的 `RPGMAKER_VERSION`。因此精确版本问题优先核对目标工程核心源码和固定来源。[P6][C5]

## 官方部署与可自动化构建的边界

### 已证实的入口和产物

官方菜单文档把 File → Deployment 定义为按平台格式构建项目；Output Formats 文档说明 Windows 输出可分发的游戏文件夹，单 exe 包装另外参见 Enigma Virtual Box。Web 输出可上传服务器运行，Android / iOS 还需额外应用封装。因此“完整游戏构建”“单 exe 包装”“移动应用封装”“上传到发布渠道”是不同工作，不能互相替代。[P3][P4]

在本次已查的官方 MV Help 和公开 CoreScript 仓库里，未找到经过文档确认的完整游戏部署命令行接口。这个阴性结果不证明商业编辑器绝无 CLI；后续若发现参数，需要依据实际安装版本核实，而不是把未经确认的参数写进路线。[P3][C0]

公开 CoreScript 的 `npm run build` 生成六组核心脚本到 `dist/`；其 `package` 脚本组装并压缩 CoreScript 本身，没有完整游戏资源扫描和编辑器 Deployment 语义。它不能作为“官方已提供游戏部署 CLI”的证据。[C0]

### 等效构建的可行事实和未证实部分

NW.js 0.29.4 的历史官方文档允许把所需应用文件与 NW 二进制分发，或打成 `package.nw`，也列出了自动打包工具。应用以 `package.json` 的 `main` 启动；需要分发相应平台运行时文件，native Node 模块还涉及目标平台和宿主的重新构建。因此自动化的游戏目录组装、文件清单生成和 NW 运行包组装具有文档依据。[N2]

但 NW 的通用打包知识不提供 MV 编辑器的精确资源扫描算法、加密导出流程、额外文件复制清单或插件自定义目录处理保证。手工或工具驱动的等效构建仍需与本项目选定 MV 安装版本的实际 Deployment 输出比较。这一比较属于后续实验；本次没有部署工程，也不替用户选择通用 NW 打包工具。[P4][P5][N2]

### 资源裁剪、动态资源与开发设施

官方 `Exclude unused files` 只明确列出 `img/` 和 `audio/` 中的未用文件。插件通过代码动态读取的图片可能被误判，官方文档给出的补救包括：[P4][P5]

- `@requiredAssets` 指定必要资源路径。
- 文件参数上的 `@require 1`、`@dir`、`@type file` / `animation`。
- Note 资源上的 `@noteParam`、`@noteRequire`、`@noteDir`、`@noteType`、`@noteData`。

这些注释是编辑器资源裁剪的输入约定，不是任意 JS/Note 数据流分析的能力证明。运行时拼接文件名、外部 JSON 指定资源和插件自定义目录应逐个验证；手册没有给出它们都会自动复制或保留的承诺。[P5]

对开发设施则需要单独定义发布规则。“插件关掉了”只说明原生 `setup` 不加载该条目；不证明文件未被复制，也不证明代码没有被打进其他 bundle 或从 `index.html` 引入。所查文档没有承诺 Deployment 自动剔除禁用插件、测试存档、自定义测试目录、日志或 sourcemap。不能把资源裁剪选项视为这些规则的实现。[C1][C7][P4]

### 加密的真实范围

官方部署选项是图片与声音加密，带可选 Encryption Key；文档明确不能在 Project Root 内直接使用加密资产，且没有防止复制的绝对保证。它没有把 JavaScript、JSON 数据、视频或任意插件文件列成该选项的加密范围。[P4]

1.6.1 参考核心的 `Decrypter` 和固定来源一致：`png`、`ogg`、`m4a` 映射到 `.rpgmvp`、`.rpgmvo`、`.rpgmvm`，`img/system/Window.png` 在 ignore list；是否加密由加载的 System 数据标记控制，解密 key 从 `$dataSystem.encryptionKey` 取得。原生资产加载通道会参与解密，插件若自己以别的通道读取资源，是否支持这些输出必须具体验证。[C8][C2]

以上证明的是选项范围和运行时消费格式。本次未验证编辑器导出时的完整文件变换算法，也不声称可以仅靠复制改后缀实现等价加密构建。

## 从最终构建验证什么

下面是由已证实机制导出的候选验收证据，不代表已经执行，也不预先锁定测试框架或包布局。

| 要确认的事情 | 可收集的证据 | 仍不能单独证明的事 |
| --- | --- | --- |
| 构建来自预期输入 | 构建清单、核心与插件产物哈希、预期插件配置和资源清单；记录目标宿主二进制身份 | 拷贝成功不等于游戏运行成功 |
| 插件确实进入最终加载链 | 在最终产物核对 `index.html` / `main.js` / `js/plugins.js`、启用和顺序；实际启动该产物，再运行需要插件的功能 | 没有加载错误不证明命令参数或交互正确 |
| 参数和 Note 语义正确 | 在可控场景触发行为，检查预期状态、视觉或功能结果，必要时读取插件公开状态 | 静态类型或元数据登记不证明 runtime 行为 |
| 动态资源未被裁剪 | 从最终产物走到真正加载资源的分支，观察图片、音频、外部配置加载结果，记录缺失或解密异常 | 标题画面能启动不证明所有分支资源齐全 |
| 开发设施按选定规则排除 | 对最终物理文件和 bundle 做规则检查，核对插件配置、入口和开发插件依赖；实际以发布模式启动 | 仅禁用插件不等于文件排除；仅搜文件名也不能发现被改名或内联的设施 |
| 同版本存读档可继续游戏 | 最终产物内创建状态、存档、退出并重启同一产物、读档、继续触发受影响玩法 | 同进程恢复不一定能暴露闭包状态未持久化的问题 |

最终产物需要在不借助 Project Root 或开发目录资源的环境验证，否则缺文件可能被错误路径、外部脚本或缓存掩盖。这是独立验证构建完整性的推论，不是 MV 编辑器已经替工具保证的行为。[C1][C7][N2]

原生保存路径也和宿主、包布局有关：本地参考核心 `rpg_managers.js:755` 按 `process.mainModule.filename` 所在目录追加 `save/`；浏览器模式使用 localStorage。不能直接把开发工程的存档位置搬作所有最终包的断言。社区 1.3b 的保存目录回退是另一版本行为，本报告不将它套到参考核心。[C9]

## 同版本插件状态的存读档

原生 `DataManager.makeSaveContents()` 明确包括 system、screen、timer、switches、variables、selfSwitches、actors、party、map、player；不包括 `$gameTemp`、`$gameMessage`、`$gameTroop`。`extractSaveContents` 把反序列化后的这些根对象赋回全局。存档使用 `JsonEx.stringify`，读档使用 `JsonEx.parse`。[C2]

因此插件新增的状态不是“声明一个全局变量就会自动保存”。如果状态是上述保存图里的可序列化属性，它可沿该对象图被保存；独立 closure、局部缓存或单独插件全局不在默认保存根中，需要插件自己的持久化 hook。通过覆盖 `makeSaveContents` / `extractSaveContents` 扩展根内容是可行方式之一，但原生没有插件状态注册表，也不替具体插件保证正确调用 alias 链。[C1][C2][P1]

`JsonEx` 记录非普通对象的构造函数名，恢复时查 `window[constructorName]`，然后还原 prototype。它还有最大深度限制，并不是能完整保存任意 JS 运行对象的通用序列化协议。[C4][P7]

这对 TS / JS 插件构建有一个具体影响：如果需持久化的自定义类被封进 IIFE 或模块局部作用域，读档时对应构造函数不在 `window` 上，即使同一游戏版本也可能无法恢复原型方法；压缩器改名也可能干扰按名称恢复。可选方案包括把持久化状态限制为普通数据并显式重建对象，或明确公开并保持相关构造名，但选择哪种仍应留给后续插件状态契约决策。[C4]

真正的玩家存读档流程还经过 `Scene_Save` 调用 `$gameSystem.onBeforeSave()` 和 `Scene_Load` 调用 `$gameSystem.onAfterLoad()`；只调用底层序列化函数不足以覆盖全部场景生命周期。参考位置分别为本地样本 `js/rpg_scenes.js:1706`、`:1745`，固定 CoreScript 源码也提供这两个场景入口。[C10]

验收重点是**当前版本**：任务/战斗/菜单等插件状态按预期持久化、重启后继续可用、无需持久化的显示和缓存能重建。旧版本存档迁移、插件升级后的 schema 兼容、长期存档承诺不作为本图的默认前置条件；若某个游戏明确需要，再另行缩定范围。

## 对决策图的影响与仍未解决的问题

现有资料足以把以下问题表述为决策票，事实报告不代替用户回答：

1. **实际运行环境的身份要记录到什么程度，哪些变化需要重新验收？** 需要覆盖核心文件、库、插件以及开发和最终宿主；不能仅存 MV 版本字符串。
2. **“接入一个插件”承诺验证什么？** 仅安装/配置，还是同时包括命令、Note、自定义资源、方法覆盖顺序、同版本状态持久化及关键交互。
3. **发布构建以哪条可重复路径为准，等效性的边界是什么？** 编辑器 Deployment 和等效 NW 组装都存在依据，但自动化驱动、资源扫描与加密等价性尚未验证。
4. **开发设施的发布排除规则和证据是什么？** 要明确关注配置、物理文件还是 bundle 内容；未用图片裁剪不解决该问题。
5. **插件持久化状态采用何种契约和同版本验收？** 避免把“能保存”偷换成跨版本迁移承诺，也避免因弱化旧存档兼容而漏掉当前功能正确性。

仍需实验或额外项目取证的事实，适合作为依赖相关决策的后续任务：

- 指定 MV 安装中 Playtest 与 Deployment 各自使用的 NW 二进制、版本、架构及构建 flavor；本次未运行探针。
- 指定编辑器版本的 Deployment 对禁用插件、任意自定义目录、开发日志、测试存档和 sourcemap 的复制规则，以及加密导出的真实差异清单。
- 插件动态资源在启用裁剪与加密后是否被保留且能加载；官方注释机制与实际插件声明是否相符。
- 等效 NW 构建相对编辑器输出需保持哪些文件和设置，哪些差异只影响体积或包装，哪些影响玩法与存储。

不需要为此重开 ADR-0002 的工具栈决定；应另行定义游戏插件产物的运行契约。ADR-0009 / ADR-0010 仅承诺静态 Map Inspection / Map Preview，本研究涉及实际游戏运行和最终构建，不把运行能力归入那些既有静态观察承诺。[L1][L3]

## 来源索引

所有链接于 2026-10-18 查阅。`C` 类固定到上述 1.6.1 导入提交；`N` 类历史链接固定在 0.29.4 提交，不能冒充目标游戏的宿主证明。

- [P1 — RPG Maker 官方 Plugin Specifications](https://rpgmakerofficial.com/product/MV_Help/page/01_11_03.html)：Basics、Redefining Methods、Parameters、Metadata、Plugin Command。
- [P2 — RPG Maker 官方 Enabling Plugins](https://rpgmakerofficial.com/product/MV_Help/page/01_11_09.html)：文件复制、Plugin Manager 启用与刷新。
- [P3 — RPG Maker 官方 The Menu Bar](https://rpgmakerofficial.com/product/MV_Help/page/01_04.html)：File → Deployment。
- [P4 — RPG Maker 官方 Output Formats](https://rpgmakerofficial.com/product/MV_Help/page/01_11_04.html)：部署平台、未用资源排除、图片/声音加密及限制。
- [P5 — RPG Maker 官方 Exclude unused files Plugin Configuration](https://rpgmakerofficial.com/product/MV_Help/page/01_11_11.html)：动态资源误删、requiredAssets、参数和 Note 注释。
- [P6 — RPG Maker 官方 Utils 文档](https://rpgmakerofficial.com/product/MV_Help/page/03_17.html)与[JS Library 目录](https://rpgmakerofficial.com/product/MV_Help/parts/side.html)：公开 API 的覆盖边界。
- [P7 — RPG Maker 官方 JsonEx 文档](https://rpgmakerofficial.com/product/MV_Help/page/03_06.html)：对象信息序列化、恢复、maxDepth。
- [P8 — RPG Maker 官方 Update History](https://rpgmakerofficial.com/product/MV_Help/page/01_00.html)：在线手册可见更新时间。
- [C0 — CoreScript README（固定提交）](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/README.md)与[package.json](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/package.json)：社区项目身份、构建范围和 ES5 约定。
- [C1 — PluginManager.js:15](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_managers/PluginManager.js#L15)：setup、参数表和脚本加载；本地样本 `js/rpg_managers.js:2801`、`:2818`、`:2826`。
- [C2 — DataManager.js:126](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_managers/DataManager.js#L126)与[保存根:426](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_managers/DataManager.js#L426)：onLoad / extractMetadata、save/load、make/extractSaveContents；本地样本 `js/rpg_managers.js:130`、`:153`、`:371`、`:430`、`:446`。
- [C3 — Game_Interpreter.js:1744](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_objects/Game_Interpreter.js#L1744)：原生 command356 / pluginCommand；本地样本 `js/rpg_objects.js:10505`。
- [C4 — JsonEx.js:120](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_core/JsonEx.js#L120)与[恢复:171](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_core/JsonEx.js#L171)：保存构造名、window 查找和 prototype 恢复；本地样本 `js/rpg_core.js:9026`、`:9077`、`:9114`。
- [C5 — Utils.js:29](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_core/Utils.js#L29)与[1.6.1 导入提交](https://github.com/rpgtkoolmv/corescript/commit/c45644fe4013b39d2d31e1410e92b30ebcac0360)：核心版本字符串及提交身份。
- [C6 — community-1.3b Utils.js](https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_core/Utils.js#L29)：同样的 1.6.1 字符串和额外社区标记。
- [C7 — template/index.html](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/template/index.html)与[main.js](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/main.js#L5)：核心、配置和插件启动链；本地样本 `index.html` 与 `js/main.js`。
- [C8 — Decrypter.js](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_core/Decrypter.js#L12)：ignore list、格式映射、key 读取与解密；本地样本 `js/rpg_core.js:9159` 起。
- [C9 — StorageManager.js](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_managers/StorageManager.js)与[community-1.3b StorageManager.js](https://github.com/rpgtkoolmv/corescript/blob/182e31449707ba7e406db0485c44c2a9d11e2dcd/js/rpg_managers/StorageManager.js)：本地/浏览器保存和不同分支保存目录行为；本地样本 `js/rpg_managers.js:755`。
- [C10 — Scene_Save.js](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_scenes/Scene_Save.js)与[Scene_Load.js](https://github.com/rpgtkoolmv/corescript/blob/c45644fe4013b39d2d31e1410e92b30ebcac0360/js/rpg_scenes/Scene_Load.js)：玩家保存和读取的场景生命周期。
- [N1 — NW.js 0.29.4 Changes to Node](https://github.com/nwjs/nw.js/blob/6a254feae667f1f87ceb2c61e9931605504c3a01/docs/References/Changes%20to%20Node.md)：process.versions、mainModule、require 上下文。
- [N2 — NW.js 0.29.4 Package and Distribute](https://github.com/nwjs/nw.js/blob/6a254feae667f1f87ceb2c61e9931605504c3a01/docs/For%20Users/Package%20and%20Distribute.md)：可自动化打包、plain / package.nw、运行时分发与平台注意事项。
- [N3 — NW.js v0.29.4 官方发布说明](https://nwjs.io/blog/v0.29.4/)与[历史 README](https://github.com/nwjs/nw.js/blob/6a254feae667f1f87ceb2c61e9931605504c3a01/README.md)：Node/Chromium 组成、普通版和 SDK 版、应用启动方式。
- [T1 — TypeScript 官方 target](https://www.typescriptlang.org/tsconfig/target.html)与[源文档](https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/copy/en/options/target.md)：语法降级与 target / lib 关系；经 Context7 检索并直接核对。
- [T2 — TypeScript 官方 lib](https://www.typescriptlang.org/tsconfig/lib.html)与[源文档](https://github.com/microsoft/TypeScript-Website/blob/v2/packages/tsconfig-reference/copy/en/options/lib.md)：运行时声明和 polyfill 前提；经 Context7 检索并直接核对。
- L1 — 本仓库 `docs/adr/0002-technical-architecture-and-toolchain.md`，研究基线 `da26d4ef5aaa2b997c75eb51cc405985178b21e2`：工具宿主决定。
- L2 — 本仓库 `GLOSSARY.md` 的 Plugin Command Registry、Plugin DSL Command 定义，以及 `skills/rpgmaker-event-authoring/SKILL.md`：现有插件命令验证边界。
- L3 — 本仓库 `docs/adr/0009-read-only-map-inspection-and-preview.md` 与 `docs/adr/0010-static-map-rendering-with-project-image-assets.md`：静态观察边界。
