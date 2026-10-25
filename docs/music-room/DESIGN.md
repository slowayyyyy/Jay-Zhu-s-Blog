---
name: "苍蓝回廊 · 乐境与聆听室"
description: "窗边聆听手记：冷白浅蓝窗光、真实黑胶与随曲封套。"
colors:
  primary: "#167eb3"
  ink: "#163c65"
  muted: "#486986"
  paper: "#f3f8fc"
  ink-dark: "#dbe8f5"
  muted-dark: "#afc5da"
  paper-dark: "#101d2b"
  surface: "white"
  surface-dark: "oklch(0.23 0.015 var(--hue))"
  divider: "rgba(0, 0, 0, 0.08)"
  divider-dark: "rgba(255, 255, 255, 0.08)"
typography:
  display:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "2rem"
    fontWeight: 400
    lineHeight: 1.4
  headline:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "1.4rem"
    fontWeight: 400
    letterSpacing: "0.02em"
  title:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "1.7rem"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "var(--font-sans)"
    fontSize: "1rem"
    lineHeight: 1.9
  label:
    fontFamily: "var(--font-sans)"
    fontSize: "0.85rem"
  lyric:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "var(--room-lyric-size,24px)"
    lineHeight: 1.7
  translation:
    fontSize: "var(--room-translation-size,16px)"
    fontWeight: 500
    lineHeight: 1.7
  time:
    fontFamily: "var(--font-mono)"
    fontSize: "0.8rem"
rounded:
  lg: "8px"
  mini: "12px"
  pill: "30px"
  round: "50%"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "1.75rem"
  section: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.round}"
    width: "54px"
    height: "54px"
  button-ghost:
    textColor: "{colors.muted}"
    padding: "{spacing.sm}"
  button-text:
    textColor: "{colors.primary}"
    padding: "0.5rem 0"
  panel-tab:
    textColor: "{colors.muted}"
    rounded: "{rounded.pill}"
    padding: "0.35rem 1.1rem"
  panel-tab-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  input-search:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 0.65rem"
  listening-note:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0.5rem 0"
  song-row:
    textColor: "{colors.ink}"
    padding: "0.75rem 0.45rem"
  song-row-current:
    backgroundColor: "color-mix(in srgb,var(--room-accent,var(--primary)) 7%,transparent)"
  room-entry:
    backgroundColor: "color-mix(in srgb,var(--primary) 5%,var(--card-bg))"
    rounded: "{rounded.lg}"
    padding: "1.15rem"
  room-mini:
    backgroundColor: "var(--card-bg)"
    rounded: "{rounded.mini}"
    padding: "0.6rem 1rem"
---

# Design System: 苍蓝回廊 · 乐境与聆听室

## Overview

**Creative North Star: "窗边聆听手记"**

冷白纸面、浅蓝窗光与左缘花影组成安静、浪漫的聆听空间。真实黑胶、透明金属唱臂和随当前歌曲切换的封套承担主要视觉身份；常规字重文楷与宽松歌词让界面保持自然、疏朗。

本系统仅约束 `/music/` 门厅与 `/music/room/` 聆听室。门厅保留博客卡片语境、共享播放器和进出过渡；宽版窗光空间及其主题覆盖仅在房间生效。全站导航、字体偏好、主题和页脚继续由博客系统管理。

本次刷新以 `src/styles/music-room.css`、房间页面、共享 MusicPlayer、music-room 脚本及配置为准，承接 [PRODUCT.md](PRODUCT.md)、[BRIEF.md](BRIEF.md) 与已给定的 finish 结论（ship，三项 material fixes 已解决）。`Layout.astro` body 中的 THESIS / OWN-WORLD / STORY / FIRST VIEWPORT / FORM 五块契约对应批准概念 comp20261025、seed 266efb2f。桌面、手机、两种暗色及专注截图已核对；此文档记录实现，不承担发布状态。

**Key Characteristics:**

- 冷白浅蓝底、深蓝文字与单一配置强调色。
- 原生窗光花卉图像、真实唱片与歌曲原有封面共同构成空间。
- 桌面左唱片、右歌词或当前曲手记，下方一组完整控制与进度。
- 手机纵向播放器与横向滚动唱片架；迷你条按需出现，专注模式收起共享站点界面。

## Colors

前言记录实际基础值；配置强调色负责状态，冷白与蓝黑纸面负责明暗环境，实物素材保留自身颜色。

### Primary

- **窗光浅蓝（primary）**：来自 `music-room.json` 的 `accent`，映射到 `--room-accent`，并在房间内绑定 `--primary`。播放按钮、前后曲、进度、音量、活动歌词、页签和筛选共用它；明暗主题沿用同一配置值。

### Neutral

- **深蓝墨色（ink / ink-dark）**：房间标题、曲名和正文；暗色切换为浅蓝白。
- **蓝灰注释（muted / muted-dark）**：歌手、时间、辅助控制与未选中歌词。
- **冷白纸面（paper / paper-dark）**：房间的 html、body 与背景渐隐终点；暗色为蓝黑纸面。
- **主题卡片面（surface / surface-dark）**：迷你条沿用博客 `--card-bg`；浅色默认白，开启全站随色相选项时跟随既有 OKLCH 映射。主播放区和手记不再另铺卡片底。
- **轻分隔线（divider / divider-dark）**：沿用 `--line-divider`，用于唱片架入口、列表、搜索和专注入口边界。

**The Room Accent Rule.** 房间的播放、进度、音量、歌词和选择状态共用配置强调色。

暗色背景使用独立浓度；未配置暗色专图时，沿用当前桌面或手机亮色取景并降低浓度、应用 `saturate(.7)`。配置暗色专图后以该图替代亮色图并移除饱和度滤镜。歌曲封面、黑胶和唱臂不套用背景暗化。导航与页脚保留全站主题表现，不把截图中的页脚装饰吸收为房间暗色令牌。

## Typography

**Display Font:** 自托管 `LXGW WenKai Screen R`，serif 回退；由音乐样式导入已有字体包。

**Body Font:** 继承博客 `--font-sans` 与 `firefly-font-mode`；默认文楷和访客选择的原字体均保留。

**Label/Mono Font:** 标签继承正文，时间沿用 `--font-mono`。

**Character:** 标题依靠字形和比例建立身份；歌词原文大于翻译，曲名可换行，辅助信息保持次级层级。

- **Display**：房间标题采用前言 display；手机为（1.7rem），没有旧版标题字距。
- **Headline**：章节标题采用前言 headline；手记小标题为（1.25rem、400）。
- **Title**：当前曲名采用前言 title；1000px 及以下为（1.45rem），760px 及以下恢复（1.7rem）。歌手桌面为（1rem、行高 1.6），手机为（0.95rem）。
- **Body**：手记正文采用前言 body，保留换行并允许长词折行，无额外 ch 宽度限制。
- **Lyric / Translation**：使用 CMS 注入字号与前言行高；当前原文为强调色、字重（500），翻译保持蓝灰次级层级。页签文字为（0.95rem）。
- **Label / Time**：常用辅助信息采用前言 label；时间采用前言 time。迷你条曲名与歌手分别为（0.8rem / 0.65rem）。

**The Regular Wenkai Rule.** 房间标题、当前曲名、章节标题与手记标题使用自托管文楷常规字重（400）；活动歌词的状态字重独立处理。

## Layout

聆听室内容层须高于页脚装饰层，低于共享导航及其弹层；固定迷你控件不能被后方页脚覆盖。验收需检查实际点击命中，不能只依据控件可见或 ARIA 状态。

房间复用博客结构，收起该路由的壁纸、侧栏、樱花及人物挂件。主内容最大宽（1200px），顶部留（6.5rem）；房间水平内边距（2rem）。窗光背景独立铺到视口两边，高（720px），底部从（72%）开始渐隐至纸面。它是播放区背景，不是照片横幅。

桌面播放器为十二列网格，列距（1rem）、行距（0.8rem）。唱片占第 1–7 列、前两行；歌词或当前曲手记占第 9–12 列、前两行。唱片宽度为 `min(73%,var(--room-record-size,440px),max(300px,calc(100svh - 350px)))`。第三、四行构成下方完整播放带：第 1–3 列显示曲名与歌手，第 4 列起显示单组控制和进度；时间分列于进度两端。脚本移动既有时间、音量及翻译节点，保留其共享引擎绑定。

1000px 及以下，列距变为（0.65rem），信息占前两列，控制与进度从第三列开始；封面架由六列变四列。760px 及以下，房间内边距为（1rem）、主内容顶部为（5.2rem）、背景高为（610px），启用手机单独取景。播放器依次排为唱片、居中歌曲信息、控制、进度、页签与翻译、歌词或手记、按需展开的曲库抽屉。唱片宽为 `min(80vw,calc(var(--room-record-size,440px) * .8))`，收起后方大封套；控制宽上限（360px），音量滑杆收起，静音按钮保留。

唱片架默认封面视图，桌面六列，间距（2rem 2.25rem）；手机改为横向滚动，每项宽 `min(42vw,180px)`，间距（1.25rem），采用 proximity 吸附。手机曲名可换行；搜索另占满一行。列表视图保留横排歌曲行，不转为封面网格。

共享导航以自身 shell 的容器宽为依据：不超过（1440px）时收起完整链接和内联搜索，保留品牌及菜单、搜索入口。它与房间内容宽度分别计算。

迷你条宽上限（1136px），桌面宽 `calc(100% - 2rem)`、底距 `max(.75rem,env(safe-area-inset-bottom))`；手机宽 `calc(100% - 1rem)`、底距 `max(.5rem,env(safe-area-inset-bottom))`，进度独占第二行。存在迷你条节点时底部预留（7rem），即使其当前隐藏也保留此空间。

## Elevation & Depth

空间感来自窗光图像、实体封套与透明唱臂的柔和投影，内容通过留白和细线分层。当前手记为开放正文，唱片架不套通用卡片容器。投影的准确值见 sidecar：后方封套（`5px 9px 20px rgb(19 47 72/.16)`）、架上封面（`2px 5px 10px rgb(24 55 75/.13)`）、唱臂滤镜（`drop-shadow(2px 4px 3px rgb(15 25 35/.18))`）、迷你条（`0 5px 25px rgb(30 60 80/.16)`）。迷你条层级（45），共享导航（50），专注退出入口（60），唱片转场装饰（120）。

**The Material Depth Rule.** 投影用于实体封套、唱臂和固定控制层，不扩展为每个内容区的卡片效果。

## Shapes

黑胶、唱片中心封面与播放按钮采用圆形；页签、主搜索和专注入口采用前言 pill。门厅入口与手记归档搜索保留前言 lg，迷你条使用前言 mini。架上封套保持方形图像，不继承已淘汰的横幅小圆角规范。

唱片中心的歌曲封面占直径（53%），以（3px、#111519）圆边裁切。后方封套采用当前曲真实封面、轻旋转（−3deg）；唱臂固定在右上方，透明边缘完整，不跟随封面旋转。唱片架启用露盘时封面区域宽（82%），后侧黑胶宽高（94%），向右露出；关闭此配置时回到完整方形封面。

## Components

### Buttons

主播放按钮为浅蓝实心、白色 SVG 图标，房间尺寸（54px），手机沿用；控制行按钮至少（44px × 44px）。主按钮 hover 为 `brightness(.92)`，继承（300ms）状态过渡；辅助按钮以蓝灰或强调色表示状态，既有辅助 active 缩放（.95）。迷你播放按钮为（34px），门厅播放按钮保留（48px）。

房间和门厅的按钮、链接、输入，以及房间 summary 与手记正文区域，沿用强调色键盘轮廓（2px、偏移 4px）。图标为内联 SVG，控制保留可读标签、ARIA 展开或选中状态。

### Cards / Containers

门厅入口继续使用细边、轻主题混色与（1.15rem）内边距。房间主播放区、歌词和手记不再铺独立卡片底。手记位于歌词同侧、同高度的切换面板；只显示当前歌曲的 `note`，无内容时显示配置空状态，正文限高（18rem）。旧手记封面节点在新版隐藏。

全部手记是默认收起的原生 details，支持按歌名、歌手和正文搜索，列表限高（24rem）；条目按需展开，仅“听听”按钮触发播放。保留歌曲手记的参考标记。旧房间 `notes` 仅迁移归档，不恢复为展示数据源。

### Inputs / Fields

主搜索为透明底、主题细边和胶囊形，外框内边距（0 .65rem）、宽上限（240px），内部输入为（1rem）字、内边距（.6rem .25rem）。归档搜索改用（8px）圆角并填满面板。搜索与分类同时过滤，不改变队列顺序；零结果使用配置说明。未实现独立错误或禁用视觉，不新增默认样式。

### Navigation

歌词与手记共用一个页签位置：活动项为强调色实心胶囊、白字，其他项为蓝灰文字；支持方向键、Home / End 与单一页签焦点。未显示面板隐藏并 inert，歌词收起时提供重新展开入口。

情境分类现为文字筛选，活动项使用强调色与（2px）底线；不再渲染三张情境封面横幅。封面 / 列表切换使用强调色文字与下划线（偏移 7px）。筛选不会触发播放或重排共享队列，唱片架内筛选不跳动页面。

### Shared Turntable & Lyrics

门厅、房间和迷你条是同一个 MusicManager 的视图，切换保留歌曲、时间、音量、模式及歌词 / 翻译偏好。当前配置首次展开歌词、翻译默认关闭；已有访客偏好优先。歌词跟随播放并可点击或用 Enter / Space 跳转，抽屉折叠后 inert 且 aria-hidden。

原生素材与配置来源：

| 材料 | 仓库路径与职责 |
| --- | --- |
| 窗光与花卉 | `public/assets/images/music-room/windowlight-scene.webp`：原生摄影风栅格图，AI 生成；花瓶与蓝花在左缘，中央与右侧留白。来源见 [WINDOWLIGHT_ASSET.md](WINDOWLIGHT_ASSET.md)。 |
| 黑胶 | `public/assets/images/music-room/vinyl.webp`：透明实物材质，门厅、房间与露盘唱片架复用。 |
| 金属唱臂 | `public/assets/images/music-room/tonearm.webp`：透明素材，仅房间显示。 |
| 歌曲封面与封套 | `src/data/azure-content.json` 的 `playlist[].cover`，对应 `public/assets/images/music-covers/` 中现有 PNG / SVG；中心封面、大封套和唱片架均用真实当前曲数据。 |

`src/data/music-room.json` 经 `src/lib/music-room-settings.mjs` 归一化，CMS 字段由 `public/admin/config.yml` 维护。下表是当前配置与源码约束，不是新增默认值：

| 配置 | 当前值 / 映射 |
| --- | --- |
| `accent` | 前言 primary → `--room-accent`；只接受六位十六进制，失效时沿用源码中的同一浅蓝回退。 |
| `appearance.backgroundImage` / `mobileBackgroundImage` | 均使用上述窗光图；桌面取景（50%,50%）、手机（0%,50%），zoom 均（1）。手机留空回退桌面图；取景限制为（0–100%），zoom 为（1–3）。 |
| `appearance.darkBackgroundImage` | 当前留空，可配置专图；不虚构暗色素材。 |
| `backgroundOpacity` / `darkBackgroundOpacity` | （90 / 18）→ `--room-scene-opacity` / `--room-dark-scene-opacity`，百分比限制（0–100）。 |
| `recordSize` | （440px）→ `--room-record-size`，归一化范围（300–520px），实际显示仍受响应式公式约束。 |
| `lyricFontSize` / `translationFontSize` | （24px / 16px）→ `--room-lyric-size` / `--room-translation-size`，范围（18–32px / 12–22px）。 |
| `lyricHeight` | （380px）→ `--room-lyric-height`，歌词及手记面板共用，范围（280–520px）。 |
| 展示开关 | `showBackground`、`showSleeve`、`showFocus`、`sleeveLibrary` 当前均开启；`player` 管理唱片/唱臂素材取景、旋转、歌词初始偏好与迷你条开关。 |
| `miniMode` / `defaultView` | 当前为 `auto` / `covers`；CMS 可选 `always` / `list`。 |
| 文字与分类 | `labels`、标题、说明、搜索/空状态、分类及手记入口均可配置；每首手记继续在该歌曲的 `note` 编辑。 |

播放时只有中心封面按（10s linear infinite）旋转，暂停停止。门厅与房间保留唱片 FLIP 位移，当前（600ms）、限幅（450–750ms），缓动 `cubic-bezier(.22,.68,.18,1)`；唱臂从转场克隆中移除。显式返回可恢复门厅滚动位置，普通导航与历史恢复交给站点路由。

**The Reduced Motion Rule.** 减少动态偏好关闭唱片封面旋转、音乐表面 CSS 过渡、平滑滚动及唱片架抬升；同时跳过 FLIP 位移。关闭配置或唱片在屏外时也跳过位移，不影响播放与返回滚动意图。

### Library & Fixed Mini Player

列表使用（44px）封面、曲名、歌手、细底线与右侧播放状态；当前或 hover 使用强调色（7%）透明混色。封面视图去除行底板，以实物封套与露出黑胶表达收藏；hover / 当前封套抬升（3px），当前曲名为强调色。点击当前歌切换播放，点击其他歌切曲。

**The Single Control Band Rule.** 主播放区保留一组完整控制与进度；当前 `auto` 策略只在主控制行底边越过顶部导航边界（88px）后显示迷你条，而非主控件尚在屏幕下方时提前出现。配置 `always` 是显式例外，`showMini` 可完全关闭。隐藏时同步 hidden、inert 与 aria-hidden；若焦点在即将隐藏的迷你条内，移回主播放按钮。

### Focus Listening

专注时隐藏实际共享导航顶行、共享页脚、回顶按钮及阅读进度条，同时隐藏房间标题、唱片架和迷你条；共享导航同步 inert。主内容顶距变为（1.5rem），播放区以 `calc(100svh - 3rem)` 最小高度居中，退出入口固定在右上。再次点击或 Esc 退出，恢复进入前滚动位置及导航交互，播放状态不变；Esc 同时将焦点放回专注按钮。

## Do's and Don'ts

### Do:

- **Do** 把本规范限定在音乐表面，保留博客主题、字体偏好、共享 MusicManager 与门厅入口。
- **Do** 用配置强调色统一播放、歌词和选择状态，保留明暗纸面与文字映射。
- **Do** 用原生窗光花卉图、真实黑胶和歌曲原有封套建立空间，展示标题保持文楷常规字重（400）。
- **Do** 在手机纵向排列播放器，并保留横向滚动唱片架、单组主控制和安全区适配。
- **Do** 保留参考手记标记、SVG 控制、ARIA / inert 状态、键盘行为与减少动态偏好。
- **Do** 在专注退出时恢复滚动与共享导航交互，在主控制离开顶部后才按 auto 策略显示迷你条。

### Don't:

- **Don't** 在聆听室背景重新引入人物壁纸或人物挂件；歌曲原有封面中的人物不受此限制。
- **Don't** 为门厅、房间或迷你条另建音频引擎，或让视觉过渡重置播放与访客偏好。
- **Don't** 恢复旧照片横幅、三列盒装播放器、三张情境封面卡片或入场即重复显示迷你条的默认处方。
- **Don't** 把桌面网格压缩到手机、让隐藏面板保留焦点交互，或用焦点模式遮罩代替隐藏实际共享界面。
- **Don't** 把示例分类、歌曲封面内容、侧栏预览色阶或全站页脚装饰固化为音乐房间的通用令牌。
