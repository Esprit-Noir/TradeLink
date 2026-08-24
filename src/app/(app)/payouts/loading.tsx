export default function PayoutsLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Payouts</h1>
          <p className="page-subtitle">Track your payout requests.</p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="chart-card" style={{ padding: "1.25rem" }}>
            <div className="skeleton" style={{ height: 11, width: 70, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 24, width: 100 }} />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="chart-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-gray-800)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 100px", gap: "1rem" }}>
            {["Challenge", "Amount", "Status", "Date", ""].map((h) => (
              <div key={h} className="skeleton" style={{ height: 11, width: h === "" ? 24 : 55 }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-gray-800)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 100px", gap: "1rem", alignItems: "center" }}>
              <div className="skeleton" style={{ height: 13, width: 110 }} />
              <div className="skeleton" style={{ height: 13, width: 70 }} />
              <div className="skeleton" style={{ height: 18, width: 60, borderRadius: 10 }} />
              <div className="skeleton" style={{ height: 13, width: 80 }} />
              <div className="skeleton" style={{ height: 13, width: 24, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
