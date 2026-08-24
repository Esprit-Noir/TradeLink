export default function SupportLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 640 }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">Get help with TradeLink.</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 16 }} />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ padding: "12px 0", borderBottom: i < 3 ? "1px solid var(--color-gray-800)" : "none" }}>
            <div className="skeleton" style={{ height: 13, width: 220, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 11, width: 300 }} />
          </div>
        ))}
      </div>

      {/* Contact form */}
      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 16 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div className="skeleton" style={{ height: 10, width: 50, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: i === 2 ? 80 : 38, width: "100%", borderRadius: 8 }} />
          </div>
        ))}
        <div className="skeleton" style={{ height: 38, width: 100, borderRadius: 8, marginTop: 8 }} />
      </div>
    </div>
  )
}
