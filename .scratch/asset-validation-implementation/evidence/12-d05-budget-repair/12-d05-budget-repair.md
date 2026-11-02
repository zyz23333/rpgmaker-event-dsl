# Ticket12 D05 incomplete 局部预算修复

本轮只修复既有 `AV.D05.incomplete.native.case.expected` 的测试注册预算。`createAssetTest` 增加可选 `timeout?: number` 并传给 Vitest；D05 incomplete 传入 `30_000`，同循环另外三个分支传 `undefined`，其他既有调用仍省略该参数。Vitest 4.1.9 原安装实现中，省略与 `undefined` 都不设置 `options.timeout`，随后使用 `options.timeout ?? runner.config.testTimeout`，所以它们继续使用未改动的默认10秒。默认 `maxWorkers: 2`、TEMP、source入口、产品实现、政策及 Compile Contract `mv-1.6.1/40` 均保持。

原始完整 source `pnpm check` 冻结于 `af748ee5067f41096a296a79f81b078415096606`，自然退出1：103文件中102通过／1失败，3409测试中3408通过／1失败，唯一失败为 D05 incomplete 的 `Error: Test timed out in 10000ms.`，runner记录10037ms。该次 helper 最终于 `2026-11-02T13:27:08.936Z` 完成，耗时11547ms；其“passed”只表示超时后业务体最终完成，不能替换 runner 的失败结果。原始日志、完整 command-history 与 incomplete 原回执按原字节封存，见 [red 与原件 hash](red-and-baseline.json)。

修复代码／测试冻结于 `154ad2cd30cf07d254ab17a819e4181ae2a95b79`。仅运行四个既有 D05 source ID，实际 runner 退出0：4通过／0失败，99个注册中另外95个仅被过滤，不计通过。incomplete 的 runner 时长13478.5886ms，另三个分支分别约1074.30／483.05／485.28ms。typecheck、lint、format:check 均退出0。Windows10.0.19045、Node22.23.4、pnpm10.33.0、默认2workers、默认 C TEMP；无全局 timeout／worker／入口／TEMP覆盖。没有运行99项完整诊断 suite、103文件完整 source、built或Windows baseline。

- [机器合册](12-d05-budget-repair.json)：准确命令、四个新source回执、六个真实子进程结果、全部raw原件的字节数和SHA256。
- [实际命令记录](raw/green/command-history.json)与[原始source runner](raw/green/source-d05-runner.json)：实际退出、耗时及95个过滤项。
- [AST保留审计](ast-preservation-audit.json)：64个诊断 callback 全部一致；只移除新增外部timeout参数后，整个诊断文件AST一致。helper只移除可选参数／转发后整个AST一致，包含finally与回执内容的完整异步体未变。
- [实际回执](raw/green/current-source-receipts/AV.D05.incomplete.native.case.expected.source.json)：仍为20个输入对象；三组sibling×API／CLI共六个真实子进程均退出1并保留预期诊断。`independentlyDeterminableExceptions` 原文、子进程stop的finally、状态断言、业务输入和断言均未改。新旧运行的callback AST一致；literal input按原值／顺序比较，仅实际fact路径按各自临时Game根下的同一相对目标比较，raw不重写。

旧 `12-exception-acceptance.json`、说明及 `12-run-history` 共31份历史文件的工作树字节与Git blob均核对保持，原Contract37签收和旧Outcome保留。本次是独立追加的预算修复证据。12在记录该局部green后恢复resolved；17保持claimed，后续完整验收责任仍由17承担。纯证据checkpoint合入只做身份／原件审计，不重复产品运行。
