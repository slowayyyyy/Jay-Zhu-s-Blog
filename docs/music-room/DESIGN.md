---
name: "苍蓝回廊 · 乐境与聆听室"
description: "音乐表面的窗边聆听手记：冷白纸面、浅蓝光线、真实唱片与封面。"
colors:
  primary: "#167eb3"
  ink: "#163c65"
  muted: "#486986"
  paper: "#f6f9fb"
  ink-dark: "#dbe8f5"
  muted-dark: "#a7bed3"
  paper-dark: "#141e28"
  surface: "white"
  surface-dark: "oklch(0.23 0.015 var(--hue))"
  divider: "rgba(0, 0, 0, 0.08)"
  divider-dark: "rgba(255, 255, 255, 0.08)"
typography:
  display:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "3.4rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0.04em"
  headline:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "1.35rem"
    fontWeight: 400
    letterSpacing: "0.02em"
  title:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "1.9rem"
    fontWeight: 400
    lineHeight: 1.45
  collection-title:
    fontFamily: "'LXGW WenKai Screen R', serif"
    fontSize: "1.6rem"
    fontWeight: 400
  body:
    fontFamily: "var(--font-sans)"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: "var(--font-sans)"
    fontSize: "0.78rem"
    fontWeight: 400
  time:
    fontFamily: "var(--font-mono)"
    fontSize: "10px"
    fontWeight: 400
rounded:
  cover: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
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
    width: "48px"
    height: "48px"
  button-ghost:
    textColor: "{colors.muted}"
    padding: "{spacing.sm}"
  button-text:
    textColor: "{colors.primary}"
    typography: "{typography.label}"
    padding: "0.5rem 0"
  input-search:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.7rem"
  listening-note:
    backgroundColor: "color-mix(in srgb, var(--room-accent) 5%, var(--card-bg))"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "1.35rem 1.75rem"
  song-row:
    textColor: "{colors.ink}"
    padding: "0.7rem 0.45rem"
  song-row-current:
    backgroundColor: "color-mix(in srgb, var(--room-accent) 7%, transparent)"
  room-entry:
    backgroundColor: "color-mix(in srgb, var(--primary) 5%, var(--card-bg))"
    rounded: "{rounded.lg}"
    padding: "1.15rem"
  room-mini:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "0.6rem 1rem"
---

# Design System: 苍蓝回廊 · 乐境与聆听室

## Overview

**Creative North Star: "窗边聆听手记"**

冷白纸面、浅蓝花束和自然窗光构成安静、浪漫的音乐空间。文楷标题与真实黑胶、金属唱臂及歌曲封面形成主要视觉身份；界面保持疏朗，让曲名和歌词成为阅读中心。

本系统只适用于 /music/ 门厅与 /music/room/ 聆听室，房间色彩和宽版布局只在聆听室生效。门厅沿用博客卡片语境；既有全站导航、主题切换和页脚继续由博客系统管理。本记录取自当前实现及 v2 桌面、手机证据，依据已确认概念和修复后 ship 结论；它不声明部署已经完成。

**Key Characteristics:**

- 冷白纸面、深蓝文字与单一浅蓝强调色。
- 常规字重文楷标题，实物唱片与金属唱臂承载音乐身份。
- 桌面展开唱片、信息和歌词，手机把歌词放到播放器下方。
- 情境封面、手记和曲库采用轻边界，固定迷你播放器保持可达。

## Colors

浅蓝负责播放与选择状态，深蓝承担阅读，冷白与既有主题卡片色承载内容；精确值以前言令牌为准。

### Primary

- **窗光浅蓝（primary）**：房间播放按钮、进度与音量填充、选中歌词、选中歌单轮廓、文本动作和活动模式。默认来自音乐配置的 accent，可由后台替换；房间内同时绑定既有播放器的 primary 变量。明暗主题使用同一个配置强调色。

### Neutral

- **深蓝墨色（ink / ink-dark）**：房间标题、曲名与正文；暗色切换为浅蓝白文字。
- **蓝灰注释（muted / muted-dark）**：歌手、时间、播放模式、辅助控制和未选中歌词；暗色使用较亮蓝灰。
- **冷白纸面（paper / paper-dark）**：房间整体背景；暗色映射为深蓝黑。
- **主题卡片面（surface / surface-dark）**：固定迷你条和手记的底色，沿用全站 card-bg。浅色默认 white，开启全站随主题色相的卡片选项时遵循该变量；暗色保留既有 OKLCH 色相映射，不新增房间专用卡片色。
- **轻分隔线（divider / divider-dark）**：歌词栏、曲库行、搜索框和展示方式切换；沿用全站 line-divider。

### Named Rules

**The Room Accent Rule.** 房间内的播放、进度、音量、活动歌词和选中状态共用配置强调色；不要为同一播放状态引入第二套蓝色。

## Typography

**Display Font:** LXGW WenKai Screen R，serif 回退；由现有 npm 字体 CSS 导入并经站点构建自托管。

**Body Font:** 继承博客的 --font-sans 与访客字体偏好。FontSetup.astro 根据 firefly-font-mode 覆盖此变量，默认 wenkai 使用既有 LXGW WenKai Screen；正文不固定为 Roboto，也不改变访客选择。

**Label/Mono Font:** 常规标签继承正文；时间使用既有 --font-mono 等宽栈。

**Character:** 文楷常规字重提供自然书写感，正文和控制保留紧凑、清楚的既有阅读语气。标题身份来自字形和比例，而非加粗。

### Hierarchy

- **Display**：房间主标题，常规字重（400），前言 display 尺寸；手机降为 2.5rem。
- **Headline**：章节标题，常规字重（400），前言 headline 尺寸与字距。
- **Title**：当前歌曲标题，常规字重（400），前言 title 尺寸；手机降为 1.25rem，允许换行。
- **Collection title**：情境封面叠字，常规字重（400），前言 collection-title 尺寸；手机降为 1.05rem。
- **Body**：手记正文使用前言 body 尺寸与行高；歌词原文为 0.9rem、行高 1.45，中文翻译为 0.72rem、字重 500、行高 1.45。正文保留换行，随内容列宽排版，没有额外 ch 宽度约束。
- **Label**：搜索、返回和文本动作使用前言 label；曲库曲名为 0.86rem、字重 500，歌手为 0.7rem。
- **Time**：播放器时间使用前言 time，保持数字对齐。迷你条曲名与歌手分别为 0.8rem 和 0.65rem。

### Named Rules

**The Regular Wenkai Rule.** 房间展示标题、当前曲名、章节标题与情境封面标题使用自托管 LXGW WenKai Screen R 的常规字重（400）。

## Layout

音乐空间由轻量门厅和宽版房间组成。房间复用博客导航，关闭此路由的壁纸、侧栏与人物挂件；主容器最大宽度为 1200px，内部左右留 2rem，主内容顶部留 6.5rem。区段标题上方间距为 2rem，下方为 1rem；局部间距主要沿用前言 spacing 的半 rem 与整 rem 节奏。

桌面播放器为三列：唱片 minmax(200px,310px)、信息 minmax(190px,1fr)、歌词 minmax(220px,1.1fr)，列间距 2rem，最小高度 320px。歌词区域高 310px，可滚动，左侧轻分隔线划开阅读栏。花束横幅的文字落在自然留白处，标题与简介不依赖人物主视觉。

900px 及以下改为唱片与信息两列，唱片列 minmax(150px,240px)，歌词跨两列放在下方，高 235px，并改用顶部分隔线。房间水平内边距降至 0.6rem。540px 及以下唱片列固定 130px、信息列 minmax(0,1fr)，主内容顶部留 5.25rem；播放按钮缩至 40px，曲库抽屉控制隐藏，曲库仍可直接访问。

情境歌单当前为三个等宽封面并排：桌面比例 3:1，手机比例 1.12:1，保持三列而改变取景。手记为正文加右侧方形封面，桌面封面宽 116px，手机为 72px。曲库默认行列表，可切换为五列方形封面；540px 及以下为三列。搜索框在手机填满剩余行宽。

固定迷你条宽度上限 1136px，桌面距离底部至少 0.75rem，兼容安全区；手机宽 calc(100% - 1rem)、底部至少 0.5rem。桌面为信息、控制、进度三列，手机为信息与控制两列加下一行进度。开启迷你条时房间底部预留 7rem，迷你条从进入房间即可见。

## Elevation & Depth

纸面与内容多数通过色调和细分隔线分层。实物唱片的材质来自透明图像；唱臂和手记封面使用轻柔投影，固定迷你条浮于阅读内容上方。全站导航及页脚的既有阴影不属于本系统的扩展规则。

### Shadow Vocabulary

- **封面实体感**（box-shadow: 4px 5px 13px rgb(15 35 50/.12)）：手记内的歌曲封面。
- **固定控制层**（box-shadow: 0 5px 25px rgb(30 60 80/.16)）：固定迷你播放器。
- **金属唱臂材质**（filter: drop-shadow(2px 4px 3px rgb(15 25 35/.18))）：透明唱臂资产，与唱片本身的拍摄材质配合。

### Named Rules

**The Material Depth Rule.** 深度服务于封面、唱臂和固定控制层；手记底板与曲库保持轻色调分层，不把实物投影复制为每个内容区的卡片效果。

## Shapes

小圆角用于横幅和搜索框，方形封面保持轻微裁切；集合封面实测圆角为 5px。固定迷你条使用前言 md，门厅入口使用 lg，手记正文底板保留直角。圆形只承担唱片、唱片中心封面和主要播放控制的形态。

真实黑胶底图上的歌曲封面占唱片直径 53%，使用圆形裁切及深色细边；中央轴孔单独叠放。金属唱臂保留透明边缘，固定在唱片右上侧，不随歌曲封面转动。图像沿用后台提供的取景与缩放，不把示例封面内容固定成品牌图案。

## Components

### Buttons

播放控制采用明确的圆形浅蓝实心按钮和白色 SVG 图标，桌面 48px、手机 40px、迷你条 34px。房间 hover 使用 brightness(.92)，继承 300ms 状态过渡。辅助控制为无底色图标按钮；默认蓝灰，活动、展开或 hover 使用强调色，既有辅助按钮 active 使用 scale(.95)。文本动作保留轻量文字与 SVG 箭头。

房间与门厅的 button、a、input 键盘焦点统一为 2px 强调色轮廓、4px 偏移。播放、暂停、模式、静音和抽屉控制均保留可读标签；展开和选中状态通过对应 ARIA 属性表达。

### Cards / Containers

情境歌单为真实歌曲封面加左侧深色渐变，白色文楷标题叠在左下；下方为说明、数量和参考标记。选中使用 2px 强调色轮廓、3px 偏移；点击筛选曲库并滚动到结果，不自动把歌单当作另一个播放器。

手记使用强调色与主题卡片面 5% 混合的底色，桌面内边距 1.35rem 1.75rem、手机 1rem。正文加实体歌曲封面及播放文本动作；示例保持“参考手记”标记，歌单保留“参考歌单”标记。

### Inputs / Fields

曲库搜索使用透明底色、1px 主题分隔线和小圆角，内边距见 input-search。按歌名或歌手实时筛选，与情境歌单过滤共同生效；零匹配时显示配置的空状态说明。没有实现独立的输入错误或禁用视觉，不新增其规范。

### Navigation

全站导航和明暗主题沿用博客原实现。音乐局部导航为门厅入口面板、房间返回链接及曲库的“列表 / 封面”切换：入口以主题浅色底和细边框提示，返回保持轻文字动作；展示方式切换以蓝灰文字为默认，选中为强调色文字和 2px 下划线。所有局部链接与按钮沿用焦点轮廓。

### Shared Turntable & Lyrics

门厅、房间和迷你条都是现有 MusicManager 的视图。切换页面保留曲目、播放时间、音量和模式；歌词展开与翻译选择沿用既有持久偏好。当前配置首次打开房间歌词，翻译默认关闭，已有用户偏好优先。

黑胶底图和金属唱臂使用现有素材，当前歌曲封面覆盖唱片中心；播放时封面按 10s linear infinite 旋转，暂停时停止，配置可关闭旋转。歌词按播放状态同步滚动，可点击跳转；当前行使用强调色，翻译维持次级层级。折叠的歌词与曲库抽屉使用 inert 和 aria-hidden，控制通过 aria-expanded / aria-controls 关联。

门厅与房间之间的可见唱片执行 FLIP 位移与缩放，当前配置 600ms，代码限制为 450–750ms，缓动 cubic-bezier(.22,.68,.18,1)。转场复制可见唱片，唱臂属于房间，不随转场移动；动画装饰不参与交互，也不创建第二个音频实例。关闭配置、屏外唱片或 prefers-reduced-motion 时跳过位移。减少动态效果同时关闭封面旋转和音乐表面的 CSS 过渡。

### Library & Fixed Mini Player

曲库行使用细底线，42px 方形封面、曲名、歌手和右侧播放状态；hover 与当前曲目使用强调色 7% 混合底。当前歌曲点击切换播放，其他歌曲点击切换曲目；封面视图保留同一按钮行为。

迷你条进入房间即可显示，固定在内容之上、全站导航之下（z-index 45 / 50）。它显示同一曲目的封面、信息、上一首、播放 / 暂停、下一首和进度，隐藏歌词、曲库抽屉、模式、翻译及额外信息控制；手机进度独占下一行。

## Do's and Don'ts

### Do:

- **Do** 把本规范限定在乐境与聆听室，沿用博客导航、主题和共享 MusicManager。
- **Do** 用房间配置强调色贯穿播放、歌词和选择状态，并应用现有明暗文字与纸面映射。
- **Do** 保持文楷展示标题常规字重（400），以冷白留白、自然窗光、真实唱片及歌曲封面表达浪漫气质。
- **Do** 在手机保留唱片与信息两列，将歌词放在下方，并让固定迷你条适配安全区。
- **Do** 保留示例标记、SVG 控制图标、可见键盘焦点和减少动态效果行为。

### Don't:

- **Don't** 在聆听室主视觉重新引入洛琪希人物或全站人物挂件；歌曲原有封面内容不受此限制。
- **Don't** 为门厅、房间或迷你条创建独立音频引擎，或用转场重置播放与用户偏好。
- **Don't** 将桌面三列播放器横向压缩到手机，或让折叠抽屉仍参与键盘焦点序列。
- **Don't** 把一次性材质细节、示例歌单名称、全站页脚装饰或旧验收记录固化为音乐空间的通用令牌。

