import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';

import useEscapeKey from '../../hooks/useEscapeKey.js';
import useBodyScrollLock from '../../hooks/useBodyScrollLock.js';
import { createFocusTrap } from '../../lib/focusTrap.js';
import { owner } from '../../data/topics.js';

import './ContactModal.css';

const OWNER_EMAIL = 'amritcompaq09@gmail.com';

/**
 * ContactModal — full-viewport overlay, mirrors AboutModal structure.
 *
 * Layout (left: 18vw → right edge):
 *   Left column — LinkedIn + GitHub links + heading.
 *   Right column — short message form: textarea + send button. Submitting
 *   opens the user's default mail client via `mailto:` with the message
 *   pre-filled.
 *
 * Behaviour: click anywhere on the page closes (mirrors About). Custom
 * "Close ×" cursor follows the mouse over the modal area only.
 */
export default function ContactModal({ open, onClose, triggerRef, prefersReducedMotion = false }) {
  const backdropRef = useRef(null);
  const panelRef = useRef(null);
  const cursorLabelRef = useRef(null);
  const releaseTrapRef = useRef(null);
  const firstFocusRef = useRef(null);
  const textareaRef = useRef(null);

  const [shouldRender, setShouldRender] = useState(open);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailValid = EMAIL_RE.test(email.trim());
  const messageValid = message.trim().length >= 2;
  const canSend = emailValid && messageValid;

  const [anchor, setAnchor] = useState({ xPct: 8, yPct: 90 });
  const anchorRef = useRef({ xPct: 8, yPct: 90 });
  useEffect(() => { anchorRef.current = anchor; }, [anchor]);

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

  const computeAnchor = useCallback(() => {
    const trigger = triggerRef && triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;
    const rect = trigger.getBoundingClientRect();
    const xPct = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    const yPct = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
    setAnchor({ xPct, yPct });
  }, [triggerRef]);

  useEffect(() => {
    if (!open) return undefined;
    computeAnchor();
    window.addEventListener('resize', computeAnchor);
    return () => window.removeEventListener('resize', computeAnchor);
  }, [open, computeAnchor]);

  useEffect(() => { if (open) setShouldRender(true); }, [open]);

  useBodyScrollLock(open);

  const handleEsc = useCallback(() => onClose(), [onClose]);
  useEscapeKey(handleEsc, open);

  // Cursor label follows pointer; parks off-screen on mouseleave. Also hides
  // when the pointer is over an interactive element (link, button, textarea,
  // input) — in those zones the native cursor takes over.
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

  // Document-level click closes the modal (mirrors About).
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = () => onClose();
    const id = window.setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('click', onDocClick);
    };
  }, [open, onClose]);

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

  // Open/close timeline (mirror AboutModal).
  useEffect(() => {
    if (!shouldRender) return undefined;
    if (!backdropRef.current || !panelRef.current) return undefined;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;

    if (prefersReducedMotion) {
      if (open) {
        gsap.set(backdrop, { opacity: 1, clipPath: 'none' });
        gsap.set(panel, { opacity: 1, yPercent: 0 });
      } else {
        setShouldRender(false);
      }
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(backdrop, { clipPath: 'none' });
      if (open) {
        gsap.set(backdrop, { opacity: 0 });
        gsap.set(panel, { opacity: 1, yPercent: 100 });

        const tl = gsap.timeline();
        tl.to(backdrop, { opacity: 1, duration: 0.4, ease: 'cubic-bezier(0.22, 1, 0.36, 1)' }, 0)
          .to(panel, { yPercent: 0, duration: 0.6, ease: 'cubic-bezier(0.22, 1, 0.36, 1)' }, 0);
      } else {
        const tl = gsap.timeline({ onComplete: () => setShouldRender(false) });
        tl.to(panel, { yPercent: 100, duration: 0.45, ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)' }, 0)
          .to(backdrop, { opacity: 0, duration: 0.45, ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)' }, 0.05);
      }
    }, backdropRef);

    return () => ctx.revert();
  }, [open, shouldRender, prefersReducedMotion]);

  const handleSend = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canSend) return;
    const body = encodeURIComponent(`${message.trim()}\n\nFrom: ${email.trim()}`);
    const subject = encodeURIComponent('Hello Amrit');
    window.location.href = `mailto:${OWNER_EMAIL}?subject=${subject}&body=${body}`;
  }, [message, email, canSend]);

  if (!shouldRender) return null;

  return (
    <div
      ref={backdropRef}
      className="contact-modal"
      onClick={() => onClose()}
      role="presentation"
    >
      <div
        ref={cursorLabelRef}
        className="contact-modal__cursor-label"
        aria-hidden="true"
      >
        Close ×
      </div>

      <div
        ref={panelRef}
        className="contact-modal__panel"
        id="contact-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left column — links */}
        <div className="contact-modal__content">
          <h2 id="contact-modal-title" className="contact-modal__title">Contact</h2>

          <div className="contact-modal__section">
            <h3 className="contact-modal__section-heading">Links</h3>
            <ul className="contact-modal__links">
              <li>
                <a
                  ref={firstFocusRef}
                  className="contact-modal__link"
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
                  className="contact-modal__link"
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

        {/* Right column — message form */}
        <form
          className="contact-modal__form"
          onSubmit={handleSend}
          onClick={(e) => e.stopPropagation()}
        >
          <label className="contact-modal__form-label" htmlFor="contact-email">
            Your email
          </label>
          <input
            id="contact-email"
            type="email"
            required
            className="contact-modal__input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            aria-invalid={email.length > 0 && !emailValid}
          />

          <label className="contact-modal__form-label" htmlFor="contact-message">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="contact-message"
            className="contact-modal__textarea"
            placeholder="Write your message (min 2 chars)…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            required
            minLength={2}
            aria-invalid={message.length > 0 && !messageValid}
          />
          <button
            type="submit"
            className="contact-modal__send"
            disabled={!canSend}
          >
            Send →
          </button>
        </form>
      </div>
    </div>
  );
}
