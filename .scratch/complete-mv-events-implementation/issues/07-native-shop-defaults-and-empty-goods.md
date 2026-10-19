# 7: 原生 Shop 初值与空商店逆向核对

Status: resolved
Blocked by: 01
Stage: S1
Created: 2026-10-19
Parent: [MV 1.6.1 原生事件完整支持实施规格](../complete-mv-events-implementation-spec.md)

**What to build:** 追踪新建 Shop、空 goods、购买限制及商品重确认的初始化/保存链，验证空商店占位。

## Scope

主要指令责任：不单独认领指令族；交付本票指定的基础、容器或验证行为。

原生证据分配：E2/E4 Shop 逆向前置。

本票按 reverse-engineer-anything 交付目标编辑器的逆向证据，不必等待产品实现。分别追踪初始化、加载、编辑确认与容器序列化，必要时追入随包 Qt；可复用同身份且覆盖本问题的既有证据。反例或影响保存契约的未决问题未解决时，不解除相关实现前置。本修订不改变产品契约或实际游戏运行要求。

关联的 E/R 仅指本票相关代表场景；49–51 交付最终 E1–E7 逆向证据与产品输出比较，52–54 交付实际 R1–R7 游戏回归。按规格的 2026-10-19 用户验收修订，首方、逆向代码事实、有条件推导、合成样本与实际游戏观察分别记录；不将静态分析记成 UI 捕获。

## Acceptance criteria

- [x] 分别追踪空 goods、普通/重复商品及 purchaseOnly 的构造和保存，确认首商品与续行结构。
- [x] 核对标准价/自定义价的加载和确认以及空商店占位，区分 ID 0 占位与普通引用。
- [x] 保留可复核资源身份、代码事实、独立推导和契约反例；不依赖 DSL 生成来证明编辑器路径。

### 共通要求（限本票适用范围）

- [x] 更新验收索引与关联执行结果；不把未执行、阻塞或缺环境记为通过。不修改已接受领域行为来迁就实现或测试，正常原生反例按既定流程回到相关决定。

## Verification

记录目标版本/哈希、资源偏移/长度/解码哈希、实际存在的 REA Evidence ID、代码路径与契约比较。分别核对新建、既有/注入输入、仅容器序列化和参数确认的路径；代码观察、有条件推导与未决时序分别标明，不虚构 UI 捕获。原始首方输出仅留本机仓库外；仓库发布原创结论和复核指针。影响必须实现的保存契约而无法界定的问题保持未解决。

完成后记录实际验证结果，再将本票状态改为 resolved；缺环境、待执行、失败或待复验均不得写成通过。

## Dependencies

- [01：证据索引与最小往返样例](01-evidence-index-and-roundtrip-fixture.md)。

## Sources

- [实施规格](../complete-mv-events-implementation-spec.md)：I4、T3–T4；完整契约与未在本票重复列出的参数规则以规格及其规范附表为准。
- [已确认拆分记录](../ticket-breakdown-draft.md#comments)：本票的编号、范围、阻塞项和专有验收点均按用户确认版本发布。
- [逐参数总索引](../../complete-mv-events/research/command-parameters/index.md)：原生参数覆盖、证据来源与后续已接受修订。

## Outcome and verification

2026-10-19：已完成本票有界逆向路径阅读及原创[报告](../evidence/07-shop-defaults-and-goods-reverse.md)，保留[资源身份](../evidence/07-resource-identities.json)、13个稳定索引项和独立执行记录。未执行编辑器UI、抽出代码、实际写盘、产品或游戏。已核对空/普通/重复商品、purchaseOnly、标准/指定0及999999、重确认与302/605父属结构。

**已解决原契约阻塞**：原生空Shop重载后追加商品的有条件代码反例与原E302禁止混合冲突，初次MV-E07-CONTRACT记录为blocked并保持不改。2026-10-19用户明确回答“接受有限占位变体及有序重复（推荐）”，接受仅精确四零的具名placeholder变体、任意位置、有序混排/重复及唯一占位goods=[]；其它零ID、standard mode0/value非0及原价格/引用域不变。权威05/06 Answer、ADR0011/0012、Glossary、E302、规格I4与本票/47责任已同步。13项追加新的有界通过记录；本票逆向与契约前置完成，47仍须产品实现并满足其它依赖。

证据文档未改变产品或harness行为，无需新建TDD测试。Windows / Node22.23.0 下，既有 `pnpm --filter rpgmaker-event-dsl test -- test/mv-evidence.test.ts -t 'validates the evidence index'` 通过：1passed、2因名称筛选未选中。oxfmt对本票证据/索引/07与47票据及Glossary/ADR的检查与 `git diff --check` 通过；共享历史契约保留原有表格格式以限制无关差异。12份改动Markdown的313个本地链接目标均存在，9个契约来源section均存在。该自动校验确认索引、链接和哈希，不将历史blocked结果覆盖，也不把未执行UI/产品/游戏改成通过。

## Comments

### 2026-10-19 — 用户批准有限Shop Goods Placeholder

用户的原话为“接受有限占位变体及有序重复（推荐）”。本票按已批准语义及既有kind拼写风格确定 `{kind:"placeholder"}`，只描述精确四零结构位置。原始反例和blocked记录保留，新结果只完成已接受契约的同步核对。本票不实现47，不宣称实际编辑器或游戏执行。
