function EmptyStateCard({ title, description, actionLabel, onAction }) {
  return (
    <article className="panel empty-card">
      <h2>{title}</h2>
      <p>{description}</p>
      <button className="primary-btn" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </article>
  );
}

export default EmptyStateCard;
