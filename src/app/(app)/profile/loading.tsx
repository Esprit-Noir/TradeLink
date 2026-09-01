export default function ProfileLoading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ─── Profile header ─────────────────────────────────────────────── */}
      <div className="chart-card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
        <div className="skeleton" style={{ width: 76, height: 76, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="skeleton" style={{ height: 20, width: 160, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 13, width: 200, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 11, width: 120 }} />
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ width: 84, height: 60, borderRadius: 10 }} />
          ))}
        </div>
      </div>

      {/* ─── Personal details ───────────────────────────────────────────── */}
      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 16, width: 130, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, width: 220, marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <div className="skeleton" style={{ height: 10, width: 70, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 38, width: "100%", borderRadius: 8 }} />
          </div>
          <div>
            <div className="skeleton" style={{ height: 10, width: 100, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 38, width: "100%", borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div className="skeleton" style={{ height: 36, width: 90, borderRadius: 8 }} />
          </div>
        </div>
      </div>

      {/* ─── Preferences ────────────────────────────────────────────────── */}
      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 16, width: 100, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, width: 260, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ height: 10, width: 80, marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 38, width: "100%", borderRadius: 8 }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div className="skeleton" style={{ height: 36, width: 90, borderRadius: 8 }} />
        </div>
      </div>

      {/* ─── Notifications ──────────────────────────────────────────────── */}
      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 16, width: 160, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 11, width: 300, marginBottom: 20 }} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid var(--color-gray-800)" }}>
            <div>
              <div className="skeleton" style={{ height: 13, width: 140, marginBottom: 4 }} />
              <div className="skeleton" style={{ height: 10, width: 200 }} />
            </div>
            <div className="skeleton" style={{ height: 22, width: 40, borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
