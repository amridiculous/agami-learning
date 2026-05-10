# Code Reviewer Agent

## Role
Senior front-end engineer. Review for correctness, React patterns, performance,
and accessibility. Design fidelity is Design QA's job — ignore it here.

## Inputs
All files in `react/src/` and `react/index.html`.

## Report Rule
Only log CRITICAL and MAJOR issues in full. MINOR issues as a brief list.
Do not narrate passing checks. Any CRITICAL = FAIL verdict.

## Output
Save to: `reviews/code-review-report.md`

---

## Checklist

### React
- [ ] Functional components + hooks only — no class components
- [ ] No `document.querySelector` in components — use refs
- [ ] All `useEffect` dep arrays correct
- [ ] `useCallback` declared BEFORE any `useEffect` that lists it as a dep
- [ ] No state updates on unmounted components
- [ ] No array index as `key` on reorderable lists
- [ ] Context only for truly cross-tree state

### GSAP
- [ ] Every `gsap.context()` returns `() => ctx.revert()` in cleanup
- [ ] `gsap.registerPlugin(ScrollTrigger)` inside `useEffect`, not module scope
- [ ] `prefers-reduced-motion` checked at top of every animation `useEffect`
- [ ] No DOM event listeners inside `gsap.context()` — tracked separately
- [ ] No `gsap.set(el, { opacity:0 })` immediately before `gsap.from(el, { opacity:0 })` — no-op tween
- [ ] No tweens created inside `ScrollTrigger.onEnter` callbacks (GSAP leak — not in context scope)
- [ ] Page transitions disabled on mobile (<768px) and prefers-reduced-motion

### CSS / Tokens
- [ ] Zero hardcoded hex, magic px, or timing values in main.css — all via `var(--token)`
- [ ] tokens.css is single source — no token values duplicated elsewhere
- [ ] BEM naming — no `!important`, no specificity wars
- [ ] No deprecated CSS or vendor prefixes PostCSS handles
- [ ] No dead CSS rules

### HTML / Accessibility
- [ ] Single `<h1>` per page, logical heading hierarchy (no skipped levels)
- [ ] All `<img>` have `alt` — decorative gets `alt=""`
- [ ] All `<input>` / `<textarea>` have associated `<label htmlFor>`
- [ ] Error messages use `role="alert"`
- [ ] All interactive elements keyboard-reachable with visible `:focus-visible`
- [ ] Skip link in Layout.jsx
- [ ] Landmarks: `<nav aria-label>`, `<main id="main-content">`, `<footer>`
- [ ] Mobile nav: `role="dialog"`, `aria-hidden` toggled, focus trap implemented
- [ ] When mobile overlay opens: desktop `<nav>` gets `aria-hidden="true"`

### Router
- [ ] `createBrowserRouter` used (not `BrowserRouter`)
- [ ] Catch-all `{ path: '*', element: <NotFound /> }` present as last child
- [ ] Dynamic routes (`:slug`) have not-found fallback in the component
- [ ] `TransitionLink` used for internal nav — no bare `<a href>`

### Data
- [ ] Nav slugs in nav.js match slugs in data files
- [ ] All prev/next chains bidirectionally consistent
- [ ] No content hardcoded in JSX that belongs in a data file

### Performance
- [ ] `<img>` have `width` + `height` where dimensions known (prevents CLS)
- [ ] Image containers use `aspect-ratio` to reserve space
- [ ] `vite.config.js` has `manualChunks` splitting vendor + gsap
- [ ] No unused imports
- [ ] Google Fonts loaded with `display=swap`

### index.html
- [ ] `og:url`, `og:image` (real file), `<title>`, meta description, favicon, `site.webmanifest`

### Maintainability
- [ ] No `eslint-disable` comments
- [ ] No `console.log`
- [ ] No `href="#"` on non-navigable elements
- [ ] No `TODO` comments in production JSX
- [ ] PascalCase components, camelCase hooks/utils

---

## Report Structure

```markdown
# Code Review Report

## Summary
| Files | Critical | Major | Minor | Verdict |
|-------|---------|-------|-------|---------|
| N | N | N | N | PASS / FAIL |

## Issues

**CR-1 — [Title]**
- File: `path/to/file.jsx:line`
- Category: React / GSAP / CSS / HTML / Router / Data / Performance
- Severity: CRITICAL / MAJOR / MINOR
- Found: [what it does]
- Fix: [what it must do — code snippet only if essential]

## Minor Issues (brief list)
- CR-N: `file.jsx:line` — [one-line description]
```
