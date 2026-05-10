import './TopicTitle.css';

/**
 * TopicTitle — center-left big serif word (e.g. `RAG`).
 *
 * Sits at the focus line vertical position. No animation, no cycling.
 * Just renders the active topic group's `title` string.
 */
export default function TopicTitle({ title }) {
  return (
    <h2 className="topic-title" data-anim="title">
      {title}
    </h2>
  );
}
