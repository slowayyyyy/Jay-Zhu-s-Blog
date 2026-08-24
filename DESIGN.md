---
name: Jay Zhu's Blog
description: An illuminated academic field notebook for research, learning, and ordinary life.
colors:
  paper: "#f7f9fb"
  paper-panel: "rgba(255, 255, 255, 0.92)"
  ink: "#18212b"
  ink-soft: "rgba(24, 33, 43, 0.68)"
  rule: "rgba(31, 51, 69, 0.1)"
  patina-teal: "#376d7b"
  quiet-sage: "#87a99e"
  study-clay: "#b06b4f"
  research-teal: "#3f7582"
  life-moss: "#72875d"
  focus-amber: "#d98949"
  night-paper: "#111111"
  night-panel: "rgba(28, 28, 28, 0.86)"
  night-ink: "#f5efe8"
  lantern-warmth: "#f0a77a"
typography:
  display:
    fontFamily: '"Newsreader Variable", "ZCOOL XiaoWei", "Source Han Serif SC", serif'
    fontSize: "clamp(2rem, 4vw, 3.15rem)"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Newsreader Variable", "ZCOOL XiaoWei", "Source Han Serif SC", serif'
    fontSize: "clamp(1.55rem, 3vw, 2.2rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Newsreader Variable", "ZCOOL XiaoWei", "Source Han Serif SC", serif'
    fontSize: "clamp(1.35rem, 2.5vw, 1.9rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif'
    fontSize: "clamp(1rem, 1.15vw, 1.065rem)"
    fontWeight: 400
    lineHeight: 1.82
  label:
    fontFamily: '"Avenir Next", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Noto Sans SC", sans-serif'
    fontSize: "0.78rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
rounded:
  none: "0"
  mark: "4px"
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
  masthead:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.55rem 0.7rem"
    height: "4.5rem"
  post-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "1.6rem 0.3rem"
  publication-index-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    height: "3.25rem"
  tag-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    height: "2rem"
  calendar-day:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0.55rem"
    height: "5rem"
---

# Design System: Jay Zhu's Blog

## Overview

**Creative North Star: “灯下研究手记 / The Illuminated Field Notebook”**

The shipped blog is a quiet academic field notebook on a cool paper-gray ground. Its authority comes from editorial structure: an opaque ruled masthead, open publication rows, narrow marginal notes, dense ink, and restrained teal marks. The cinematic lantern opening is the threshold; the publication after it is calm and substantially quieter.

The system rejects both glass-card dashboard styling and generic portfolio composition. Warm light is rare and meaningful, while typography, rules, and whitespace carry most of the hierarchy. Daily practice reads as accumulated field evidence rather than a scorecard.

**Key Characteristics:**

- Opaque paper-native surfaces with fine horizontal rules.
- Self-hosted Newsreader Variable and ZCOOL XiaoWei for authored display text.
- Clear sans-serif reading and interface text.
- Open editorial rows, publication indexes, marginal notes, and ledger structures.
- Patinated teal for interaction, semantic section colors for provenance, and rare warm lantern accents.
- Geometric line icons and flame-shaped check-in marks instead of text glyphs.

## Colors

The light theme uses cool paper, dense blue-black ink, and patinated teal; dark mode shifts to warm charcoal and parchment ink, with lantern warmth becoming the active accent.

### Primary

- **Patina Teal:** principal links, active rules, selected states, and progress in the light publication.
- **Lantern Warmth:** dark-theme interaction and the emotional light carried out of the opening.

### Secondary

- **Quiet Sage:** calm supporting states and secondary visual evidence.
- **Study Clay, Research Teal, and Life Moss:** small provenance marks for study, research, and life entries.

### Neutral

- **Paper and Paper Panel:** the page field and the few slightly separated transient surfaces.
- **Ink and Soft Ink:** primary reading and supporting metadata.
- **Rule:** low-contrast dividers that establish grouping without boxes.
- **Night Paper, Night Panel, and Night Ink:** warm dark-reading counterparts rather than a mechanical inversion.
- **Focus Amber:** a high-visibility keyboard outline in the light theme.

### Named Rules

**The One Lamp Rule.** Warm light remains scarce in ordinary reading views; it marks attention, active light, or transition rather than decorating whole sections.

**The Semantic Section Rule.** Study, research, and life colors identify provenance through short rules, flame marks, and compact labels, never through competing full-surface washes.

**The Paper Before Glass Rule.** Opaque paper is the default. Transparency and blur belong only to the opening and compact floating media controls.

## Typography

**Display Font:** self-hosted Newsreader Variable with self-hosted ZCOOL XiaoWei for Chinese display support, followed by Source Han Serif SC and serif.

**Body Font:** Avenir Next, Segoe UI, PingFang SC, Hiragino Sans GB, Noto Sans SC, and sans-serif.

**Character:** variable serif titles feel literary and research-oriented without looking ceremonial. The clear sans stack handles long reading, controls, metadata, and bilingual interface copy. Tabular numerals support dates, counts, durations, and ledger totals.

### Hierarchy

- **Display:** major page identity and section openings use a compact, tightly tracked serif scale.
- **Headline:** publication sections, article subsections, and ledger headings use the same serif voice at a restrained intermediate scale.
- **Title:** article rows and field-note entries use balanced serif titles with modest negative tracking.
- **Body:** long-form prose uses the sans stack at a generous line height. Ordinary text, headings, lists, and quotations share a centered 46rem reading measure; research figures and technical blocks may extend to the 48rem media rail.
- **Label:** dates, reading times, codes, and small state descriptions use compact sans text; letterspaced uppercase is reserved for stable publication labels.

### Named Rules

**The Two Voices Rule.** Serif speaks for authorship and reflection; sans-serif speaks for navigation, evidence, and operation.

**The Local Display Rule.** Display identity uses the bundled Newsreader Variable and ZCOOL XiaoWei files, not a platform-dependent display face or remote font request.

## Layout

The publication frame is `min(1160px, calc(100vw - 2rem))`, narrowing to `min(100vw - 1.1rem, 100%)` below 720px. Desktop home layouts pair a dominant editorial column with a narrow publication index or marginal rail. Article pages use a centered 46rem reading measure inside a 48rem media rail and are paired with a table-of-contents rail until 1080px.

The first viewport uses a compact sticky masthead bounded by top and bottom rules. The homepage orientation sits left and the publication index right; at 940px both become a single column and navigation moves behind a geometric two-line menu. At 720px post rows collapse from date/content/action columns into a stacked reading order.

**The Reading Column Rule.** Side rails provide orientation but never compress the primary reading column below a comfortable measure.

**The Symmetric Media Rule.** Research figures, formulas, tables, and code may exceed the ordinary reading measure only through equal left and right expansion; wide media never grows from one side of the prose column.

**The Progressive Ledger Rule.** Calendar and chronological records remain primary; author tools, goals, and metrics disclose through ruled details regions.

**The Masthead Safe-Zone Rule.** On screens at or below 640px, the collapsed music player moves to the masthead at `top: 0.75rem; right: 4.15rem`, leaving the menu trigger clear.

## Elevation & Depth

The publication is flat by default. One-pixel rules, paper shifts, and spacing establish structure before shadow. Ambient shadow is limited to the open mobile navigation, media, the expanded or collapsed music player, and deliberate interactive lift. The paper field itself uses two faint radial washes and a low-opacity dot grain rather than a flat solid fill.

### Shadow Vocabulary

- **Ambient Panel:** a broad, low-opacity shadow for legacy/transient elevated surfaces.
- **Mobile Navigation:** a tighter shadow that separates the disclosed menu from the masthead.
- **Media Lift:** a moderate shadow around authored images against the paper field.
- **Player Lift:** a compact shadow for the floating music control and its active play button.

### Named Rules

**The Resting Surface Rule.** Publication rows, ledgers, calendar cells, masthead, and article structures remain complete with no shadow.

## Shapes

The dominant form language is orthogonal and rule-bound. Masthead, navigation links, publication rows, article tags, ledger cards, and calendar cells use square edges. The `4px` brand mark and thin line-built chevrons, plus/minus controls, and menu bars provide precise geometry.

Radii are functional exceptions: 12–16px for disclosed panels and technical media, 20–28px for substantial media or floating player surfaces, circles for playback controls and the record disc, and pills only for true compact toggles, progress tracks, or category badges. Check-in lights use an asymmetric `70% 30% 65% 35%` flame silhouette rotated five degrees.

**The Earned Radius Rule.** Open editorial content stays square; curvature signals a discrete control, media object, or transient surface.

**The Drawn Icon Rule.** Controls use inline SVG or CSS geometry with `currentColor`; Unicode arrows, suns, moons, and other font glyphs are not the icon language.

## Components

### Masthead and Navigation

- The sticky masthead is opaque paper with top and bottom rules, a 4px-square ink brand mark, quiet centered navigation, and secondary theme/language controls.
- Active and hover states use a teal underline rather than a filled navigation pill.
- Below 940px, a geometric two-line trigger opens an opaque two-column menu; Escape closes it and returns focus.

### Publication Index and Post Rows

- Index entries are open 3.25rem rows separated by rules, with tabular counts aligned opposite their labels.
- Post entries use date and section in a narrow rail, a serif title and excerpt, and a geometric chevron action.
- Each row begins with a short semantic-color rule that lengthens on hover; the row receives only a faint paper shift.

### Article Reading

- The article opening is one ruled sequence of provenance, title, summary, metadata, and tags.
- Tags are underlined text links rather than floating chips. Prose, references, footnotes, code, formulas, figures, and captions share the reading rhythm.
- Bright figures in dark mode receive a neutral light surround without altering the source image.

### Check-in Ledger

- Daily practice is represented by ruled weekly, time, calendar, and chronological ledger structures with tabular values.
- Lit states use asymmetric flame marks in the habit color with a restrained halo; unlit states recede into the rule color without failure styling.
- Quick check-ins use one compact ruled record: the activity and duration share the first line, while an optional personal note continues inside the same object rather than floating below it. Long-form legacy records retain their authored Markdown layout.
- The CMS quick check-in keeps habit-configured duration presets as the fastest path and places a directly editable minute field beside them. Preset and custom duration are mutually exclusive states, with integer validation before publishing.
- Author tools and reflective metrics use line-built plus/minus disclosure marks. Public records remain primary and non-gamified.

### Music Player

- The floating player is the principal glass-like exception: a rounded compact panel with a rotating record, inline SVG controls, an accent progress track, and persistent playback state.
- Collapsing reduces it to a 2.75rem circular record control. On mobile it occupies the masthead safe position rather than covering reading content or the menu.
- Rotation and state transitions collapse to effectively instant behavior under reduced-motion preferences.

## Do's and Don'ts

### Do

- **Do** use open rows, fine rules, publication indexes, and marginal notes before introducing containers.
- **Do** preserve self-hosted Newsreader Variable and ZCOOL XiaoWei as the authored display identity.
- **Do** use teal for interaction, semantic accents for provenance, and warmth only for active light or the dark-theme lantern role.
- **Do** build icons from inline SVG or CSS lines using `currentColor`.
- **Do** express check-in completion as accumulated flame marks and reflective records, not pressure.
- **Do** keep the collapsed mobile player at the masthead-safe position and verify reduced motion, keyboard focus, Chinese/English, and both themes.

### Don't

- **Don't** turn the homepage, article index, or ledger into a grid of translucent rounded cards.
- **Don't** use blur or shadow as the default means of separating reading content.
- **Don't** replace ruled navigation states with generic filled pills.
- **Don't** introduce remote or system display faces in place of the bundled serif pairing.
- **Don't** use Unicode glyphs as interface icons when the shipped language is geometric.
- **Don't** make empty check-in days red, punitive, streak-driven, or rank-based.
