# QA Test Report

VERDICT: PASS
TESTED: 2026-05-11
BUILD: `react/dist` (commit: n/a — local working tree)

## Summary

Build, dev server, and preview server all boot cleanly with HTTP 200 and
zero console errors. Every functional contract enumerated in the spec
(routing, modal open/close paths, focus trap, marquee click hold, reduced
motion, data integrity) is wired correctly in source. No CRITICAL or
MAJOR functional defects. One MINOR finding (the `lint` script in
`package.json` references a binary that isn't installed) and a set of
documented pre-launch open items inherited from Phases 2–4. Verdict:
**PASS** — proceed to Phase 6.

## Build & Run

| Check | Result | Evidence |
|---|---|---|
| `npm install` | PASS | Already installed (66 packages, lockfile present). `node_modules/` contains `gsap`, `react`, `react-router-dom`. |
| `npm run build` | PASS | 0 errors, 0 warnings. 5 outputs: `index.html` (2.42 kB / 0.84 kB gzip), `index-CNIE2sYn.css` (19.28 kB / 3.60 kB), `index-CIK4YrP8.js` (21.84 kB / 7.02 kB), `gsap-SFc2wnMY.js` (70.44 kB / 27.81 kB), `vendor-CaDBedUB.js` (202.92 kB / 66.18 kB). No chunk over 500 kB. Built in 444ms. |
| `npm run dev` | PASS | Boots in 80ms at `http://localhost:5173/`. `curl /` returns HTTP 200 with valid HTML. `curl /src/main.jsx`, `/src/pages/Home/Home.jsx`, `/src/data/topics.js` all return HTTP 200. Dev log contains zero errors/warnings. |
| `npm run preview` | PASS | Boots at `http://localhost:4173/`. `curl /` returns HTTP 200 with full production HTML. All four `/assets/*` URLs in the HTML (vendor, gsap, index JS, index CSS) return HTTP 200. |
| Assets resolve in production HTML | PASS | See preview row. |
| SPA route fallback | PASS | `curl /nonexistent` and `curl /topic/rag` both return HTTP 200 (dev server SPA-fallbacks; client-side router handles the catch-all `<Navigate to="/" replace />`). |
| Production bundle leakage | PASS | `grep -E "console\\.log|debugger|TODO|FIXME|XXX"` finds zero hits across all three dist JS chunks. |

## Functional Checks (source-level)

| Feature | Result | Evidence |
|---|---|---|
| Router configured per spec | PASS | `src/main.jsx:9-21` — `createBrowserRouter`, `/` → `<Home/>`, `/topic/:slug` → `<Home/>` (V2 scaffold), `{ path: '*', element: <Navigate to="/" replace /> }` is the last child. |
| All components composed | PASS | `Home.jsx:4-8` imports `TopicGroup`, `TopicIndex`, `ContentSlot`, `SubtopicMarquee`, `ActionStack`. `ActionStack.jsx:3-4` imports `AboutModal`, `ContactModal`. No dangling components. |
| Topic selection flow | PASS | `Home.jsx:29` state `selectedTopicSlug`; `TopicIndex.jsx:28` click → `onSelect(topic.slug)` → `Home.handleTopicSelect` (`Home.jsx:34-37`) → `setSelectedTopicSlug`. `selectedTopic` flows to `ContentSlot`, `SubtopicMarquee`, and the `TopicGroup` label (`Home.jsx:105`). |
| Subtopic click + 800ms hold | PASS | `SubtopicMarquee.jsx:112-124` — `handleSelect` calls `onSelect(slug)`, then if `marqueeActive`, calls `pauseMarquee()` and schedules `resumeMarquee()` after exactly `800`ms. Clone click is now wired (CR-2 fix at line 204). |
| AboutModal — 3 close paths | PASS | Close button: `AboutModal.jsx:212` `onClick={onClose}`. Esc: `useEscapeKey(handleEsc, open)` at `AboutModal.jsx:83`. Backdrop click: `handleBackdropClick` at `AboutModal.jsx:86-91` (closes only when `e.target === backdropRef.current`). |
| ContactModal — 2 close paths | PASS | Esc: `useEscapeKey(handleEsc, open)` at `ContactModal.jsx:80`. Outside click: `useClickOutside(panelRef, handleEsc, ignoreRefs, open)` at `ContactModal.jsx:84` (with memoised `ignoreRefs` per CR-5). No backdrop / no scroll lock — matches spec §5. |
| Focus trap — AboutModal | PASS | `AboutModal.jsx:94-106` — `createFocusTrap(panelRef.current, { initialFocus: closeBtnRef.current })`. Release runs on unmount + restores focus to previously-focused element (the `About +` trigger). |
| Focus trap — ContactModal | PASS | `ContactModal.jsx:90-103` — `createFocusTrap(panelRef.current, { initialFocus: linkedinRef.current })` per spec §12 / CR-1 fix. Same release-and-restore contract. |
| Reduced-motion hook | PASS | `useReducedMotion.js` — boolean return + sets `<html data-reduced-motion="…">` for the global CSS override (`main.css:168-170` selector with 4 `!important` declarations per CR-8 wording). Lives on media-query listener so OS toggle is honoured without reload. |
| Reduced-motion gates in animated components | PASS | Home: `Home.jsx:46` early-returns the stagger effect. ContentSlot: `ContentSlot.jsx:89` early-returns the ghost cycle. SubtopicMarquee: `marqueeActive = isDesktop && !prefersReducedMotion` at `SubtopicMarquee.jsx:50`. AboutModal: `AboutModal.jsx:117` jumps to end state. ContactModal: `ContactModal.jsx:112` jumps to end state. All four animated components covered. |
| `gsap.context` + revert cleanup | PASS | `Home.jsx:54/96`, `SubtopicMarquee.jsx:65/79`, `AboutModal.jsx:133/182`, `ContactModal.jsx:126/147` — every animation effect builds inside a context and returns `ctx.revert()`. The interval-driven cycle in `ContentSlot` does manual cleanup (`clearInterval` + `activeTl.kill()` + `gsap.set` resets at lines 181-188), which is the documented exception in `react/CLAUDE.md`. |
| Data integrity (`topics.js`) | PASS | One topic (`rag`): `title`, `titleAnchor`, `titleComplement`, `body[2]`, `ghostAlternatives[8]` (≥ 8 ✓), `subtopics[12]`. No truncated strings, no obvious typos. `owner` named export has bio[4], `links.linkedin = https://www.linkedin.com/in/PLACEHOLDER`, `links.github = https://github.com/PLACEHOLDER` — matches client brief. |
| Placeholder URLs reachable by modals | PASS | `AboutModal.jsx:234, 245` and `ContactModal.jsx:168, 178` both read `owner.links.linkedin` / `owner.links.github`. No hardcoded URLs in JSX. |
| `<img>` tag count | PASS | Zero `<img>` tags in `src/` — matches spec ("typography only, portrait is a placeholder div with caption `Amrit — photo TBC`"). |
| HTML head — title / description / Newsreader / root mount | PASS | Title `Amrit Das — AI, in public`, description present, `<div id="root">` present, Newsreader stylesheet with `display=swap` and `preconnect` to `fonts.googleapis.com` + `fonts.gstatic.com`. Both dev and preview HTML verified by curl. |
| Responsive breakpoints | PASS | `main.css` has `@media (min-width: 1280px)` and `@media (min-width: 768px)`. `Home.css` switches from flex-column (mobile/tablet) to 3-col grid at `@media (min-width: 1280px)`. `SubtopicMarquee.css` has its desktop activation at 1280px. Marquee is replaced by a static list below 1280px (`marqueeActive` becomes false; the clone track is not rendered; `subtopic-marquee--static` class applied). |

## Issues by severity

### CRITICAL (forces FAIL)

None.

### MAJOR

None.

### MINOR

**QA-1 — `npm run lint` script references an uninstalled binary**

- File: `react/package.json:10`
- Severity: MINOR
- Found: `"lint": "eslint ."` is declared, and `react/CLAUDE.md` documents `npm run lint` as one of the project commands, but `eslint` is not listed in `devDependencies` and is not installed in `node_modules`. Running `npm run lint` fails with `sh: eslint: command not found`.
- Impact: Build, dev, and preview all succeed without lint. No runtime impact. But the documented developer workflow has a broken command.
- Fix: Either (a) add `eslint` plus a config (`@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`) to `devDependencies` and ship an `.eslintrc.*` so `npm run lint` works, or (b) remove the `lint` script and the reference in `react/CLAUDE.md`. (a) is preferable for a real codebase.

### NIT

None.

## Open items / pre-launch checklist (non-blocking — documented in dev-notes)

These were declared by the developer in `reviews/dev-notes.md` (Phase 2,
Deviation #6, #7; Fix Loop 1 DQA-11, DQA-12; Fix Loop 2 CR-9) and
re-accepted by code-review. They are not bugs and do not affect the
MVP verdict, but the user must address them before public launch.

1. **Favicon raster set is missing.** `public/` ships `favicon.svg` only.
   `index.html` references `/favicon.ico`, `/apple-touch-icon.png`,
   `/og-image.png`, `icon-192.png` (via webmanifest), `icon-512.png` —
   browsers will 404 these silently and fall back to the SVG. Generate
   the raster set from the SVG source (Sharp, ImageMagick, or any online
   converter) and drop into `public/`. Five files: `favicon.ico`,
   `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`,
   `og-image.png` (1200×630).
2. **Canonical URL and sitemap domain are placeholders.** `index.html:29`
   has `<link rel="canonical" href="https://[domain-tbc]/" />`.
   `public/sitemap.xml` and `public/robots.txt` likely contain the same
   placeholder. Replace with the real domain before public launch.
3. **About portrait is a styled `<div>` with caption "Amrit — photo TBC".**
   Replace with a real `<img>` per the dev-notes placeholder table.
4. **LinkedIn / GitHub URLs are PLACEHOLDER strings** in
   `src/data/topics.js`. Two single-line edits.
5. **Bio + RAG body copy are placeholders.** Both live in
   `src/data/topics.js` and can be rewritten without touching code.
6. **`lib/motion.js` refactor deferred** (CR-9). Easing cubic-beziers are
   currently inline string literals in each animation effect. Functional;
   refactor target only. No user action required.
7. **`home-reference.png` was never delivered** to
   `input/web-references/`. Design-QA and visual QA worked from the
   spec text. Not a bug — flagged here as a documentation gap so the
   next phase knows the reference asset is absent.

## Recommendations for Phase 6 Final Review

- All four functional pillars (build, dev, preview, source-level
  contracts) verified clean. The only fixable QA finding is QA-1 (the
  `lint` script). Final review can either land it or accept it as a
  pre-launch chore.
- The pre-launch checklist above should be reproduced in the final
  hand-off email to the client so nothing is lost between Phase 6
  sign-off and the actual public-launch day. The favicon raster set, the
  canonical URL, and the placeholder URLs are the three items that will
  *visibly* embarrass the site if missed.
- No fix loop back to `developer-agent` recommended — every functional
  contract holds; the one MINOR is documentation-grade.
