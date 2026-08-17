export default function BacktestLoading() {
  return (
    <div className="backtest-root">
      <div className="backtest-header">
        <div className="backtest-header-title">
          <span className="backtest-header-dot" />
          Replay Backtest
          <span className="backtest-header-tag">SIMULATEUR</span>
        </div>
        <p className="backtest-header-sub">Loading...</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem" }}>
        <div className="skeleton" style={{ height: 48 }} />
        <div className="skeleton" style={{ height: 400 }} />
        <div className="skeleton" style={{ height: 120 }} />
      </div>
    </div>
  )
}
