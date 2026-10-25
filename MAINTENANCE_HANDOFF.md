# 苍蓝回廊维护交接

最后更新：2026-10-25

## 2026-10-25 窗光唱片室

- 按用户本轮批准概念图替换 `/music/room/` 的空间设计；保留 `/music/` 门厅、唱片共享过渡和唯一 MusicManager。14 首歌曲、顺序、真实封面、歌词、翻译与手记数据不改，文章和其他媒体不动。
- 窗光与蓝花作为连贯背景，黑胶后的真实封套随歌曲更新；歌词/当前曲手记共用区域。桌面展开播放控制带和时间进度；手机唱片架横向翻阅，也可切列表、分类和搜索。
- 后台“乐境门厅与聆听室”新增“窗光主画面与阅读排版”“聆听室按钮与提示文字”：桌面/手机独立取景、可选暗色图、背景浓度、唱片与封套、字号/歌词高度、专注开关、唱片架样式、迷你播放器出现时机。真实图片与取景直接写入同一 JSON，详见 `docs/BACKEND_CONTENT_MAP.md`。
- 新图 `/assets/images/music-room/windowlight-scene.webp`（1600×900，35.1 KiB）登记为“聆听室 · 窗光花影”，45 项原素材索引保留；原生成图与完整提示词见 `docs/music-room/WINDOWLIGHT_ASSET.md`。旧顶部图、分类封面、手记归档保留为隐藏数据，不删除、不回填。
- 默认迷你控件仅在主控件滚过视口上缘后显示；隐藏时 inert，专注时不显示。专注隐藏实际导航、完整页脚与返回顶部，进入归位、退出恢复位置；观察器在路由重建时清理，不叠加播放监听或更改队列。
- 恢复分支 `codex/restore-before-windowlight-room-20261025`、标签 `pre-windowlight-room-20261025` 指向 `e06a74df`；实施分支 `codex/windowlight-listening-room-20261025`。工作树 `/Users/jayzhu/.codex/worktrees/add-tanya-song/个人博客`，不要混入文稿主检出的既有未提交工作或工作树内既有 `.impeccable/`。
- 验收图与构建记录：`/Users/jayzhu/.codex/project-storage/canglan-blog/previews/windowlight-room-20261025/`。117 项 Node 回归已通过，包含旧配置兼容、CMS 范围、素材库、页签焦点、自动迷你控件、专注与清理；生产构建已通过。最终发布以 main 的 Cloudflare 成功检查与正式音频实测为准，不改 OAuth/R2/Cloudflare 配置。
- 独立终审 `disposition: ship`，三项修正均 `resolved`：桌面三组双语歌词与控制带、手机横向唱片架、专注实际隐藏与视口归位。审阅代理 `01a1714e-9c77-7ed0-9ffb-40e00f6ada47`；最终剩余 `clear`。
- 正式站点实测：14 首音频同站 Range 均 HTTP 206；共享 audio 在聆听室→门厅→聆听室持续 44.20→55.03→77.43 秒且封面一致。页脚原有叠层曾遮挡页末迷你控制，已将聆听室内容层放到页脚层之上，保留导航菜单更高层级；须以按钮中心实际命中与真实暂停/下一首验证，不能仅看 aria 或可见性。

## 2026-10-22 新增陶喆《流沙》《普通朋友》

- 在现有 12 首末尾按用户给定顺序追加《流沙》《普通朋友》，ID 分别为 `david-tao-liusha`、`david-tao-putong-pengyou`；此前所有歌曲字段与无关站点设置经语义比较完全一致。
- 用户 MP3 经现有 GitHub 所有者授权上传 R2，地址 `/media/audio/20261022-david-tao-liusha.mp3`（7828154 字节、约 242.599 秒）及 `/media/audio/20261022-david-tao-putong-pengyou.mp3`（7921164 字节、约 255.164 秒）；MD5/ETag 一致且 HTTP 206 前 4096 字节校验通过。未把 MP3 或密钥写入仓库。
- 用户 KRC 通过现有转换器生成 52 / 58 行逐字时间歌词，文件 `/lyrics/david-tao-liusha.json`、`/lyrics/david-tao-putong-pengyou.json`；均为中文歌曲，不额外编造翻译。原 KRC 持久备份在 `/Users/jayzhu/.codex/project-storage/canglan-blog/backups/add-david-tao-20261022.DC8nnM/`。
- 两张截图按顺序取内圆，用原 PNG 字节嵌入 SVG，不改绘、不旋转，封面 `/assets/images/music-covers/13-david-tao-liusha.svg` 与 `/assets/images/music-covers/14-david-tao-putong-pengyou.svg`；对应 `-original.png` 完整保存。四项均登记后台视觉素材库，歌曲可在原歌单管理中编辑。
- 恢复分支 `codex/restore-before-david-tao-20261022`、标签 `pre-david-tao-20261022` 指向 `9bb38649`。113 项 Node 回归、Astro（0 错误/警告/提示）、TypeScript 及 39 页生产构建通过，包含新增顺序、歌词计时、封面原字节及素材库配对回归；正式上线须检查 Cloudflare 成功和真实播放。

## 2026-10-22 乐境导航内容区定位修复

- 根因：`music-room.js` 对所有进入门厅的导航执行滚动记忆恢复，首次默认值 0 覆盖全站路由的 `#main-grid` 定位，导致点击导航“乐境”回到顶部大图。
- 仅明确的“进入聆听室 / 回到乐境”往返接管滚动；普通导航和浏览历史仍由全站路由处理。未访问过门厅时不伪造滚动记忆，显式锚点优先；关闭动画、减少动态效果或唱片不在视口时仍正确记忆返回位置，取消/失败导航清除待恢复意图。
- 新增 5 项实际控制器回归，覆盖普通导航、旧记忆、往返、直接进入房间、关闭记忆、锚点、取消及失败；共 110 项 Node 回归、Astro（0 错误/警告/提示）、TypeScript 检查及 39 页生产构建通过。桌面浏览器验证全屏模式普通入口到内容区、房间到顶部和返回恢复正常。
- 恢复分支 `codex/restore-before-music-navigation-20261022`、标签 `pre-music-navigation-20261022` 指向 `df96e906`，已先同步站长最新文章修改。本次无文章、歌单、素材或后台数据修改；正式发布后检查 Cloudflare 成功并复核桌面/手机导航。

## 2026-10-20 新增 Avril Lavigne《Innocence》

- 在歌单末尾追加第 12 首，固定 ID `avril-innocence`；此前 11 首的顺序、音频、封面、歌词、翻译和手记不变。
- 用户 MP3 经现有 GitHub 所有者授权的 `/api/media/audio/` 上传到 R2，地址 `/media/audio/20261020-avril-innocence.mp3`。7897118 字节、约 233.038 秒；远端 ETag 与本地 MD5 一致，206 分段请求字节核验通过。无新密钥、无 R2 删除、无 MP3 入 Git。
- KRC 转为 `/lyrics/avril-innocence.json`：61 行唱词及逐字时间，中文翻译直接取自用户 KRC 内嵌数据，并同步到后台歌曲的翻译列表。英文作词/作曲署名不作为唱词；翻译先按原始时间行对应再去署名，防止错位。不等长翻译表不推测配对。
- 封面用 `/assets/images/music-covers/12-avril-innocence.svg` 对用户截图内圆取景；SVG 嵌入原 PNG 字节，不改绘、不重采样。完整原图 `/assets/images/music-covers/12-avril-innocence-original.png` 与取景版均登记素材库，可在后台复用。
- 原 KRC 备份 `/Users/jayzhu/.codex/project-storage/canglan-blog/backups/add-avril-innocence-20261020.7cGuIZ/avril-innocence-original.krc`，不依赖酷狗缓存长期保留。恢复分支 `codex/restore-before-avril-innocence-20261020`、标签 `pre-avril-innocence-20261020` 指向 `caede695`。
- 本地 105 项 Node 回归、Astro/TypeScript 检查和生产构建通过；歌曲上线以 Cloudflare 检查成功及正式站真实播放、翻译与逐字歌词验证为准。

## 2026-10-19 暗色正文可读性修复

- 根因：多处页面引用未定义的 `--content-regular`，默认正文也没有主题颜色，暗色背景下继承浏览器黑色；`--deep-text` 原来仅有亮色值。
- `variables.styl` 补齐亮暗正文颜色与暗色深层文字颜色，`main.css` 在 base 层为 body 提供主题文字继承。不使用全局强制白字，保留组件、图片横幅、文章语法高亮、歌词渐变和聆听室局部配色。
- 已核对更新日志、说说、乐境/聆听室、关于、友链、相册、归档、朋友圈、留言、番剧与首页等；390px 说说/日志无横向溢出，亮暗切换正确。新增编译实际 Stylus 变量、层叠范围和跨 24 个色相的正文/次要文字对比度回归。
- 不修改文章、后台数据、歌曲或素材。恢复分支 `codex/restore-before-dark-text-20261019`、标签 `pre-dark-text-20261019` 指向 `502ca053`；截图存放在 `/Users/jayzhu/.codex/project-storage/canglan-blog/previews/dark-text-20261019/`。
- 本地 102 项 Node 回归、Astro/TypeScript 检查和构建通过；发布须检查对应 Cloudflare 提交成功并在正式站验证主题切换。

## 2026-10-13 常驻播放器重复响应修复

- 按站长追加要求，聆听室唱片不再显示中央装饰轴点，封面与旋转不变；仅移除房间的伪元素，门厅保持原状。
- 正式站复现：门厅进入聆听室后返回，顶部“下一首”单击从 spiral 跳至ムスビメ；并非歌单重排，而是 Swup 重放同一路由的内联脚本，在仍然存在的导航/侧栏播放器上重复绑定按钮。暂停、翻译、模式切换也会执行多次并可能相互抵消；刷新会清除重复绑定。
- `MusicPlayer.astro` 以实际 DOM 节点作初始化防重，重新创建的聆听室节点仍正常初始化。节点仍连接时不误清理全局同步监听；真正移除后清理监听、滚动计时器与动画帧。
- 加载提示层始终不拦截点击，缓冲时仍可暂停、切歌和切换翻译；组件 `aria-busy` 随真实加载状态更新。
- 本次不修改音频引擎、歌单、随机算法、手记、后台配置或素材；11 首歌曲顺序与改版前一致，默认列表循环。恢复分支 `codex/restore-before-music-controls-20261013` 与标签 `pre-music-controls-20261013` 均指向 `d8001ac4`。
- 新增实际脚本片段回归，覆盖六次重放后的单次响应、新 DOM 节点、取景布局移动/真实移除、缓冲提示层、原歌单顺序及房间无装饰轴点。99 项 Node、Astro 检查（0 错误/警告/提示）、TypeScript 与构建通过；本地三次往返后的顶部模式/翻译同步和桌面/390px 无轴点验证通过，正式发布后还需验证真实音频与常驻按钮。

## 2026-10-13 手记随歌曲切换（当前逻辑）

- 主页面只保留一篇当前歌曲手记，监听现有 `fm:init` / `fm:track` / `fm:play-state` 与路由初始化；没有手记的歌曲隐藏整个当前手记区域，不生成参考文字、不改播放队列。
- 手记编辑位置改为“全部前台文案与歌单 → 音乐歌单 → 对应歌曲 → 听歌手记”；正文留空即隐藏，可选标题与参考标记。房间设置管理区域开关与入口/检索文案。
- “查看全部手记”默认折叠，内部按歌单顺序浏览、搜索与展开，内容容器限高滚动，不把整页无限撑长。展开和搜索不触发播放；仅“听听”按钮使用原播放器。
- 原 `music-room.json` 的 `notes` 原文不变并作为隐藏迁移归档保留，前台不再从归档回填；已迁入对应曲目的 `note`。清空新手记时旧归档不会复活。
- 恢复分支 `codex/restore-before-song-notes-20261013`、标签 `pre-song-notes-20261013`（`29ec9721`）；原配置离线备份 `/Users/jayzhu/.codex/project-storage/canglan-blog/backups/pre-song-notes-20261013.pRUfGn`。无媒体、文章或外部认证变更。
- 验证：94 项 Node 回归、Astro 检查（0 错误/警告/提示）、TypeScript 与生产构建通过；浏览器检查手记展开/检索不启动播放、无结果提示与 390px 无溢出。实际切歌隐藏/恢复与正式发布须再在生产验证。

## 2026-10-13 聆听室导航空间修复

- 移除聆听室导航的 1200px 宽度上限，正文仍保留 1200px 阅读列；导航新增以实际外壳宽度为依据的容器断点，空间不足时显示搜索与菜单入口，避免宽屏完整菜单挤压站名和工具按钮。
- 手记仍按后台列表顺序全部展示，不自动轮播、不生成播放队列。点击关联歌曲才播放，后续遵循原播放器模式；此规则已补充到后台表单提示。
- 恢复分支 `codex/restore-before-room-nav-20261013`、标签 `pre-room-nav-20261013` 指向 `5efa62d8`。不修改用户手记、歌单、音乐、文章或外部认证配置。
- 验证：92 项 Node 回归、Astro 检查（0 错误/警告/提示）、TypeScript 检查和生产构建通过；2170px 完整导航、1441px 容器折叠、390px 菜单打开/收起及门厅无刷新进入均无重叠或横向溢出。

## 2026-10-13 乐境与聆听室

- 实现保存在 `codex/music-listening-room-20261013`；恢复分支与标签已创建，最新文章已保留。
- 用户选择继续对齐已确认的概念图；七项独立验收问题已全部解决，最终结论 `ship`。聆听室使用真实唱片、透明金属唱臂、冷白花束横幅和横向情境歌单，不恢复人物壁纸。
- `/music/` 保留门厅，`/music/room/` 展开聆听室；共用唯一 MusicManager/audio，唱片往返过渡约 600ms。真实音频测试中 15.79 → 36.86 → 63.36 秒持续播放；歌词展开与翻译保存访客偏好，折叠抽屉 inert，底部播放器固定并预留内容空间。
- 后台“苍蓝回廊设置 → 乐境门厅与聆听室”管理文案、图片取景、精选、歌单、手记、强调色和动效；音频/封面/歌词仍从“全部前台文案与歌单”维护。新增固定歌曲 ID 防止重排错配；添加新歌曲时自动生成 ID。
- 素材库新增花束、黑胶和唱臂。140 个既有文章/图片/音频/歌词逐字节不变，原 Azure 内容除新增歌曲 ID 外语义不变。90 项测试、Astro/TypeScript 检查、生产构建通过；详见 `docs/music-room/IMPLEMENTATION_STATUS.md` 和该目录的 `DESIGN.md`。
- 发布路径为 main Git → Cloudflare Pages；上线必须以对应提交的 Cloudflare 检查成功和正式地址验证为准。测试转接路由、测试页面和临时音乐源修改已移除，不进入生产。

## 2026-10-13 本机辅助目录整理

- 按站长要求，不再把博客预览、截图及备份放在文稿顶层；存放与清理约定已写入主项目和当前工作树的 `AGENTS.md`。
- 内容保护备份迁至 `/Users/jayzhu/.codex/project-storage/canglan-blog/backups/博客内容保护-20261010-沉浸首页.oj7kOe`，保留文章、说说、资料、图片与配置；迁移核对文件哈希。
- `博客改版预览-20261011` 中六张旧验收截图已移入本机废纸篓，可恢复；不影响正式素材及线上页面。
- 今后工作预览放在 `/Users/jayzhu/.codex/project-storage/canglan-blog/previews/`；概念图可留在 Codex 的 `generated_images` 中。有效内容备份不能作为临时产物清理。

## 2026-10-11 首页标题浪漫风微调（当前样式）

- 站长明确首页偏浪漫主义，故障风不符合主题；移除红蓝错位、切片与跳动，改为暖白主字及悬停时八秒缓慢变化的浅粉/淡紫微光。后续不能按历史记录恢复故障风。
- 文字保持原位置和形状；装饰副本淡入淡出，移开鼠标平滑恢复。移动端和减少动态效果偏好下显示静态暖白标题，继续支持首屏外、隐藏标签页及首页暂停时停止动画。
- 未改图片、文图同步、导航、说说及文章内容；简要修正同日公开日志。调整前基线为 `2cfce99b`。
- 验证 84 项 Node 回归、Astro/TypeScript 检查和生产构建；浏览器核对悬停光色、稳定字形、暂停及 390px 无横向溢出。

## 2026-10-11 标题悬停故障风与说说图注居中

- 按站长确认的效果，将柔和循环变色替换为白色主字 + 悬停红蓝重影切片；只有精细鼠标设备启用，移开后恢复静态。沿用原有可见性/暂停控制，减少动态效果时不显示动态副本。
- 标题装饰副本用 `aria-hidden` 排除，仍从后台标题字段读取；不新增内容数据副本。保留移动端静态标题和首页文图同步。
- 说说图注在图片的 figure 内居中；图注不参与容器固有宽度计算，避免长图注撑大缩略图。正文、图片、文章样式均不改动。
- 纠正同日“标题特效与说说小图预览”日志文案，不另增重复记录。恢复分支 `codex/restore-before-title-glitch-20261011`、标签 `pre-title-glitch-20261011` 指向 `237eec80`。
- 验证 84 项 Node 回归、Astro/TypeScript 检查和生产构建；浏览器确认桌面悬停/移开、390px 静态标题及图注中心（与图片中心误差 0px）。

## 2026-10-11 标题变色与说说小图预览

- 标题以 18 秒循环柔和变色；减少动态效果时静态显示，首屏外、隐藏标签页及首页暂停时停止动画。`home-title-motion.ts` 在 Swup 页面更新时清理观察器和旧监听。
- 说说缩略图桌面最大 240px、窄屏最大 180px，保持原比例且不修改原文件；统一接入 Fancybox，支持点击和键盘查看原图。文章图片样式不变。
- 在 `src/data/changelog.json` 补记本次及上次首页、说说更新，后台仍可直接编辑。
- 恢复分支 `codex/restore-before-title-photos-20261011`、标签 `pre-title-photos-20261011` 均指向 `dc267194`；未触碰主目录的原有改动。
- 标题与说说交互使用集成层实际派发的 `astro:page-load` 重新初始化，避免 Swup 延迟启用时遗漏绑定。验证 84 项 Node 回归、Astro/TypeScript 检查、生产构建及桌面/手机端缩略图与原图交互。

## 2026-10-11 沉浸首页与说说时间线

- 首页参考 AIOVTUE 的全屏大图与透明短句面板，由本站组件独立实现；文章区移至下一屏，内页维持原有阅读布局。未恢复开场动画，未更换或删除用户素材。
- 后台“首页短句与文章区”新增 `immersive` 和 `navigationOnDemand` 开关；桌面导航首屏隐藏，鼠标触顶、向下滚动、键盘或窄屏导航入口可显示。非首页导航保持可用。
- `HomeHeroContent.astro` 保留原文图同步时钟，提供上一组、下一组与暂停；联系入口直接使用个人资料链接。不可为图片另建首页固定计时器。单图也能切短句。
- `immersive-home.css` 的定位与导航重要声明放入原来的 utilities 层；主内容内联定位必须同时兼容 `Layout.astro` 的 Swup 生命周期和 `setting-utils.ts` 的壁纸切换，不能只改 CSS。
- 说说仍读取 `src/content/dynamic/`，显示作者头像、正文、原图、日期、地点、置顶与复制链接；每次显示六条，可加载更多。未伪造点赞数，也未新增评论服务。后台“说说页面展示”管理标题、介绍及时间线/独立卡片布局。
- 后台说说日期格式是没有时区的墙上时间，YAML 会按 UTC 解析；渲染使用 UTC 保持原写入时间，避免再加八小时。未修改任何说说原文件。
- 恢复分支：`codex/restore-before-immersive-home-20261010`；恢复标签：`pre-immersive-home-20261010`（`48212195`）。
- 离线备份：`/Users/jayzhu/.codex/project-storage/canglan-blog/backups/博客内容保护-20261010-沉浸首页.oj7kOe`（2026-10-13 从文稿顶层迁入）；工作分支：`codex/immersive-home-aiovtue`。主目录原有未提交改动未触碰。
- 验证：全部 Node .mjs 回归、`pnpm check`、`pnpm type-check`、`pnpm build`；浏览器验证桌面/390px 窄屏、导航出现与收起、暂停与手动切换、说说媒体、链接复制及 Swup 返回首页。

## 2026-10-09 首页有字轮播图与后台选图

- 桌面首页轮播中的 I Miss You 图片改回 `/uploads/home-carousel-i-miss-you-original.webp`；无字版文件和素材索引继续保留，未删除。
- 后台 `image-crop` 控件新增“从已有素材选择”，展示视觉素材索引及 `public/uploads`、`public/assets/images` 中的站内图片；按名称、用途或路径搜索，点击后更新对应条目并重置取景，仍须保存站点设置才会发布。
- 图片选单由 `src/pages/admin/index.astro` 构建时生成；新增文件经 GitHub/Cloudflare 发布后刷新后台即可出现，不再需要复制路径或从 Mac 重复上传。图片上传失败时撤销临时预览，避免误以为已成功保存。

## 2026-10-09 新增蔡健雅《下一次爱情来的时候》

- 音频由 Cloudflare R2 的 `/media/audio/20261009-tanya-next-love.mp3` 提供；上传使用现有受保护接口，未将认证信息写入仓库。
- 用户提供的 KRC 转为 `/lyrics/tanya-next-love.json`，保留 36 行逐字时间；播放器按歌单条目的 `src` 和 `lrc` 配对。
- 唱片封面为 `/assets/images/music-covers/11-tanya-next-love.png`，从用户提供的圆盘截图精确裁切并去除橙色外圈，同时登记在后台视觉素材索引。尚未收到中文翻译，`translations` 留空；以后可在后台该曲目补充。

## 2026-09-26 后台正文行内上下标

- 文章正文在富文本或 Markdown 模式下，选中同一行的文字/数字，可点击页面底部“上标 x²”“下标 x₂”，或使用 `⌘/Ctrl+Shift+.`、`⌘/Ctrl+Shift+,`。无需创建独立段落。
- 原 Decap 自定义上下标组件属于块级，已从正文组件列表移除；新操作通过编辑器粘贴事件写入标准 `<sup>` / `<sub>` 行内标签。编辑区显示标签文本，右侧预览与前台显示实际排版。不能直接改 DOM，否则切换模式后内容会丢失。
- 不修改 Typora 导入流程。Decap 检测到未发布的本地草稿可能提示恢复；是否恢复取决于草稿是否为作者当前需要的内容。
- 回归：`node --test scripts/tests/admin-inline-format.test.mjs`、`pnpm check`、`pnpm build`，并用临时 Test Backend 验证模式切换、快捷键及重新打开草稿后的保留行为；正式配置仍为 GitHub backend。

## 2026-09-19 新增 YOASOBI《たぶん》

- 歌单新增 `たぶん (大概) - YOASOBI`，音频由 Cloudflare R2 的 `/media/audio/20260919-yoasobi-tabun.mp3` 提供。
- 原始 KRC 转换为 `/lyrics/yoasobi-tabun.json`，保留 62 行逐字时间；乐器演奏署名不会混入歌词。
- 62 条中文翻译与日文歌词逐行对应，继续使用播放器现有的翻译开关。
- 唱片封面保存为 `/assets/images/music-covers/10-yoasobi-tabun.png`，播放器会将居中的圆形唱片画面裁成唱片外观。
- 回归：`node --test scripts/tests/cms-bindings.test.mjs`、`pnpm check`、`pnpm build`。

## 2026-09-19 数学公式边界修复

- 修复《How Should Video LLMs Output Time?》文章中 `$$...$$` 与 `\[...\]` 重复嵌套导致的 KaTeX 缺失和错误显示。
- 前台 Markdown 管线会在交给 KaTeX 前移除重复的显示公式边界；已有错误源文件也能容错显示。
- 后台公式组件、文章保存流程与 Typora 一键导入会统一把块公式整理成单层 `$$...$$`，代码围栏中的示例保持原样。
- 公式容器支持窄屏横向滚动，长公式不会把正文页面撑宽。
- 修复分支：`codex/fix-markdown-math`；回归：`node --test scripts/tests/typora-import.test.mjs`、`pnpm build`。

## 2026-09-11 代码块前后台联动

- 文章正文编辑器的“+”菜单提供“代码块（高亮）”：从常用语言中选择后使用 CodeMirror 粘贴代码，可选文件名、长行换行、行号、起始行号与重点行。语言与代码采用独立字段，避免 Decap 自定义编辑组件中嵌套对象值触发运行时错误。
- 保存格式仍是标准 Markdown 围栏代码，并使用 Expressive Code 官方元数据；旧文章中的普通代码围栏继续兼容，不绑定后台私有格式。
- 前台代码块显示语法高亮、语言徽章、可选文件标题、行号、复制按钮和长代码折叠；含连续反引号的代码会自动改用更长围栏，避免截断。
- 恢复分支：`codex/restore-before-code-display-20260911`；恢复标签：`pre-code-display-20260911`。

## 2026-09-11 后台文章状态速览

- “归档文章”列表会根据每篇文章当前字段自动显示状态标签：`draft` 对应“隐藏”，非隐藏且有 `password` 对应“上锁”，其余对应“公开”；`pinned` 作为可叠加的“置顶”状态显示。
- 后台页面只接收“是否上锁”的布尔值，不会把阅读密码内容写进状态标签或页面数据；在编辑器保存文章后，列表状态会在当前后台会话中同步更新。
- 恢复分支：`codex/restore-before-post-status-20260911`；恢复标签：`pre-post-status-20260911`。

## 2026-09-10 樱花特效开关修复

- `SakuraEffect.astro` 在 Swup 无刷新跳转后复用全局樱花管理器，不再清空仍在运行实例的引用。
- 关闭特效会立即取消动画帧、移除画布和 resize 监听，并清理可能由旧会话遗留的孤立画布；重新开启仍可正常创建唯一画布。
- 设置继续保存在浏览器 `localStorage.sakuraEnabled`，刷新和跨页面跳转后保持用户选择。
- 恢复分支：`codex/restore-before-sakura-toggle-20260910`；恢复标签：`pre-sakura-toggle-20260910`。

## 2026-09-05 文章内创建标签

- 文章的 `tags` 使用 `creatable-tags` 控件，可搜索已有标签、输入名称后按回车添加新标签。
- `admin-tags-service.js` 在文章 `preSave` 中先同步 `src/content/tags/*.json`，再返回去重后的标签标识数组；不改变其他文章数据。
- 线上通过现有 GitHub 认证及 `/api/github/` 代理创建记录；本地使用 Decap 的 8081 代理。创建不带旧文件 SHA，避免覆盖已有说明。
- 同步失败会阻止文章继续保存；已成功创建的标签保留，重试会复用。移除文章标签不删除标签记录。
- 恢复标签：`pre-inline-tags-20260905`；测试：`node --test scripts/tests/admin-tags.test.mjs`。

## 当前架构

本站以 Aemeath 为完整前端和交互基线，保留 Firefly 的 Astro 内容系统，并使用
Roxy Edition 配置与洛琪希素材完成个性化。

- 框架：Astro 7
- 包管理：pnpm
- 搜索：Pagefind
- 内容后台：Decap CMS
- 托管：Cloudflare Pages
- 生产地址：<https://jay-zhu-s-blog.pages.dev/>
- GitHub：<https://github.com/slowayyyyy/Jay-Zhu-s-Blog>

## 必须保护的内容

任何重构、升级或批量操作前，必须备份并核对以下路径：

- `src/content/posts/`
- `src/content/dynamic/`
- `src/content/categories/`
- `src/content/tags/`
- `src/data/`
- `public/uploads/`
- `public/media/`
- `public/admin/config.yml`
- `functions/`

不要静默删除不兼容内容。先复制到仓库外备份目录，再记录到迁移清单。

## 本次重构恢复点

- 重构前提交：`20592e6`
- 恢复标签：`pre-roxy-rebuild-2026-09-02`
- 离线备份：`C:\Users\朱勇涛\Documents\博客内容保护-20260902-重构前`

恢复时优先从标签创建新分支，不要强制推送：

```bash
git switch -c restore/pre-roxy pre-roxy-rebuild-2026-09-02
```

## 发布流程

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm type-check
pnpm build
git push origin main
```

Cloudflare Pages 监听 `main`。不要强制推送。

## 外部配置

以下值只能配置在 Cloudflare 环境变量或 Secret 中：

- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- R2 访问凭据

R2 桶绑定不含密钥，已在 `wrangler.jsonc` 中声明为
`BLOG_MEDIA -> jay-blog-media`，必须随 Pages 部署保持生效。

若后台登录或 R2 上传要求重新授权，应由站长本人完成登录。

## Aemeath 功能保留范围

本次已保留欢迎提示、时间问候、每日一言、日程进度、壁纸切换、
更新日志、工具页、动态、朋友圈、追番、友链漫游、音乐播放器、评论增强、
服务状态、文章工作台和定时动态刷新工作流。

首页组合式开场已于 2026-09-02 按站长要求撤下。原组件与配置字段暂时保留，
不参与前端渲染，便于以后需要时重新设计和启用。

未提供外部账号数据时，对应页面保持空状态，不填入模板作者的数据。

## 后台数据源约定

前台个人与站点内容应只从后台管理的数据文件读取，禁止再复制一份硬编码资料：

- `src/data/azure-content.json`：站点信息、公告、每日一言、壁纸、首页、音乐和外部服务。
- `src/data/profile.json`：个人资料、联系入口、兴趣、技术栈和关于页项目。
- `src/data/changelog.json`：更新日志。
- `src/data/tools.json`：工具页。
- `src/data/gallery.json`、`friends.json`：相册和友链。

音乐每条记录同时保存 `src`、`cover` 与 `lrc`，以歌单条目为配对单位。LRC 支持
直接文本或站内文件地址。每日一言按访客本地日期自动轮换，无需每日发布。

## 2026-09-04 后台接入与随机播放修复

- 操作前基线：`23108c6b`，已合并站长 9 月 3 日的文章和短句修改。
- 恢复分支：`codex/restore-before-cms-shuffle-20260903-234706`。
- 恢复标签：`pre-cms-shuffle-20260903-234706`。
- 离线配置备份：`C:\Users\朱勇涛\Documents\博客配置保护-20260903-234706`。
- 首页标题与打字机短句、首页文章区文案、关于页元数据、相册标题、乐境顶部图与无歌词提示、Umami 配置均已接入。关于页姓名、签名与联系方式不再重复硬编码。
- 关于页元数据在 `src/content/spec/about.md`，由 `src/content.config.ts` 的 spec schema 接收。新增可选字段时必须同时更新 schema、渲染与后台表单。
- 旧开场/分支字段保留但隐藏；不要为了让旧字段“生效”而恢复站长已撤下的动画。
- 音乐随机使用不放回队列 + 独立历史，详见 `docs/BACKEND_CONTENT_MAP.md`。音乐地址为空的条目不进入播放队列。
- 禁止重新启用 CMS 保存后的 R2 自动清理。`1853ba58` 已修复误删问题，替换/移出歌单不得顺带删除原音频。这次未上传或删除任何 R2 对象。
- 后台实际管理位置、能力边界与测试命令见 `docs/BACKEND_CONTENT_MAP.md`。

## 首页文图同步

- 基线：`fbaeabfd`；恢复分支 `codex/restore-before-hero-sync-20260904-002349`，标签 `pre-hero-sync-20260904-002349`。
- 配置备份：上述离线配置目录中的 `azure-before-hero-sync-20260904.json`。
- `TypewriterText.astro` 的首页实例使用 `syncCarousel`；时序由 `src/scripts/typewriter-controller.ts` 管理。
- 字句退场后发出可取消的 `hero:cycle` 事件，壁纸加载就绪时同时切换 active 图片并调用 resume 输出下一句首字。不得另加固定图片计时器与首页文字竞争。
- 保留非首页独立轮播、手动切图、固定壁纸和减少动态效果偏好。Swup 替换文字时清理旧实例，壁纸容器仍持久化。
- 回归：`node --test scripts/tests/hero-sync.test.mjs`，含长短句、emoji、异步图片/失败/超时、不同数量、单条数据、后台暂停、断点切换与旧回调失效。

## 旧博客首页摘要恢复

- 2026-09-04 按站长要求，将现有 10 篇文章（含 2 篇草稿）的 `description` 替换为旧博客的 `excerpt` 原文。旧版同名 `description` 不是卡片概括，不应再次用于覆盖当前字段。
- 原文来源：迁移前提交 `7ed7a1bc`，与旧工作目录 `C:\Users\朱勇涛\Documents\个人博客\src\content\posts` 逐篇核对一致。只更新描述，不改正文、图片、日期、标题或草稿状态。
- 替换前恢复分支：`codex/restore-before-descriptions-20260904-010326`；恢复标签：`pre-descriptions-20260904-010326`；文章离线备份：`C:\Users\朱勇涛\Documents\博客描述保护-20260904-010326`。
- 后续仍在“文章 → 页面描述”编辑外部概括；“文章页摘要”是独立字段，留空时会回退使用页面描述。

## 中文行内格式兼容

- 2026-09-04 将 `remarkTightInlineFormatting` 接入 Astro 正式 Markdown 管线，使中文标点或汉字紧邻的 `*斜体*`、`**粗体**` 与后台预览一致，不再把分隔星号显示到文章里。
- 不修改文章源文件；代码、HTML、未配对星号和分隔符内首尾带空格的文本保持原样。
- 恢复分支：`codex/restore-before-cjk-italic-20260904-024129`；恢复标签：`pre-cjk-italic-20260904-024129`。
