# MV 1.6.1 共享控件与保存链证据

研究日期：2026-10-19（Asia/Shanghai）。对应[原生指令逐参数契约还缺哪些证据](../../issues/11-native-command-parameter-evidence.md)。本文只记录首方资源与原生反编译事实，不增加 DSL 默认或宣告真实运行验收通过。

## 目标身份与方法

- 编辑器：`references/RPGMV/RPGMV.exe`，19,595,264 bytes，SHA-256 `1b7d685fd302505b104f51cc539e2d6c997b5164d4a6a55e745283536503d281`。版本1.6.1.0/1.6.1复用REA PE证据 `ev_007ba386e622855bf771049084c3103afebbcc6b5d813f18c441f3ecf1d16d24`。
- 此次实际交给 Ghidra 的目标为上述安装随附的 `QtQuick/Controls/qtquickcontrolsplugin.dll`，x86 PE，780,288 bytes，SHA-256 `a89c9bcd4fc6b18725ccfb155d770c2a4467de15f52350d3e1ba5920aaaff6a6`。不是另一个安装的 Qt，也没有将对 DLL 的分析冒称为完整逆向 RPGMV.exe。
- REA provider 为 Ghidra 12.1.4，JDK 21.0.8，analysis profile digest `e4be421d1cb130970e81b108d97068b73c12565909b409a13178a5c07539573b`。使用只读字符串、交叉引用、函数伪代码；原文件未改写，编辑器/游戏未启动。
- EXE及DLL嵌入QML由普通 fs/zlib/crypto 只读解码。每个record验证4字节大端长度、解码长度和压缩输入消费边界，保留解码SHA；没有执行提取的JS/QML。Q@offset:line是零起始文件偏移和一基文本行号，不冒充已恢复qrc路径。recipe见[先前保存研究](../editor-serialization.md#可重复核对不执行目标代码)。

## SpinBox 的继承值确实来自随包实现

证据链为：编辑器 LabeledSpinBox Q@8796406:8–12 → 包装 SpinBox Q@875471 → Qt DLL嵌入 SpinBox QML @160589 → SpinBoxValidator 原生构造与元属性访问。Qt QML @160589:80–86、89–115、125–131分别把value/minimumValue/maximumValue/stepSize/decimals代理至validator；:304–309实例化validator并接入完成时序。随包 `plugins.qmltypes:418–430` 声明的属性顺序与原生meta-call匹配。

| 属性 | 底层构造值 | 本次实际依据 | 适用边界 |
| --- | --- | --- | --- |
| value | 0（double） | FUN_1000d330 写this+0x10为0；getter 0x1000fe40读取此位置 | 只在上层没有赋值时是基础初值 |
| stepSize | 1（double） | 构造写this+0x18为1；getter 0x1000d8e0 | 按钮步长不等于输入值必须是步长倍数 |
| minimumValue | 0 | 构造调用QDoubleValidator::setBottom(0) | 被每个命令的minimumValue覆盖 |
| maximumValue | 99 | 构造调用QDoubleValidator::setTop(99) | 被每个命令的maximumValue覆盖 |
| decimals | 0 | 构造显式调用QDoubleValidator::setDecimals(0) | 支持未覆盖的数值框按整数编辑；不推导任意外来JSON合法性 |

包装层 Q@875471:61–63/99–123负责文本规范显示、检查decimals及夹界，没有另行设定decimals。setter 0x1000d830在componentComplete标志成立时夹到上下限；其后QString::number/toDouble的x86伪代码参数恢复不足，不据此断言全部舍入细节。尤其上层minimumValue=1而基础value=0时，本研究没有闭合QML初始化/信号时序，不把0或1当成已经观察到的首次保存值。命令有显式value=60等时另据该命令引用。

这些事实仅补齐“继承的整数/基础初值/步长”来源。可省略字段仍按已决 Compiler Default，不能因找到UI初值就自动放宽接口。

## REA 证据索引

| 内容 | 地址 / Evidence ID |
| --- | --- |
| 函数库存1431项 | `ev_e0c90ddaffa26ab17d99931af7379c8972bc8fa45c4eb7d50c289c3cd57a8160` |
| QQuickSpinBoxValidator标识字符串 | 0x100b0aa8；`ev_ce9ee1c5ae8131f0e9c23a8b7f928e6a75b328dc518ba0c21b35b03ad253e970` |
| QDoubleValidator构造外部引用 | EXTERNAL:0xe9，0x1000d386/0x1001e610；`ev_284f996a9d4e5d1f58c3b70570ebdd51802b8bed9da89f527ef1121b25f16cc6` |
| SpinBoxValidator构造 | FUN_1000d330，由0x1000d386定位；`ev_0abda227cbae2d1ac569a8e0af403fc960727b39b3d337287fe4165a16926d1d` |
| 元类型cast | 0x10019e50；`ev_6b4a3f21c4013144e671c90bbaa364e7694b0780dab89cbd3082ea8234f94ba9` |
| 元属性读写dispatch | 0x10019b60；`ev_f7d38050ab41d4fa5cd4d4b91d0096c34621d2e8d3181d81d3483e937dec1070` |
| value getter | 0x1000fe40；`ev_50ea4007ffe961e0cc8548746f1a4767338c610df380759134d2d64f60c9e60f` |
| stepSize getter | 0x1000d8e0；`ev_5d074e4fd1604af9fe88d0fe71c36a28d7dc9e7af8708a90ff5ec0a9e80e5e0f` |
| value setter | 0x1000d830；`ev_8afbb164078efb658dc0c010e2df1ab29b438768b6b298f30d7081050a26f2f7` |

原始Evidence bundle与分析快照已保存在本机 `C:/Users/Shuen/.codex/research-evidence/mv-command-parameters-20261019/`，文件分别为 `qt-spinbox-evidence.json`（10条、420618 bytes）和 `qt-spinbox-analysis.json`（10条、422563 bytes）。这些包含原生输出的本地文件不进入研究分支；分支只发布本报告的原创归纳。导出后已调用close_binary成功关闭原生分析session。bundle的unknowns=0是工具记录字段，不表示整项研究无未知。

## 共用 JSON 保存边界

Q@909009:341–354将stringifyEx结果交给TkoolAPI.writeFile；:357–383对数据库每项用JSON.stringify；:407–424对Map的events使用同一stringifyDatabase。它会安排顶层排版/数组项ID，但未递归删除命令或路线字段。因而：

- 数组中的undefined槽以null写出，是403 `[6,choices[6]]` 推导到 `[6,null]` 的基础。
- 对象上未创建的parameters键保持缺失；已存在的空数组保持[]。
- Movement插入器在缺失indent属性上做算术产生NaN，JSON.stringify把已创建的NaN属性写为null。详见[Movement记录差异](movement.md#原生移动记录外壳的待决差异)。

以上是完整静态路径加标准JSON语义的推导，没有取得对应真实编辑器落盘样本；TkoolAPI内部写盘失败等不在本次追踪范围。不可把“未清理”说成所有控制流都已动态验证。

## 资源身份

下列EXE记录stored包含外层4字节长度。

| offset | stored | 编码 | decoded bytes | decoded SHA-256 |
| ---: | ---: | --- | ---: | --- |
| 875471 | 1735 | zlib | 7183 | `a94b75dfca7ceb95315d38a3897e8c389a96d71f56696329f0cf8edd20535984` |
| 8796406 | 630 | plain | 626 | `a0810e1c287e4e2eb22bb24cf75308a7bf492a7e5a45b683f6eaec52f8c898fe` |
| 909009 | 4291 | zlib | 24761 | `9ce1877d3eac47699a558ada219ec4f217dbc4f215531a7f65ccacd8169c4f93` |

DLL内SpinBox QML：offset 160589，stored 3826，zlib，decoded 13133，SHA-256 `4b98b9d85a651cbe2f47e4abf7efaf67a25b9b942f5441b77cc5faae9643e0ca`。其行号/哈希以随包文本为准，不引用任意上游Qt版本替代本体。

## 后续验证责任

[验收与实施顺序](../../issues/08-completion-evidence-and-sequencing.md)应区分：新建命令后直接确认；打开已有事件仅保存容器；重新确认参数对话框；游戏运行。Qt首次初始化、非法旧值夹界与图片异步加载均不能仅由构造常量推断成真实样本已通过。新增保存结构与支持边界问题见[研究总索引](index.md)，必须先完成对应设计选择。
