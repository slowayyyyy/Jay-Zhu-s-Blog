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
- 开场媒体：`public/media/`
- 内容后台：`/admin/`

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

## 致谢

本站保留并扩展了 Firefly 与 Aemeath 的主题结构、组件和交互设计。感谢两套开源项目及其贡献者。
