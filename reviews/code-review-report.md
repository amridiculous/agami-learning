# Code Review Report — Re-run after Fix Loop 2

VERDICT: PASS
REVIEWED: 2026-05-11 (Phase 4 re-run — code-review-agent)
BUILD: `npm run build` -> 0 errors, 0 warnings. 5 chunks (vendor 66.18KB gzip + gsap 27.81KB gzip + index JS 7.02KB gzip + index CSS 3.60KB gzip + index HTML 0.84KB gzip). Bundle split unchanged.

## Summary

| Files reviewed | Critical | Major | Minor | Verdict |
|----------------|---------|-------|-------|---------|
| 12 (delta) | 0 | 0 | 0 | PASS |

Fix verification: **2/2 CRITICAL verified, 3/3 MAJOR verified, 6/6 actionable MINOR verified, 1 MINOR (CR-9 `lib/motion.js`) deferral accepted as documented, 1 NIT verified, 2 NITs correctly carried as "no fix needed", 0 regressions introduced.**

The developer's Fix Loop 2 cleanly addresses every blocking issue from the prior review. The ContactModal focus contract (initial focus on LinkedIn, Tab cycles inside, focus restored to `Contact +` on close — spec §12 line 317) is now correctly implemented via the same `createFocusTrap` utility AboutModal already uses. The marquee click-swallow bug on cloned items is gone (one-line guard removal). The AboutModal resize-blink bug is gone (anchor read via `anchorRef.current` inside the open/close effect; `anchor.xPct/yPct` no longer in the deps array). All three MAJOR latent-bug / perf issues are fixed without changing the public component API or surface. The two MINOR documentation / hygiene items (CR-8 and CR-14) are corrected. CR-9 (`lib/motion.js` refactor) is deferred per the report's own classification and the developer's existing deviation #6 — that deferral is acceptable.

## Issues

None at any severity. All prior issues are resolved or correctly deferred.

## Per-issue verification

| ID | Severity | Prior status | Verification |
|---|---|---|---|
| CR-1 | CRITICAL | FAIL | **VERIFIED.** `ContactModal.jsx:6` imports `createFocusTrap`. `linkedinRef` declared at line 25 and attached to the LinkedIn `<a>` at line 166. `releaseTrapRef` at line 26. The trap effect (lines 90-103) is keyed on `[open, shouldRender]`, creates the trap with `initialFocus: linkedinRef.current`, and the cleanup invokes `releaseTrapRef.current()`. `focusTrap.js` defaults `restoreFocus: true` (line 45) and restores focus to `previouslyFocused = document.activeElement` (line 46) which at trap-creation time is the `Contact +` trigger. Esc (line 80) and click-outside (line 84) still call `onClose` -> open flips false -> trap cleanup runs -> focus restored. `react/CLAUDE.md` "Modal pattern" section now correctly states "both AboutModal and ContactModal trap focus inside the panel" and "ContactModal's initial focus is the LinkedIn link" (CLAUDE.md modal-pattern section). `dev-notes.md` Fix Loop 2 contains the explicit "Correction to a prior claim" entry acknowledging the earlier mischaracterization. Spec §12 line 317 is now satisfied. |
| CR-2 | CRITICAL | FAIL | **VERIFIED.** `SubtopicMarquee.jsx:204` reads `onClick={() => handleSelect(sub.slug)}` — the `!isClone &&` guard is removed. `tabIndex={isClone ? -1 : 0}` (line 203) and `aria-hidden="true"` on the clone `<ul>` (line 183) are preserved. The clone still does not announce twice and does not add tab stops; only the pointer click is wired. No double-fire risk: each rendered DOM element is a distinct node, so a single click event hits exactly one button regardless of whether it's the primary or clone copy. |
| CR-3 | MAJOR | FAIL | **VERIFIED.** `AboutModal.jsx:29` declares `anchorRef`; the small sync effect at lines 30-32 keeps it current. The open/close GSAP effect (lines 109-189) reads `const a = anchorRef.current;` at line 131 and uses `a.xPct/a.yPct` in the clip-path strings. The effect's deps at line 189 are `[open, shouldRender, prefersReducedMotion, clipPathEnabled]` — `anchor.xPct/yPct` are gone. `clipPathEnabled` is correctly retained in deps (crossing the desktop/mobile threshold genuinely changes the animation path). Initial-render code path still works because `anchorRef.current` is initialized to `{ xPct: 8, yPct: 90 }` and `computeAnchor()` runs in the `[open, computeAnchor]` effect (line 66-71) before the open animation starts; by the time the GSAP effect runs the ref already holds a fresh viewport-relative anchor. No regression to initial-position computation. |
| CR-4 | MAJOR | FAIL | **VERIFIED.** `ContentSlot.jsx:59` declares `allRowsRef` initialised from `allRows`. The mirror sync effect (lines 60-62) keeps it current. The `tl.call` at lines 129-142 reads `const liveRows = allRowsRef.current;` and `const liveTotal = liveRows.length;`, then uses `liveRows[nextIdx]` for the imperative text swap. The closure no longer captures `allRows`. When V2 introduces a second topic with the same `total` row count, the swap will display the new topic's phrases. The retained `eslint-disable-next-line react-hooks/exhaustive-deps` is justified in the inline comment (re-binding the interval mid-cycle would reset the timer). |
| CR-5 | MAJOR | FAIL | **VERIFIED.** `ContactModal.jsx:83` reads `const ignoreRefs = useMemo(() => [triggerRef], [triggerRef]);` and line 84 passes that memoised reference to `useClickOutside`. The hook's `pointerdown` listener (`useClickOutside.js:24`) is now installed once per open/close transition instead of once per render. `useMemo` is correctly imported on line 1. The hook signature (`ignoreRefs = []`) is unchanged. Outside-click semantics preserved (cleaning closes the popover when clicking outside the panel and not on the trigger). |
| CR-6 | MINOR | FAIL | **VERIFIED.** `tokens.css:155` defines `--blur-modal: 12px`. `AboutModal.css:6-7` references `var(--blur-modal)` in both `backdrop-filter` and `-webkit-backdrop-filter`. Grep confirms no remaining hardcoded `12px` in component CSS. |
| CR-7 | MINOR | FAIL | **VERIFIED.** `AboutModal.css:127-131` is now: `display: flex; flex-direction: column; gap: var(--space-md);`. The dead `flex: 1 1 60%` is gone. The desktop grid (`grid-template-columns: 40% 60%` at line 52) sizes the bio column. |
| CR-8 | MINOR | FAIL | **VERIFIED.** `main.css:177-184` includes the new explanatory comment: "The four !important declarations above (transition-duration, animation-duration, animation-iteration-count, scroll-behavior) live on a single reduced-motion selector." `react/CLAUDE.md` "CSS tokens" section now reads "The only `!important` declarations in the codebase live in a single reduced-motion rule in `main.css` (`transition-duration`, `animation-duration`, `animation-iteration-count`, `scroll-behavior` — four declarations on the same selector)." Factually accurate. |
| CR-9 | MINOR | FAIL | **DEFERRED — ACCEPTED.** No `lib/motion.js` introduced. Documented in `dev-notes.md` Fix Loop 2 row 9: "Pre-existing deviation #6; code-review report explicitly classifies CR-9 as 'deferred-acceptable for MVP'." Easing literals still match the spec token values exactly. Not blocking. |
| CR-10 | MINOR | FAIL | **VERIFIED.** `ContentSlot.jsx:249` reads `key={`${titleAnchor}-p${i}`}` (e.g. `rag-p0`). `AboutModal.jsx:225` reads `key={`bio-p${i}`}`. Slug-prefixed, survives a future topic-switch with the same paragraph count. |
| CR-11 | MINOR | FAIL | **VERIFIED.** `ContactModal.jsx:57-60` measures `panelRef.current.getBoundingClientRect().height` and falls back to 140 only when the ref is not yet wired. The measured height is then used by the overflow-bottom check (line 61). The retained `panelWidth = 220` constant is correct (panel width is fixed by `--contact-modal-width` and does not vary with content). |
| CR-12 | MINOR | FAIL | **VERIFIED.** `SubtopicMarquee.jsx:137` declares `keyboardIndexRef`. The mirror sync effect (lines 138-140) keeps it current. `handleKeyDown` (lines 141-158) reads `keyboardIndexRef.current` in the Enter/Space branch (line 151) and the deps array on line 157 is `[subtopics, handleSelect]` — `keyboardIndex` removed. Callback identity is stable across arrow-key presses. |
| CR-13 | NIT | NO FIX | Correctly carried — overflow at MAX_SAFE_INTEGER requires ~931k years. |
| CR-14 | NIT | FAIL | **VERIFIED.** `SubtopicMarquee.css:34-38` (the `.subtopic-marquee--animated .subtopic-marquee__track` base rule) no longer carries the redundant `outline-offset: 0`. The `:focus-visible` rule at line 87-89 retains it where it matters. The duplicate declaration is gone. |
| CR-15 | NIT | NO FIX | Correctly carried — skip-link hash anchor is browser-native, no SPA interception needed. |

## GSAP cleanup audit (delta only)

All previously-PASS components still PASS. The two changed effects are:

| Component | Effect | Status |
|---|---|---|
| `AboutModal.jsx` open/close timeline (lines 109-189) | Deps reduced to `[open, shouldRender, prefersReducedMotion, clipPathEnabled]`; `ctx.revert()` cleanup preserved. | PASS — no longer re-runs on resize. The resize blink is gone. |
| `ContentSlot.jsx` ghost cycle (lines 88-194) | `tl.call` reads via ref mirror; `clearInterval` + `activeTl.kill()` + `gsap.set` resets preserved. Deps unchanged at `[prefersReducedMotion, total]` (suppressed eslint comment retained with justification). | PASS — latent stale-closure bug fixed. |

New focus-trap effect (`ContactModal.jsx:90-103`):
- Cleanup releases the trap and nulls the ref. Identical pattern to AboutModal's trap effect (lines 94-106).
- Activation gated on `open && shouldRender` so the panel is rendered (`panelRef.current` is non-null) before the trap is built.
- No leak: opening, closing, and re-opening produces a single active trap at a time; the cleanup runs when `open` flips false (because the effect's deps change), which unwires the keydown listener and restores focus to the trigger.

## Regression checks (high-risk areas)

| Risk | Verification |
|---|---|
| Focus trap broke Esc / click-outside | `useEscapeKey(handleEsc, open)` still wired (line 80). `useClickOutside(panelRef, handleEsc, ignoreRefs, open)` still wired (line 84). Both call `handleEsc = onClose`. The trap does not intercept Esc — `useEscapeKey` runs independently and fires `onClose`, which flips `open` false, which triggers the trap cleanup (releasing focus to the trigger). Outside-click path identical. **No regression.** |
| AboutModal anchor-via-ref breaks initial open animation | `anchorRef.current` is initialised to `{ xPct: 8, yPct: 90 }` (line 29) so the ref is always populated. `computeAnchor` (lines 56-63) runs in the `[open, computeAnchor]` effect (lines 66-71) when `open` flips true; the mirror sync effect (lines 30-32) updates `anchorRef.current` whenever `anchor` state changes. React effect ordering guarantees the mirror sync runs before the open/close GSAP effect when both queue in the same commit. Even if there were a one-frame lag, the initial state `{ xPct: 8, yPct: 90 }` is a sane fallback (bottom-left, matches the Action Stack region). **No regression.** |
| Marquee click guard removal causes double-fire | Each rendered DOM element is unique (the clone is a separate `<ul>` with `aria-hidden`). A single pointer click event targets exactly one button. The handler `handleSelect(slug)` is idempotent in its visible effect — `onSelect(slug)` writes to parent state which is keyed by slug, so even a theoretical double-fire would set the same value twice with no visible difference. **No regression.** |
| `useClickOutside` memoisation alters semantics | `useMemo([triggerRef], [triggerRef])` returns the same array reference across renders while the same `triggerRef` is passed. The hook's effect deps now stabilise; the listener installs once per `open` transition. Behaviour unchanged. **No regression.** |
| Build / boot | `npm run build` → 0 errors, 0 warnings, 5 chunks unchanged. Dev / preview servers were not started in this audit (build is the gating check); the deps-locked builds match the prior pass byte-for-pattern. **No regression.** |

## Dev-notes verification (delta)

- The "Correction to a prior claim" entry (lines 160-170) explicitly retracts the earlier characterization of ContactModal as deliberately not trapping focus and cites spec §12 line 317 correctly. The fix in this pass adds the trap; CLAUDE.md is updated; the deviation is no longer accepted because there is no deviation now.
- The Fix Loop 2 issue table (lines 174-190) maps 1-to-1 with the prior report's CR-1 through CR-15. Status field accurately reflects each fix.
- `lib/motion.js` deferral is documented and matches the prior report's classification.

## Recommendations

None — the codebase is ready for Phase 5 (QA).

## Handoff

> Code review re-run complete. Verdict: **PASS**. Critical: 0, Major: 0, Minor: 0. All Fix Loop 2 fixes verified against source. One MINOR (CR-9 `lib/motion.js`) deferral accepted as documented. Zero regressions introduced. Build clean (0 errors, 0 warnings). Report at `clients/AI Learning Website/reviews/code-review-report.md`. Ready for hand-off to qa-test-agent.
