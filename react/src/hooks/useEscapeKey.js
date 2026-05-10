import { useEffect } from 'react';

/**
 * useEscapeKey — invokes `callback` when the user presses Escape while `active`.
 *
 * The listener is attached only while `active` is truthy so multiple modals
 * stacking cannot all close at once on a single Esc press if one is layered.
 */
export default function useEscapeKey(callback, active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        callback(e);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [callback, active]);
}
