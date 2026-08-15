"use client"

import { useEffect, useState } from "react"
import { X, TrendingUp, Target, Clock } from "lucide-react"

type SetupDetail = {
  setup: { id: string; name: string; description: string | null; isDefault: boolean }
  summary: {
    count: number
    wins: number
    losses: number
    winRate: number
    netPnl: number
    profitFactor: number
    expectancy: number
    avgR: number
    avgHoldMin: number
    best: number
    worst: number
  }
  symbols: { name: string; count: number; wins: number; winRate: number; pnl: number }[]
  rValues: number[]
  recentTrades: {
    id: string
    symbol: string
    side: string
    quantity: number
    entryAt: string
    exitAt: string | null
    entryPrice: number
    exitPrice: number
    netPnl: number
    r: number | null
  }[]
}

function fmt(v: number, sign = false): string {
  return `${sign && v > 0 ? "+" : ""}$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
}

export function SetupDetailPanel({ setupId, onClose }: { setupId: string | null; onClose: () => void }) {
  const [data, setData] = useState<SetupDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!setupId) return
    setLoading(true)
    setData(null)
    fetch(`/api/setups/${setupId}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [setupId])

  if (!setupId) return null
  const s = data?.summary!

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="side-panel">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--color-gray-500)" }}>
              Setup details
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-gray-100)", margin: "0.25rem 0 0" }}>
              {data?.setup.name ?? "…"}
            </h2>
            {data?.setup.description && (
              <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginTop: "0.25rem" }}>{data.setup.description}</div>
            )}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: "0.35rem" }} title="Close">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="skeleton" style={{ height: 80 }} />
            <div className="skeleton" style={{ height: 120 }} />
            <div className="skeleton" style={{ height: 220 }} />
          </div>
        ) : !data ? (
          <div className="empty-state">Failed to load setup details.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Summary stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Stat label="Net P&L" value={fmt(s.netPnl, true)} color={s.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
              <Stat label="Win rate" value={s.count > 0 ? `${s.winRate.toFixed(1)}%` : "—"} color={s.winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)"} />
              <Stat label="Trades" value={String(s.count)} sub={`${s.wins}W / ${s.losses}L`} />
              <Stat label="Profit factor" value={s.profitFactor === 99 ? "∞" : s.profitFactor.toFixed(2)} color={s.profitFactor >= 1.5 ? "var(--color-profit)" : s.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)"} />
              <Stat label="Expectancy" value={fmt(s.expectancy, true)} color={s.expectancy >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
              <Stat label="Avg R" value={`${s.avgR >= 0 ? "+" : ""}${s.avgR.toFixed(2)}R`} color={s.avgR >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
              <Stat label="Avg hold time" value={s.avgHoldMin >= 60 ? `${(s.avgHoldMin / 60).toFixed(1)}h` : `${s.avgHoldMin}min`} icon={<Clock size={14} />} />
              <Stat label="Best / Worst" value={`${fmt(s.best, true)} / ${fmt(s.worst, true)}`} />
            </div>

            {/* Per-symbol breakdown */}
            {data.symbols.length > 0 && (
              <div>
                <SectionTitle icon={<Target size={14} />} title="Performance by Symbol" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {data.symbols.map(sym => (
                    <div key={sym.name} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ width: "70px", fontWeight: 600, fontSize: "0.85rem", color: "var(--color-gray-200)" }}>{sym.name}</span>
                      <div style={{ flex: 1, background: "var(--color-gray-800)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.max(3, Math.min(100, Math.abs(sym.pnl) / Math.max(1, Math.max(...data.symbols.map(x => Math.abs(x.pnl)))) * 100))}%`,
                          background: sym.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ width: "34px", textAlign: "right", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{sym.count}t</span>
                      <span style={{ width: "76px", textAlign: "right", fontSize: "0.82rem", fontWeight: 700, color: sym.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                        {fmt(sym.pnl, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* R distribution */}
            {data.rValues.length > 0 && (
              <div>
                <SectionTitle icon={<TrendingUp size={14} />} title="R-Multiple Distribution" />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {[...data.rValues].reverse().slice(-20).reverse().map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.78rem" }}>
                      <span style={{ width: "34px", color: "var(--color-gray-500)" }}>#{data.rValues.length - Math.min(data.rValues.length - 1, i)}</span>
                      <span style={{ color: r >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 600, width: "52px" }}>
                        {r >= 0 ? "+" : ""}{r.toFixed(2)}R
                      </span>
                      <div style={{ flex: 1, background: "var(--color-gray-800)", borderRadius: 3, height: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${Math.min(100, Math.abs(r) / Math.max(1, Math.max(...data.rValues.map(x => Math.abs(x)))) * 100)}%`,
                          marginLeft: r < 0 ? "auto" : 0,
                          background: r >= 0 ? "var(--color-profit)" : "var(--color-loss)", borderRadius: 3,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent trades */}
            <div>
              <SectionTitle icon={<TrendingUp size={14} />} title="Recent Trades" />
              <div className="table-wrapper">
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th style={{ textAlign: "right" }}>P&L</th>
                      <th style={{ textAlign: "right" }}>R</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTrades.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
                          {new Date(t.entryAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                        <td><span className={`badge ${t.side === "LONG" ? "badge-profit" : "badge-loss"}`}>{t.side}</span></td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: t.netPnl > 0 ? "var(--color-profit)" : t.netPnl < 0 ? "var(--color-loss)" : "inherit" }}>
                          {fmt(t.netPnl, true)}
                        </td>
                        <td style={{ textAlign: "right", fontSize: "0.75rem", color: t.r != null ? (t.r >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-gray-600)" }}>
                          {t.r != null ? `${t.r >= 0 ? "+" : ""}${t.r.toFixed(2)}R` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function Stat({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ padding: "0.6rem 0.75rem", borderRadius: "8px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.2rem" }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: color || "var(--color-gray-100)", whiteSpace: "nowrap" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-600)" }}>{sub}</div>}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.6rem" }}>
      {icon}{title}
    </div>
  )
}
