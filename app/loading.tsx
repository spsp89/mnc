export default function Loading() {
  return (
    <main className="bnc-home-skeleton" role="status" aria-live="polite" aria-label="Loading BNC">
      <span className="sr-only">Loading BNC</span>
      <div className="bnc-skeleton-hero">
        <div className="bnc-skeleton-copy">
          <span className="bnc-skeleton-line is-short" />
          <span className="bnc-skeleton-line is-title" />
          <span className="bnc-skeleton-line is-title is-narrow" />
          <span className="bnc-skeleton-search" />
          <span className="bnc-skeleton-line is-medium" />
        </div>
        <div className="bnc-skeleton-visual" />
      </div>
      <div className="bnc-skeleton-body">
        <span className="bnc-skeleton-line is-heading" />
        <div className="bnc-skeleton-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
