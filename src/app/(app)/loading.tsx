export default function AppLoading() {
  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="skeleton" style={{ height: 32, width: 200 }} />
      <div className="skeleton" style={{ height: 16, width: 320 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.5rem" }}>
            <div className="skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 28, width: 120 }} />
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: "1.5rem" }}>
        <div className="skeleton" style={{ height: 200 }} />
      </div>
    </div>
  )
}
