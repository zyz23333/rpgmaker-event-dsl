# MV 1.6.1 逐参数证据：全部移动子指令

研究日期：2026-10-19（Asia/Shanghai）。覆盖原生M1..M45，另说明M0结构终止。对应[逐参数研究](../../issues/11-native-command-parameter-evidence.md)。本文件记录正式表达的已决原则与机械映射、参数事实和必要决策；没有产品实现或真实编辑器/游戏验收。

## 共用路线契约

[地图页](../../issues/03-map-event-page-model.md#answer)和[原生指令](../../issues/05-native-command-contract.md#answer)已经决定共享 `{commands,repeat?,skippable?,wait?}`，commands必填可空，固定Compiler Defaults为true/false/false。原生route对象为list/repeat/skippable/wait；页自主移动与205复用同一形式，非custom页也验证全部保存路线。205目标是Character Runtime Selector，完整参数与上下文见[系统地图分片](visual-map.md#e205--set-movement-route)。

编辑器新建205的布局 Q@665677:44–58为repeat/skippable框架false，wait显式true，与已选共享DSL默认不同；不倒改已决默认，也不把它们报告成编辑器相同初值。route.wait在页自主移动中只是保存配置，在205解释器中才等待路线完成。全部原生boolean保留，不因为repeat会令等待不结束而重写。

本文Q@资源定位法、目标身份与源码解码方法同[共享控件](shared-controls.md)。R为随包 `references/RPGMV/NewData/js/rpg_objects.js`，304315 bytes，SHA-256 `2d43dd9d8974c88a1b82ffa493d6d8a02c4ce1d0dfc8f05e6c0ab731e3f0573e`。runtime源码只是行为依据，不能把其能容忍的任意JSON当正常编辑器形态。

所有核心参数显式给出；引用/素材/脚本遵循ADR0011/0012和真实Workspace候选输入。仅将已经批准的route flags省略；其他初值是事实，不自动成为Compiler Default。无参数kind复用现有合理命名；已决更名包括routeWait→wait、image/index→character/characterIndex、blendMode符号枚举。

## 原生移动记录外壳的待决差异

静态完整链暴露当前简单 `{code,parameters}` 模型无法准确涵盖的正常路径：

| 位置 | 实际首方构造/操作 | 对保存结构的推导 |
| --- | --- | --- |
| 布局新建路线 | Q@665677:36创建只有code0的list | 终止项可以缺parameters |
| 无参按钮 | Q@665677:97–99只创建code | M1..13、16..26、31..40没有parameters键 |
| 有参对话框 | Q@683357:22–23创建code+parameters[]，各对话框随后写槽 | 11种有参命令有精确parameters数组 |
| 插入移动列表 | Q@672838:169–179，读取双方缺失indent并做减法，插入后做+= | 普通创建路径推导出indent:NaN，JSON写出indent:null |
| 205/505 | Q@771946:33–46直接保存list，并将每个非终止子项作为505的唯一参数 | 缺键/indent字段同时进入主list和镜像；不是外层事件indent |
| 最终落盘 | Q@909009:341–383、407–424，嵌套字段未清理 | 缺键与[]不同；NaN属性变null |
| 空白页模板 | Q@346222的默认moveRoute.list含code0和parameters[] | 同一产品已有另一种终止外壳，不可用一种工厂规则覆盖另一种来源 |

这些是本体静态构造/保存路径与JS/JSON语义的推导，尚无本轮原生UI生成文件的观察。对本地 `references/rmmv-test-project/data` 与 `references/RPGMV/NewData/data` 的有界搜索未找到indent:null样本；这一负搜索不能推翻上述路径，也不保证每个UI入口时序相同。

M0不能作为公开用户移动指令重复插入；它是route终止，205不生成其505镜像。R:7192–7210说明repeat/forcing结束和推进索引使用list.length−1。往返应辨别原生终止/镜像，不删除或修复。缺parameters、parameters:[]、indent存在性及终止外壳如何正式表达，是[原生保存形态差异如何进入正式 DSL](index.md#需要用户讨论的保存形态)的待决问题；涉及ADR0009/0011/0012，不在此批准元数据字段或raw route。

## 参数表

以下每节继承上述外壳问题：所有45项参数/行为已经逐项调查，**外壳表达仍待HITL**，不能标为完整实现或完整契约已闭合。参数数值控件域与正常创建保存路径并列；本报告不额外承诺域外非标准JSON。

### M1 — moveDown

正式表达为 `{kind:"moveDown" }`；向下走一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M2 — moveLeft

正式表达为 `{kind:"moveLeft" }`；向左走一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M3 — moveRight

正式表达为 `{kind:"moveRight" }`；向右走一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M4 — moveUp

正式表达为 `{kind:"moveUp" }`；向上走一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M5 — moveLowerLeft

正式表达为 `{kind:"moveLowerLeft" }`；左下斜走。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M6 — moveLowerRight

正式表达为 `{kind:"moveLowerRight" }`；右下斜走。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M7 — moveUpperLeft

正式表达为 `{kind:"moveUpperLeft" }`；左上斜走。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M8 — moveUpperRight

正式表达为 `{kind:"moveUpperRight" }`；右上斜走。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M9 — moveRandom

正式表达为 `{kind:"moveRandom" }`；随机四向走一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M10 — moveTowardPlayer

正式表达为 `{kind:"moveTowardPlayer" }`；接近玩家。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M11 — moveAwayFromPlayer

正式表达为 `{kind:"moveAwayFromPlayer" }`；远离玩家。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M12 — moveForward

正式表达为 `{kind:"moveForward" }`；按当前朝向前进一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M13 — moveBackward

正式表达为 `{kind:"moveBackward" }`；保持原朝向后退一步。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本含可走/受阻位置与skippable开关；不要把受阻等待错误归为没有执行。

### M14 — jump

正式表达：`{kind:"jump",x,y}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[x,y]，两个有限整数，各−99..99；相对位移，不是地图绝对坐标，也不随地图尺寸收窄。

编辑器初值与省略：两个框均未覆盖value，基础0且在域内；不新增Compiler Default。

来源：Q@811221:19–31,44–48；R:6999–7000。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：[-99,99]、[0,0]、[99,-99]；−100/100/0.5、缺槽与多槽拒绝。跳跃实际落点/碰撞另做游戏样本。

### M15 — wait

正式表达：`{kind:"wait",frames}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[frames]，整数1..999，单位帧；与顶层230同名kind可在移动上下文区分，不沿用routeWait。

编辑器初值与省略：Q@687080:25–27显式初值60；frames仍是显式核心参数。

来源：Q@808067:15–30；R:7002–7003。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：frames1/60/999；0/1000/小数、空槽拒绝。runtime写waitCount=frames−1，验证相邻移动的时间。

### M16 — turnDown

正式表达为 `{kind:"turnDown" }`；朝下。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M17 — turnLeft

正式表达为 `{kind:"turnLeft" }`；朝左。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M18 — turnRight

正式表达为 `{kind:"turnRight" }`；朝右。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M19 — turnUp

正式表达为 `{kind:"turnUp" }`；朝上。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M20 — turn90Right

正式表达为 `{kind:"turn90Right" }`；右转90度。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M21 — turn90Left

正式表达为 `{kind:"turn90Left" }`；左转90度。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M22 — turn180

正式表达为 `{kind:"turn180" }`；转180度。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M23 — turn90RightOrLeft

正式表达为 `{kind:"turn90RightOrLeft" }`；随机左转或右转90度。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M24 — turnRandom

正式表达为 `{kind:"turnRandom" }`；随机四向。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M25 — turnTowardPlayer

正式表达为 `{kind:"turnTowardPlayer" }`；朝向玩家。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M26 — turnAwayFromPlayer

正式表达为 `{kind:"turnAwayFromPlayer" }`；背向玩家。没有用户参数。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本检查directionFix开/关及与玩家同格，转向指令仍遵循runtime朝向锁定。

### M27 — switchOn

正式表达：`{kind:"switchOn",switch}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[switchId]；Project Data Reference switchRef，正整数且在最终System开关容量内；无名显式ID允许，None/0不允许。

编辑器初值与省略：GameSwitchBox静态初值1（Q@596373:12），不据此隐式选择开关1。

来源：Q@812520:15–31；R:7038–7040。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：容量内无名槽、边界槽及已命名引用；0/容量外/歧义名称/缺槽拒绝；非custom页中同样验证。

### M28 — switchOff

正式表达：`{kind:"switchOff",switch}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[switchId]；与M27同一引用域，关闭不豁免引用校验。

编辑器初值与省略：与M27相同，不新增默认。

来源：Q@808775:15–31；R:7041–7043。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：M27的正负样本分别在此code运行；不能把switchOff改成switchOn(false)而失去独立原生code。

### M29 — changeSpeed

正式表达：`{kind:"changeSpeed",speed}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[speed]；整数枚举1..6，对应1/8、1/4、1/2、1、2、4倍的UI标签。

编辑器初值与省略：Q@602267:16–21，indexOffset1/currentIndex3，静态初值4；speed仍必填。

来源：Q@806586:15–29；R:7044–7046。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：逐一1..6；0/7/1.5拒绝；保存后检查运动速率，runtime不自行证明域外有效。

### M30 — changeFrequency

正式表达：`{kind:"changeFrequency",frequency}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[frequency]；整数枚举1..5，自主移动频率。

编辑器初值与省略：Q@620945:16–21，indexOffset1/currentIndex2，静态初值3；frequency必填。

来源：Q@814312:15–29；R:7047–7049。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：逐一1..5；0/6/1.5拒绝；自主移动与强制路线分开验证，不将频率解释成速度。

### M31 — walkAnimation On

正式表达为 `{kind:"walkAnimation",enabled:true }`；开启步行动画。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M32 — walkAnimation Off

正式表达为 `{kind:"walkAnimation",enabled:false }`；关闭步行动画。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M33 — stepAnimation On

正式表达为 `{kind:"stepAnimation",enabled:true }`；开启踏步动画。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M34 — stepAnimation Off

正式表达为 `{kind:"stepAnimation",enabled:false }`；关闭踏步动画。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M35 — directionFix On

正式表达为 `{kind:"directionFix",enabled:true }`；锁定朝向。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M36 — directionFix Off

正式表达为 `{kind:"directionFix",enabled:false }`；解除朝向锁定。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M37 — through On

正式表达为 `{kind:"through",enabled:true }`；开启穿透。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M38 — through Off

正式表达为 `{kind:"through",enabled:false }`；关闭穿透。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M39 — transparent On

正式表达为 `{kind:"transparent",enabled:true }`；开启透明。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M40 — transparent Off

正式表达为 `{kind:"transparent",enabled:false }`；关闭透明。enabled为必需boolean；开/关分别映射本节code，不是原生参数槽。原生无参数，新建按钮路径只创建code，不生成parameters；外壳差异见下节，不应未经决策统一补[]。

来源：Q@665677:76–99；runtime R:6953–7095的对应分支（code常量R:6841–6886）。不含项目/素材引用；按已定规则递归检查所在route。无Compiler Default或None值。验收每个code分别创建、保存、反编译并重编译；嵌套记录外壳必须保留。合成额外参数/未知字段须准确诊断（原生indent:null例外待决），不能raw。游戏样本按true→false及false→true验证状态切换，不能只断言编译code。

### M41 — changeImage

正式表达：`{kind:"changeImage",character,characterIndex}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[characterName,characterIndex]；character是characters目录Asset Reference或null（编码空串），index整数0..7；两个字段独立保存。None/大人物图时非0 index仍保留。

编辑器初值与省略：Q@8723218:24–25基础空名/index0；Q@641925:15–16按4×2划分。不得因此省略必需字段。

来源：Q@809506:21–33；Q@641925:20–36；R:7080–7082,6660–6664。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：None+index7、大图+index7、普通图0/7；空Asset Reference、错误目录、index−1/8/小数拒绝；图名不重写index。

### M42 — changeOpacity

正式表达：`{kind:"changeOpacity",opacity}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[opacity]；整数0..255。

编辑器初值与省略：Q@807260:19–21显式255；opacity必填。

来源：Q@807260:24–34；R:7083–7085,6319–6320。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：0/1/254/255；−1/256/小数拒绝；透明开关和opacity不同，分别运行。

### M43 — changeBlendMode

正式表达：`{kind:"changeBlendMode",blendMode}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[blendMode]；正式符号normal/additive/multiply/screen分别0/1/2/3，固定枚举，不用任意number。

编辑器初值与省略：Q@815006未覆盖ComboBox索引，首项normal是框架候选初值；本研究未执行首次确认，字段仍必填。

来源：Q@815006:15–33；Q@916501:253–258；R:7086–7088,6327–6328。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：四模式逐一保存及运行；−1/4/小数/未知符号拒绝。

### M44 — playSe

正式表达：`{kind:"playSe",audio:{asset,volume,pitch,pan}}`，上述字段必需（字段列表为schema说明，不是可执行例子）。原生p=[{name,volume,pitch,pan}]；正式asset为se目录Asset Reference或null，分别编码原生name字符串或空串；volume整数0..100、pitch整数50..150、pan整数−100..100。每个独立保存，不因name=None清空其余值。

编辑器初值与省略：Q@642887:13–16显式空名/90/100/0，参数控件:59–87；本研究不新增可省略默认。

来源：Q@813249:20–39；Q@618109:248,260–264证明None；R:7089–7091。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：None+volume17/pitch73/pan−41，四个字段全端点与非步长倍数；缺键/多键、错目录、范围外/小数拒绝。None实际静音行为与停止所有SE分开。

### M45 — script

正式表达：`{kind:"script",script}`，上述字段必需（字段列表为schema说明，不是可执行例子）。p=[code]；Script Input编译成一条完整字符串，允许空串，不能套355/655的12条物理记录限制；Script Command Gate完整递归。

编辑器初值与省略：Q@810345无显式text，空串基础值；script字段必填，空脚本仍受Gate。

来源：Q@810345:15–37；R:7092–7093。数值整数基类的证据见[共享控件](shared-controls.md)，只在上层未覆盖时适用。参数数目为本节完整槽数；原生额外indent外壳按待决事项单独处理。

最小验收候选（未执行）：空串、空白、CR/LF原样输入、正式Script Input不同形式、Gate开/关；非字符串产物/缺槽拒绝。LF可保存性按单槽文本边界票处理，不拆成多移动记录。

## 资源身份

| offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| ---: | ---: | --- | ---: | --- |
| 346222 | 2617 | zlib | 11436 | `52fd4ca2a3f178712d94467c5770919cf716882e2ebc9a57bde0a963e9447165` |
| 596373 | 2004 | plain | 2000 | `5aaba3b55a3d310b69dd2cb833cf8a864b6785eff31f868a927134c814d7f9a8` |
| 602267 | 521 | plain | 517 | `36f300fe57216b5d2e8cc8b95cdec472db04555aafe2ce3c7e79b39100144606` |
| 618109 | 2836 | zlib | 11083 | `2cd5a2d9b73ad52c3ebdd45e1d4ab228fe6adc05e1644be90bc29ceda2d28c36` |
| 620945 | 496 | plain | 492 | `a79b3da1057059bdb7073a5e79c2538eaefcf9b00c9c463e51fb7ac3b74b86cc` |
| 641925 | 962 | plain | 958 | `e04e2333308248a392de8783ebfa3a044d0d722963f3f8990cada25715441e29` |
| 642887 | 1036 | zlib | 3992 | `7134ca5457bfe1299b890ffb4c5be2eb28ec53c8029c503e9c00fd606f34f777` |
| 665677 | 992 | zlib | 3578 | `199459336be17ccb510d1912ef53648342e8903ea95d84b59275f6bcbf4b135e` |
| 672838 | 1325 | zlib | 4997 | `2180bf600ca5a34ebbf35f65a343ca95be10055e3abcc7561efd5bc4fab8f51e` |
| 683357 | 528 | plain | 524 | `5f8ef1afae81820acbf38a4160b725efee36476bc6c555576f3b15796e9340ce` |
| 687080 | 1484 | plain | 1480 | `b84f75ac9894c217b6422a996f2c26f712ba95a3688eaea4d0190a97018205d3` |
| 771946 | 1393 | plain | 1389 | `95cf5319c62eeacfbea61afa69a05be5d5788e5b795f34f776a791adcab44615` |
| 806586 | 674 | plain | 670 | `66bdf50a2c8bc37b37e902c011e6c28df349be085a0ed06a96d166fd667697c5` |
| 807260 | 807 | plain | 803 | `dcad8a81a8a3318af1b9f79f1e3d1b574684badddd44a20de5090c93d6e3a5b8` |
| 808067 | 708 | plain | 704 | `a7a02f3ae66eb20bdfc9339a9835fedb46fcc8c589de3bda2d672866b57f53a3` |
| 808775 | 731 | plain | 727 | `f3bcab3e4d31dd83999dce6a0c04a21c21e62a98ac48828e8b26bc489e9d7301` |
| 809506 | 839 | plain | 835 | `6d6642b9de5258304ef89df986e562bd499bfb446e5dff22f059e5e3f71d46de` |
| 810345 | 876 | plain | 872 | `1feccbc5052474e0cabc0470d0a5c82d1c20b0ea27e5b7b0e4a95d4edc2b257e` |
| 811221 | 1299 | plain | 1295 | `d1822b652c597f6a06cf1fd343a3b731047942e17bad8aee49e6ee4b079fa033` |
| 812520 | 729 | plain | 725 | `509fd97d93f2955995cbf0c008a1d1718eb9e7f6cfeb5b0a61b0227c01d4c734` |
| 813249 | 1063 | plain | 1059 | `63fdec340ab13fe0c143552d98ef6645b1c26bbfcff5806f1bda1e4cf50b7292` |
| 814312 | 694 | plain | 690 | `ff6e7988ad12b987c0a523b181915773436e3c5879a7e29c9f2b5beaa893309f` |
| 815006 | 845 | plain | 841 | `cbd7eac1252d5f9e7f2a45c296544947901df3e33323b1e94960fc352bec48e9` |
| 8723218 | 691 | zlib | 2310 | `c83f4c1884a4bf3cbbd5564e84bc9ae1677561a6d21421b13a0bdbd3f074808e` |
| 909009 | 4291 | zlib | 24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |
| 916501 | 5142 | zlib | 25783 | `b29ba19e1bd5ed04e2334aab57ddcbf386331dbe136751c77f05f47a9e35edd2` |

## 验收交接

- 每个M1..45至少一个原生创建样本；所有11类参数化命令覆盖上述端点与拒绝候选；合成异常不能冒称原生可创建样本。
- 空路线、单无参、单有参、多命令、copy/paste/替换、页自主路线及205路线分别保存，比较parameters键、indent与M0外壳；205/505必须深比较且不包括终止镜像。
- 非custom页保存的script与switch/image/SE引用照常检查；Gate关闭、容量外、素材缺失产生准确诊断。反编译仍能生成完整源码，compile/check按已定Gate行为拒绝。
- 游戏样本覆盖repeat/skippable/wait组合、受阻移动、跳跃、帧等待、朝向锁定、None image与SE、速度/频率区别；不得用runtime“可运行”替代保存结构相等。

实际执行环境、证据责任与实现顺序交[完整性验收](../../issues/08-completion-evidence-and-sequencing.md)讨论；本报告所有样本仍未执行。
