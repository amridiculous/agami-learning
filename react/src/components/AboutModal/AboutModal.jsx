import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

import useEscapeKey from '../../hooks/useEscapeKey.js';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';
import { createFocusTrap } from '../../lib/focusTrap.js';
import { owner } from '../../data/topics.js';

import './AboutModal.css';

/**
 * AboutModal — full-viewport overlay. Open via GSAP timeline (scale +
 * clip-path + opacity), origin anchored to the triggering button via
 * getBoundingClientRect. Reduced motion / mobile fall back to scale+opacity
 * only (clip-path is computed but not animated).
 *
 * Close behaviour: clicking ANYWHERE on the modal backdrop (outside the
 * panel) closes the modal. No explicit close button. Esc key also closes.
 * A custom CSS cursor label "Close ×" follows the mouse over the backdrop.
 */
export default function AboutModal({ open, onClose, triggerRef, prefersReducedMotion = false }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const cursorLabelRef = useRef(null);
  const releaseTrapRef = useRef(null);
  // First focusable element inside the panel — used as initial focus target.
  const firstFocusRef = useRef(null);

  // Anchor point in viewport % for the clip-path origin.
  const [anchor, setAnchor] = useState({ xPct: 8, yPct: 90 });
  // Mirrored ref so the open/close GSAP effect can read the live anchor
  // without listing anchor.xPct/yPct in its deps (CR-3).
  const anchorRef = useRef({ xPct: 8, yPct: 90 });
  useEffect(() => {
    anchorRef.current = anchor;
  }, [anchor]);

  // Track whether the modal is mounted (open) and whether to render at all.
  const [shouldRender, setShouldRender] = useState(open);

  // Track desktop (clip-path enabled) vs. mobile (scale + opacity only).
  const [clipPathEnabled, setClipPathEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mql = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => setClipPathEnabled(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  // Compute clip-path origin from the trigger's position. Recompute on resize.
  const computeAnchor = useCallback(() => {
    const trigger = triggerRef && triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;
    const rect = trigger.getBoundingClientRect();
    const xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    setAnchor({ xPct, yPct });
  }, [triggerRef]);

  // Compute on open; update on resize while open.
  useEffect(() => {
    if (!open) return undefined;
    computeAnchor();
    window.addEventListener('resize', computeAnchor);
    return () => window.removeEventListener('resize', computeAnchor);
  }, [open, computeAnchor]);

  // Mount/unmount management — keep in DOM during close animation.
  useEffect(() => {
    if (open) setShouldRender(true);
  }, [open]);

  // Body scroll lock while open.
  useBodyScrollLock(open);

  // Esc closes.
  const handleEsc = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleEsc, open);

  // Any click anywhere on the modal closes it.
  const handleBackdropClick = useCallback(() => onClose(), [onClose]);

  // Custom cursor label follows the mouse over the backdrop. Hidden when the
  // pointer leaves the backdrop (mouseleave parks it off-screen).
  const handleMouseMove = useCallback((e) => {
    if (!cursorLabelRef.current) return;
    const t = e.target;
    const overInteractive = t && t.closest && t.closest('a, button, input, textarea, label');
    if (overInteractive) {
      cursorLabelRef.current.style.left = '-9999px';
      cursorLabelRef.current.style.top = '-9999px';
      return;
    }
    cursorLabelRef.current.style.left = `${e.clientX}px`;
    cursorLabelRef.current.style.top = `${e.clientY}px`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cursorLabelRef.current) return;
    cursorLabelRef.current.style.left = '-9999px';
    cursorLabelRef.current.style.top = '-9999px';
  }, []);

  // Wire up the mousemove + mouseleave listeners only while the modal is rendered.
  useEffect(() => {
    if (!shouldRender) return undefined;
    const backdrop = backdropRef.current;
    if (!backdrop) return undefined;
    backdrop.addEventListener('mousemove', handleMouseMove);
    backdrop.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      backdrop.removeEventListener('mousemove', handleMouseMove);
      backdrop.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [shouldRender, handleMouseMove, handleMouseLeave]);

  // Document-level click: clicking ANYWHERE on the page closes the modal —
  // including the strip to the left of the modal (0..18vw) that the backdrop
  // does not cover. Links inside the panel call stopPropagation so this
  // listener doesn't fire on them.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = () => onClose();
    // Defer one tick so the click that opened the modal doesn't immediately close it.
    const id = window.setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', onDocClick);
    };
  }, [open, onClose]);

  // Focus trap activation/release synced with the open state.
  useEffect(() => {
    if (!open) return undefined;
    if (!panelRef.current) return undefined;
    releaseTrapRef.current = createFocusTrap(panelRef.current, {
      initialFocus: firstFocusRef.current,
    });
    return () => {
      if (releaseTrapRef.current) {
        releaseTrapRef.current();
        releaseTrapRef.current = null;
      }
    };
  }, [open]);

  // Open / close GSAP timeline.
  useEffect(() => {
    if (!shouldRender) return undefined;
    if (!backdropRef.current || !panelRef.current) return undefined;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;

    // Reduced motion: skip animation, jump to end state on open / end on close.
    if (prefersReducedMotion) {
      if (open) {
        gsap.set(backdrop, { opacity: 1, clipPath: 'circle(150% at 50% 50%)' });
        gsap.set(panel, { opacity: 1, scale: 1 });
      } else {
        // Close instantly: unmount on next tick.
        setShouldRender(false);
      }
      return undefined;
    }

    // Read the anchor live via ref at the moment the effect runs.
    const a = anchorRef.current;

    const ctx = gsap.context(() => {
      if (open) {
        const clipFrom = clipPathEnabled
          ? `circle(0% at ${a.xPct}% ${a.yPct}%)`
          : 'circle(150% at 50% 50%)';
        const clipTo = `circle(150% at ${a.xPct}% ${a.yPct}%)`;

        gsap.set(backdrop, { opacity: 0, clipPath: clipFrom });
        gsap.set(panel, { opacity: 0, scale: 0.95 });

        const tl = gsap.timeline();
        tl.to(backdrop, {
          opacity: 1,
          duration: 0.5,
          ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }, 0)
          .to(backdrop, {
            clipPath: clipTo,
            duration: 0.5,
            ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }, 0)
          .to(panel, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }, 0.1);
      } else {
        const clipTo = clipPathEnabled
          ? `circle(0% at ${a.xPct}% ${a.yPct}%)`
          : 'circle(150% at 50% 50%)';

        const tl = gsap.timeline({
          onComplete: () => setShouldRender(false),
        });
        tl.to(panel, {
          opacity: 0,
          scale: 0.95,
          duration: 0.3,
          ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
        }, 0).to(backdrop, {
          opacity: 0,
          clipPath: clipTo,
          duration: 0.3,
          ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
        }, 0);
      }
    }, backdropRef);

    return () => ctx.revert();
    // Anchor is intentionally NOT in the deps array (CR-3).
  }, [open, shouldRender, prefersReducedMotion, clipPathEnabled]);

  if (!shouldRender) return null;

  return (
    <div
      ref={backdropRef}
      className="about-modal"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {/* Custom cursor label — follows the mouse, hidden on touch devices via CSS */}
      <div
        ref={cursorLabelRef}
        className="about-modal__cursor-label"
        aria-hidden="true"
      >
        Close ×
      </div>

      <div
        ref={panelRef}
        className="about-modal__panel"
        id="about-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-modal-title"
      >
        {/* Left column — structured content */}
        <div className="about-modal__content">
          <h2 id="about-modal-title" className="about-modal__title">About</h2>

          {/* Intro */}
          <div className="about-modal__section">
            {owner.bio.map((paragraph, i) => (
              <p key={`bio-p${i}`} className="about-modal__paragraph">{paragraph}</p>
            ))}
            <span className="about-modal__rule" aria-hidden="true" />
          </div>

          {/* Roster */}
          <div className="about-modal__section">
            <h3 className="about-modal__section-heading">Roster</h3>
            <ul className="about-modal__plain-list about-modal__two-col">
              {owner.roster.map((person) => (
                <li key={person.name} className="about-modal__plain-item">
                  {person.name}
                </li>
              ))}
            </ul>
            <span className="about-modal__rule" aria-hidden="true" />
          </div>

          {/* Topics */}
          <div className="about-modal__section">
            <h3 className="about-modal__section-heading">Topics</h3>
            <ul className="about-modal__plain-list about-modal__two-col">
              {owner.services.flatMap((service) =>
                service.items.map((item) => (
                  <li key={item} className="about-modal__plain-item">{item}</li>
                ))
              )}
            </ul>
            <span className="about-modal__rule" aria-hidden="true" />
          </div>

          {/* Technologies */}
          <div className="about-modal__section">
            <h3 className="about-modal__section-heading">Technologies</h3>
            <div className="about-modal__two-col">
              <ul className="about-modal__plain-list">
                {owner.technologies.left.map((item) => (
                  <li key={item} className="about-modal__plain-item">{item}</li>
                ))}
              </ul>
              <ul className="about-modal__plain-list">
                {owner.technologies.right.map((item) => (
                  <li key={item} className="about-modal__plain-item">{item}</li>
                ))}
              </ul>
            </div>
            <span className="about-modal__rule" aria-hidden="true" />
          </div>

          {/* Specialties */}
          <div className="about-modal__section">
            <h3 className="about-modal__section-heading">Specialties</h3>
            <div className="about-modal__two-col">
              <ul className="about-modal__plain-list">
                {owner.specialties.left.map((item) => (
                  <li key={item} className="about-modal__plain-item">{item}</li>
                ))}
              </ul>
              <ul className="about-modal__plain-list">
                {owner.specialties.right.map((item) => (
                  <li key={item} className="about-modal__plain-item">{item}</li>
                ))}
              </ul>
            </div>
            <span className="about-modal__rule" aria-hidden="true" />
          </div>

          {/* Collaborators */}
          <div className="about-modal__section">
            <h3 className="about-modal__section-heading">Collaborators</h3>
            <ul className="about-modal__plain-list about-modal__two-col">
              {owner.collaborators.map((name) => (
                <li key={name} className="about-modal__plain-item">{name}</li>
              ))}
            </ul>
            <span className="about-modal__rule" aria-hidden="true" />
          </div>

          {/* Links */}
          <div className="about-modal__section">
            <ul className="about-modal__links">
              <li>
                <a
                  ref={firstFocusRef}
                  className="about-modal__link"
                  href={owner.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  className="about-modal__link"
                  href={owner.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Right column — portrait */}
        <div className="about-modal__portrait">
          <img
            className="about-modal__portrait-img"
            src="https://images.unsplash.com/photo-1726731819364-3b387afc6beb?fm=jpg&q=80&w=1800&auto=format&fit=crop"
            alt="Amrit Das"
          />
        </div>
      </div>
    </div>
  );
}
