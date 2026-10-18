# MV 编辑器分支、移动路线与禁用字段的静态保存证据

研究日期：2026-10-18。对应决策票：[编辑器如何保存分支与移动路线及不启用的字段](../issues/09-editor-serialization-evidence.md)。

## 结论与回答边界

用户指定的 `references/RPGMV/RPGMV.exe` 自报编辑器版本为 **1.6.1**。这项结论来自该可执行文件自己的 PE 版本资源，而非随包游戏 runtime 的版本常量。

该文件还包含完整的 QML / JavaScript 文本资源。对其中事件编辑与保存代码的静态阅读，回答了本票的核心结构问题：

| 问题 | 静态代码观察 | 对无损契约的意义 |
|---|---|---|
| 402 的文本槽 | Show Choices 的保存处理写入 `[choiceIndex, choiceText]`；命令显示函数直接读取第二槽 | 第二槽具有编辑器显示用途，不能以 runtime 只读索引为由删除 |
| 505 续行 | Set Movement Route 的保存处理从 205 内的 route list 为每个非终止子指令生成一个 505；显示函数读取 505 的子指令对象 | 505 是编辑器可见的路线内容镜像，正式编译必须生成一致镜像，往返不能无声丢弃 |
| 禁用 Page Condition Slots | 条件开关和条件值分别绑定字段；取消勾选只禁用值控件，未见清空对应值的处理 | 已存的禁用槽值仍是可保留的编辑状态，不能全部重置成 Compiler Defaults |
| Common Event Trigger 为 none 时的 switchId | trigger 和 switchId 分别绑定；none 只使开关选择控件不可用 | trigger=0 不足以支持把现有 switchId 归零或强制改成 1 |
| 非 custom 自主移动页的 moveRoute | moveType 控件只写 moveType；路线按钮只在 custom 时启用 | 隐藏的自定义路线可以继续存在；moveType!=3 不构成删除 moveRoute 的依据 |
| 图像残留字段 | 载入图像时读取全部字段；确认图像选择时重建 image，按所选图像类型设置规范字段 | 单纯载入/保存与重新选择图像是不同操作，不能把选择图像时的归一化推广到所有往返 |
| 分支中的 code 0 | 空选择分支由保存处理补入更深一层 indent 的 code 0 | code 0 有原生编辑器生成的结构用途，不能在所有位置一律剔除 |

这些是**静态源文本观察及其局部推断**，不是实际编辑器打开/保存结果。本轮没有执行 RPGMV.exe、游戏、提取出的 QML 或 JavaScript；没有进行 UI 实验，也没有改动参考软件或项目。原生最终写文件辅助函数的内部实现、QML 运行时信号顺序、全部异常输入及完整指令族仍不在此次验证范围。真实端到端验收仍须执行后文的样本任务。

## 目标身份与版本

- 唯一目标：`F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe`。
- 文件大小：19,595,264 bytes。
- SHA-256：`1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。
- REA `inspect_pe_resources` Evidence：`ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`。
- REA provider：`rea-pe-resources`，version `1`；operation 为 `inspect_pe_resources`，authority 为 `shipped-artifact`，confidence 为 `observed`。
- REA 判为 PE32，machine=332（x86）；资源目录覆盖 complete，检查 28 个目录项，返回 12 个资源。
- 其中 RT_VERSION：type=16、name=1、language=1033，原文件偏移 19,562,144，长度 540；payload SHA-256=`114811b8d1898d08021e8997cdfac45190149bf96fbe45acb28ea86cf9bca426`。

REA 的该工具把 RT_VERSION 当作 opaque payload，不解码其版本内容。随后用普通 Node Buffer 只读解析上述**同一字节范围**的 VS_VERSION_INFO（这是普通本地解析证据，不是 REA 的解码结论）：

- 根 signature：`0xfeef04bd`，structureVersion：`0x00010000`。
- 固定 FileVersionMS=`0x00010006`，FileVersionLS=`0x00010000`，合成为 `1.6.1.0`。
- StringFileInfo / `040904B0`：ProductName=`RPG Maker MV`，FileDescription=`RPG Maker MV`，ProductVersion=`1.6.1`。
- 固定 ProductVersion 数字字段为 `0.0.0.0`，因此明确区分它与字符串 ProductVersion。

Windows `FileVersionInfo.FileVersion` / `ProductVersion` 在本机返回空字符串，不能据此声称文件没有版本资源。此处以原文件资源字节中的固定文件版本与字符串产品版本为证据。版本资源属于本体自报信息，不认证发行渠道、数字签名或这份文件与官方安装包逐字节一致。

## 工具状态与取证方式

本会话工具清单没有 REA MCP 工具；PATH 中也没有 `rea`。首次按 skill 执行 `npx -y rea-agents@6.7.0 doctor --client codex --json`，npm 在其 `_npx` 缓存根目录缺少 package.json 处报 ENOENT，尚未进入 REA。

一次有界的只读恢复发现，该缓存内已经存在 rea-agents 6.7.0 及公开 `.bin/rea.cmd` launcher。改用该公开 launcher 后，doctor 成功执行：

- Node 24.14.0 满足 REA 的基础运行要求。
- Codex registration=`aligned`；该状态只证明配置匹配，不证明当前 agent 已连接。doctor 的 live_server state 为 `unknown`，当前会话仍没有 REA 工具。
- Ghidra 未配置、IDA registration 未配置、Kuna 未配置；Hopper 未发现。故本轮没有原生函数反编译 provider。
- 没有运行 setup，没有改客户端配置，没有安装原生分析引擎，也没有重复诊断未变化的阻碍。

REA 的 PE 资源工具无需原生引擎，成功返回了上述版本资源 Evidence。除此以外，QML 取证使用普通只读 Node `fs` / `zlib` / `crypto`：可执行文件的 `.rdata` 内有长度前缀文本记录和带 qCompress 风格前缀的 zlib 记录，后者可直接还原为完整 QML / JavaScript 源文本，无需恢复机器码。

下表中的资源身份均以**原文件字节偏移、记录长度、解码后长度和 SHA-256**定位。角色名来自完整源文本的注释、根组件和实际读写函数；没有把字符串搜索结果当作行为证据。未重建 Qt resource name/tree 表，所以这里的角色名不是已验证的 `qrc:/...` 路径。

所有偏移从文件头按 0 起算；stored bytes 包含长度前缀。plain 为 4-byte 大端记录长度后接 UTF-8 文本；zlib 为 4-byte 大端记录长度、4-byte 大端解码长度和 zlib 内容。对下列压缩记录已验证：解压输出长度等于声明长度，解压器消费的输入长度恰好等于记录长度减去内层 4-byte 解码长度。

| 本报告引用 | 静态文本角色 | offset | stored bytes | 编码 | decoded bytes | decoded SHA-256 |
|---|---|---:|---:|---|---:|---|
| Q-TEMPLATE | JsonTemplates.js（自带注释） | 346222 | 2617 | zlib | 11436 | `52fd4ca2a3f178712d94467c5770919cf716882e2ebc9a57bde0a963e9447165` |
| Q-SWITCH | GameSwitchBox 形态的开关选择控件 | 596373 | 2004 | plain | 2000 | `5aaba3b55a3d310b69dd2cb833cf8a864b6785eff31f868a927134c814d7f9a8` |
| Q-IMAGE | EventImageBox 形态的事件图像控件 | 626433 | 1675 | zlib | 6491 | `9e05d77cba069b12cef44536bf917a1eed9829c72871f472cfbcd82f7422070e` |
| Q-CONDITIONS | 地图事件条件布局 | 656030 | 886 | zlib | 5163 | `2e679cbed93309a6e1b51db11a7128af1b5294c8be3fb2a35b70ac9946627818` |
| Q-BASE | EventCommandBase 形态的指令基类 | 686141 | 939 | plain | 935 | `740d0c01de598e2a55b58f67f975a30e2d3c8c96de36eb8ff15c3dd4d6ad2780` |
| Q-TEXT | 事件指令参数的显示文本函数 | 696269 | 5243 | zlib | 36610 | `da7306813f20eecebc47219dcb07ec947b045f3f675aad47d14be214c3394a0f` |
| Q-PAGE | 地图事件页布局 | 701512 | 1784 | zlib | 7813 | `d3f53b2536e23bb60f8b080f1692cec652262688cd20dd5184de5773dc9c3b15` |
| Q-CHOICES | 注释为 Show Choices 的 EventCommandBase 组件 | 706715 | 1413 | zlib | 6097 | `d407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283` |
| Q-ROUTE | 注释为 Set Movement Route 的 EventCommandBase 组件 | 771946 | 1393 | plain | 1389 | `95cf5319c62eeacfbea61afa69a05be5d5788e5b795f34f776a791adcab44615` |
| Q-DATA | DataManager 形态的存取和 JSON 序列化函数 | 909009 | 4291 | zlib | 24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| Q-COMMON | 公共事件编辑布局 | 967367 | 2086 | plain | 2082 | `80b034dedb0ab5f3465d6b9bc9bda652e47aa7d756985ee84697d0e96f70942c` |
| Q-CHECK | ObjCheckBox 形态的字段绑定控件 | 8721360 | 585 | plain | 581 | `9841b9b3f78ab3825c0ee3d95348c408a2c5154fa2af54ea486d847710ca13cf` |
| Q-COMBO | ObjComboBox 形态的字段绑定控件 | 8728865 | 1118 | plain | 1114 | `a2d5d7acd82fb294b91c6869fbeb1c009515644636dfea3913155211879413de` |

以上 Q-* 为本报告的本地引用名，不是伪造的 REA Evidence ID。源码只在内存中解码阅读，没有把原生源码或资产副本保存、提交或发布。

## 402、403、505 与 code 0 的具体约束

**402。** Q-CHOICES 第 15–17 行声明 402/403/404；onLoad 从首指令的 parameters[0] 载入 choices；onSave 第 107–137 行重建事件片段，先输出主指令，然后为每个 choice 写入同一 topIndent 的 402，parameters 为索引和对应选择文本，再拼接该选择的分支内容。Q-TEXT 第 262–274 行的 `commandParamText402` 从 parameters[1] 拼接命令列表中显示的 “When …” 文本。因此，402 的文本不是凭 runtime 无用便可删掉的冗余。

**403 的附带观察。** 同一 onSave 在 cancelType=-2 时使用 maxChoices（该组件为 6）作为取消分支索引，并以索引和 choices 对应槽构建 403。此槽可能为 undefined；后续 JSON.stringify 对数组的标准处理会写成 null。这里记录的是源代码路径及 JavaScript 序列化推断，没有实际保存样本证明磁盘最终值。契约讨论应把取消分支参数也纳入样本检查，不能只校验 402。

**空分支与 code 0。** Q-CHOICES 第 140–169 行的 makeBlockArray 依据同级 402/403 找到分支；更深 indent 的现有命令被保留在对应 block。对没有任何命令的 block，明确补入 topIndent+1 的 makeNullCommand。Q-BASE 第 27–33 行说明它产生 code=0、指定 indent、parameters=[] 的 Raw Event Command。onSave 的顺序是主指令 → 各 402 与 block → 可选 403 与 block → 404。此函数不普遍删除非空 block 内的 code 0；也不普遍为每个非空 block 另添一个 code 0。这个观察只针对 Show Choices，不扩大为所有分支或全部编辑器操作的终止规则。

**505。** Q-ROUTE 第 22–30 行的 onLoad 仅读首 205 的目标与 route list / repeat / skippable / wait；第 33–46 行的 onSave 先输出包含完整 route list 的 205，然后遍历 list 的前 length-1 项，每项生成一个 505，parameters[0] 是该移动子指令。它不为最后的路线终止项生成 505。Q-TEXT 第 680–682 行的 commandParamText505 把 parameters[0] 传给移动指令显示函数。因此：205 是该编辑对话框的载入来源，505 有命令列表显示用途，保存处理由同一 list 重建镜像。若输入中两处已矛盾，究竟拒绝、保留还是修复，属于后续无损契约决策；此次证据不能把静默修复等同于无损。

Q-BASE 的 makeCommand 直接构造 code / indent / parameters，没有参数裁剪。Q-DATA 第 341–425 行最终通过 stringifyEx → stringifyDatabase / stringifyMap → JSON.stringify 保存对象，没有在该序列化路径中根据 runtime 是否消费某字段做过滤。这不证明所有载入或编辑信号路径都不改动对象。

## 禁用槽与编辑操作的归一化

**地图事件条件。** Q-CONDITIONS 第 21–147 行逐项把 Valid 标志与对应值绑定为不同字段。勾选状态只用于值控件或其父容器的 enabled：两个 switch、variable 的 ID 和阈值、self switch 字母、item、actor 均如此。Q-CHECK 第 15–23 行只把该控件绑定的 checked 写回其 member；它不联动清空别的条件槽。Q-SWITCH 第 28–58 行在用户确认开关选择时写回 ID，载入则读取已有 ID，未定义 onEnabledChanged 清零规则。故可以静态支持“取消条件勾选不应被 DSL 当成销毁原值”的契约；全部控件初始化时序和越界数据如何修复仍须运行样本验证。

**公共事件。** Q-COMMON 第 31–43 行分别绑定 trigger 与 switchId，switch 控件 enabled 由 triggerIndex>0 决定。Q-COMBO 第 20–32 行写回的只是自身 member。Q-TEMPLATE 的 CommonEvent 模板也同时有 trigger=0 与 switchId=1。这些观察支持 none 的公共事件仍有开关槽，不支持把其任意已有值强制改成默认值。

**非自定义自主移动。** Q-PAGE 第 47–66 行把 moveType 与路线按钮启用状态关联，未写入删除路线操作。第 167–180 行显示路线对话框打开时读取已有 moveRoute，确认时只写入 list / repeat / skippable，并把 wait 设为 false。两种情形必须分开：切到 fixed/random/approach 只使路线编辑不可用；实际确认自主移动路线会使 wait=false。Q-TEMPLATE 的页模板还保留 moveType=0 下的完整 moveRoute，说明该对象并不只在 custom 页上存在。

**事件图像。** Q-IMAGE 第 157–165 行载入 tileId、characterName、characterIndex、direction、pattern，没有因为 tileId>0 或 characterName 为空就清空其他槽。其第 93–127 行的图像选择确认处理却创建新 image：选 tile 时设 tileId，characterName 为空、characterIndex=0、direction=2、pattern=0；选 character 时设 tileId=0，并从选择计算方向、pattern 和 characterIndex，大图 characterIndex=0。图像切换类型会触发 Q-PAGE 第 35–36 行的优先级调整（有 characterName 时为 1，否则为 0）。因此，“打开事件后直接保存”和“重新确认图像选择”会经过不同处理路径；无损往返不应以此为借口无条件清空图像字段或改优先级。

## 可重复核对，不执行目标代码

对上述 QML 引用，可用已有 Node 运行以下**原创读取逻辑**。将 offset、stored、compressed、expectedSha 换成表中的某一行即可。它只读取目标、解码被选字节、校验身份并输出文本；不会 eval、载入 QML、调用提取代码或写参考文件。建议仅在本地阅读输出，不把完整软件源码作为研究分支附件。

```js
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const image = fs.readFileSync('F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/RPGMV.exe');
const offset = 706715, stored = 1413, compressed = true;
const expectedSha = 'd407a069ed266771e29c68cfabec47d96349da0fe74fbcaac55b1bf32cf33283';
if (image.readUInt32BE(offset) !== stored - 4) throw new Error('record length');
let text;
if (compressed) {
  const result = zlib.inflateSync(image.subarray(offset + 8, offset + stored), { info: true });
  if (result.engine.bytesWritten !== stored - 8) throw new Error('zlib boundary');
  if (result.buffer.length !== image.readUInt32BE(offset + 4)) throw new Error('decoded length');
  text = result.buffer;
} else {
  text = image.subarray(offset + 4, offset + stored);
}
if (crypto.createHash('sha256').update(text).digest('hex') !== expectedSha) throw new Error('digest');
process.stdout.write(text.toString('utf8'));
```

重新取 PE 资源 Evidence 可使用现有公开 REA CLI：`rea inspect-pe-resources <上述绝对 exe 路径> --json`。它返回的 RT_VERSION 仍须按 VS_VERSION_INFO 结构解码，不能把 PE 资源 inventory 说成版本字符串的解码结果。

## 后续最小原生保存样本任务

一次独立的临时 MV 项目即可覆盖本票全部正常保存问题。由能操作真实编辑器的人执行；本轮未执行这些步骤。

1. 用这份编辑器创建临时项目，记录 executable SHA-256、About 中版本与 `.rpgproject` 标识。仅在临时项目中操作，不修改用户现有游戏。
2. 创建一个 Map Event：加入至少两个 choice，选择文本不同且含中文；一个分支留空，一个放一条 Show Text，启用独立取消分支。再加入 Set Movement Route，至少含两个可区分子指令和终止项，并改变 repeat / skip / wait。保存，收集 `data/Map001.json` 作为 `created`。这一份即可核对 402 文本、403 参数、505 镜像与空分支 code 0。
3. 在同一页先启用并设置各 Page Condition Slots 的非默认值，保存为 `enabled`；再取消全部条件勾选，保存为 `disabled`。用 IDs 在现有数据库范围内、变量阈值非默认、self switch 选 B/C/D，避免把越界修复混入实验。
4. 同一页先设 custom 自主移动和可识别的路线，确认并保存；再改 fixed，保存。必要时再改 random/approach，各保存一次；重新切回 custom 检查路线仍可见。所有快照只需同一个 Map JSON。
5. 为同一 Map Event 的不同页分别选择 character、tile、无图像，保存；重新打开事件后不重新确认图像选择，直接确认事件并保存为 `reopened`。随后单独重新确认一次图像选择，保存为 `image-confirmed`，用以区分无操作保存与图像选择归一化。记录 priorityType 是否随类型转换改变。
6. 创建一个 Common Event，先选 autorun/parallel 并设非默认 switchId，保存；改成 none 再保存；重开数据库确认。只需相应阶段的 `data/CommonEvents.json`。
7. 完全关闭临时项目，再重开、确认代表性事件内容与路线显示，另存末次 Map / CommonEvents JSON。比较 parse 后对象，分别记录字段保留、镜像一致性与编辑操作触发的变化；保留必要截图和操作日志。不要只运行 runtime。

正常流程无需复制整个项目资产，也无需向仓库提交编辑器或完整游戏。证据包最小内容为阶段化的 `Map001.json`、`CommonEvents.json`、必要时解释 ID 范围的 `System.json` 摘要、版本身份与操作记录。固定/随机/接近移动的残留路线、禁用条件和公共事件 switchId 可以共用上述一次实验；图像归一化须单独记阶段，避免混淆操作原因。

如果还要决定对**不一致或非标准**数据的处理，另开一次明确标注为合成异常输入的实验：在关闭临时项目后分别制造 102 choices 与 402 文本不一致、205 route 与 505 镜像不一致，比较只打开事件与实际重新编辑该指令后的保存结果。此实验不能证明这些输入是原生合法形态，也不应替代正常原生保存样本。

## 问题覆盖与剩余未知

| 本票问题 | 本轮状态 | 证据类型 / 剩余限制 |
|---|---|---|
| 编辑器本体版本 | 已答 | PE 自报 1.6.1；不认证发布来源 |
| 402 文本槽的用途及生成 | 已答 | 完整嵌入 QML 的保存与显示代码；未运行 |
| 505 的用途、载入来源及生成镜像 | 已答 | 完整嵌入 QML 的载入、保存与显示代码；未运行 |
| 条件禁用、公共事件 none、非 custom moveRoute 的本地处理规则 | 静态规则已答 | 字段绑定与最终序列化路径支持保留；真实信号时序与所有越界输入尚未知 |
| 图像槽的载入与选择确认归一化 | 静态规则已答 | 完整图像控件及页布局代码；未运行 |
| 真实编辑器端到端保存行为 | 未执行 | 应作为“如何证明 MV 事件支持完整并划定实施顺序”的验收工作完成 |

本报告足以撤销“runtime 忽略所以编辑器也不需要”的假设，并给后续无损契约提供具体生成规则。它不替设计票决定语义等价关系、未知数据策略、正式 DSL 字段命名或是否允许归一化；也不宣称产品已经完整支持 MV 事件。
