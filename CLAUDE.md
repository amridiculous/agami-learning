# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Developing

All source code lives in `react/`. Run all commands from that directory.

```bash
cd react
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build
npm run lint     # ESLint
```

See `react/CLAUDE.md` (created in Phase 2) for the coding patterns, GSAP rules, BEM conventions, and common mistakes to avoid — read it before touching any file in `react/`.

---

## Current Architecture

Not built yet. The agency pipeline starts at Phase 1 (design-agent → `reviews/design-spec.md`). Phase 2 (developer-agent) scaffolds Vite + React + GSAP under `react/`.

---

# Client Context — AI LEARNING WEBSITE

## Version: 2.0 — REWRITE after v1 misread the reference. User supplied a second mockup with red annotations clarifying the structure. The site is NOT a 3-zone composition with marquee + ghost-stack; it is a single static composition with a scrollable chapter column.

## Workflow rule (locked by user request)

After the brief / plan is approved, **always invoke developer-agent next for a quick preview** before invoking design-agent or any QA agent. Show the running site to the user, get feedback, iterate. Only after the structure is approved by visual review do we run design-agent (to lock typography/motion/tokens) and the QA gates. This overrides the standard Phase 1→2→3 ordering.

---

## Identity
- Client name: AI Learning Website
- Owner: Amrit Das (solo)
- Domain: Personal learning + public-facing showcase for AI/ML concepts (starting with RAG)
- Target audience:
  - AI/ML learners building from first principles
  - Salesforce mid-level developers moving into AI
  - Engineering peers on the same learning journey
- Tone / personality:
  - Editorial, quiet, considered. The reference image's voice.
  - Confident without being loud. Peer-to-peer, not authoritative.
  - White space is the design — typography carries the whole experience.

## Owner Bio (placeholder — Amrit will replace before public launch)
"Salesforce mid-level engineer on the path to Architect, learning AI from
first principles and posting what I figure out. Currently going deep on
RAG. Build → learn → publish, in public, every weekday."

---

## Project Goal

A single-route, minimalist personal site that publishes bite-size, deeply-understood AI concepts as the public artifact of the owner's private "Learn → Create → Post" workflow (private Obsidian vault + NotebookLM stay local; this site is the public layer).

**Primary visitor action:** read the currently-selected concept (RAG at MVP), browse subtopics, optionally open About / Contact.

**Success at MVP:** site loads, layout matches reference exactly, RAG content renders, subtopic marquee scrolls continuously, About + Contact modals open and close cleanly, mobile is usable.

---

## Visual Reference

Two references:
1. `input/web-references/home-reference.png` — the original Bruno-studio aesthetic image (typography + composition source)
2. The annotated mockup the user supplied in v2 (their second screenshot, with red annotations) — this is the AUTHORITATIVE layout mapping. Save it to `input/web-references/mockup-annotated.png` when convenient.

### Correct mental model (from the annotated mockup)

The site is a **single static composition** at viewport height. No vertical page scroll. One area (the chapter column) has internal scroll.

**Top-left rail** — vertical stack of topic group labels with hairline rules:
- MVP: just one entry — `RAG +` (replaces the reference's `Studio +` / `Work Index +`)
- Each future topic group (LLMs, Agents, etc.) gets its own `[Group] +` label stacked here
- Labels are small (~13–14px), regular weight, near-black, with a thin light-grey hairline rule above each
- Click is a no-op at MVP (label is the group header for the chapter column on the right)

**Center-left** — single big serif word: the topic title (MVP: `RAG`):
- Same display serif as the focus chapter on the right
- Sits at a fixed vertical position (the **focus line**) aligned with the active chapter
- Does not animate. Does not cycle.
- For MVP this is literally the string `RAG` — nothing else next to it

**Right column — the scrollable chapter list** (this is the only motion on the page):
- A vertical list of chapter names rendered in the same large display serif as the topic title
- ONE chapter at a time sits in the **focus row** (same horizontal line as the topic title `RAG`); it renders in near-black
- All other chapters above and below render in ghost-grey (~#C7C7C7), same size and font
- Internal scroll (mouse wheel, touch, arrow keys when the column has focus) moves the chapter list vertically past the focus line
- As a chapter crosses the focus line, it darkens; as it leaves, it fades back to ghost-grey
- Click a chapter → smooth scroll snaps that chapter to the focus row, AND navigates to `/chapter/:slug`
- The list overflows the viewport above and below; the column has its own scroll container

**Bottom-left rail** — two labels stacked with hairline rules:
- `About +` (top)
- `Contact +` (bottom)
- Same treatment as the top-left rail
- `About +` click → full-expand AboutModal (unchanged from v1)
- `Contact +` click → small-anchored ContactModal (unchanged from v1)

### What was wrong in v1 (do not rebuild these)

- ❌ Ghost-alternatives stack around the topic title (`<ghost alt 1>`, etc.) — there is no ghost stack around `RAG`. The topic title sits alone.
- ❌ Continuous infinite-scroll marquee for subtopics — chapters are a NORMAL scrollable column, not a marquee. The user explicitly does NOT want autoplay scrolling.
- ❌ Word-cycling animation on the headline — the topic title does not cycle. It is the static string `RAG`.
- ❌ "Subtopic" as a concept — they're called **chapters**, and they're the entire right-column display, not a sidebar list.
- ❌ Replacing `Studio +` / `Work Index +` keeping the original meaning — they are replaced entirely by topic group labels (just `RAG +` at MVP).

---

## Hard Constraints

- **Aesthetic = the reference image.** This is locked in — designer interprets within these bounds, does not deviate.
  - Background: near-white paper tone (e.g. `#FAFAFA` — designer chooses exact)
  - Ink: near-black (e.g. `#111` — designer chooses)
  - Ghost: light grey (e.g. `#C7C7C7` — designer chooses)
  - No accent color at MVP. If designer wants one, justify in design-spec.
- **Typeface (locked):** **Playfair Display** (Google Fonts, variable weight 400–900, italic available). High-contrast editorial Didone-like serif. NOT Newsreader (v1 used Newsreader; it reads too "literary" — Playfair has the dramatic thick/thin contrast the reference image needs).
  - Display sizes (RAG topic title, chapters): large — `clamp(56px, 6vw, 80px)` is a reasonable starting point but designer should tune. Pay attention to whether 80px is too big or too small relative to the mockup; chapters are visually substantial.
  - Body text (labels, modal copy): system sans (e.g. Inter, or system-ui) or Playfair Display at small sizes — designer's call. Labels in the mockup look like a clean sans, not serif.
- **Routes:** two at MVP — `/` (home with topic title + chapter list) and `/chapter/:slug` (chapter view). The chapter view at MVP is the same layout with a chapter content body rendered below or after the focus line (placeholder text is fine).
- **Stack:** React (Vite) + JSX + CSS custom properties + GSAP — matches the agency template
- **Mobile responsive** but desktop-first. The reference IS desktop-only; mobile fallback is acceptable to be simpler (stacked, no marquee, or horizontal marquee).
- **Motion:** all GSAP animations must respect `prefers-reduced-motion`.
- **Placeholders are explicit:**
  - About photo → placeholder image (e.g. solid grey square or a Unsplash-style stand-in labeled "Amrit — photo TBC")
  - LinkedIn URL → `https://www.linkedin.com/in/PLACEHOLDER`
  - GitHub URL → `https://github.com/PLACEHOLDER`
  - Bio → the 4-line placeholder above
  - All RAG content body text can be lorem-style at MVP — styled correctly, fillable later
- **Must NOT have at MVP:**
  - Multiple routes / multi-page navigation
  - Forms, CMS, search, dark-mode toggle, analytics
  - Decorative graphics, illustrations, or imagery beyond the About portrait placeholder
  - Any reference to the Obsidian vault, NotebookLM, or Claude Code commands (those are private)
  - Warm/cream tones, dark mode, color accents (unless designer justifies one in design-spec)

---

## Content / Topics

The data shape is **Topic Group → Chapters**. MVP has one topic group (`RAG`) with 12 chapters.

### Topic Group — RAG (Retrieval Augmented Generation)
- **Group label (left rail):** `RAG +`
- **Display title (center, focus row):** `RAG`
- **Group body copy** (only relevant if a "topic overview" route is built later — defer at MVP):
  "Retrieval Augmented Generation is the pattern where a language model is given access to an external knowledge base at inference time. Instead of relying only on its training, the model retrieves relevant chunks of text and grounds its answer in them."
- **Chapters (12 items — rendered as the scrollable right column):**

| # | slug | display name |
|---|------|--------------|
| 1 | chunking-strategies | Chunking strategies |
| 2 | embeddings | Embeddings |
| 3 | vector-databases | Vector databases |
| 4 | retrieval-bm25-vs-dense | Retrieval (BM25 vs. dense) |
| 5 | hybrid-search | Hybrid search |
| 6 | reranking | Re-ranking |
| 7 | query-rewriting | Query rewriting |
| 8 | context-window-management | Context window management |
| 9 | prompt-construction | Prompt construction |
| 10 | evaluation | Evaluation (faithfulness, answer relevance) |
| 11 | hallucination-mitigation | Hallucination mitigation |
| 12 | multi-hop-retrieval | Multi-hop retrieval |

### Data shape (in `react/src/data/topics.js`)

```js
export const topicGroups = [
  {
    slug: 'rag',
    label: 'RAG +',           // for the left rail group label
    title: 'RAG',             // for the focus row when this group is active
    body: ['...placeholder paragraphs...'],
    chapters: [
      { slug: 'chunking-strategies', name: 'Chunking strategies', body: '...placeholder...' },
      ...
    ],
  },
];

export const owner = {
  bio: '...placeholder bio...',
  linkedin: 'https://www.linkedin.com/in/PLACEHOLDER',
  github: 'https://github.com/PLACEHOLDER',
};
```

Architecture must allow appending more groups (with their own chapters) by editing this file only.

---

## Layout Concept

### Home (`/`)

Single static viewport. No page scroll. Internal scroll on the chapter column only.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ────────────                                       ── ghost ──     │  ← chapters above
│  RAG +                                            chapter name      │     focus line,
│                                                   chapter name      │     all ghost-grey
│                                                   chapter name      │
│                                                                     │
│                                                                     │
│                       RAG    FOCUSED CHAPTER NAME                   │  ← focus line
│                                                                     │     (vertical center)
│                                                   chapter name      │
│                                                   chapter name      │  ← chapters below
│                                                   chapter name      │     focus line,
│                                                   ── ghost ──       │     all ghost-grey
│  ────────────                                                       │
│  About +                                                            │
│  ────────────                                                       │
│  Contact +                                                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
   left rail (~15%)      center-left      right column (~50%, vertical scroll)
```

The focus line is at the vertical center of the viewport. The "RAG" text is anchored to the left of the chapter that happens to be in the focus row at any moment. The chapter list scrolls internally; "RAG" stays fixed.

### Components (revised for v2)

| Component | Position | Behavior |
|-----------|----------|----------|
| `TopicGroupRail` | top-left | Vertical stack of topic-group labels with hairlines (MVP: just `RAG +`). No click action at MVP. |
| `TopicTitle` | center-left, vertically centered (at the focus line) | Static large-serif text rendering the active group's title (`RAG`). No animation, no cycling. |
| `ChapterColumn` | right ~50% of viewport, vertically centered, internal scroll | Vertical list of chapter names rendered in large Playfair Display. The chapter aligned with the focus line is near-black; all others ghost-grey. Scroll moves chapters past the focus line (wheel, touch, keyboard). Click → snap-scroll that chapter to focus + navigate to `/chapter/:slug`. |
| `ActionStack` | bottom-left | Two labels (`About +`, `Contact +`) with hairlines; triggers for the two modals. |
| `AboutModal` | trigger bottom-left, modal expands to fullscreen | Unchanged from v1: GSAP timeline, clip-path expansion, focus trap, body scroll lock, placeholder portrait + bio. |
| `ContactModal` | trigger bottom-left, anchored popover | Unchanged from v1: small GSAP popover, focus trap, LinkedIn + GitHub placeholder links. |

### Chapter view (`/chapter/:slug`)

Same shell as home — left rail, topic title, action stack — but:
- The clicked chapter is the one in the focus row (driven by the URL slug)
- Below the focus row or after a transition, a chapter body section appears with placeholder content
- Back/forward via browser history returns to `/` or another chapter

(MVP can keep chapter body as a single placeholder paragraph — the user will fill these via their `/learn` workflow output later.)

---

## Motion Design Intent (v2)

| Animation | Spec |
|-----------|------|
| Chapter focus crossfade | As a chapter scrolls past the focus line, its color tweens from `--color-ghost` to `--color-ink` based on its distance from the line (and back when leaving). Implementation: compute each chapter's vertical position relative to the focus line on every scroll frame; map distance → opacity/color. Smooth, frame-locked, not stepped. |
| Click-to-snap | Click any chapter → smooth GSAP `to(scrollTop, ...)` so that chapter ends up centered on the focus line. ~500ms, `power2.inOut`. Then `navigate('/chapter/:slug')`. |
| Initial reveal | On page load, stagger: top-left labels (80ms) → topic title (100ms) → chapter column fades in (200ms) → bottom-left labels (80ms). ~600–700ms total. |
| About modal open | Scale from 0.95 + opacity 0 → 1, plus clip-path expand from `About +` button origin. ~400–500ms, custom-ease. Body scroll locks. (Unchanged from v1.) |
| About modal close | Reverse, ~300ms. (Unchanged from v1.) |
| Contact modal open | Small popover anchored next to button. Scale 0.9 + opacity 0 → 1. ~250ms. No backdrop, no scroll lock. (Unchanged from v1.) |
| `prefers-reduced-motion` | All motion replaced with instant state changes. Chapter focus crossfade still happens (it's the affordance, not decoration), but without smooth interpolation — chapter snaps to near-black instantly when at focus line, ghost-grey otherwise. Snap-scroll on click becomes instant `scrollTo` (no smooth). |

### Explicitly NOT in v2 (removed from v1)
- Ghost-alternatives cycle animation (the v1 word-cycling on the headline) — removed.
- SubtopicMarquee infinite-scroll — removed entirely; the chapter column is a normal scrollable list.

---

## Navigation

No navigation bar. The layout itself is the navigation:
- Left rail = topic chooser
- Right rail = subtopic chooser
- Bottom-left = About / Contact

---

## Deliverable

- Page type: Single-page minimalist showcase
- Framework: React (Vite) + JSX + CSS custom properties + GSAP
- Router: React Router v6 (single route at MVP, scaffolded for expansion)
- Responsive: Yes — desktop-first, graceful mobile fallback
- Stack: Follows agency template (see `react/CLAUDE.md` when developer-agent creates it)

---

## Page Map (v2)

| Route | Page | Sections |
|-------|------|----------|
| `/` | Home | TopicGroupRail (left), TopicTitle (center-left, fixed at focus line), ChapterColumn (right, internal scroll, first chapter in focus by default), ActionStack (bottom-left), AboutModal + ContactModal mountpoints |
| `/chapter/:slug` | Chapter | Same shell. Chapter matching `:slug` is the one in the focus row on load (scroll position pre-set). Chapter body content appears below the focus row (placeholder copy at MVP). |

---

## Input Files

- Web references: `/input/web-references/`
  - `home-reference.png` — user-supplied reference (TO BE SAVED here by Amrit — design-agent should request if missing)
- Brand assets: `/input/brand-assets/`
  - Empty — no logo, no portrait. All visuals are typography-only at MVP.

---

## Contact / Stakeholders

- Owner & sole stakeholder: Amrit Das
- Email: amritcompaq09@gmail.com
- No external approvers — Amrit reviews at each checkpoint

---

## Compliance & Legal

- None at MVP. Public, personal, no PII collection, no forms.
- Accessibility target: WCAG AA — color contrast, keyboard nav for modals + topic/subtopic selection, focus rings, reduced-motion compliance.

---

## Risks & Open Items

- **No real photo of Amrit yet** — placeholders for MVP, swap before public launch.
- **Subtopic click target behavior** — for MVP: highlight + scroll within ContentSlot; deeper per-subtopic pages are V2. Confirm with design-agent in spec.
- **Hosting / domain** — not decided yet; build outputs a static `dist/` ready for any host.
- **Content authoring flow long-term** — when the private vault produces concept notes, we'll add a markdown→site pipeline. Out of scope for MVP; data shape in `topics.js` is structured to make that additive.
