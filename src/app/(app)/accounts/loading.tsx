export default function AccountsLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage your trading accounts.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div className="skeleton" style={{ height: 36, width: 36, borderRadius: 10 }} />
              <div>
                <div className="skeleton" style={{ height: 13, width: 100, marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: 70 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j}>
                  <div className="skeleton" style={{ height: 9, width: 40, marginBottom: 4 }} />
                  <div className="skeleton" style={{ height: 16, width: 65 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
