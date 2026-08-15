"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine, AreaChart, Area } from "recharts"
import { formatCurrency } from "@/lib/formatters"
import { Download } from "lucide-react"

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const PERIODS = [
  { key: "all", label: "All time" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "ytd", label: "This year" },
]

export function AdvancedStatsClient() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filters
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
    const next = { period, symbol, setup, side, ...patch }
    if (patch.period !== undefined) setPeriod(patch.period)
    if (patch.symbol !== undefined) setSymbol(patch.symbol)
    if (patch.setup !== undefined) setSetup(patch.setup)
    if (patch.side !== undefined) setSide(patch.side)
    load(next)
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="card loading-skeleton" style={{ height: "100px" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <div className="card loading-skeleton" style={{ height: "300px" }} />
          <div className="card loading-skeleton" style={{ height: "300px" }} />
        </div>
      </div>
    )
  }

  if (!data || data.empty) {
    return (
      <div>
        <StatsFilters available={available} filters={{ period, symbol, setup, side }} apply={apply} />
        <div className="empty-state" style={{ marginTop: "1rem" }}>No trading data available to calculate advanced statistics.</div>
      </div>
    )
  }

  const { kpis, streaks, drawdown, drawdownEpisodes, equityCurve, rrDistribution, dowPerformance, hourPerformance, monthlyPerformance, topSymbols, topSetups, symbols, setups } = data

  const rrData = Object.entries(rrDistribution).map(([name, value]) => ({ name, value }))

  const dowData = dowPerformance.map((pnl: number, index: number) => ({
    name: dayNames[index].substring(0, 3),
    pnl: pnl
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

      <StatsFilters available={available} filters={{ period, symbol, setup, side }} apply={apply} />

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="kpi-card">
          <div className="kpi-label">Profit Factor</div>
          <div className="kpi-value" style={{ color: kpis.profitFactor >= 2 ? "var(--color-profit)" : kpis.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)" }}>
            {kpis.profitFactor === 99 ? "∞" : kpis.profitFactor.toFixed(2)}
          </div>
          <div className="kpi-sub">Target: {'>'} 2.0</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Expectancy (Per Trade)</div>
          <div className={`kpi-value ${kpis.expectancy >= 0 ? "profit" : "loss"}`}>
            {formatCurrency(kpis.expectancy, "USD", true, 2)}
          </div>
          <div className="kpi-sub">Avg Win: {formatCurrency(kpis.avgWin, "USD", false, 0)} | Avg Loss: {formatCurrency(kpis.avgLoss, "USD", false, 0)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Max Drawdown</div>
          <div className="kpi-value loss">
            {formatCurrency(drawdown.maxDrawdown, "USD", true, 2)}
          </div>
          <div className="kpi-sub">
            Current: {formatCurrency(drawdown.currentDrawdown, "USD", true, 2)}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Longest Streaks</div>
          <div className="kpi-value">
            <span className="profit">{streaks.longestWinStreak}W</span> / <span className="loss">{streaks.longestLossStreak}L</span>
          </div>
          <div className="kpi-sub">
            Current: {streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak}W` : `${streaks.currentLossStreak}L`}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Sortino Ratio</div>
          <div className={`kpi-value ${kpis.sortino >= 1 ? "profit" : kpis.sortino > 0 ? "" : "loss"}`}>
            {kpis.sortino === 99 ? "∞" : kpis.sortino.toFixed(2)}
          </div>
          <div className="kpi-sub">downside-adjusted returns</div>
        </div>
      </div>

      {/* Drawdown Analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Drawdown Analysis</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <DrawdownStat label="Max drawdown" value={formatCurrency(drawdown.maxDrawdown, "USD", true, 0)} sub={`${drawdown.maxDrawdownPct.toFixed(2)}% from peak`} />
            <DrawdownStat label="Current drawdown" value={formatCurrency(drawdown.currentDrawdown, "USD", true, 0)} sub={`${drawdown.currentDrawdownPct.toFixed(2)}% from peak`} />
            <DrawdownStat label="Longest drawdown" value={drawdown.maxDrawdownDurationDays != null ? `${drawdown.maxDrawdownDurationDays} day${drawdown.maxDrawdownDurationDays !== 1 ? "s" : ""}` : "—"} sub={drawdown.maxDrawdownStart ? `started ${drawdown.maxDrawdownStart}` : ""} />
            <DrawdownStat label="Recovered" value={drawdown.maxDrawdownRecovery ? drawdown.maxDrawdownRecovery : "still in drawdown"} sub={drawdown.maxDrawdownRecovery ? "returned to prior peak" : ""} />
          </div>
          {equityCurve && equityCurve.length > 1 && (
            <div style={{ height: 180, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    cursor={{ stroke: "var(--color-gray-700)" }}
                    contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "8px" }}
                    formatter={(val: any) => [formatCurrency(Number(val), "USD", false, 2), "Equity"]}
                    labelStyle={{ color: "var(--color-gray-400)" }}
                  />
                  <Area type="monotone" dataKey="equity" stroke="var(--color-brand-500)" strokeWidth={2} fill="url(#eqGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Drawdown Episodes</h3>
          {drawdownEpisodes.length === 0 ? (
            <div className="empty-state">No drawdown episodes in this period.</div>
          ) : (
            <div className="table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th>Start</th>
                    <th>Recovered</th>
                    <th style={{ textAlign: "right" }}>Depth</th>
                    <th style={{ textAlign: "right" }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {drawdownEpisodes.map((ep: any, i: number) => (
                    <tr key={i}>
                      <td style={{ color: "var(--color-gray-300)", fontSize: "0.82rem" }}>{ep.startDate || "—"}</td>
                      <td style={{ color: "var(--color-gray-500)", fontSize: "0.82rem" }}>{ep.endDate || <span style={{ color: "var(--color-warning)" }}>active</span>}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "var(--color-loss)" }}>
                        {formatCurrency(ep.depth, "USD", true, 0)}
                        <span style={{ color: "var(--color-gray-500)", fontWeight: 400, marginLeft: "0.3rem" }}>({ep.depthPct.toFixed(1)}%)</span>
                      </td>
                      <td style={{ textAlign: "right", color: "var(--color-gray-300)", fontSize: "0.82rem" }}>
                        {ep.durationDays != null ? `${ep.durationDays}d` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Row: RR + DoW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Risk:Reward Distribution (Wins)</h3>
          <div style={{ height: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rrData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 12, fontWeight: 600 }} />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", color: "var(--color-gray-100)" }} itemStyle={{ color: "var(--color-brand-500)", fontWeight: 700 }} />
                <Bar dataKey="value" name="Trades" fill="var(--color-brand-500)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Day of Week Performance</h3>
          <div style={{ height: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "Net P&L"]} labelStyle={{ color: "var(--color-gray-400)" }} contentStyle={{ backgroundColor: "var(--color-gray-900)", borderColor: "var(--color-gray-800)", borderRadius: "8px" }} />
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

      {/* Row: Hour of day + Monthly */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Hour of Day Performance</h3>
          <div style={{ height: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 9 }} interval={2} dy={6} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "Net P&L"]} contentStyle={{ backgroundColor: "var(--color-gray-900)", borderColor: "var(--color-gray-800)", borderRadius: "8px" }} />
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

        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Monthly Performance</h3>
          <div style={{ height: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "Net P&L"]} contentStyle={{ backgroundColor: "var(--color-gray-900)", borderColor: "var(--color-gray-800)", borderRadius: "8px" }} />
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

      {/* Row: Top symbols + setups */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <BreakdownCard title="Top Symbols" items={topSymbols} />
        <BreakdownCard title="Top Setups" items={topSetups} />
      </div>

      {/* Row: Worst performers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <BreakdownCard title="Worst Symbols" items={worstSymbols} />
        <BreakdownCard title="Worst Setups" items={worstSetups} />
      </div>

      {/* Full breakdown tables */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Full Breakdown</h3>
        <button className="btn btn-outline btn-sm" onClick={exportBreakdown} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <BreakdownTable title="By Symbol" rows={symbols} />
        <BreakdownTable title="By Setup" rows={setups} />
      </div>
    </div>
  )
}

function StatsFilters({ available, filters, apply }: { available: { symbols: string[]; setups: string[] }; filters: any; apply: (p: any) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", padding: "1rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "var(--radius-card)" }}>
      <div>
        <label className="label" style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginBottom: "0.3rem" }}>Period</label>
        <select className="input select" value={filters.period} onChange={e => apply({ period: e.target.value })} style={{ fontSize: "0.8rem" }}>
          {PERIODS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>
      <div>
        <label className="label" style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginBottom: "0.3rem" }}>Symbol</label>
        <select className="input select" value={filters.symbol} onChange={e => apply({ symbol: e.target.value })} style={{ fontSize: "0.8rem" }}>
          <option value="">All symbols</option>
          {available.symbols.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginBottom: "0.3rem" }}>Setup</label>
        <select className="input select" value={filters.setup} onChange={e => apply({ setup: e.target.value })} style={{ fontSize: "0.8rem" }}>
          <option value="">All setups</option>
          {available.setups.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="label" style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginBottom: "0.3rem" }}>Side</label>
        <select className="input select" value={filters.side} onChange={e => apply({ side: e.target.value })} style={{ fontSize: "0.8rem" }}>
          <option value="">All sides</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>
      </div>
      {(filters.period !== "all" || filters.symbol || filters.setup || filters.side) && (
        <button className="btn btn-ghost btn-sm" onClick={() => apply({ period: "all", symbol: "", setup: "", side: "" })}>Reset</button>
      )}
    </div>
  )
}

function DrawdownStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: "0.75rem", background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.3rem" }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>{sub}</div>}
    </div>
  )
}

function BreakdownCard({ title, items }: { title: string; items: any[] }) {
  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>{title}</h3>
      {items.length === 0 ? (
        <div className="empty-state">No data</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {items.map((item: any, i: number) => (
            <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "var(--color-gray-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-400)" }}>
                  {i + 1}
                </div>
                <span style={{ fontWeight: 600, color: "var(--color-gray-200)" }}>{item.name}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span className={item.pnl >= 0 ? "profit" : "loss"} style={{ fontWeight: 700 }}>
                  {formatCurrency(item.pnl, "USD", true, 2)}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{item.count} trades</span>
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
    <div className="card" style={{ padding: "1.25rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "0.75rem" }}>{title}</h3>
      {rows.length === 0 ? (
        <div className="empty-state">No data</div>
      ) : (
        <div className="table-wrapper" style={{ maxHeight: "420px", overflowY: "auto" }}>
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
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ textAlign: "right", color: "var(--color-gray-400)" }}>{r.count}</td>
                  <td style={{ textAlign: "right", color: r.winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)" }}>{r.winRate.toFixed(1)}%</td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: r.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
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
