# Ticket12 — captured map and battle reference context

本票交付真实 Snapshot 到 Workspace 验证的上下文装配，以及已有212/282/336固定引用在正式命令、已知 raw 和 Decompile 发布前的最小一致检查。没有新增命令族或公开测试 API，没有改变已接受参数域、页条件例外或 carrier 所有权。

## Independent input and observed behavior

输入是独立编写的 [map-battle-context-project.json](../../../../packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/map-battle-context-project.json)，SHA256 `bf4ca095b5d86c9824ce36c0c30113871d56a22032a4a1c4d3eb33af75a80864`。该输入明确属于 `synthetic-support`，不是原生编辑器捕获或游戏观察。

夹具中的 Animation3、Tileset2、Enemy1、Actor1、Troop4 和 Map1 都有真实 ID 和空名称。Map1 为5×4，使用 Tileset2；九个 tilesetNames 槽保留空字符串和位置。Troop4 的成员依次为 hidden Enemy1、缺失的 Enemy99、普通 Enemy1，每个成员原始 x/y/hidden 与未知有效 JSON 字段全部保留。System.equipTypes 有七项，含0号占位和一个空名槽；没有写死五槽。

测试实际调用公开 Clone/Pull 采集标准文件，经 Decompile 生成源码，再由正常 Discovery、TypeScript 检查与求值进入 Check/Compile。正式命令和独立手写的212/282/336 raw 版本均与完整原始 CommonEvents 严格相等；Map/System 和外部 carrier 字段也逐一严格比较。Push 后 Project Root 与 Snapshot 仍与独立输入相等，Diff 为 `No changes.`。

装配修复包括此前遗漏的 Animations/Tilesets，以及此前会因名称为空被 `parseMapInfos` 丢弃的地图。数据实际存在性与名称索引分开，空名条目可由显式 ID 使用。固定目标0和99分别被正式命令与已知 raw 拒绝，不能当成 None 或 Runtime Selector。

## Context adapter and ownership boundary

`loadSnapshotValidationInput` 仍是 Workspace 内部适配入口，未加入 `workspace-api.ts`。除引用索引和既有地图尺寸/事件位置外，它保留地图 `tilesetId`、Tileset `tilesetNames`、完整 troop `members` 和 System `equipTypes`，交给 Staged Data Graph。troop 成员数组没有按 hidden、Enemy 是否存在或其他运行时条件过滤；缺失 Enemy99 仍占原始位置1，Enemy1 的存在性由独立 reference scope 提供。

外部配置在适配边界保持 `unknown`，保留字段有无与完整原始值；实际拥有该配置的消费者再检查其所需形状。这避免为本票尚未使用的外部数据施加所有权内部校验。没有凭初始 Actor/Class 把动态装备候选77冻结成 Weapon/Armor 引用，也没有凭 Common Event 定义位置推定其所有未来调用上下文。测试还在 Clone 后修改实时 Project Root 的 Troops，证明适配入口继续读取捕获的 Snapshot。

地图放置通过真实 Workspace 发现和求值的 `mapEvent` 源码验证：x5 在5格宽地图外，产生已有 placement error；x3/y1 有效，利用实际捕获的 event2 位置产生 occupied-coordinate warning。Check 不发布 Generated Project Data，Project Root 不变。该测试中的既有 occupant 仅用于位置上下文，未作为完整原生 Map Event 页验收。

## Cases and execution evidence

| ID | 本票实际验证 |
| --- | --- |
| MV-S3-CONTEXT-001 | 实际 Workspace 完整往返、正式和已知 raw 固定引用、空名地图与外部ID、carrier 未知 JSON、Push 和 clean Diff |
| MV-S3-CONTEXT-002 | 从实际 Clone 读取内部适配入口，严格比较完整 ordered/hidden/missing-Enemy 成员、装备槽、tileset配置与 graph 传递；区分 Snapshot 与实时项目 |
| MV-S3-CONTEXT-003 | 实际源码求值；固定引用0/99的正式/raw拒绝；合法 Common runtime selectors 保持可表达；Check/Compile 失败不发布或修改源码/manifest |
| MV-S3-CONTEXT-004 | 独立212/282/336缺目标原生记录在 Decompile 发布前拒绝，包含稳定 ID、阶段、Common Event 身份、list 和 parameter 路径；源码/项目/Snapshot/manifest不变 |
| MV-S3-CONTEXT-005 | 实际地图尺寸和事件位置贯通 Workspace 错误/条件警告，且Check无发布 |

`requirements.json` 的五个稳定 ID 对应 `snapshot-context.test.ts` 的实际测试。机器生成结果保存在 `results/` 中，含独立输入哈希、完整受测源码指纹、基线 revision、Windows/Node/工具版本、时间、阶段、预期、实际与差异。普通 `mv-evidence.test.ts` 校验索引、来源、夹具哈希和结果 schema。

## Red before green

首轮实际 Workspace 测试在 `2026-10-19T08:15:06Z` 明确失败：Animation3 与 Tileset2 被误报缺失。补齐装配后，严格完整输出又发现空名 Map1 被丢弃；修复地图 ID 保留后通过。raw 负例在 `08:18:58Z` 发现无效 fixed reference 的 Check 居然成功，Decompile 负例在 `08:20:21Z` 发现缺目标源码会被发布；增加限定的固定引用验证后分别通过。最初失败的实际临时 Workspace 保留在 OS temp 下的 `rpgmaker-event-dsl-windows/snapshot-context-*` 与 `snapshot-context-decompile-212-*`，没有改标成通过。

另一个独立输入暴露既有 BattleProcessing 差异：`canEscape=false, canLose=false` 的301记录经现有编译器多出604，违反 `actors-battle.md` E301 的“301，无604”。这是既有46号家族责任，12没有修改预期或实现该家族；将301移出本票精确往返输入，只以实际 Workspace Check 验证空名 Troop4 的固定引用。该失败原样保留在临时 `snapshot-context-DJDA9h`，交接也记录到仓库外 `mv-implementation-code-map.md`。

## Validation and remaining responsibilities

Windows / Node `22.23.0`，pnpm `10.33.0`。本票适用验证包括 `pnpm check`（typecheck、lint、format、17 files /127 tests）、`pnpm build`（Node22目标）和构建后 `test:windows-baseline`（2 files /4 tests，真实 CLI 与 junction）。最终报告以实际执行记录为准。

本票没有分配必须执行的原生 E/R 小场景，所有新增验收均明确记录 `native: not-executed`。按照用户已确认的验收修订，编辑器行为由指定逆向票验证，最终游戏运行仍必须由后续票执行；本票不以静态分析或合成输入替代那些验收。

23/24/25及48负责完整容器上下文，尤其是实际 Troop 页条件、成员位置 selector 与坏 Enemy 引用诊断；35/36/45负责相关命令族全部参数/枚举/运行后果，42负责最终 `slotIndex` 与装备槽规则，46负责完整 BattleProcessing 保存结构。12保留和传递这些消费者所需的真实上下文，不将基础装配签收计成这些后续行为已经完成。
