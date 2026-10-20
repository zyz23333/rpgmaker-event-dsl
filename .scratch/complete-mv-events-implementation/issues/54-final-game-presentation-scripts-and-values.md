# 54: 最终游戏回归：表现、脚本与数值

Status: resolved
Blocked by: 48
Stage: S7
Execution batch: [最终原生回归](../tickets.md#batch-native-regression)
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 完成 R6–R7 的图像／声音／等待／None、受控脚本与插件行、EXP 实际运行对照。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：最终 R6–R7。

只交付本票指定行为与证据；其他阶段的未完成事项保持其实际状态。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 候选版本完成 R6 图像/脸图/文本/选择、等待/并行、音频与 Picture None 的不同语义，必要时留存人工声音/图像观察。
- [x] 完成 R7 Gate 放行后的受控单槽多行/空脚本、完整 Plugin Line 接收与 EXP 常量/变量/增减，不扩展插件私有语义。
- [x] 不以错误一律等于失败处理原生反应；保留原生与产品版本、操作、结果和复验记录。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

在已记录的最终候选上执行本票 E/R 组，保留原生对照和产品输出的输入身份、版本、步骤、实际结果及差异。修复后按影响复验并追加记录，不能覆盖原始捕获。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [48：全矩阵与三类事件集成](48-full-matrix-and-three-container-integration.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：T3–T4、T6（R6–R7）；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Comments

### 2026-10-20 — actual final assigned R6/R7 closure

Final candidate `2dc639015f908de6fd524e50236e5422b5f8e990`, compile contract
`mv-1.6.1/22`, built API SHA256
`24369d6d1d686b082665cda3b5e76292ed778420eadcfdad431a9cea11169788`
completed27 assigned effective literal/product pairs and54 actual MV1.6.1 /
NW.js0.29.0 processes.26 pairs strictly pass. Movie's actual playback/completion,
native wait, None and all eight independent traces pass on both sides, as do
complete carrier/host/profile/process/disk/engine/exit checks; only its exact
one-line Chromium `media_internals.cc(102) Cannot get RenderProcessHost` differs
from the harness's blanket empty-stderr predicate. The original strict-failed
pair is preserved; root classified the actual required behavior using this
ticket's explicit third criterion and inspected the real movie-frame capture.
No cause, suppression, engine patch or broader log exception is claimed.

The [execution report](../evidence/54-final-game-r6-r7.md) and
[immutable safe manifest](../evidence/54-final-game-manifest.json) retain exact
candidate/input/command/result identities, per-side expected/actual observations,
all original controls and failures, Audio V1–V5 corrections, unchanged Shop
rerun and the original27-process cached36169 versus later on-disk085 harness
identity caveat. Final Audio-v5 retains all eight V4 oracles/readiness logic and
strictly passes after changing only two SE names to stock six-second Teleport.
Audio samples come from actual WebAudio graphs; physical listening is not
claimed. First-party assets/private games remain outside Git.

Two new immutable passed results close `MV-S7-GAME-R6-054` and
`MV-S7-GAME-R7-054`. The old mixed family rows receive actual portion pointers
for55's aggregation, not blanket passed records. The separate missing-Tileset
Loading Error and original eight-background requirements retain their own
obligations. Delivery syntax001 and generation002 pass, including all27 pair
hashes/candidate/native assertions and unchanged438 incoming requirement objects
plus two owned rows. No product/domain/contract change, full/build/built or extra
native run occurs in this delivery.48 checks are reused; the independent merger
will run the single current-index validation after integration, per root's
instruction. The assigned ticket is resolved on its actual complete outcome.

Owned document format005 and diff check006 pass; immutable manifest/results and
inherited438 objects/metadata remain exact. Initial format003 lacked local
dependencies and is retained;005 reused the existing primary oxfmt0.56.0 binary
without an install, junction or product mutation. The final command/environment
receipt is `ticket54-final/tools/final-doc-validation-b9d5f6ea-2477-450d-a041-48e5e024e9a8.json`
under the external M evidence parent.
