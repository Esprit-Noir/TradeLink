export function KpiGridSkeleton() {
  return (
    <div className="kpi-grid" style={{ marginBottom: "1rem" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="kpi-card">
          <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 32, width: 120, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 12, width: 90 }} />
        </div>
      ))}
    </div>
  )
}
