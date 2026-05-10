import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';

import './ChapterColumn.css';

/**
 * ChapterColumn — right column, vertical scrollable list of chapter names.
 *
 * v2 polish (change #4) behavior:
 *   - Internal scroll only (wheel, touch, arrow up/down when focused).
 *   - The chapter at the focus line (vertical center of the container) is
 *     near-black; all others fade to ghost-grey based on vertical distance
 *     from the focus line. Implementation: rAF-throttled scroll handler
 *     reads each row's bounding rect once per frame and writes its color
 *     via inline style.
 *   - The chapter list is DUPLICATED in the DOM (two identical copies) so
 *     that scroll can wrap seamlessly. When the visible scroll position
 *     crosses from copy 1 into copy 2, we instantly snap scrollTop back by
 *     one copy-height — no visible jump because the copies are identical.
 *   - Auto-scroll on idle: when the user issues wheel / touchmove / arrow-key
 *     input, we track the direction and kill any in-flight auto-scroll. When
 *     no user input has arrived for AUTOSCROLL_IDLE_MS (~500ms), we start a
 *     slow linear GSAP tween of scrollTop in the user's last direction. Speed
 *     is AUTOSCROLL_SPEED px/sec (default ~30). The tween infinite-loops via
 *     scrollTop wraparound (see the wrap logic above). User input cancels the
 *     auto-scroll and re-arms the idle timer.
 *   - Distinguishing user vs. programmatic scroll: we use wheel / touchmove /
 *     keydown as the user-input signals (Approach B). The plain `scroll`
 *     event drives only the focus-color logic and the wrap check — it does
 *     NOT control auto-scroll cancellation, because the GSAP tween also
 *     mutates scrollTop and would otherwise immediately cancel itself.
 *   - Click a chapter → smooth GSAP scroll-to so it lands on the focus
 *     line, then navigate('/chapter/:slug').
 *   - Reduced motion: chapter color flips instantly; auto-scroll is DISABLED
 *     entirely; click jumps without GSAP.
 */

// Auto-scroll tuning. Pulled from CSS tokens at mount; these are JS-side
// fallbacks if the tokens are unreadable for any reason.
const DEFAULT_AUTOSCROLL_SPEED_PX_PER_SEC = 12;
const DEFAULT_AUTOSCROLL_IDLE_MS = 1200;
const DEFAULT_WHEEL_MULTIPLIER = 0.5;

export default function ChapterColumn({
  chapters,
  topicSlug,
  initialChapterSlug,
  prefersReducedMotion = false,
}) {
  const containerRef = useRef(null);
  // itemRefs is a 2D array: itemRefs.current[copyIndex][chapterIndex]. Copy 0
  // is the "primary" copy whose indices are used for activeIndex; copies 1
  // and 2 are duplicates that let us wrap. Three copies are needed because
  // the seamless wrap requires scrollHeight >= copyHeight + clientHeight —
  // with only two copies and copyHeight < clientHeight, the browser's native
  // scroll limit is hit before the wrap can fire.
  const itemRefs = useRef([[], [], []]);
  const copyRefs = useRef([null, null, null]);

  const rafRef = useRef(null);
  const snapTweenRef = useRef(null);
  const autoTweenRef = useRef(null);
  const idleTimerRef = useRef(null);
  // -1 = scrolling up (user dragged content down / wheel up); +1 = scrolling
  // down. Default +1 so the first auto-scroll (before any user input) would
  // drift down — but we gate auto-scroll on at least one user input event, so
  // this default never actually fires.
  const lastDirectionRef = useRef(1);
  const hasUserInteractedRef = useRef(false);
  const navigate = useNavigate();

  const initialIndex = (() => {
    if (!initialChapterSlug) return 0;
    const i = chapters.findIndex((c) => c.slug === initialChapterSlug);
    return i >= 0 ? i : 0;
  })();

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  // Mirror activeIndex so the resize listener (mounted once) reads the current
  // value rather than the closure-captured initial one.
  const activeIndexRef = useRef(initialIndex);

  // ===== Helpers =====

  // Read CSS tokens once on mount.
  const tokensRef = useRef({
    speed: DEFAULT_AUTOSCROLL_SPEED_PX_PER_SEC,
    idleMs: DEFAULT_AUTOSCROLL_IDLE_MS,
    wheelMultiplier: DEFAULT_WHEEL_MULTIPLIER,
  });

  // Height (in px) of a single copy of the chapter list. Recomputed on
  // resize and after fonts load.
  const copyHeightRef = useRef(0);

  const measureCopyHeight = useCallback(() => {
    const firstCopy = copyRefs.current[0];
    if (!firstCopy) return 0;
    const h = firstCopy.getBoundingClientRect().height;
    copyHeightRef.current = h;
    return h;
  }, []);

  // Calculate the scrollTop value that puts a given chapter index on the focus
  // line (vertical center of the container). Uses copy 0. Result is wrapped
  // into the canonical [0, copyHeight) range so the wrap math stays seamless
  // even when copy 0's chapter 0 would otherwise land at a negative scrollTop.
  const scrollTopForIndex = useCallback((index) => {
    const container = containerRef.current;
    const item = itemRefs.current[0]?.[index];
    if (!container || !item) return 0;
    const containerHeight = container.clientHeight;
    const itemTopWithinContent = item.offsetTop;
    const itemHeight = item.offsetHeight;
    const raw = itemTopWithinContent - (containerHeight / 2) + (itemHeight / 2);
    const h = copyHeightRef.current;
    if (!h) return raw;
    return ((raw % h) + h) % h;
  }, []);

  // Imperatively scroll a chapter to the focus line. Smooth tween via GSAP
  // unless reduced motion, in which case it's an instant assignment.
  const scrollToIndex = useCallback((index, { instant = false } = {}) => {
    const container = containerRef.current;
    if (!container) return;
    const target = scrollTopForIndex(index);

    // Kill any in-flight tween before starting a new one.
    if (snapTweenRef.current) {
      snapTweenRef.current.kill();
      snapTweenRef.current = null;
    }

    if (instant || prefersReducedMotion) {
      container.scrollTop = target;
      return;
    }

    snapTweenRef.current = gsap.to(container, {
      scrollTop: target,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => { snapTweenRef.current = null; },
    });
  }, [scrollTopForIndex, prefersReducedMotion]);

  // Compute each chapter's distance from the focus line and update its color.
  // Also tracks which row of COPY 0 is closest to the focus line as the
  // activeIndex (since chapters duplicate, we pick the active row from copy 0
  // for ARIA purposes; the duplicate's row at the same chapter index also
  // receives the ink color so the visual is consistent).
  const updateFocusColors = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const focusY = containerRect.top + containerRect.height / 2;
    const fadeDistance = parseFloat(
      getComputedStyle(container).getPropertyValue('--focus-line-fade-distance'),
    ) || 140;

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let copy = 0; copy < 3; copy += 1) {
      const rows = itemRefs.current[copy];
      if (!rows) continue;
      for (let i = 0; i < rows.length; i += 1) {
        const item = rows[i];
        if (!item) continue;
        const rect = item.getBoundingClientRect();
        const itemCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(itemCenterY - focusY);

        // 0 = at focus line; 1 = at or beyond fadeDistance.
        const t = Math.min(1, distance / fadeDistance);

        if (prefersReducedMotion) {
          item.style.color = t < 0.5 ? 'var(--color-ink)' : 'var(--color-ghost)';
        } else {
          // Smooth crossfade between ink (t=0) and ghost (t=1).
          // --color-ink = #111111, --color-ghost = #C7C7C7.
          const r = Math.round(0x11 + (0xC7 - 0x11) * t);
          const g = Math.round(0x11 + (0xC7 - 0x11) * t);
          const b = Math.round(0x11 + (0xC7 - 0x11) * t);
          item.style.color = `rgb(${r}, ${g}, ${b})`;
        }

        if (copy === 0 && distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      }
    }

    setActiveIndex((prev) => (prev === closestIndex ? prev : closestIndex));
  }, [prefersReducedMotion]);

  // Wrap scrollTop when it crosses the boundary between copy 0 and copy 1.
  // The list contains two identical copies stacked vertically. We treat the
  // "canonical" scroll range as [0, copyHeight); whenever scrollTop falls
  // outside that range we add or subtract one copyHeight to bring it back.
  //
  // This keeps an infinite-cycle illusion. When the user (or the auto-scroll
  // tween) reaches the end of copy 1, we instantly snap back into copy 0.
  const wrapScrollIfNeeded = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    let h = copyHeightRef.current;
    if (!h) h = measureCopyHeight();
    if (!h) return false;

    // Wrap as soon as scrollTop crosses one copy-height. With small chapter
    // lists (12 items × ~50px ≈ 600px) and tall viewports (~900px), waiting
    // for scrollTop >= 2h means the wrap never fires — the chapter wheel
    // reads as having a hard end. Wrapping at h guarantees a seamless loop
    // because copy 1 is pixel-identical to copy 0.
    if (container.scrollTop >= h) {
      container.scrollTop -= h;
      return true;
    }
    if (container.scrollTop < 0) {
      container.scrollTop += h;
      return true;
    }
    return false;
  }, [measureCopyHeight]);

  // ===== Auto-scroll lifecycle =====

  // Kill any running auto-scroll tween. Safe to call repeatedly.
  const killAutoScroll = useCallback(() => {
    if (autoTweenRef.current) {
      autoTweenRef.current.kill();
      autoTweenRef.current = null;
    }
  }, []);

  // Start the slow auto-scroll tween in the most-recent user direction.
  //
  // The tween is a sequence of single-cycle (one copyHeight) linear sweeps.
  // After each sweep completes, we wrap scrollTop (subtract or add one
  // copyHeight to bring it back into the canonical [0, copyHeight) range)
  // and immediately launch the next sweep. The wrap is invisible because
  // copy 1 is pixel-identical to copy 0 — the user only sees endless drift.
  const startAutoScroll = useCallback(() => {
    if (prefersReducedMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let h = copyHeightRef.current;
    if (!h) h = measureCopyHeight();
    if (!h) return; // can't auto-scroll if we can't measure

    killAutoScroll();

    const speed = tokensRef.current.speed;
    const dir = lastDirectionRef.current >= 0 ? 1 : -1;
    const duration = h / speed; // seconds per single-cycle sweep

    // Recursive helper: launch one sweep, wrap on complete, launch the next.
    const launchSweep = () => {
      if (!containerRef.current) return;
      // Snap to canonical range before the sweep so we always have h pixels
      // of runway in the direction of motion.
      wrapScrollIfNeeded();
      const end = containerRef.current.scrollTop + dir * h;
      autoTweenRef.current = gsap.to(containerRef.current, {
        scrollTop: end,
        duration,
        ease: 'linear',
        onComplete: () => {
          autoTweenRef.current = null;
          launchSweep();
        },
      });
    };

    launchSweep();
  }, [prefersReducedMotion, killAutoScroll, measureCopyHeight, wrapScrollIfNeeded]);

  // Reschedule the idle timer. Called from every user-input event.
  const armIdleTimer = useCallback(() => {
    if (prefersReducedMotion) return;
    if (idleTimerRef.current != null) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null;
      startAutoScroll();
    }, tokensRef.current.idleMs);
  }, [prefersReducedMotion, startAutoScroll]);

  // Handle a user-input event: record direction (if available), kill any
  // running auto-scroll, and re-arm the idle timer.
  const handleUserInput = useCallback((direction) => {
    if (prefersReducedMotion) return;
    hasUserInteractedRef.current = true;
    if (direction != null && direction !== 0) {
      lastDirectionRef.current = direction > 0 ? 1 : -1;
    }
    killAutoScroll();
    armIdleTimer();
  }, [prefersReducedMotion, killAutoScroll, armIdleTimer]);

  // Throttled scroll handler — drives focus colors AND wraps scrollTop.
  const onScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      wrapScrollIfNeeded();
      updateFocusColors();
    });
  }, [updateFocusColors, wrapScrollIfNeeded]);

  // ===== Setup effects =====

  // Initial setup: snap to the initial chapter, measure copy height, paint colors.
  useEffect(() => {
    // Reset itemRefs length to current chapters length (all three copies).
    itemRefs.current[0] = itemRefs.current[0].slice(0, chapters.length);
    itemRefs.current[1] = itemRefs.current[1].slice(0, chapters.length);
    itemRefs.current[2] = itemRefs.current[2].slice(0, chapters.length);
    // Defer to next frame so layout has settled (fonts, etc.).
    const id = requestAnimationFrame(() => {
      measureCopyHeight();
      scrollToIndex(initialIndex, { instant: true });
      updateFocusColors();
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSlug, initialChapterSlug]);

  // Read CSS tokens once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const styles = getComputedStyle(container);
    const speed = parseFloat(styles.getPropertyValue('--chapter-autoscroll-speed'));
    const idleMs = parseFloat(styles.getPropertyValue('--chapter-autoscroll-idle-ms'));
    const wm = parseFloat(styles.getPropertyValue('--chapter-wheel-multiplier'));
    if (!Number.isNaN(speed) && speed > 0) tokensRef.current.speed = speed;
    if (!Number.isNaN(idleMs) && idleMs > 0) tokensRef.current.idleMs = idleMs;
    if (!Number.isNaN(wm) && wm > 0) tokensRef.current.wheelMultiplier = wm;
  }, []);

  // Kick off the auto-scroll loop on mount (no user interaction required).
  // Defer one frame so copyHeight has been measured.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const id = requestAnimationFrame(() => {
      // Default direction: drift down.
      lastDirectionRef.current = 1;
      startAutoScroll();
    });
    return () => cancelAnimationFrame(id);
  }, [prefersReducedMotion, startAutoScroll]);

  // Keep activeIndexRef in sync.
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Wire all listeners.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    // Scroll: drives focus colors + wrap.
    container.addEventListener('scroll', onScroll, { passive: true });

    // User-input signals — direction-aware where possible. These trigger
    // auto-scroll cancel and idle-timer re-arm.
    const onWheel = (e) => {
      // Intercept the wheel event so we can apply the wheel-multiplier
      // (manual scroll sensitivity, default 0.5 = half speed). We then
      // drive scrollTop manually.
      e.preventDefault();
      const mult = tokensRef.current.wheelMultiplier;
      container.scrollTop += e.deltaY * mult;
      handleUserInput(e.deltaY);
    };

    // Touch: track Y delta between consecutive moves to infer direction.
    let lastTouchY = null;
    const onTouchStart = (e) => {
      if (e.touches && e.touches[0]) lastTouchY = e.touches[0].clientY;
      handleUserInput(0); // no direction yet; just kill autoscroll + arm timer
    };
    const onTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const y = e.touches[0].clientY;
      const dy = lastTouchY == null ? 0 : (lastTouchY - y);
      lastTouchY = y;
      handleUserInput(dy); // dy > 0 means finger moved up → scroll down
    };
    const onTouchEnd = () => {
      lastTouchY = null;
      // Re-arm timer (idle starts ticking from touch end)
      armIdleTimer();
    };

    const onKeyDownInput = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End') {
        handleUserInput(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home') {
        handleUserInput(-1);
      }
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('keydown', onKeyDownInput);

    // Resize: recompute copy height and reposition active chapter.
    const onResize = () => {
      measureCopyHeight();
      scrollToIndex(activeIndexRef.current, { instant: true });
      updateFocusColors();
    };
    window.addEventListener('resize', onResize);

    // Repaint after fonts settle.
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measureCopyHeight();
        scrollToIndex(activeIndexRef.current, { instant: true });
        updateFocusColors();
      });
    }

    return () => {
      container.removeEventListener('scroll', onScroll);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('keydown', onKeyDownInput);
      window.removeEventListener('resize', onResize);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (snapTweenRef.current) {
        snapTweenRef.current.kill();
        snapTweenRef.current = null;
      }
      if (autoTweenRef.current) {
        autoTweenRef.current.kill();
        autoTweenRef.current = null;
      }
      if (idleTimerRef.current != null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScroll, handleUserInput, armIdleTimer]);

  const handleChapterClick = useCallback((index) => {
    handleUserInput(0);
    const target = chapters[index];
    if (!target) return;

    const node = itemRefs.current[0]?.[index];

    if (prefersReducedMotion || !node) {
      navigate(`/chapter/${target.slug}`);
      return;
    }

    // Kill in-flight tweens so the zoom does not fight the auto-scroll.
    // We intentionally do NOT snap-scroll the row first — that pulls the
    // chapter sideways and reads as jitter. The zoom scales in place from
    // its current position; the chapter-detail page picks up the motion
    // from there and carries it to the top-left.
    gsap.killTweensOf(node);
    if (autoTweenRef.current) {
      autoTweenRef.current.kill();
      autoTweenRef.current = null;
    }

    // Fade the rest of the home (wordmark + rails + title + the chapter
    // wheel itself) toward bg while the clicked row briefly holds — gives a
    // beat of stillness before the transition.
    const fadeTargets = [
      '.home__wordmark',
      '.home__top-left',
      '.home__bottom-left',
      '.home__year',
      '.home__title',
    ];

    const tl = gsap.timeline({
      onComplete: () => navigate(`/chapter/${target.slug}`),
    });

    // Phase 1 (parallel): clicked row scales up slightly, everything else
    // fades to bg. A short hold at the end of the fade gives the user a beat
    // before the new page loads.
    tl.to(node, {
      scale: 1.25,
      duration: 0.55,
      ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      transformOrigin: 'left center',
      force3D: true,
    }, 0);
    tl.to(fadeTargets, {
      opacity: 0,
      duration: 0.5,
      ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
    }, 0);
    tl.to('.chapter-column', {
      opacity: 0,
      duration: 0.55,
      ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
    }, 0.1);
    // Hold beat: 200ms of stillness on the faded screen before navigating.
    tl.to({}, { duration: 0.2 });
  }, [chapters, navigate, handleUserInput, prefersReducedMotion]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleUserInput(1);
      const next = Math.min(chapters.length - 1, activeIndex + 1);
      scrollToIndex(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleUserInput(-1);
      const prev = Math.max(0, activeIndex - 1);
      scrollToIndex(prev);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleChapterClick(activeIndex);
    } else if (e.key === 'Home') {
      e.preventDefault();
      handleUserInput(-1);
      scrollToIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      handleUserInput(1);
      scrollToIndex(chapters.length - 1);
    }
  }, [activeIndex, chapters.length, handleChapterClick, scrollToIndex, handleUserInput]);

  return (
    <div
      ref={containerRef}
      className="chapter-column"
      role="listbox"
      aria-label="Chapters"
      aria-activedescendant={`chapter-row-${chapters[activeIndex]?.slug ?? ''}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-anim="chapter-column"
    >
      {/* Spacers removed: chapter wheel is now a true infinite loop. The
          initial focus position is set via scrollTopForIndex(0) which wraps
          into the canonical [0, copyHeight) range. */}

      <div className="chapter-column__lists">
        {/* Copy 0 — the primary list. Used for activeIndex tracking and ARIA. */}
        <ul
          ref={(el) => { copyRefs.current[0] = el; }}
          className="chapter-column__list"
        >
          {chapters.map((chapter, i) => (
            <li
              key={`copy0-${chapter.slug}`}
              ref={(el) => { itemRefs.current[0][i] = el; }}
              id={`chapter-row-${chapter.slug}`}
              role="option"
              aria-selected={i === activeIndex}
              className={
                `chapter-column__item${
                  i === activeIndex ? ' chapter-column__item--focus' : ''
                }`
              }
            >
              <button
                type="button"
                className="chapter-column__button"
                onClick={() => handleChapterClick(i)}
                tabIndex={-1}
              >
                {`${i + 1}. ${chapter.name}`}
              </button>
            </li>
          ))}
        </ul>

        {/* Copy 1 — duplicate for wrap. aria-hidden because copy 0 already
            announces the chapter list. */}
        <ul
          ref={(el) => { copyRefs.current[1] = el; }}
          className="chapter-column__list"
          aria-hidden="true"
        >
          {chapters.map((chapter, i) => (
            <li
              key={`copy1-${chapter.slug}`}
              ref={(el) => { itemRefs.current[1][i] = el; }}
              className="chapter-column__item"
            >
              <button
                type="button"
                className="chapter-column__button"
                onClick={() => handleChapterClick(i)}
                tabIndex={-1}
              >
                {`${i + 1}. ${chapter.name}`}
              </button>
            </li>
          ))}
        </ul>

        {/* Copy 2 — second duplicate. Needed so total scrollHeight exceeds
            (copyHeight + clientHeight); without it the browser's native scroll
            limit is reached before the wrap can fire. */}
        <ul
          ref={(el) => { copyRefs.current[2] = el; }}
          className="chapter-column__list"
          aria-hidden="true"
        >
          {chapters.map((chapter, i) => (
            <li
              key={`copy2-${chapter.slug}`}
              ref={(el) => { itemRefs.current[2][i] = el; }}
              className="chapter-column__item"
            >
              <button
                type="button"
                className="chapter-column__button"
                onClick={() => handleChapterClick(i)}
                tabIndex={-1}
              >
                {`${i + 1}. ${chapter.name}`}
              </button>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
