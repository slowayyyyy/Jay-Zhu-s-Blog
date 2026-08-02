# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- The primary user is Jay Zhu, who writes, edits, publishes, and revisits study notes, research logs, reading reflections, exercise records, and personal experiences.
- The primary reading context is personal knowledge review and long-term self-recording. Secondary readers include classmates, researchers, friends, and future collaborators who want to understand Jay's learning process and research interests.
- Visitors are readers rather than community participants. The product does not currently need accounts, registration, comments, or other social interaction.

## Product Purpose

Jay Zhu's Blog is a durable personal publishing space for explaining complex learning and research work clearly while preserving ordinary life with care. It should make Markdown-first publishing convenient enough to sustain over years, present academic material credibly, and make daily records worth returning to.

Success means that Jay can independently maintain nearly all public content from the Chinese CMS, publish without editing source code, find previous work easily, and keep the site visually calm and technically reliable on desktop and mobile.

## Positioning

The blog combines three records that are usually separated: chronological long-form writing, an academic research notebook, and a configurable habit/time ledger. A cinematic “点亮每一盏灯” opening gives the site an autobiographical threshold, while the reading surfaces remain restrained and content-first.

## Operating Context

- Long-form posts are written in Markdown through Decap CMS or directly in the repository, organized into 学习笔记、科研记录 and 生活手账, with tags, search, archive, table of contents, RSS, reading metrics, images, LaTeX, Mermaid, footnotes, code, and references.
- Daily actions are recorded through configurable check-in modules and appear in the calendar, weekly goals, monthly time ledger, and chronological record stream.
- CMS changes commit to GitHub. Cloudflare Pages builds the static site from `main`; public changes normally appear after the deployment completes.
- Large media is served from Cloudflare R2 where appropriate. The opening video and music are presentation assets, not the primary content store.
- Chinese is the main writing language. Navigation and interface copy support Chinese and English, and the selected language and theme persist between routes.

## Capabilities and Constraints

- Preserve the current Astro static-site architecture, GitHub-based content history, Cloudflare Pages deployment, and Chinese Decap CMS workflow unless a future decision explicitly replaces them.
- Preserve existing routes, content slugs, RSS, metadata, analytics, content schemas, CMS field names, and media URLs during visual work.
- Preserve light and dark themes, bilingual interface behavior, responsive layouts, continuous music playback, the opening experience, search, tags, archives, article navigation, academic Markdown, and check-in data relationships.
- Public pages must not expose sensitive personal information. The intended public identity is a display name, avatar, selected interests, selected current activities, and deliberately provided contact links.
- Operating cost and maintenance effort should remain low. New visual dependencies must justify their download size, runtime cost, and maintenance burden.
- Content and CMS commits may arrive on `main` while design work is in progress. Redesign branches must synchronize those commits before release rather than overwrite them.

## Brand Commitments

- Product name: **Jay Zhu's Blog**.
- Central theme: **“点亮每一盏灯”**. Light represents accumulated attention, action, memory, and growth rather than gamified achievement.
- Desired voice: concise, academic, sincere, calm, and poetic. The interface should feel considered rather than loud, fashionable, or corporate.
- The opening is a separate experiential threshold. The main reading interface should remain light, clear, and substantially quieter than the opening.
- The existing “秒速五厘米” opening video, bilingual subtitles, music experience, avatar, and authored content are real identity assets and must not be silently replaced.
- The blog should avoid generic technology-product styling, excessive gamification, fabricated authority, and disclosure of unapproved personal details.

## Evidence on Hand

- Published posts and research notes: `src/content/posts/`.
- Daily records and time data: `src/content/checkins/` and `src/data/site-settings.json`.
- Real author profile, contact links, opening settings, playlist, bilingual copy, and habit definitions: `src/data/site-settings.json`.
- Existing production implementation and visual behavior: `src/pages/`, `src/components/`, and `src/styles/global.css`.
- Existing production deployment: `https://jay-zhu-s-blog.pages.dev`.
- No testimonials, institutional endorsements, readership claims, or research-impact claims are available and none should be invented.

## Product Principles

1. **Writing before decoration.** Every visual decision should improve comprehension, orientation, or the desire to keep reading and recording.
2. **Long-term ownership.** Jay should be able to update content and settings without depending on a developer for routine publishing.
3. **One source of truth.** CMS data, content collections, tags, habits, statistics, and public pages must remain correctly associated and synchronized.
4. **Memory without pressure.** The check-in system should encourage return through reflection and visible accumulation, not streak anxiety or punitive gamification.
5. **Progress without breakage.** Redesign work preserves working behavior, content history, URLs, and deployment safety through branches, checkpoints, and verification.

## Accessibility & Inclusion

- Public reading and core navigation must remain usable by keyboard, with visible focus states and sufficient contrast in both themes.
- Motion must respect `prefers-reduced-motion`; content must remain available when animation, video, audio, JavaScript enhancements, or transparency effects are reduced or unavailable.
- Desktop and mobile layouts are both first-class. Long Chinese text, English interface labels, code, formulas, tables, diagrams, and uploaded images must not create horizontal page overflow.
- Audio and voiced video start only after an intentional user action and retain visible controls whenever playback is active.
