# Jay Zhu's Blog

一个为 `学习内容 / 科研过程 / 生活手账` 设计的个人博客第一版，基于 `Astro + Markdown + Cloudflare Pages`。

## 已有能力

- 开场页：首屏进入动画，点击后进入主页并触发音乐播放
- 首页时间流：按发布时间从新到旧展示所有文章
- 每日打卡：独立 Markdown 记录，通过导航栏进入专属页面
- 专栏结构：`学习笔记`、`科研记录`、`生活手账`
- 搜索页：支持按 `关键词 / 栏目 / 年份 / 标签` 筛选
- 文章页：带目录、标签、相关文章
- 双语界面：只翻译界面，不影响中文正文
- 主题切换：明暗模式
- RSS：`/rss.xml`
- 页面阅读量：通过 Cloudflare Pages Functions + KV 实现
- 访问统计：预留 Cloudflare Web Analytics 接入
- 内容管理后台：通过 `/admin/` 可视化管理文章、打卡、标签、头像、座右铭、关于页和音乐

## 技术路线

- 框架：Astro
- 内容：Markdown Content Collections
- 部署：Cloudflare Pages
- 统计：
  - 页面阅读量：Cloudflare KV
  - 站点访问统计：Cloudflare Web Analytics

这套路线的优点是：

- 不需要 VPS，成本低
- 文章就是 Markdown 文件，维护简单
- 后续加文章、改页面、切换域名都比较轻

## 本地启动

```bash
npm install
npm run dev
```

开发服务会在后台运行。前台访问 `http://localhost:4321/`。使用中文版内容管理后台时运行 `npm run admin`，然后访问 `http://localhost:4321/admin/`。

完整后台教程见 [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md)。

本地构建：

```bash
npm run build
```

## 目录说明

```text
src/
  content/
    checkins/            # 每日打卡 Markdown 文件
    posts/               # 所有 Markdown 文章
  components/            # 页面组件
  data/site-settings.json # 后台可编辑的站点名称、欢迎语、个人资料和音乐配置
  layouts/               # 全局布局
  pages/                 # 路由页面
functions/
  api/views.js           # Cloudflare Pages Functions 阅读量接口
public/
  admin/                 # 内容管理后台配置
  audio/                 # 音乐文件
  images/                # 预置图片资源
  uploads/               # 后台上传的头像和正文图片
```

## 你以后最常改的地方

### 1. 改网站基本信息

文件：`src/data/site.ts`

你可以在这里修改：

- 博客标题
- 首页欢迎语
- 关于页占位介绍
- 联系方式
- 音乐播放器歌单

### 2. 新增文章

在 `src/content/posts/` 下新建一个 `.md` 文件，格式参考现有文章：

```md
---
title: 文章标题
description: 用于 SEO 和文章顶部简介
excerpt: 用于列表页摘要
publishDate: 2026-06-24
section: study
tags:
  - 标签1
  - 标签2
featured: false
---

## 正文标题

你的正文内容
```

`section` 目前支持：

- `study`
- `research`
- `life`

### 3. 新增每日打卡

在 `src/content/checkins/` 下新建一个 `.md` 文件，建议使用 `日期-主题.md` 命名：

```md
---
date: 2026-06-24
title: 今日学习打卡
summary: 完成今天最重要的一项学习任务。
items:
  - label: 学习内容
    value: 论文精读与笔记整理
  - label: 用时
    value: 45 分钟
  - label: 相关链接
    value: 查看资料
    href: https://example.com
tags:
  - 学习
  - 阅读
---
```

`items`、`href` 和 `tags` 都可以按需删减。`/checkins/` 页面会自动按日期倒序显示全部记录。

## 音乐播放器怎么换歌

1. 把音乐文件放进 `public/audio/`
2. 到 `src/data/site.ts` 修改 `playlist`

示例：

```ts
playlist: [
  {
    title: 'Your Track',
    artist: 'Artist Name',
    src: '/audio/your-track.mp3',
  },
],
```

注意：

- 浏览器不允许真正“无操作自动播声音”
- 当前实现是：用户点击进入开场页后开始播放

## 部署到 Cloudflare Pages

### 第一步：把项目传到 GitHub

1. 新建一个 GitHub 仓库
2. 把当前项目推上去

常用命令：

```bash
git add .
git commit -m "feat: first blog version"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

### 第二步：注册并登录 Cloudflare

去 Cloudflare 注册账号。  
如果只是先上线看效果，先用 Cloudflare 自动给你的 `*.pages.dev` 域名即可。

### 第三步：创建 Pages 项目

1. 进入 Cloudflare Pages
2. 选择 `Connect to Git`
3. 连接你的 GitHub 仓库
4. 构建配置填写：

- Build command: `npm run build`
- Build output directory: `dist`

### 第四步：设置环境变量

在 Pages 项目里添加：

- `PUBLIC_SITE_URL`
  值填你最终的站点地址，例如 `https://your-project.pages.dev`

如果后面启用 Cloudflare Web Analytics，再补：

- `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`

## 开启页面阅读量统计

这个博客已经带了 `functions/api/views.js`，但要生效，你还需要给 Pages 项目绑定一个 KV。

### 第一步：创建 KV Namespace

在 Cloudflare 后台创建一个 KV Namespace，例如命名为：

- `jay-blog-views`

### 第二步：在 Pages 项目绑定 KV

进入 Pages 项目设置，为 Functions 添加 KV Binding：

- Variable name: `BLOG_VIEWS`
- KV namespace: 选择你刚才创建的那个

完成后，文章页里的阅读量就会开始累计。

## 开启站点访问统计

推荐直接使用 `Cloudflare Web Analytics`。

流程：

1. 在 Cloudflare 打开 Web Analytics
2. 创建站点
3. 拿到 token
4. 填进 `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`

这样不需要你自己再加统计脚本逻辑，布局里已经预留好了。

## 域名建议

### 最省钱路线

先用：

- `xxx.pages.dev`

优点：

- 0 成本
- 立刻可访问
- 没有域名购买步骤

### 后续正式路线

等博客稳定后再买一个正式域名，然后接到 Cloudflare Pages。

说明：

- Cloudflare 可以托管和接入自定义域名
- 但 `Cloudflare 不是免费送你顶级域名`
- 你可以先免费用 `pages.dev`，后面再买域名切换

## 现在这版里哪些是占位内容

以下内容目前都是占位，可后续替换：

- 头像
- GitHub / Email
- 首页欢迎语
- 音乐文件
- 第一批真实文章

## 下一步建议

先做这三件事：

1. 本地跑起来看看首页风格和结构是否满意
2. 告诉我要不要调整视觉方向
3. 确认后我再继续帮你补真实内容、推 GitHub、接 Cloudflare、正式上线
