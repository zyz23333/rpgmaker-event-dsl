# 03: 准确名称、链接与文件查询失败的检查

Status: claimed
Blocked by: 02
Created: 2026-10-24
Parent: [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)
Approval: [已确认拆分与发布记录](../ticket-breakdown-draft.md#comments)

**What to build:** 作者能通过 Compile／Check 区分准确文件、大小写错误、不支持名称／链接及无法检查，不把异常或替代文件报告成存在。

## Acceptance criteria

- [ ] 覆盖目录各级及扩展名大小写、追加双后缀、中文／空格／纯空白／点号／前缀／Unicode、图片字面量百分号和井号；按完整追加文件名校验禁止字符和全部保留设备名。
- [x] 根别名沿既有绑定；根以下 symlink／junction 不跟随，包括根内、根外和 dangling。硬链接、空文件、元数据可查而媒体内容读取受阻的场景可通过。
- [x] 以真实文件树及明确标注的故障注入验证查询失败、枚举后消失、类型变化、独立路径继续、准确问题位置和无资源根回退。通过实际 Compile／Check 验证，不止内部匹配测试。

### 共通要求（限本票适用范围）

- [ ] 完成本票验收族中分配给本票的全部有限子用例；共享族按下表分支签收，不减少字段、表示、时机或结果，不把其他票负责的分支误记为通过。
- [ ] 正式表达与已识别 raw 各自对照独立预期；按适用范围核对完整 Event Asset Use、Asset Dependency Chain、条件、None、必要字段问题及文件事实。预期不得调用被测收集器、匹配器或政策函数生成。
- [ ] 在 Windows / Node.js 22 的真实临时 Workspace 中，按原索引指定的 API／实际 CLI 入口和边界验证结果及允许的状态变化。纯语义测试只作补充，故障注入位于测试子进程操作系统边界。
- [ ] 保留现有公共 Workspace API 和 CLI；不新增产品测试开关、JSON CLI、全局跳过或通配符例外。素材不进入持久编译基线、快照、备份、复制或写入范围。
- [ ] 补齐本票影响的既有成功 fixture 所需真实文件与必要标准字段，保留旧断言与未知字段。同步适用使用说明、样例及构建后 CLI 用例清单；行为变更协调 Compile Contract Version。
- [ ] 记录完整子用例 ID、契约出处、输入、预期、实际、环境、执行方式及证据；未执行、能力受限和失败分别记录，不能以 skip 计为通过。反例按规格回到责任行为或决定处理。

## Acceptance ownership

下表仅分配验收责任；规范预期、有限分支、表示及完整 `AV.<族>.<分支>.<表示>.<字段>.<结果>` 标识仍以原索引为准。A／B 字段关联的 C06／C07 同票落实，共享族只承担本票列出的部分。

| 验收族 | 本票负责的分支／字段 |
| --- | --- |
| F02 | image-encrypted-only／other-only／exact-plus-alternative。 |
| F03 | 全部大小写层次及并存分支 |
| F04 | 全部支持名称分支 |
| F05 | 双扩展名与 Unicode 不规范化 |
| F06 | image-percent／image-hash／literal-percent20：按字面量名称检查，不 URL 解码。 |
| F07 | 全部名称形式、禁止字符、控制字符、设备名实例；02 先有查询前安全拒绝 |
| F09 | 根别名及全部根以下链接分支 |
| F10 | 硬链接、零字节、仅元数据 |
| F11 | 枚举／元数据／I/O 查询失败 |
| F12 | 查询内消失／类型变化 |
| F14 | no-www-fallback／no-other-root：不更换资源树或根。 |

## Dependencies

- [02：显示图片在 Compile／Check 中完成最小检查路径](02-picture-compile-check.md)。

只在列出的直接阻塞票均为 resolved 后领取整票。票号表示依赖顺序，产品最终完成仍须通过 17；本票完成不代表整套素材检查已经交付。

## Verification

按上游索引指定的实例与入口运行本票适用验证，并记录相关仓库检查、构建和 Windows CLI 结果；最终全量核对由 17 负责。本票发现的失败不得以延后到 17 代替修复。当前所有产品测试和原生检查均为待实施／未执行，完成时追加实际结果。

完成后记录实际 outcome 和验证，再更新本票状态。原规格、决策地图及已完成决策票不因本票发布而改状态。

## Sources

- [事件素材文件存在性检查实施规格](../../asset-validation/asset-validation-spec.md)：本票与共通契约的权威来源，包含适用 ADR、模块职责与完成门槛。
- [验收矩阵](../../asset-validation/acceptance-matrix.md)：规范预期。
- [实施验收用例索引](../../asset-validation/implementation-acceptance-cases.md)：有限分支、固定字段、执行入口和证据责任。
- [已确认任务拆分](../ticket-breakdown-draft.md)：本票范围、直接阻塞关系及共享验收族分配。
- [实施任务索引](../tickets.md)：全部正式票与初始领取入口。

## Comments

- 2026-10-24：用户回复“确认”，本票按已确认的 17 票拆分发布为 ready-for-agent。产品实现、自动化与原生验收均尚未由本次发布执行。
- 2026-11-02：独立 worktree 从集成 `3eb12b8d` 开始；测试入口沿用规格已确认的 Workspace API、实际 CLI 与测试子进程 OS 接口。先实现独立文件规则；图片百分号／井号的原生反例等待维护者决定，本票不自行改政策。
- 2026-11-02：独立范围的 166 个用例均通过 Windows / Node.js 22 源码与构建入口，共 332 条实际通过回执；真实大小写并存、符号链接、junction 与硬链接均已执行。修正查询内类型矛盾分类与枚举异常的实际失败位置，保留逐项独立检查和元数据边界。[阶段回执](../evidence/03-file-observation-acceptance.md)及[机器回执](../evidence/03-file-observation-acceptance.json)明确列出 3 个 F06 待决用例、6 条未执行记录，不能计为通过。图片 `%`／`#` 政策保持原状，用户尚未回复，票仍 claimed，不能关闭或解除后续依赖。
