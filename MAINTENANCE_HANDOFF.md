# 博客重构权限交接

## 可访问位置

- 本地项目：`C:\Users\朱勇涛\Documents\个人博客-苍蓝回廊`
- GitHub：<https://github.com/slowayyyyy/Jay-Zhu-s-Blog>
- 生产分支：`main`
- 线上网站：<https://jay-zhu-s-blog.pages.dev/>
- 线上后台：<https://jay-zhu-s-blog.pages.dev/admin/>

新对话在同一台电脑上运行时，可直接读取和修改上述本地项目，并使用当前系统已有的 Git 凭据提交、推送代码。推送到 `main` 后，Cloudflare Pages 会自动部署。

## 用户授权

用户授权新对话对该博客进行完整重构，包括替换前端、目录结构、组件、样式、内容模型和后台实现。无需保留当前“苍蓝回廊版”的设计或技术方案，但必须先建立新的 Git 恢复点，不能强制推送或破坏现有历史。

允许修改或替换项目中的代码、配置和界面。涉及 Cloudflare Dashboard、OAuth Secret、R2 binding 或其他账户权限时，不要索要或把密钥写入仓库；需要登录操作时让用户本人完成认证。

## 必须优先保护的用户内容

重构前先盘点并备份以下位置：

- 已写文章：`src/content/posts/`
- 文章及后台上传图片：`public/uploads/`
- 已写说说：`src/content/dynamic/`
- 个人资料和站点内容：`src/data/`
- 现有音乐、歌词或媒体配置：`src/config/musicConfig.ts`、`public/media/` 及相关 R2 路径

只迁移能适配新格式的用户内容；无法直接适配的内容先保留原文件或建立迁移备份，不能静默删除。

## 恢复点

- 当前版本标签：`azure-corridor-v1.0`
- 更早灯火版标签：`lantern-edition-v1.0`
- 当前旧版恢复分支：`codex/azure-corridor-firefly`

开始重构前应从最新 `main` 新建 `codex/` 前缀分支，并再创建一个新的重构前标签。完成验证后才更新 `main`。

## 可直接发送给新对话

```text
请完整重构我的个人博客。项目路径是 C:\Users\朱勇涛\Documents\个人博客-苍蓝回廊，GitHub 仓库是 https://github.com/slowayyyyy/Jay-Zhu-s-Blog，线上地址是 https://jay-zhu-s-blog.pages.dev/。

你有权限直接修改和替换该项目的前端、架构、样式、组件、内容模型和后台，不需要沿用当前版本的设计与实现。开始前先读取根目录 MAINTENANCE_HANDOFF.md，检查 git status，并从最新 main 创建 codex/ 前缀的新分支和重构前恢复标签。

必须优先保护我已经编写的文章、图片、说说、个人资料和媒体内容。符合新格式的内容进行迁移；暂时不兼容的内容保留原文件或迁移备份，不能静默删除。完成后可以提交并推送到 GitHub，更新 main 会自动触发 Cloudflare Pages 部署。不得强制推送，不得把 OAuth、Cloudflare 或 R2 密钥写入仓库。若外部账户需要重新认证，让我本人完成登录。
```
