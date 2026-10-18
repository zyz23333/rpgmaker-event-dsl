# Map Inspection and Map Preview: Final Review

Date: 2026-10-18. Integration branch: `codex/map-inspection-and-preview`.

Initial review: `git diff a4b8e2c...5c36d33`; fixed point `a4b8e2c765b27c9fb5c8b2bb96cf367868012c45`. The Standards and Spec reports below were produced independently. Findings refer to the initial review revision. All five findings were addressed together in `f7bc47bc498f4e727eb85a129e2456aba5cafcac` and merged at `025ed97dc9f5495c71ff281ba36e35fbc5a2f3ce`.

## Standards

Standards 轴复审：`a4b8e2c765b27c9fb5c8b2bb96cf367868012c45...5c36d33`。未发现明确的文档标准违规；以下均为 Fowler 基线的判断性建议，不是阻断项。已按 ADR-0002/0003/0004/0006/0007/0008/0009/0010、GLOSSARY、tracker 规则和 writing-for-agents 检查；跳过工具可直接检查的格式、类型和 lint 问题。未执行测试或修改仓库。

- **[P3] Duplicated Code：栅格目标矩形计算。** `packages/rpgmaker-event-dsl/src/map-observation/raster.ts:89–108`、`:128–147`、`:160–179` 三处重复默认 viewport 和裁剪／取整算法，例如 `const view = target.viewport ?? { ... }` 与 `Math.ceil(dx * view.scaleX + view.offsetX - 0.5)`。重复部分决定缩放采样边界；未来修复半像素边界时容易仅修正其中一个绘制入口。提取返回 viewport 和目标像素边界的私有函数，供填充、贴图和重复背景共同使用。

- **[P3] Duplicated Code：普通图块 atlas 映射。** `packages/rpgmaker-event-dsl/src/map-observation/render.ts:69–72` 与 `native-events.ts:77–88` 重复 B–E slot 和源矩形公式：`5 + Math.floor(tileId / 256)`、`((Math.floor(tileId / 128) % 2) * 8 + (tileId % 8)) * 48`。同一 MV 图块规则分散在地图与事件图像路径；建议提取普通图块布局函数，两处共享计算。

- **[P3] Duplicated Code：角色文件名前缀解释。** `packages/rpgmaker-event-dsl/src/map-observation/native-events.ts:47–48`、`:91–94` 与 `assets.ts:12–16` 分别解析 `!`／`$` 前缀，例如 `/^[!$]+/u.exec(...)`、`prefix.includes("$")`、`/^[!$]*\$/u.test(name)`。常规渲染的帧布局、位置偏移和缺图占位尺寸依赖同一命名规则，却使用不同解析方式。提取返回 `big`／`object` 标志的私有函数统一解释。

修复复查（2026-10-18）：在 `the review-fix worktree`、分支 `codex/map-preview-review-fixes` 对照 `git diff 5c36d33` 只复查上述 3 项，复查时 HEAD 为 `f7bc47bc498f4e727eb85a129e2456aba5cafcac`。确认全部已解决：

- `raster.ts:81` 的私有 `targetPixelRectangle` 集中 viewport 默认值及目标裁剪边界，填充、贴图、重复背景分别在第 118、139、153 行调用，原三份算法已移除。
- `native-image-layout.ts:6` 的 `ordinaryTileAtlasLayout` 集中普通 A5/B–E 图块 slot 和源坐标计算；`render.ts:68` 与 `native-events.ts:80` 均调用该函数，原重复公式已移除。
- `native-image-layout.ts:15` 的 `nativeCharacterImageFlags` 集中 `!`／`$` 前缀解释；事件定位／角色渲染及缺图占位分别在 `native-events.ts:48`、`:90`、`assets.ts:13` 使用同一函数。

没有发现这些修复的具体遗留问题。本次仅执行只读差异与调用路径核对，未运行测试、未扩展为新一轮完整审查、未修改仓库。作者提供的验证结果为完整检查 28 文件／243 测试与构建通过；本次未独立重跑。

## Spec

范围：`a4b8e2c765b27c9fb5c8b2bb96cf367868012c45...5c36d3328b926798887a9f2cf287fb699808e599`。只读审查，未修改仓库。发现两项 P2，均已独立运行外部临时 Workspace 公共 API 探针复现。

1. **[P2] 拒绝数组槽位与声明 ID 不一致的地图／事件。** `packages/rpgmaker-event-dsl/src/map-observation/read.ts:83` 只检查事件声明 ID 唯一，`:118` 对地图目录也只检查声明 ID 唯一。`events[1].id = 99` 后摘要成功报告事件99，事件查询和 Preview Page 选择也按99查找；原生 MV 按数组槽位1建立事件身份。同样，`MapInfos[1].id = 99` 被列表报告为地图99，之后按99寻找 `Map099.json`。应在过滤数组前核对每个非空条目的 ID 与槽位，拒绝损坏身份，避免代理向错误的 Entry Identity 编写 DSL。规格第100行（Decision23）要求：**“Reject ... invalid or nonexistent identities ... malformed required map data ... with actionable errors.”** 第81行要求：**“Numeric map and event identities remain authoritative when display names are duplicated.”**

2. **[P2] 裁剪外表格邻居缺失 flags 时应报错。** `packages/rpgmaker-event-dsl/src/map-observation/native-layers.ts:31` 的 `tileset.flags[tileId] ?? 0` 把不可用 supporting data 当作有效非表格。将 `(0,0)` 第二图层设为A2图块2816，删除其flags，再裁剪 `(0,1,1,1)`，渲染仍返回 `complete: true`、空warnings；全图渲染则正确失败。该邻居决定裁剪首行是否绘制原生表格下沿，不能默认零。应对实际参与表格边缘计算的非零邻居验证 flags。规格第100行要求：**“Reject ... unavailable supporting data ... with actionable errors.”** 第98行要求：**“Complete means complete within the supported static target.”**

未发现额外功能范围蔓延。其余主要合同（双来源路由及 guards、原始坐标、事件外观及 Preview Page、图像来源、显式不完整模式、产物发布、CLI／公共 API、authoring workflow）在代码与现有验收证据中相符。现有检查及509,184像素零差异结果不能覆盖以上损坏输入边界。

## 修复复核（2026-10-18）

在 `the review-fix worktree` 只读检查相对 `5c36d33` 的修复差异。上述两项 P2 均已解决：`read.ts:83` 与 `:123` 在过滤空槽位之前逐项核对声明 ID 与原生数组槽位；合法 null holes 与不连续 ID 得以保留。`native-layers.ts:32` 对参与表格边缘判断的 A2 邻居显式要求 flags，缺失时抛出可操作错误，严格模式与占位模式均不能绕过。

独立运行 `pnpm exec vitest run test/map-validation.test.ts`：1文件、9用例全部通过，覆盖槽位身份拒绝、合法空槽位、非循环及垂直／双向循环裁剪邻居、严格／占位模式，以及失败后无产物和数据写入。本次限定复核未发现这两项修复的剩余问题，未修改仓库源文件。

## Final verification

- `pnpm check`: typecheck, lint, formatting, and 28 test files / 243 tests passed.
- `pnpm build` passed; the primary checkout was rebuilt after integration.
- Integration checks: typecheck plus required-data validation, placement workflow, and architecture suites passed (3 files / 13 tests); `git diff --check` passed.
- An independently installed package tarball passed root/Workspace API imports, strict NodeNext declaration checks, map subcommand help, clean JSON, artifacts, and duplicate page override rejection. See ticket 11 for the local package report.
- Real local project: 509,184 pixels matched an independently assembled native-MV reference, with no project engine or plugin scripts executed. After the review fixes, the built CLI rendered the same 816 × 624 native output, byte-identical to that reference (SHA-256 `a48524150d42da88acef81a79875ede9f6ae1dd6e6a338c842057bcd70f4f8d6`). Local visual artifacts remain in `demo_artifacts/map-preview-validation/acceptance-11/` and are not redistributed.
- All 11 implementation tickets are resolved. Project Root Push was not performed.

Findings by axis: Standards — 3 P3 judgment calls, worst P3; Spec — 2 P2 validation defects, worst P2. All findings are fixed and confirmed by their original reviewers; no unresolved findings remain.

