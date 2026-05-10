import './TopicGroupRail.css';

/**
 * TopicGroupRail — top-left vertical stack of topic-group labels.
 *
 * Clicking a label sets the active topic group, swapping the hero TopicTitle
 * and the right-side ChapterColumn.
 */
export default function TopicGroupRail({ groups, activeSlug, onSelect }) {
  return (
    <ul className="topic-group-rail" aria-label="Topic groups">
      {groups.map((group) => (
        <li key={group.slug} className="topic-group-rail__item">
          <button
            type="button"
            className={
              `topic-group-rail__label${
                group.slug === activeSlug ? ' topic-group-rail__label--active' : ''
              }`
            }
            data-anim="label"
            aria-pressed={group.slug === activeSlug}
            onClick={() => onSelect && onSelect(group.slug)}
          >
            {group.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
