# 03：准确文件观察的阶段回执

日期：2026-11-02。状态：**独立产品范围已实现并验证；F06 三个图片特殊名称用例等待用户政策决定，票 03 仍 claimed。** 不将未执行项计为通过，也不替代整体验收票 17。

后续政策说明：上述为本阶段运行时的历史状态。维护者现已确认图片含 `%`／`#` 统一不支持，音频继续支持，详见[政策处置](01-native-media/policy-resolution-2026-11-02.md)。当前三个图片 F06 canonical ID 已改为 input，产品仍待03落实；本文件下方及机器回执中的旧 filesystem ID、六条 `not-executed-policy-pending` 和原有执行计数保持历史事实，不覆盖为通过。

环境为 Windows x64、Node.js `v22.23.4`（`M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe`）。测试使用实际临时 Workspace、真实文件树与实际源码／构建后 CLI；没有新增产品测试开关、公共报告 API、扫描入口或全局跳过。

机器回执：[03-file-observation-acceptance.json](03-file-observation-acceptance.json)，含 **166 个独立用例 ID、332 条源码／构建入口通过结果**，以及 **3 个独立待执行 ID、6 条明确未执行记录**。每条执行记录保存字面输入、独立断言、断言源码哈希、环境、操作与结果；受控故障另保留子进程诊断。产品与测试文件哈希和测试时的契约版本 26 一并记录。

## 实现与验证范围

`asset-files.ts` 逐级比较准确目录项并查询不跟随链接的元数据。新增对目录枚举所见类型和 `lstat` 类型的单次查询一致性判断；枚举文件后变成目录等矛盾报 `MV-ASSET-QUERY-FAILED`，不会伪装为稳定的缺失或错误类型。查询异常定位到实际失败的枚举目录或元数据路径；根的 realpath 查询失败也按查询失败返回。没有跨检查点比较、时间／内容／身份追踪或媒体读取。

| 责任 | 实际覆盖 |
| --- | --- |
| F02 | 只有加密图片后缀、只有其他格式、准确 PNG 与其他格式并存 |
| F03 | 顶级目录、类别目录、stem、扩展名逐级大小写；准确项加变体、多变体无准确项；实际 CLI 错误与原生位置 |
| F04 | 中文、空格、纯空白非空 stem、点号、`$`、`!`、stem 尾空格与尾点；Check 只读、Compile 原名保存与磁盘原名保持 |
| F05 | 原有 `.png` 仍追加；NFC／NFD 字符串不替代原名目标，两者真实并存 |
| F07 | 5 种路径形式、9 个禁止字符、U+0000–U+001F 全部 32 个控制字符；28 个独立转录的保留设备名各自普通／带后缀／小写，共 130 个输入用例；保留原值、无伪造目标、CLI 不进入素材路径 |
| F09 | 根 junction 别名；根下目录 symlink、类别 junction、文件 symlink、根内／根外／dangling 链接；真实链接加 OS 访问守卫确认拒绝时未进入目标 |
| F10 | 真实 NTFS 硬链接、零字节普通文件；受控拒绝媒体内容 open/readFile 的异步与同步边界，Check 仍通过 |
| F11 | 受控枚举 EACCES、元数据 EACCES、元数据 EIO；保留独立缺失使用与具体失败位置 |
| F12 | 在真实 `readdir` 返回后通过 IPC 暂停，删除真实文件或替换为真实目录，再放行 `lstat`；API 与实际 CLI 验证查询失败、无发布 |
| F14 | `www` 或其他根存在同名文件仍不能替代绑定根 |

上述用例由[测试源码](../../../packages/rpgmaker-event-dsl/test/asset-file-workspace.test.ts)和原验收索引共同规定，预期没有调用产品收集器、匹配器或政策函数生成。内部 OS 控制全部留在既有 `test/support/workspace-operation-child.mjs`，产品不读取这些控制字段。

## Windows 实际能力与故障证据

目录和文件 symlink、junction、普通硬链接均在实际 Windows 临时树完成。大小写并存最初在 M: 探针受到限制；改用本项目既有 `withWindowsSandbox` 的 C: 临时目录，`fsutil.exe file setCaseSensitiveInfo <本用例目录> enable` 成功，实际枚举同时得到 `Poster.png`／`poster.png` 或 `POSTER.png`／`poster.png`。这两个必验分支均已真实执行，没有用注入替代，也没有跳过。

F10 的内容拒绝和 F11 的 EACCES／EIO 是明确的 OS 接口受控注入，不代表真实 ACL 配置。F12 的删除和类型变化发生在 IPC 指定的真实文件操作之间，没有固定 sleep、内部函数模拟或 syscall 次数快照。

## 红绿过程与检查

- 类型变化用例最初失败：现实现报 `MV-ASSET-PATH-TYPE`，独立预期要求 `MV-ASSET-QUERY-FAILED`。加入 Dirent／lstat 类型一致性后通过。
- 枚举拒绝用例最初失败：诊断把目录枚举失败定位到其下的目标文件。分别保留实际 queried path 后通过，同时仍报告另一个独立使用的缺失。
- `vitest run test/asset-file-workspace.test.ts`：源码入口 **166／166**；设置 `MV_CLI_ENTRY=built` 后 **166／166**，包括构建 Workspace API 与实际构建 CLI。
- `vitest run test/asset-picture-workspace.test.ts test/compile-publication.test.ts`：**42／42**；既有图片与发布控制保持通过。
- 包 typecheck、build、仓库 lint、format:check、`git diff --check` 均通过。
- 新套件已加入 `vitest.windows.config.ts` 的显式构建后清单。最终整个仓库与全部 Windows baseline 由票 17 汇总。

上述完整回执在分支契约版本 26 运行；随后已同步集成 `47630a1e`（含票 10 的版本 26），将本票新增观察语义协调为版本 27，避免两个独立版本 26 使旧输出误判当前。并存的 Common Event 与文件观察构建清单均保留。同步后 typecheck／build 通过，F11／F12 与实际 CLI 大小写定位的 6 个相关用例各在源码和构建入口再次通过，新增 12 条回执单独保存，没有改写原完整运行结果。

## 尚未完成的政策项

`AV.F06.image-percent.filesystem.case.expected`、`AV.F06.image-hash.filesystem.case.expected`、`AV.F06.literal-percent20.filesystem.case.expected` 的源码和构建入口均记录为 `not-executed-policy-pending`。[原生票 01 的实际反例及待决选项](01-native-media/observations.md)已交维护者审阅，用户尚未回复政策选择。

本阶段保留原图片 `%`／`#` 名称规则，没有根据超时、自动选择、例外或放宽断言把反例变成通过。音频／影片的后续类别验证仍按原任务图由相应票承担。等用户决定后须补这三项的产品预期／执行记录并同步下游契约，再评估关闭票 03；当前阶段提交不解除票 12 的依赖。
