# Design QA Report — Re-run after Fix Loop 1

VERDICT: PASS
REVIEWED: 2026-05-11 (re-run after developer-agent fix loop 1)
BUILD: `react/dist/` rebuilt 2026-05-11 (3 chunks present: `vendor`, `gsap`, `index` JS+CSS + `index.html`). `npm run build` returns 0 errors, 0 warnings.

## Summary

| Critical | Major | Minor | Verdict |
|----------|-------|-------|---------|
| 0 | 0 | 1 (new) | PASS |

Every prior MAJOR was fixed in the implementation that was claimed.
Every prior MINOR was either fixed in code (DQA-3 through DQA-10) or
explicitly deferred with a documented rationale that this re-run accepts
(DQA-11 favicon raster set; DQA-12 `lib/motion.js` centralization).
All four NITs remain in their original "no-fix" state per the developer's
log, matching the original report's "no action" stance. One new MINOR is
logged below (DQA-17) — a stale `flex: 1 1 60%` rule on the bio panel
that has no effect under the new grid layout. It is not a regression in
behaviour, only a cleanup nit.

Fix verification counts: **2/2 MAJOR fixes verified, 8/8 claimed MINOR
fixes verified, 2/2 deferrals reviewed and accepted, 0 regressions.**

## Issues

### NEW (this run)

**DQA-17 — Vestigial `flex: 1 1 60%` on `.about-modal__bio` after grid refactor** (MINOR — no visual impact)
- Spec: §5 — "two-column grid inside on desktop"
- File: `react/src/components/AboutModal/AboutModal.css:127-132`
- Found: With the `.about-modal__panel` rule on desktop now declaring `display: grid; grid-template-columns: 40% 60%; gap: var(--about-modal-grid-gap)`, the `.about-modal__bio` rule's `flex: 1 1 60%` is a grid-child no-op. Harmless but stale — when the parent is `display: grid`, `flex-*` shorthand on children is ignored.
- Severity: MINOR
- Fix: Remove the `flex: 1 1 60%` declaration from `.about-modal__bio`. The grid track sizes the column.

### Verification of prior issues

**DQA-1 (was MAJOR) — Ghost-cycle two-axis choreography → FIXED**
- File: `react/src/components/ContentSlot/ContentSlot.jsx:78-181`
- Verified: A single `gsap.timeline()` is created per cycle inside `tick()`. The timeline composes (a) opacity 1→0 on `.content-slot__focus-complement` (0–400ms, `--ease-soft`), (b) imperative `textContent` swap at t=400ms via `tl.call(...)`, (c) `y: 0 → +rowHeight` on the above-stack ref starting at t=200ms over 800ms (`--ease-soft`), (d) `y: 0 → -rowHeight` on the below-stack ref over the same window, (e) opacity 0→1 on the complement (800–1200ms). `onComplete` resets both stacks' `y` to 0, sets complement opacity to 1, and increments rotation. Row height is measured live via `getBoundingClientRect()`. Reduced-motion path short-circuits (line 79). Cleanup function (lines 168–175) clears the interval, kills the active timeline, and resets the live stack/complement values — no residue. References `y: rowHeight` (line 136) and `y: -rowHeight` (line 145) per spec.
- Caveat (already declared by developer as judgment-call #1 of the fix loop): the spec language "previous focus descends, next ghost rises" is geometrically ambiguous. The developer implemented the literal directional split — above-stack moves +y (down), below-stack moves -y (up). Visually this is "converging" motion toward the focus row, not unidirectional scroll. Whether this matches the designer's mental model can only be confirmed with the absent reference image. Logging it here as a known interpretation: it satisfies the spec's exact verbs ("descends", "rises"), matches the QA-1 fix prescription's wording verbatim, and reverses the simplification flagged in Phase 2. If subjective review later prefers unidirectional scroll, flipping the sign on the below-stack tween is one line. Accepting as PASS.

**DQA-2 (was MAJOR) — Mobile 3+3 ghost rows → FIXED**
- File: `react/src/components/ContentSlot/ContentSlot.css:107-112`
- Verified: A `@media (max-width: 767px)` rule hides `.content-slot__ghost-stack--above .content-slot__ghost-row:first-child` and `.content-slot__ghost-stack--below .content-slot__ghost-row:last-child`. Net mobile output: 3 ghost rows above + 3 below. Data slice remains 4+4 across all breakpoints (CSS-only gate per the QA report's recommended option (b)).

**DQA-3 (was MINOR) — Mobile focus headline y → FIXED**
- File: `react/src/pages/Home/Home.jsx:49-79`
- Verified: `isDesktop = window.matchMedia('(min-width: 768px)').matches`; `focusY = isDesktop ? 16 : 0`. The `gsap.from('[data-anim="focus"]')` tween references `y: focusY`. Mobile is now opacity-only per spec §6b.

**DQA-4 (was MINOR) — ContactModal mobile y → FIXED**
- File: `react/src/components/ContactModal/ContactModal.jsx:87-94`
- Verified: `isDesktop = matchMedia('(min-width: 768px)').matches`; `openY = isDesktop ? 8 : 4`. `gsap.set(panel, { ..., y: openY, ... })`.

**DQA-5 (was MINOR) — ContactModal aria-modal → FIXED**
- File: `react/src/components/ContactModal/ContactModal.jsx:124`
- Verified: `aria-modal="true"` (was `"false"`).

**DQA-6 (was MINOR) — Focus-ring duration → FIXED**
- File: `react/src/styles/tokens.css:129` and `react/src/styles/main.css:98-99`
- Verified: `--duration-xfast: 120ms` added to tokens. `:focus-visible` transition references `var(--duration-xfast)` for both `outline-color` and `outline-offset`.

**DQA-7 (was MINOR) — ActionStack doubled bottom offset → FIXED**
- File: `react/src/components/ActionStack/ActionStack.css:59-64`
- Verified: The interior `padding-bottom: var(--action-stack-bottom-desktop)` has been removed. A comment marks the choice. The 96px desktop offset is now provided exclusively by `.home`'s `padding-bottom: var(--section-padding-bottom-desktop)` (Home.css:55). No regression — the action stack remains in row 3 of the desktop grid with `margin-top: 0`.

**DQA-8 (was MINOR) — AboutModal panel grid → FIXED (with one minor cleanup nit; see DQA-17)**
- File: `react/src/components/AboutModal/AboutModal.css:48-57`
- Verified: At ≥1280px, `.about-modal__panel` declares `display: grid; grid-template-columns: 40% 60%; align-items: start; gap: var(--about-modal-grid-gap)`. The portrait's `flex: 0 0 40%` is removed (grid tracks size it). One stale `flex: 1 1 60%` rule remains on `.about-modal__bio` — see DQA-17.

**DQA-9 (was MINOR) — AboutModal links caption-sized → FIXED**
- File: `react/src/components/AboutModal/AboutModal.css:178-216`
- Verified: `.about-modal__link` uses `var(--font-size-caption-mobile)` (12px) and `var(--letter-spacing-caption)` / `var(--line-height-caption)`. At desktop, font size jumps to `var(--font-size-caption-desktop)` (13px). Was CTA tokens (13/14px).

**DQA-10 (was MINOR) — Hardcoded pixels → FIXED**
- File: `react/src/styles/tokens.css:141-154` plus every previously-flagged component CSS
- Verified: Component-derived pixel tokens added — `--underline-width: 16px`, `--underline-height: 4px`, `--close-button-size: 32px`, `--close-button-glyph-size: 28px`, `--close-button-glyph-optical-y: -2px`, `--about-modal-max-width: 960px`, `--about-modal-grid-gap: 48px`, `--about-modal-edge-offset-desktop: 32px`, `--portrait-max-width: 320px`, `--contact-modal-width: 220px`, `--contact-modal-padding-y: 20px`, `--contact-modal-padding-x: 24px`, `--action-stack-hover-shift: 2px`. Every prior hardcoded value in `TopicIndex.css`, `ActionStack.css`, `AboutModal.css`, `ContactModal.css` now references a token. A grep for `[0-9]+px` in `react/src/components/**/*.css` returns only media-query breakpoints (`@media (min-width: 768px)`, `@media (min-width: 1280px)`, etc.) — which are acceptable per spec. The remaining `panelWidth = 220` inside `ContactModal.jsx`'s `computePosition()` is a JS-side overflow-math constant (not a CSS declaration); developer documented this in dev-notes and the call is acceptable.

**DQA-11 (was MINOR) — Favicon raster set → DEFERRED, ACCEPTABLE**
- Developer documented in dev-notes Fix Loop 1 row. Rationale: requires Sharp/Cairo in the dep tree for a single rendering pass; spec §7 sets the same "Amrit generates later" pattern for the OG image and the `<link>` chain is in place so dropping the PNGs into `public/` is friction-free. Pre-launch open item, not a ship blocker. Accepted as deferral.

**DQA-12 (was MINOR) — `lib/motion.js` not present → DEFERRED, ACCEPTABLE**
- Developer documented in dev-notes Fix Loop 1 row. Rationale: co-located tweens are clearer for one MVP route; flagged as a code-review (Phase 4) refactor target. Easing-literal duplication is a real risk if tokens are retuned but does not affect ship-readiness at MVP. Accepted as deferral.

### Verification of NITs (no change)

| ID | Status | Notes |
|---|---|---|
| DQA-13 | Unchanged | Italic Newsreader at weight 400 matches spec §3. Not a deviation. |
| DQA-14 | Unchanged | Canonical URL placeholder `https://[domain-tbc]/`. Pre-launch task. |
| DQA-15 | Unchanged | CSS bundler rewriting `translateX(2px)` → `translate(2px)` is functionally equivalent. |
| DQA-16 | Unchanged | Global `:focus-visible { border-radius: 0 }` is cosmetic and matches spec. |

## Regression Audit

| Risk area | Result |
|---|---|
| Focus-row text correctness during ghost cycle | OK — imperative `textContent` swap at t=400ms is bracketed by opacity-0 (the user only sees the text during fade-out's tail or fade-in's start, never during the swap moment). On `onComplete`, React's render via `setRotation(r => r + 1)` is reconciled with the same string already on screen — no flicker. |
| ActionStack vertical position after interior-padding removal | OK — desktop offset of 96px provided by `.home`'s `padding-bottom` in row 3 of the grid. Mobile uses `.home`'s `padding-bottom-mobile` (64px) + `.home__action-rail` margin-top (`var(--space-lg)` = 24px). Both behave as the original spec intended. |
| Build artifacts fresh | OK — `dist/` rebuilt 2026-05-11 00:38, 3 JS chunks + 1 CSS + index.html, no warnings. |
| Reduced-motion compliance | OK — short-circuit at line 79 of ContentSlot.jsx (returns before any tween or interval). Global `[data-reduced-motion="true"]` selector in main.css unchanged. |
| Cleanup on unmount | OK — `clearInterval(id)`, `activeTl.kill()`, and three `gsap.set(...)` calls reset the live transform/opacity values so a mid-flight tween's residue does not leak. |
| AboutModal grid vs. flex (bio panel) | One stale `flex: 1 1 60%` rule on `.about-modal__bio` (see DQA-17). Visual outcome unchanged because grid is the parent layout; flex declarations on grid children are ignored. Cleanup nit, not a regression. |
| Spec direction interpretation of ghost cycle | Documented above under DQA-1 caveat. Implementation is the literal reading of the spec's verbs; geometric outcome is converging motion toward the focus. Logged as known interpretation, no fail. |

## Deviation Review (developer-declared judgment calls — re-verified)

| dev-notes item | Phase 2 verdict | Re-run verdict |
|---|---|---|
| 1 — Single `!important` on the reduced-motion global | acceptable | acceptable (unchanged) |
| 2 — Named `owner` export in `topics.js` | acceptable | acceptable (unchanged) |
| 3 — ActionStack whole-label translate, not glyph-only | acceptable | acceptable (unchanged) |
| 4 — (Phase-2) Ghost cycle simplified | NOT acceptable | **resolved** — Fix Loop 1 reverted the simplification to the two-axis choreography (see DQA-1 above). |
| 5 — (Phase-2) ActionStack relative-flow positioning | partially acceptable | **resolved** — Fix Loop 1 removed the interior padding-bottom (DQA-7); the 96px desktop offset now comes solely from `.home`'s `padding-bottom`. |
| 6 — `lib/motion.js` deliberately omitted | acceptable at MVP | acceptable at MVP (unchanged — flagged for Phase 4 code-review) |
| 7 — Favicon PNG rasters / OG image not bundled | partially acceptable | partially acceptable (open item for client before public launch — DQA-11) |

### New judgment calls declared by developer in Fix Loop 1

1. **Ghost cycle direction.** Discussed above under DQA-1 caveat. **Acceptable** — the literal reading of the spec's verbs is implemented. If subjective review later prefers unidirectional scroll, the change is one sign flip.
2. **Imperative DOM update for focus text mid-cycle.** `tl.call()` at t=400ms writes `complementRef.current.textContent` to the next phrase; React state is reconciled at `onComplete`. **Acceptable** — bracketed by opacity-0 so no flicker; documented as a known anti-pattern that converges cleanly here.
3. **Rotation tracked via state + ref mirror.** Standard pattern for interval-driven cycles whose callback closure would otherwise capture a stale state value. **Acceptable.**
4. **CSS-only mobile ghost-row hiding (option b from the QA report).** Chosen for the smaller surface change vs. matchMedia + JS slice variation. **Acceptable** — matches the QA report's recommendation directly.

## Limitations

- **Reference image still absent.** `input/web-references/home-reference.png` directory exists but is empty. All visual judgments are against the textual spec only. The ghost-cycle direction (above-stack down + below-stack up = converging) cannot be diff'd against the reference. Recommend Amrit drops the file before launch sign-off so this can be confirmed.
- **Visual rendering not verified at 375 / 768 / 1280.** Server boots cleanly and `dist/` rebuilds without warnings, but a true visual diff requires headless-browser screenshots — not available in this environment. All layout findings are derived from CSS/JSX source + spec, not screenshots.
- **GSAP timeline values verified by source-reading.** Durations, easings, staggers, delays, and reduced-motion short-circuits read from each component's `useEffect` and cross-referenced against spec §6a/§6b. Playback was not observed.

## Handoff

Design QA complete. Verdict: PASS. Critical: 0, Major: 0, Minor: 1 (new — DQA-17 cleanup nit, no visual impact).
Report at `clients/AI Learning Website/reviews/design-qa-report.md`.
Recommend proceeding to Phase 4 (code-review-agent). DQA-12 (`lib/motion.js` centralization) and DQA-11 (favicon rasters) are pre-launch open items, not Phase 4 blockers. DQA-17 can be folded into Phase 4 cleanup if the code-review agent wants to.
