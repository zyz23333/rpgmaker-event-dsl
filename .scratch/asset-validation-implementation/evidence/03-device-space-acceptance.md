# 03：Windows 保留设备名与首点之间的 ASCII 空格

现行 ordinary Windows 名称契约要求按完整追加文件名拒绝保留设备名。实际实现漏掉 `NUL .png`、`COM1 .ogg` 等设备 token 与首点之间的 ASCII U+0020 空格。此次重开修复既有契约缺口，没有引入新政策或 ADR，也没有修改有限验收身份。完整输入、独立预期、真实进程、状态与来源哈希见[机器合册](03-device-space-acceptance.json)，实际 red／green 和全部最终回执见[原始资料](03-device-space/)，提交前的字节、Git blob 与链接核验见[审计](03-device-space-git-verification.json)。

依据是[03 票](../issues/03-exact-file-observation.md)、[规格](../../asset-validation/asset-validation-spec.md)、[矩阵](../../asset-validation/acceptance-matrix.md)、[有限索引](../../asset-validation/implementation-acceptance-cases.md)及 ADR0017／0018。工作树 `M:/Shuen/Codex/asset-validation-03-files` 在重开前 clean 并快进到 integration `29f19dfd3ed943df2e0c9ae2b7c446ada248d501`；最终产品及断言冻结于 `15b893b3c36df545eafa4d0e621bd0df7986f1a2`，Compile Contract Version 为 **`mv-1.6.1/40`**。

## 产品边界与独立预期

产品只在保留设备 token 后、首点或字符串末尾前允许匹配零个或多个 U+0020；设备 token 仍覆盖 CON／PRN／AUX／NUL、COM1–9／LPT1–9 和 Windows 识别的上标 ¹／²／³。判断发生在目标构造和素材文件查询前。不会 trim、匹配 Unicode `\s`、改写保存值或把不支持名称交给例外降级。

父任务提供的只读 Windows API 探针以 `ntdll.dll!RtlIsDosDeviceName_U` 独立分类 16 个字面输入。原始脚本及 JSON 按字节归档，观察时间为 `2026-11-02T10:23:33.1217656Z`，Windows 10.0.19045／PowerShell 7.4.14。它确认 `NUL .png`、双空格、重复点、混合大小写与上标 token 属于设备名；`NULx.png`、`COM0 .png`、前导空格、token 后非空格内容、U+00A0 和 U+3000 则不是设备名。这是操作系统名称分类证据，没有声称执行 MV editor／game 或重跑原生验收。

测试独立手写 28 个保留 token 变体及 8 个普通实际文件名，不调用被测匹配器、收集器或政策函数生成预期。公共 Workspace Compile／Check API 与真实 CLI 在 Windows 自有临时项目运行；查询拒绝与记录仍使用既有测试子进程 OS 适配层，无新增产品测试开关。

## 七项补充回归

| 补充标签后缀 | 实际检查 |
| --- | --- |
| exception | 空 pictures 目录、准确 `NUL ` 例外，先复现公共 Compile 错误成功；修复后 API Compile／Check 及真实 Compile CLI 均拒绝不支持名称。 |
| image／audio／movie | 每项 28 个独立字面输入，混合正式／raw；API Compile／Check 及真实 Compile CLI 核对 28 groups／28 uses、准确位置、无目标、无查询、未检查及无发布。 |
| candidate | Actor 初始角色图 `lPt¹ ` 保留原 Snapshot 拼写和 candidate 来源；warning／incomplete，准确例外不能降级或制造 ineffective finding。 |
| inactive | Fixed Autonomous Movement 的保存 change-image `cOn   .foo` 保留非活动来源与生成保存值；warning／incomplete，无查询且不被准确例外豁免。 |
| supported-controls | 8 个真实 PNG：普通尾空格、前导空格、近似 token 和 U+00A0／U+3000 保留完整拼写，正常元数据查询而不读媒体内容；删除真实 `COM0 .png` 后，其准确例外仍可降级已确认缺失并正常记账。 |

七个标签均以 `SUPPLEMENT.device-space-` 开头，回执明确 `supplementary: true`、`canonicalId: null`，未增加 canonical AV ID。最终每入口保留原有 171 callbacks，再加 7 补充，共 178。原 F07 从 `function unsupportedNameCase(` 至文件末尾的 3,168 字节和全部旧 ID／输入／断言与 integration 基底完全相等，SHA-256 为 `21b202d79f5ce591d1b99d72381301cc7c7809c5ff2d11bacdc6ab4833e4f216`。

## 真实 red／green

首个 red 在提交 `c728e56b711d43044b956c24b1a6731b273b2d57` 运行。公共 Compile 在空目录和准确 `NUL ` 例外下错误成功，未出现预期 `MV-ASSET-UNSUPPORTED-NAME`；它发布 Generated CommonEvents 并改变 Manifest。原 live Project 完整字节保持不变，完整 before／after、实际空 failure 字符串、runner 与当时断言源码均保留。该 runner 是 1 项实际失败、171 项过滤，没有通过项。

只改最小 ASCII 空格规则和 Contract40 后，同一 tracer 首次 green 为 1 项通过、171 项过滤。实际运行时 HEAD 仍为 `c728e56b`，产品改动尚未提交；这些精确产品字节随后冻结于 `64c99c765cb5c7c061a22aff119660694f365e4d`，没有把第一次 green 假称最终冻结执行。后续补充预备运行 7 通过／171 过滤，合法缺失例外增强后窄运行 1 通过／177 过滤；这些过滤项和重复通过均不增加最终通过数。

## 最终执行与历史保全

最终冻结 `15b893b3` 上的完整 `asset-file-workspace.test.ts`，source／built **各 178／178，通过178、失败0、过滤0**。每入口 171 个既有标签集合与原166身份及现行5个F06标签逐项相等，7个补充之外没有新增或替换身份。

owner05 的原 F06 音频百分号／井号、影片百分号／井号四项作定向复核，source／built **各 4 通过、0 失败、78 过滤**；只归档这8条当前通过回执，未声称82项全跑。文件套件356条加媒体8条，共 **364 条当前原始通过回执**，其中14条为新增补充。没有运行不相关的大型 relationship 套件。

build、typecheck、lint、format:check 及 `git diff --check` 全部通过。命令按 source→build→built→media source／built→static 顺序执行，均为 Windows／Node `v22.23.4`，`maxWorkers=1`，临时测试项目使用默认 C TEMP／TMP；M 盘用于工作树。最终命令实际时间、退出码、runner、输入及15份构建工件哈希均在合册。

原[03历史 JSON](03-file-observation-acceptance.json)的 332 passed 及独立 `.pending` 数组6条均按原字节保留：1,169,434 bytes，SHA-256 `a8652ef3feda52e3677af8d8d52f9fd3fbbedbbf4a1dacfea453af802e14d071`。旧[图片政策收尾](03-image-policy-acceptance.json)也未改写。独立主计划仍为97族／1209义务（1195自动化＋14原生），SHA-256 `869c6752eedb1997e0ccbca5e3bce81c74122ce68f4600c970822ce37b9841b6`，125个原F07后缀拼写保留。

机器合册绑定23个冻结 Git 输入、15个 built 工件、395份原始文件及全部364条当前回执。raw 的 Git 属性禁用文本归一化，提交前审计逐项核对磁盘、SHA-256、长度和暂存 Git blob，核对完整补充回执对象及本地 Markdown 链接。本次03修复完成不代替17的最终全仓与原生验收；01原生历史、失败和能力限制仍由最终合册汇总。
