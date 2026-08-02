---
name: Jay Zhu's Blog
description: An illuminated field notebook for research, learning, and ordinary life.
colors:
  mist-paper: "#f7f9fb"
  clear-paper: "#ffffff"
  ink: "#18212b"
  ink-soft: "rgba(24, 33, 43, 0.68)"
  patina-teal: "#376d7b"
  quiet-sage: "#87a99e"
  study-clay: "#b06b4f"
  research-teal: "#3f7582"
  life-moss: "#72875d"
  night-charcoal: "#111111"
  night-ink: "#f5efe8"
  lantern-warmth: "#f0a77a"
typography:
  display:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Noto Serif SC", serif'
    fontSize: "clamp(2rem, 4vw, 3.15rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  title:
    fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Source Han Serif SC", "Noto Serif SC", serif'
    fontSize: "1.32rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.72
  label:
    fontFamily: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif'
    fontSize: "0.82rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "28px"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.8rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  section: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.patina-teal}"
    textColor: "{colors.clear-paper}"
    rounded: "{rounded.pill}"
    padding: "0.9rem 1.35rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.9rem 1.35rem"
  editorial-surface:
    backgroundColor: "{colors.clear-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "1.25rem"
  tag-chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "0.36rem 0.72rem"
---

# Design System: Jay Zhu's Blog

## Overview

**Creative North Star: “灯下研究手记 / The Illuminated Field Notebook”**

The blog should feel like opening one coherent notebook whose pages contain research, learning, and ordinary life at different scales. The cinematic opening is the moment a lamp is lit; the publication that follows is the quiet desk beneath that light. The transition should be emotional but the reading surface should remain calm, legible, and useful for long sessions.

This document records the real reusable tokens already present in the implementation and sets the direction for their next evolution. The identity should come from editorial composition, typographic rhythm, fine rules, marginal notes, and selective warmth rather than from stacking translucent rounded cards. Academic credibility and autobiographical intimacy must coexist without turning the site into either a corporate dashboard or a decorative scrapbook.

**Key Characteristics:**

- Reading-first editorial hierarchy with restrained asymmetry.
- Cool paper, dark ink, patinated teal, and rare lantern warmth.
- Serif display voices paired with quiet humanist interface text.
- Fine rules and spacing establish groups before containers do.
- Motion explains entry, continuity, and state; it does not decorate every element.
- The light metaphor appears as accumulation and emphasis, never as gamified pressure.

## Colors

The palette moves from misted paper and dense ink toward teal patina, with warm light used as a scarce emotional signal. Section colors are semantic identifiers, not competing brand accents.

### Primary

- **Patina Teal:** the principal interactive color for links, selected states, and the few actions that need clear prominence.
- **Lantern Warmth:** the emotional bridge from the opening into the publication, reserved for moments of attention, memory, and active light in dark mode.

### Secondary

- **Quiet Sage:** supporting diagrams, subtle data states, and calm secondary accents.
- **Study Clay, Research Teal, and Life Moss:** stable section identities used in small marks, metadata, and navigation cues rather than full card washes.

### Neutral

- **Mist Paper and Clear Paper:** the principal light surfaces. Most reading areas should be open paper rather than translucent glass.
- **Ink and Soft Ink:** primary and secondary reading tones with enough hierarchy to avoid relying on size alone.
- **Night Charcoal and Night Ink:** a warm dark-reading environment, not a mechanical inversion of the light theme.

### Named Rules

**The One Lamp Rule.** Lantern warmth should occupy less than ten percent of a normal reading viewport. Its rarity gives it meaning.

**The Semantic Section Rule.** Study, research, and life colors identify provenance; they never become independent decorative palettes on the same screen.

**The Paper Before Glass Rule.** Reading surfaces are opaque or nearly opaque. Glass is reserved for transient controls, the opening, and the compact music player.

## Typography

**Display Font:** the incumbent editorial serif stack, led by Iowan Old Style and CJK serif fallbacks.

**Body Font:** the incumbent humanist/system sans stack, led by Avenir Next, Segoe UI, and PingFang SC.

**Label Font:** the body stack at smaller sizes with restrained tracking; monospace is reserved for code and genuinely technical values.

**Character:** serif type gives titles, quotations, and major chapter transitions literary weight. Sans-serif text keeps long Chinese explanations, controls, metadata, and research notation clear. A future self-hosted CJK face may replace platform-dependent fallbacks only after its weight, download cost, and Chinese rendering are tested.

### Hierarchy

- **Display:** reserved for the opening title, homepage identity, and article title. It should usually fit within two lines on desktop and three on narrow mobile screens.
- **Headline:** page and section introductions. The page should not repeat the same phrase as both an eyebrow and a headline.
- **Title:** article cards, notebook entries, and subsections. Heading levels must follow document structure rather than visual convenience.
- **Body:** long-form reading at approximately 65–72 Latin characters per line, with equivalent comfortable Chinese measure and a line height near 1.7.
- **Label:** dates, sections, and compact state descriptions. Uppercase English labels are used only where they function as a stable publication convention.

### Named Rules

**The Two Voices Rule.** Serif speaks for authorship and reflection; sans-serif speaks for navigation, evidence, and operation. A third decorative voice is not introduced.

**The One Heading Rule.** Each region has one visible heading. Kicker, title, and supporting copy must not restate the same phrase.

## Layout

The main publication uses the existing 1160px maximum container as its wide frame, but content is organized through editorial columns rather than universal card grids. Article prose occupies a narrower reading column; metadata, table of contents, citations, and contextual notes live in a deliberate margin when space allows.

Desktop layouts may use measured asymmetry: a primary reading column paired with a narrow index or annotation rail. The homepage should feel like entering Jay's library, with a clear chronological stream and a compact index, not a dashboard of equally weighted modules. About and life pages should vary composition according to content instead of repeating four equal cards.

On mobile, the header becomes one compact row with navigation behind an explicit menu. Sticky chrome, including the player, must not consume a meaningful fraction of the reading viewport. The article table of contents must be available before or during reading, never only after the article body. Horizontal scrolling is limited to intrinsically wide content such as formulas, code, tables, and month selectors.

**The Reading Column Rule.** No decorative side module may reduce the primary reading column below a comfortable measure.

**The Progressive Ledger Rule.** Check-in records and calendar come first; goals, totals, and analysis unfold on demand rather than appearing simultaneously.

## Elevation & Depth

The target system is flat by default and layered only when state requires it. Fine borders, tonal paper shifts, whitespace, and overlap establish depth before shadows. Ambient shadows belong to temporary floating controls, the music player, modal states, and intentional hover lift; they do not surround every section.

The current diffuse card shadow remains a transition token for existing components, not a mandate for new work. Backdrop blur is an experiential material for the opening and transient controls, not the default article surface.

**The Resting Surface Rule.** A surface at rest should still look complete with its shadow removed.

## Shapes

Corners follow a restrained hierarchy. Small controls and inline groups use 12–16px radii. Large 20–28px radii are reserved for true page-level frames, significant media, or the opening experience. Fully rounded pills are limited to compact toggles, tags, and controls whose shape communicates their behavior.

Thin rules, clipped media, underlines, and marginal markers should provide more of the publication's visual signature than circles or decorative dots. Section identity may use one repeated marginal glyph or rule treatment, but never an unrelated ornament per page.

**The Earned Radius Rule.** The larger the radius, the more important and self-contained the surface must be.

## Components

### Navigation

- Desktop navigation remains one line, visually quiet, and clearly indicates the active route.
- Mobile navigation uses a compact trigger and an accessible disclosure panel; it never wraps the full desktop navigation into several sticky rows.
- Theme and language controls remain persistent but secondary to route navigation.

### Buttons

- Primary actions use patina teal in light mode and a controlled warm accent in dark mode.
- Secondary actions are border or text-led rather than white pills floating on white paper.
- Every interactive element receives an explicit high-contrast `:focus-visible` treatment in both themes.
- Author-only actions are labelled and visually separated from public reading actions.

### Tags and Filters

- Tags identify topics and enable filtering; they should not make every metadata item look clickable.
- Touch targets include adequate invisible or visible padding even when the visual chip remains compact.
- Search starts with keyword intent. Date, section, and tag filters appear progressively or in a clearly secondary advanced-filter group.

### Cards and Containers

- Containers are used for actual grouping, selection, or independent state. Chronological article lists prefer open rows, rules, and spacing.
- Featured content is not repeated unchanged in the latest stream.
- Hover can raise an article slightly, but scaling must not disturb neighboring layout or compromise reduced-motion preferences.

### Article Reading

- Article identity, abstract, metadata, tags, and reading controls form one clear opening sequence.
- The title scale is bounded for long Chinese titles. Figures, captions, code, formulas, references, and footnotes share one measured reading rhythm.
- Bright figures in dark mode receive a neutral viewing surround to soften luminance jumps without altering the source image.

### Check-in Ledger

- The public page is a reflective record, not a public data-entry form. Quick author actions belong in an authenticated author affordance or the CMS.
- Calendar illumination and chronological notes are primary. Weekly goals and time totals are supporting analysis disclosed progressively.
- Completion language recognizes accumulated action without punitive streaks, rankings, or failure-colored empty states.

### Opening and Music

- The opening remains a distinct cinematic threshold but always offers an immediately available entry path.
- Controls that are visually hidden are also removed from the focus order and accessibility tree until available.
- Once the opening has been seen in the current session, its heavy assets should not be downloaded unless the visitor explicitly reopens it.
- The collapsed player occupies minimal space, preserves continuous playback, and exposes a reliable focus-visible control.

## Do's and Don'ts

### Do

- **Do** preserve the “点亮每一盏灯” opening as the strongest experiential signature.
- **Do** carry the light metaphor into content through rare warmth, accumulated calendar light, and marginal emphasis.
- **Do** prioritize reading order, heading semantics, keyboard operation, and mobile viewport economy before decorative polish.
- **Do** use typography, whitespace, and fine rules to create hierarchy before adding a container.
- **Do** keep research, learning, and life recognizably related while giving each a small semantic marker.
- **Do** test every visual change in light/dark, Chinese/English, desktop/mobile, reduced motion, and keyboard navigation.

### Don't

- **Don't** make the homepage, about page, and ledger from interchangeable grids of translucent rounded cards.
- **Don't** expose author-only CMS actions as if they were public visitor actions.
- **Don't** use progress bars and ratios as the dominant emotional expression of daily life.
- **Don't** repeat the same post, heading, label, or call to action within one reading sequence.
- **Don't** let sticky navigation or the player consume a substantial portion of a mobile viewport.
- **Don't** introduce a new framework or heavy animation library solely for visual novelty.
