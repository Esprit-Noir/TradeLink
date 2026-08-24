export default function RiskLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Risk Management</h1>
          <p className="page-subtitle">Monitor your drawdown and risk limits.</p>
        </div>
      </div>

      {/* Alert cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="chart-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div className="skeleton" style={{ height: 32, width: 32, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 13, width: 80 }} />
            </div>
            <div className="skeleton" style={{ height: 10, width: "100%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 8, width: "70%" }} />
          </div>
        ))}
      </div>

      {/* Rules list */}
      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 14 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--color-gray-800)" : "none" }}>
            <div className="skeleton" style={{ height: 20, width: 20, borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, width: 140, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 10, width: 220 }} />
            </div>
            <div className="skeleton" style={{ height: 14, width: 40 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
