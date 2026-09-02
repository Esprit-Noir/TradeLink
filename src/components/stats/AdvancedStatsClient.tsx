"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { formatCurrency } from "@/lib/formatters"
import type { EquityPoint } from "@/lib/metrics"
import type { Formatter } from "recharts/types/component/DefaultTooltipContent"
import { Download, TrendingUp, TrendingDown, BarChart3, Target, Activity, AlertTriangle, Award } from "lucide-react"
import dynamic from "next/dynamic"
import { DonutChart } from "./DonutChart"

const EquityCurveChart = dynamic(
  () => import("@/components/dashboard/EquityCurveChart").then(m => ({ default: m.EquityCurveChart })),
  { ssr: false }
)

interface BreakdownItem {
  name: string
  count: number
  winRate: number
  pnl: number
}

interface DrawdownEpisode {
  startDate: string
  endDate: string
  depth: number
  durationDays: number | null
}

interface Kpis {
  profitFactor: number
  expectancy: number
  avgWin: number
  avgLoss: number
  sortino: number
  sharpe: number
  calmar: number
  winRate: number
  totalTrades: number
}

interface Streaks {
  longestWinStreak: number
  longestLossStreak: number
  currentWinStreak: number
  currentLossStreak: number
}

interface Drawdown {
  maxDrawdown: number
  maxDrawdownPct: number
  currentDrawdown: number
  currentDrawdownPct: number
  maxDrawdownDurationDays: number | null
  maxDrawdownStart: string
  maxDrawdownRecovery: string
}

interface Durations {
  avgWinDurationMinutes: number | null
  avgLossDurationMinutes: number | null
}

interface AdvancedStatsData {
  empty?: boolean
  symbols?: BreakdownItem[]
  setups?: BreakdownItem[]
  instruments?: BreakdownItem[]
  sides?: BreakdownItem[]
  kpis: Kpis
  durations: Durations
  streaks: Streaks
  drawdown: Drawdown
  drawdownEpisodes: DrawdownEpisode[]
  equityCurve: EquityPoint[]
  rrDistribution: Record<string, number>
  dowPerformance: { pnl: number, count: number, wins: number }[]
  sessionPerformance: Record<string, { pnl: number, count: number, wins: number }>
  hourPerformance: number[]
  monthlyPerformance: { month: string; pnl: number }[]
  topSymbols: BreakdownItem[]
  topSetups: BreakdownItem[]
  moodPerformance?: Record<string, { pnl: number; count: number; wins: number }>
}

type FilterPatch = {
  period?: string
  symbol?: string
  setup?: string
  side?: string
}

interface FilterState {
  period: string
  symbol: string
  setup: string
  side: string
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const PERIODS = [
  { key: "all", label: "All" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "ytd", label: "YTD" },
]

const INSTRUMENT_COLORS: Record<string, string> = {
  forex: "var(--color-profit)",
  crypto: "var(--color-warning)",
  indices: "var(--color-info)",
  stock: "#8b5cf6",
  futures: "#ec4899",
  options: "#06b6d4",
}

const SIDE_COLORS: Record<string, string> = {
  LONG: "var(--color-profit)",
  SHORT: "var(--color-loss)",
}

const SESSION_COLORS = ["var(--color-warning)", "var(--color-info)", "var(--color-profit)"]

const tooltipStyle = {
  background: "var(--color-gray-900)",
  border: "1px solid var(--color-gray-700)",
  borderRadius: "10px",
  fontSize: "0.75rem",
  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
}

const pnlFormatter: Formatter = (val) => [formatCurrency(Number(val), "USD", true, 2), "P&L"]

interface DowTooltipEntry {
  pnl: number
  count: number
  winRate: number
}

interface DowTooltipProps {
  active?: boolean
  payload?: Array<{ payload: DowTooltipEntry }>
  label?: string
}

const CustomDowTooltip = ({ active, payload, label }: DowTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={tooltipStyle} className="p-2">
        <div style={{ color: "var(--color-gray-400)", marginBottom: "4px" }}>{label}</div>
        <div style={{ color: data.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 700 }}>
          {formatCurrency(data.pnl, "USD", true, 2)}
        </div>
        <div style={{ color: "var(--color-gray-300)", fontSize: "0.7rem", marginTop: "2px" }}>
          {data.count} trades · {data.winRate.toFixed(1)}% WR
        </div>
      </div>
    );
  }
  return null;
}

export function AdvancedStatsClient() {
  const [data, setData] = useState<AdvancedStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState("all")
  const [symbol, setSymbol] = useState("")
  const [setup, setSetup] = useState("")
  const [side, setSide] = useState("")
  const [available, setAvailable] = useState<{ symbols: string[]; setups: string[] }>({ symbols: [], setups: [] })

  const load = useCallback(async (filters: { period: string; symbol: string; setup: string; side: string }, signal?: AbortSignal) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("accountId", "all")
      if (filters.period && filters.period !== "all") params.set("period", filters.period)
      if (filters.symbol) params.set("symbol", filters.symbol)
      if (filters.setup) params.set("setup", filters.setup)
      if (filters.side) params.set("side", filters.side)
      const res = await fetch(`/api/metrics/advanced?${params.toString()}`, { signal })
      const d = await res.json()
      setData(d)
      if (!d.empty && d.symbols) {
        setAvailable(prev => ({
          symbols: prev.symbols.length ? prev.symbols : d.symbols.map((s: BreakdownItem) => s.name),
          setups: prev.setups.length ? prev.setups : d.setups.map((s: BreakdownItem) => s.name),
        }))
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      toast.error("Failed to load stats")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load({ period, symbol, setup, side }, controller.signal)
    return () => controller.abort()
  }, [period, symbol, setup, side, load])

  const apply = useCallback((patch: FilterPatch) => {
    if (patch.period !== undefined) setPeriod(patch.period)
    if (patch.symbol !== undefined) setSymbol(patch.symbol)
    if (patch.setup !== undefined) setSetup(patch.setup)
    if (patch.side !== undefined) setSide(patch.side)
  }, [])

  const kpis = data?.kpis as Kpis | undefined
  const streaks = data?.streaks as Streaks | undefined
  const drawdown = data?.drawdown as Drawdown | undefined
  const drawdownEpisodes = data?.drawdownEpisodes ?? []
  const equityCurve = data?.equityCurve as EquityPoint[]
  const rrDistribution = data?.rrDistribution ?? {}
  const dowPerformance = data?.dowPerformance ?? []
  const sessionPerformance = data?.sessionPerformance
  const durations = data?.durations
  const hourPerformance = data?.hourPerformance ?? []
  const monthlyPerformance = data?.monthlyPerformance ?? []
  const topSymbols = data?.topSymbols as BreakdownItem[]
  const topSetups = data?.topSetups as BreakdownItem[]
  const symbols = data?.symbols ?? []
  const setups = data?.setups ?? []
  const instruments = (data?.instruments ?? []) as BreakdownItem[]
  const sides = (data?.sides ?? []) as BreakdownItem[]

  const rrData = useMemo(() => Object.entries(rrDistribution).map(([name, value]) => ({ name, value })), [rrDistribution])
  const dowData = useMemo(() => dowPerformance.map((item, index: number) => ({
    name: dayNames[index].substring(0, 3),
    pnl: item.pnl,
    winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
    count: item.count
  })).filter((d, i: number) => !(d.count === 0 && (i === 0 || i === 6))), [dowPerformance])
  const hourData = useMemo(() => hourPerformance.map((pnl: number, h: number) => ({ hour: `${String(h).padStart(2, "0")}H`, pnl })), [hourPerformance])
  const monthData = useMemo(() => monthlyPerformance.map((m: { month: string; pnl: number }) => ({ name: m.month.slice(5), pnl: m.pnl })), [monthlyPerformance])
  const worstSymbols = useMemo(() => [...symbols].reverse().slice(0, 3), [symbols])
  const worstSetups = useMemo(() => [...setups].reverse().slice(0, 3), [setups])

  const sessionData = useMemo(() => {
    if (!sessionPerformance) return []
    return [
      { name: "Asian", ...sessionPerformance.asian, winRate: sessionPerformance.asian.count > 0 ? (sessionPerformance.asian.wins / sessionPerformance.asian.count) * 100 : 0 },
      { name: "London", ...sessionPerformance.london, winRate: sessionPerformance.london.count > 0 ? (sessionPerformance.london.wins / sessionPerformance.london.count) * 100 : 0 },
      { name: "New York", ...sessionPerformance.newYork, winRate: sessionPerformance.newYork.count > 0 ? (sessionPerformance.newYork.wins / sessionPerformance.newYork.count) * 100 : 0 },
    ].filter(s => s.count > 0)
  }, [sessionPerformance])

  const durationData = useMemo(() => {
    if (!durations) return []
    return [
      { name: "Avg Win", minutes: durations.avgWinDurationMinutes || 0, fill: "var(--color-profit)" },
      { name: "Avg Loss", minutes: durations.avgLossDurationMinutes || 0, fill: "var(--color-loss)" },
    ]
  }, [durations])

  const winLossData = useMemo(() => {
    if (!kpis) return []
    const wins = Math.round((kpis.winRate / 100) * kpis.totalTrades)
    const losses = kpis.totalTrades - wins
    return [
      { name: "Wins", value: wins, color: "var(--color-profit)" },
      { name: "Losses", value: losses, color: "var(--color-loss)" },
    ]
  }, [kpis])

  const instrumentData = useMemo(() => instruments.map(i => ({
    name: i.name.charAt(0).toUpperCase() + i.name.slice(1),
    value: i.count,
    pnl: i.pnl,
    color: INSTRUMENT_COLORS[i.name] || "var(--color-gray-500)",
  })), [instruments])

  const sideData = useMemo(() => sides.map(s => ({
    name: s.name === "LONG" ? "Long" : "Short",
    value: s.count,
    pnl: s.pnl,
    color: SIDE_COLORS[s.name] || "var(--color-gray-500)",
  })), [sides])

  const sessionDonutData = useMemo(() => sessionData.map((s, i) => ({
    name: s.name,
    value: s.count,
    pnl: s.pnl,
    color: SESSION_COLORS[i],
  })), [sessionData])

  const exportBreakdown = useCallback(() => {
    const rows = ["type,name,count,winRate%,netPnl"]
    symbols.forEach((s: BreakdownItem) => rows.push(`symbol,${s.name},${s.count},${s.winRate.toFixed(1)},${s.pnl.toFixed(2)}`))
    setups.forEach((s: BreakdownItem) => rows.push(`setup,${s.name},${s.count},${s.winRate.toFixed(1)},${s.pnl.toFixed(2)}`))
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stats-breakdown.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [symbols, setups])

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: "var(--radius-card)" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-card)" }} />
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-card)" }} />
        </div>
      </div>
    )
  }

  if (!data || data.empty || !kpis || !streaks || !drawdown) {
    return (
      <div>
        <StatsFilters available={available} filters={{ period, symbol, setup, side }} apply={apply} />
        <div className="empty-state" style={{ marginTop: "1rem" }}>No trading data available.</div>
      </div>
    )
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — Hero KPIs                                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem" }}>
        <KpiStat icon={<BarChart3 size={14} />} label="Profit Factor" value={kpis.profitFactor === 99 ? "∞" : kpis.profitFactor.toFixed(2)} color={kpis.profitFactor >= 2 ? "var(--color-profit)" : kpis.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)"} sub="Target > 2.0" />
        <KpiStat icon={<TrendingUp size={14} />} label="Expectancy" value={formatCurrency(kpis.expectancy, "USD", true, 2)} color={kpis.expectancy >= 0 ? "var(--color-profit)" : "var(--color-loss)"} sub={`Win ${formatCurrency(kpis.avgWin, "USD", false, 0)} / Loss ${formatCurrency(kpis.avgLoss, "USD", false, 0)}`} />
        <KpiStat icon={<AlertTriangle size={14} />} label="Max Drawdown" value={formatCurrency(drawdown.maxDrawdown, "USD", true, 2)} color="var(--color-loss)" sub={`${drawdown.maxDrawdownPct.toFixed(1)}% from peak`} />
        <KpiStat icon={<Activity size={14} />} label="Streaks" value={`${streaks.longestWinStreak}W / ${streaks.longestLossStreak}L`} color="var(--color-gray-100)" sub={`Current: ${streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak}W` : `${streaks.currentLossStreak}L`}`} />
        <KpiStat icon={<Award size={14} />} label="Sortino" value={kpis.sortino === 99 ? "∞" : kpis.sortino.toFixed(2)} color={kpis.sortino >= 1 ? "var(--color-profit)" : "var(--color-loss)"} sub="Downside-adjusted" />
        <KpiStat icon={<TrendingUp size={14} />} label="Sharpe" value={kpis.sharpe === 99 ? "∞" : kpis.sharpe.toFixed(2)} color={kpis.sharpe >= 1 ? "var(--color-profit)" : kpis.sharpe >= 0 ? "var(--color-warning)" : "var(--color-loss)"} sub="Risk-adjusted return" />
        <KpiStat icon={<BarChart3 size={14} />} label="Calmar" value={kpis.calmar === 99 ? "∞" : kpis.calmar.toFixed(2)} color={kpis.calmar >= 1 ? "var(--color-profit)" : kpis.calmar >= 0 ? "var(--color-warning)" : "var(--color-loss)"} sub="Return / Max DD" />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 2 — Distribution Donuts: Win/Loss + Side + Instrument + Sessions */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}>
        <DonutChart
          data={winLossData}
          title="Win / Loss"
          subtitle={`${kpis.totalTrades} trades`}
          innerLabel={`${kpis.winRate.toFixed(1)}%`}
          innerSublabel="Win Rate"
          height={170}
          showLegend={false}
        />
        <DonutChart
          data={sideData}
          title="Long vs Short"
          subtitle="By trade count"
          innerLabel={sides.length > 0 ? sides.reduce((a, b) => a.count > b.count ? a : b).name === "LONG" ? "Long" : "Short" : "—"}
          innerSublabel="Most traded"
          height={180}
        />
        <DonutChart
          data={instrumentData}
          title="By Instrument"
          subtitle="Trade distribution"
          innerLabel={instruments.length > 0 ? instruments[0].name.charAt(0).toUpperCase() + instruments[0].name.slice(1) : "—"}
          innerSublabel="Top instrument"
          height={180}
        />
        <DonutChart
          data={sessionDonutData}
          title="Sessions"
          subtitle="Trades per session"
          innerLabel={sessionData.length > 0 ? sessionData.reduce((a, b) => a.count > b.count ? a : b).name : "—"}
          innerSublabel="Most active"
          height={180}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 2.5 — Mood vs Performance                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {data?.moodPerformance && Object.keys(data.moodPerformance).length > 0 && (
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "1rem" }}>Mood vs Performance</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
            {Object.entries(data.moodPerformance).map(([mood, stats]) => {
              const winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0
              const avgPnl = stats.count > 0 ? stats.pnl / stats.count : 0
              return (
                <div key={mood} style={{
                  padding: "0.75rem", borderRadius: 10,
                  background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "capitalize", marginBottom: 6 }}>
                    {mood}
                  </div>
                  <div style={{
                    fontSize: "1.1rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
                    color: stats.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                  }}>
                    {formatCurrency(stats.pnl, "USD", true)}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: 4 }}>
                    {stats.count} days · {winRate.toFixed(0)}% WR
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-gray-600)", marginTop: 2 }}>
                    avg {formatCurrency(avgPnl, "USD", true)}/day
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — Equity Curve + Drawdown Episodes                       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {equityCurve && equityCurve.length > 1 ? (
            <EquityCurveChart
              equityData={equityCurve}
              initialBalance={equityCurve[0]?.equity ?? 0}
            />
          ) : (
            <div className="empty-state">No equity data.</div>
          )}
        </div>

        <div className="chart-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flex: 1 }}>
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
              <div style={{ flex: 1 }}>
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
                    {drawdownEpisodes.map((ep: DrawdownEpisode, i: number) => (
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — R:Reward Donut + Day of Week + Duration Donut          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
        <DonutChart
          data={rrData.map((d, i) => ({ name: d.name, value: d.value, color: ["var(--color-loss)", "var(--color-warning)", "var(--color-profit)", "var(--color-info)", "#8b5cf6"][i] }))}
          title="R:Reward Distribution"
          subtitle="Risk : Reward ratio"
          innerLabel={rrData.length > 0 ? rrData.reduce((a, b) => a.value > b.value ? a : b).name : "—"}
          innerSublabel="Most common"
          height={180}
        />

        <div className="chart-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Day of Week</div>
          <div style={{ flex: 1, minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 11, fontWeight: 600 }} dy={8} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} content={<CustomDowTooltip />} />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dowData.map((entry, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DonutChart
          data={durationData.map((d) => ({ name: d.name, value: d.minutes, color: d.fill }))}
          title="Avg Duration"
          subtitle="Minutes per trade"
          innerLabel={(() => {
            const avg = durationData.length > 0 ? durationData.reduce((s, d) => s + d.minutes, 0) / durationData.length : 0
            const h = Math.floor(avg / 60)
            const m = Math.round(avg % 60)
            return h > 0 ? `${h}h ${m}m` : `${m}m`
          })()}
          innerSublabel="Average"
          height={180}
          formatValue={(v) => { const h = Math.floor(v / 60); const m = Math.round(v % 60); return h > 0 ? `${h}h ${m}m` : `${m}m` }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 5 — Hour of Day + Monthly                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Hour of Day</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 9 }} interval={2} dy={6} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={pnlFormatter} contentStyle={tooltipStyle} />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {hourData.map((entry: { hour: string; pnl: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Monthly Performance</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 10, fontWeight: 600 }} dy={8} />
                <YAxis hide />
                <Tooltip cursor={{ fill: "var(--color-gray-800)" }} formatter={pnlFormatter} contentStyle={tooltipStyle} />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {monthData.map((entry: { name: string; pnl: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 6 — Top / Worst performers                                  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <BreakdownCard title="Top Symbols" items={topSymbols} icon={<TrendingUp size={14} />} />
        <BreakdownCard title="Top Setups" items={topSetups} icon={<Target size={14} />} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1rem" }}>
        <BreakdownCard title="Worst Symbols" items={worstSymbols} icon={<TrendingDown size={14} />} />
        <BreakdownCard title="Worst Setups" items={worstSetups} icon={<AlertTriangle size={14} />} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ROW 7 — Full Breakdown                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: "2rem", }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div className="chart-title" style={{ margin: 0 }}>Full Breakdown</div>
          <button className="btn btn-outline btn-sm" onClick={exportBreakdown} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Download size={14} /> CSV
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <BreakdownTable title="By Symbol" rows={symbols} />
          <BreakdownTable title="By Setup" rows={setups} />
        </div>
      </div>
    </div>
  )
}

function KpiStat({ icon, label, value, color, sub }: { icon: React.ReactNode; label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="kpi-card" style={{
      display: "flex", flexDirection: "column", gap: "0.4rem"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-500)", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, fontFamily: "var(--font-mono)", color, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-500)" }}>{sub}</div>}
    </div>
  )
}

function StatsFilters({ available, filters, apply }: { available: { symbols: string[]; setups: string[] }; filters: FilterState; apply: (p: FilterPatch) => void }) {
  const hasFilters = filters.period !== "all" || filters.symbol || filters.setup || filters.side
  return (
    <div className="chart-card" style={{
      display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center",
      padding: "0.75rem 1rem",
    }}>
      <div style={{ display: "flex", background: "var(--color-gray-950)", borderRadius: "8px", padding: "2px", gap: "2px" }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => apply({ period: p.key })}
            style={{
              padding: "0.3rem 0.65rem", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 600,
              border: "none", cursor: "pointer", transition: "all 0.15s",
              background: filters.period === p.key ? "rgba(0, 199, 88, 0.15)" : "transparent",
              color: filters.period === p.key ? "var(--color-profit)" : "var(--color-gray-500)",
            }}
          >{p.label}</button>
        ))}
      </div>

      <div style={{ width: 1, height: 20, background: "var(--color-gray-800)" }} />

      <select className="input select" value={filters.symbol} onChange={e => apply({ symbol: e.target.value })} style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem", width: "140px" }}>
        <option value="">All symbols</option>
        {available.symbols.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select className="input select" value={filters.setup} onChange={e => apply({ setup: e.target.value })} style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem", width: "140px" }}>
        <option value="">All setups</option>
        {available.setups.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <select className="input select" value={filters.side} onChange={e => apply({ side: e.target.value })} style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem", width: "140px" }}>
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
    <div className="kpi-card" style={{ padding: "0.75rem 1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
      <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.15rem" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-gray-100)" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{sub}</div>}
    </div>
  )
}

function BreakdownCard({ title, items, icon }: { title: string; items: BreakdownItem[]; icon?: React.ReactNode }) {
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
          {items.map((item: BreakdownItem, i: number) => (
            <div key={item.name} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "0.6rem 0.75rem",
              background: "var(--color-gray-950)", borderRadius: "8px", border: "1px solid var(--color-gray-800)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{
                  width: "22px", height: "22px", borderRadius: "6px",
                  background: item.pnl >= 0 ? "var(--profit-muted)" : "var(--loss-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.7rem", fontWeight: 700,
                  color: item.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                }}>
                  {i + 1}
                </div>
                <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-gray-200)" }}>{item.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--color-gray-500)" }}>{item.count} trades · {item.winRate.toFixed(0)}% W</span>
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

function BreakdownTable({ title, rows }: { title: string; rows: BreakdownItem[] }) {
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
              {rows.map((r: BreakdownItem) => (
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
