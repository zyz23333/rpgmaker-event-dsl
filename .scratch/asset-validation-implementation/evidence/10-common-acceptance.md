# 10：公共事件直接调用关系验收

日期：2026-11-02。Windows x64 / Node.js v22.23.4，执行器 `M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe`。

责任票：[10](../issues/10-common-event-dependency-chains.md)。规范为 2026-10-25 修订的[实施规格](../../asset-validation/asset-validation-spec.md)、[子用例索引](../../asset-validation/implementation-acceptance-cases.md)、验收矩阵及 ADR 0016／0019。机器回执：[42 条结果](10-common-acceptance.json)，覆盖 21 个独立 AV ID 的源码／构建入口，保留输入、独立预期断言、环境、执行时间、结果、测试源码和相关产品源码哈希。

从经过完整校验的当前原生候选事件提取 117 的 caller、原生参数位置、target、targetId 和定义内依赖链。关系独立于素材使用：同一 Common Event 的图片仍只保留真实定义字段，不沿调用边复制。收集器不递归遍历，不引入 visited／深度门槛或循环诊断。缺图错误另附有限的直接调用关系段；所有真实调用位置分别显示。固定目标继续由既有引用校验处理，旧快照不能补回当前已移除的目标。

| 责任 | 实际验证 |
| --- | --- |
| B15 | formal／raw × present／missing；API／实际 CLI 检查，完整定义使用及直接调用位置按独立字面量核对。 |
| C04 | 同一 Common Event 的两个真实调用位置，另含 Map 页嵌套 Loop 和 Troop 页调用；目标的一次图片使用不会被四个调用位置放大。未调用的另一个 Common Event 保留自己的一次真实字段使用。 |
| C05 | 自调、互调、12 跳无环链和多层共享 DAG；逐项核对全部定义身份、直接边和唯一图片的定义位置，不枚举传递路径。 |
| C06 | 被调用事件的合法 None 无素材查询，直接关系继续存在；损坏的无关图片加密标志不被解释，独立负数缩放等保存值保留。 |
| C07 | 目标仅存于 Snapshot 时为现有 `MV-E117-REFERENCE`；图片名称缺字段／错误类型为原有输入错误；合法空名无查询；真实删图才为 `MV-ASSET-MISSING-FILE`。失败保持完整业务状态。 |
| C02 补充回归 | 旧调用点、已移除目标及被替换公共事件中的旧图片不会恢复为当前根；当前关系与使用逐项核对，生成输出保留删除 null hole。 |
| D09 | Common Event 定义位置、共享直接调用点及无可靠源码坐标时的原生位置；实际 CLI 暴露问题、原名、根、扩展名和全部相关原生定位，不编造源码行列。 |

首条实际 CLI 用例在实现前失败：缺图诊断只有目标定义位置，没有直接调用者。加入独立调用关系收集与展示后通过。随后逐片补齐图关系、输入／当前根和定位用例；所有预期均为手写原生位置和关系，未从产品收集器生成。

验证结果：

- 源入口 `vitest run test/asset-common-workspace.test.ts test/asset-picture-workspace.test.ts`：54／54，其中本票 21、既有图片 33。
- 构建后设置 `MV_CLI_ENTRY=built`，运行 `test/asset-common-workspace.test.ts test/common-event-workspace.test.ts test/common-native-boundaries.test.ts`：125／125，其中本票 21、既有公共事件回归 104。包括真实构建 CLI 和构建 Workspace API，补充结构断言读取同一生成数据。
- 包 typecheck、build、仓库 lint／format:check、`git diff --check` 通过。构建后 Windows 显式清单已增加新套件。
- 更新 Compile Contract Version 从 25 至 26；并行集成仍须顺序协调最终版本。未新增公共 API、测试开关或文件检查门槛，未修改素材政策。

本票没有未执行的所属自动化分支。None／坏字段的测试范围限于本票 B15 到达的图片字段；动画、Skill effects、动态目标及其他关系仍由各责任票验证。素材媒体内容、原生 N 组和全仓库最终验收不是本票的通过声明。01 中未决原生反例不在此关闭。
