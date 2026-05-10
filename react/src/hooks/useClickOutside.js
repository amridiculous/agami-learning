import { useEffect } from 'react';

/**
 * useClickOutside — invokes `callback` on pointerdown outside the given ref.
 *
 * Use pointerdown rather than click so the callback fires before any blur
 * handlers race and steal focus. Optional `ignoreRefs` lets us exclude the
 * trigger element so clicking it does not immediately re-close the popover
 * it just opened.
 */
export default function useClickOutside(ref, callback, ignoreRefs = [], active = true) {
  useEffect(() => {
    if (!active) return undefined;

    const onPointerDown = (e) => {
      const target = e.target;
      if (ref.current && ref.current.contains(target)) return;
      for (const ignore of ignoreRefs) {
        if (ignore && ignore.current && ignore.current.contains(target)) return;
      }
      callback(e);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [ref, callback, ignoreRefs, active]);
}
