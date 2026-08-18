export default function DashboardLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading overview at a glance.</p>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.25rem" }}>
            <div className="skeleton" style={{ height: 11, width: 60, marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 26, width: 100 }} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 220 }} />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 220 }} />
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 110, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 180 }} />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 90, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 180 }} />
        </div>
      </div>
    </div>
  )
}
