# 内容迁移清单

迁移日期：2026-09-02

## 已原样迁移

| 内容 | 文件数 | 结果 |
| --- | ---: | --- |
| 文章 | 10 | SHA-256 对比一致 |
| 上传图片 | 60 | SHA-256 对比一致 |
| 原有开场媒体 | 1 | SHA-256 对比一致 |
| 个人数据文件 | 4 | SHA-256 对比一致 |
| Cloudflare Functions | 8 | SHA-256 对比一致 |
| 后台配置 | 1 | 已迁移并仅更新图标路径 |

文章仍使用原文件名、正文和 `/uploads/` 图片路径；Aemeath 内容模型已兼容这些
frontmatter 字段。

## 新格式适配

- 新增 `dynamic` 内容集合和 `/dynamic/` 时间线，用于继续管理说说。
- `src/data/profile.json` 接入 Aemeath 个人资料组件。
- `src/data/friends.json`、`gallery.json` 接入友链与相册页面。
- `src/data/azure-content.json` 的歌单接入 Aemeath 全局播放器与 `/music/` 页面。
- 个人资料、站点信息、公告、每日一言、壁纸、更新日志和工具页已统一为后台数据源。
- Bilibili UID 已设置为 `398487766`；追番/追剧公开后即可读取，未保存任何 API 密钥。
- R2 音乐通过 `BLOG_MEDIA -> jay-blog-media` 非敏感桶绑定提供，凭据未写入仓库。
- 原后台登录、图片粘贴、R2 音乐上传与内容管理脚本继续使用。

## 新增素材

桌面“洛琪希素材”中的 12 张图片或 GIF 已复制到
`public/assets/images/roxy/`，并用于壁纸、时间卡片、音乐页和参考相册。

素材目录中的三个源视频单个均超过 GitHub 100 MB 限制，未写入仓库。它们仍保留
在原桌面素材目录；线上可选背景视频使用已受保护且可部署的
`public/media/opening-roxy-720p.mp4`。

## 额外恢复点

仓库外完整内容备份：

`C:\Users\朱勇涛\Documents\博客内容保护-20260902-重构前`

Git 恢复标签：

`pre-roxy-rebuild-2026-09-02`
