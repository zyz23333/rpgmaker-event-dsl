# 40 focused DEV 交接

按[画面、图片、音频与系统场景批次](../tickets.md#batch-presentation)继续，
本交接只结束独立开发阶段；40 保持 claimed，后续与 37–39 一起集成验收。

- 当前产品候选：合并提交 `12f7159ee0a7ea13cb27f08f2bb0a2b2e97d9f2d`，
  tree `4edcda04cdc68cc838911cf9e35827ca3c006792`，实际继承 e574078。
  契约 `mv-1.6.1/13`，传入 328 条要求加本票 24 条，共 352 条。
- E134–138、E351–354 已交付严格 authored/native/known raw 边界、正式
  反编译及 Workspace 路径；Encounter 统一为 `changeEncounter({ enabled })`。
  Window 只接受具名四字段 Tone，保留隐藏 gray 与数字负零。
- 合并后实际通过：5 文件 95 项单元／回归、本票 15 项 Workspace、
  Choices 19 项 Workspace、包 TypeScript。原 10 秒期限、两个 worker。
  独立开发期间的原红和失败没有删除，也未算为通过。
- 原始日志、结果、输入及三方合并资料留在
  `M:/Shuen/Codex/mv-events-implementation-20261020/ticket40-temp`。
  关键文件为 `postmerge-window-closed-v1.json`、`merge-reconciliation-v1/receipt.json`
  及各 `postmerge-*-v1.log`；[详细记录](40-system-access-window-color-and-scenes.md)
  说明首次失败和输入身份。外部结果不再逐项复制到仓库。
- 原 freeze manifest 的非 scoped Git status 各误报 736 个超长历史路径
  删除；原件与限制说明保留。合并／闭合检查使用 command-scoped longpaths。
  该问题未改变实际冻结的 185 个运行输入或其 SHA256。

按用户 2026-10-20 的精简策略，原待命的大体积 archive/index/freeze 审计
不再执行，也不作为此 DEV 交接的门槛。批次集成须统一 37／38／40 的
Tone/Color，核对资源 guards 与 compiler/decompiler；在同一最终候选集中
完成一次适用全量、build/built 及各票必要 E/R。最终实际游戏验证保留，
本交接没有 full、build/built、E4/R6 通过或 resolved 声明。
