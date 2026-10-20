# MV 1.6.1 命令参数与保存结构独立复核

日期：2026-10-20（Asia/Shanghai）。问题：当前产品对原生事件命令的正式表达、参数、分支、续行和 Native Saved Shape 是否还有可确认缺口。

## 本分项结论

**本分项未确认新的命令级产品缺陷。** 我没有将“105 个 helper 存在”当成完整性证明：本轮重新读了当前首方 QML 和产品分支/参数校验代码，并编写独立的组合夹具，经公开 Workspace API 运行了 25 个 Common Events、505 条原生记录。反编译后再编译，完整解析值使用 Node `isDeepStrictEqual` 比较一致，包含负零、字段是否存在、分支空体与非空体的尾标记、route 正文与 505 镜像，变更事件数为零。

这个结果支持“被检查的命令形态和组合保真”，**不能单独证明全部 MV 原生事件已经完整支持**。本分项没有穷举每一个数值/素材/引用/文本输入，没有操作原生编辑器，没有运行游戏，也不覆盖事件容器和完整工程接管是否成功；总审计必须同时纳入其他分项发现。

## 研究范围与证据类别

- **S，静态观察**：读取本轮重新从 `references/RPGMV/RPGMV.exe` 提取的首方 QML，追踪保存函数及控件，再对照当前产品实现。读取文本不等于启动 QML 或观察 UI 行为。
- **I，有界推断**：由完整保存函数推导该路径输出的槽位与结构。特别是 `[6,undefined]` 在最终 JSON 数组序列化中成为 `[6,null]`，属于代码与标准 JSON 语义的推断。
- **P，产品执行观察**：在 Windows / Node 22.23.0 上运行公开 `initWorkspace`、`cloneWorkspace`、`decompileWorkspace`、`compileWorkspace`；夹具独立写出完整 native records，未调用产品 compiler 生成期望值。
- **U，未覆盖**：真实编辑器创建/重确认/落盘、游戏运行，以及所有输入组合的穷举均未在本分项执行。

首方资源来自父审计本轮的只读解码目录 `C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/editor/`。其 `inventory.json` 包含每条资源的 EXE offset、stored/decoded 长度、编码与 SHA-256。下文 `Q@<offset>:<line>` 为该目录 `<offset>.qml` 的一基行号，不是还原的 qrc 路径或新的 REA Evidence ID。

EXE 身份为 19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`；父审计本轮 PE Evidence 为 `ev_b8067f7657b1ddb9b5509bb30f4e70e609bc89a84c5111b35af88e3cb87f39bd`。本分项复用其身份，不自己打开共享 native session，不将静态分析当运行观察。

## 首方路径与产品对照

| 核查问题 | 首方证据 | 当前产品与实际结果 | 判定 |
| --- | --- | --- | --- |
| Conditional 的 14 种模式、Actor/Enemy 的三槽与四槽差异 | Q@748645:68–115 分派条件页并重建参数；Q@658002:210–240 写 Actor checks；Q@650223:169–191 写 Enemy/Character 条件 | `commands/flow/conditional-validation.ts:411` 按模式分配精确槽数；`commands/flow/decompile.ts:101` 按全部模式生成正式表达。P：21 条独立条件向量，包含 14 根模式与 Actor 全部 check，通过完整往返 | 已回答，所测组合通过 |
| 非空分支的 Body End Marker 省略是否被默认补入 | Q@748645:117–139 收集已有子体，仅空体补 0；Q@706715:140–169、Q@782932:73–106 同类处理 | `commands/flow/decompile.ts:37`、`:54`、`:86` 保留存在/缺失状态。P：then、else、loop、choices、battle 中混合有/无尾标记，往返一致 | 已回答，所测组合通过 |
| Choices 保存镜像与 Cancel Branch | Q@706715:106–137 写主文字、402 `[j,choices[j]]`、可选403与404；正常最多六项，使取消分支对应 `[6,null]` | P：Battle 各结果分支内嵌 Choices，保留空项、CR 文字、defaultChoice=5、cancel branch、402/403 镜像与不同子体尾标记 | 已回答，所测组合通过 |
| Battle 两个 flags 的四种组合，尤其 FF 是否错误补分支 | Q@782932:46–70：FF 仅301；任一为真才写601/可选602/603/604。Q@672127:21–29：randomEncounter 的独立值槽固定0 | `commands/battle/decompile.ts:14` 读取分支；原生参数校验固定 randomEncounter 的第二槽为0。P：四组合全部放入独立 Common Event，含 nested Choices；原样恢复 | 已回答，四组合通过 |
| 移动指令 envelope 和 205/505 镜像在嵌套中是否丢字段 | 本轮阅读当前 `commands/movement/compile.ts`、`decompile.ts`、`validation.ts`；保存形态依据 ADR0015，未重新宣称每种 envelope 普通 UI 均可创建 | P：route 指令包含 absent/null/0 indent，终止记录没有 parameters；原样对应505，并置于 Conditional 深一层子体，完整往返一致 | 已回答，所测组合通过；普通UI创建为U |
| Control Variables 随机上下限反序是否被产品错误限制 | Q@683885:184–209 的 `makeFullOperandParams` 在 random 模式显式保存 `Math.min` 与 `Math.max`（195–196行） | 产品 `commands/variables/native-control-variables.ts` 拒绝 from>to 与该保存路径一致。反序输入不是本轮确认的普通编辑器保存反例 | 已回答，候选排除 |
| Characters 是否与 Faces 一样能在高图片中选出 index>7 | Q@625536:11–19 Faces 固定144×144/四列；Q@638194:25–35 用尺寸计算帧数；Q@626433:83–131 的 EventImage 角色网格按12×8划分，并以 `%4`、`%2` 合成角色索引 | 动态 Face 索引与 Characters 网格不是同一值域来源。本轮未找到普通角色选择会生成 >7 的代码路径。没有将此候选认作缺陷；未穷尽所有图像控件 | 部分回答，未确认反例 |
| 单槽文本在嵌套 inline rendering 中是否丢 CR/LF/非法 UTF-16 单元 | 产品 `decompiler/core.ts` 的 `literal` 使用专用 JSON→TypeScript renderer；嵌套源的换行替换不应改动已经转义的字符串 | P：Label、Jump to Label、Conditional Script、Movement Script、Plugin Command 混合 CR/LF、U+2028、U+2029、孤立高代理项及尾空白，完整往返一致 | 已回答，所测字符串通过；游戏执行为U |

## 独立产品 probe

代码：[composition-probe.ts](../probes/commands/composition-probe.ts)。结果：[composition-result.json](../probes/commands/composition-result.json)。警告输出：[composition-stderr.txt](../probes/commands/composition-stderr.txt)。这些是本轮新建的调查资产，没有修改产品源码或已有完成证据。

执行命令（PowerShell，仓库根目录）：

```powershell
& 'C:/Users/Shuen/AppData/Local/pnpm-cache/dlx/e71f3854d6e4a210b542a0fff0f6de7931eae2c732fef8abdbb6314c36843fd7/1a152fc0f14-2f10/node_modules/.pnpm/node@22.23.0/node_modules/node/bin/node.exe' --import ./packages/rpgmaker-event-dsl/node_modules/tsx/dist/loader.mjs .scratch/mv-native-support-audit/probes/commands/composition-probe.ts 2> .scratch/mv-native-support-audit/probes/commands/composition-stderr.txt
```

首次执行输出，2026-10-20 14:54:54–14:54:55（Asia/Shanghai）：

```json
{
  "platform": "win32",
  "node": "v22.23.0",
  "eventCount": 25,
  "recordCount": 505,
  "deepEqual": true,
  "outputSha256": "b8cee63de610a400d8faf01677a3e5d49dccccef171c51c6213a7f8ec9913191",
  "changedEventIds": [],
  "success": true
}
```

期望值由 probe 中的 native literal 与简单数组拼接独立构造；`createMinimalProject` 只提供合成工程载体和包导入链接，事件命令没有从既有测试 fixture 或产品编译结果复制。脚本使用 `isDeepStrictEqual`，区别 `0` 与 `-0`、缺字段与显式字段，超出普通 `JSON.stringify` 对比能保证的范围。没有执行 `push`、没有写入 references 下工程。

首次 probe 的实际合成 Workspace 原在仓库 scratch，后移动到：

`C:/Users/Shuen/.codex/tmp/mv-native-support-audit-20261020/commands-workspace-22-23-0-1792479294168/`

原运行结果保留原路径，不能把移动后的路径当原始运行路径；脚本现已将后续新 Workspace 的创建位置设在 Git 外。原运行仅以上述第一次执行为准。移动时 Windows PowerShell `Move-Item` 跨盘遍历了测试载体中指向产品 `src` 的 junction，意外移动产品源码；这是调查操作失误，不是产品缺陷。父审计收到即时报告，先逐个验证 Git 外保留的 144 个源码与最终交付 manifest 完全相同、原位置为空，再逐个复制回原位置并重验：144/144 一致，Git 状态无产品变更。恢复收据：[source-restoration.json](../evidence/source-restoration.json)。本分项停止全部移动/清理操作，保留目的目录，没有重跑全量测试。

## 被排除的可疑项

1. **Actor 数量 operand 用模板插值可能丢 -0。** 当前 `commands/variables/decompile.ts:102` 的确有普通 `${operand}`，但 `commands/actor/native-validation.ts:40–48` 的整数检查拒绝负零，且相关 operand 的下界为1。因此本轮未建立输入在当前支持域内的前提，不把它列作产品漏洞。已经通过的 `-0` 保真来自 Conditional 常量/Timer/Gold/Enemy index 与 route 数值等允许该值的槽。
2. **反序 Random 范围。** 两个 SpinBox 可以分别输入大小关系相反的值，但完整首方保存函数显式以 min/max 排序，不能只读控件就认定产品错误拒绝正常保存结果。
3. **角色图像索引 >7。** Face 使用固定帧尺寸，而角色以图片整体维度按固定角色布局分块；目前没有确认普通路径能够生成 >7。没有从两者共享 image picker 直接推定它们域相同。

## 关键来源身份

下表资源的 byte offset 与哈希可在父审计本轮 `editor/inventory.json` 复核；完整首方源码只留在 Git 外。

| 角色 / offset | 解码 SHA-256 |
| --- | --- |
| Conditional 748645 | `e94ba6162d753827591839fd6d1aa7d793d40270a6ddbfa5ddbb093476872dcb` |
| Choices 706715 | `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283` |
| Battle 782932 | `a492dfc999be4fb3e3ca213300cd9a751649adc8da49edd18efd4ce48544787a` |
| Troop selector 672127 | `136ed5941165595e3700dfc4e7e6f40951524c9fac9ba469ec87d6db0e9b0c7a` |
| Actor conditions 658002 | `0d3f443139f6b271ca58cb38488ba06cbe25a12caf9afceed9f36d118034bb30` |
| Enemy conditions 650223 | `17a808d4d34e5662480ae2932f36c89cc1b510b80aecff834b449b0daf68fde7` |
| Operand control 683885 | `bfcb7f528bca2e310e6bfa5216c694d66599e9892ac7d55168f6687f312d09f8` |
| Event image 626433 | `9e05d77cba069b12cef44536bf917a1eed9829c72871f472cfbcd82f7422070e` |
| Face wrapper 625536 | `28e5ac99d832a6764a3073a4eca8c69e689e57e9fd3c46cff23050c7bc1caa00` |
| Image picker frame 638194 | `1d00d66ec8159738c77a866c7218d6219eb9d7cb1ecdcce7619abf7214670d9a` |

本轮所读关键产品文件身份（源码恢复时须保持一致）：

| `packages/rpgmaker-event-dsl/src/` 下文件 | SHA-256 |
| --- | --- |
| `commands/flow/decompile.ts` | `7e60a9d19e3d99a0c83b28fcd71beaabaa296470678d0f70f5856104d1e2ce8d` |
| `commands/flow/conditional-validation.ts` | `82162073c7cf09170389e5beb230389fe5bf1e9d53ca5d15c0a34a377dd36af3` |
| `commands/battle/decompile.ts` | `ae7e52ebc6337ed71a3ff4dde8db54db657a41fd24e7cc94c111834d3afe47e7` |
| `commands/movement/decompile.ts` | `80d4871e39c77b44128e05d50661a75f90e2b32aa5e9ed32fdfd3167ed9dbcd8` |
| `commands/variables/native-control-variables.ts` | `853ae5bdd03063ec5197183c2240ec242dd79e55a5f6dde21b477df4f0fca507` |
| `commands/actor/native-validation.ts` | `0d126996f0eb421473d60c343c3c3a12d1fc5b4ced81555f8acc1ec5c1e378c0` |
| `validation/command-structure.ts` | `835d3326049edb777378d1a600c02dd2419f6c3dd61ed6e1eae5f759f0c1266e` |
| `workspace-api.ts` | `735839d077b0137449ff29baf7bdd094a34973b5a8b757502948b7e744f911d2` |

## 留待后续的边界

- 本轮只对 Common Events 组合执行，不能据此替代 Map Event / Troop Event 容器与 Workspace 全域接管的验证。
- route saved envelopes 和非空无尾0是产品已接受能力；本轮产品保真成功不证明每一种组合都由普通编辑器新建过。
- `references/rmmv-local-runtime-1.6.1` 和上游 corescript 可解释执行语义；本分项的实际 probe 不执行游戏，故没有把 runtime 源码阅读升级成游戏通过。
- 有限样本通过不能排除还存在未检查的参数模式/保存路径；对于“完全支持所有 MV 事件”的最终结论，应以可确认反例优先，而非用本报告的成功计数抵消其他分项的失败。
