# 事件素材存在性检查：已确认任务拆分

Review state: approved-and-published
Created: 2026-10-24
Updated: 2026-11-02
Source: [现行实施规格](../asset-validation/asset-validation-spec.md)
Acceptance: [验收矩阵](../asset-validation/acceptance-matrix.md) · [实施验收用例索引](../asset-validation/implementation-acceptance-cases.md)

用户审阅 14 张票的修订建议后要求重新编号，以下为连续编号后的现行拆分。正式票均为 ready-for-agent；当前执行状态以[任务索引](tickets.md)及各票为准。[旧发布记录](history/2026-10-24/ticket-breakdown-draft.md)和[编号调整前的提案](history/2026-11-02-proposal.md)仅供历史追溯。

## 拆分约定

- 每张产品票交付可由现有 Workspace API／CLI 验证的完整行为，并在本票完成适用测试、fixture 和说明。01 为原生证据票，14 汇总真实集成结果。
- 不新增通用预重构票。必要局部整理归对应行为票，沿用命令家族、Validation、Workspace 及 Project Data 的现有职责。
- 编号表示依赖顺序，Blocked by 仅列直接前置；共享模块不自动形成阻塞。
- 素材不进持久编译基线或 data 恢复条件，例外政策仍进基线。行为变更协调 Compile Contract Version，旧输出不得被升级为新契约。
- 86 个有效族按现行分支验收，延后族不展开、不阻塞首版、不计为通过；各票不得沿用旧 97 族和已撤销分支。
- Windows / Node.js 22 真实操作、独立预期、受控故障边界及原生证据责任保持。已有文档和原生研究不等同产品验收。

## 已确认的 14 张票

1. **01：核实原生媒体定位与特殊名称**

   **Blocked by:** None。

   **交付：** 以 MV 1.6.1 的真实请求和磁盘定位，核实普通媒体及支持的特殊名称，为文件规则提供可复核的原生证据。

2. **02：显示图片在 Compile／Check 中完成最小检查路径**

   **Blocked by:** None。

   **交付：** 当前 Map／Common／Troop Event 中正式和已识别 raw 的 Show Picture 能在 Compile／Check 中获得可定位的文件结果。

3. **03：准确名称、链接与文件查询失败的检查**

   **Blocked by:** 02。

   **交付：** 作者通过 Compile／Check 区分准确文件、名称不符、不支持形式及查询失败，不将异常或替代文件当成存在。

4. **04：事件页、图像指令与移动图像的检查**

   **Blocked by:** 02。

   **交付：** 页图像、脸图、战斗背景、远景、角色／载具图像及两种移动路线的直接图像均能在编译中检查。

5. **05：音频与影片的直接检查**

   **Blocked by:** 04。

   **交付：** 四类音频、保存音频设置、路线 SE 及影片在 Compile／Check 中使用正确目录和固定扩展名。

6. **06：动画、图块组与固定技能正动画的检查**

   **Blocked by:** 05。

   **交付：** 播放动画、更换图块组及 Force Action 的固定 Skill 正动画沿一致快照检查素材，并提供事件内 Asset Dependency Chain。

7. **07：固定敌群与敌人变身素材的检查**

   **Blocked by:** 06。

   **交付：** 固定 Battle Processing 与 Enemy Transform 的战斗图得到检查，目录随前／侧视模式选择，错误可追溯到成员或 Enemy 字段。

8. **08：Game Over 与 Return to Title 素材的检查**

   **Blocked by:** 06。

   **交付：** Game Over 的 ME，以及 Return to Title 的两张图片和 BGM 在编译时检查，并定位到 System 保存字段。

9. **09：精确素材例外与可定位诊断**

   **Blocked by:** 03、06。

   **交付：** 作者可为一个准确素材填写原因，将允许问题降为 warning，并在 CLI 获得分组结果、全部定义来源及未检查说明。

10. **10：Compile／Check 的单次素材检查与发布保护**

   **Blocked by:** 09。

   **交付：** Check 返回前和 Compile 发布前各完成一次当前素材检查，保留编译输入保护并使检查结果具有明确时点。

11. **11：Push 写前及无差异路径的素材检查**

   **Blocked by:** 10。

   **交付：** Push 从已验证生成事件和对应快照重建素材使用，在暂存后且 pending／首次替换前检查一次，无差异返回前也检查。

12. **12：Push 写后记账与输入一致性保护**

   **Blocked by:** 11。

   **交付：** 完成素材门槛后只改变素材不会妨碍一致的 data 写入正常记账；真正输入或 data 不一致仍按既有规则处理。

13. **13：Interrupted Push 恢复与当前素材条件分离**

   **Blocked by:** 11。

   **交付：** 作者能按内容证据恢复已完成或尚未开始的 data 写入，随后独立判断本次 Push 的当前依据和素材条件。

14. **14：首版集成验收与使用说明核对**

   **Blocked by:** 01、07、08、12、13。

   **交付：** 维护者获得当前首版的完整集成结果和可审阅回执，确认保留范围可交付。

## 依赖依据

- 03／04 复用 02 的最小事件检查路径；05 复用 04 的路线和镜像。06 在图片／音频路径上建立局部标准数据依赖，07／08 复用该边界。
- 09 需要 03 的文件事实分类和 06 的间接／多媒体／未检查场景；明确非活动使用已由 04 经 05 纳入依赖链，不再等待延后关系。
- 10 完成现行政策下的 Compile／Check 发布与只读验证，11 接入生成事件的 Push 门槛。其他关系可分别推进，由 14 验证完整集成。
- 12 和 13 均依赖 11，彼此不阻塞；恢复可以使用独立内容证据，不依赖写后异常票先制造 fixture。14 联合验证两个行为。
- 可立即开始 01／02。14 的直接前置 01／07／08／12／13 覆盖所有其他票。

## 验收责任分配

每行分配一个有效族在一张票内的分支责任；共享族可有多行。A／B 对应的 C06／C07 已同时分配。完整实例、原生字段和表示由上游索引定义，不把一家族名或代表样例当作全部通过。14 审计全部 86 族，发现缺口退回其责任票。

| 验收族 | 责任票 | 当前分支责任 |
| --- | --- | --- |
| A01 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A02 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A03 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A04 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A05 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A06 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A07 | [02](issues/02-picture-compile-check.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A08 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A09 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A10 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A11 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A12 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A13 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A14 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A15 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A16 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A17 | [04](issues/04-direct-image-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| A18 | [05](issues/05-direct-audio-and-movie-uses.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B01 | [06](issues/06-animation-tileset-and-skill-assets.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B02 | [06](issues/06-animation-tileset-and-skill-assets.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B03 | [07](issues/07-enemy-asset-dependencies.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B04 | [07](issues/07-enemy-asset-dependencies.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B05 | [06](issues/06-animation-tileset-and-skill-assets.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B11 | [08](issues/08-game-over-and-title-assets.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| B12 | [08](issues/08-game-over-and-title-assets.md) | 该族全部保留字段、表示、正常与逐字段缺失分支。 |
| C01 | [02](issues/02-picture-compile-check.md) | 全部保留分支；当前三类根、嵌套及移除／重置。 |
| C02 | [02](issues/02-picture-compile-check.md) | 全部保留分支；当前三类根、嵌套及移除／重置。 |
| C03 | [04](issues/04-direct-image-uses.md) | route-mirror／independent-command 的 image 字段；205／505 关联一次，其他真实来源保留。 |
| C03 | [05](issues/05-direct-audio-and-movie-uses.md) | route-mirror／independent-command 的 se 字段；205／505 关联一次，其他真实来源保留。 |
| C03 | [10](issues/10-compile-check-single-gate.md) | repeated-command 的 image／se，下一命令不累积历史来源。 |
| C04 | [02](issues/02-picture-compile-check.md) | two-callers／common-independent-root；只报告公共事件定义位置。 |
| C04 | [06](issues/06-animation-tileset-and-skill-assets.md) | repeated-tileset-name／repeated-common-effect；同名槽保留局部来源，effects 不复制根使用。 |
| C04 | [07](issues/07-enemy-asset-dependencies.md) | repeated-enemy；每个成员路径保留。 |
| C05 | [02](issues/02-picture-compile-check.md) | self-cycle／mutual-cycle／shared-callers；独立根检查，不构造调用图。 |
| C05 | [06](issues/06-animation-tileset-and-skill-assets.md) | default-attack；保留未检查原因，不查询回退素材。 |
| C05 | [07](issues/07-enemy-asset-dependencies.md) | dynamic-troop；不伪造已确定目标或检查通过。 |
| C06 | [02](issues/02-picture-compile-check.md) | 本票 A07 的原生合法 None。 |
| C06 | [04](issues/04-direct-image-uses.md) | 本票 A01、A02、A13、A14、A15、A16、A17 的原生合法 None。另含 default-page-image／default-page-route／saved-image-index。 |
| C06 | [05](issues/05-direct-audio-and-movie-uses.md) | 本票 A03、A04、A05、A06、A08、A09、A10、A11、A12、A18 的原生合法 None。另含 saved-audio-controls。 |
| C06 | [06](issues/06-animation-tileset-and-skill-assets.md) | 本票 B01、B02、B05 的原生合法 None。另含 zero-skill-animation。 |
| C06 | [07](issues/07-enemy-asset-dependencies.md) | 本票 B03、B04 的原生合法 None。 |
| C06 | [08](issues/08-game-over-and-title-assets.md) | 本票 B11、B12 的原生合法 None。 |
| C07 | [06](issues/06-animation-tileset-and-skill-assets.md) | 本票 B 族全部适用 target-missing／field-missing／field-wrong-type／field-empty／file-missing；System 不伪造固定引用。 |
| C07 | [07](issues/07-enemy-asset-dependencies.md) | 本票 B 族全部适用 target-missing／field-missing／field-wrong-type／field-empty／file-missing；System 不伪造固定引用。 |
| C07 | [08](issues/08-game-over-and-title-assets.md) | 本票 B 族全部适用 target-missing／field-missing／field-wrong-type／field-empty／file-missing；System 不伪造固定引用。 |
| C08 | [02](issues/02-picture-compile-check.md) | false-page-condition／unreached-branch 不自动降级。 |
| C08 | [04](issues/04-direct-image-uses.md) | route-fixed／route-random／route-approach 的图像及 tile-with-character。 |
| C08 | [05](issues/05-direct-audio-and-movie-uses.md) | route-fixed／route-random／route-approach 的路线 SE。 |
| C09 | [07](issues/07-enemy-asset-dependencies.md) | actor-hp／vehicle-position，均不扩展素材。 |
| C10 | [06](issues/06-animation-tileset-and-skill-assets.md) | unrelated-animation／unrelated-field。 |
| C10 | [07](issues/07-enemy-asset-dependencies.md) | unrelated-actor／troop-host-only。 |
| C11 | [02](issues/02-picture-compile-check.md) | script-command／plugin-command／unknown-raw／recognized-raw。 |
| C11 | [04](issues/04-direct-image-uses.md) | route-script；不猜测脚本名称。 |
| C11 | [05](issues/05-direct-audio-and-movie-uses.md) | 路线 SE 正式／raw 一致性的补充验证。 |
| C11 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | Script Gate／结构／引用错误不能由素材例外绕过。 |
| C12 | [02](issues/02-picture-compile-check.md) | plugin-declaration。 |
| C12 | [04](issues/04-direct-image-uses.md) | page-initial-tileset；不漏掉直接 characterName。 |
| C12 | [06](issues/06-animation-tileset-and-skill-assets.md) | initial-equipment／transfer-network／actor-default-attack／enemy-default-attack／transfer-initial-assets。 |
| C12 | [07](issues/07-enemy-asset-dependencies.md) | enemy-ai／actor-initial-images。 |
| C12 | [08](issues/08-game-over-and-title-assets.md) | hardcoded-system／terrain-background／battle-test-background／battle-default-audio／battle-map-background。 |
| C13 | [10](issues/10-compile-check-single-gate.md) | check-success／check-failure。 |
| C13 | [11](issues/11-push-generated-asset-preflight.md) | push-success。 |
| F01 | [02](issues/02-picture-compile-check.md) | image。 |
| F01 | [05](issues/05-direct-audio-and-movie-uses.md) | bgm／bgs／me／se／movie。 |
| F02 | [03](issues/03-exact-file-observation.md) | image-encrypted-only／other-only／exact-plus-alternative。 |
| F02 | [05](issues/05-direct-audio-and-movie-uses.md) | audio-m4a-only／movie-mp4-only／audio-encrypted-only。 |
| F03 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F04 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F05 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F06 | [03](issues/03-exact-file-observation.md) | image-percent／image-hash／literal-percent20。 |
| F06 | [05](issues/05-direct-audio-and-movie-uses.md) | audio-percent／audio-hash／movie-percent／movie-hash。 |
| F07 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F08 | [02](issues/02-picture-compile-check.md) | 全部基本缺失／类型分支。 |
| F09 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F10 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F11 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F12 | [03](issues/03-exact-file-observation.md) | 全部现行分支及按索引展开的实例。 |
| F13 | [02](issues/02-picture-compile-check.md) | 全部 images 标志分支。 |
| F13 | [05](issues/05-direct-audio-and-movie-uses.md) | 全部 audio 标志分支。 |
| F14 | [02](issues/02-picture-compile-check.md) | no-images-use。 |
| F14 | [03](issues/03-exact-file-observation.md) | no-www-fallback／no-other-root。 |
| F14 | [05](issues/05-direct-audio-and-movie-uses.md) | no-audio-use／movie-only。 |
| D01 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D02 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D03 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D04 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D06 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D07 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D08 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D09 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| D10 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | 现行全部分支；不恢复候选、caller、三套统计或 D05。 |
| W01 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W02 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W03 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W04 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W05 | [11](issues/11-push-generated-asset-preflight.md) | 现行全部分支，保留指定 API／CLI 入口。 |
| W06 | [12](issues/12-push-postwrite-consistency.md) | 全部写后只改素材的分支：正常记账，下一次 Push 再检查。 |
| W07 | [11](issues/11-push-generated-asset-preflight.md) | 现行全部分支，保留指定 API／CLI 入口。 |
| W08 | [11](issues/11-push-generated-asset-preflight.md) | 现行全部分支，保留指定 API／CLI 入口。 |
| W09 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W10 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W11 | [10](issues/10-compile-check-single-gate.md) | check-gate／compile-gate 的全部七种门槛前变化；不比较跨时点事实。 |
| W11 | [11](issues/11-push-generated-asset-preflight.md) | push-gate 的全部七种门槛前变化，补齐按当前事实通过。 |
| W12 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W12 | [11](issues/11-push-generated-asset-preflight.md) | Push 的下一命令实际查询补证，不读取历史成功报告。 |
| W13 | [11](issues/11-push-generated-asset-preflight.md) | 全部 prewrite 依据变更及 source 的 CLI 边界。 |
| W13 | [12](issues/12-push-postwrite-consistency.md) | 全部 postwrite 依据变更及 source 的 CLI 边界；素材变化不算依据变更。 |
| W14 | [09](issues/09-exceptions-and-actionable-diagnostics.md) | exception-change。 |
| W14 | [10](issues/10-compile-check-single-gate.md) | pull／rebind／contract-change／check-does-not-refresh。 |
| W15 | [13](issues/13-recovery-and-current-asset-policy.md) | 全部现行内容恢复、原依据或互斥／原绑定分支。 |
| W16 | [13](issues/13-recovery-and-current-asset-policy.md) | 全部现行内容恢复、原依据或互斥／原绑定分支。 |
| W17 | [10](issues/10-compile-check-single-gate.md) | 现行全部分支；W12 后续 Push 当前事实由 11 补证。 |
| W18 | [13](issues/13-recovery-and-current-asset-policy.md) | 全部现行内容恢复、原依据或互斥／原绑定分支。 |
| W19 | [10](issues/10-compile-check-single-gate.md) | compile-success／compile-failure。 |
| W19 | [11](issues/11-push-generated-asset-preflight.md) | push-success 及 push-failure 写前部分。 |
| W19 | [12](issues/12-push-postwrite-consistency.md) | 真正 data／输入异常的 push-failure 写后部分。 |
| W19 | [13](issues/13-recovery-and-current-asset-policy.md) | recovery。 |
| W20 | [11](issues/11-push-generated-asset-preflight.md) | 现行全部分支，保留指定 API／CLI 入口。 |
| N01 | [01](issues/01-native-media-locations.md) | 全部现行原生分支。 |
| N02 | [01](issues/01-native-media-locations.md) | 全部现行原生分支。 |
| N03 | [06](issues/06-animation-tileset-and-skill-assets.md) | animation-images／animation-timing-se。 |
| N04 | [06](issues/06-animation-tileset-and-skill-assets.md) | 仅 change-tileset；page-tile 延后。 |
| N05 | [07](issues/07-enemy-asset-dependencies.md) | enemy-front／enemy-side。 |

## 新旧编号对照

| 原编号 | 新编号 | 迁移结果 |
| --- | --- | --- |
| 01 | 01 | 原生证据保留 |
| 02 | 02 | 补入公共事件独立根／循环输入的范围验证 |
| 03 | 03 | 文件规则保留 |
| 04 | 04 | 直接图像保留，补页初始 Tileset 排除 |
| 05 | 05 | 直接音频／影片保留 |
| 06 | 06 | 合并固定 Skill 正动画，接收 N04 整组图块 |
| 07 | — | 传送／页图块关系延后；N04 保留部分转新 06，范围反例由新 04／06 承担 |
| 08 | 07 | 仅固定敌群／变身；Actor 候选与 N06 延后 |
| 09 | 08 | 仅 Game Over／Return to Title |
| 10 | — | 调用报告延后；独立根测试转新 02，effects 范围验证转新 06 |
| 11 | 06 | 正动画和默认攻击未检查说明合并；其余延后 |
| 12 | 09 | 精确例外与诊断减重 |
| 13 | 10 | 改为单次素材门槛 |
| 14 | 11 | 当前事实写前／无差异检查 |
| 15 | 12 | 写后素材不影响记账，保留真正输入保护 |
| 16 | 13 | 依赖改为新 11，可与新 12 分别推进 |
| 17 | 14 | 只验收当前 86 族 |

## 发布记录

已发布连续编号 01–14 的独立票，任务索引、标题、依赖、验收责任和本地链接同步。原 17 票与原索引归档，历史状态不进入当前领取队列。父规格和已完成决策票保持本轮开始时的内容。

## Comments

- 2026-10-24：原 17 票发布记录保留于历史目录。
- 2026-11-02：用户先要求简化功能范围，随后审阅 14 张票的范围和依赖建议，并要求“重新编号吧”。按此要求改为连续编号 01–14；原提案中的保留旧号方案已被替代。完成的是任务文档更新，产品与验收仍待实施。
