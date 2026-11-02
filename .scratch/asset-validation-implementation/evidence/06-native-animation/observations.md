# 06 / N03 原生 Animation 双图与 timing SE 回执

执行日期：2026-11-02。**N03 两个规范 ID 已实际观察通过**；本目录不关闭票06，也不替代其正式/raw、Compile/Check、源码/构建自动化验收。没有修改任何仓库文件。图片特殊名称政策未改，N01/N02反例没有重跑。

## 场景、输入与独立预期

真实保存的 Map001 中，事件2的 autorun 页先经过默认 OFF 的 switch1 分支，跳过 list[1] 的 Animation2；再执行 list[3] 的 Show Animation212[1,1,true]，目标为地图事件1，随后原生等待动画结束才运行 Script 完成标记。自开关A使控制页一次性完成。数据库通过原生 DataManager.loadDatabase 读取，全部游戏对象由原生 DataManager.createGameObjects 建立；SceneManager.run(Scene_Map) 创建真正的地图场景、解释器和精灵。没有调用假的 Scene/Bitmap/WebAudio，也没有绕过 requestImages 或替换其返回值。

Animation1 保存两张不同名、960×192、五列的有效自制 PNG：animation1Name=N03-first（准确红色#ff0000），animation2Name=N03-second（准确蓝色#0000ff）。每个保存帧均含pattern0与100各一格，预期由原生两张bitmap各选一个192×192格。四帧索引0、1、2、3。timings[0] 保存 frame0 的 N03-se-first，volume70/pitch100/pan−25；timings[1] 保存 frame2 的 N03-se-second，volume80/pitch100/pan25。两个OGG是440Hz/660Hz的有效自制0.3秒Vorbis。position2、单目标，独立于屏幕动画重复抑制。PNG用RGBA/PNG CRC32/zlib生成，OGG用ffmpeg生成，精确命令/内容/媒体哈希见 input-manifest.json。

Animation2 是另名的预加载对照：其命令位于未执行分支，保存双图与两个独立SE，四份媒体也有效存在。独立预期是 setup/requestImages 可以预加载双图，却不能把该分支计成实际command212、Sprite_Animation实例、帧或SE执行。场景要求的Window、Loading、Shadow、IconSet、Balloon、States、Damage、Weapons1–3、ButtonSet全部是有效自制中性PNG，标为background，不计为产品Event Asset Use。

## 实际运行与规范ID

- AV.N03.animation-images.native-run.case.observed：**通过**。requestImages在没有任何Animation实例时请求了两个动画的四张图。实际仅Animation1执行212并建立一个Sprite_Animation；loadBitmaps使用的bitmap-14/bitmap-15与预加载对象身份相同，实际Bitmap._requestImage及原生load回调定位img/animations/N03-first.png和N03-second.png。两图均读到960×192和独立红/蓝像素；四个动画帧分别使用pattern0/100。原生Canvas renderer对两图各实际调用drawImage **16次**，不是只检查函数拼出的URL。
- AV.N03.animation-timing-se.native-run.case.observed：**通过**。timing0在原生Graphics.frameCount1/动画frame0，timing1在原生frame9/动画frame2进入processTimingData，duplicated=false；其操作栈下分别调用AudioManager.playSe/createBuffer，保留两份音频控制值。原生XHR请求准确audio/se/*.ogg并读取响应，两个WebAudio均完成解码、建立并启动真实source node。两者均为48000Hz单声道，解码时长0.3149166667秒；decode在原生frame2与10观察到。没有任何对照SE的网络请求、buffer或playSe。

实际四个动画帧发生在原生frame1、5、9、13；Script完成标记在frame18，最终frame19、duration0、isPlaying=false，AudioContext为running。窗口package设置show:false，进程windowsHide:true，独立nw-profile；没有展示交互窗口。19项独立断言全通过。

完整逐事件原始记录为 native-results.json（含稳定bitmap/audio/animation身份、同步来源栈、异步URL关联、各原生调用/加载/帧/Canvas/SE/解码）。acceptance-receipts.json只有两个规范ID，链接事件序号、完整输入、独立预期、磁盘普通文件及哈希、版本、命令和原始证据哈希。observed-summary.json是从真实运行抽取的简表。

## 版本、原样委托与复跑

实际宿主Windows10 10.0.19045、x86 NW.js0.29.0、Chromium65.0.3325.146、内置Node9.7.1；MV版本头1.6.1。外围生成器Windows x64 Node22.23.4，二者分开记录。Canvas renderer类型2；GPU shared-context日志不阻碍这次真实Canvas与WebAudio消费。原生六个rpg_*.js及所有复制库脚本均有哈希；六个源文件和运行副本逐字节相同，Game.exe/nw.dll的源/副本哈希另见acceptance-receipts.json。

探针只在原生方法外记录入参/返回状态及被动事件；所有包装器保存原方法并原样original.apply(this, arguments)返回，没有改变参数/结果、路径或事件条件。附加读取bitmap像素和绘图日志供独立检查。DataManager/Scene/Interpreter/Sprite/Bitmap/WebAudio代码不改，未使用产品收集器/匹配器生成预期。此处使用已供应的原生JS源码作行级补充：rpg_objects.js requestImages10562–10572/command2129808；rpg_sprites.js loadBitmaps1301/isReady1310/updateFrame1383/updateCellSprite1411/processTimingData1442；rpg_core.js _onXhrLoad8184。已阅读REA技能；已有明文原生源码与完整运行证据足够，本轮未建立新的REA分析或把静态依据计为通过。

实际执行的完整绝对路径命令保留在input-manifest.json的command。仓库内复跑命令（最后目录必须尚不存在）：

~~~powershell
& 'M:/Shuen/Codex/tools/node-v22.23.4-win-x64/node.exe' '.scratch/asset-validation-implementation/probes/native-animation/run-n03.mjs' 'F:/Shuen/RPG/rpgmaker-event-dsl/references/rmmv-local-runtime-1.6.1' 'F:/Shuen/RPG/rpgmaker-event-dsl/references/RPGMV/nwjs-win/Game.exe' 'M:/Shuen/Codex/tools/media-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe' 'M:/Shuen/Codex/asset-validation-notes/n03-animation-reproduction-new'
~~~

原始完整成功运行在 M:/Shuen/Codex/asset-validation-notes/n03-animation-20261102/run-04，保留shell、项目、所有有效自制媒体、profile、输入、命令、日志与运行结果。交接目录probes/native-animation可复制入实施probes，evidence/06-native-animation可复制入实施evidence；不需把NW shell/profile复制进仓库。

## 未完成尝试与观察边界

run-01：缺背景Damage/Weapons/ButtonSet，场景从未ready，45秒保护超时；不通过。run-02：图像预加载成功后原生purge清空_image，探针附加error listener仍解引用该字段，发生探针TypeError而终止；不通过。run-03：实际动画已完成，但探针用control-se子串检查对照音频，误匹配control-second图片，独立断言失败；不通过。run-04改为精确两个audio/se URL与name，并在观察器中保留Image对象引用，增加真实Canvas drawImage验证，所有断言通过。前三次目录和原始失败/输入/命令哈希均保留在acceptance-receipts.json的attempts，不以静态分析或准备状态计通过。

成功run-04还原样记录两次预加载Image对象被原生清理后的浏览器error事件：对应控制图，stillActiveImage=false、bitmapLoadingState=purged，imageSrc已是index.html；此前同bitmap已有960×192自然尺寸的原生load回调。这是未解码预加载对象的原生_clearImgInstance清src后事件（rpg_core.js:787、1560–1573），不是选定Animation1双图加载失败。原始事件未删去、未改成成功；选定双图另有实际ready、load与Canvas消费证据。

只对本次有效自制四帧样例观察关系和准确文件定位；不保证所有动画布局/插件/媒体内容，不声称人耳听到扬声器输出。N03没有新增产品特殊名称决定，也不能消除N02既有反例或宣布整规格完成。
