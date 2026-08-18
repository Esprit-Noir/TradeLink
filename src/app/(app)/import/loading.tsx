export default function ImportLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Import Trades</h1>
          <p className="page-subtitle">Import your trading data.</p>
        </div>
      </div>

      {/* Upload area */}
      <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
        <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 12, margin: "0 auto 16px" }} />
        <div className="skeleton" style={{ height: 14, width: 200, margin: "0 auto 8px" }} />
        <div className="skeleton" style={{ height: 11, width: 280, margin: "0 auto" }} />
      </div>

      {/* Import history */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 110, marginBottom: 14 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--color-gray-800)" : "none" }}>
            <div className="skeleton" style={{ height: 14, width: 14, borderRadius: 4 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, width: 130, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: 80 }} />
            </div>
            <div className="skeleton" style={{ height: 12, width: 50 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
