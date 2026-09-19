# 苍蓝回廊维护交接

最后更新：2026-09-19

## 2026-09-19 数学公式边界修复

- 修复《How Should Video LLMs Output Time?》文章中 `$$...$$` 与 `\[...\]` 重复嵌套导致的 KaTeX 缺失和错误显示。
- 前台 Markdown 管线会在交给 KaTeX 前移除重复的显示公式边界；已有错误源文件也能容错显示。
- 后台公式组件、文章保存流程与 Typora 一键导入会统一把块公式整理成单层 `$$...$$`，代码围栏中的示例保持原样。
- 公式容器支持窄屏横向滚动，长公式不会把正文页面撑宽。
- 修复分支：`codex/fix-markdown-math`；回归：`node --test scripts/tests/typora-import.test.mjs`、`pnpm build`。

## 2026-09-11 代码块前后台联动

- 文章正文编辑器的“+”菜单提供“代码块（高亮）”：从常用语言中选择后使用 CodeMirror 粘贴代码，可选文件名、长行换行、行号、起始行号与重点行。语言与代码采用独立字段，避免 Decap 自定义编辑组件中嵌套对象值触发运行时错误。
- 保存格式仍是标准 Markdown 围栏代码，并使用 Expressive Code 官方元数据；旧文章中的普通代码围栏继续兼容，不绑定后台私有格式。
- 前台代码块显示语法高亮、语言徽章、可选文件标题、行号、复制按钮和长代码折叠；含连续反引号的代码会自动改用更长围栏，避免截断。
- 恢复分支：`codex/restore-before-code-display-20260911`；恢复标签：`pre-code-display-20260911`。

## 2026-09-11 后台文章状态速览

- “归档文章”列表会根据每篇文章当前字段自动显示状态标签：`draft` 对应“隐藏”，非隐藏且有 `password` 对应“上锁”，其余对应“公开”；`pinned` 作为可叠加的“置顶”状态显示。
- 后台页面只接收“是否上锁”的布尔值，不会把阅读密码内容写进状态标签或页面数据；在编辑器保存文章后，列表状态会在当前后台会话中同步更新。
- 恢复分支：`codex/restore-before-post-status-20260911`；恢复标签：`pre-post-status-20260911`。

## 2026-09-10 樱花特效开关修复

- `SakuraEffect.astro` 在 Swup 无刷新跳转后复用全局樱花管理器，不再清空仍在运行实例的引用。
- 关闭特效会立即取消动画帧、移除画布和 resize 监听，并清理可能由旧会话遗留的孤立画布；重新开启仍可正常创建唯一画布。
- 设置继续保存在浏览器 `localStorage.sakuraEnabled`，刷新和跨页面跳转后保持用户选择。
- 恢复分支：`codex/restore-before-sakura-toggle-20260910`；恢复标签：`pre-sakura-toggle-20260910`。

## 2026-09-05 文章内创建标签

- 文章的 `tags` 使用 `creatable-tags` 控件，可搜索已有标签、输入名称后按回车添加新标签。
- `admin-tags-service.js` 在文章 `preSave` 中先同步 `src/content/tags/*.json`，再返回去重后的标签标识数组；不改变其他文章数据。
- 线上通过现有 GitHub 认证及 `/api/github/` 代理创建记录；本地使用 Decap 的 8081 代理。创建不带旧文件 SHA，避免覆盖已有说明。
- 同步失败会阻止文章继续保存；已成功创建的标签保留，重试会复用。移除文章标签不删除标签记录。
- 恢复标签：`pre-inline-tags-20260905`；测试：`node --test scripts/tests/admin-tags.test.mjs`。

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

## 首页文图同步

- 基线：`fbaeabfd`；恢复分支 `codex/restore-before-hero-sync-20260904-002349`，标签 `pre-hero-sync-20260904-002349`。
- 配置备份：上述离线配置目录中的 `azure-before-hero-sync-20260904.json`。
- `TypewriterText.astro` 的首页实例使用 `syncCarousel`；时序由 `src/scripts/typewriter-controller.ts` 管理。
- 字句退场后发出可取消的 `hero:cycle` 事件，壁纸加载就绪时同时切换 active 图片并调用 resume 输出下一句首字。不得另加固定图片计时器与首页文字竞争。
- 保留非首页独立轮播、手动切图、固定壁纸和减少动态效果偏好。Swup 替换文字时清理旧实例，壁纸容器仍持久化。
- 回归：`node --test scripts/tests/hero-sync.test.mjs`，含长短句、emoji、异步图片/失败/超时、不同数量、单条数据、后台暂停、断点切换与旧回调失效。

## 旧博客首页摘要恢复

- 2026-09-04 按站长要求，将现有 10 篇文章（含 2 篇草稿）的 `description` 替换为旧博客的 `excerpt` 原文。旧版同名 `description` 不是卡片概括，不应再次用于覆盖当前字段。
- 原文来源：迁移前提交 `7ed7a1bc`，与旧工作目录 `C:\Users\朱勇涛\Documents\个人博客\src\content\posts` 逐篇核对一致。只更新描述，不改正文、图片、日期、标题或草稿状态。
- 替换前恢复分支：`codex/restore-before-descriptions-20260904-010326`；恢复标签：`pre-descriptions-20260904-010326`；文章离线备份：`C:\Users\朱勇涛\Documents\博客描述保护-20260904-010326`。
- 后续仍在“文章 → 页面描述”编辑外部概括；“文章页摘要”是独立字段，留空时会回退使用页面描述。

## 中文行内格式兼容

- 2026-09-04 将 `remarkTightInlineFormatting` 接入 Astro 正式 Markdown 管线，使中文标点或汉字紧邻的 `*斜体*`、`**粗体**` 与后台预览一致，不再把分隔星号显示到文章里。
- 不修改文章源文件；代码、HTML、未配对星号和分隔符内首尾带空格的文本保持原样。
- 恢复分支：`codex/restore-before-cjk-italic-20260904-024129`；恢复标签：`pre-cjk-italic-20260904-024129`。
