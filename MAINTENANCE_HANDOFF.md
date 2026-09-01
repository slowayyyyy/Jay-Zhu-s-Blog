# 苍蓝回廊维护交接

最后更新：2026-09-02

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
- R2 绑定与访问凭据

若后台登录或 R2 上传要求重新授权，应由站长本人完成登录。

## Aemeath 功能保留范围

本次已保留首页组合式开场、欢迎提示、时间问候、每日一言、日程进度、壁纸切换、
更新日志、工具页、动态、朋友圈、追番、友链漫游、音乐播放器、评论增强、
服务状态、文章工作台和定时动态刷新工作流。

未提供外部账号数据时，对应页面保持空状态，不填入模板作者的数据。
