export default function BehavioralLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Behavioral Analysis</h1>
          <p className="page-subtitle">Understand your trading psychology.</p>
        </div>
      </div>

      {/* Score cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.25rem" }}>
            <div className="skeleton" style={{ height: 11, width: 70, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 28, width: 50, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 8, width: "100%" }} />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 130, marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 260 }} />
      </div>
    </div>
  )
}
