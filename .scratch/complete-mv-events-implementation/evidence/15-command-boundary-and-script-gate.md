# Ticket15 — finite raw boundary and recursive Script Command Gate

本票从集成 `0262a29fcdab5af12888548bdf69f01fa275ff31` 开工，产品实现提交 `fb36525`，随后合入17与18（最后 merge `1665036`，含集成 `c744972`）。18拥有的输入捕获与发布前复查保持有效，新的验证及输出语义将唯一 Compile Contract Version 从 `mv-1.6.1/1` 递增到 `/2`。

## Delivered boundary

未知事件 code 仅在完整自有外壳、严格 JSON 参数和合法上下文下保留为单记录 raw，并给 `MV-UNKNOWN-COMMAND` 警告。未知 payload 的语义不解释。原生 code/indent 必须为非负安全整数且不能是负零；参数中的有限 JSON 负零则精确保留。严格 JSON 拒绝 undefined、洞、NaN/Infinity、函数、symbol、bigint、访问器、不可枚举或符号属性、额外数组属性、自定义原型和循环；共享但不循环的对象可保留。字符串不规范化 CR/CRLF，空数组、空对象、null、自有 `__proto__` 键和完整顺序均保留。稳定 JSON 输出显式写 `-0`，受限求值器仅增加字符串字面量 computed key，不执行任意 JS。

已知正式命令和手写 raw 在编译后共用结构、可识别参数、固定引用和 Gate 边界。完整原生列表缺失/null/空、孤立或错误缩进续行、错误分支、缺少空 Child Command Body 标记、冲突102/402或205/505镜像均明确失败。102/402比较完整保存文本和有序索引，205/505比较完整镜像对象及键存在性；诊断给 expected/actual 和所有者相关位置。原始输入没有对应编译记录时仅声称真实 DSL 位置，不伪造 `list[0]`；Map Page 的 primary/related nativePath 均包含真实页号。

Gate 逐条扫描物理记录中的355/655、111的script条件、122的script operand、205路线M45、505镜像M45，以及Page的保存路线。空字符串、不可达代码及非custom保存路线均不能绕过。关闭Gate的Decompile生成源码并给warning，Compile/Check对实际当前声明给error；旧Snapshot仍有脚本不阻止已删除脚本的当前源码。已知raw没有豁免。内部Command Origins把嵌套编译记录关联回真实DSL位置；稳定诊断包含code/stage/level/identity以及适用的nativePath/dslPath。

## Minimum Page carrier

为保存并门控非激活路线，经协调提前从24提升最终接受的 `movement?: { type?, speed?, frequency?, route? }` 最小载体。type为fixed/random/approach/custom且默认fixed，speed为1..6默认3，frequency为1..5默认3，route复用14共享Movement Route及默认。undefined表示省略，null拒绝。非custom保存路线仍完全保存、验证引用并受Gate约束；Page路线的wait是保存值，其interpreter等待语义由Set Movement Route使用点决定。

这不签收24的完整Page配置，23/24仍负责完整Page外壳和所有字段。为兼容已有最小独立fixture，四个原生movement字段全缺失时当前Decompile保持undefined；完整Page输入严格性仍归其容器票。

## Independent input and actual Workspace seams

夹具为原创独立原生字面量 `packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/command-boundary-cases.json`，由测试读取后作为输入，不从待测编译器生成expected。CommonEvents含未知999、own `__proto__`、嵌套负零/null/空容器/CRLF、空355/655、script条件、script变量operand以及205/505路线；Map含fixed Page保存脚本路线、speed6/frequency1、null/zero/absent movement envelopes、switch引用及外部plugin字段。

五个Workspace测试实际执行Clone、CLI Decompile、Definition Source Discovery、TypeScript验证、受限AST求值、Check、Compile与Diff，并完整比较CommonEvents和Map。把生成源码的未知999改成已知230后，实际CLI/API拒绝错误参数；恢复源码又得到完整独立预期。失败比较源码内容、真实Discovery集合、Project Root data、完整Snapshot、Generated data及Sync Manifest的原始字节。原生坏外壳、坏参数、冲突镜像及保存路线缺引用在首次写源码前失败。另有真正的Common1调用Common2，以及直接/别名 `__proto__` Named Event Export用例。

## Red before green

四个边界由协调者只读静态笔记提示，随后实现者在公共入口实际复现并修复。静态笔记自身不是执行报告；早期红灯原始工具输出未另存为机器记录，不补造旧revision/source fingerprint。

| Observed original failure                                        | Executed regression entry                                                                                       | Final correction                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 实际Common1→117[2]，Common2存在，Decompile仍报目标不存在         | command-boundary-workspace: `decompiles valid Common Event calls against the complete Snapshot owned candidate` | Decompile完整候选建立自身Common身份scope；普通Compile仍只用实际声明 |
| `export const __proto__` 及export alias经真实Discovery后声明消失 | command-boundary-workspace: `collects own __proto__ named exports and aliases through real source Discovery`    | export bag改为null原型，保留自有导出名                              |
| Array subclass实际自有参数[1]通过验证，迭代器却令编译输出[2]     | command-boundary: `rejects misleading array prototypes and negative zero in the known movement terminator`      | 严格JSON的数组也拒绝自定义原型，复制前失败                          |
| 路线末尾code:-0被识别为M0并重新编译成+0                          | 同上，用两种终止参数键形态                                                                                      | 已知M0结构代码拒绝负零；未知raw payload负零继续保留                 |

最后的诊断精确化新增三个独立回归：raw第二项前置失败不冒充native第一项、Page镜像双方含页号、Page movement访问器在读取前拒绝。第一次完整复验250/251通过，唯一失败是旧Loop断言仍要求前置raw错误伪造native位置；更新为真实 `commands[0]` 定位后重跑完整套件。此失败是预期路径更新，不能记作新的产品漏洞。较早混合代码测试在运行中合入17导致manifest版本错配，该轮也不计通过。

## Bounded remaining family obligations

本票提供当前已可识别家族的参数数量/类型、部分枚举/字段及引用共用入口，不代表全部105+45家族完整参数矩阵。合法但当前模型无法无损表达的已知保存变体以 `MV-COMMAND-UNSUPPORTED` 明确失败，后续责任票应正式建模而非把它们视作领域禁止：

- Timer Stop独立保存第二槽：26。
- None face image独立非零index：29/44。
- 非空非Loop Child Command Body尾标记：27/28/46。
- Choice cancel branch独立cancelType和空消息头保存形态：27及对应文本家族。

本票不签收S5/S6、最终E1–E7比较或R1–R7游戏回归。Gate的原生脚本行为仍分配28/30/31/33；15没有独立native场景，全部新记录 `native: not-executed`、`nativeGroups: []`。

## Verification

最终产品提交 `5816a3a`，Windows / Node22.23.0、pnpm10.33.0：

- `pnpm typecheck`、`pnpm lint`、`pnpm format:check` 全部通过。
- 完整源码回归：26 files / 251 tests全部通过，79.52s。原始报告 [15-full-vitest-report.json](15-full-vitest-report.json)。
- `pnpm build` 成功，Node22实际CLI/API及声明文件均生成。
- 构建后的Windows baseline：5 files / 26 tests通过，40.24s，覆盖真实锁竞争、Snapshot binding、编译输入捕获和CLI/junction。原始报告 [15-built-windows-report.json](15-built-windows-report.json)。
- 构建后的本票五个Workspace用例：1 file / 5 tests全部通过，13.15s。原始报告 [15-built-boundary-report.json](15-built-boundary-report.json)。
- 追加8项要求和8份不可覆盖的passed记录后，完整索引/schema、来源、夹具、执行记录及独立基础往返：1 file / 3 tests通过，3.48s；索引从143项增至151项。

源码回归和built回归均使用相同产品及测试字节，仅在构建时生成dist。机器结果由 `15-record-acceptance.mjs` 验证上述三份真实报告及所链接用例均通过后追加；每条记录包含完整产品/测试/dist文件指纹、独立fixture哈希及报告哈希。保留既有17/18要求和结果的并集，没有覆盖旧失败或把静态提示签成执行证据。README、包README、示例和Agent Event Authoring Skill的event-patterns指南均同步当前raw/Gate及Page movement API。
