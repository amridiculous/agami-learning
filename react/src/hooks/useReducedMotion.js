import { useEffect, useState } from 'react';

/**
 * useReducedMotion
 *
 * Returns a boolean reflecting `prefers-reduced-motion: reduce`.
 * Side effect: sets <html data-reduced-motion="true|false"> so the global
 * CSS rule in main.css can disable transitions/animations site-wide.
 *
 * Listens to the media query so toggling OS-level reduced motion at runtime
 * is respected without a page reload.
 */
export default function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const apply = (matches) => {
      setPrefersReduced(matches);
      document.documentElement.setAttribute(
        'data-reduced-motion',
        matches ? 'true' : 'false',
      );
    };

    apply(mql.matches);

    const onChange = (e) => apply(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange);
    } else if (mql.addListener) {
      // Legacy Safari
      mql.addListener(onChange);
    }

    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', onChange);
      } else if (mql.removeListener) {
        mql.removeListener(onChange);
      }
    };
  }, []);

  return prefersReduced;
}
