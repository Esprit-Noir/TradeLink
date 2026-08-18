export default function ReportLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Report</h1>
          <p className="page-subtitle">Detailed performance analysis.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.25rem" }}>
            <div className="skeleton" style={{ height: 11, width: 60, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 22, width: 90 }} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 240 }} />
        </div>
        <div className="card" style={{ padding: "1.5rem" }}>
          <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 240 }} />
        </div>
      </div>
    </div>
  )
}
