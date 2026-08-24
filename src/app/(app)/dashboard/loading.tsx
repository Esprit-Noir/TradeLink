export default function DashboardLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your trading overview at a glance.</p>
        </div>
      </div>

      {/* KPIs Skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="kpi-card" style={{ padding: "1.25rem" }}>
            <div className="skeleton-pulse" style={{ width: "40%", height: 12, borderRadius: 4, marginBottom: "0.5rem" }} />
            <div className="skeleton-pulse" style={{ width: "80%", height: 28, borderRadius: 6 }} />
          </div>
        ))}
      </div>

      {/* Top row skeletons */}
      <div className="dashboard-row-equal">
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton-pulse" style={{ width: "30%", height: 16, borderRadius: 4, marginBottom: "2rem" }} />
          <div className="skeleton-pulse" style={{ width: "100%", height: 180, borderRadius: 8 }} />
        </div>
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton-pulse" style={{ width: "40%", height: 16, borderRadius: 4, marginBottom: "2rem" }} />
          <div className="skeleton-pulse" style={{ width: "80%", height: 180, borderRadius: 8, margin: "0 auto" }} />
        </div>
      </div>

      {/* Bottom row skeletons */}
      <div className="dashboard-row-equal">
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton-pulse" style={{ width: "20%", height: 16, borderRadius: 4, marginBottom: "2rem" }} />
          <div className="skeleton-pulse" style={{ width: "100%", height: 250, borderRadius: 8 }} />
        </div>
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 90, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 180 }} />
        </div>
      </div>
    </div>
  )
}
