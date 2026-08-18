export default function CalendarLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">Visualize your trading days.</p>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 24, width: 140 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <div className="skeleton" style={{ height: 28, width: 28, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 28, width: 28, borderRadius: 6 }} />
          </div>
        </div>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 14, borderRadius: 4 }} />
          ))}
        </div>
        {/* Calendar cells */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="skeleton" style={{ height: 48, borderRadius: 6 }} />
            ))}
          </div>
        ))}
      </div>

      {/* Monthly summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1rem" }}>
            <div className="skeleton" style={{ height: 11, width: 60, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 22, width: 90 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
