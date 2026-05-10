/**
 * focusTrap — trap Tab/Shift+Tab focus inside `container` until released.
 *
 * Usage:
 *   const release = createFocusTrap(panelEl, { initialFocus: closeBtnEl });
 *   // ...later, on close:
 *   release();
 *
 * Behavior:
 *   - Moves focus to `initialFocus` on activation, or the first focusable
 *     element inside the container if not provided.
 *   - Wraps Tab from the last focusable element back to the first, and
 *     Shift+Tab from the first back to the last.
 *   - Returns a release function. The release function restores focus to
 *     the element that was focused before activation (unless `restoreFocus`
 *     is explicitly set to false).
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

function getFocusable(container) {
  if (!container) return [];
  const nodes = container.querySelectorAll(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter((node) => {
    // Filter out hidden elements (display:none / visibility:hidden / inert).
    if (node.hasAttribute('inert')) return false;
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return true;
  });
}

export function createFocusTrap(container, options = {}) {
  if (!container) return () => {};

  const { initialFocus = null, restoreFocus = true } = options;
  const previouslyFocused = document.activeElement;

  const focusables = getFocusable(container);
  const first = focusables[0] || container;
  const target = initialFocus || first;
  // Ensure container can receive focus as a fallback.
  if (!container.hasAttribute('tabindex')) {
    container.setAttribute('tabindex', '-1');
  }

  // Defer initial focus to after the modal has mounted/animated in.
  // Using rAF avoids the browser placing focus before the panel is visible,
  // which some screen readers announce inconsistently.
  requestAnimationFrame(() => {
    if (target && typeof target.focus === 'function') {
      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus();
      }
    }
  });

  const onKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    const current = getFocusable(container);
    if (current.length === 0) {
      e.preventDefault();
      return;
    }
    const firstEl = current[0];
    const lastEl = current[current.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === firstEl || !container.contains(active)) {
        e.preventDefault();
        lastEl.focus();
      }
    } else if (active === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  };

  document.addEventListener('keydown', onKeyDown, true);

  return function release() {
    document.removeEventListener('keydown', onKeyDown, true);
    if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === 'function') {
      try {
        previouslyFocused.focus({ preventScroll: true });
      } catch {
        previouslyFocused.focus();
      }
    }
  };
}
