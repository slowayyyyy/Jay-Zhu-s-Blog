# 苍蓝回廊博客维护交接

> 更新日期：2026-09-02  
> 当前状态：苍蓝回廊版已发布到 Cloudflare Pages，GitHub `main` 与本地版本一致。

## 1. 项目目标与已确认方向

- 公开名称：**苍蓝回廊**，英文副标题 `Azure Reverie`。
- 工程底座：Firefly `6.16.6`，不是从零重写，也不是直接覆盖为 Aemeath。
- 视觉主题：洛琪希、水系魔法、安静神秘、梦幻诗意；保留 Firefly 的路由、Markdown、搜索、归档和响应式结构。
- Aemeath 只用于选择性参考。功能取舍与迁移证据见 `FIREFLY_MIGRATION_AUDIT.md`。
- 不公开每日打卡；不增加评论、注册和公开互动系统。
- 导航：主页、归档、说说、画廊、乐境、追番、友链、关于。
- 文章主要中文；界面保留 Firefly 的语言和明暗模式能力。

## 2. 地址与仓库

- 线上站点：<https://jay-zhu-s-blog.pages.dev/>
- 线上后台：<https://jay-zhu-s-blog.pages.dev/admin/>
- GitHub：<https://github.com/slowayyyyy/Jay-Zhu-s-Blog>
- 新版本地工作区：`C:\Users\朱勇涛\Documents\个人博客-苍蓝回廊`
- 旧灯火版本工作区：`C:\Users\朱勇涛\Documents\个人博客`
- 当前开发分支：`codex/azure-corridor-firefly`
- 生产分支：`main`
- 当前生产提交：`d71a58112e73a64d466154d902405a0b652dd9f3`
- Firefly 上游远端：`firefly https://github.com/CuteLeaf/Firefly.git`

## 3. 版本与回滚

- 苍蓝回廊恢复标签：`azure-corridor-v1.0`
- 灯火版恢复标签：`lantern-edition-v1.0`
- 灯火版远端分支：`codex/frontend-redesign-v1`
- 两套历史通过提交 `d71a581` 连接，没有使用强制推送。
- 如需临时恢复灯火版，优先在 Cloudflare Pages 将生产分支切换为 `codex/frontend-redesign-v1`，不要强制覆盖 GitHub `main`。
- 旧工作区当前有用户/历史未提交改动：`DESIGN.md`、`PRODUCT.md`、`package.json`、`FIREFLY_MIGRATION_AUDIT.md`、`scripts/prepare-firefly-migration.mjs`。除非用户明确要求，不要清理、还原或覆盖这些文件。

## 4. 技术架构

- Astro 7 + Firefly + TypeScript。
- 包管理器：`pnpm@11.22.0`。
- 内容：Markdown/JSON，经 GitHub 保存和版本管理。
- 后台：Decap CMS 中文配置，不是 Java/MySQL 数据库后台。
- 部署：GitHub `main` 推送后由 Cloudflare Pages 自动构建，输出目录 `dist`。
- 搜索：Pagefind，生产构建后生成索引。
- 媒体：普通图片在 `public/uploads`；音乐和开场优先使用 Cloudflare R2。
- 开场视频：优先 `/media/opening`（R2），失败时自动使用 `/media/opening-roxy-720p.mp4`（仓库内 12.7 MB 后备视频）。

Decap CMS 保存后，前台需要等待 GitHub 提交和 Cloudflare 构建，通常 1 到 3 分钟。这是静态架构的正常发布延迟，不是同步故障。

## 5. 常用命令

在新版工作区运行：

```powershell
pnpm install
pnpm astro dev --background
pnpm check
pnpm validate-content
pnpm build
```

后台开发服务器按仓库说明使用 `astro dev --background`；通过 `astro dev status`、`astro dev logs`、`astro dev stop` 管理。

每次准备发布至少执行：

```powershell
pnpm check
pnpm build
git diff --check
git status --short
```

构建前 `scripts/validate-content.mjs` 会验证文章必填字段、分区、标签、本地图片和 JSON，避免无效内容上线。

## 6. 内容与配置位置

- 文章：`src/content/posts/`，当前 10 篇。
- 说说：`src/content/dynamic/`，目前为空，空集合警告是预期行为。
- 分区：`src/content/categories/`，当前为学习笔记、科研记录、生活手账。
- 标签：`src/content/tags/`，当前 12 个。
- 个人资料：`src/data/profile.json`。
- 苍蓝回廊文案、开场、首页和外部服务：`src/data/azure-content.json`。
- 画廊：`src/data/gallery.json`。
- 友链：`src/data/friends.json`。
- 音乐配置：`src/config/musicConfig.ts` 与后台 R2 音频脚本。
- 导航：`src/config/navBarConfig.ts`。
- 站点元数据：`src/config/siteConfig.ts`。
- 主题主样式：`src/styles/azure-corridor.css`。
- 开场组件：`src/components/layout/OpeningGate.astro`。
- 首页扩展：`src/components/layout/HomeLead.astro`、`HomeBranches.astro`。
- 关于页：`src/pages/about.astro`。
- 音乐页：`src/pages/music.astro`、`src/components/pages/music/MusicStage.astro`。
- 后台配置：`public/admin/config.yml`。
- 后台扩展：`src/scripts/admin-cms.js`、`admin-image-caption.js`、`admin-r2-audio.js`。

## 7. 后台功能范围

当前后台支持：

- 文章新增、修改、删除、草稿、隐藏、置顶、发布时间和更新时间。
- 分区、标签、系列与系列顺序。
- 作者、来源链接、版权、密码文章和语言字段。
- Markdown、图片上传/粘贴、图片说明、LaTeX、Mermaid、脚注、上下标和代码块。
- 说说、画廊、友链、音乐与歌词。
- 头像、个人介绍、关于页、首页及开场文案。
- Bilibili UID、Umami Website ID 等外部服务字段。

与数据库型后台相比，没有即时数据库发布、评论账号系统和依赖付费密钥的 AI 摘要/封面功能。这些是明确的架构取舍，不是遗漏。完整说明见 `BACKEND_CAPABILITY_AUDIT.md`。

## 8. Cloudflare 环境

Pages 构建配置：

- Production branch：`main`
- Build command：`npm run build`
- Build output：`dist`
- Root directory：空

Functions 使用的变量/绑定名称：

- `PUBLIC_SITE_URL`
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`（Secret）
- `GITHUB_OAUTH_SCOPE`
- `CMS_GITHUB_LOGIN`
- `BLOG_MEDIA`（R2 binding，原桶名为 `jay-blog-media`）
- `BLOG_VIEWS`（阅读量存储绑定）
- `MEDIA_RATE_LIMITER`（可选 Rate Limiter binding）

不要把 Secret 写入仓库。OAuth 回调应继续使用线上 `/api/callback`。

## 9. 已完成验证

- `pnpm check`：255 个文件，0 errors、0 warnings、0 hints。
- `pnpm build`：成功生成 32 个页面。
- 内容检查：10 篇文章、3 个分区、12 个标签通过。
- Pagefind：索引 11 个公开页面、1764 个词。
- 本地桌面与移动端已检查开场、首页和主要页面，无横向溢出。
- 线上首页标题已确认为 `苍蓝回廊 - Azure Reverie`。
- 线上归档、说说、画廊、音乐、追番、友链、关于、后台、搜索资源、头像和一篇迁移文章已返回并展示。
- 后台配置 `/admin/config.yml` 与 OAuth 入口 `/api/auth` 在线可用。
- 开场在本地已验证：R2 不可用时会选择仓库内后备视频并进入播放状态。

## 10. 待用户提供或继续确认

- `src/data/azure-content.json` 中 `integrations.bilibiliUid` 仍为空。用户提供数字 UID 后，追番页才会显示个人番剧数据。
- Umami Website ID 仍为空，因此统计脚本安全地不加载。
- R2 中预期的开场对象键为 `opening/opening-roxy-720p.mp4`。当前仓库有可用后备视频，但若希望始终从 R2 播放，需要登录 Cloudflare/Wrangler 后确认或上传该对象。
- 当前代理环境访问大视频时偶发 TLS 超时；线上页面和静态资源已发布，真实浏览器能打开新版，但应在用户自己的网络再观察一次开场视频缓冲速度。
- 画廊、友链和说说目前允许为空；这不是错误，用户可从后台逐步添加内容。

## 11. 新对话的建议首条提示

可直接把下面内容发送给新的 Codex 对话：

```text
请维护我的个人博客“苍蓝回廊”。项目路径是 C:\Users\朱勇涛\Documents\个人博客-苍蓝回廊，仓库是 https://github.com/slowayyyyy/Jay-Zhu-s-Blog，线上地址是 https://jay-zhu-s-blog.pages.dev/。请先完整阅读项目根目录的 MAINTENANCE_HANDOFF.md、PRODUCT.md、DESIGN.md、FIREFLY_MIGRATION_AUDIT.md 和 BACKEND_CAPABILITY_AUDIT.md，再检查 git status 和当前线上状态。不要修改或清理 C:\Users\朱勇涛\Documents\个人博客 旧灯火工作区中的未提交文件。所有维护都要保留后台可编辑性、文章内容和两个恢复标签，不要强制推送或破坏回滚路径。
```

