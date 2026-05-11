import { useRef, useState, useCallback, useEffect } from 'react';

import AboutModal from '../AboutModal/AboutModal.jsx';
import ContactModal from '../ContactModal/ContactModal.jsx';

import './ActionStack.css';

/**
 * ActionStack — bottom-left rail. Hosts the About + and Contact + triggers
 * and mounts the corresponding modal components when open.
 */
export default function ActionStack({ prefersReducedMotion = false, onModalChange }) {
  const aboutTriggerRef = useRef(null);
  const contactTriggerRef = useRef(null);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Notify parent when either modal opens or closes.
  useEffect(() => {
    if (onModalChange) onModalChange(aboutOpen || contactOpen);
  }, [aboutOpen, contactOpen, onModalChange]);

  // Opening either modal dismisses the other so they swap cleanly when the
  // user taps the opposite trigger while one is already open. The bottom-left
  // rail sits above the modal stack via z-index (see Home.css / ActionStack.css),
  // so the triggers remain clickable while a modal is open.
  const openAbout = useCallback(() => {
    setContactOpen(false);
    setAboutOpen(true);
  }, []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const openContact = useCallback(() => {
    setAboutOpen(false);
    setContactOpen(true);
  }, []);
  const closeContact = useCallback(() => setContactOpen(false), []);

  return (
    <div className="action-stack">
      <div className="action-stack__item">
        <button
          ref={aboutTriggerRef}
          type="button"
          className="action-stack__trigger"
          aria-haspopup="dialog"
          aria-expanded={aboutOpen}
          aria-controls="about-modal"
          onClick={openAbout}
          data-anim="label"
        >
          About +
        </button>
      </div>

      <div className="action-stack__item">
        <button
          ref={contactTriggerRef}
          type="button"
          className="action-stack__trigger"
          aria-haspopup="dialog"
          aria-expanded={contactOpen}
          aria-controls="contact-modal"
          onClick={openContact}
          data-anim="label"
        >
          Contact +
        </button>
      </div>

      <AboutModal
        open={aboutOpen}
        onClose={closeAbout}
        triggerRef={aboutTriggerRef}
        prefersReducedMotion={prefersReducedMotion}
      />

      <ContactModal
        open={contactOpen}
        onClose={closeContact}
        triggerRef={contactTriggerRef}
        prefersReducedMotion={prefersReducedMotion}
      />
    </div>
  );
}
