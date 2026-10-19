# 26 — Timer 完整保存槽位实施记录

## 当前开发边界

本记录对应独立分支 `codex/mv-ticket-26`，起点为实际集成 `205334338d8e64e3d00e485849c9ddf67bd7e3b1`。05/23 已 resolved，已有 274 个 requirements。此处为 DEV / focused checkpoint，26 保持 claimed；未运行全量 check、build、built Windows baseline，未增加最终 Compile Contract 版本，未标记 READY。最终化等待33、36及协调队列，随后合并实际最新集成并重新验证受影响部分。

实现遵循已接受的 E124、12 Answer 与 ADR0015。编辑器验收采用用户已批准的 REA；本票分配 E4，没有独立游戏组。最终 E4 产品比较与52–54游戏回归分别负责；此处 source 聚焦通过不表示这些验收完成。

## 产品行为

- Start 必填 seconds，精确生成 `[0,seconds]`。Stop 省略或显式 undefined 生成 `[1]`，显式0/83分别生成 `[1,0]`、`[1,83]`。
- 有值 seconds 为整数0..5999，保留数字负零。反编译使用已有精确字面量渲染，Stop存在的0不省略。原生 action 为分类编码0/1，负零拒绝。
- helper在选择字段前验证有限自有数据外壳，拒绝未知字段、访问器和非普通对象；编译器再次检查直接导出的正式对象。原生与已知 raw 共用命令族槽数、action及seconds规则。
- raw错误从原生位置映射到DSL时保留参数后缀，例如 `commands[0].parameters[1]`，不丢到整条命令。未放宽共享数值校验器，也未修改其他指令族值域。

## 公共边界与独立预期

[聚焦测试](../../../packages/rpgmaker-event-dsl/test/timer-workspace.test.ts)使用独立 [Timer保存数组](../../../packages/rpgmaker-event-dsl/test/fixtures/mv-evidence/timer-saved-slots.json)，并复用已存在的原创完整Map/Troop默认夹具。预期不来自待测编译器。真实Workspace包含全部14个标准数据库文件和Map001，共15个carrier。

测试实际执行Clone、Decompile、Discovery、发布源码求值、Check、Compile、Diff与Push；通过修改Common/Map名称和Troop拥有的Comment验证写回已发生。完整比较15个carrier，保留外部carrier数据；Check和失败路径比较配置、源码、Discovery、Project Root、Snapshot、generated、manifest完整业务状态。空的候选隔离父目录没有业务内容；其中任何子文件继续进入比较。

13条新增自动化requirements分别为：

- `MV-S6-TIMER-001`：正式Stop省略/undefined/0/83与Start边界。
- `MV-S6-TIMER-002`：独立原生数据在三容器及完整15个carrier往返和安装。
- `MV-S6-TIMER-003`：seconds负零在实际生成源码、正式Start、已知raw Stop及三容器完整安装中保真。
- `MV-S6-TIMER-004`：helper与直接正式对象的域外seconds错误及不变状态。
- `MV-S6-TIMER-005`：三容器原生seconds在发布前给出精确阶段、身份和参数路径。
- `MV-S6-TIMER-006`：公共helper的未类型化类型、范围、外壳及访问器拒绝。
- `MV-S6-TIMER-007`：原生与实际loader已知raw的槽数、类型、范围、action一致拒绝及参数路径。
- `MV-S6-TIMER-008`：命令编译拒绝undefined、稀疏洞与非有限参数，保留原输入描述符。
- `MV-S6-TIMER-009`：结构类型局部const的额外字段在helper前校验，不被先行删除。
- `MV-S6-TIMER-010`：实际loader局部未类型化值的缺字段、类型和数值校验。
- `MV-S6-TIMER-011`：实际loader的undefined已知raw槽在Check/Compile前拒绝。
- `MV-S6-TIMER-012`：合法已知raw的三容器完整往返与Push。
- `MV-S6-TIMER-013`：公共类型要求Start秒数及合法action/seconds类型。

## Red → green 与历史维护

每次原始输出保存在 [26-history](26-history/README.md)，包括失败；首方编辑器、runtime、引擎源码、数据、资产与截图未纳入Git。

1. Stop公开类型不接受seconds，实际loader失败；补类型/helper及编译映射后通过。
2. 原生Stop `[1,0]`不能正式反编译，Map精确位置报不支持；补显式保存槽后，三容器完整15个carrier通过。
3. 原生seconds `-0`被插值输出成0；改精确literal后完整源码与Push保真。
4. helper与直接正式对象的6000在Check被接受；补有限正式校验后一致拒绝。
5. 原生6000仅在后续源码求值失败，缺少原生阶段/身份/路径；补族原生校验后发布前精确拒绝。
6. raw参数错误仅剩`commands[0]`；保留原生参数后缀后精确定位。

真实测试前提错误也保留：初次未安装依赖；原测试漏声明已有System Switch导致预期/Destructive门槛错误；Diff完整/short文案混淆；期待数据共享数组引用导致误向Common/Map添加Troop Comment；误把raw helper当作参数校验终点。它们分别修正测试前提，不记为产品反例。

相关回归曾捕获新校验器间接引用导致的模块循环，已改为族内有限外壳检查而解除。旧测试把 `[1,83]`列为“当前未表示”以及只检查命令级raw错误位置，是被本票细化的当前预期；原要求行与历史captured结果保持原字节，旧Timer保存义务由新增完整正例承接。

## 聚焦验证

Windows / Node22.23.0，原Vitest2workers与期限保持。首次完整聚焦Timer60例通过；随后Timer、command-boundary、events、decompiler和architecture共5文件91例通过。包类型检查通过。最终checkpoint的复核输出及原始结果清单在history；source运行的结果明确标识entry，不能作为built结果。

末次Timer与证据索引2文件63例通过；追加E4待执行行后，索引单例再次通过。末次包类型检查、改动TS的lint均退出0，lint无输出。累计归档120个自动化source通过结果及29个原始日志，requirements共288行（原274深度相等，追加13自动化+1待最终化E4）。2,722个原历史文件与原README前缀逐字节一致。DEV产品源文件指纹为`f4d381676efe01adffd0de7c39700148987bdd92f29af7f57f6f73ff2cdf22b4`（97文件，真实dirty基线保留）。没有候选dist或最终契约版本身份。

## E4 产品比较（待 finalization）

`MV-S6-TIMER-E4-COMPARE`尚未执行。最终化须使用实际候选build输出，对照[05逆向报告](05-timer-stop-reverse.md)的同身份资源事实及独立数组，比较新建Stop、已保存Start0/83改Stop、Stop重确认和仅容器序列化的完整保存结果。05为有边界静态证据，不能冒称编辑器UI或磁盘捕获；本票的source合成数组不是原生创建实测。检查身份metadata、所有受影响产物及最终契约版本后，才可登记实际E4结果与resolved。
