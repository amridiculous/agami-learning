# React Project — Architecture Reference (v2)

This file is the source of truth for patterns used in this project.
Read it before touching any file in `react/`.

> **v2 rebuild.** v1 patterns for the ContentSlot ghost-cycle and the
> SubtopicMarquee infinite-scroll have been removed. The new structural
> piece is `ChapterColumn` — a single internally-scrollable list that
> drives the entire layout. See § ChapterColumn focus crossfade below.

## Stack
- React 18 + Vite 5
- JSX (`.jsx` for every component file)
- CSS custom properties + BEM (no utility framework, no CSS-in-JS)
- GSAP 3 (no ScrollTrigger; basic `gsap.to` + `gsap.context`)
- React Router v6 (`createBrowserRouter` in `main.jsx`)
- Routes: `/` (home) and `/chapter/:slug`. `*` redirects to `/`.

## Folder Structure
```
react/
  index.html              ← Vite entry. Meta/OG/Twitter/favicon/font links.
                            Loads Playfair Display + Inter from Google Fonts.
  public/
    favicon.svg
    site.webmanifest
    robots.txt
    sitemap.xml
  src/
    main.jsx              ← createBrowserRouter + RouterProvider
    App.jsx               ← Router shell. Mounts <Outlet/>, skip link,
                            calls useReducedMotion.
    styles/
      tokens.css          ← All design tokens (color, type, spacing, motion).
                            One CSS custom property per token. Nothing else.
      main.css            ← Reset, base typography, .sr-only, focus-visible,
                            reduced-motion globals. Imports tokens.css at the
                            top. Locks body to height:100vh; overflow:hidden
                            (no page scroll — internal scroll is only on
                            ChapterColumn).
    pages/
      Home/
        Home.jsx          ← The two-route view. Composes the components.
                            Reads :slug from useParams to position the
                            initial chapter at the focus line.
        Home.css          ← Page-level grid composition only.
    components/
      TopicGroupRail/     ← Top-left vertical stack of topic-group labels
                            with hairlines. MVP: just `RAG +`.
      TopicTitle/         ← Center-left big serif word (e.g. `RAG`).
                            Static — no animation, no cycling.
      ChapterColumn/      ← Right column scrollable chapter list.
                            Internal scroll only. Focus-line crossfade.
      ActionStack/        ← Bottom-left: About + / Contact + triggers + modals.
      AboutModal/         ← Full-viewport modal (clip-path + scale + opacity).
                            Unchanged from v1.
      ContactModal/       ← Small anchored popover. Unchanged from v1.
    data/
      topics.js           ← v2 schema. Exports `topicGroups` (named + default)
                            and `owner`.
                            Shape: { slug, label, title, body, chapters[] }.
    lib/
      focusTrap.js        ← createFocusTrap(panelEl, { initialFocus }) → release fn.
    hooks/
      useReducedMotion.js ← Boolean + sets <html data-reduced-motion="…">.
      useEscapeKey.js     ← Binds Esc to a callback while active.
      useClickOutside.js  ← Binds outside-pointerdown to a callback while active.
      useBodyScrollLock.js ← Locks body scroll while active (mobile-Safari-safe).
```

## Key Patterns

### Layout (single static viewport) — v2 polish (viewport-centered hero pair)

The site is one screen, not a scrolling page. **The hero pair (TopicTitle +
focused chapter) is centered on the viewport via absolute positioning**, not
via CSS Grid track widths. The grid track approach in the original v2 build
left the title and chapter column visually disjoint; the polish pass moves
to a one-region grid (`grid-template-areas: "content"`) and anchors each
element with its own absolute coords.

Desktop layout (>= 1024px):

```css
.home {
  position: relative;
  height: 100vh;
  padding: 0;                  /* rail positions are absolute from viewport edges */
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: "content";
  overflow: hidden;
}

.home__title {
  position: absolute;
  top: 50%;
  right: 50%;                  /* right edge of title at viewport center */
  margin-right: var(--hero-pair-gap);
  transform: translateY(-50%);
}

.home__chapters {
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;                   /* left edge of chapter column at viewport center */
  right: 0;
}

.home__top-left {
  position: absolute;
  top: var(--page-margin-rail-y);
  left: var(--page-margin-rail-x);
}

.home__bottom-left {
  position: absolute;
  bottom: var(--page-margin-rail-y);
  left: var(--page-margin-rail-x);
}
```

The hero pair gap (`--hero-pair-gap: 24px`) and rail offsets
(`--page-margin-rail-x: 5%`, `--page-margin-rail-y: 6%`) are all tokens.

Mobile (< 1024px) reflows to a stacked single-column grid (unchanged from
v2 first pass).

### Reduced motion
- `useReducedMotion` is called once in `App.jsx`. It sets
  `<html data-reduced-motion="true|false">` so the global selector in
  `main.css` can disable transitions site-wide.
- Animated components also accept `prefersReducedMotion` as a prop (Home
  passes it down). Inside their animation `useEffect` they short-circuit
  the GSAP path.
- Never write a CSS transition that the reduced-motion global cannot defeat.

### GSAP rules
- All animation `useEffect` hooks:
  1. Early-return if `prefersReducedMotion` is true.
  2. Build all tweens inside a `gsap.context(() => { … }, scopeRef)`.
  3. Return `() => ctx.revert()` from the effect.
- `ChapterColumn` is the one exception: its programmatic snap-scroll uses
  a free `gsap.to(container, { scrollTop, … })` tracked in a ref so it
  can be killed before launching the next one. Tween creation does NOT
  go inside `gsap.context()` because the tween targets the scroll
  container directly and we manage its lifecycle manually.
- DOM event listeners (`scroll`, `resize`) live OUTSIDE `gsap.context()`
  because the context only cleans up tweens. Track them separately in
  `useEffect` and remove them in the return.

### ChapterColumn focus crossfade + infinite wrap + idle auto-scroll (v2 polish)

The defining motion of the site. Implementation:

1. Container is a flex column with two 50%-height spacers wrapping a
   `.chapter-column__lists` wrapper. Inside that wrapper are **TWO
   identical `<ul>` copies of the chapter list**, stacked vertically. The
   duplicate enables seamless wrap when scroll position reaches the
   bottom of copy 0 — we instantly subtract one copy-height from
   scrollTop to land at the equivalent position in copy 0 (the visual is
   pixel-identical, so the user never sees the snap).
2. On every scroll event, an rAF-throttled callback:
   a. Runs `wrapScrollIfNeeded()` — if scrollTop has crossed into copy 1's
      half of the wrapper (scrollTop >= 2 * copyHeight) or gone negative,
      it adds/subtracts one copyHeight to bring scrollTop back into the
      canonical [0, copyHeight) range.
   b. Reads each chapter row's `getBoundingClientRect()` (across both
      copies) and computes the absolute distance from the container's
      vertical center.
3. Distance is normalized over `--focus-line-fade-distance` (≈140px) and
   used to lerp the chapter's text color from `--color-ink` (#111111) to
   `--color-ghost` (#C7C7C7) via inline `style.color = 'rgb(r,g,b)'`.
4. Copy 0 is the "canonical" copy for ARIA — its row indices drive
   `activeIndex` and `aria-activedescendant`. Copy 1 is `aria-hidden`.
5. Click → `gsap.to(container, { scrollTop: targetScrollTop, duration:
   0.5, ease: 'power2.inOut' })` followed by `navigate('/chapter/:slug')`.
6. **Auto-scroll on idle.** When the user issues `wheel`, `touchmove`, or
   arrow-key input, we (a) capture the direction sign, (b) kill any
   in-flight auto-scroll tween, and (c) (re-)arm a 500ms idle timer. When
   the timer fires we start a slow linear tween of scrollTop in the
   user's last direction: speed `--chapter-autoscroll-speed` (30 px/sec
   default), one copy-height per "sweep", wrapping scrollTop at sweep
   end and immediately launching the next sweep. The auto-scroll feels
   like a slow, infinite drift in whichever direction the user last
   nudged.
7. **Approach B for user-vs-programmatic discrimination.** We never read
   the plain `scroll` event to cancel auto-scroll — that event fires on
   both user input AND the GSAP-driven scrollTop mutation, so the tween
   would cancel itself the first frame. Instead we listen for `wheel`,
   `touchstart`/`touchmove`/`touchend`, and `keydown` on the container —
   those only fire from real user input. The `scroll` event is still
   wired but its only jobs are the rAF-throttled color repaint and the
   wrap check.
8. Keyboard: ArrowUp/Down → `scrollToIndex(activeIndex ± 1)`; Enter/Space
   activates the focused chapter. Each keyboard navigation also calls
   `handleUserInput(direction)` to record direction + cancel auto-scroll
   + re-arm the idle timer.
9. Reduced motion: auto-scroll is fully disabled (`startAutoScroll`,
   `armIdleTimer`, `handleUserInput` all early-return). The wrap +
   color logic still runs because they are core affordances, not
   decoration. Color paints in a binary flip (`var(--color-ink)` or
   `var(--color-ghost)`) instead of interpolating.

The container's spacers still serve their original purpose: they let the
first and last chapters of copy 0 scroll up to the focus line without
exposing empty rows.

**Auto-scroll tunables (in `tokens.css`):**
- `--chapter-autoscroll-speed` — px/sec drift speed. Read by the JS at
  mount via `getComputedStyle`. Default 30 px/sec.
- `--chapter-autoscroll-idle-ms` — idle threshold before auto-scroll
  engages. Default 500 ms.

**Component file structure (v2 polish):**
- `<div className="chapter-column">` — the scrollable container
  - `<div className="chapter-column__spacer">` — top spacer (50% height)
  - `<div className="chapter-column__lists">` — the wrap containing both copies
    - `<ul className="chapter-column__list">` — copy 0 (canonical, ARIA-visible)
    - `<ul className="chapter-column__list" aria-hidden>` — copy 1 (duplicate for wrap)
  - `<div className="chapter-column__spacer">` — bottom spacer (50% height)

### Hook ordering
```
useState / useRef           // declarations
useCallback                 // stable functions used in useEffect deps
useEffect                   // last
```
`useCallback` must always be declared BEFORE any `useEffect` that lists
it as a dependency. JavaScript `const` is not hoisted — referencing it
from a preceding effect throws ReferenceError at runtime.

### Router
- `createBrowserRouter` in `main.jsx`.
- `/` → Home with first chapter at the focus line.
- `/chapter/:slug` → Home with the matching chapter at the focus line.
  Same component; `useParams().slug` is read in Home and passed as
  `initialChapterSlug` to ChapterColumn.
- Catch-all `{ path: '*', element: <Navigate to="/" replace /> }` at the
  end of the children array. Never omit.

### CSS tokens
- Every color, font size, spacing value, motion duration, and easing
  curve is a CSS custom property in `tokens.css`.
- Zero hardcoded hex / px / ms values outside `tokens.css`. Exception: the
  `ChapterColumn` color lerp inlines `rgb(r,g,b)` because the values are
  computed per scroll frame; the endpoints (#111111 ↔ #C7C7C7) are
  documented in code as the live values of `--color-ink` and `--color-ghost`.
- BEM for class names: `.block`, `.block__element`,
  `.block__element--modifier`. The block prefix matches the component's
  folder name in kebab-case.
- `!important` is not used in component CSS. The only `!important`
  declarations live in a single reduced-motion rule in `main.css`
  (transition-duration, animation-duration, animation-iteration-count,
  scroll-behavior on `[data-reduced-motion="true"] *`). Mandatory to
  defeat per-element transition declarations regardless of specificity.

### Modal pattern (unchanged from v1)
- Two pieces: a top-level mount/unmount controller in the parent
  (`ActionStack`) and the modal component itself.
- The modal accepts: `open`, `onClose`, `triggerRef`, `prefersReducedMotion`.
- The modal manages its own `shouldRender` local state so close
  animations finish before unmount.
- Open uses a GSAP timeline (clip-path + opacity + scale for AboutModal,
  scale + opacity + y for ContactModal). Close uses a separate timeline
  with `onComplete: () => setShouldRender(false)`.
- Focus management: both AboutModal and ContactModal trap focus inside
  the panel via `createFocusTrap`. AboutModal initial focus is the close
  button; ContactModal initial focus is the LinkedIn link. On close the
  release function restores focus to the triggering button.
- Body scroll: locked by `useBodyScrollLock(open)` only on AboutModal.
- Esc handling: every modal uses `useEscapeKey(onClose, open)`.
- Outside-click: ContactModal uses `useClickOutside(panelRef, onClose,
  [triggerRef], open)` so clicking the trigger doesn't immediately
  re-close.

### Data
- All content lives in `src/data/topics.js`. Named export
  `topicGroups` is the array of topic groups (locked v2 schema). Default
  export aliases `topicGroups` for convenience. Named export `owner` holds
  the bio and link placeholders.
- Schema:
  ```js
  { slug, label, title, body, chapters: [{ slug, name, body }] }
  ```
- Never hardcode topic content, bio text, or placeholder URLs in JSX.

## Common Mistakes to Avoid
- Hardcoded hex / px / ms outside `tokens.css` (with the documented
  ChapterColumn color-lerp exception).
- `!important` anywhere outside the reduced-motion global.
- Missing `() => ctx.revert()` cleanup from any animation `useEffect`.
- `useCallback` declared after a `useEffect` that depends on it
  (ReferenceError at runtime).
- Forgetting to kill the in-flight chapter snap-scroll tween before
  starting the next one — multiple `gsap.to(container, scrollTop)`
  calls fight each other and the chapter never lands.
- Forgetting to clean up the rAF id on ChapterColumn unmount — leaks.
- Forgetting to return focus to the trigger on modal close — focus is
  lost into the void.
- Letting the page scroll. The site is a single static viewport; both
  `html` and `body` are `height: 100%; overflow: hidden;` in `main.css`.
  If a new component overflows the viewport, fix it inside that
  component (internal scroll), not at the page level.
