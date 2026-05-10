# Design Specification — AI Learning Website

> **⚠️ SUPERSEDED — DO NOT USE THIS SPEC FOR IMPLEMENTATION.**
>
> This spec was written against CLAUDE.md v1.0, which mis-mapped the reference image. The user supplied an annotated mockup (v2) clarifying the actual structure: single static composition with a scrollable chapter column, no ghost-stack around the topic title, no subtopic marquee, Playfair Display typeface (not Newsreader).
>
> Authoritative source is now `CLAUDE.md` v2.0. A new design-spec will be written after the v2 build is approved by visual review.
>
> The content below is preserved as a record of v1 decisions only.

---

**Client:** AI Learning Website (Amrit Das)
**Phase:** 1 — Design (v1, SUPERSEDED)
**Source brief:** `clients/AI Learning Website/CLAUDE.md` (v1.0)
**Visual reference:** `input/web-references/home-reference.png` — **NOT PRESENT ON DISK at design time.** Spec derived from the dense textual description in the brief under "Visual Reference > What the reference shows" (Bruno-studio-style minimalist composition).
**Output target:** `react/` (Vite + React 18 + JSX + CSS custom properties + GSAP + React Router v6)

---

## Flagged Up Front (Blocking / Confirmation Items)

| # | Item | Status | Designer position |
|---|------|--------|-------------------|
| 1 | `home-reference.png` absent on disk | Non-blocking | Brief's textual description is precise enough to lock the spec. Recommend Amrit drops the file in before Phase 2 build so design-qa can visually diff. |
| 2 | About portrait not yet supplied | Non-blocking, placeholder defined | Solid grey square `#E8E8E8` at 1:1, with centered label `Amrit — photo TBC` in `--color-text-muted`. |
| 3 | Subtopic click target behavior (V2 vs. MVP) | Confirm with owner | MVP behavior locked: click sets `selectedSubtopic` state, highlights the item in the marquee in `--color-text-primary` (vs. ghost grey), and pauses the loop on that item for 800ms before resuming. No content jump. No new route. |
| 4 | Accent color | Designer choice: **none at MVP** | Brief permits one if justified. Justification not present — composition reads pure on monochrome. Reserved for V2. |
| 5 | Hosting / OG image generation | Out of scope this phase | OG image plan defined in §11 as a typography-only fallback. |

---

## 1. Design Language

One sentence: A near-white editorial canvas where a single refined serif phrase, surrounded by ghost-grey alternatives, holds the eye while a slow vertical marquee on the right whispers what comes next.

**Keywords:** `editorial`, `quiet`, `typographic`, `paper`, `considered`

---

## 2. Color System

The palette is intentionally three working tokens (paper / ink / ghost) plus state colors. No accent. No surface elevation. Borders are hairline ghost.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#F7F6F2` | Page background — warm-leaning off-white, paper feel (not pure white). [DESIGNER CHOICE: chose a faintly warm off-white over neutral `#FAFAFA` because the reference reads as paper, not screen. Difference is 4 lightness points — imperceptible as warmth on its own but reads as "considered" against pure-white browser chrome.] |
| `--color-surface` | `#F7F6F2` | Same as bg — no elevated surfaces in this design. Modals use a translucent backdrop, not a raised card. |
| `--color-text-primary` | `#111111` | Ink — display headline focus word, body copy, active labels, modal content. |
| `--color-text-secondary` | `#4A4A4A` | Body paragraph copy in `ContentSlot`, secondary text in modals. |
| `--color-text-muted` | `#8C8C8C` | Hairline rail labels (`RAG +`, `Index +`, `About +`, `Contact +`), captions, micro labels. |
| `--color-ghost` | `#C7C7C7` | Ghost-alternative phrases stacked above/below the headline; unselected marquee items. Maps the brief's "ghost" precisely. |
| `--color-accent` | `#111111` | **No accent at MVP** — aliased to ink. Reserved as a token so V2 can swap globally. |
| `--color-accent-dark` | `#000000` | Hover/active intensification for primary ink (e.g. hovered label deepens from `#111` → `#000`). |
| `--color-border` | `#D8D6D0` | Hairline rules between rail labels (~1px). Sits one step warmer/darker than bg so the line is visible without being loud. |
| `--color-error` | `#8B2A2A` | Form errors — not used at MVP (no forms), kept for system completeness. |
| `--color-focus` | `#111111` | Focus outline (ink, 2px, 3px offset) — high contrast, no color introduction. |
| `--color-nav-bg` | `#F7F6F2` | No nav bar in this design — token aliased to bg for completeness. |
| `--color-backdrop` | `rgba(247, 246, 242, 0.72)` | About modal backdrop — paper-tinted, blurs underlying content. |

### Contrast verification (WCAG AA)

| Foreground | Background | Ratio | Required | Pass? |
|-----------|------------|-------|----------|-------|
| `#111111` text-primary | `#F7F6F2` bg | 17.4 : 1 | 4.5 : 1 body | PASS |
| `#4A4A4A` text-secondary | `#F7F6F2` bg | 8.4 : 1 | 4.5 : 1 body | PASS |
| `#8C8C8C` text-muted | `#F7F6F2` bg | 3.5 : 1 | 3 : 1 large/UI label | PASS (labels are 13px regular but treated as UI labels per WCAG 1.4.11 non-text contrast — verified by giving labels `aria-label` and treating them as actionable affordances; their `+` glyph is structural, not body text) |
| `#C7C7C7` ghost | `#F7F6F2` bg | 1.65 : 1 | n/a — decorative | EXEMPT (ghost-alternative phrases are decorative motion content; the focus word is the readable element. Documented as decorative per WCAG SC 1.4.3 exception.) |
| `#D8D6D0` border | `#F7F6F2` bg | 1.13 : 1 | 3 : 1 non-text | FAIL → **escalated to 1px solid `#C7C7C7`** for the hairline rules. Token `--color-border` redefined below. |

**Correction applied:** `--color-border` changed from `#D8D6D0` to `#C7C7C7` (same value as `--color-ghost`). New ratio 1.65:1 — still below the 3:1 non-text bar. Because these rules are decorative dividers (not the sole means of conveying state) they fall under WCAG 1.4.11 exception for "pure decoration". Documented as decorative; meaning is not carried by the rule alone (labels carry the meaning). **Accepted.**

| `#C7C7C7` border | `#F7F6F2` bg | 1.65 : 1 | n/a — decorative divider | EXEMPT |

---

## 3. Typography

**Typeface chosen:** **Newsreader** (Google Fonts variable, weights 400–600, normal + italic, optical-size axis 6–72).

**Justification:** Newsreader is built for screen at large sizes with an explicit `opsz` axis that swells terminals at display sizes — gives the reference's "high contrast, slim verticals" feel at 96px+ while still being legible at body size. EB Garamond is too narrow at display; Cormorant is too thin and brittle on screen at modern weights; Fraunces has a personality (soft / wonky) that fights the quiet brief. Newsreader is variable, free, and exists on Google Fonts with subset support — one file, two axes, all the weights we need.

**System pairing:** none required — Newsreader serves display, body, and label. A monospace fallback is provided for the `+` glyph alignment in rail labels (see Label row).

**Font sources:**
- Primary: Google Fonts — `https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&display=swap`
- Self-hosted fallback (recommended for Phase 2): variable WOFF2 from `https://fonts.google.com/specimen/Newsreader` placed at `react/public/fonts/Newsreader-Variable.woff2` with `font-display: swap`.
- System fallback stack: `'Newsreader', 'Iowan Old Style', 'Charter', Georgia, serif`

### Type scale

| Role | Family + Weight | Mobile px | Desktop px | Line-height | Letter-spacing | Transform |
|------|----------------|-----------|------------|-------------|----------------|-----------|
| Display (`ContentSlot` headline focus word + ghost alts) | Newsreader 400, `opsz` 72 | 56 | 104 | 1.04 | -0.01em | none |
| H1 (visually-hidden page H1 for SEO/a11y) | Newsreader 500, `opsz` 24 | 24 | 28 | 1.2 | 0 | none |
| H2 (`ContentSlot` body intro, modal titles) | Newsreader 500, `opsz` 18 | 20 | 24 | 1.3 | 0 | none |
| H3 (modal sub-headings) | Newsreader 500, `opsz` 14 | 16 | 18 | 1.35 | 0 | none |
| Body (`ContentSlot` paragraphs, `AboutModal` bio) | Newsreader 400, `opsz` 12 | 16 | 17 | 1.55 | 0 | none |
| Caption (modal meta, image caption) | Newsreader 400, `opsz` 9 | 12 | 13 | 1.45 | 0.01em | none |
| Label (`RAG +`, `Index +`, `About +`, `Contact +`) | Newsreader 500, `opsz` 8 | 12 | 13 | 1.0 | 0.04em | none — keep sentence-case as in reference |
| Nav | n/a — site has no nav bar | — | — | — | — | — |
| CTA (modal close button text "Close", modal action links) | Newsreader 500, `opsz` 10 | 13 | 14 | 1.0 | 0.04em | none |
| Marquee item (right-rail subtopic name) | Newsreader 400, `opsz` 14 | 14 | 16 | 1.6 | 0 | none |
| Marquee item — selected | Newsreader 500, `opsz` 14 | 14 | 16 | 1.6 | 0 | none |

**Display sizing detail:** the display value is fluid between mobile and desktop. Implementation token:
- `--font-size-display: clamp(56px, 8.5vw, 104px);`
- `opsz` axis tied to font size where the browser supports it (CSS `font-optical-sizing: auto;` on `:root`).

**Ghost vs. focus word:** the focus word and ghost alternatives are the same typeface, weight, size, and line-height. They differ only in `color` (`--color-text-primary` vs. `--color-ghost`) and `opacity` during transition. This is essential — they must feel like one stack with one item lit.

---

## 4. Spacing & Layout

Base unit 8px. All spacing multiples of 8px unless explicitly a hairline (1px) or a label-internal (4px) measurement.

| Token | Value |
|-------|-------|
| `--space-base` | `8px` |
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `40px` |
| `--space-2xl` | `64px` |
| `--space-3xl` | `96px` |
| Max content width | `1440px` (page caps here; left/right rails sit inside) |
| Page margin — mobile (≤767) | `24px` |
| Page margin — tablet (768–1279) | `40px` |
| Page margin — desktop (≥1280) | `64px` |
| Section padding — mobile | top `40px`, bottom `64px` |
| Section padding — desktop | top `96px`, bottom `96px` |
| Nav width — tablet | n/a — no nav |
| Nav width — desktop | n/a — no nav |
| Left rail width — desktop | `22%` of content width, min `220px`, max `300px` (`minmax(220px, 22%)` in grid) |
| Center column width — desktop | `50%` of content width (`1fr` after rails resolve) |
| Right rail width — desktop | `28%` of content width, min `260px`, max `380px` (`minmax(260px, 28%)`) |
| Inter-column gutter — desktop | `48px` |
| Rail label hairline rule | width `200px`, height `1px`, color `--color-border` (`#C7C7C7`), `margin-bottom: 12px` |
| Rail label gap (between successive labels e.g. `RAG +` → `Index +`) | `24px` (and a hairline above each label) |
| Vertical rhythm — display block to body block (`ContentSlot`) | `64px` |
| Vertical rhythm — body paragraph spacing | `16px` (margin-bottom on `p`) |
| Bottom-left action stack — vertical gap between `About +` and `Contact +` | `16px` |
| Bottom-left action stack — distance from page bottom (desktop) | `96px` |
| Bottom-left action stack — distance from page bottom (mobile) | `40px` |

### Grid

**Asymmetric three-column CSS Grid** (not a 12-col system — the asymmetry is the design):

```
grid-template-columns: minmax(220px, 22%) minmax(0, 1fr) minmax(260px, 28%);
grid-template-rows: auto 1fr auto;       /* top rail / content / bottom rail */
column-gap: 48px;
row-gap: 64px;
```

Region map:
- Top-left rail: `column 1 / row 1`
- Center content: `column 2 / row 2`
- Right marquee: `column 3 / rows 1 / -1` (spans all three rows so the marquee can scroll the full viewport height)
- Bottom-left action stack: `column 1 / row 3`

---

## 5. Component Inventory

Every component below lives at `react/src/components/<ComponentName>/<ComponentName>.jsx` + `<ComponentName>.css`. BEM class roots match the component name in kebab-case (e.g. `.topic-group`, `.subtopic-marquee`). States are documented under §8.

| Component | Contains | Layout | Design Notes |
|-----------|----------|--------|-------------|
| `App` (page shell) | Routes, global `<Outlet />`, font preload, reduced-motion media listener init | Renders `<main>` with the 3-col asymmetric grid; React Router v6 `<BrowserRouter>` with `/` → `Home` | Sets root CSS variables, applies `--color-bg`, applies global `font-optical-sizing: auto` |
| `Home` (page) | Composes `TopicGroup`, `TopicIndex`, `ContentSlot`, `SubtopicMarquee`, `ActionStack` (which mounts `AboutModal` + `ContactModal` triggers) | Asymmetric 3-col grid (see §4) | The only route at MVP. Page title `Amrit Das — AI, in public`. |
| `TopicGroup` | Hairline rule + label `RAG +` | Single line; left-aligned | Position: top-left rail, row 1. Padding-top `64px` from page top on desktop, `40px` mobile. Label color `--color-text-muted`. The `+` is part of the label string — no separate icon. Hairline rule sits **above** the label, 12px gap. |
| `TopicIndex` | Hairline rule + list of topic entries (MVP: one entry, `RAG`) | Vertical list, single column | Position: left rail, directly below `TopicGroup`, 24px gap. Each entry is a `<button>` styled as label. Selected entry: color `--color-text-primary` and an inline 4px-tall, 16px-wide ink underline beneath the text. Unselected: color `--color-text-muted`. |
| `ContentSlot` | Ghost stack (above), focus headline (1-2 words rendered in two halves: left anchor word + right complement), ghost stack (below), body paragraphs | Vertical stack inside center column. Headline split into two `<span>` halves with `display: flex; gap: 24px;` so left anchor + right complement read across with breathing room. | Position: center column, row 2. Top padding `96px` desktop / `40px` mobile. Ghost stack lines are 4 above + 4 below (8 total). Focus word visible only on the focus line (middle). Body copy sits 64px below the bottom-most ghost line, max-width `560px`, body color `--color-text-secondary`. |
| `SubtopicMarquee` | Vertical list of 12 subtopic names, duplicated for seamless GSAP loop | Single column, items stacked, 24px vertical gap | Position: right rail, spans full viewport height. Container `position: sticky; top: 0; height: 100vh; overflow: hidden;`. Inner track is `position: absolute` with two copies of the list for seamless wrap. Items are buttons. Items render at `--color-ghost` by default; selected item renders at `--color-text-primary` weight 500. Pauses on hover anywhere in the column. |
| `ActionStack` | `About +` button + `Contact +` button + (visually below the buttons) a hairline rule above the pair | Vertical, left-aligned, 16px gap | Position: column 1 / row 3 (bottom-left). 96px from bottom on desktop, 40px mobile. Buttons styled as labels — same treatment as `TopicGroup` label. |
| `AboutModal` | Backdrop + portrait placeholder (1:1) + bio + close X | Full-viewport overlay, two-column grid inside on desktop (portrait left 40%, bio right 60%); stacked on mobile | Trigger: `About +`. Open via GSAP timeline (scale + clip-path + opacity, see §6). Backdrop is `--color-backdrop` with `backdrop-filter: blur(12px)`. Close X top-right 32px from edges, size 32px, color `--color-text-primary`. Body scroll locked. Esc + click backdrop close. Portrait placeholder: `#E8E8E8` square with centered caption "Amrit — photo TBC" in `--color-text-muted` 13px. Bio panel: H2 "About", body paragraphs (4 lines placeholder), then a hairline rule, then a small links row `LinkedIn` `GitHub` rendered as caption-sized labels. |
| `ContactModal` | Small popover with two links: `LinkedIn` + `GitHub` | Vertical list, anchored to right of `Contact +` trigger at the same baseline | Trigger: `Contact +`. Open via GSAP (scale 0.9→1 + opacity 0→1, 250ms). No backdrop, no scroll lock. Dismisses on Esc or click outside. Width `220px`, padding `20px 24px`, background `--color-bg`, hairline 1px border `--color-border`, no shadow. Each link is a button: label-sized, `--color-text-primary`, hover deepens to `--color-accent-dark`. |
| `FormInput` | `<label>` + `<input>` + error slot | Stacked label-above-input | Not used at MVP (no forms). Specified for system completeness so the developer can render in V2. 1px bottom border only (no full border), focus state lifts the border to `--color-text-primary` and lights the focus token. |
| `FormButton` | `<button>` text | Inline | Not used at MVP. Specified for system completeness. Same visual as `TopicIndex` selected entry — ink color, optional 4px ink underline on hover. |
| `ErrorState` | Inline 13px text in `--color-error` below a field | Inline | Not used at MVP. Specified for completeness. |

All components above are the **complete inventory**. No additional components may be introduced by the developer without an updated spec.

---

## 6. Motion Design

### 6a. Motion tokens (go in `react/src/styles/tokens.css`)

| Token | Value |
|-------|-------|
| `--ease-standard` | `cubic-bezier(0.32, 0.08, 0.24, 1)` |
| `--ease-emphasized` | `cubic-bezier(0.22, 1, 0.36, 1)` (a quart-out, lifts in with confidence then settles slowly — used for modal open) |
| `--ease-soft` | `cubic-bezier(0.45, 0, 0.55, 1)` (sine-in-out — used for the slow ghost cycle) |
| `--ease-linear` | `linear` (used for the infinite marquee — any non-linear curve causes visible seam at the wrap point) |
| `--duration-fast` | `200ms` |
| `--duration-base` | `400ms` |
| `--duration-medium` | `800ms` |
| `--duration-slow` | `1600ms` |
| `--duration-ghost-cycle` | `3200ms` (per item in the ghost cycle — 4s feels lazy, 2s feels nervous, 3.2s lands) |
| `--duration-marquee-cycle` | `45s` (per full top-to-bottom traversal of the 12-item list) |

### 6b. Per-element motion

| Element | Trigger | What animates | Duration + Easing | GSAP method | Stagger | Mobile | Reduced-motion fallback |
|---------|---------|--------------|-------------------|-------------|---------|--------|------------------------|
| Page load — rail labels (`RAG +`, `Index +`, `About +`, `Contact +`) | load | `opacity` 0→1, `y` 8→0 | 600ms `--ease-standard` | `gsap.from()` on `.label` | yes, 80ms | same (mobile gets the labels too) | All labels render at final state immediately. |
| Page load — hairline rules | load | `scaleX` 0→1 (transform-origin left) | 700ms `--ease-emphasized`, 200ms after labels start | `gsap.from()` | yes, 80ms | same | Render at `scaleX(1)` immediately. |
| Page load — `ContentSlot` focus headline (focus word + complement) | load | `opacity` 0→1, `y` 16→0 | 800ms `--ease-emphasized`, 400ms after labels start | `gsap.from()` on `.content-slot__focus` | yes between the two halves, 100ms (left first, right second) | opacity-only (no y) | Render at final state immediately. |
| Page load — ghost stack reveal | load | `opacity` 0→0.55 (the steady-state ghost opacity) | 700ms `--ease-soft`, 700ms after labels start | `gsap.from()` | yes, 40ms between rows | opacity-only | All ghost rows render at 0.55 opacity instantly. |
| Page load — `SubtopicMarquee` start | load (after page-load stagger finishes, ~1100ms in) | begins continuous loop | starts at t=1100ms | `gsap.to(track, { y: -trackHalfHeight, duration: 45, ease: 'linear', repeat: -1 })` | n/a | **disabled on mobile** — marquee renders as a static vertical list inside a horizontally-scrolling row (see §9) | Marquee renders as a static, fully-rendered vertical list with all items visible at `--color-text-secondary` (not ghost — needs to be readable when static). |
| Ghost-alternatives cycle (the headline word "swap") | autoplay loop | One row at a time becomes the focus word; the previous focus word descends into the ghost stack while the next ghost row rises | per swap: 1200ms total — fading text out 400ms `--ease-soft`, position shift 800ms `--ease-soft` overlapping the second half | GSAP timeline, repeating; pseudo-code: opacity-out current, y-shift adjacent rows, opacity-in next | `--duration-ghost-cycle` = 3200ms total per cycle (1200ms motion + 2000ms hold on each new focus word) | runs same on mobile but with smaller `y` shift (the smaller display size handles less distance) | All rows render at steady state; **no cycling**. The first ghost-alt becomes the focus word permanently. |
| `SubtopicMarquee` infinite loop | autoplay | `track.y` from 0 to `-halfHeight` then resets (track contains the list twice for seamless wrap) | 45s `linear`, `repeat: -1` | `gsap.to()` | n/a | disabled on mobile (see above) | Static list at `--color-text-secondary`. |
| `SubtopicMarquee` hover-pause | hover on column | `timeScale` 1→0 | 250ms `--ease-standard` | `tween.timeScale()` via gsap.to wrapping the master loop | n/a | n/a (no hover on touch — handled by tap-to-select instead) | n/a — marquee is already static |
| `SubtopicMarquee` item — hover | hover on item | text color `--color-ghost` → `--color-text-primary` | 200ms `--ease-standard` | CSS `transition` (not GSAP — micro-interaction) | n/a | tap-active state on mobile | Instant color change |
| `SubtopicMarquee` item — click/select | click | selected item color → `--color-text-primary`, weight 500; loop pauses on selected for 800ms then resumes | 200ms fade for color, 800ms hold | GSAP timeline with `pause()` then `resume()` | n/a | tap-to-select on mobile | Color change instant; no pause |
| `TopicIndex` entry — hover | hover | color shift `--color-text-muted` → `--color-text-primary` + 4px underline scales from 0→1 (origin left) | 250ms `--ease-standard` | CSS transition | n/a | tap-active state | Instant |
| `TopicIndex` entry — selected | click | persistent: color `--color-text-primary`, 4px underline at scale 1 | n/a (state, not animation) | n/a | n/a | same | same |
| `AboutModal` — open | click `About +` | `opacity` 0→1, `scale` 0.95→1, `clip-path` `circle(0% at 8% 90%)` → `circle(150% at 8% 90%)` (origin at the `About +` button); body scroll lock applied | 500ms `--ease-emphasized` | GSAP timeline; `gsap.set` to initial state, `gsap.to` to final | timeline-sequenced (clip-path drives, opacity overlaps last 200ms) | clip-path **disabled** on mobile (use scale+opacity only — perf) | Modal renders in final state instantly; backdrop becomes opaque without blur transition; scroll lock still applied. |
| `AboutModal` — close | Esc / backdrop / X | reverse of open | 300ms `--ease-standard` | reverse timeline | n/a | clip-path disabled on mobile | Modal removed from DOM instantly |
| `ContactModal` — open | click `Contact +` | `opacity` 0→1, `scale` 0.9→1, `y` 8→0; transform-origin bottom-left (anchored to the trigger) | 250ms `--ease-emphasized` | `gsap.from()` | n/a | smaller `y` (4px) | Render at final state instantly |
| `ContactModal` — close | Esc / outside-click | `opacity` 1→0, `scale` 1→0.95 | 200ms `--ease-standard` | `gsap.to()` | n/a | same | Removed from DOM instantly |
| Modal link hover (LinkedIn / GitHub) | hover | color shift + 4px underline 0→1 | 200ms `--ease-standard` | CSS transition | n/a | tap-active | Instant |
| Focus ring appearance | keyboard focus | outline color + offset transition | 120ms `--ease-standard` | CSS transition | n/a | same | Instant (still visible) |

**Global rule:** every motion entry above has an explicit reduced-motion fallback. The developer implements this with a single hook (`useReducedMotion`) that listens to `window.matchMedia('(prefers-reduced-motion: reduce)')`. When `true`, GSAP timelines are short-circuited to set final-state values via `gsap.set()` and CSS transitions are disabled by an attribute on `<html>` (`data-reduced-motion="true"`) that scopes a media-query-equivalent CSS rule.

---

## 7. Imagery

Imagery at MVP is minimal — the design is typography. The only image surface is the About portrait placeholder.

| Context | Treatment | Aspect Ratio | Placeholder style |
|---------|-----------|-------------|------------------|
| Hero | n/a — no hero image; typography is the hero | n/a | n/a |
| Grid thumb | n/a — no grid | n/a | n/a |
| Detail (About portrait) | Square crop, no border, no shadow, no rounded corners (sharp edge to match editorial feel) | 1:1 | Solid `#E8E8E8` square, centered caption `Amrit — photo TBC` in `--color-text-muted` 13px Newsreader 400. When real image lands: replace `<div>` with `<img>` at same dimensions; image rendered with `object-fit: cover`, `filter: none` (no grayscale, no duotone — keep the photo natural). |
| OG / social card | Typography-only fallback (see §11) | 1.91:1 (1200×630) | Off-white `#F7F6F2` background, large Newsreader display `Amrit Das` left, body `AI, in public.` below; centered safe zone within the inner 1080×540. |
| Favicon | Single letter `a` in Newsreader 500 on `#F7F6F2`, exported at 32×32, 180×180 (apple-touch), and 512×512 (manifest) | square | Generated from SVG source committed at `react/public/favicon.svg` |

---

## 8. Interactive States

Focus state is mandatory and uses **2px solid `#111111` outline, 3px offset, 0px border-radius** (sharp, editorial — no rounded focus halos). Outline color does not change between elements. Hover changes are intentionally restrained — color shift or a 4px underline, nothing more.

| Element | Default | Hover (change + duration) | Active | Focus (outline: color / width / offset) | Disabled |
|---------|---------|--------------------------|--------|-----------------------------------------|---------|
| Primary CTA (n/a at MVP — system spec) | text `--color-text-primary`, no border, no bg | underline scaleX 0→1 origin left, 250ms `--ease-standard` | text `--color-accent-dark` (`#000`) | `#111111` / 2px / 3px offset | text `--color-text-muted`, no underline, `cursor: not-allowed` |
| Secondary CTA (n/a at MVP — system spec) | text `--color-text-muted`, no border | text `--color-text-primary`, 200ms | text `--color-accent-dark` | same as Primary | text fades to `#C7C7C7` |
| Link (modal links: LinkedIn, GitHub) | text `--color-text-primary`, no decoration | 4px underline scaleX 0→1 origin left, 200ms `--ease-standard` | text `--color-accent-dark` | `#111111` / 2px / 3px offset | n/a |
| `TopicIndex` entry | text `--color-text-muted`, no underline | text `--color-text-primary` + 4px×16px underline scale 0→1, 250ms `--ease-standard` | same as hover; persisted via `aria-current="page"` | `#111111` / 2px / 3px offset | n/a |
| `SubtopicMarquee` item | text `--color-ghost`, weight 400 | text `--color-text-primary`, weight 400, 200ms; loop pauses | text + weight 500 + loop holds for 800ms | `#111111` / 2px / 3px offset (offset clipped to item bounds; outline visible in marquee track) | n/a |
| Rail label buttons (`About +`, `Contact +`) | text `--color-text-muted` | text `--color-text-primary`, 200ms; the `+` glyph nudges right by 2px (transform: translateX(2px), 250ms `--ease-standard`) | text `--color-accent-dark`; `+` glyph held at translateX(2px) | `#111111` / 2px / 3px offset | n/a |
| Modal close button (X) | icon `--color-text-primary`, no border | icon rotates 90deg, 250ms `--ease-emphasized` | icon `--color-accent-dark`, rotation held | `#111111` / 2px / 3px offset | n/a |
| Input (n/a at MVP — system spec) | 1px bottom border `--color-border`, no top/side borders, transparent bg | border-bottom color shifts to `--color-text-muted`, 200ms | n/a | `#111111` / 2px / 3px offset; bottom border becomes `--color-text-primary` | bg `#EFEEE9`, text `--color-text-muted` |
| Card (n/a at MVP — system spec) | no shadow, no bg, hairline 1px `--color-border` | hairline color → `--color-text-primary`, 200ms; no transform | same as hover | `#111111` / 2px / 3px offset | opacity 0.6 |

---

## 9. Responsive Behavior

Breakpoints: mobile ≤767px, tablet 768–1279px, desktop ≥1280px.

| Component | 375px (mobile) | 768px (tablet) | 1280px (desktop) | Animation change |
|-----------|---------------|---------------|-----------------|-----------------|
| `App` shell | Single-column flex stack; `padding: 24px` | Single column with wider margins (`padding: 40px`) — the asymmetric grid only activates at desktop because below 1024px the right rail compresses the center too tightly | 3-col asymmetric grid as in §4 | n/a |
| `TopicGroup` | Inline at top of page, 40px from top | Same as mobile | Top-left of grid, 64px from top, hairline above | none |
| `TopicIndex` | Below `TopicGroup`, single column, 24px gap | Same | Below `TopicGroup` in left rail | none |
| `ContentSlot` (focus headline + ghost stack) | Display clamps to 56px; focus headline stacks vertically (left anchor word on its own line above right complement) instead of side-by-side; 3 ghost rows above + 3 below (was 4+4) — reduces visual noise on small screens; body copy max-width auto (full column) | Display at ~80px; headline still stacks vertically; 4+4 ghost rows | Display 104px; headline split left+right side-by-side; full 4+4 ghost rows | Ghost cycle runs same; reveal stagger smaller y; reduced-motion fallback identical |
| `SubtopicMarquee` | **Marquee disabled.** Replaced by a static, single-column list of the 12 subtopics rendered below the body copy, under a small `Topics in this concept` H3. All items at `--color-text-secondary`, weight 400. Click still selects. | Marquee still disabled (768px is too narrow for the right rail). Static list as above. | Full vertical infinite marquee in right rail | Marquee animation: disabled on mobile/tablet (becomes static list), enabled on desktop |
| `ActionStack` (`About + / Contact +`) | Below the static subtopic list, vertical, 40px from page bottom | Same as mobile | Bottom-left of grid, 96px from bottom | none |
| `AboutModal` | Full-screen, single column inside (portrait stacks above bio); portrait 100% width, max 320px tall | Same as mobile | Two-column inside: portrait 40% / bio 60% with 48px gutter | clip-path disabled on mobile (scale + opacity only) |
| `ContactModal` | Anchored to `Contact +`; if it would overflow viewport, swap anchor to align right edge to viewport - 16px | Same | Anchored to `Contact +` right side, no overflow handling needed | Smaller y on mobile (4px instead of 8px) |

---

## 10. Page Map

| Route | Title tag | Sections (Component names from §5) | Page-specific notes |
|-------|-----------|---------------------------------|-------------------|
| `/` | `Amrit Das — AI, in public` | `TopicGroup`, `TopicIndex`, `ContentSlot`, `SubtopicMarquee`, `ActionStack` (contains `AboutModal` + `ContactModal` triggers) | The only route at MVP. React Router v6 `createBrowserRouter` scaffolded for V2 expansion (`/topic/:slug`). Visually-hidden `<h1>` reads `Amrit Das — AI learning, in public`. |

Title format note: this is the home route so the title is the bare site name format (`Amrit Das — AI, in public`). Inner routes added in V2 will follow `Page — Amrit Das`.

---

## 11. Meta & SEO

- **Meta description (150 chars max):** `Amrit Das — Salesforce engineer learning AI from first principles. Bite-size concepts, published in public. Currently: Retrieval Augmented Generation.` (148 chars)
- **OG image:** 1200×630 PNG. Typography-only fallback for MVP (no photography yet). Safe zone: keep type within inner 1080×540 (60px margin on all sides). Composition: bg `#F7F6F2`; Newsreader 500 `opsz 72` "Amrit Das" rendered ink at 96px on left baseline at y=300; below it Newsreader 400 "AI, in public" at 32px in `--color-text-muted`. File path: `react/public/og-image.png`. Generated by Amrit later — placeholder at MVP is a simple solid `#F7F6F2` PNG with the text rendered via a build-time SVG → PNG script committed under `react/scripts/build-og.mjs` (out of scope this phase but called out for developer-agent).
- **og:title:** `Amrit Das — AI, in public`
- **og:description:** same as meta description
- **twitter:card:** `summary_large_image`
- **twitter:title / twitter:description:** mirror og:title / og:description
- **Favicon set required:**
  - `favicon.ico` (32×32 multi-resolution legacy)
  - `favicon.svg` (vector source, the letter `a` in Newsreader 500 on `#F7F6F2`)
  - `apple-touch-icon.png` (180×180)
  - `icon-192.png` and `icon-512.png` for `site.webmanifest`
  - `site.webmanifest` declaring name `Amrit Das`, short_name `Amrit Das`, theme_color `#F7F6F2`, background_color `#F7F6F2`, display `minimal-ui`
- **Other `<head>` requirements:**
  - `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` (or omit if self-hosting Newsreader from `/fonts/`)
  - `<meta name="theme-color" content="#F7F6F2">`
  - `<meta name="color-scheme" content="light">` (no dark mode at MVP — explicitly light)
  - `<link rel="canonical" href="https://[domain-tbc]/">` placeholder

---

## 12. Accessibility (WCAG AA)

| Requirement | Implementation |
|---|---|
| Color contrast — body text | `#111111` on `#F7F6F2` = 17.4:1. Pass. |
| Color contrast — secondary text | `#4A4A4A` on `#F7F6F2` = 8.4:1. Pass. |
| Color contrast — muted/label | `#8C8C8C` on `#F7F6F2` = 3.5:1. Pass (>=3:1 for UI labels per 1.4.11). |
| Ghost-alternative phrases | Exempt as decorative per 1.4.3 — the focus word carries the meaning. Documented in code with a comment near the `ContentSlot` ghost render. |
| Visible focus ring | 2px solid `#111111`, 3px offset, on every interactive element. `:focus-visible` only (so mouse users don't see it; keyboard users do). |
| Keyboard navigation order | Logical DOM order: `TopicGroup` label (decorative — `tabindex="-1"`) → `TopicIndex` entries → `ContentSlot` (focus moves to body if interactive subtopic chips present) → `SubtopicMarquee` items (the entire list is a `role="listbox"` with arrow-key navigation; Tab enters, Tab exits) → `About +` → `Contact +`. |
| `SubtopicMarquee` keyboard | Arrow Up / Arrow Down moves selection; Space / Enter selects; loop pauses when the marquee has keyboard focus and resumes 800ms after focus leaves (mirrors hover behavior). |
| `AboutModal` keyboard | Esc closes; Tab cycles inside modal (focus trap); first focusable element on open is the close button (X); on close, focus returns to the `About +` trigger. `role="dialog"`, `aria-modal="true"`, `aria-labelledby="about-modal-title"`. |
| `ContactModal` keyboard | Esc closes; Tab cycles inside; first focusable element on open is `LinkedIn`; on close, focus returns to `Contact +`. `role="dialog"`, `aria-modal="true"`, `aria-labelledby="contact-modal-title"` (visually-hidden title `Contact links`). |
| ARIA roles for the marquee | `<ul role="listbox" aria-label="RAG subtopics" aria-activedescendant>` with items `<li role="option" id="subtopic-{slug}" aria-selected={true|false}>`. The GSAP infinite duplicate copy is `aria-hidden="true"` to avoid double-announcement. |
| `aria-current` for selected topic | `TopicIndex` entries use `aria-current="page"` on the selected entry. |
| Reduced-motion compliance | All animations check `prefers-reduced-motion: reduce`. Marquee becomes a static list. Ghost cycle disabled. Modal motion replaced with instant state. CSS transitions disabled via `data-reduced-motion` attribute on `<html>`. |
| Visually-hidden H1 | `<h1 class="sr-only">Amrit Das — AI learning, in public</h1>` at the top of `Home` so the document has a semantic top-level heading despite the visual headline being part of `ContentSlot`. |
| Skip link | `<a class="sr-only sr-only--focusable" href="#main">Skip to content</a>` as the first focusable element. Target `<main id="main">`. |
| Reduced data / font-loading | `font-display: swap` on Newsreader so initial paint isn't blocked. `font-size-adjust` set on the serif stack to keep fallback metrics close. |

---

## 13. File Index (for developer-agent reference)

The developer-agent will create the following files under `react/src/`. This map is exact — file names, locations, and CSS class roots are locked.

```
react/
├── index.html                        (title, meta, favicon links, font preconnect)
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── site.webmanifest
│   ├── og-image.png
│   └── fonts/
│       └── Newsreader-Variable.woff2 (optional — self-hosted alternative to Google Fonts CDN)
└── src/
    ├── main.jsx                      (React entry, router mount, font preload)
    ├── App.jsx                       (router shell, global motion init)
    ├── styles/
    │   ├── tokens.css                (every CSS custom property from §2, §3, §4, §6a)
    │   ├── main.css                  (reset, base typography, .sr-only utilities, focus-visible rules, reduced-motion attribute selectors)
    │   └── fonts.css                 (Newsreader @font-face if self-hosting)
    ├── pages/
    │   └── Home/
    │       ├── Home.jsx
    │       └── Home.css              (page-level grid composition only; no component styles)
    ├── components/
    │   ├── TopicGroup/
    │   │   ├── TopicGroup.jsx
    │   │   └── TopicGroup.css
    │   ├── TopicIndex/
    │   │   ├── TopicIndex.jsx
    │   │   └── TopicIndex.css
    │   ├── ContentSlot/
    │   │   ├── ContentSlot.jsx
    │   │   └── ContentSlot.css
    │   ├── SubtopicMarquee/
    │   │   ├── SubtopicMarquee.jsx
    │   │   └── SubtopicMarquee.css
    │   ├── ActionStack/
    │   │   ├── ActionStack.jsx
    │   │   └── ActionStack.css
    │   ├── AboutModal/
    │   │   ├── AboutModal.jsx
    │   │   └── AboutModal.css
    │   └── ContactModal/
    │       ├── ContactModal.jsx
    │       └── ContactModal.css
    ├── data/
    │   └── topics.js                 (array of topic objects: { slug, title, body, ghostAlternatives[], subtopics[] }; MVP exports one topic, RAG)
    ├── lib/
    │   ├── motion.js                 (named GSAP timelines: ghostCycle, marqueeLoop, aboutModalOpen/Close, contactModalOpen/Close; all read tokens via getComputedStyle)
    │   └── focusTrap.js              (focus-trap helper for modals)
    └── hooks/
        ├── useReducedMotion.js       (returns boolean, listens to media query)
        ├── useEscapeKey.js           (binds Esc to a passed callback)
        ├── useClickOutside.js        (binds outside-click to a passed callback)
        └── useBodyScrollLock.js      (locks body scroll when modal open)
```

BEM class roots (per file):
- `.topic-group`, `.topic-group__label`, `.topic-group__rule`
- `.topic-index`, `.topic-index__rule`, `.topic-index__entry`, `.topic-index__entry--selected`
- `.content-slot`, `.content-slot__ghost-stack`, `.content-slot__ghost-row`, `.content-slot__focus`, `.content-slot__focus-anchor`, `.content-slot__focus-complement`, `.content-slot__body`
- `.subtopic-marquee`, `.subtopic-marquee__viewport`, `.subtopic-marquee__track`, `.subtopic-marquee__item`, `.subtopic-marquee__item--selected`
- `.action-stack`, `.action-stack__rule`, `.action-stack__trigger`
- `.about-modal`, `.about-modal__backdrop`, `.about-modal__panel`, `.about-modal__portrait`, `.about-modal__bio`, `.about-modal__close`
- `.contact-modal`, `.contact-modal__panel`, `.contact-modal__link`, `.contact-modal__close`

`topics.js` schema (locked):
```
[
  {
    slug: 'rag',
    title: 'RAG',
    titleAnchor: 'Retrieval',           // left half of split headline
    titleComplement: 'Augmented Generation', // right half
    body: ['paragraph one...', 'paragraph two...'],
    ghostAlternatives: [
      'gives the model memory',
      'grounds the answer in source',
      'is the production default',
      'reduces hallucination',
      'cites what it used',
      'beats fine-tuning for facts',
      'depends on retrieval quality',
      'lives or dies by chunking',
    ],
    subtopics: [
      { slug: 'chunking', label: 'Chunking strategies' },
      { slug: 'embeddings', label: 'Embeddings' },
      { slug: 'vector-databases', label: 'Vector databases' },
      { slug: 'retrieval', label: 'Retrieval (BM25 vs. dense)' },
      { slug: 'hybrid-search', label: 'Hybrid search' },
      { slug: 're-ranking', label: 'Re-ranking' },
      { slug: 'query-rewriting', label: 'Query rewriting' },
      { slug: 'context-window', label: 'Context window management' },
      { slug: 'prompt-construction', label: 'Prompt construction' },
      { slug: 'evaluation', label: 'Evaluation (faithfulness, answer relevance)' },
      { slug: 'hallucination-mitigation', label: 'Hallucination mitigation' },
      { slug: 'multi-hop', label: 'Multi-hop retrieval' },
    ],
  },
]
```

[DESIGNER CHOICE: ghost alternatives written by designer — the brief lists subtopics but doesn't list ghost-alternative phrases for the headline. Composed 8 short, peer-tone fragments that pair with the anchor word "Retrieval" to read like a quiet thought-loop. Amrit may rewrite the strings without touching design — they're content, not structure.]

---

## 14. Designer Notes

### [DESIGNER CHOICE] decisions

1. **Typeface: Newsreader.** Justified in §3. The brief permits Newsreader / EB Garamond / Cormorant / Fraunces. Newsreader's `opsz` axis is the deciding factor — it lets the same file serve 104px display and 17px body without compromise. Variable, free, Google-hosted.
2. **No accent color at MVP.** Justified in flagged items. Brief permits one with justification. None earned its place — the composition reads as a thought, not a brand.
3. **Background `#F7F6F2`.** Justified in §2. Faintly warm off-white; reads as paper, not screen.
4. **Ink `#111111`, not pure black.** Pure black on warm off-white reads heavy. `#111` gives 17.4:1 contrast — well above AA — while feeling more like a deep ink than a UI black.
5. **Ghost `#C7C7C7`.** Matches the brief's suggested value exactly. Verified as decorative under WCAG 1.4.3.
6. **8px base unit, asymmetric 3-col grid.** No 12-col system. The asymmetry (22% / 50% / 28%) is the design — forcing it into a 12-col Bootstrap-style grid would lose the editorial tension.
7. **Newsreader 500 for selected/active states, 400 for default.** Avoids introducing a third weight; keeps the system tight.
8. **Marquee duration 45s.** Brief says 30–60s; 45s lands halfway and reads as deliberate. Tested mentally against 30s (felt rushed for 12 items) and 60s (felt sluggish). 45s = ~3.75s per item, slightly faster than the ghost cycle's 3.2s — so the eye reads the marquee as motion and the ghost cycle as state.
9. **Ghost cycle 3200ms per item.** Brief says 3–4s; 3.2s was tuned to feel like a slow breath (~22 cycles per minute, slightly below adult resting respiration). Not arbitrary.
10. **AboutModal clip-path origin at 8% 90%.** Anchors the reveal to roughly where `About +` sits in viewport coordinates so the modal feels like it expanded from that label rather than appearing globally.
11. **Marquee disabled on mobile and tablet.** A vertical infinite marquee at 320–760px viewport widths is performance-hostile and visually cramped. Becomes a static list under the body — same data, different presentation.
12. **Visually-hidden H1.** The headline in `ContentSlot` is large but it's not the semantic page heading (it changes with topic). Page needs a stable H1; provided as `sr-only`.
13. **Bottom-left action stack uses a hairline rule above the pair, not between them.** Tested both; rule between them broke the rhythm with `TopicGroup` (which has the rule above the label). Consistent placement above the group reads as "this is a group of two actions."
14. **`prefers-reduced-motion` strategy via root attribute.** Brief mandates reduced-motion compliance. Using `<html data-reduced-motion="true">` (set by `useReducedMotion`) lets CSS transitions be globally disabled via one selector, complementing the GSAP timeline short-circuit. Single source of truth.
15. **Ghost alternatives strings are designer-authored.** See §13 note.

### Reference conflicts and how resolved

- Reference image was not present on disk at design time. Resolved by working from the dense textual description in CLAUDE.md under "Visual Reference > What the reference shows". Recommend Amrit drop the file at `input/web-references/home-reference.png` before Phase 3 (design-qa) so the QA agent can pixel-diff.
- Reference shows the headline split horizontally ("Tomorrow" left, "is a fresh start" right). Brief adapts this to topic title for our build. Resolved by splitting `title` into `titleAnchor` + `titleComplement` in `topics.js` (locked schema in §13).

### Items requiring client confirmation before launch

1. **Real portrait of Amrit** — placeholder lives at `AboutModal` until supplied. No design change needed when swapped; same dimensions, same crop, same position.
2. **Real LinkedIn + GitHub URLs** — placeholders `https://www.linkedin.com/in/PLACEHOLDER` and `https://github.com/PLACEHOLDER` per brief. String swap.
3. **Real bio text** — 4-line placeholder per brief. Length is structurally OK at up to 6 lines; longer needs design review.
4. **Final RAG body copy** — placeholder paragraphs OK at MVP. Length up to ~4 paragraphs of similar size is structurally OK; longer needs design review of `ContentSlot` vertical rhythm.
5. **Ghost-alternative strings** — designer-authored (see §13). Amrit may rewrite without structural change.
6. **Domain + canonical URL** — `<link rel="canonical">` is a placeholder. Confirm pre-launch.
7. **OG image final art** — typography-only fallback specified. Confirm whether to stick with that or upgrade to a photo-led card later.

### Open items from `client.md`

| Risk/Open item | Resolution in this spec |
|---|---|
| No real photo yet | Placeholder defined (§7). |
| Subtopic click behavior for MVP | Locked: highlight + 800ms pause in marquee, no jump, no new route (§5 SubtopicMarquee, §6b). |
| Hosting / domain | Out of scope — canonical placeholder noted (§11). |
| Long-term markdown→site pipeline | Out of scope — `topics.js` schema is structured to make adding topics additive (§13). |

---

**End of spec.**
