# 11：强制行动素材关系验收

2026-11-02，票据 [11](../issues/11-forced-action-dependencies.md)，依据 [实施规格](../../asset-validation/asset-validation-spec.md)、[验收矩阵](../../asset-validation/acceptance-matrix.md)、[有限用例索引](../../asset-validation/implementation-acceptance-cases.md)及 ADR0016／0018／0019。工作树 `M:/Shuen/Codex/asset-validation-11-action`，分支 `codex/asset-validation-11-action`，初始干净集成基线 `4cf15625`。最终集成版本与 Commit／Compile Contract Version 见机器合册。

## 行为与范围

独立 `asset-action-relations.ts` 只从当前已验证事件中的339进入所选捕获 Skill。正 animationId 复用06的 Animation 叶，保留图片预加载与逐 timing SE 条件。0只关闭动画路径。负 animationId 按原生默认攻击选择：Actor 保留无当前武器的 Animation1 条件候选和未知当前武器的停止记录，Enemy 只读取捕获 System.sounds[9].name。没有读取初始装备以替代当前武器，也不伪造敌人的 Animation ID。

所选 Skill 的全部 code44 effects 分别形成 `CommonEventAssetCall`，原始 effect 下标、当前 defining caller、339原生字段和 Skill/effect 链独立保留。重复目标仍保留两条直接边；没有按原生 reservation 的后值覆盖删除前值。目标来自当前 Common Event 根，Snapshot-only 旧事件不满足当前关系。每个 Common Event 的素材仍按定义位置收集一次，不沿 caller 路径复制或递归展开，不新增循环诊断。损坏的 animationId、effects 容器、单个 effect 和固定 effect 目标分别报告必要数据错误，安全动画／后续 effect 继续。

没有新增公共 API、JSON CLI、产品测试开关、全局跳过或持久素材状态。素材树、Snapshot 外部字段和未知保存值保持原有所有权。特殊名称由01／03统一处理，本票没有新增名称例外。

## 有限集合与独立预期

[机器合册](11-action-acceptance.json)对事先独立转录的113个主 ID及4个图协作 ID分别对账。计划清单不计为执行；source／built 为回执入口轴，不扩展规范 ID。

| 主验收族 | ID 数 | 实际要求 |
| --- | ---: | --- |
| B05 | 16 | 正动画四个字段 × formal／raw × present／missing；Skill及Animation完整链。 |
| B06 | 16 | 四个Animation1字段，同样表示／结果；候选warning、条件及未知武器停止同时保留。 |
| B07 | 4 | System.sounds9，formal／raw，present／missing；不引出Animation。 |
| B16 | 8 | 两个不同目标各自图片，formal／raw，present／missing；全部直接effect边与正动画共存。 |
| C04 | 1 | 同一目标的两个真实effect位置，各有边，定义素材只计一次。 |
| C05 | 2 | 复用09唯一dynamic-target／known-sibling回调，保留所有09场景后追加独立武器／Skill兄弟场景。 |
| C06 | 11 | 每个适用到达名称的合法None，保留独立数值及其他关系。 |
| C07 | 54 | 必要字段、固定目标、合法空与实际缺文件逐字段区分；候选不能降低必要数据错误。 |
| C12 | 1 | 初始武器及Actor图像不替代当前武器分支。 |

另4个协作 ID为既有 `C05.self-cycle`、`mutual-cycle`、`long-acyclic`、`shared-dag`。它们仍各只有一个注册回调和一份规范回执，owner `10,11`；先运行10原有117图和全部断言，再运行独立Skill/effect图。12跳链和多层共享图只断言有限直接边、完整定义位置及一个定义使用，不生成同义新ID或路径倍增。

期望均为测试自有字面量和从规格手工写出的边／使用／条件，不调用产品收集器、匹配器或政策函数生成。实际 Workspace API 和实际 CLI 均由所选 source／built 入口运行；完整原始源、捕获数据、生成结果、进程结果及SHA256留在机器合册与外部保留目录。合册的 `retainedActualData` 逐文件给出路径、字节数和内容SHA256，通过 `contentSha256` 指向 `retainedDataContentBlobs` 的 `gzip+base64` 完整原始字节；内容去重不减少实际Workspace或进程记录。普通自动化零字节PNG／OGG只验证元数据存在性。

## 验证记录

contract34 的最终源码／构建完整定向矩阵均通过，各143项：主套件116项（111个主规范ID及5项独立补充）、Common／Battle／契约回归25项、System共享回调2项。25项回归包含21个既有Common用例（其中4个为10／11共享图ID）、3个既有Battle用例和1个当前契约回归；其余6个契约套件用例因明确过滤未选，不计为通过。System运行同理只计2个选中共享回调，103个未选不计通过。每个入口拥有的规范集合精确为113个primary及4个supporting，没有缺失、额外或失败ID。

源码主矩阵耗时271.34秒，构建主矩阵181.26秒；构建Common／Battle／契约58.83秒、System共享8.08秒；源码Common／Battle／契约79.84秒、System共享12.16秒。所有矩阵串行运行，`--maxWorkers=1`。Windows10 build19045、Node.js22.23.4，临时根含中文和空格。完整日志、所有被本票回执引用的真实CLI进程结果及实际Workspace文件均保留，精确进程数见最终机器合册。

最终合入03图片名称政策的集成 `e103e373c26771f5ed117d7703614466c31b32cc`，合并提交 `32273bef`，Compile Contract Version 协调为 `mv-1.6.1/36`。只发生契约版本冲突，保留03的共用名称检查和所有原有collector／stop／effect调用。最终组合分别在source通过20／20（79.08秒）、built通过20／20（49.91秒）：B05／B06／B07／B16各一个formal缺失和一个raw存在、六个唯一C05共享回调、显式旧 `/23` 到当前 `/36` 契约回归、03的三个图片排除和两个candidate／inactive补充。准确filter见机器合册；400个未选项不计通过。完整143项各入口运行属于contract34历史，最终36只声明这20项组合复核。

最终 `pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`pnpm build` 和 `git diff --check` 均通过。机器合册对两入口精确集合、当前测试源码哈希及所有被引用的真实CLI执行和Workspace保留内容逐项复核；本票不重复生成03／09／10的规范ID。

最终对账为248个已完成的真实CLI进程，各有独立实际Workspace，4490个保留文件引用指向354个完整内容blob；所有gzip解码后的字节数和SHA256均匹配，所有引用可解析。另核对46项权威／产品／测试／构建／报告／质量／TDD工件哈希、已暂存权威与源码字节，以及新增两份Markdown的16个本地链接，均通过。

五项补充检查不增加规范 ID：坏effect与安全兄弟；零动画保留全部effects；必要animationId／effects容器各自错误且兄弟继续；实际API／CLI同时报告坏字段和缺当前Common目标、拒绝Snapshot回填；较新实时Skill／Animation／System不替代捕获视图，当前Common定义仍独立替换旧根。

前五个 TDD 切片为 positive／unarmed／enemy／effects／effect-safety，每个保留行为 red 和 green 日志。首轮完整源码矩阵为98通过／18失败：18项全部在测试主动修复文件后的最终Project树断言，预期误漏该新建文件；失败gate、只读／不发布和关系预期已通过。只修正测试最终树预期，产品没有为此改变；原始日志和Workspace全部保留，最终矩阵完整重跑，不把失败或过滤未选计为通过。

首轮既有源码回归为24通过／1失败／6未选：显式当前契约断言仍写旧31，而实际Compile正确写34。同步该测试的显式字面量、名称和sandbox标签为当前34，保留旧 `/23` 陈旧拒绝断言；随后完整重跑25个选中回归并通过。该次失败日志与实际Workspace仍保留。

旧 Battle 成功准备器只为所选 Skill1补 animationId1／effects[]，复用既有准确 BattleAnimation PNG；冻结原生JSON、旧命令／负例和未知字段不变。package使用说明、完整示例说明和显式Windows构建后清单同步。最终全仓／整规格签收属于17，本票不把有限关系验证扩大为完整运行或媒体内容保证。

## Outcome

11所属113个主ID及4个图协作ID已完整通过源码和构建入口，必要旧回归及最终集成组合均通过，没有本票未执行或未修复的失败分支。11不要求新增N组原生运行；07的N04交叉复核仍归07证据。票据记录完成结果后设为resolved；整规格及其他票状态不因本票闭票改变。
