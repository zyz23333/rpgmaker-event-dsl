# 26 focused 原始记录

本目录保留DEV阶段每次原始PowerShell输出，按字节复制；`.gitattributes`限定本目录不转换换行或删除原始空白。文件列表、来源、长度与SHA-256见[focused-captures.json](focused-captures.json)。自动化原始记录仍位于公共results目录，身份与哈希清单见[focused-results.json](focused-results.json)。这里均为原创测试/工具输出，未收录首方编辑器、runtime、引擎源码、项目数据、资产或截图。

末次类型/lint/索引复核见[final-captures.json](final-captures.json)；lint原始stdout为空，实际退出码0。原274行要求深度相等、2,722个旧历史文件原字节一致及旧README前缀一致，见[immutable-history-audit.json](immutable-history-audit.json)。未提交DEV源码的真实基线、状态与97个源文件指纹见[dev-source-provenance.json](dev-source-provenance.json)，没有构建产物身份。

日志名称表示当时尝试的用途，不自动表示通过；以原始exit/output及[实施记录](../26-timer-saved-slot-roundtrip.md)的分类为准：

- `red01-authored-slots`最初是依赖未安装；`red01-authored-slots-executed`才是实际公开类型产品red。
- `green01-authored-slots`及`corrected-oracle`仍失败，分别是System Switch预期及Destructive门槛的测试前提错误；`final`通过。
- `red02-native-slots`是原生Stop两槽不能正式反编译的产品red；`green02-native-slots`的Diff文案与`corrected-diff`的预期共享数组是测试前提错误；`final`通过。
- `red03`、`red04`、`red05`依次为负零丢失、正式seconds校验缺口、原生阶段精确拒绝缺口；对应`green03`、`green04`、`green05`通过。
- `focused-complete-first`包含错误的raw helper校验终点及文案预期，不当作17个产品反例。`red06-raw-diagnostic-slot-path`才是实际参数槽路径丢失；`green06`通过。
- `related-regression-first`同时捕获新增模块循环和旧断言需要更新；后续`focused-checkpoint-suite-first`为5文件91例通过。
- `focused-complete-second`为Timer60例通过；`focused-final-evidence-run`为Timer及证据索引2文件63例通过。均是source运行。

焦点开发结果与最终完整check/build/built及E4候选产物比较分开。原requirements274行与所有旧历史结果按独立审计保持；本次追加13个自动化requirements和1个待最终化E4requirement。26保持claimed，未标READY。
