export default function OverviewLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Your trading performance at a glance.</p>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.25rem" }}>
            <div className="skeleton" style={{ height: 11, width: 60, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 24, width: 90 }} />
          </div>
        ))}
      </div>

      {/* Equity curve */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 240 }} />
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 200 }} />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 90, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 200 }} />
        </div>
      </div>
    </div>
  )
}
