import { Outlet } from 'react-router-dom';
import useReducedMotion from './hooks/useReducedMotion.js';

/**
 * App — router shell. Mounts <Outlet/> (Home at MVP) inside a semantic
 * <main> with the skip-link target. Calls useReducedMotion so the global
 * <html data-reduced-motion="true"> attribute is set as early as possible.
 *
 * Per spec §10 / §12: the page has a visually-hidden H1 and a skip link;
 * those live on the Home page, not here, because the H1 text is page-scoped.
 */
export default function App() {
  // Side effect only — toggles the root attribute that scopes CSS reduced-motion.
  useReducedMotion();

  return (
    <div className="app">
      <a className="sr-only sr-only--focusable" href="#main">
        Skip to content
      </a>
      <main id="main" className="app__main">
        <Outlet />
      </main>
    </div>
  );
}
