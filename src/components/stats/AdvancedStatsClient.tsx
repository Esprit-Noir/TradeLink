"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, AreaChart, Area } from "recharts"
import { formatCurrency } from "@/lib/formatters"
import { Download, TrendingUp, TrendingDown, BarChart3, Target, Activity, AlertTriangle, Clock, Award } from "lucide-react"
import dynamic from "next/dynamic"

const EquityCurveChart = dynamic(
  () => import("@/components/dashboard/EquityCurveChart").then(m => ({ default: m.EquityCurveChart })),
  { ssr: false }
)

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const PERIODS = [
  { key: "all", label: "All" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "ytd", label: "YTD" },
]

const tooltipStyle = {
  background: "var(--color-gray-900)",
  border: "1px solid var(--color-gray-700)",
  borderRadius: "10px",
  fontSize: "0.75rem",
  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
}

export function AdvancedStatsClient() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("all")
  const [symbol, setSymbol] = useState("")
  const [setup, setSetup] = useState("")
  const [side, setSide] = useState("")
  const [available, setAvailable] = useState<{ symbols: string[]; setups: string[] }>({ symbols: [], setups: [] })

  const load = useCallback(async (filters: { period: string; symbol: string; setup: string; side: string }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("accountId", "all")
      if (filters.period && filters.period !== "all") params.set("period", filters.period)
      if (filters.symbol) params.set("symbol", filters.symbol)
      if (filters.setup) params.set("setup", filters.setup)
      if (filters.side) params.set("side", filters.side)
      const res = await fetch(`/api/metrics/advanced?${params.toString()}`)
      const d = await res.json()
      setData(d)
      if (!d.empty && d.symbols) {
        setAvailable(prev => ({
          symbols: prev.symbols.length ? prev.symbols : d.symbols.map((s: any) => s.name),
          setups: prev.setups.length ? prev.setups : d.setups.map((s: any) => s.name),
        }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load({ period, symbol, setup, side })
  }, [period, symbol, setup, side, load])

  const apply = (patch: any) => {
    if (patch.period !== undefined) setPeriod(patch.period)
    if (patch.symbol !== undefined) setSymbol(patch.symbol)
    if (patch.setup !== undefined) setSetup(patch.setup)
    if (patch.side !== undefined) setSide(patch.side)
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--radius-card)" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-card)" }} />
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-card)" }} />
        </div>
      </div>
    )
  }

  if (!data || data.empty) {
    return (
      <div>
        <StatsFilters available={available} filters={{ period, symbol, setup, side }} apply={apply} />
        <div className="empty-state" style={{ marginTop: "1rem" }}>No trading data available.</div>
      </div>
    )
  }

  const { kpis, streaks, drawdown, drawdownEpisodes, equityCurve, rrDistribution, dowPerformance, hourPerformance, monthlyPerformance, topSymbols, topSetups, symbols, setups } = data

  const rrData = Object.entries(rrDistribution).map(([name, value]) => ({ name, value }))
  const dowData = dowPerformance.map((pnl: number, index: number) => ({
    name: dayNames[index].substring(0, 3),
    pnl,
  })).filter((d: any, i: number) => !(d.pnl === 0 && (i === 0 || i === 6)))
  const hourData = hourPerformance.map((pnl: number, h: number) => ({ hour: `${String(h).padStart(2, "0")}H`, pnl }))
  const monthData = monthlyPerformance.map((m: any) => ({ name: m.month.slice(5), pnl: m.pnl }))
  const worstSymbols = [...symbols].reverse().slice(0, 3)
  const worstSetups = [...setups].reverse().slice(0, 3)

  const exportBreakdown = () => {
    const rows = ["type,name,count,winRate%,netPnl"]
    symbols.forEach((s: any) => rows.push(`symbol,${s.name},${s.count},${s.winRate.toFixed(1)},${s.pnl.toFixed(2)}`))
    setups.forEach((s: any) => rows.push(`setup,${s.name},${s.count},${s.winRate.toFixed(1)},${s.pnl.toFixed(2)}`))
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stats-breakdown.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "0.25rem" }}>
        <div>
          <h1 className="page-title">Advanced Statistics</h1>
          <p className="page-subtitle">Deep dive into your trading performance.</p>
        </div>
      </div>

      {/* Filters */}
      <StatsFilters available={available} filters={{ period, symbol, setup, side }} apply={apply} />

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
        <KpiStat icon={<BarChart3 size={14} />} label="Profit Factor" value={kpis.profitFactor === 99 ? "∞" : kpis.profitFactor.toFixed(2)} color={kpis.profitFactor >= 2 ? "var(--color-profit)" : kpis.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)"} sub="Target > 2.0" />
        <KpiStat icon={<TrendingUp size={14} />} label="Expectancy" value={formatCurrency(kpis.expectancy, "USD", true, 2)} color={kpis.expectancy >= 0 ? "var(--color-profit)" : "var(--color-loss)"} sub={`Win ${formatCurrency(kpis.avgWin, "USD", false, 0)} / Loss ${formatCurrency(kpis.avgLoss, "USD", false, 0)}`} />
        <KpiStat icon={<AlertTriangle size={14} />} label="Max Drawdown" value={formatCurrency(drawdown.maxDrawdown, "USD", true, 2)} color="var(--color-loss)" sub={`${drawdown.maxDrawdownPct.toFixed(1)}% from peak`} />
        <KpiStat icon={<Activity size={14} />} label="Streaks" value={`${streaks.longestWinStreak}W / ${streaks.longestLossStreak}L`} color="var(--color-gray-100)" sub={`Current: ${streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak}W` : `${streaks.currentLossStreak}L`}`} />
        <KpiStat icon={<Award size={14} />} label="Sortino" value={kpis.sortino === 99 ? "∞" : kpis.sortino.toFixed(2)} color={kpis.sortino >= 1 ? "var(--color-profit)" : "var(--color-loss)"} sub="Downside-adjusted" />
      </div>

      {/* Equity Curve + Drawdown Episodes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "1rem" }}>Equity Curve</div>
          {equityCurve && equityCurve.length > 1 ? (
            <EquityCurveChart
              equityData={equityCurve}
              initialBalance={equityCurve[0]?.equity ?? 0}
            />
          ) : (
            <div className="empty-state">No equity data.</div>
          )}
        </div>

        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Drawdown Episodes</div>
          {drawdownEpisodes.length === 0 ? (
            <div className="empty-state">No drawdown episodes.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
                <DrawdownStat label="Max DD" value={formatCurrency(drawdown.maxDrawdown, "USD", true, 0)} sub={`${drawdown.maxDrawdownPct.toFixed(1)}%`} />
                <DrawdownStat label="Current DD" value={formatCurrency(drawdown.currentDrawdown, "USD", true, 0)} sub={`${drawdown.currentDrawdownPct.toFixed(1)}%`} />
                <DrawdownStat label="Longest" value={drawdown.maxDrawdownDurationDays != null ? `${drawdown.maxDrawdownDurationDays}d` : "—"} sub={drawdown.maxDrawdownStart || ""} />
                <DrawdownStat label="Recovered" value={drawdown.maxDrawdownRecovery || "Still in DD"} />
              </div>
              <div style={{ maxHeight: "180px", overflowY: "auto" }}>
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th>Start</th>
                      <th>End</th>
                      <th style={{ textAlign: "right" }}>Depth</th>
                      <th style={{ textAlign: "right" }}>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawdownEpisodes.slice(0, 8).map((ep: any, i: number) => (
                      <tr key={i}>
                        <td style={{ fontSize: "0.78rem" }}>{ep.startDate || "—"}</td>
                        <td style={{ fontSize: "0.78rem", color: ep.endDate ? "var(--color-gray-500)" : "var(--color-warning)" }}>{ep.endDate || "active"}</td>
                        <td style={{ textAlign: "right", fontWeight: 600, color: "var(--color-loss)" }}>{formatCurrency(ep.depth, "USD", true, 0)}</td>
                        <td style={{ textAlign: "right", fontSize: "0.78rem" }}>{ep.durationDays != null ? `${ep.durationDays}d` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RR + DoW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>R:Reward Distribution</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rrData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 11, fontWeight: 600 }} width={50} />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} contentStyle={tooltipStyle} itemStyle={{ color: "var(--color-brand-500)", fontWeight: 700 }} />
                <Bar dataKey="value" name="Trades" fill="var(--color-brand-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Day of Week</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 11, fontWeight: 600 }} dy={8} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "P&L"]} contentStyle={tooltipStyle} />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dowData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hour + Monthly */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Hour of Day</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 9 }} interval={2} dy={6} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "P&L"]} contentStyle={tooltipStyle} />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {hourData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Monthly</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "P&L"]} contentStyle={tooltipStyle} />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top / Worst performers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <BreakdownCard title="Top Symbols" items={topSymbols} icon={<TrendingUp size={14} />} />
        <BreakdownCard title="Top Setups" items={topSetups} icon={<Target size={14} />} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <BreakdownCard title="Worst Symbols" items={worstSymbols} icon={<TrendingDown size={14} />} />
        <BreakdownCard title="Worst Setups" items={worstSetups} icon={<AlertTriangle size={14} />} />
      </div>

      {/* Full Breakdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="chart-title">Full Breakdown</div>
        <button className="btn btn-outline btn-sm" onClick={exportBreakdown} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Download size={14} /> CSV
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <BreakdownTable title="By Symbol" rows={symbols} />
        <BreakdownTable title="By Setup" rows={setups} />
      </div>
    </div>
  )
}

function KpiStat({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{
      background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
      borderRadius: "var(--radius-card)", padding: "1rem",
      display: "flex", flexDirection: "column", gap: "0.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-gray-500)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "var(--font-mono)", color }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{sub}</div>}
    </div>
  )
}

function StatsFilters({ available, filters, apply }: { available: { symbols: string[]; setups: string[] }; filters: any; apply: (p: any) => void }) {
  const hasFilters = filters.period !== "all" || filters.symbol || filters.setup || filters.side
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center",
      padding: "0.75rem 1rem",
      background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
      borderRadius: "var(--radius-card)",
    }}>
      <div style={{ display: "flex", background: "var(--color-gray-950)", borderRadius: "8px", padding: "2px", gap: "2px" }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => apply({ period: p.key })}
            style={{
              padding: "0.3rem 0.65rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all 0.15s",
              background: filters.period === p.key ? "rgba(16,185,129,0.15)" : "transparent",
              color: filters.period === p.key ? "var(--color-profit)" : "var(--color-gray-500)",
            }}
          >{p.label}</button>
        ))}
      </div>

      <div style={{ width: 1, height: 20, background: "var(--color-gray-800)" }} />

      <select className="input select" value={filters.symbol} onChange={e => apply({ symbol: e.target.value })} style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem" }}>
        <option value="">All symbols</option>
        {available.symbols.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select className="input select" value={filters.setup} onChange={e => apply({ setup: e.target.value })} style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem" }}>
        <option value="">All setups</option>
        {available.setups.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select className="input select" value={filters.side} onChange={e => apply({ side: e.target.value })} style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem" }}>
        <option value="">All sides</option>
        <option value="LONG">Long</option>
        <option value="SHORT">Short</option>
      </select>

      {hasFilters && (
        <button className="btn btn-ghost btn-sm" onClick={() => apply({ period: "all", symbol: "", setup: "", side: "" })} style={{ fontSize: "0.72rem" }}>
          Reset
        </button>
      )}
    </div>
  )
}

function DrawdownStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: "0.5rem 0.6rem", background: "var(--color-gray-950)", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-gray-100)" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.65rem", color: "var(--color-gray-500)" }}>{sub}</div>}
    </div>
  )
}

function BreakdownCard({ title, items, icon }: { title: string; items: any[]; icon?: React.ReactNode }) {
  return (
    <div className="chart-card" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ color: "var(--color-gray-400)" }}>{icon}</span>
        <span className="chart-title" style={{ margin: 0 }}>{title}</span>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">No data</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {items.map((item: any, i: number) => (
            <div key={item.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.6rem 0.75rem",
              background: "var(--color-gray-950)", borderRadius: "8px", border: "1px solid var(--color-gray-800)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "6px",
                  background: item.pnl >= 0 ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.65rem", fontWeight: 700,
                  color: item.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                }}>
                  {i + 1}
                </div>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-gray-200)" }}>{item.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-gray-500)" }}>{item.count} trades · {(item.winRate * 100).toFixed(0)}% W</span>
                <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: item.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", minWidth: "80px", textAlign: "right" }}>
                  {formatCurrency(item.pnl, "USD", true, 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BreakdownTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="chart-card" style={{ padding: "1.25rem" }}>
      <div className="chart-title" style={{ marginBottom: "0.75rem" }}>{title}</div>
      {rows.length === 0 ? (
        <div className="empty-state">No data</div>
      ) : (
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Name</th>
                <th style={{ textAlign: "right" }}>Trades</th>
                <th style={{ textAlign: "right" }}>Win%</th>
                <th style={{ textAlign: "right" }}>Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.name}>
                  <td style={{ fontWeight: 600, fontSize: "0.82rem" }}>{r.name}</td>
                  <td style={{ textAlign: "right", color: "var(--color-gray-400)", fontSize: "0.82rem" }}>{r.count}</td>
                  <td style={{ textAlign: "right", color: r.winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 600, fontSize: "0.82rem" }}>{r.winRate.toFixed(1)}%</td>
                  <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: "0.82rem", color: r.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {formatCurrency(r.pnl, "USD", true, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
