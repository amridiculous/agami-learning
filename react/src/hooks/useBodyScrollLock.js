import { useEffect } from 'react';

/**
 * useBodyScrollLock — locks scroll on <body> while `active` is true.
 *
 * Preserves the current scroll position by storing it before lock and
 * restoring it on unlock; using overflow: hidden alone causes mobile Safari
 * to jump to the top on unlock.
 */
export default function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;

    const scrollY = window.scrollY;
    const { body } = document;
    const original = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };

    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = original.overflow;
      body.style.position = original.position;
      body.style.top = original.top;
      body.style.width = original.width;
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}
