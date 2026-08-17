export default function StatsLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Advanced Statistics</h1>
          <p className="page-subtitle">Deep dive into your trading performance.</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--radius-card)" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-card)" }} />
        <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-card)" }} />
      </div>
      <div className="skeleton" style={{ height: 280, borderRadius: "var(--radius-card)" }} />
    </div>
  )
}
