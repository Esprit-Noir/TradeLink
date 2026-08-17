export default function ChallengesLoading() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Prop Firm Challenges</h1>
          <p className="page-subtitle">Track your drawdown limits and profit targets.</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: "1.5rem" }}>
            <div className="skeleton" style={{ height: 14, width: 80, marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 28, width: 160, marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 8, width: "100%", marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 8, width: "60%" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
