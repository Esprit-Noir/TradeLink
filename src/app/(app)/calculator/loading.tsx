export default function CalculatorLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Position Size Calculator</h1>
          <p className="page-subtitle">Calculate optimal position sizes.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {/* Input form */}
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 90, marginBottom: 16 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div className="skeleton" style={{ height: 10, width: 60, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 36, width: "100%", borderRadius: 8 }} />
            </div>
          ))}
          <div className="skeleton" style={{ height: 38, width: "100%", borderRadius: 8, marginTop: 8 }} />
        </div>

        {/* Results */}
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 16 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--color-gray-800)" : "none" }}>
              <div className="skeleton" style={{ height: 12, width: 80 }} />
              <div className="skeleton" style={{ height: 12, width: 60 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
