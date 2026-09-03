# 苍蓝回廊维护交接

最后更新：2026-09-04

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
