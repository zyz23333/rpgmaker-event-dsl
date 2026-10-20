# 最终两轴评审与问题关闭

实施分支：`codex/complete-mv-events-implementation`。

首次独立评审固定范围为 `cdec508afc07f0543fb0c6751d4aab924d4a3aa7...d6b1d24ed3184a7ecadcd993662139e2e84756a3`。Standards 与 Spec 由两个独立审查者并行执行。全部有效问题交给同一个实现者集中修复；原审查者分别复核 `d6b1d24...ca8f8de5cbd6105261bab4ef17165cfdff72498a`，确认三个问题全部关闭。

## Standards

原报告发现一项 P2 文档标准违规，没有另列判断型 smell。`troopEvent`、`battlePage`、`mapEvent`、`page` 在复制输入后才检查结果，会删除原对象不可枚举的未知字段并读取 getter；实际源码中的额外 `kind` 字段也会被覆盖。这违反 ADR0012 对 owned event/page 未知字段应拒绝而不能静默删除的要求。

修复在四个入口任何字段读取、默认值处理或展开之前调用已有 `assertDslObject`，检查原始 prototype、全部 own keys 和 descriptors，允许字段表排除 `kind`。独立 Node 22.23.0 复核确认四个原输入被明确拒绝、getter 读取次数均为 0、原对象字段保留；两个实际源码求值反例也被拒绝，合法输入的输出不变。原 Standards P2 已关闭，复核范围内剩余问题为 0。

[原 Standards 报告](M:/Shuen/Codex/mv-events-implementation-20261020/final-review/standards-review.md)及[独立复核](M:/Shuen/Codex/mv-events-implementation-20261020/final-review/standards-recheck.md)保留原复现、源码版本、核查范围和局限。

## Spec

原报告发现两项 P2。

1. Map Diff 使用 `JSON.stringify`，把受支持的 `0 → -0` 保存值变化显示成 `0 → 0`，未满足 I10 的保存结构和值展示要求。修复改用已有 `renderJsonValue`。原 Node 22 probe 现显示 `0 -> -0`；实际 Workspace 测试同时验证反向 `-0 -> 0`。
2. Map 超过 20 页的警告缺少 I7 要求的阶段、事件身份、精确路径和预期/实际，默认 stderr 也看不到稳定代码。修复补齐结构字段及实际显示消息，并收敛同类 Troop 警告。已通过的图验证和 CLI 测试覆盖同名事件区分、warning 保持成功及完整页保存。

原 Spec 两项 P2 均已关闭，复核范围内剩余问题为 0。

[原 Spec 报告](M:/Shuen/Codex/mv-events-implementation-20261020/final-review/spec-review.md)及[独立复核](M:/Shuen/Codex/mv-events-implementation-20261020/final-review/spec-recheck.md)保留规范引文、原始反例及独立重放结果。

## 验证与候选边界

修复产品提交为 `ca8f8de5cbd6105261bab4ef17165cfdff72498a`，source tree 为 `ee738a365500a11a1f75368fa467dae73f4d2c7b`，Compile Contract Version 为 `mv-1.6.1/23`。唯一集中构建的 Workspace API SHA256 为 `824203f0119529a48aa4397d9ba94139abead369e650d2d528273bc726bb4d17`。受影响红绿、源码求值、Check/Compile/stale Push 状态保持、freshness、source/built 检查和原始失败见[修复交付报告](55-final-review-fixes.md)。

完整修复包为 `df6ca7fd86dc21eb2acf6d54c67806dca79f6bb5`；`387bc3a` 仅调整现有测试夹具，最后提交仅更新证据和当前指针。Source 的有效结果合并覆盖 89 项通过，built 8 项通过；最初的 88 项 source 运行仍保留为 86 通过、2 失败，后续只复验对应两项，不虚构再次完整运行。最终 typecheck、lint、format 和 source/built freshness 检查均通过，明确验证旧 `/22` baseline 失效。没有重复全量、current-index 或 native 运行。

本次变化收紧非法原始输入并修正诊断展示，不改变合法事件编码。实际三容器验证保留全部 15 个完整 carrier 的解析值。因此按规格 T6 复用未受影响的既有原生观察，73 个有效 pair/146 次实际游戏的执行身份仍为原 `/22` 候选 `2dc6390`，没有冒称这些游戏执行了 `/23`。旧构建、原 source/built 全量失败、后续定向通过、Movie strict false 与实际行为通过分别保留。[55 总审计](55-final-audit.md)及其原矩阵仍是原始审计记录，当前 `/23` 结论由修复增量与未受影响复用共同构成。

评审为有范围和局限的代码检查，包含实际独立 Node 22 反例；没有声称逐行穷尽全部 137 个变更 source 文件，也没有重跑完整测试或历史游戏。

Standards：原 1 项，最高 P2，全部关闭；Spec：原 2 项，最高 P2，全部关闭。
