// Evidence-only final narrative generation; never grants maintainer approval.
import { readFileSync, writeFileSync } from "node:fs";
const prefix = ".scratch/asset-validation-implementation/";
const evidence = prefix + "evidence/";
const runtime = JSON.parse(readFileSync(evidence + "17-current-runtime-audit.json"));
const joined = JSON.parse(readFileSync(evidence + "17-final-canonical-evidence.json"));
if (runtime.runtimeCallbackSyntaxDifferences.length || joined.cases.length !== 1209 ||
  runtime.commands.length !== 4 || runtime.commands.some((row) => row.exitCode !== 0)) throw new Error("Final validated evidence missing");
const source = runtime.commands[1], built = runtime.commands[3];
const path = evidence + "17-integrated-acceptance.md";
let text = readFileSync(path, "utf8");
text = text.replace(/^当前为\*\*进行中的技术验收[^\n]+/mu,
  `本次**技术证据已齐备，完整命令全部通过**；票17保持 \`claimed\`，最终Standards／Spec独立评审与维护者实际确认仍待主任务完成，未取得或代填批准。最终执行冻结为 \`${runtime.executionFreeze}\`，集成基点 \`${runtime.integratedBase}\`，Compile Contract \`${runtime.compileContractVersion}\`。1,195项自动化义务均有本次源码／构建后实际通过收据，14项原生义务的原始实际观察已逐项复核。03／04／06／09／16及17-support补修已集成；Contract39取消与c5 Contract40完整check六失败历史分别保留，不能写成通过。`);
const seconds = (row) => ((new Date(row.completedAt) - new Date(row.startedAt)) / 1000).toFixed(3);
const table = ["<!-- final-command-results -->", "本次原样完整命令及自然结束结果如下；时间均为UTC。源码与Windows总结没有失败、跳过或过滤。", "",
  "| 命令 | 开始 → 完成 | 实际结果 | 原始输出 |", "| --- | --- | --- | --- |",
  ...runtime.commands.map((row) => `| \`${row.command}\`${row.label.startsWith("00") ? "（setup）" : ""} | ${row.startedAt} → ${row.completedAt}（${seconds(row)}秒） | exit0${row.tests ? `；${row.testFiles.passed}文件／${row.tests.passed}测试全部通过；${row.receiptCount}条素材回执` : ""} | [${row.label}](17-raw/${row.label}.log) |`), "",
  `[当前运行逐项审计](17-current-runtime-audit.json)核对${runtime.frozenInputs.length}项受保护源码／测试／配置输入、${runtime.builtArtifacts.length}份实际构建产物和两次构建的完全相同字节。两个入口各有${runtime.counts.sourceReceipts}条实际完成素材收据：1195 canonical、39活动原补充ID、7设备名补充ID；全部通过。source／built是执行轴，补充样例不增加义务。原D09退休formal标识没有再次注册。`, "",
  `[最终1209项总索引](17-final-canonical-evidence.json)把独立计划、责任、原始证据、当前源文件哈希、唯一callback、模板参数的实际渲染值、输入对象哈希及本次source／built收据逐项连接。${runtime.counts.uniqueSourceCallbackDefinitions}个唯一callback定义与实际Vite序列化函数的语法形状一致；仅去除TypeScript语法、格式和Vite导入／import.meta包装，以及经Git确认目标的动态导入.js→.ts解析，保留其他字面量、运算符和控制流。未解释差异为0。原始完整输入与断言正文仍在各自原JSON中，不依赖族名或总数代替实例。`, "",
  "[最终工件清单](17-final-artifact-manifest.json)保存所有17当前／历史原始回执、日志、审计程序、机器结果、正文和票17的长度、SHA256与预期Git blob。提交后另运行Git逐字节验证，结果写入`17-final-git-verification.json`；该结果不构成维护者批准。", "<!-- /final-command-results -->", ""].join("\n");
text = text.replace(/<!-- final-command-results -->[\s\S]*?<!-- \/final-command-results -->\n*/u, "");
text = text.replace("首次真实运行完整保存在", table + "\n首次真实运行完整保存在");
text = text.replace("该工件的当前完整执行字段仍待后续最终命令，不能从原历史passed推断当前版本passed。",
  "该工件保留原始审计时的待运行字段；当前执行连接见独立的最终1209项总索引，不能从原历史passed推断当前版本passed。");
text = text.replace(/^尚需：本次冻结[^\n]+/mu,
  "本次技术验收未留未执行的必验项、未解决反例或环境限制。仍需主任务完成最终Standards与Spec双轴独立评审，并由维护者实际审阅确认。维护者确认前，本票不能设为resolved；本报告和机器索引均未代填批准。");
writeFileSync(path, text);
const issuePath = prefix + "issues/17-integrated-acceptance.md";
let issue = readFileSync(issuePath, "utf8");
if (!issue.includes("Status: claimed")) throw new Error("Ticket17 must remain claimed");
for (const start of ["按已确认责任分配表审计全部实例", "对当前集成实现核对完整根", "核对公开说明、例外示例", "按已确认的 97 族责任表逐实例核对回执"])
  issue = issue.replace("- [ ] " + start, "- [x] " + start);
const marker = "- 2026-11-02：最终技术证据冻结";
issue = issue.split("\n").filter((line) => !line.startsWith(marker)).join("\n").trimEnd() + "\n";
issue += `${marker}\`${runtime.executionFreeze}\` / Contract40，集成基点\`${runtime.integratedBase}\`。原配置Windows／Node22／默认C TEMP下setup build及\`pnpm check\`、\`pnpm build\`、\`pnpm --filter rpgmaker-event-dsl test:windows-baseline\`均自然exit0；check实际${source.testFiles.passed}文件／${source.tests.passed}测试，Windows实际${built.testFiles.passed}文件／${built.tests.passed}测试，无失败／skip／过滤。两个入口各1241条素材回执（1195 canonical＋39活动补充＋7设备名补充）全部通过。97族1209项义务逐项连接，14原生项复核原始真实运行，不声称17重跑原生。原断言保留审计覆盖2528个原回执位置／208版本对；09标题2→1、16严格CURRENT断言及记录值39→40、legacy final-review严格CURRENT断言／标题／sandbox三字符串38→40分别登记。历史23及全部stale／fresh／Check不升级断言保留；局部完整流程预算调整不代表产品性能修复或对旧timeout的因果解释。原失败／pending／过滤／原生反例均保留。452份原补修工件及85份support原raw、03旧F07尾和04／06说明已核验。详见[技术验收](../evidence/17-integrated-acceptance.md)、[最终逐项总索引](../evidence/17-final-canonical-evidence.json)及[当前运行审计](../evidence/17-current-runtime-audit.json)。本票保持claimed，最终双轴独立评审与维护者实际确认由主任务处理，未代填批准。\n`;
writeFileSync(issuePath, issue);
console.log(JSON.stringify({ executionFreeze: runtime.executionFreeze, ticket17: "claimed", source: source.tests, built: built.tests, maintainerApproval: null }, null, 2));
