export default function SetupsLoading() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trading Setups</h1>
          <p className="page-subtitle">Track and analyze your trading strategies.</p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        {[1,2,3].map(i => <div key={i} className="skeleton card" style={{ height: 260 }} />)}
      </div>
    </div>
  )
}
