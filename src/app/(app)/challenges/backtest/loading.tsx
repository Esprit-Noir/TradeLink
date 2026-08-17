export default function PropBacktestLoading() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Prop Backtest</h1>
          <p className="page-subtitle">Simulate challenge rules against your trade history.</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div className="skeleton" style={{ height: 48 }} />
        <div className="skeleton" style={{ height: 300 }} />
      </div>
    </div>
  )
}
