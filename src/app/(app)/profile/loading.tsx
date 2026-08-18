export default function ProfileLoading() {
  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 640 }}>
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings.</p>
        </div>
      </div>

      {/* Avatar section */}
      <div className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: 16 }}>
        <div className="skeleton" style={{ height: 64, width: 64, borderRadius: 16 }} />
        <div>
          <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 11, width: 180 }} />
        </div>
      </div>

      {/* Form fields */}
      <div className="card" style={{ padding: "1.5rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div className="skeleton" style={{ height: 10, width: 70, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 38, width: "100%", borderRadius: 8 }} />
          </div>
        ))}
        <div className="skeleton" style={{ height: 38, width: 120, borderRadius: 8, marginTop: 8 }} />
      </div>
    </div>
  )
}
