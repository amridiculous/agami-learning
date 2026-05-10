import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { useParams, useNavigate } from 'react-router-dom';

import TopicGroupRail from '../../components/TopicGroupRail/TopicGroupRail.jsx';
import TopicTitle from '../../components/TopicTitle/TopicTitle.jsx';
import ChapterColumn from '../../components/ChapterColumn/ChapterColumn.jsx';
import ActionStack from '../../components/ActionStack/ActionStack.jsx';

import { topicGroups } from '../../data/topics.js';
import useReducedMotion from '../../hooks/useReducedMotion.js';

import './Home.css';

/**
 * Home — single-viewport composition.
 *
 * Layout (CSS Grid):
 *   ┌───────────────────────────────────────────────────────────┐
 *   │ TopicGroupRail (top-left)        │ ChapterColumn          │
 *   │                                  │   chapter (ghost)      │
 *   │                  TopicTitle      │   chapter (FOCUS)      │ ← focus line
 *   │                  (focus line)    │   chapter (ghost)      │
 *   │ ActionStack (bottom-left)        │                        │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Routes:
 *   / → first chapter at the focus line on load
 *   /chapter/:slug → matching chapter at the focus line on load
 */
export default function Home() {
  const containerRef = useRef(null);
  const heroRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const { slug: chapterSlug } = useParams();
  const navigate = useNavigate();

  const [activeGroupSlug, setActiveGroupSlug] = useState(topicGroups[0].slug);
  const [modalOpen, setModalOpen] = useState(false);
  const activeGroup =
    topicGroups.find((g) => g.slug === activeGroupSlug) || topicGroups[0];

  const handleGroupSelect = useCallback((slug) => {
    setActiveGroupSlug(slug);
    // Reset URL so ChapterColumn mounts with initialChapterSlug undefined,
    // which falls back to chapter index 0 — first chapter at the focus line.
    navigate('/', { replace: true });
  }, [navigate]);

  const handleModalChange = useCallback((isOpen) => {
    setModalOpen(isOpen);
  }, []);

  // Fade the hero pair (title + chapters) in/out when a modal opens/closes.
  // Identical timing and easing for About and Contact, identical for open and
  // close — a single shared motion vocabulary. .home__hero-pair has
  // display: contents on desktop, so we target the two children directly
  // (opacity does not paint on a display:contents box).
  useEffect(() => {
    const targets = ['.home__title', '.home__chapters'];
    if (prefersReducedMotion) {
      gsap.set(targets, { opacity: modalOpen ? 0 : 1, y: 0 });
      return;
    }
    gsap.to(targets, {
      opacity: modalOpen ? 0 : 1,
      y: modalOpen ? -12 : 0,
      duration: 0.5,
      ease: 'power2.inOut',
      overwrite: 'auto',
    });
  }, [modalOpen, prefersReducedMotion]);

  // Crossfade hero on topic-group change.
  useEffect(() => {
    if (prefersReducedMotion) return;
    gsap.fromTo(
      ['.home__title', '.home__chapters'],
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
        stagger: 0.05,
      },
    );
  }, [activeGroupSlug, prefersReducedMotion]);

  // Page-load reveal stagger.
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    if (!containerRef.current) return undefined;

    const ctx = gsap.context(() => {
      // Top-left labels — opacity 0→1, y 8→0, 600ms, stagger 80ms.
      gsap.from('[data-anim="rule"]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.6,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
        stagger: 0.06,
      });
      gsap.from('[data-anim="label"]', {
        opacity: 0,
        y: 8,
        duration: 0.6,
        ease: 'cubic-bezier(0.32, 0.08, 0.24, 1)',
        stagger: 0.08,
      });

      // Topic title — opacity 0→1, y 16→0, 700ms, 100ms after labels.
      gsap.from('[data-anim="title"]', {
        opacity: 0,
        y: 16,
        duration: 0.7,
        delay: 0.1,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
      });

      // Chapter column — opacity 0→1, 600ms, 200ms after title.
      gsap.from('[data-anim="chapter-column"]', {
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'cubic-bezier(0.45, 0, 0.55, 1)',
      });
    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  return (
    <div ref={containerRef} className="home">
      {/* Visually-hidden H1 for a11y / SEO. */}
      <h1 className="sr-only">Agami — AI for purposes that matter</h1>

      {/* Wordmark — center-top logo. The 'a' and 'i' glyphs are italicised
          and rendered in muted grey; the 'g' and 'm' stay upright in ink. */}
      <div className="home__wordmark" aria-hidden="true">
        <span className="home__wordmark-ink">a</span>
        <span className="home__wordmark-grey">g</span>
        <span className="home__wordmark-grey">a</span>
        <span className="home__wordmark-grey">m</span>
        <span className="home__wordmark-ink">i</span>
      </div>

      <div className="home__top-left">
        <TopicGroupRail
          groups={topicGroups}
          activeSlug={activeGroup.slug}
          onSelect={handleGroupSelect}
        />
      </div>

      <div className="home__hero-pair" ref={heroRef}>
        <div className="home__title">
          <TopicTitle
            title={activeGroup.title}
            groups={topicGroups}
            activeSlug={activeGroup.slug}
            onSelect={handleGroupSelect}
          />
        </div>

        <div className="home__chapters">
          <ChapterColumn
            key={activeGroup.slug}
            chapters={activeGroup.chapters}
            topicSlug={activeGroup.slug}
            initialChapterSlug={chapterSlug}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>
      </div>

      {/* Year — bottom-right marker. */}
      <div className="home__year" aria-hidden="true">
        {new Date().getFullYear()}
      </div>

      <div className="home__bottom-left">
        <ActionStack
          prefersReducedMotion={prefersReducedMotion}
          onModalChange={handleModalChange}
        />
        <span className="home__bottom-year" aria-hidden="true">
          {new Date().getFullYear()}
        </span>
      </div>
    </div>
  );
}
