export default function NotificationsLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Your alerts and notifications.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem" }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < 5 ? "1px solid var(--color-gray-800)" : "none" }}>
            <div className="skeleton" style={{ height: 32, width: 32, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ height: 12, width: 180, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 10, width: 260 }} />
            </div>
            <div className="skeleton" style={{ height: 10, width: 60, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
