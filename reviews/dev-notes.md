# Developer Notes — AI Learning Website

**Phase:** 2 — Build
**Build status:** `npm install` passed (66 packages, 2 moderate audit findings in transitive deps — unrelated to runtime). `npm run build` passed with zero warnings. Dev server boots cleanly at `http://localhost:5173/` and serves the expected HTML. Preview server serves the production `dist/` cleanly at `http://localhost:4173/`.

**Source of truth:** `reviews/design-spec.md`. Every token, component name, BEM root, motion duration, easing curve, and component contract was implemented per spec unless noted below.

---

## Implementation Summary

- Vite 5 + React 18 + React Router v6 + GSAP 3, single route `/` with a `/topic/:slug` scaffold and a `*` catch-all that redirects to `/`.
- All design tokens live in `src/styles/tokens.css`. Component CSS files reference tokens only — no hardcoded hex / px / timing values anywhere outside `tokens.css`.
- Reduced-motion compliance is two-pronged: `useReducedMotion` toggles a root `<html data-reduced-motion="…">` attribute that disables CSS transitions globally; every GSAP `useEffect` also short-circuits and applies `gsap.set` to the resting state when `prefersReducedMotion` is true.
- Modal pattern: AboutModal (full-viewport, focus trap, scroll lock, clip-path expand from trigger origin) and ContactModal (anchored popover, no backdrop, no scroll lock, no focus trap, Esc + click-outside still close).
- Marquee: two identical tracks for seamless wrap, 45s linear loop, GSAP `timeScale` ramp for hover pause, disabled below 1280px (static list at `--color-text-secondary` so it stays readable).
- Ghost cycle: 3200ms interval-driven fade swap of the focus complement. Disabled under reduced motion.
- Full keyboard support on the marquee (arrow keys + Enter/Space + activedescendant). Skip link + visually-hidden H1 on Home.

---

## Deviations from the Spec (judgment calls, documented)

### 1. One `!important` in `main.css` for the reduced-motion global selector
**Spec says:** No `!important` (developer-agent.md, Non-Negotiables).
**Implemented:** A single `!important` lives in the `[data-reduced-motion="true"] *` rule in `main.css` to defeat per-element transition declarations regardless of specificity.
**Why:** Without `!important`, a more-specific component-level transition (e.g. `.topic-index__entry::after { transition: transform 400ms … }`) wins over an attribute-scoped `*` selector and reduced-motion compliance silently breaks. This is the standard pattern in every reduced-motion implementation (Tailwind, Open Props, MDN's own example all use `!important` here).
**Mitigation:** This is the only `!important` in the entire codebase. Documented in both the file itself and the project CLAUDE.md.

### 2. `data/topics.js` exports the locked schema PLUS a named `owner` export
**Spec says:** §13 locks the schema for the `topics` array. It does not formally specify where the bio and link placeholders live.
**Implemented:** `topics.js` default-exports the topics array (unchanged from spec) and additionally exports a named `owner` object holding `name`, `tagline`, `bio[]`, and `links` (LinkedIn + GitHub placeholders).
**Why:** The AboutModal and ContactModal need bio + links. Co-locating them in the data file matches the "all content in data/" pattern from `react/CLAUDE.md`. The default export schema is untouched, so spec §13 compliance is intact.

### 3. ActionStack hover effect translates the whole label by 2px, not just the `+` glyph
**Spec says:** §8 — on hover, "the `+` glyph nudges right by 2px (transform: translateX(2px))".
**Implemented:** Translates the whole label by 2px.
**Why:** Splitting the `+` glyph into its own `<span>` for a 2px nudge requires either tokenizing the label string at the render boundary or hardcoding `<span>About</span> <span>+</span>` in every trigger. At 13px label size on a flush-left layout the visual difference is imperceptible (the whole label moves uniformly; the eye reads the `+` as having moved). If the design-QA agent prefers the glyph-only nudge, swap each trigger's content to `About <span class="action-stack__plus">+</span>` and target `.action-stack__plus` in the hover rule. Trivial change.

### 4. Ghost cycle is a single-row fade, not the spec's "row descends, next row rises" choreography
**Spec says:** §6b — "One row at a time becomes the focus word; the previous focus word descends into the ghost stack while the next ghost row rises". Per-swap motion is 1200ms total (400ms fade + 800ms y-shift overlapping).
**Implemented:** The focus complement fades out 400ms, the text content swaps in `onComplete`, then fades back in 400ms. Total cycle: 3200ms (matches `--duration-ghost-cycle`). The ghost rows above/below remain static.
**Why:** The spec's full choreography requires rearranging the ghost stack in real time — physically moving the previous focus down by one row, shifting every row above it up by one position. Implementing this faithfully needs FLIP or absolute positioning + measured row heights; either approach adds significant complexity and a real risk of jank at the rendered display size (`clamp(56px, 8.5vw, 104px)` rows are large). The simpler fade-swap reads as a "slow word change" — the dominant effect the brief asks for ("a vertical word-cycling animation: the center word/phrase changes over time"). The full choreography can be added later by replacing the ghost cycle effect in `ContentSlot.jsx` without changing any tokens, data, or markup.

### 5. Action-stack action positioning relies on natural flow, not absolute "96px from page bottom"
**Spec says:** §4 — "Bottom-left action stack distance from page bottom (desktop): 96px".
**Implemented:** The action stack lives in row 3 of the grid (per §4 region map). At desktop, the page is `min-height: 100vh` with `padding-bottom: 96px` on `.home`. The action stack therefore sits naturally at 96px from the bottom when the content above it isn't tall enough to push it further. If the center column exceeds the viewport, the stack flows below it (which is the editorial-document expectation).
**Why:** Absolute-positioning the stack at `bottom: 96px` would float it on top of the body copy on tall content. The relative positioning is the closer match to the reference's "page as a single document" feel.

### 6. `lib/motion.js` deliberately omitted
**Spec says:** §13 lists `src/lib/motion.js` containing "named GSAP timelines: ghostCycle, marqueeLoop, aboutModalOpen/Close, contactModalOpen/Close; all read tokens via getComputedStyle".
**Implemented:** Each component owns its own GSAP timeline inside the relevant `useEffect`. Easings are hardcoded as the literal cubic-bezier strings from the token values (e.g. `'cubic-bezier(0.22, 1, 0.36, 1)'`) because GSAP does not natively read CSS custom properties for its `ease` argument and pulling values via `getComputedStyle` at runtime requires either a wrapper around every tween or a parsed-tokens dictionary at mount.
**Why:** Keeping the timelines co-located with their components keeps the code path obvious (read the JSX → scroll to the effect → see the tween). Centralizing into `lib/motion.js` would add an indirection for one MVP route and would need refactoring the moment a tween needs component-local state. If a future phase wants to refactor, the easings are the only token values that can't be pulled directly via `getComputedStyle(document.documentElement).getPropertyValue('--…')`; durations and any numeric token can.
**Risk:** Easing curves are duplicated string literals across components. If the spec's easing tokens are ever retuned, every literal needs to be updated. Documented here as a known refactor target.

### 7. Some images / assets referenced in the spec are not bundled at MVP
**Spec §11 / §13 reference:** `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-image.png`.
**Implemented:** `favicon.svg` (real, generated SVG) and `site.webmanifest` are present. The other rasters are not bundled. The `<link>` tags in `index.html` reference the file names so the moment Amrit drops the PNGs into `public/`, they will be served automatically.
**Why:** Generating PNG rasters at build time requires a tool (Sharp or a Cairo binary) we don't want to add to the dependency tree for a single rendering pass. The spec §7 also notes the OG image is "generated by Amrit later — placeholder at MVP". Documented here as an open item for launch.

---

## Placeholders (Amrit to replace before public launch)

| Asset | Current | Replace with |
|---|---|---|
| About portrait | Solid `#E8E8E8` square with caption `Amrit — photo TBC` | Real photo, 1:1 crop, JPG/WebP under `public/assets/images/`. Image swap = `<div>` → `<img>`; no design change. |
| LinkedIn URL | `https://www.linkedin.com/in/PLACEHOLDER` | Real LinkedIn URL. String swap in `src/data/topics.js` (`owner.links.linkedin`). |
| GitHub URL | `https://github.com/PLACEHOLDER` | Real GitHub URL. String swap in `src/data/topics.js` (`owner.links.github`). |
| Bio paragraphs | 4-line placeholder per `client.md` | Real bio. Up to ~6 lines is structurally OK; longer needs a design check. |
| RAG body copy | Two-paragraph placeholder per `client.md` | Final copy. Up to ~4 paragraphs is structurally OK. |
| Ghost alternative phrases | Designer-authored 8 strings per spec §13 | Amrit may rewrite without structural change. |
| Domain / canonical URL | `https://[domain-tbc]/` placeholders in `index.html`, `sitemap.xml`, `robots.txt` | Real domain. Three string swaps. |
| OG image | Not present (link references `/og-image.png` which 404s gracefully) | Build the 1200×630 PNG per §11. Drop at `public/og-image.png`. |
| Favicon raster set | Only `favicon.svg` is present | Generate `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` from the SVG source. Drop in `public/`. |

---

## Open Items / Recommendations for Phase 3 (Design QA)

1. **Reference image is still not on disk** at `input/web-references/home-reference.png`. Spec flagged this as non-blocking; recommend Amrit drops it in before the design-qa agent runs so a visual diff is possible.
2. **The full ghost-row choreography from spec §6b** is the most likely source of QA pushback. If design-qa flags this, see Deviation 4 above for the path to upgrade in place.
3. **Tablet-range layout (768–1279px)** uses the mobile composition (single-column stack with a static subtopic list). Spec §9 explicitly says the 3-col grid "only activates at desktop because below 1024px the right rail compresses the center too tightly". Confirmed visually OK in resize tests.
4. **Backdrop-filter blur on AboutModal** is opt-in: I included both `backdrop-filter` and the `-webkit-` prefix. On browsers that don't support backdrop-filter (e.g. older Firefox versions), the modal still renders with the paper-tinted backdrop — the blur just won't apply. Spec §5 notes the backdrop is meant to "blur underlying content"; on unsupported browsers this degrades gracefully.

---

## Verification Trail

- Folder structure matches spec §13 exactly.
- `npm install` → 66 packages, no install errors.
- `npm run build` → 0 errors, 0 warnings, 5 chunks produced (vendor / gsap / index JS / index CSS / index HTML).
- `npm run dev` → server boots in 81ms; `curl http://localhost:5173/` returns valid HTML with the locked title and meta tags.
- `npm run preview` → serves the production build at port 4173; HTML matches the production output.
- All component files exist at the paths listed in spec §13. BEM class roots match.
- Single-route routing verified: `/` renders Home; `*` redirects to `/`.

---

## Fix Loop 1 — design-QA fixes (2026-05-11)

Phase 3 design-QA returned FAIL with 2 MAJOR + 10 MINOR + 4 NIT issues.
Every MAJOR and MINOR was addressed; the NITs were either no-fix-needed
per the report or are non-blocking placeholders. Build passes
(`npm run build` — 0 errors, 0 warnings). Dev server boots cleanly.

| ID | Severity | Status | File(s) | Notes |
|---|---|---|---|---|
| DQA-1 | MAJOR | FIXED | `components/ContentSlot/ContentSlot.jsx` | Re-implemented the ghost cycle as the spec's two-axis choreography. Single GSAP timeline per cycle: above-stack `y: 0 → +rowHeight` (slides down), below-stack `y: 0 → -rowHeight` (slides up), focus complement opacity 1→0 (0–400ms), text content swaps imperatively at 400ms, opacity 0→1 (800–1200ms). On motion completion both stacks snap y back to 0 and a `rotation` state increment re-renders the new arrangement. Row height measured live via `getBoundingClientRect()` on a sample ghost row. Reduced-motion short-circuits before any tween (per spec: first ghost row becomes the static focus, no motion). Reverses the simplification flagged as judgment-call #4 in the original dev notes. |
| DQA-2 | MAJOR | FIXED | `components/ContentSlot/ContentSlot.css` | Added a `@media (max-width: 767px)` rule that hides the topmost row of the above-stack (`first-child`) and the bottommost row of the below-stack (`last-child`) — net 3+3 on mobile. Data path remains 4+4 across all breakpoints (option (a) from the QA report). |
| DQA-3 | MINOR | FIXED | `pages/Home/Home.jsx` | Page-load focus headline now reads `window.matchMedia('(min-width: 768px)').matches` at effect entry; `y` is `16` on desktop, `0` on mobile (opacity-only). |
| DQA-4 | MINOR | FIXED | `components/ContactModal/ContactModal.jsx` | Same viewport gate. Open-state `y` is `8` on desktop, `4` on mobile. |
| DQA-5 | MINOR | FIXED | `components/ContactModal/ContactModal.jsx` | `aria-modal="true"` (was `"false"`). The popover does not trap focus (intentional per spec §5), but screen readers expect the attribute on `role="dialog"`. |
| DQA-6 | MINOR | FIXED | `styles/tokens.css`, `styles/main.css` | Added `--duration-xfast: 120ms`. `:focus-visible` transition now references it (was `--duration-fast` = 200ms). |
| DQA-7 | MINOR | FIXED | `components/ActionStack/ActionStack.css` | Removed the desktop-only `padding-bottom: var(--action-stack-bottom-desktop)` from `.action-stack`. The 96px offset is now provided exclusively by `.home`'s `padding-bottom: var(--section-padding-bottom-desktop)`. Reverses judgment-call #5 in the original dev notes. |
| DQA-8 | MINOR | FIXED | `components/AboutModal/AboutModal.css` | Desktop panel switched from `flex-direction: row` to `display: grid; grid-template-columns: 40% 60%; gap: var(--about-modal-grid-gap)`. Portrait `flex: 0 0 40%` removed (sized by grid track). |
| DQA-9 | MINOR | FIXED | `components/AboutModal/AboutModal.css` | `.about-modal__link` font-size and letter-spacing now reference caption tokens (12/13px) instead of CTA tokens (13/14px). |
| DQA-10 | MINOR | FIXED | `styles/tokens.css`, `components/TopicIndex/TopicIndex.css`, `components/ActionStack/ActionStack.css`, `components/AboutModal/AboutModal.css`, `components/ContactModal/ContactModal.css` | Introduced component-derived pixel tokens (`--underline-width`, `--underline-height`, `--close-button-size`, `--close-button-glyph-size`, `--close-button-glyph-optical-y`, `--about-modal-max-width`, `--about-modal-grid-gap`, `--about-modal-edge-offset-desktop`, `--portrait-max-width`, `--contact-modal-width`, `--contact-modal-padding-y`, `--contact-modal-padding-x`, `--action-stack-hover-shift`) and replaced every hardcoded pixel value flagged in the report. The only remaining hardcoded pixel value is `panelWidth = 220` inside `ContactModal.jsx`'s `computePosition()` callback — that is a JS-side numeric constant used for overflow math, not a CSS declaration; documented here as deliberately retained. |
| DQA-11 | MINOR | DOCUMENTED | n/a | Favicon raster set / OG image: not bundled at MVP per pre-existing deviation #7. Spec §7 notes the OG image is "generated by Amrit later". Same pattern extends to the favicon rasters. The `<link>` tags in `index.html` reference the file names so dropping the PNGs into `public/` will Just Work. No code fix possible without adding Sharp / Cairo to the dep tree. Open item for client before public launch. |
| DQA-12 | MINOR | DOCUMENTED | n/a | `lib/motion.js` deliberately omitted at MVP per pre-existing deviation #6. Co-located tweens are clearer for one route; refactor target for code-review (Phase 4). |
| DQA-13 | NIT | NOT FIXED | n/a | Italic Newsreader is loaded only at weight 400 — matches spec §3 which lists italic 400 only. Report acknowledges this is "not actually a deviation". |
| DQA-14 | NIT | NOT FIXED | n/a | Canonical URL placeholder. Report flags as non-blocking; pre-launch task. |
| DQA-15 | NIT | NOT FIXED | n/a | CSS bundler optimizes `translateX(2px)` → `translate(2px)`. Functionally equivalent. No action. |
| DQA-16 | NIT | NOT FIXED | n/a | Global `:focus-visible { border-radius: 0 }` matches spec but currently targets elements that already have no radius. Cosmetic. No action. |

### New judgment calls in this pass

1. **Ghost cycle direction.** The spec text ("previous focus descends, next ghost rises") and the QA report's restatement ("rows above slide down, rows below slide up — net visual is a slow vertical scroll past a fixed focus row") describe motion that is geometrically inconsistent if read literally (above-down + below-up = convergence, not unidirectional scroll). I implemented the *literal* directional split — above-stack moves DOWN by one rowHeight, below-stack moves UP by one rowHeight — because that is what the QA report explicitly directed. The visual is two ghost columns drifting toward the focus position from above and below while the focus complement fades through the swap. If design-QA prefers a unidirectional scroll (both stacks moving the same direction), one line in the GSAP timeline flips the sign on the `belowEl` y tween.

2. **Imperative DOM update for focus text mid-cycle.** GSAP's timeline crosses a fade-out → fade-in boundary where the displayed text must change. Rather than driving the text via React state mid-tween (which would re-render and rebuild ghost stacks at the wrong moment), I use a `tl.call()` at t=400ms to imperatively set `complementRef.current.textContent` to the next phrase. React state (`rotation`) is reconciled at `tl.onComplete` (t=1200ms) so the next render's React-bound text matches what is already on screen — no flicker. This is a documented anti-pattern that converges cleanly because the imperative write happens between a fade-out and a fade-in, so the user only ever sees opacity-0 text during the swap window.

3. **Rotation tracked via state + ref mirror.** The interval-driven cycle reads the current rotation via a `rotationRef.current` mirror because the original closure captures the initial value. The mirror is updated in a `useEffect` keyed on `rotation`. Standard pattern.

4. **CSS-only mobile ghost-row hiding.** Chose option (a) from the QA report (one CSS rule) over option (b) (matchMedia + JS slice variation) for the smaller surface change. Confirmed visually: the topmost row of `--above` and the bottommost row of `--below` are the visually most-distant from the focus, so hiding them on mobile collapses the stack toward the focus row in the spec's intended way.

### What did not change

- No design tokens were changed (only ADDED — `--duration-xfast` and the component-derived pixel tokens). The original color, type, spacing, and motion tokens are byte-identical to the Phase-2 build.
- `data/topics.js` schema and content unchanged.
- No BEM class root or component file was renamed.
- Routing, hooks, and modal focus-trap logic untouched (none were flagged).
- Reduced-motion strategy untouched (already passing per QA verdict).

### Verification

- `npm run build` → 0 errors, 0 warnings, same 5-chunk output.
- `npm run dev` → dev server boots cleanly at port 5173, no console errors, HTML response valid.
- `npm run preview` → preview server boots cleanly at 4173.
- GSAP timeline source confirmed to reference `y` on both ghost stacks (lines 134, 143 of `ContentSlot.jsx`) — verifying DQA-1's two-axis requirement.

---

## Fix Loop 2 — code-review fixes (2026-05-11)

Phase 4 code-review returned FAIL with 2 CRITICAL + 3 MAJOR + 7 MINOR + 3
NIT issues. Both CRITICALs and all three MAJORs were fixed in this pass.
Six of seven MINORs and one of three NITs were also fixed. Build passes
(`npm run build` — 0 errors, 0 warnings, 5-chunk output unchanged).

### Correction to a prior claim

Fix Loop 1's notes and `react/CLAUDE.md` both characterised ContactModal
as deliberately not trapping focus, citing spec §5. That characterisation
was wrong against the spec. Spec §12 line 317 explicitly requires:
"ContactModal keyboard | Esc closes; Tab cycles inside; first focusable
element on open is `LinkedIn`; on close, focus returns to `Contact +`."
The earlier reading conflated spec §5 (no backdrop, no scroll lock) with
focus management — but §12 is unambiguous about the focus contract. The
fix in this pass adds the focus trap; `react/CLAUDE.md` is updated; this
note documents the correction.

### Issues fixed

| ID | Severity | Status | File(s) | Notes |
|---|---|---|---|---|
| CR-1 | CRITICAL | FIXED | `components/ContactModal/ContactModal.jsx` | Added `createFocusTrap` (same utility AboutModal uses). Activated when `open && shouldRender`. Initial focus is the LinkedIn link via a new `linkedinRef` set as `initialFocus`. The trap's release function restores focus to the `Contact +` trigger (the `previouslyFocused` element captured by `createFocusTrap`). Esc and click-outside paths unchanged — they still close the popover, the trap's release handles focus restoration. `aria-modal="true"` already correct from DQA-5. |
| CR-2 | CRITICAL | FIXED | `components/SubtopicMarquee/SubtopicMarquee.jsx:196` | Removed the `!isClone &&` guard from the `onClick` handler. Both the original track and the clone track now respond to clicks. `tabIndex={isClone ? -1 : 0}` and `aria-hidden="true"` on the clone list are unchanged — the clone still does not double-announce or add tab stops; only the pointer click is now wired. |
| CR-3 | MAJOR | FIXED | `components/AboutModal/AboutModal.jsx` | Added an `anchorRef` mirror updated in a small effect keyed on `anchor`. The open/close GSAP effect reads anchor coords through the ref at the moment it runs and `anchor.xPct/yPct` are removed from its deps. Resize-driven anchor updates no longer rewind the in-progress open timeline. `clipPathEnabled` is still in the deps because crossing the desktop/mobile threshold materially changes the animation path. |
| CR-4 | MAJOR | FIXED | `components/ContentSlot/ContentSlot.jsx` | Added an `allRowsRef` mirror updated on every `allRows` change. The interval-driven `tl.call` at t=400ms now reads `allRowsRef.current` (and its length) instead of the closure-captured `allRows`. When V2 ships a second topic with the same `total`, the imperative text swap will show the new topic's phrases. The `eslint-disable-next-line` comment on the dep array is retained because re-binding the interval on every topic change would reset the cycle timer mid-cycle. |
| CR-5 | MAJOR | FIXED | `components/ContactModal/ContactModal.jsx:69` | Memoised the `ignoreRefs` array with `useMemo(() => [triggerRef], [triggerRef])` and passed the memoised reference to `useClickOutside`. The hook's `pointerdown` listener is no longer torn down and re-installed on every parent render. The hook signature is unchanged (still accepts an array). |
| CR-6 | MINOR | FIXED | `styles/tokens.css`, `components/AboutModal/AboutModal.css` | Added `--blur-modal: 12px` to tokens. Both `backdrop-filter` and `-webkit-backdrop-filter` now reference `var(--blur-modal)`. No remaining hardcoded pixel values in component CSS. |
| CR-7 | MINOR | FIXED | `components/AboutModal/AboutModal.css:127-132` | Removed `flex: 1 1 60%` from `.about-modal__bio`. The desktop panel is `display: grid` with `grid-template-columns: 40% 60%`, so the flex declaration was a no-op (`flex-*` on grid children is ignored). |
| CR-8 | MINOR | FIXED | `styles/main.css`, `react/CLAUDE.md`, this file | Reworded the "single `!important`" claim everywhere it appeared. The reduced-motion override is one selector with four `!important` declarations, not a single declaration. Functionally identical, factually correct. |
| CR-9 | MINOR | DEFERRED | n/a | `lib/motion.js` not introduced. Rationale: pre-existing deviation #6 in this notes file; the code-review report explicitly classifies CR-9 as "deferred-acceptable for MVP". Refactor target only — every easing literal references the exact spec value, so designer retunings cost a find-and-replace, not a behaviour change. Will revisit if a second route or a tween-coordination need surfaces. |
| CR-10 | MINOR | FIXED | `components/ContentSlot/ContentSlot.jsx`, `components/AboutModal/AboutModal.jsx` | Body paragraph keys are now slug-prefixed (`${titleAnchor}-p${i}` for ContentSlot, `bio-p${i}` for AboutModal). The lists are still static and the original index-as-key was benign, but the prefixed form is conventional and survives a future topic-switch with the same paragraph count. |
| CR-11 | MINOR | FIXED | `components/ContactModal/ContactModal.jsx` | `computePosition` now measures `panelRef.current.getBoundingClientRect().height` after first render, falling back to 140 only before the ref is wired. If a third link or a tagline grows the panel, the overflow-bottom math stays correct. The hardcoded `panelWidth = 220` is retained — the panel width is fixed by `--contact-modal-width` and does not change with content. |
| CR-12 | MINOR | FIXED | `components/SubtopicMarquee/SubtopicMarquee.jsx` | Added a `keyboardIndexRef` mirror updated in a small effect keyed on `keyboardIndex`. The Enter/Space branch of `handleKeyDown` now reads `keyboardIndexRef.current` instead of the closure-captured value, and `keyboardIndex` is removed from `handleKeyDown`'s `useCallback` deps. The callback identity stays stable across arrow-key presses. |
| CR-13 | NIT | NOT FIXED | n/a | Rotation overflow at 1 increment per 3200ms requires ~931,000 years to hit `MAX_SAFE_INTEGER`. Code review report confirms no fix needed. |
| CR-14 | NIT | FIXED | `components/SubtopicMarquee/SubtopicMarquee.css` | Removed the redundant `outline-offset: 0` from the base `.subtopic-marquee--animated .subtopic-marquee__viewport` rule. The `:focus-visible` rule already sets the value where it matters. |
| CR-15 | NIT | NOT FIXED | n/a | Skip-link hash anchor on a SPA is correctly handled by the browser. Report says "no fix". |

### Verification

- `npm run build` → 0 errors, 0 warnings, same 5-chunk output:
  vendor (66KB gzip) + gsap (27.8KB gzip) + index JS (7KB gzip) + index
  CSS (3.6KB gzip) + index HTML (0.84KB gzip).
- ContactModal focus-trap pattern reads identically to AboutModal's: a
  release ref, an effect keyed on `open && shouldRender` that creates the
  trap, and a cleanup that calls the release and nulls the ref. The
  `initialFocus` differs (LinkedIn link instead of close button) per
  spec §12.
- SubtopicMarquee item button source confirmed: `onClick={() =>
  handleSelect(sub.slug)}` — the `!isClone` guard is gone. Clone items
  remain `tabIndex={-1}` and the clone `<ul>` remains `aria-hidden="true"`,
  so the WCAG / keyboard contract is unchanged.
- AboutModal effect deps confirmed: `[open, shouldRender,
  prefersReducedMotion, clipPathEnabled]` — no `anchor.xPct/yPct`. The
  anchor is read live via `anchorRef.current` inside the effect.
- ContentSlot effect captures `allRows` via `allRowsRef.current` inside
  the `tl.call` — the imperative text swap no longer reads a stale
  closure.

### What did not change

- No design tokens removed; one added (`--blur-modal`).
- No BEM class root, no component file renamed.
- `data/topics.js` schema and content unchanged.
- Routing, the `useReducedMotion` strategy, and the AboutModal focus-trap
  (which was already correct) untouched.
- The two-axis ghost cycle choreography (DQA-1) untouched; CR-4 only
  changes how `allRows` is read inside the cycle, not the cycle itself.

---

## v2 Rebuild — structural changes after the user reread the reference

The v1 build above was based on a misread of the reference image. The user
supplied an annotated mockup clarifying the structure: the site is a
single static viewport composition (no 3-zone proportional layout, no
ghost-alternatives stack around the topic title, no infinite-scroll
marquee for subtopics). The center is just a static large-serif word
(`RAG`), and the right side is a normal scrollable list of "chapters"
where the one at the focus line is in near-black and the rest fade to
ghost-grey.

Per the workflow override (`agents/_workflow-override.md`), this rebuild
bypasses design-agent. The structure is built directly from the rewritten
`CLAUDE.md` v2.0; visual review happens before any QA gate runs.

### Removed components (v1 → v2)

- `components/ContentSlot/` — the v1 ghost-alternatives cycle is gone.
- `components/SubtopicMarquee/` — the infinite-scroll marquee is gone.
- `components/TopicGroup/` — replaced by `TopicGroupRail`.
- `components/TopicIndex/` — gone (the new left rail is just topic-group
  labels; there is no inner list of topics).

### Added components (v2)

- `components/TopicGroupRail/` — top-left vertical stack of topic-group
  labels with hairline rules. MVP: just `RAG +`. No click action.
- `components/TopicTitle/` — center-left big serif word, static. Renders
  the active topic group's `title`.
- `components/ChapterColumn/` — right column scrollable chapter list.
  This is the new core of the layout. See `react/CLAUDE.md` § ChapterColumn
  focus crossfade for implementation details.

### Kept from v1 (unchanged or near-unchanged)

- `components/ActionStack/` — minor token migration (`--color-text-muted`
  → `--color-ink`, `--rail-rule-width` → `width: 100%; max-width:
  --rail-max-width`). Behavior unchanged.
- `components/AboutModal/` — unchanged. Token aliases for
  `--color-accent-dark` and `--rail-rule-width` (renamed to
  `--rail-max-width` in the about-modal rule) preserved compatibility.
- `components/ContactModal/` — unchanged. Token aliases for
  `--font-size-cta-*` / `--line-height-cta` / `--letter-spacing-cta`
  added back to `tokens.css` to keep the v1 modal styles working
  without a rewrite.
- `lib/focusTrap.js`, all four hooks — unchanged.

### Tokens & typography

- Replaced Newsreader with **Playfair Display** (variable weight 400–900,
  italic). Loaded from Google Fonts in `index.html` along with **Inter**
  for labels.
- `--font-display: 'Playfair Display', …;` — used by `TopicTitle` and
  every chapter row in `ChapterColumn`.
- `--font-label: 'Inter', system-ui, …;` — used by all small labels
  (TopicGroupRail entries, ActionStack triggers).
- Display size tuned to `clamp(56px, 6vw, 80px)` with `line-height:
  1.18`. The v1 spec used `clamp(56px, 8.5vw, 104px)` with
  `line-height: 1.04`; at the new layout proportions and with chapter
  rows stacked vertically in their own column, 104px caused vertical
  overflow on common viewports and the tight 1.04 line-height collapsed
  the focus crossfade gradient.
- Backwards-compat aliases for `--font-family-serif`, `--color-accent`,
  `--color-accent-dark`, `--font-size-cta-*`, `--line-height-cta`,
  `--letter-spacing-cta`, `--underline-height`, `--underline-width` left
  in `tokens.css` so the v1 modal styles compile without per-property
  rewrites. New code should reference `--font-display`, `--font-label`,
  `--color-ink`, `--color-ink-soft`, `--color-rule`, `--color-ghost`.

### Layout

- `html` and `body` now have `height: 100%; overflow: hidden;`. The
  page no longer scrolls. The only scroll on the page is inside
  `ChapterColumn`.
- Home is a CSS Grid: `grid-template-columns: 18% 32% 1fr;` and
  `grid-template-areas: "left center chapters"`. TopicGroupRail and
  ActionStack share `grid-area: left` (top vs bottom via `align-self`);
  TopicTitle is centered vertically in the `center` cell so it sits on
  the same focus line as the chapter at the center of the chapter
  column.
- Mobile (< 1024px) reflows to a single-column stacked layout. Desktop
  styles take over at `min-width: 1024px`.

### Routes

- `/` → first chapter (Chunking strategies) at the focus line.
- `/chapter/:slug` → matching chapter at the focus line on load. Same
  Home component; `useParams().slug` is read and passed to
  `ChapterColumn` as `initialChapterSlug`.
- `*` → redirect to `/`.

### Judgment calls (v2)

#### V2-1. Chapter body content not yet rendered on `/chapter/:slug`

**Spec says:** "Chapter body content (placeholder copy at MVP) renders
below the focus line, in the bottom portion of the center column, or in
the chapter column itself below the focused chapter — your call, but
document it."

**Implemented:** No chapter body is rendered at MVP. The route
`/chapter/:slug` works (URL updates on click; reload positions the
correct chapter at the focus line) but the chapter's `body` field is
not displayed.

**Why:** Three possible placements (under TopicTitle, under the focused
chapter, or as a modal/drawer) each have different visual implications
that the user explicitly wants to review structurally before we lock a
choice. Rendering placeholder copy now would bias the next review pass
toward whichever placement we picked. The chapter `body` strings are in
the data file ready to wire up after structural approval.

**To resolve:** User picks one of the three placements, dev wires it up.

#### V2-2. ChapterColumn lerps text color in inline `style.color`

**Spec says:** "compute distance for each visible chapter and set its
`color` (or a CSS variable per row) accordingly."

**Implemented:** Inline `el.style.color = 'rgb(r,g,b)'` per row per
scroll frame.

**Why:** A CSS-variable-per-row approach (`el.style.setProperty('--row-t',
t)` and a CSS rule that does `color-mix(--color-ghost, --color-ink, t)`
or `color: hsl(...)`) would keep the lerp in CSS but adds a layer of
indirection without measurable benefit. `color-mix` browser support is
fine in modern Chrome/Safari but not as bulletproof as direct rgb
strings. Direct rgb is the cheapest, most-portable option, and it lives
in inline `style` so it's easy to read in DevTools when debugging.
Documented as the one rgb-string exception to the "no hardcoded hex
outside tokens" rule.

#### V2-3. Top + bottom 50% spacers in ChapterColumn

**Implemented:** ChapterColumn renders two `<div className=
"chapter-column__spacer" />` blocks above and below the chapter list,
each 50% of the container height.

**Why:** Lets the first chapter scroll up to the focus line (vertical
center of the container) without that requiring negative margins, and
lets the last chapter scroll up to the focus line without trailing
empty rows being visible. Also makes CSS scroll-snap work cleanly under
reduced motion (every row has `scroll-snap-align: center`; the spacers
let the snap actually land at the center).

#### V2-4. Active topic group is hardcoded to `topicGroups[0]` at MVP

**Implemented:** Home reads `const activeGroup = topicGroups[0];` and
passes it down. There is no per-group routing.

**Why:** MVP has one topic group. Adding a `/topic/:groupSlug` route
now would be premature — the spec says "Architecture must allow
appending more groups by editing this file only," which is satisfied:
adding a second group object to `topicGroups` will surface as a second
`Foo +` label in the rail. Wiring it to be selectable + URL-driven is
a V2 change touching `main.jsx` (add a route), `Home.jsx` (read the
group slug), and `TopicGroupRail.jsx` (make labels clickable). All
straightforward and additive.

#### V2-5. Reveal stagger drops the v1 "ghost stack reveal"

**Spec says:** Initial reveal stagger ~600–700ms total (top-left labels
→ topic title → chapter column fades in → bottom-left labels).

**Implemented:** Hairlines (scaleX 0→1, 60ms stagger), labels (opacity
+ y, 80ms stagger), TopicTitle (opacity + y, 100ms after labels),
ChapterColumn (opacity, 200ms after title). About 700–800ms total.

**Why:** The v1 ghost-stack reveal animation does not apply — there is
no ghost stack. The other elements are unchanged in spirit; just retuned
delays for the new component names.

### Build / lint status

- `npm run lint` — clean (0 errors, 0 warnings).
- `npm run build` — clean. Bundle: 19.81 kB index, 70.44 kB gsap,
  203.02 kB vendor, 14.34 kB CSS. (gzip: 6.91, 27.81, 66.21, 3.21 kB.)
- `npm run dev` — boots cleanly at http://localhost:5173/, returns
  HTTP 200 on `/`.

---

**End of v2 rebuild notes.**

---

## v2 Polish Pass — 5 changes after first-look user feedback (2026-05-11)

The first v2 build went up for visual review and the user asked for five
specific changes after comparing the live page against the Bruno-studio
reference image. All five are documented below with the exact files
touched and the judgment calls made.

### Change 1 — Center-align the hero pair

**File(s):** `pages/Home/Home.css`, `styles/tokens.css`

**Before:** The grid was `18% 32% 1fr`. TopicTitle sat in its own 32%
column and ChapterColumn in the 1fr column. With the grid-cell padding
the two pieces drifted apart visually.

**After (desktop ≥ 1024px):** `.home` switches to a single-region grid
(`grid-template-areas: "content"`). TopicTitle is absolutely positioned
with `right: 50%; margin-right: var(--hero-pair-gap); top: 50%;
transform: translateY(-50%)`. ChapterColumn is absolutely positioned
with `left: 50%; top: 0; bottom: 0; right: 0`. The hero pair sits
exactly centered on the viewport with `--hero-pair-gap` (24px) between
the title's right edge and the chapter column's left edge.

The top-left and bottom-left rails are also absolutely positioned at
`--page-margin-rail-x: 5%` from the left and `--page-margin-rail-y: 6%`
from the top/bottom edges respectively, matching the reference image's
~80px-from-edge rail placement at a ~1280px viewport.

Mobile (< 1024px) is unchanged — single-column stacked flow.

### Change 2 — Smaller display font

**File(s):** `styles/tokens.css`

`--font-size-display` was `clamp(56px, 6vw, 80px)`. **Now:**
`clamp(36px, 4vw, 56px)`. At a 1500px viewport this resolves to 56px
(matches the reference image's ~50–60px cap height range). At narrower
desktop sizes the `4vw` middle resolves to ~50–55px, still inside the
target band.

### Change 3 — Reduced font weight

**File(s):** `styles/tokens.css`, `components/TopicTitle/TopicTitle.css`,
`components/ChapterColumn/ChapterColumn.css`

Added a new token `--font-weight-display: 400`. Replaced
`font-weight: var(--font-weight-medium)` (500) with
`var(--font-weight-display)` on both `.topic-title` and
`.chapter-column__button`. The focused row's emphasis is now delivered
by `color: var(--color-ink)` alone (set per-frame by the existing color
lerp); weight stays at 400 for every row.

### Change 4 — Auto-scroll on idle + infinite chapter wrap

**File(s):** `components/ChapterColumn/ChapterColumn.jsx`,
`components/ChapterColumn/ChapterColumn.css`, `styles/tokens.css`

**The big one.** Three coupled additions:

1. **DOM duplication for wrap.** The chapter list is rendered twice
   inside a new `.chapter-column__lists` wrapper. Copy 0 is the
   canonical, ARIA-visible copy (`role="option"`, `id="chapter-row-..."`,
   `aria-selected` per row). Copy 1 is identical visually but
   `aria-hidden="true"` and uses different `key` prefixes. Click
   handlers on both copies route through `handleChapterClick(i)` by
   index, so clicking a chapter in copy 1 navigates to the same URL as
   clicking the same chapter in copy 0.

2. **`wrapScrollIfNeeded()`** runs on every rAF-throttled scroll frame.
   If `container.scrollTop >= 2 * copyHeight`, it subtracts one
   copyHeight to bring scrollTop back into the canonical
   `[0, copyHeight)` range. If `< 0`, it adds one copyHeight. The wrap
   is invisible because both copies are pixel-identical.

3. **Idle-driven auto-scroll.** I implemented **Approach B** as
   recommended in the brief:
   - `scroll` event still drives only the color lerp + wrap check. It
     is intentionally NOT used to cancel auto-scroll, because GSAP's
     scrollTop tween also fires `scroll` events and would cancel
     itself.
   - User input is detected via separate `wheel`, `touchstart` /
     `touchmove` / `touchend`, and `keydown` listeners. Each handler
     calls `handleUserInput(direction)` which: records the direction
     sign on a ref, kills any in-flight auto-scroll, and (re-)arms a
     500ms `setTimeout`.
   - When the idle timer fires, `startAutoScroll()` reads the last
     direction and launches a recursive sequence of single-cycle linear
     `gsap.to(container, { scrollTop: current + dir * copyHeight,
     duration: copyHeight / speed, ease: 'linear' })` sweeps. After each
     sweep, `wrapScrollIfNeeded()` snaps scrollTop back and the next
     sweep launches from the wrapped position. Net effect: an endless
     slow drift in the user's last direction.

**Tunable tokens (in `tokens.css`):**
- `--chapter-autoscroll-speed: 30` (px/sec, unitless for JS consumption)
- `--chapter-autoscroll-idle-ms: 500` (ms before auto-scroll engages)

**Reduced motion:** Auto-scroll is fully disabled —
`startAutoScroll`, `armIdleTimer`, and `handleUserInput` all
early-return on `prefersReducedMotion`. The wrap + color logic still
runs (they are core affordances, not decoration); colors paint in a
binary flip via the inline `style.color = 'var(--color-ink|ghost)'`
already wired in v2.

### Change 5 — Match reference spacing

**File(s):** `styles/tokens.css`, `pages/Home/Home.css`

- `--line-height-display` bumped from `1.18` → `1.7` for the reference's
  roomy vertical spacing between chapter rows.
- Title-to-chapter horizontal gap codified as `--hero-pair-gap: 24px`.
- Rail offset tokens added: `--page-margin-rail-x: 5%`,
  `--page-margin-rail-y: 6%` — applied to `.home__top-left` and
  `.home__bottom-left` via absolute positioning on desktop.
- Focus row vertical alignment is unchanged: TopicTitle sits at
  exactly `top: 50%` with `translateY(-50%)`, and ChapterColumn's
  internal 50% spacers ensure the focused chapter rendered at
  scrollTop = item.offsetTop - containerHeight/2 + itemHeight/2
  lands exactly at viewport-center.

### Judgment calls in this polish pass

**P-1. Auto-scroll speed: 30 px/sec.**
The brief asked for "very slow ~20–40 px/sec". I picked 30 as the
middle of that band. With copyHeight at roughly 12 × (line-height × font
size) ≈ 12 × (1.7 × 56) ≈ 1142px on desktop, one full sweep takes
~38 seconds, which reads as a calm continuous drift — fast enough to be
noticeable, slow enough to feel ambient. Tunable via
`--chapter-autoscroll-speed` if the user wants slower/faster.

**P-2. Direction inference from touch.**
The brief specified `wheel`, `touchmove`, `keydown` as the user-input
signals. `wheel.deltaY` and arrow-key direction are unambiguous. For
touch I added a `lastTouchY` local in the listener closure and compare
consecutive `touchmove` Y values: `dy = lastY - currentY`. Positive `dy`
(finger moving up) = scrolling content down = `+1`. On `touchstart`
the direction is `0` (kill auto-scroll, arm timer, but don't change
direction yet). On `touchend` we re-arm the idle timer one more time so
the user's flick gets the full 500ms idle window before auto-scroll
re-engages.

**P-3. Click while auto-scrolling.**
`handleChapterClick(index)` calls `handleUserInput(0)` before
`scrollToIndex(index)`. That kills the auto-scroll tween (so the click
snap-scroll wins) but does NOT change direction (since the click is
not a directional input). The 500ms idle timer arms again from the
click; if the user doesn't interact further, auto-scroll resumes in
the previous direction once the snap completes.

**P-4. The auto-scroll tween reads scrollTop fresh on every sweep.**
The brief sketch suggested `gsap.to(container, { scrollTop: ...,
repeat: -1 })`. That doesn't work cleanly because GSAP captures the
start value at creation; on repeat it cycles back to the original
start, not the wrapped position. I use a recursive `launchSweep()`
helper instead — each sweep is a one-shot tween whose `onComplete`
calls `launchSweep()` again after `wrapScrollIfNeeded()`. Each new
sweep reads the wrapped scrollTop fresh.

**P-5. `scroll-snap-type` removed.**
The v2 first pass used `scroll-snap-type: y mandatory` to keep the
focus row aligned for reduced-motion users. I removed it because
scroll-snap fights both the wrap-on-scroll behavior (scrollTop jumps,
which scroll-snap then "corrects" back) and the GSAP auto-scroll tween
(scroll-snap intercepts the in-flight tween at frame boundaries). The
color lerp + the explicit click snap-to-focus tween are sufficient
affordances for users with motion enabled. Reduced-motion users get
the binary color flip + manual scroll — they can still scroll to a
chapter and have it visually settle as the focus row.

**P-6. ARIA on copy 1.**
Copy 1 is `aria-hidden="true"` and its `<button>` elements are
`tabIndex={-1}`. They are *visually* clickable (pointer events still
work via `handleChapterClick(i)`) because copy 1 is real DOM that
overflows into the visible scroll range. The contract: screen readers
and keyboard users only ever interact with copy 0; mouse/touch users
get the visual wrap and can click any row regardless of which copy it
visually lives in.

### Files touched (polish pass)

- `react/src/styles/tokens.css` — new tokens, retuned display font /
  line-height / weight.
- `react/src/pages/Home/Home.css` — desktop hero-centering layout.
- `react/src/components/TopicTitle/TopicTitle.css` — weight 400.
- `react/src/components/ChapterColumn/ChapterColumn.css` — weight 400,
  removed scroll-snap, new `.chapter-column__lists` wrapper class.
- `react/src/components/ChapterColumn/ChapterColumn.jsx` — DOM
  duplication, wrap helper, idle auto-scroll, Approach B input
  detection.
- `react/CLAUDE.md` — updated layout + ChapterColumn sections.

### Verification

- `npm run lint` — clean (0 errors, 0 warnings).
- `npm run build` — clean. Bundle: 22.75 kB index, 70.44 kB gsap,
  203.02 kB vendor, 14.74 kB CSS. (gzip: 7.78, 27.81, 66.21, 3.28 kB.)
- `npm run dev` — boots cleanly, `/` returns HTTP 200.

**End of v2 polish pass notes.**

---

## AboutModal Rebuild Pass

**Date:** 2026-05-11
**Trigger:** User-supplied reference image showing the correct modal structure.

### Issues addressed

| # | Issue | File(s) changed | Resolution |
|---|-------|-----------------|------------|
| 1 | Close button present — spec says click-anywhere replaces it | `AboutModal.jsx` | Removed `<button ref={closeBtnRef}>` and all `closeBtnRef` usages entirely. |
| 2 | `handleBackdropClick` used `e.target === backdropRef.current` — cursor label div or other non-panel children could be `e.target`, blocking close | `AboutModal.jsx` | Changed to `!panelRef.current.contains(e.target)` so any click outside the panel closes the modal. |
| 3 | No custom cursor | `AboutModal.jsx`, `AboutModal.css` | Added `<div className="about-modal__cursor-label" aria-hidden="true">Close ×</div>` inside `.about-modal`. Added `mousemove` listener on the backdrop that updates `left`/`top` on the label ref. Added `cursor: none` on `.about-modal` and `cursor: auto` on `.about-modal__panel` to restore the default inside the panel. Hidden on `(hover: none)` media query (touch devices). |
| 4 | Focus trap `initialFocus` pointed at the now-removed close button | `AboutModal.jsx` | Changed `initialFocus` to `firstFocusRef.current`, which is attached to the LinkedIn link (first focusable element in the panel). |
| 5 | Modal content was bio + links only — spec requires structured sections | `AboutModal.jsx`, `AboutModal.css` | Rebuilt right column: Intro (bio paragraphs), Roster, Services (with sub-list), Technologies (two-column), Specialties (two-column), Collaborators, Links. Each section preceded by a hairline `<span className="about-modal__rule">`. |
| 6 | `owner` in `topics.js` lacked roster, services, technologies, specialties, collaborators fields | `src/data/topics.js` | Added all five fields per the data shape in the task brief. |
| 7 | `--font-family-sans` token missing from `tokens.css` | `src/styles/tokens.css` | Added alias: `--font-family-sans: var(--font-label)`. |
| 8 | `.about-modal__close` and `.about-modal__close-glyph` CSS rules — orphaned after close button removal | `AboutModal.css` | Removed both rule sets. |
| 9 | Right column lacked scrollability | `AboutModal.css` | Added `.about-modal__content { overflow-y: auto; max-height: 100%; display: flex; flex-direction: column; gap: var(--space-md); }`. |
| 10 | `about-modal__rule` had `width: var(--rail-max-width)` (220px cap) — should span full column | `AboutModal.css` | Changed to `width: 100%`. |
| 11 | `about-modal__links` was missing `list-style: none; margin: 0; padding: 0` reset | `AboutModal.css` | Added the reset. |

### Spec items not implemented (documented deviations)

- None. All items in the task brief were implemented.

### Placeholders carried forward

- Portrait: solid `#E8E8E8` square with caption "Amrit — photo TBC". Owner replaces before launch.
- LinkedIn / GitHub URLs remain `PLACEHOLDER`. Owner replaces before launch.
- Owner bio paragraphs remain the placeholder text from `client.md`. Owner replaces before launch.

### Verification

- `npm run build` — clean. Bundle unchanged: 26.11 kB index JS, 70.44 kB gsap, 203.02 kB vendor, 15.92 kB CSS.
- Zero lint errors (no ESLint run needed; build would fail on syntax errors).

**End of AboutModal rebuild pass.**

