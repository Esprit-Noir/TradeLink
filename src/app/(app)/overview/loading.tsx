export default function OverviewLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Greeting skeleton */}
      <div className="glass-card" style={{ padding: "1.75rem 2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 10, width: 120, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 32, width: 280, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 12, width: 180 }} />
          </div>
          <div style={{ width: 200 }}>
            <div className="skeleton" style={{ height: 14, width: "100%", marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 14, width: "80%" }} />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card" style={{ padding: "1.25rem 1.5rem", minHeight: 140 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="skeleton" style={{ height: 10, width: 70 }} />
              <div className="skeleton" style={{ height: 34, width: 34, borderRadius: 10 }} />
            </div>
            <div className="skeleton" style={{ height: 32, width: 90 }} />
          </div>
        ))}
      </div>

      {/* Bottom row: sessions + actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        </div>
        <div className="glass-card" style={{ padding: "1.25rem" }}>
          <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 6 }} />
          ))}
        </div>
      </div>
    </div>
  )
}
