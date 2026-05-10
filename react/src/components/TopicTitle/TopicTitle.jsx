import './TopicTitle.css';

/**
 * TopicTitle — the left side of the hero pair.
 *
 * Desktop: shows the active group's full `title` (e.g. "Retrieval Augmented
 * Generation") on one line.
 * Mobile: shows a stacked column of every group's `titleShort` (falling back
 * to `title`). The active group is rendered in ink; the rest are ghost.
 * Tapping a row activates that group.
 */
export default function TopicTitle({
  title,
  groups = [],
  activeSlug,
  onSelect,
}) {
  return (
    <h2 className="topic-title" data-anim="title">
      <span className="topic-title__long">{title}</span>
      <ul className="topic-title__list" aria-label="Topics">
        {groups.map((g) => {
          const isActive = g.slug === activeSlug;
          const label = g.titleShort || g.title;
          const multiline = label.trim().split(/\s+/).length > 2;
          return (
            <li
              key={g.slug}
              className={
                `topic-title__list-item${
                  isActive ? ' topic-title__list-item--active' : ''
                }`
              }
            >
              <button
                type="button"
                className={
                  `topic-title__list-button${
                    multiline ? ' topic-title__list-button--multiline' : ''
                  }`
                }
                aria-pressed={isActive}
                onClick={() => onSelect && onSelect(g.slug)}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </h2>
  );
}
