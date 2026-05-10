import { useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useParams, useNavigate, Link } from 'react-router-dom';

import { topicGroups } from '../../data/topics.js';
import useReducedMotion from '../../hooks/useReducedMotion.js';
import ActionStack from '../../components/ActionStack/ActionStack.jsx';

import './ChapterDetail.css';

/**
 * ChapterDetail — full-page chapter view at /chapter/:slug.
 *
 * Entry animation (smooth, slow, elite-feeling):
 *   1. On mount the chapter title is rendered very large, centered on the
 *      viewport (scale matches the focused chapter in ChapterColumn so the
 *      hand-off from the home page feels continuous).
 *   2. After a short hold the title eases (1) down in scale and (2) to the
 *      top-left of the page where it stays — a single FLIP-style transform
 *      that reads as one continuous motion.
 *   3. The sub-headings and body fade in below once the title has settled.
 *
 * Exit (click "← back") simply navigates home; the next page handles its
 * own reveal stagger.
 */
export default function ChapterDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const containerRef = useRef(null);
  const titleRef = useRef(null);

  // Find which group + chapter the slug belongs to.
  const found = useMemo(() => {
    for (const group of topicGroups) {
      const idx = group.chapters.findIndex((c) => c.slug === slug);
      if (idx >= 0) {
        return { group, chapter: group.chapters[idx], index: idx };
      }
    }
    return null;
  }, [slug]);

  // Unknown slug → bounce home.
  useEffect(() => {
    if (!found) navigate('/', { replace: true });
  }, [found, navigate]);

  // Set the initial transform BEFORE the browser paints. Using useEffect
  // here lets the title render briefly at its docked position which reads as
  // a one-frame jump and makes the whole motion feel choppy.
  useLayoutEffect(() => {
    if (!found) return;
    if (!titleRef.current || !containerRef.current) return;
    if (prefersReducedMotion) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.set(titleRef.current, { x: 0, y: 0, scale: 1 });
      gsap.set('[data-anim="cd-section"]', { opacity: 1, y: 0 });
      return;
    }

    const titleRect = titleRef.current.getBoundingClientRect();
    const finalCenterX = titleRect.left + titleRect.width / 2;
    const finalCenterY = titleRect.top + titleRect.height / 2;

    const startCenterX = window.innerWidth * 0.75;
    const startCenterY = window.innerHeight * 0.5;

    // Whole page starts at opacity 0 (so the load reads as a fade-in
    // continuation of the home page's fade-out).
    gsap.set(containerRef.current, { opacity: 0 });
    gsap.set(titleRef.current, {
      x: startCenterX - finalCenterX,
      y: startCenterY - finalCenterY,
      scale: 1.25,
      opacity: 1,
      transformOrigin: 'left center',
      force3D: true,
    });
    gsap.set('[data-anim="cd-section"]', { opacity: 0, y: 24 });
  }, [found, prefersReducedMotion, slug]);

  useEffect(() => {
    if (!found) return undefined;
    if (!titleRef.current || !containerRef.current) return undefined;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      // Page fades in to mirror the home page's fade-out.
      tl.to(containerRef.current, {
        opacity: 1,
        duration: 0.45,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }, 0);
      // Title arc — one continuous transform from start position to docked.
      tl.to(titleRef.current, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 1.4,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }, 0.1);
      // Body sections cascade in while the title is still decelerating.
      tl.to('[data-anim="cd-section"]', {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
        stagger: 0.1,
      }, 0.65);
    }, containerRef);

    return () => ctx.revert();
  }, [found, prefersReducedMotion, slug]);

  if (!found) return null;

  const { chapter, index } = found;
  const serial = String(index + 1).padStart(2, '0');

  return (
    <div ref={containerRef} className="chapter-detail">
      {/* Wordmark — same as home, kept fixed at top-centre. */}
      <div className="chapter-detail__wordmark" aria-hidden="true">
        <span className="chapter-detail__wordmark-ink">a</span>
        <span className="chapter-detail__wordmark-grey">g</span>
        <span className="chapter-detail__wordmark-grey">a</span>
        <span className="chapter-detail__wordmark-grey">m</span>
        <span className="chapter-detail__wordmark-ink">i</span>
      </div>

      {/* Back link — top-left rail, replaces topic rail. */}
      <div className="chapter-detail__back">
        <Link to="/" className="chapter-detail__back-link">← Back</Link>
      </div>

      <div className="chapter-detail__year" aria-hidden="true">
        {new Date().getFullYear()}
      </div>

      <div className="chapter-detail__content">
        <div className="chapter-detail__title-row">
          <span className="chapter-detail__serial">{serial}</span>
          <h1 ref={titleRef} className="chapter-detail__title">
            {chapter.name}
          </h1>
        </div>

        <section className="chapter-detail__section" data-anim="cd-section">
          <h2 className="chapter-detail__section-heading">Overview</h2>
          {chapter.body.split('\n\n').map((para, i) => (
            <p key={i} className="chapter-detail__body">{para}</p>
          ))}
        </section>

        <section className="chapter-detail__section" data-anim="cd-section">
          <h2 className="chapter-detail__section-heading">How it works</h2>
          <p className="chapter-detail__body">
            Placeholder. Detailed mechanics, intuition, and a worked example
            go here — written from first principles, in the same peer-to-peer
            voice as the rest of the site.
          </p>
        </section>

        <section className="chapter-detail__section" data-anim="cd-section">
          <h2 className="chapter-detail__section-heading">Example</h2>
          <div className="chapter-detail__placeholder">
            <span>Example illustration / code snippet — to be added.</span>
          </div>
        </section>

        <section className="chapter-detail__section" data-anim="cd-section">
          <h2 className="chapter-detail__section-heading">Why it matters</h2>
          <p className="chapter-detail__body">
            Placeholder. Where this concept earns its keep in a real system —
            the trade-offs, the failure modes, and the moments it changes a
            production decision.
          </p>
        </section>
      </div>

      {/* ActionStack mounted so About + Contact remain reachable. */}
      <div className="chapter-detail__action-stack">
        <ActionStack prefersReducedMotion={prefersReducedMotion} />
      </div>
    </div>
  );
}
