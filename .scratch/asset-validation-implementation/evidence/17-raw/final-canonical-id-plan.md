# 全量 canonical ID 独立计划与差异报告

权威快照：`c5f7ead75ba78680b92ad81924ba8cb884d2b751`。本程序逐项独立转录当前验收矩阵／子用例索引与责任票，不导入产品／测试、不运行产品命令、不读取执行回执。所有实际状态均为 **未在本计划中审计**，票17的领取状态和已执行命令由独立验收工件记录。JSON 是逐项机器可读目录，本文件也逐项列出1209个计划身份；这不是产品完成或验收通过声明。

**身份拼写限制：** 1209项语义义务完整，其中1084项的ID由权威token及固定默认值直接确定。F07另125项由权威明确到具体字符／设备名，但未规定后缀分隔及大小写；本计划使用 `case-uXXXX` 小写十六进制和 `case-<大写设备名原文>`，仅为计划编码。票17将既有canonical spelling与JSON中独立semanticKey逐项一对一映射。纯拼写差异不能当行为缺口，也不能注册别名或跳过逐字符核验。F07五个独立路径形式分支不存在此后缀歧义。

source／built 是回执轴，不增加ID。N组媒体、B–E图块、多timing样本和共享票场景都不能扩大或替代canonical身份。D02–D10的native仅是表示token，D10仍须实际CLI。

## 数量与责任

| 组 | 族数 | 独立ID／语义义务 |
| --- | ---: | ---: |
| A | 18 | 86 |
| B | 16 | 244 |
| C | 13 | 449 |
| F | 14 | 201 |
| D | 10 | 99 |
| W | 20 | 116 |
| N | 6 | 14 |
| 合计 | 97 | 1209 |

自动化1195，原生14。A86；B244；C449（C06=90，C07=304）；F201（F07=130）；D99；W116。直接None映射23，间接到达字段63。C07四类字段／文件变体各63，再加52个适用固定目标；System直接字段9和B14宿主字段2不生成target-missing。

| 责任票 | 主责身份数 | 协作身份数 |
| --- | ---: | ---: |
| 01 | 7 | 0 |
| 02 | 32 | 0 |
| 03 | 169 | 0 |
| 04 | 61 | 0 |
| 05 | 80 | 0 |
| 06 | 175 | 0 |
| 07 | 157 | 0 |
| 08 | 89 | 0 |
| 09 | 96 | 0 |
| 10 | 16 | 3 |
| 11 | 113 | 4 |
| 12 | 102 | 3 |
| 13 | 67 | 0 |
| 14 | 30 | 1 |
| 15 | 12 | 1 |
| 16 | 12 | 0 |

多票共享身份只计一次；主责票数相加不等于1209。协作项是同一callback的责任引用，不能另注册同ID测试。C11 recognized-raw的12结构不可绕过义务可由D02结构分支证明，不无条件要求重复场景。

## 独立旧计划对账

| 旧计划 | 旧目录项 | 在当前计划中逐ID命中 | 不在当前计划中的旧ID |
| --- | ---: | ---: | ---: |
| planned-acceptance-ids-06-11.json | 647 | 647 | 0 |
| planned-acceptance-ids-12-16.json | 215 | 215 | 0 |

06–11的644主责身份与3个D09协作引用构成647项旧目录，均逐ID命中；12–16的215项也全部命中。在各旧计划所覆盖目录内，06–16逐票的主责／协作身份集合也一致，JSON列出22个责任集合对账。W16两个ID保留12的历史格式／hash兼容支持引用，恢复执行仍全归16；未把该支持写成12执行W16。两个B14旧未决候选原本未计入644／647，现明确N/A；该处不减少当前义务数量。A/F维度旧计划的86／201、全族计数旧计划的1209也与独立展开一致。此对账只比较计划，不比较测试或回执。

## 差异与17独立核验

- **identity-spelling-gap**（F07 125 suffix-expanded cases (9 forbidden,32 controls,84 devices); five standalone path-form IDs have exact authority tokens）：Authority requires a concrete Unicode/device suffix but does not prescribe separator, Unicode marker, or case. This plan serializes case-uXXXX (lower hex) and case-<uppercase literal device> only as its own notation. 17 must build an injective/surjective mapping from each existing canonical spelling to the independent semanticKey, preserving every literal codepoint/device and all three device branches. Pure spelling differences are not behavior gaps. Do not create aliases, edit authority, or rename existing registrations now.
- **historical-pending-to-N/A**（Prior06–11 unresolvedCases (2 B14 host-target IDs)）：Prior plan already excluded them from its 644 primary and647 catalog rows. Current disposition is N/A, leaving counts unchanged. Keep the provisional candidates in the notApplicable table; do not demand or invent missing-asset passes.
- **ownership-summary-aligned**（.scratch/asset-validation-implementation/ticket-breakdown-draft.md:244）：| C03 | 04, 05, 13 | 04 图像镜像／独立指令；05 SE 同分支；13 两种字段 repeated-command，新命令各自重建逻辑使用，不累计次数 | Preserve C03 repeated-command; do not restore withdrawn checkpoint IDs or add a postwrite asset gate.
- **ownership-summary-aligned**（.scratch/asset-validation-implementation/ticket-breakdown-draft.md:289）：| W11 | 13, 14, 15 | 13 在 Check／Compile 单次素材门槛判断七种当前变化，门槛后的素材变化不失效；14 覆盖 Push 写前单次门槛；15 覆盖写后素材变化仍正常记账，无额外素材门槛 | Preserve W11 prewrite gate and postwrite no-scan proof; do not restore withdrawn checkpoint IDs or add a postwrite asset gate.
- **ownership-summary-aligned**（.scratch/asset-validation-implementation/ticket-breakdown-draft.md:290）：| W12 | 13 | same-pass-reuse／next-command-fresh；14 复核 Push 新命令，引用 13 的唯一注册，不增加 canonical ID；不保留已撤销的 next-point-fresh 要求 | Preserve W12 same-pass reuse / next-command fresh; do not restore withdrawn checkpoint IDs or add a postwrite asset gate.
- **prior-source-pointer-drift**（Prior independent06–11 and12–16 plans）：Their stored source hashes and line numbers retain older documentation snapshots; each source attached to this plan is read at its explicit authorityRevision. Use this plan’s SHA256 and line pointers for the requested execution freeze; audit execution separately.

## 已退役／历史身份

| 历史ID | 当前处置／替代 |
| --- | --- |
| `AV.F06.image-percent.filesystem.case.expected` | retired-history-only; → `AV.F06.image-percent.input.case.expected`；Keep the six source/built not-executed-policy-pending historical receipts unchanged; no alias or retroactive pass. |
| `AV.F06.image-hash.filesystem.case.expected` | retired-history-only; → `AV.F06.image-hash.input.case.expected`；Keep the six source/built not-executed-policy-pending historical receipts unchanged; no alias or retroactive pass. |
| `AV.F06.literal-percent20.filesystem.case.expected` | retired-history-only; → `AV.F06.literal-percent20.input.case.expected`；Keep the six source/built not-executed-policy-pending historical receipts unchanged; no alias or retroactive pass. |
| `AV.N02.image-percent.native-run.case.observed` | retired-history-only；Keep original 15 samples: 13 successes, 2 counterexamples, ordinary-percent image success, and causal controls. These excluded images are not current native-success obligations. |
| `AV.N02.image-hash.native-run.case.observed` | retired-history-only；Keep original 15 samples: 13 successes, 2 counterexamples, ordinary-percent image success, and causal controls. These excluded images are not current native-success obligations. |
| `AV.D09.common-definition.formal.case.expected` | historical-id-spelling-migrated-once; → `AV.D09.common-definition.native.case.expected`；Preserve historical receipts and prior assertions; do not register a formal/native alias pair. |
| `AV.D09.shared-callers.formal.case.expected` | historical-id-spelling-migrated-once; → `AV.D09.shared-callers.native.case.expected`；Preserve historical receipts and prior assertions; do not register a formal/native alias pair. |
| `AV.D09.unknown-source.formal.case.expected` | historical-id-spelling-migrated-once; → `AV.D09.unknown-source.native.case.expected`；Preserve historical receipts and prior assertions; do not register a formal/native alias pair. |

历史F06三个filesystem身份的六条待决回执须原样保留；新input ID单独验证。N02两个旧图片身份不再要求支持域成功，原始成功、反例及因果对照事实均保留。D09三个formal旧名只迁移一次到native，不能并存别名。

## 不适用候选与补充回归

- `AV.C07.target-missing.formal.B14-map-battle-background-battleback1.expected`：N/A。B14 follows the current Map Event host carrier, not an independently selected fixed database target; removing the carrier fails an earlier existing host/reference prerequisite. No asset-target missing pass is fabricated.
- `AV.C07.target-missing.formal.B14-map-battle-background-battleback2.expected`：N/A。B14 follows the current Map Event host carrier, not an independently selected fixed database target; removing the carrier fails an earlier existing host/reference prerequisite. No asset-target missing pass is fabricated.
- `AV.F06.image-candidate.input.case.expected`：当前索引128行声明的补充回归，责任03，单列而不计入1209。
- `AV.F06.image-inactive.input.case.expected`：当前索引128行声明的补充回归，责任03，单列而不计入1209。

## 每项必需入口轴

下表入口以 `source+built` 表示两个回执变体，身份不翻倍。普通A/B/C/F/D要求真实Workspace API及独立语义断言，实际CLI在套件层提供代表覆盖；权威没有要求所有这些ID各自再扩出CLI身份。F06三个新图片input身份明确要求每项同时经公共API与实际CLI。D10每项实际CLI；D06同目标双组为内部独立聚合输入。W的api／cli表示按索引明确展开，只有指定分支重复CLI；N用有效媒体记录原生请求及文件定位，不设source／built变体。JSON逐项附有入口规则出处、完整语义键、原文引用及SHA256。

## 逐项计划目录

### A01（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:33；规范：.scratch/asset-validation/acceptance-matrix.md:26。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A01.base.page.characterName.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A01.base.page.characterName.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A02（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:34；规范：.scratch/asset-validation/acceptance-matrix.md:27。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A02.base.formal.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A02.base.formal.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A02.base.raw.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A02.base.raw.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A03（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:35；规范：.scratch/asset-validation/acceptance-matrix.md:28。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A03.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A03.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A03.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A03.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A04（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:36；规范：.scratch/asset-validation/acceptance-matrix.md:29。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A04.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A04.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A04.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A04.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A05（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:37；规范：.scratch/asset-validation/acceptance-matrix.md:30。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A05.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A05.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A05.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A05.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A06（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:38；规范：.scratch/asset-validation/acceptance-matrix.md:31。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A06.base.formal.p1-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A06.base.formal.p1-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A06.base.raw.p1-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A06.base.raw.p1-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A07（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:39；规范：.scratch/asset-validation/acceptance-matrix.md:32。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A07.base.formal.p1.missing` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.A07.base.formal.p1.present` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.A07.base.raw.p1.missing` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.A07.base.raw.p1.present` | 02 | source+built；workspace-api | 权威token／默认值 |

### A08（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:40；规范：.scratch/asset-validation/acceptance-matrix.md:33。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A08.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A08.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A08.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A08.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A09（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:41；规范：.scratch/asset-validation/acceptance-matrix.md:34。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A09.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A09.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A09.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A09.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A10（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:42；规范：.scratch/asset-validation/acceptance-matrix.md:35。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A10.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A10.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A10.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A10.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A11（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:43；规范：.scratch/asset-validation/acceptance-matrix.md:36。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A11.base.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A11.base.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A11.base.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A11.base.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A12（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:44；规范：.scratch/asset-validation/acceptance-matrix.md:37。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A12.base.formal.p0.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A12.base.formal.p0.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A12.base.raw.p0.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A12.base.raw.p0.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### A13（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:45；规范：.scratch/asset-validation/acceptance-matrix.md:38。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A13.base.formal.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.formal.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.formal.p1.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.formal.p1.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.raw.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.raw.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.raw.p1.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A13.base.raw.p1.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A14（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:46；规范：.scratch/asset-validation/acceptance-matrix.md:39。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A14.base.formal.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A14.base.formal.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A14.base.raw.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A14.base.raw.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A15（12项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:47；规范：.scratch/asset-validation/acceptance-matrix.md:40。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A15.base.formal.p1.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.formal.p1.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.formal.p3.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.formal.p3.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.formal.p5.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.formal.p5.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.raw.p1.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.raw.p1.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.raw.p3.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.raw.p3.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.raw.p5.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A15.base.raw.p5.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A16（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:48；规范：.scratch/asset-validation/acceptance-matrix.md:41。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A16.base.formal.p1.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A16.base.formal.p1.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A16.base.raw.p1.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A16.base.raw.p1.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A17（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:49；规范：.scratch/asset-validation/acceptance-matrix.md:42。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A17.autonomous.page.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A17.autonomous.page.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A17.set-route.formal.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A17.set-route.formal.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A17.set-route.raw.p0.missing` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.A17.set-route.raw.p0.present` | 04 | source+built；workspace-api | 权威token／默认值 |

### A18（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:50；规范：.scratch/asset-validation/acceptance-matrix.md:43。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.A18.autonomous.page.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A18.autonomous.page.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A18.set-route.formal.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A18.set-route.formal.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A18.set-route.raw.p0-name.missing` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.A18.set-route.raw.p0-name.present` | 05 | source+built；workspace-api | 权威token／默认值 |

### B01（32项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:58；规范：.scratch/asset-validation/acceptance-matrix.md:51。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B01.show-animation.formal.image1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.image1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.image2.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.image2.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.se0.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.se0.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.se1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.formal.se1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.image1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.image1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.image2.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.image2.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.se0.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.se0.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.se1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-animation.raw.se1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.image1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.image1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.image2.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.image2.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.se0.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.se0.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.se1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.formal.se1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.image1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.image1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.image2.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.image2.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.se0.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.se0.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.se1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B01.show-battle-animation.raw.se1.present` | 06 | source+built；workspace-api | 权威token／默认值 |

### B02（36项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:59；规范：.scratch/asset-validation/acceptance-matrix.md:52。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B02.change-tileset.formal.slot0.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot0.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot2.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot2.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot3.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot3.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot4.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot4.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot5.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot5.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot6.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot6.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot7.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot7.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot8.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.formal.slot8.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot0.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot0.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot1.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot1.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot2.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot2.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot3.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot3.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot4.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot4.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot5.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot5.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot6.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot6.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot7.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot7.present` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot8.missing` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.B02.change-tileset.raw.slot8.present` | 06 | source+built；workspace-api | 权威token／默认值 |

### B03（16项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:60；规范：.scratch/asset-validation/acceptance-matrix.md:53。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B03.front.formal.member0-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.formal.member0-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.formal.member1-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.formal.member1-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.raw.member0-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.raw.member0-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.raw.member1-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.front.raw.member1-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.formal.member0-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.formal.member0-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.formal.member1-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.formal.member1-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.raw.member0-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.raw.member0-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.raw.member1-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B03.side.raw.member1-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |

### B04（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:61；规范：.scratch/asset-validation/acceptance-matrix.md:54。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B04.front.formal.transformed-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.front.formal.transformed-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.front.raw.transformed-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.front.raw.transformed-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.side.formal.transformed-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.side.formal.transformed-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.side.raw.transformed-battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B04.side.raw.transformed-battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |

### B05（16项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:62；规范：.scratch/asset-validation/acceptance-matrix.md:55。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B05.positive-animation.formal.image1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.image1.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.image2.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.image2.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.se0.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.se0.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.se1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.formal.se1.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.image1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.image1.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.image2.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.image2.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.se0.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.se0.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.se1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B05.positive-animation.raw.se1.present` | 11 | source+built；workspace-api | 权威token／默认值 |

### B06（16项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:63；规范：.scratch/asset-validation/acceptance-matrix.md:56。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B06.actor-default.formal.image1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.image1.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.image2.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.image2.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.se0.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.se0.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.se1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.formal.se1.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.image1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.image1.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.image2.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.image2.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.se0.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.se0.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.se1.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B06.actor-default.raw.se1.present` | 11 | source+built；workspace-api | 权威token／默认值 |

### B07（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:64；规范：.scratch/asset-validation/acceptance-matrix.md:57。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B07.enemy-default.formal.sound9.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B07.enemy-default.formal.sound9.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B07.enemy-default.raw.sound9.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B07.enemy-default.raw.sound9.present` | 11 | source+built；workspace-api | 权威token／默认值 |

### B08（48项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:65；规范：.scratch/asset-validation/acceptance-matrix.md:58。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B08.transfer-fixed.formal.bgm.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.bgm.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.bgs.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.bgs.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.parallax.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.parallax.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot0.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot0.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot1.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot1.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot2.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot2.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot3.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot3.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot4.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot4.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot5.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot5.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot6.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot6.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot7.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot7.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot8.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.formal.slot8.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.bgm.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.bgm.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.bgs.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.bgs.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.parallax.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.parallax.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot0.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot0.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot1.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot1.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot2.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot2.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot3.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot3.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot4.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot4.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot5.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot5.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot6.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot6.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot7.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot7.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot8.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B08.transfer-fixed.raw.slot8.present` | 07 | source+built；workspace-api | 权威token／默认值 |

### B09（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:66；规范：.scratch/asset-validation/acceptance-matrix.md:59。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B09.tile-b.page.selected-slot.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-b.page.selected-slot.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-c.page.selected-slot.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-c.page.selected-slot.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-d.page.selected-slot.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-d.page.selected-slot.present` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-e.page.selected-slot.missing` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.B09.tile-e.page.selected-slot.present` | 07 | source+built；workspace-api | 权威token／默认值 |

### B10（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:67；规范：.scratch/asset-validation/acceptance-matrix.md:60。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B10.add-actor.formal.battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.formal.battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.formal.character.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.formal.character.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.raw.battler.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.raw.battler.present` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.raw.character.missing` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.B10.add-actor.raw.character.present` | 08 | source+built；workspace-api | 权威token／默认值 |

### B11（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:68；规范：.scratch/asset-validation/acceptance-matrix.md:61。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B11.game-over.formal.gameover-me.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B11.game-over.formal.gameover-me.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B11.game-over.raw.gameover-me.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B11.game-over.raw.gameover-me.present` | 09 | source+built；workspace-api | 权威token／默认值 |

### B12（12项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:69；规范：.scratch/asset-validation/acceptance-matrix.md:62。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B12.return-title.formal.title-bgm.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.formal.title-bgm.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.formal.title1.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.formal.title1.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.formal.title2.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.formal.title2.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.raw.title-bgm.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.raw.title-bgm.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.raw.title1.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.raw.title1.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.raw.title2.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B12.return-title.raw.title2.present` | 09 | source+built；workspace-api | 权威token／默认值 |

### B13（16项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:70；规范：.scratch/asset-validation/acceptance-matrix.md:63。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B13.battle-system.formal.battle-bgm.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.battle-bgm.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.defeat-me.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.defeat-me.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.start-se.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.start-se.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.victory-me.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.formal.victory-me.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.battle-bgm.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.battle-bgm.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.defeat-me.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.defeat-me.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.start-se.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.start-se.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.victory-me.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B13.battle-system.raw.victory-me.present` | 09 | source+built；workspace-api | 权威token／默认值 |

### B14（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:71；规范：.scratch/asset-validation/acceptance-matrix.md:64。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B14.map-battle-background.formal.battleback1.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.formal.battleback1.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.formal.battleback2.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.formal.battleback2.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.raw.battleback1.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.raw.battleback1.present` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.raw.battleback2.missing` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.B14.map-battle-background.raw.battleback2.present` | 09 | source+built；workspace-api | 权威token／默认值 |

### B15（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:72；规范：.scratch/asset-validation/acceptance-matrix.md:65。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B15.call-common.formal.called-picture.missing` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.B15.call-common.formal.called-picture.present` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.B15.call-common.raw.called-picture.missing` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.B15.call-common.raw.called-picture.present` | 10 | source+built；workspace-api | 权威token／默认值 |

### B16（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:73；规范：.scratch/asset-validation/acceptance-matrix.md:66。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.B16.skill-common-effects.formal.effect0-picture.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.formal.effect0-picture.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.formal.effect1-picture.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.formal.effect1-picture.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.raw.effect0-picture.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.raw.effect0-picture.present` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.raw.effect1-picture.missing` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.B16.skill-common-effects.raw.effect1-picture.present` | 11 | source+built；workspace-api | 权威token／默认值 |

### C01（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:83；规范：.scratch/asset-validation/acceptance-matrix.md:74。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C01.common-uncalled.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C01.map-pages.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C01.nested-choice.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C01.nested-loop.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C01.troop-pages.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |

### C02（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:84；规范：.scratch/asset-validation/acceptance-matrix.md:75。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C02.removed-common.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C02.removed-map.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C02.reset-troop.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |

### C03（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:85；规范：.scratch/asset-validation/acceptance-matrix.md:76。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C03.independent-command.formal.image.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C03.independent-command.formal.se.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C03.repeated-command.formal.image.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.C03.repeated-command.formal.se.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.C03.route-mirror.formal.image.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C03.route-mirror.formal.se.expected` | 05 | source+built；workspace-api | 权威token／默认值 |

### C04（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:86；规范：.scratch/asset-validation/acceptance-matrix.md:77。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C04.common-independent-root.formal.case.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C04.repeated-common-effect.formal.case.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C04.repeated-enemy.formal.case.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C04.repeated-tileset-name.formal.case.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C04.two-callers.formal.case.expected` | 10 | source+built；workspace-api | 权威token／默认值 |

### C05（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:87；规范：.scratch/asset-validation/acceptance-matrix.md:78。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C05.dynamic-target.formal.case.expected` | 09,11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C05.known-sibling.formal.case.expected` | 09,11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C05.long-acyclic.formal.case.expected` | 10／11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C05.mutual-cycle.formal.case.expected` | 10／11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C05.self-cycle.formal.case.expected` | 10／11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C05.shared-dag.formal.case.expected` | 10／11 | source+built；workspace-api | 权威token／默认值 |

### C06（90项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:88；规范：.scratch/asset-validation/acceptance-matrix.md:79。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C06.default-page-image.formal.case.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.default-page-route.formal.case.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A01-base-characterName.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A02-base-p0.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A03-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A04-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A05-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A06-base-p1-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A07-base-p1.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A08-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A09-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A10-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A11-base-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A12-base-p0.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A13-base-p0.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A13-base-p1.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A14-base-p0.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A15-base-p1.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A15-base-p3.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A15-base-p5.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A16-base-p1.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A17-autonomous-p0.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A17-set-route-p0.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A18-autonomous-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-direct.formal.A18-set-route-p0-name.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-battle-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-battle-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-battle-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B01-show-battle-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot3.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot4.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot5.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot6.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot7.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B02-change-tileset-slot8.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B03-front-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B03-front-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B03-side-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B03-side-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B04-front-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B04-side-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B05-positive-animation-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B05-positive-animation-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B05-positive-animation-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B05-positive-animation-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B06-actor-default-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B06-actor-default-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B06-actor-default-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B06-actor-default-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B07-enemy-default-sound9.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-bgm.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-bgs.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-parallax.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot0.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot1.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot2.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot3.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot4.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot5.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot6.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot7.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B08-transfer-fixed-slot8.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B09-tile-b-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B09-tile-c-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B09-tile-d-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B09-tile-e-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B10-add-actor-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B10-add-actor-character.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B11-game-over-gameover-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B12-return-title-title-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B12-return-title-title1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B12-return-title-title2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B13-battle-system-battle-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B13-battle-system-defeat-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B13-battle-system-start-se.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B13-battle-system-victory-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B14-map-battle-background-battleback1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B14-map-battle-background-battleback2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B15-call-common-called-picture.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B16-skill-common-effects-effect0-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.none-indirect.formal.B16-skill-common-effects-effect1-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.saved-audio-controls.formal.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C06.saved-image-index.formal.case.expected` | 04 | source+built；workspace-api | 权威token／默认值 |

### C07（304项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:89；规范：.scratch/asset-validation/acceptance-matrix.md:80。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C07.field-empty.formal.B01-show-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-battle-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-battle-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-battle-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B01-show-battle-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot3.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot4.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot5.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot6.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot7.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B02-change-tileset-slot8.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B03-front-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B03-front-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B03-side-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B03-side-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B04-front-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B04-side-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B05-positive-animation-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B05-positive-animation-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B05-positive-animation-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B05-positive-animation-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B06-actor-default-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B06-actor-default-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B06-actor-default-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B06-actor-default-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B07-enemy-default-sound9.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-bgm.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-bgs.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-parallax.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot0.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot1.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot2.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot3.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot4.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot5.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot6.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot7.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B08-transfer-fixed-slot8.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B09-tile-b-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B09-tile-c-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B09-tile-d-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B09-tile-e-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B10-add-actor-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B10-add-actor-character.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B11-game-over-gameover-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B12-return-title-title-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B12-return-title-title1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B12-return-title-title2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B13-battle-system-battle-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B13-battle-system-defeat-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B13-battle-system-start-se.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B13-battle-system-victory-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B14-map-battle-background-battleback1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B14-map-battle-background-battleback2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B15-call-common-called-picture.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B16-skill-common-effects-effect0-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-empty.formal.B16-skill-common-effects-effect1-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-battle-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-battle-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-battle-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B01-show-battle-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot3.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot4.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot5.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot6.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot7.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B02-change-tileset-slot8.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B03-front-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B03-front-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B03-side-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B03-side-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B04-front-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B04-side-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B05-positive-animation-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B05-positive-animation-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B05-positive-animation-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B05-positive-animation-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B06-actor-default-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B06-actor-default-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B06-actor-default-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B06-actor-default-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B07-enemy-default-sound9.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-bgm.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-bgs.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-parallax.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot0.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot1.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot2.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot3.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot4.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot5.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot6.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot7.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B08-transfer-fixed-slot8.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B09-tile-b-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B09-tile-c-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B09-tile-d-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B09-tile-e-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B10-add-actor-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B10-add-actor-character.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B11-game-over-gameover-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B12-return-title-title-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B12-return-title-title1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B12-return-title-title2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B13-battle-system-battle-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B13-battle-system-defeat-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B13-battle-system-start-se.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B13-battle-system-victory-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B14-map-battle-background-battleback1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B14-map-battle-background-battleback2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B15-call-common-called-picture.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B16-skill-common-effects-effect0-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-missing.formal.B16-skill-common-effects-effect1-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-battle-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-battle-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-battle-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B01-show-battle-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot3.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot4.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot5.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot6.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot7.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B02-change-tileset-slot8.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B03-front-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B03-front-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B03-side-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B03-side-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B04-front-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B04-side-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B05-positive-animation-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B05-positive-animation-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B05-positive-animation-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B05-positive-animation-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B06-actor-default-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B06-actor-default-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B06-actor-default-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B06-actor-default-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B07-enemy-default-sound9.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-bgm.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-bgs.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-parallax.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot0.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot1.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot2.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot3.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot4.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot5.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot6.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot7.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B08-transfer-fixed-slot8.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B09-tile-b-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B09-tile-c-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B09-tile-d-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B09-tile-e-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B10-add-actor-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B10-add-actor-character.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B11-game-over-gameover-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B12-return-title-title-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B12-return-title-title1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B12-return-title-title2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B13-battle-system-battle-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B13-battle-system-defeat-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B13-battle-system-start-se.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B13-battle-system-victory-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B14-map-battle-background-battleback1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B14-map-battle-background-battleback2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B15-call-common-called-picture.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B16-skill-common-effects-effect0-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.field-wrong-type.formal.B16-skill-common-effects-effect1-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-battle-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-battle-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-battle-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B01-show-battle-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot3.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot4.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot5.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot6.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot7.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B02-change-tileset-slot8.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B03-front-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B03-front-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B03-side-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B03-side-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B04-front-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B04-side-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B05-positive-animation-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B05-positive-animation-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B05-positive-animation-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B05-positive-animation-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B06-actor-default-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B06-actor-default-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B06-actor-default-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B06-actor-default-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B07-enemy-default-sound9.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-bgm.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-bgs.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-parallax.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot0.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot1.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot2.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot3.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot4.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot5.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot6.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot7.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B08-transfer-fixed-slot8.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B09-tile-b-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B09-tile-c-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B09-tile-d-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B09-tile-e-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B10-add-actor-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B10-add-actor-character.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B11-game-over-gameover-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B12-return-title-title-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B12-return-title-title1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B12-return-title-title2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B13-battle-system-battle-bgm.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B13-battle-system-defeat-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B13-battle-system-start-se.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B13-battle-system-victory-me.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B14-map-battle-background-battleback1.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B14-map-battle-background-battleback2.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B15-call-common-called-picture.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B16-skill-common-effects-effect0-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.file-missing.formal.B16-skill-common-effects-effect1-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-battle-animation-image1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-battle-animation-image2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-battle-animation-se0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B01-show-battle-animation-se1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot0.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot1.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot2.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot3.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot4.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot5.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot6.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot7.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B02-change-tileset-slot8.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B03-front-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B03-front-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B03-side-member0-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B03-side-member1-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B04-front-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B04-side-transformed-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B05-positive-animation-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B05-positive-animation-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B05-positive-animation-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B05-positive-animation-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B06-actor-default-image1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B06-actor-default-image2.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B06-actor-default-se0.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B06-actor-default-se1.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-bgm.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-bgs.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-parallax.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot0.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot1.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot2.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot3.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot4.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot5.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot6.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot7.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B08-transfer-fixed-slot8.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B09-tile-b-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B09-tile-c-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B09-tile-d-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B09-tile-e-selected-slot.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B10-add-actor-battler.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B10-add-actor-character.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B15-call-common-called-picture.expected` | 10 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B16-skill-common-effects-effect0-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C07.target-missing.formal.B16-skill-common-effects-effect1-picture.expected` | 11 | source+built；workspace-api | 权威token／默认值 |

### C08（9项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:90；规范：.scratch/asset-validation/acceptance-matrix.md:81。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C08.autoplay-bgm-off.formal.case.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.autoplay-bgs-off.formal.case.expected` | 07 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.battleback-off.formal.case.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.false-page-condition.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.route-approach.formal.case.expected` | 04,05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.route-fixed.formal.case.expected` | 04,05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.route-random.formal.case.expected` | 04,05 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.tile-with-character.formal.case.expected` | 04 | source+built；workspace-api | 权威token／默认值 |
| `AV.C08.unreached-branch.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |

### C09（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:91；规范：.scratch/asset-validation/acceptance-matrix.md:82。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C09.actor-hp.formal.case.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C09.vehicle-position.formal.case.expected` | 08 | source+built；workspace-api | 权威token／默认值 |

### C10（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:92；规范：.scratch/asset-validation/acceptance-matrix.md:83。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C10.troop-host-only.formal.case.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C10.unrelated-actor.formal.case.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C10.unrelated-animation.formal.case.expected` | 06 | source+built；workspace-api | 权威token／默认值 |
| `AV.C10.unrelated-field.formal.case.expected` | 06 | source+built；workspace-api | 权威token／默认值 |

### C11（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:93；规范：.scratch/asset-validation/acceptance-matrix.md:84。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C11.plugin-command.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C11.recognized-raw.raw.case.expected` | 02,05／12 | source+built；workspace-api | 权威token／默认值 |
| `AV.C11.route-script.formal.case.expected` | 04,12 | source+built；workspace-api | 权威token／默认值 |
| `AV.C11.script-command.formal.case.expected` | 02,12 | source+built；workspace-api | 权威token／默认值 |
| `AV.C11.unknown-raw.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |

### C12（7项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:94；规范：.scratch/asset-validation/acceptance-matrix.md:85。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C12.battle-test-background.formal.case.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C12.enemy-ai.formal.case.expected` | 08 | source+built；workspace-api | 权威token／默认值 |
| `AV.C12.hardcoded-system.formal.case.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C12.initial-equipment.formal.case.expected` | 11 | source+built；workspace-api | 权威token／默认值 |
| `AV.C12.plugin-declaration.formal.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.C12.terrain-background.formal.case.expected` | 09 | source+built；workspace-api | 权威token／默认值 |
| `AV.C12.transfer-network.formal.case.expected` | 07 | source+built；workspace-api | 权威token／默认值 |

### C13（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:95；规范：.scratch/asset-validation/acceptance-matrix.md:86。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.C13.check-failure.formal.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.C13.check-success.formal.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.C13.push-success.formal.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |

### F01（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:105；规范：.scratch/asset-validation/acceptance-matrix.md:94。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F01.bgm.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F01.bgs.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F01.image.filesystem.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F01.me.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F01.movie.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F01.se.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |

### F02（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:106；规范：.scratch/asset-validation/acceptance-matrix.md:95。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F02.audio-encrypted-only.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F02.audio-m4a-only.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F02.exact-plus-alternative.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F02.image-encrypted-only.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F02.movie-mp4-only.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F02.other-only.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F03（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:107；规范：.scratch/asset-validation/acceptance-matrix.md:96。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F03.category-directory-case.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F03.exact-plus-case-variant.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F03.extension-case.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F03.multiple-case-variants.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F03.stem-case.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F03.top-directory-case.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F04（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:108；规范：.scratch/asset-validation/acceptance-matrix.md:97。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F04.bang.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.chinese.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.dollar.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.dot.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.space.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.trailing-dot-stem.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.trailing-space-stem.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F04.whitespace-only.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F05（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:109；规范：.scratch/asset-validation/acceptance-matrix.md:98。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F05.double-extension.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F05.unicode-distinct.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F06（7项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:110；规范：.scratch/asset-validation/acceptance-matrix.md:99。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F06.audio-hash.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F06.audio-percent.filesystem.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F06.image-hash.input.case.expected` | 03 | source+built；workspace-api+actual-cli | 权威token／默认值 |
| `AV.F06.image-percent.input.case.expected` | 03 | source+built；workspace-api+actual-cli | 权威token／默认值 |
| `AV.F06.literal-percent20.input.case.expected` | 03 | source+built；workspace-api+actual-cli | 权威token／默认值 |
| `AV.F06.movie-hash.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F06.movie-percent.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |

### F07（130项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:111；规范：.scratch/asset-validation/acceptance-matrix.md:100。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F07.absolute.input.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F07.backslash.input.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F07.control-character.input.case-u0000.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0001.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0002.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0003.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0004.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0005.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0006.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0007.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0008.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0009.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u000a.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u000b.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u000c.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u000d.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u000e.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u000f.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0010.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0011.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0012.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0013.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0014.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0015.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0016.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0017.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0018.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u0019.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u001a.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u001b.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u001c.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u001d.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u001e.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.control-character.input.case-u001f.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-AUX.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM1.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM¹.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM2.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM².expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM3.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM³.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM4.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM5.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM6.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM7.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM8.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-COM9.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-CON.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT1.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT¹.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT2.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT².expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT3.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT³.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT4.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT5.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT6.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT7.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT8.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-LPT9.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-NUL.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-case.input.case-PRN.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-AUX.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM1.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM¹.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM2.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM².expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM3.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM³.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM4.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM5.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM6.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM7.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM8.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-COM9.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-CON.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT1.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT¹.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT2.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT².expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT3.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT³.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT4.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT5.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT6.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT7.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT8.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-LPT9.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-NUL.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name-extension.input.case-PRN.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-AUX.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM1.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM¹.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM2.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM².expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM3.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM³.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM4.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM5.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM6.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM7.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM8.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-COM9.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-CON.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT1.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT¹.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT2.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT².expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT3.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT³.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT4.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT5.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT6.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT7.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT8.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-LPT9.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-NUL.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.device-name.input.case-PRN.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.drive-relative.input.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F07.forbidden-character.input.case-u0022.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u002a.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u002f.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u003a.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u003c.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u003e.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u003f.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u005c.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.forbidden-character.input.case-u007c.expected` | 03 | source+built；workspace-api | 计划编码，按semanticKey核验 |
| `AV.F07.parent-traversal.input.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F07.slash.input.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F08（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:112；规范：.scratch/asset-validation/acceptance-matrix.md:101。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F08.directory-is-file.filesystem.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F08.file-is-directory.filesystem.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F08.missing-category.filesystem.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F08.missing-file.filesystem.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |

### F09（7项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:113；规范：.scratch/asset-validation/acceptance-matrix.md:102。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F09.category-junction.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F09.dangling-link.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F09.file-symlink.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F09.link-in-root.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F09.link-outside-root.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F09.root-alias.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F09.top-symlink.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F10（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:114；规范：.scratch/asset-validation/acceptance-matrix.md:103。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F10.hard-link.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F10.metadata-only.injected.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F10.zero-byte.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F11（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:115；规范：.scratch/asset-validation/acceptance-matrix.md:104。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F11.enumerate-denied.injected.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F11.io-failure.injected.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F11.metadata-denied.injected.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F12（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:116；规范：.scratch/asset-validation/acceptance-matrix.md:105。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F12.disappears-after-enumeration.injected.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F12.type-changes-during-query.injected.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### F13（12项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:117；规范：.scratch/asset-validation/acceptance-matrix.md:106。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F13.audio-absent.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.audio-false.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.audio-null.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.audio-number.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.audio-string.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.audio-true.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.images-absent.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.images-false.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.images-null.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.images-number.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.images-string.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F13.images-true.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |

### F14（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:118；规范：.scratch/asset-validation/acceptance-matrix.md:107。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.F14.movie-only.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F14.no-audio-use.input.case.expected` | 05 | source+built；workspace-api | 权威token／默认值 |
| `AV.F14.no-images-use.input.case.expected` | 02 | source+built；workspace-api | 权威token／默认值 |
| `AV.F14.no-other-root.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |
| `AV.F14.no-www-fallback.filesystem.case.expected` | 03 | source+built；workspace-api | 权威token／默认值 |

### D01（27项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:136；规范：.scratch/asset-validation/acceptance-matrix.md:113。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D01.candidate.indirect-formal.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.candidate.indirect-formal.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.candidate.indirect-formal.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.candidate.indirect-raw.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.candidate.indirect-raw.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.candidate.indirect-raw.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.indirect-formal.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.indirect-formal.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.indirect-formal.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.indirect-raw.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.indirect-raw.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.indirect-raw.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.page.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.page.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.inactive.page.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.direct-formal.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.direct-formal.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.direct-formal.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.direct-raw.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.direct-raw.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.direct-raw.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.indirect-formal.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.indirect-formal.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.indirect-formal.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.indirect-raw.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.indirect-raw.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D01.ordinary.indirect-raw.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D02（27项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:137；规范：.scratch/asset-validation/acceptance-matrix.md:114。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D02.candidate.native.encrypted.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.candidate.native.inconsistent.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.candidate.native.required-field.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.candidate.native.unqueryable.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.candidate.native.unsupported-link.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.candidate.native.unsupported-name.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.exception.native.encrypted.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.exception.native.inconsistent.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.exception.native.required-field.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.exception.native.unqueryable.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.exception.native.unsupported-link.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.exception.native.unsupported-name.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.inactive.native.encrypted.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.inactive.native.inconsistent.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.inactive.native.required-field.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.inactive.native.unqueryable.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.inactive.native.unsupported-link.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.inactive.native.unsupported-name.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.ordinary.native.encrypted.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.ordinary.native.inconsistent.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.ordinary.native.required-field.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.ordinary.native.unqueryable.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.ordinary.native.unsupported-link.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.ordinary.native.unsupported-name.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.reference-error.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.script-gate.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D02.structure-error.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D03（8项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:138；规范：.scratch/asset-validation/acceptance-matrix.md:115。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D03.case-distinct.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.eligible.native.missing.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.eligible.native.name-mismatch.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.eligible.native.wrong-type.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.encoding-distinct.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.exact-namespace.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.space-distinct.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D03.suffix-distinct.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D04（9项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:139；规范：.scratch/asset-validation/acceptance-matrix.md:116。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D04.blank-reason.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.category-folder-mismatch.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.duplicate.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.empty-name.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.invalid-category.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.invalid-folder.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.missing-name.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.missing-reason.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D04.unknown-field.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D05（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:140；规范：.scratch/asset-validation/acceptance-matrix.md:117。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D05.incomplete.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D05.repaired.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D05.unused.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D05.warning-only.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D06（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:141；规范：.scratch/asset-validation/acceptance-matrix.md:118。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D06.mixed-levels.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D06.multiple-files.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D06.same-file-two-groups.native.case.expected` | 12 | source+built；independent-internal-aggregation-input | 权威token／默认值 |

### D07（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:142；规范：.scratch/asset-validation/acceptance-matrix.md:119。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D07.invalid-target.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D07.shared-directory-failure.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D07.shared-field-failure.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D08（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:143；规范：.scratch/asset-validation/acceptance-matrix.md:120。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D08.early-config.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D08.early-reference.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D08.early-structure.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D08.independent-results.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |

### D09（7项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:144；规范：.scratch/asset-validation/acceptance-matrix.md:121。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D09.common-definition.native.case.expected` | 12／10 | source+built；workspace-api | 权威token／默认值 |
| `AV.D09.map-page.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D09.nested-body.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D09.reliable-source.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D09.route.native.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.D09.shared-callers.native.case.expected` | 12／10 | source+built；workspace-api | 权威token／默认值 |
| `AV.D09.unknown-source.native.case.expected` | 12／10 | source+built；workspace-api | 权威token／默认值 |

### D10（7项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:145；规范：.scratch/asset-validation/acceptance-matrix.md:122。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.D10.cli-cycle-relations.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |
| `AV.D10.cli-dynamic.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |
| `AV.D10.cli-error.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |
| `AV.D10.cli-exception.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |
| `AV.D10.cli-query-failure.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |
| `AV.D10.cli-unchecked-warning.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |
| `AV.D10.cli-warning.native.case.expected` | 12 | source+built；actual-cli | 权威token／默认值 |

### W01（18项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:167；规范：.scratch/asset-validation/acceptance-matrix.md:130。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W01.fresh-error.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.fresh-error.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.fresh-success.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.fresh-success.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.fresh-warning.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.fresh-warning.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.initial-error.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.initial-error.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.initial-success.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.initial-success.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.initial-warning.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.initial-warning.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.stale-error.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.stale-error.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.stale-success.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.stale-success.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W01.stale-warning.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W01.stale-warning.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |

### W02（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:168；规范：.scratch/asset-validation/acceptance-matrix.md:131。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W02.delete-after-check.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W02.delete-before-gate.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W02.delete-before-gate.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W02.repair-before-gate.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W02.stable-warning.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W03（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:169；规范：.scratch/asset-validation/acceptance-matrix.md:132。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W03.error-at-gate.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W03.error-at-gate.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W03.repair-before-gate.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W04（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:170；规范：.scratch/asset-validation/acceptance-matrix.md:133。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W04.delete-after-check-before-manifest.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W04.delete-after-check-before-manifest.cli.case.expected` | 13 | source+built；actual-cli | 权威token／默认值 |
| `AV.W04.publication-io-failure.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W05（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:171；规范：.scratch/asset-validation/acceptance-matrix.md:134。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W05.error-after-staging.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W05.error-after-staging.cli.case.expected` | 14 | source+built；actual-cli | 权威token／默认值 |
| `AV.W05.repair-after-staging.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |

### W06（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:172；规范：.scratch/asset-validation/acceptance-matrix.md:135。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W06.delete-after-writes.api.case.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W06.delete-after-writes.cli.case.expected` | 15 | source+built；actual-cli | 权威token／默认值 |
| `AV.W06.type-change-after-writes.api.case.expected` | 15 | source+built；workspace-api | 权威token／默认值 |

### W07（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:173；规范：.scratch/asset-validation/acceptance-matrix.md:136。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W07.no-diff-asset-error.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W07.no-diff-asset-error.cli.case.expected` | 14 | source+built；actual-cli | 权威token／默认值 |
| `AV.W07.no-diff-data-drift.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |

### W08（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:174；规范：.scratch/asset-validation/acceptance-matrix.md:137。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W08.delete-diff-push-repair.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W08.delete-diff-push-repair.cli.case.expected` | 14 | source+built；actual-cli | 权威token／默认值 |

### W09（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:175；规范：.scratch/asset-validation/acceptance-matrix.md:138。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W09.after-pull-recompile.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W09.animation-rename-unpulled.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W09.tileset-rename-unpulled.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W10（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:176；规范：.scratch/asset-validation/acceptance-matrix.md:139。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W10.content.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W10.file-identity.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W10.mtime.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W10.size.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W10.unrelated-directory-entry.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W11（21项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:177；规范：.scratch/asset-validation/acceptance-matrix.md:140。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W11.case-match.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.case-match.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.case-match.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.failure-location.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.failure-location.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.failure-location.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.improvement.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.improvement.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.improvement.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.path-link.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.path-link.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.path-link.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.path-type.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.path-type.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.path-type.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.presence.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.presence.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.presence.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.queryability.api.check-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.queryability.api.compile-gate.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W11.queryability.api.push-gate.expected` | 14 | source+built；workspace-api | 权威token／默认值 |

### W12（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:178；规范：.scratch/asset-validation/acceptance-matrix.md:141。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W12.next-command-fresh.api.case.expected` | 13／14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W12.same-pass-reuse.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W13（16项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:179；规范：.scratch/asset-validation/acceptance-matrix.md:142。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W13.binding.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.binding.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.config.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.config.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.exception.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.exception.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.generated.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.generated.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.snapshot.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.snapshot.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.source.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.source.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.source.cli.postwrite.expected` | 15 | source+built；actual-cli | 权威token／默认值 |
| `AV.W13.source.cli.prewrite.expected` | 14 | source+built；actual-cli | 权威token／默认值 |
| `AV.W13.validation-dependency.api.postwrite.expected` | 15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W13.validation-dependency.api.prewrite.expected` | 14 | source+built；workspace-api | 权威token／默认值 |

### W14（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:180；规范：.scratch/asset-validation/acceptance-matrix.md:143。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W14.check-does-not-refresh.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W14.contract-change.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W14.exception-change.api.case.expected` | 12 | source+built；workspace-api | 权威token／默认值 |
| `AV.W14.pull.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W14.rebind.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W15（6项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:181；规范：.scratch/asset-validation/acceptance-matrix.md:144。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W15.all-generated-missing-asset.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |
| `AV.W15.all-generated-missing-asset.cli.case.expected` | 16 | source+built；actual-cli | 权威token／默认值 |
| `AV.W15.all-snapshot.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |
| `AV.W15.missing.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |
| `AV.W15.mixed.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |
| `AV.W15.unknown.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |

### W16（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:182；规范：.scratch/asset-validation/acceptance-matrix.md:145。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W16.changed-current-config.api.case.expected` | 16／12 | source+built；workspace-api | 权威token／默认值 |
| `AV.W16.stale-original-basis.api.case.expected` | 16／12 | source+built；workspace-api | 权威token／默认值 |

### W17（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:183；规范：.scratch/asset-validation/acceptance-matrix.md:146。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W17.clone.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W17.decompile.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W17.diff.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W17.pull.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |

### W18（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:184；规范：.scratch/asset-validation/acceptance-matrix.md:147。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W18.concurrent-workspace.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |
| `AV.W18.pending-non-push.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |
| `AV.W18.pending-rebind.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |

### W19（5项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:185；规范：.scratch/asset-validation/acceptance-matrix.md:148。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W19.compile-failure.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W19.compile-success.api.case.expected` | 13 | source+built；workspace-api | 权威token／默认值 |
| `AV.W19.push-failure.api.case.expected` | 14,15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W19.push-success.api.case.expected` | 14／15 | source+built；workspace-api | 权威token／默认值 |
| `AV.W19.recovery.api.case.expected` | 16 | source+built；workspace-api | 权威token／默认值 |

### W20（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:186；规范：.scratch/asset-validation/acceptance-matrix.md:149。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.W20.generated-roots-and-relations.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W20.generated-roots-and-relations.cli.case.expected` | 14 | source+built；actual-cli | 权威token／默认值 |
| `AV.W20.no-dsl-reevaluation.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |
| `AV.W20.no-historical-report.api.case.expected` | 14 | source+built；workspace-api | 权威token／默认值 |

### N01（3项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:196；规范：.scratch/asset-validation/acceptance-matrix.md:157。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.N01.audio-ogg.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N01.image-png.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N01.movie-webm.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |

### N02（4项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:197；规范：.scratch/asset-validation/acceptance-matrix.md:158。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.N02.audio-hash.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N02.audio-percent.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N02.chinese.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N02.space.native-run.case.observed` | 01 | native-run；native-runtime-observation | 权威token／默认值 |

### N03（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:198；规范：.scratch/asset-validation/acceptance-matrix.md:159。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.N03.animation-images.native-run.case.observed` | 06 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N03.animation-timing-se.native-run.case.observed` | 06 | native-run；native-runtime-observation | 权威token／默认值 |

### N04（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:199；规范：.scratch/asset-validation/acceptance-matrix.md:160。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.N04.change-tileset.native-run.case.observed` | 07 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N04.page-tile.native-run.case.observed` | 07 | native-run；native-runtime-observation | 权威token／默认值 |

### N05（2项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:200；规范：.scratch/asset-validation/acceptance-matrix.md:161。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.N05.enemy-front.native-run.case.observed` | 08 | native-run；native-runtime-observation | 权威token／默认值 |
| `AV.N05.enemy-side.native-run.case.observed` | 08 | native-run；native-runtime-observation | 权威token／默认值 |

### N06（1项）

行为权威：.scratch/asset-validation/implementation-acceptance-cases.md:201；规范：.scratch/asset-validation/acceptance-matrix.md:162。

| 完整计划ID | 责任票（主／协作） | 必需入口轴 | 身份拼写 |
| --- | --- | --- | --- |
| `AV.N06.runtime-overrides-initial-candidate.native-run.case.observed` | 08 | native-run；native-runtime-observation | 权威token／默认值 |

## 权威文件指纹

| 文件 | SHA256 | 字节数 |
| --- | --- | ---: |
| .scratch/asset-validation/implementation-acceptance-cases.md | `4e8a591f5c4d157e5876b6058d4c7ed6d4f440da584b58a23add2f205477a25f` | 29676 |
| .scratch/asset-validation/acceptance-matrix.md | `fddf586c2212a998bad5a32ec105691e05a879a52ea6d8cb07b16a1aa841b0ba` | 28893 |
| .scratch/asset-validation-implementation/issues/04-direct-image-uses.md | `d7e539a6b5d98ca3a93be564be64bd55ee9d934ebd47386b2b9c9da85689d8ac` | 8480 |
| .scratch/asset-validation/asset-validation-spec.md | `00d0d85abcda6d3141549616afb8aa410f993f2bb51e82ef7d8467e56b76d82f` | 48120 |
| .scratch/asset-validation-implementation/issues/05-direct-audio-and-movie-uses.md | `9fdfffdff9cb8ddbe89a809eb7a896fdfb131ae86a0c19b012cdc207d7bad15d` | 6405 |
| .scratch/asset-validation-implementation/issues/02-picture-compile-check.md | `e240fee24e1ae4311a97ef5e9d3986583d3dd62330416852cbaf5b6cb58a2476` | 6349 |
| .scratch/asset-validation-implementation/issues/06-animation-and-tileset-dependencies.md | `31de2af11c4a673a747e6cf417f6a9339f6cda952ba4f3ced25105e01edf1899` | 8471 |
| .scratch/asset-validation-implementation/issues/08-enemy-and-actor-candidates.md | `0a38bf468fa961bcdcce05f9fa43a7438550b3c4063d546b0d4ff77d80fcf456` | 6841 |
| .scratch/asset-validation-implementation/issues/11-forced-action-dependencies.md | `151db8cae494cd45f00b6ffad9dc30dda20dbd1417be172c4ee9dd8a8fe1468a` | 7650 |
| .scratch/asset-validation-implementation/issues/07-transfer-and-page-tile-dependencies.md | `9a8452bce9da8381e98158aad49d73be056283851d3b640fa10ec1642fe3689d` | 8009 |
| .scratch/asset-validation-implementation/issues/09-system-and-battle-defaults.md | `94ccaf496e057c170550ac52e70227bff74d7a71f0b0278ca501275f65834104` | 9053 |
| .scratch/asset-validation-implementation/issues/10-common-event-dependency-chains.md | `83b033b5f8aab821289af47021152cc924578282fa1e79cda9ec61381e0b48e7` | 5768 |
| .scratch/asset-validation-implementation/issues/13-compile-check-consistency.md | `e95c42876e2c9294ac9afb0c2a9c8ddfc1854786c2c7eccd0d308dedcdc64fdc` | 7306 |
| .scratch/asset-validation-implementation/issues/12-exceptions-and-complete-diagnostics.md | `42ff2215b81b8ea149bf06fd8aa7eab6291912625aab76a821c4b7bfd328ebc7` | 8927 |
| .scratch/asset-validation-implementation/issues/14-push-generated-asset-preflight.md | `da97da2f6c97dfceead8c427448d49e460cb7fba797760a3357833362698a3d4` | 7239 |
| .scratch/asset-validation/issues/03-asset-file-existence-contract.md | `c6a24d3c78b6204f431ed93f4bd2ea198d309a16d2cc189f0f468d78e76462c6` | 26732 |
| .scratch/asset-validation-implementation/issues/03-exact-file-observation.md | `688d99bcb716442a8206c89ab05f3f3184471c0e394ddc5a06dd5bcb52280d4c` | 11106 |
| .scratch/asset-validation-implementation/issues/15-push-postwrite-consistency.md | `ec8e6207bf413ceb89f14ca918ad982c0c1082d3ba8dcbfaf6f3ac496f90e17e` | 7423 |
| .scratch/asset-validation-implementation/issues/16-recovery-and-current-asset-policy.md | `801b33c07ce0e1054fd5fcc23704a0513bfc9cdcd60f25d9180397d16e396aa7` | 9951 |
| .scratch/asset-validation-implementation/issues/01-native-media-locations.md | `4efcebefab140b0c21b7e26c0f86bb0c55b988ed5463b95d893f093b8c7b7b0e` | 5869 |
| .scratch/asset-validation-implementation/ticket-breakdown-draft.md | `0efccebb9aed6d6cb883e07ad9c71dc92a31aa683170b0cd4886523a7413ee0f` | 26853 |

## 后续使用边界

- Use final authoritative matrix/index and ticket ownership at the explicit freeze c5f7ead75ba78680b92ad81924ba8cb884d2b751; this plan alone is not an execution audit.
- Map every expected semantic ID to registered tests and source/built/native receipts using independent expectations.
- Resolve F07 spelling one-to-one independently of behavior; never infer completeness from family/total counts.
- Check hashes, environment, required entry methods, exact assertions and all samples before assessing actual status.
- Separate pass/failure/not-executed/capability limits and historical/supplementary records; no product acceptance is claimed here.

此计划的结构核验仅检查独立展开、唯一性、97族和计数一致，以及与旧独立计划逐ID对账；未执行任何产品／原生测试，未检查实际覆盖或回执真伪。
