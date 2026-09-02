# 苍蓝回廊

Jay Zhu 的个人博客，记录论文阅读、技术学习、读书与日常。

- 线上地址：<https://jay-zhu-s-blog.pages.dev/>
- 技术基线：[Firefly](https://github.com/CuteLeaf/Firefly) / [Aemeath](https://github.com/Jarvis0227/Aemeath)
- 视觉主题：Aemeath · Roxy Edition
- 部署方式：Cloudflare Pages，推送到 `main` 后自动构建

## 内容位置

- 文章：`src/content/posts/`
- 说说：`src/content/dynamic/`
- 上传图片：`public/uploads/`
- 个人资料与歌单：`src/data/`
- 可选背景媒体：`public/media/`
- 内容后台：`/admin/`

## 后台管理范围

`/admin/` 是前台内容的唯一维护入口，可管理文章、说说、分类、标签、关于页、
站点基础信息、公告、每日一言词句池、壁纸、时间卡片图片、个人资料、音乐歌单、
唱片封面、LRC 歌词、Bilibili/Bangumi 标识、更新日志、工具页、相册与友链。

“今日一言”会按访客本地日期从词句池自动轮换，并在午夜自动更新，不需要每天手工发布。
音乐的文件、封面和歌词保存在同一条歌单记录中，因此天然一一对应。LRC 可直接粘贴，
时间标签使用 `[分:秒.毫秒]` 格式，例如 `[00:12.50]第一句歌词`。

重构前内容的保护方式、恢复点和迁移结果见
[`MAINTENANCE_HANDOFF.md`](./MAINTENANCE_HANDOFF.md) 与
[`CONTENT_MIGRATION_MANIFEST.md`](./CONTENT_MIGRATION_MANIFEST.md)。

## 本地开发

```bash
pnpm install --frozen-lockfile
pnpm dev
```

完整验证：

```bash
pnpm check
pnpm type-check
pnpm build
```

## 安全说明

OAuth、Cloudflare 和 R2 凭据只通过 Cloudflare 环境变量提供，不写入仓库。
Cloudflare Pages Functions 位于 `functions/`。
R2 桶的非敏感绑定名 `BLOG_MEDIA` 与桶名 `jay-blog-media` 记录在 `wrangler.jsonc`；
访问凭据仍不进入仓库。

## 致谢

本站保留并扩展了 Firefly 与 Aemeath 的主题结构、组件和交互设计。感谢两套开源项目及其贡献者。
