export default function TradesLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Trades</h1>
          <p className="page-subtitle">Your complete trade history.</p>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "0.85rem" }}>
            <div className="skeleton" style={{ height: 10, width: 50, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 20, width: 80 }} />
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: "1rem", display: "flex", gap: "0.75rem" }}>
        <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 32, width: 100, borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 32, width: 80, borderRadius: 6 }} />
      </div>

      {/* Table rows */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-gray-800)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: "1rem" }}>
            {["Symbol", "Side", "Entry", "P&L", "Date", ""].map((h) => (
              <div key={h} className="skeleton" style={{ height: 11, width: h === "" ? 24 : 50 }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-gray-800)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: "1rem", alignItems: "center" }}>
              <div className="skeleton" style={{ height: 14, width: 70 }} />
              <div className="skeleton" style={{ height: 14, width: 35 }} />
              <div className="skeleton" style={{ height: 14, width: 60 }} />
              <div className="skeleton" style={{ height: 14, width: 55 }} />
              <div className="skeleton" style={{ height: 14, width: 80 }} />
              <div className="skeleton" style={{ height: 14, width: 24, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
