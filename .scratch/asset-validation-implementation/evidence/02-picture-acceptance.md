# 02：Show Picture 的 Compile／Check 验收

日期：2026-11-02。环境：Windows x64，官方校验过的 Node.js v22.23.4；执行路径为 `M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe`。

票据：[02](../issues/02-picture-compile-check.md)。契约：[实施规格](../../asset-validation/asset-validation-spec.md)、[子用例索引](../../asset-validation/implementation-acceptance-cases.md)及 ADR 0016–0019。机器回执：[66 条逐项结果](02-picture-acceptance.json)，含 33 个独立 ID 的源码／构建入口结果、输入字面量、独立断言及其源码哈希、环境、执行时间与结果。产品源文件哈希也一并保留。

实现从通过完整校验的候选原生输出选取当前 Map／Common／Troop 事件，逐次收集 231 参数 1。生成阶段已经排除了删除事件及旧 Troop 页，收集器不从快照补回它们。相同 PNG 共享文件事实，真实保存位置仍分别保留。Compile／Check 在发布／返回前检查一次，观察不写入持久依据；Compile Contract Version 为 25。

测试数据为自写项目、明确原生字面量和零字节文件，不属于原生游戏运行证据。主要入口是现有 Workspace API 和真实源码／构建后 CLI；内部收集结果只补充完整来源断言。

| 责任 | 实际覆盖 |
| --- | --- |
| A07 | formal／raw，Map Event 普通命令，present／missing 各自完整使用预期 |
| C01 | 两页 Map／Troop、未调用 Common、嵌套 Choice／Loop 的完整使用和全部来源 |
| C02 | 删除 Map、删除 Common、Troop Reset 均不从旧快照产生素材根 |
| C06 | `none-direct` 的 A07 参数 1，无查询并保留独立负数缩放保存值 |
| C08 | self-switch 页条件和字面量 false 的脚本分支不会降低图片错误级别 |
| C11 | script／plugin／unknown raw 不猜素材，recognized raw 无法绕过素材政策 |
| C12 | 插件素材声明不扩大素材根 |
| F01、F08 | 准确零字节 PNG、缺目录／缺文件、目录为文件／文件为目录 |
| F13、F14 | 图片标志缺省／false／true／null／number／string；无图片时不解释损坏标志 |
| CLI 与状态 | 真正 `compile`／`compile --check` 的失败与修复成功，稳定标识和原生来源；失败及成功 Check 核对源、配置、项目／素材树、Snapshot、生成数据和 Manifest 的只读边界 |

旧 Picture fixture 中的 `CR\rname` 是合法可保存值，但没有受支持的 Windows 目标文件。保留原字面量与新的 Decompilation 原值断言，并确认新素材门槛拒绝、无发布。旧成功工作流使用单独明确的 `Line picture` 保存值及准确文件，原生字段、负零、额外外部字段等既有断言继续保留；没有修复或规范化历史名称。另补齐 `Wide picture` 和 `Unscanned picture` 的实际 PNG。

验证结果：

- 首条测试在实现前按预期失败：缺图的 Check 错误地成功；加入单次门槛后通过。
- `vitest run test/asset-picture-workspace.test.ts`：33／33，源码入口。
- 相同套件设置 `MV_CLI_ENTRY=built`：33／33，构建 Workspace API 与真实构建 CLI。
- `vitest run test/pictures-workspace.test.ts test/final-review-workspace.test.ts`：71／71；已完成全部旧 Picture 工作流回归和契约版本旧输出检查。
- 包 typecheck、build、仓库 lint、format:check、`git diff --check` 均通过。
- 新素材套件已加入 `vitest.windows.config.ts` 显式构建后清单。最终整个仓库检查和完整 Windows baseline 由 17 汇总，以上不是其全量通过声明。

本票没有尚未执行的所属自动化分支。03 的完整特殊名称／链接／故障分类、后续关系、例外政策和 Push 尚不属于本票交付范围。N 组真实原生定位由各自责任票承担，不能由这里的零字节存在性测试代替。
