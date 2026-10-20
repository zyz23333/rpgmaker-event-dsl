# 40 系统访问、窗口色与场景：开发及待验收记录

本文件只记录本票证据边界，不表示 READY、resolved 或完整支持已完成。
实际集成开发基线为 `73504ec28bad98ae424a9d452f68774b009579d0`，继承
Compile Contract Version `mv-1.6.1/12` 和原有 314 条验收要求。

## 契约与独立预期

权威输入为完整实施规格、40 号票、visual-map 的共享 TONE 与 E134–138、
actors-battle 的 E351–354，以及 ADR 0008、0011、0012。四个访问标志要求
显式 Boolean，均为 false→0、true→1；E136 使用 `changeEncounter({ enabled })`。
Tone 是具名四字段对象，RGB 整数 −255..255，gray 整数 0..255，隐藏 gray
与数字负零均须保留。四个场景 helper 零输入，原生参数精确为 `[]`。

`system-access-window-scenes.json` 是按这些契约手写的独立原生槽字面量。
`system-access-window-scenes-project.json` 在独立最小项目上放入三类事件，
提供全部 15 个标准 carrier；其中 System 的非默认 windowTone 与命令色调
不同，外部 carrier 也包含独立结构、CR/LF 和负零。两者都是合成支持夹具，
没有从待测编译器获取预期，不是编辑器 UI 捕获或游戏运行观察。

## focused DEV 运行记录

所有新日志、完整实际输入快照、结果和沙盒保存在独立目录
`M:/Shuen/Codex/mv-events-implementation-20261020/ticket40-temp`。
Windows / Node 22.23.0、pnpm 10.33.0、原有两个 test worker 与 10 秒 case
deadline 保持不变。每次执行使用唯一标签；原红及失败输入不覆盖。

- `MV-S6-SYSTEM-SCENES-001` 首次实际红：公开入口缺少 `changeEncounter`。
  `access-red-v1` 保留原始 revision、176 个输入字节和失败结果。
- 首次静态检查另发现测试搭建遗漏 `.resolver`；保留 `access-static-v1`
  原始输入与 TypeScript 失败日志，修正搭建后 `access-static-v2` 通过。
- 同一 001 复验 `access-green-v1` 通过，1 case，828ms 总计／63ms tests。
  完整输入 fingerprint 为
  `476e2fa2dcc11475c7b7dd4b81b1c6d30bbbbe3f8144ec84d0cf9da443c24de3`。
- `MV-S6-SYSTEM-SCENES-002` 首次实际红：空访问输入没有抛必填 Boolean
  诊断。`access-input-red-v1` 保留 176 个完整输入，fingerprint 为
  `7cf146ea770515ddb1f84a64722b5835b448983a0f1b605f7660bc506786fc72`。
  最小修复已通过包 TypeScript 静态检查；同一 002 的
  `access-input-green-v1` 实际通过，1 case、1 个名称过滤跳过，
  3.28s 总计／96ms tests。177 个完整输入的 fingerprint 为
  `cf81bb19c7b5df8f3a8d18b23d64d9ecab7549edd1fe9647c59daa30b1dd8ac8`。
- `MV-S6-SYSTEM-SCENES-003` 首次实际红：Window helper 仍接受 tuple
  `[0,0,0,0]`。`window-tone-red-v1` 保留 177 个完整输入，fingerprint 为
  `4d45a0a7fb4bbee63fb9c3de00d58eb00571da423fba11f1569e050c67250b37`，
  816ms 总计／65ms tests。共享测试窗口释放后，同一 003 的
  `window-tone-green-v1` 通过，1 case，867ms 总计／72ms tests，完整输入
  fingerprint 为
  `7a1374cb27c42a17ee591a2c7430a2214132c61a532df51a857631bd9c0e44f4`。
- 004 首次实际红 `native-access-red-v1` 确认原生 E134 的分类负零被接受。
  最小专有原生校验加入后，首轮 `native-access-green-v1` 仍失败于测试
  错把 `rawDslCommand` 构造当成参数验证边界。既有 helper 明确延后参数
  校验；只把测试移到其实际 `compileCommonEvent` 边界，未扩大共享 raw
  helper 行为。原失败与完整输入保留；`native-access-green-v2` 通过，
  1.36s 总计／69ms tests，178 个完整输入 fingerprint 为
  `c5ecf101cec621fd6927056403a37e24863f8ad80684684f238b378cff4b26f1`。
- 005 首次实际红 `native-tone-red-v1` 确认原生 E138 接受 red=-256。
  最小扩展验证精确外层单槽、四分量与各自整数范围后，同一 005 的
  `native-tone-green-v1` 通过，1.40s 总计／70ms tests。Tone 数字负零
  接受并逐分量保留，未套用访问标志的分类负零禁令；非有限及 undefined
  值由既有严格 JSON 边界报告精确槽位。
- 006 的 `access-decode-red-v1` 确认 E136 仍输出旧 helper/disabled 字段；
  最小 dispatch 修改后 `access-decode-green-v1` 通过，1.65s／68ms。
- 007 的 `window-decode-red-v1` 确认 E138 仍输出 tuple；只修改已有
  system renderer 的 Window 输出，`window-decode-green-v1` 通过，
  1.37s／59ms。四字段、隐藏 gray 与数字负零均显式输出，未修改 37／38
  的未合入全局 Tone 契约。
- 008 的 `scene-input-red-v1` 确认四个场景 helper 会静默忽略实参；
  最小零输入检查及直接命令字段检查后 `scene-input-green-v1` 通过，
  1.39s／72ms。场景 helper 的公开类型仍只允许零实参。
- 009 原生精确 `[]` 已由既有通用槽位校验提供，新增回归首次即通过；
  未虚构红，也未为现有行为重复添加专有产品实现。
- 四文件轻量批次 `command-unit-batch-v1` 实际通过 30／30，覆盖本票
  001–009 及既有 DSL、事件编译与反编译回归，2.13s 总计／481ms tests。
  179 个完整输入 fingerprint 为
  `5aa62515050260a113a2b7c08d8ba1ebb7d6159ec10893cbc7c31ece8a4dcc66`。
- `system-settings-static-v1` 包 TypeScript 检查实际通过；后续场景与
  独立公开类型断言的 `scenes-public-types-static-v1` 也实际通过。
  该独立类型文件检查显式 Boolean、具名 Tone、隐藏 gray 必填、旧 API
  缺席及四个零输入签名；其中无效调用仅参与 TypeScript 检查，不执行。
- 最新专有源文件和新增测试的定向 `focused-lint-v1` 与
  `focused-format-check-v1` 实际通过；这是定向静态检查，不代表全量适用
  检查已经完成。

以上只涉及已实际执行的小范围开发验证。原生/known raw 单元用例使用实际
命令列表渲染及 Common Event 编译边界；独立 Workspace 验证记录如下。
全量适用检查、构建、built 入口、
最终逆向产品比较、实际游戏运行与关闭尚未执行于本票最终候选。

## Workspace 实际运行

`system-access-window-scenes-workspace.test.ts` 的 010–024 共 15 个用例已
登记，使用原有 10 秒 case deadline，无扩大超时。它们覆盖独立 full15
Project Root／Snapshot、全部四个生成 carrier、三类事件、实际 Discovery
和已发布源文件求值、只读 Check、正式表达及已知 raw 的实际 Push；失败
用例还比较完整 source／config／Project Root／Snapshot／generated／manifest
与 Discovery，并要求陈旧输出的 Diff／Push 拒绝。

执行前的 `workspace-preparation-static-v1` 包 TypeScript 检查实际通过。
该次 181 个完整静态输入 fingerprint 为
`78ade31dd82883be494a324e84edc7992babec521016f87f04ee00680fcf0a64`。
验收要求数为 338，即继承的 314 条加本票 24 条；原继承前缀字节保留。
这是该开发工作树的临时计数，不能视为实际最新集成的最终总数；实际
post27 集成后必须重新合并与核对契约、原有要求和本票新增要求。

在明确授权的独占窗口中，单独 cherry-pick 共享证据 helper
`9e65e044c942d30a40525555bab8366e28566ce9`，本树对应提交为
`6ba40682006c7c95101a4edd9c66e3d77e2ee92a`。该提交仅改
`test/support/mv-evidence.ts`，其 SHA256 为
`343a11790df3a07ded5b34aa17a2e5fd0fcb7b65e5e25776ee995e6d451fddba`。
`pre-helper-dirty-v1` 保存全部 30 个原 dirty 文件、Git 状态和补丁；
`verify-helper-inputs-v1.log` 证明所有原 dirty 文件逐字节不变，实际
source/test/config/requirements 输入仅该获准 helper 发生变化。

下列五批使用同一组完整实际输入，freeze fingerprint 均为
`c01aec400ab358aba5f22b22d5dcffc0d2cca940332ca19386112f1782b09c73`。
每批的输入字节、准确 Git 身份和 manifest 都在
`source-snapshots/<批次标签>/`，日志与原始执行结果分别保存。全部沿用
Node 22.23.0、pnpm 10.33.0、原两个 worker 和每 case 10 秒期限。

| 实际批次标签 | 实际通过用例 | 总耗时／tests 耗时 |
| --- | --- | --- |
| `workspace-discovery-check-v1` | 010，1 个 | 6.71s／3.23s |
| `workspace-positive-push-v1` | 011–012，2 个 | 4.89s／3.32s |
| `workspace-helper-failures-v1` | 013–015，3 个 | 8.41s／6.86s |
| `workspace-direct-raw-failures-v1` | 016–020、024，6 个 | 17.37s／15.83s |
| `workspace-native-publication-failures-v1` | 021–023，3 个 | 1.93s／374ms |

010–024 的全部 15 个独立 Workspace case 均已实际执行通过；每批其余
case 的名称筛选 skip 不计为通过。010 实际发现四份源码，并求值三类事件
的正式命令文件、执行只读 Check；011、012 分别执行正式表达及已知 raw
的 Compile、Diff、真实 Push，完整比较 15 个 Project Root／Snapshot
carrier，包含隐藏 gray、非默认 System Tone 和数字负零。013–020、024
证明实际源码错误同时阻止 Check／Compile，保全完整可观察文件状态并
使陈旧 Diff／Push 拒绝；021–023 证明无效原生输入在源码发布前失败且
完整状态不变。本窗口未执行 post27 合并、index、archive、全量检查、
构建、built 入口或实际游戏运行。独占窗口在上述运行完成后立即释放。

## 实际 post27 集成与 focused 复验

实际合入的传入提交为 `e5740784690645963759aef55a69780205de5a3c`。
`premerge-dirty-v1` 完整保留此前 30 个 dirty 文件、状态及补丁；逐字节
复核后建立 focused 开发检查点
`f7d37878b259d27bd5d1ee9d823d5326732f31f4`。真正执行的三方合并输入
固定为 base `73504ec28bad98ae424a9d452f68774b009579d0`、ours
`f7d37878b259d27bd5d1ee9d823d5326732f31f4`、theirs
`e5740784690645963759aef55a69780205de5a3c`；46 个相关路径的各方
完整 Git blob 字节与身份保存在 `merge-inputs-v1`。

原始合并仅在 evidence README 和 requirements 出现内容冲突。
`merge-reconciliation-v1` 保存原冲突文件、三方 stage 身份及明确的
reconciliation receipt：完整保留传入 328 条要求的原字节前缀，再追加
本票原 24 条，实际 352 条且 ID 无重复；README 保留传入整个文件的字节
前缀与本票原附录字节。编译契约文件与传入字节完全相同，继承
`mv-1.6.1/13`，没有 DEV 自行升级。产品代码自动合并后另检查共享
compiler/domain/validation 的实际差异，Choices 与本票行为均保留。

合并提交为 `12f7159ee0a7ea13cb27f08f2bb0a2b2e97d9f2d`，实际树为
`4edcda04cdc68cc838911cf9e35827ca3c006792`。下列实际运行均绑定此
clean 合并身份与同一 185 个完整输入，freeze fingerprint 为
`7a98049d4ab57c7809fa6a5485bd1dde6b38a8b77988f9cf675eae08760d16fa`。

原始 freeze helper 的嵌入 `git status` 未带 command-scoped
`core.longpaths=true`，所以这四份原 manifest 的 status 各记录了 736 个
传入历史超长路径的 `D` 误报。原 manifest 完整保留，没有改写成 clean；
实际执行的 185 个 source/test/config/requirements 文件字节与 SHA256
已完整冻结，合并及闭合检查均用 scoped longpaths 得到真实 Git 身份。
`postmerge-status-metadata-limitation-v1.json` 记录这一差异。已准备只修
Git 调用参数的外部 freeze/runner v2，未借此重跑产品测试；完整旧 Git
历史的逐 blob 核验留给获准的 archive 窗口。

| 实际批次标签 | 实际结果 | 总耗时／tests 耗时 |
| --- | --- | --- |
| `postmerge-focused-unit-v1` | 本票命令、Choices 及既有 DSL/events/decompiler，5 文件、95／95 | 3.95s／3.02s |
| `postmerge-own-workspace-v1` | 本票 010–024，15／15 | 28.69s／27.12s |
| `postmerge-choices-workspace-v1` | 相交 Choices Workspace，19／19 | 26.43s／24.80s |
| `postmerge-typecheck-v1` | 包 TypeScript，含公开类型拒绝断言 | exit 0 |

仍使用原 10 秒 case 期限与两个 worker。该窗口没有新增失败，历史失败
与首次运行未被覆盖。`postmerge-window-closed-v1.json` 记录所有运行的
exit 0、clean Git 身份及实际 CIM 检查未发现本任务残留 Node/pnpm 进程。
窗口完成后立即释放。index、archive、full、build、built、E4 最终比较和
R6 实际游戏仍未在这一合并候选执行，后续受统一调度。

## E4 产品比较（待 finalization）

`MV-S6-SYSTEM-SCENES-E4-COMPARE` 预留给实际最终构建输出与版本绑定的
编辑器初始化、加载、确认、容器保存及窗口 Tone 契约比较。既有逐参数报告
记录的是首方代码事实与有条件推导；没有冒称 UI 实测。最终需核对实际产物
身份、完整参数结构、隐藏 gray、四个 Boolean 标志和零参场景输出。

## R6 实际游戏运行（待 finalization）

`MV-S6-SYSTEM-SCENES-R6` 保留实际 MV 1.6.1 / NW.js 验收门槛。原生字面量
与编译后版本须在等价干净初态分别运行，记录菜单／保存禁用后的事件入口、
地图／战斗场景边界、遇敌计数重置、窗口效果及 Game Over／Title 生命周期。
只允许被动观察和触发事件，不能直接打开被测场景、改写引擎或伪造场景行为。

原生准备与冻结 runner 的上下文见外部
`C:/Users/Shuen/.codex/tmp/mv-r6-system-scenes-native-control-notes.md`。
原三份反向标志失败和早期 Title 截图局限必须保留。该准备和代码分析均不
替代最终实际运行；本文件尚无本票最终候选的 R6 通过声明。

## 最终集成责任

保留现有 helper 模块归属，由水平 validation 协调专有验证。
37／38／40 最终实际合并后统一同一具名四字段 Tone 契约，移除 tuple alias
并验证数字负零不丢失。focused DEV 不自行递增契约、不执行 full/build/built
或原生验收、不关闭票，也不清理其他工作树或历史证据。
