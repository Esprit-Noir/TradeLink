"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

type Template = {
  id: string
  firmName: string
  programName: string
  drawdownType: string
  dailyDDPct: number
  maxDDPct: number
  profitTargetPct: number
  minTradingDays: number
  maxTradingDays: number | null
  consistencyRulePct: number
  dailyResetTimezone: string
}

type Result = {
  result: "passed" | "failed" | "in_progress"
  reason?: string
  message: string
  tradingDays?: number
  daysElapsed?: number
  finalBalance?: number
  peakProfitPct?: number
  currentProfitPct?: number
  maxDrawdownUsedPct?: number
  biggestDayPct?: number
  equityCurve?: { date: string; balance: number }[]
  dailyBreakdown?: { date: string; pnl: number; balance: number; cumPnl: number }[]
}

export function BacktestRunner({ templates, accounts }: { templates: Template[]; accounts: { id: string; name: string }[] }) {
  const [mode, setMode] = useState<"history" | "simulate">("history")
  const [templateId, setTemplateId] = useState(templates[0]?.id || "")
  const [accountId, setAccountId] = useState(accounts[0]?.id || "")
  const [initialBalance, setInitialBalance] = useState("100000")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const template = templates.find(t => t.id === templateId)

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    const t = templates.find(x => x.id === id)
    if (t) setInitialBalance("100000")
  }

  const run = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/prop-firms/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: accountId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          initialBalance: Number(initialBalance) || 100000,
          profitTargetPct: template?.profitTargetPct,
          maxDDPct: template?.maxDDPct,
          dailyDDPct: template?.dailyDDPct,
          minTradingDays: template?.minTradingDays,
          maxTradingDays: template?.maxTradingDays ?? null,
          consistencyRulePct: template?.consistencyRulePct ?? 0,
          drawdownType: template?.drawdownType ?? "static_balance",
          dailyResetTimezone: template?.dailyResetTimezone ?? "UTC",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Backtest failed")
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backtest failed")
    } finally {
      setLoading(false)
    }
  }

  const resultColor = result?.result === "passed" ? "var(--color-profit)" : result?.result === "failed" ? "var(--color-loss)" : "var(--color-warning)"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={() => setMode("history")}
          style={{
            padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            border: `1px solid ${mode === "history" ? "var(--color-brand-500)" : "var(--color-gray-800)"}`,
            background: mode === "history" ? "rgba(139,92,246,0.1)" : "var(--color-gray-900)",
            color: mode === "history" ? "var(--color-brand-300)" : "var(--color-gray-400)",
          }}
        >
          Historical backtest
        </button>
        <button
          onClick={() => setMode("simulate")}
          style={{
            padding: "0.5rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
            border: `1px solid ${mode === "simulate" ? "var(--color-brand-500)" : "var(--color-gray-800)"}`,
            background: mode === "simulate" ? "rgba(139,92,246,0.1)" : "var(--color-gray-900)",
            color: mode === "simulate" ? "var(--color-brand-300)" : "var(--color-gray-400)",
          }}
        >
          Strategy simulator
        </button>
      </div>

      {mode === "simulate" ? (
        <Simulator templates={templates} />
      ) : (
        <>
          <div className="chart-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.9rem" }}>
              <div className="form-group">
                <label className="label">Firm template</label>
                <select className="input select" value={templateId} onChange={e => applyTemplate(e.target.value)} disabled={loading}>
                  <option value="" disabled>Select a template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.firmName} — {t.programName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Trading account</label>
                <select className="input select" value={accountId} onChange={e => setAccountId(e.target.value)} disabled={loading}>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Starting balance ($)</label>
                <input className="input" type="number" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="label">From</label>
                <input className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={loading} />
              </div>
              <div className="form-group">
                <label className="label">To</label>
                <input className="input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={loading} />
              </div>
              <div className="form-group" style={{ justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={run} disabled={loading || !templateId}>
                  {loading ? "Running…" : "Run backtest"}
                </button>
              </div>
            </div>

            {template && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1rem", fontSize: "0.72rem" }}>
                {[
                  `Target: ${template.profitTargetPct}%`,
                  `Max DD: ${template.maxDDPct}% (${template.drawdownType})`,
                  `Daily DD: ${template.dailyDDPct}%`,
                  `Min days: ${template.minTradingDays}`,
                  template.maxTradingDays ? `Max days: ${template.maxTradingDays}` : "No time limit",
                  template.consistencyRulePct ? `Consistency: ${template.consistencyRulePct}%` : null,
                ].filter(Boolean).map((chip, i) => (
                  <span key={i} style={{ padding: "0.25rem 0.6rem", borderRadius: "6px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", color: "var(--color-gray-400)" }}>
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="chart-card" style={{ padding: "1rem", border: "1px solid var(--color-loss)", color: "var(--color-loss)" }}>
              {error}
            </div>
          )}

          {result && (
            <div className="chart-card" style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem" }}>
                <span style={{
                  fontSize: "1.4rem", fontWeight: 800, color: resultColor, textTransform: "uppercase",
                  padding: "0.35rem 0.9rem", borderRadius: "10px", background: "var(--color-gray-900)", border: `1px solid ${resultColor}`,
                }}>
                  {result.result}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{result.message}</div>
                  {result.reason && <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>Reason: {result.reason.replace('_', ' ')}</div>}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <Metric label="Trading days" value={String(result.tradingDays ?? "—")} />
                <Metric label="Calendar days" value={String(result.daysElapsed ?? "—")} />
                <Metric label="Final balance" value={`$${(result.finalBalance ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
                <Metric label="Max DD used" value={result.maxDrawdownUsedPct != null ? `${result.maxDrawdownUsedPct}%` : "—"} color={result.maxDrawdownUsedPct != null && result.maxDrawdownUsedPct >= 80 ? "var(--color-loss)" : undefined} />
                <Metric label="Peak profit" value={result.peakProfitPct != null ? `${result.peakProfitPct}%` : result.currentProfitPct != null ? `${result.currentProfitPct}%` : "—"} color="var(--color-profit)" />
              </div>

              {result.equityCurve && result.equityCurve.length > 0 && (
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="btEq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} domain={["auto", "auto"]} />
                      <Tooltip contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }} />
                      <Area type="monotone" dataKey="balance" stroke="var(--color-brand-500)" strokeWidth={2} fill="url(#btEq)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Strategy Simulator (Monte Carlo) ───────────────────────────────────────
function Simulator({ templates }: { templates: Template[] }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id || "")
  const [initialBalance, setInitialBalance] = useState("100000")
  const [winRate, setWinRate] = useState("45")
  const [avgR, setAvgR] = useState("2.0")
  const [tradesPerDay, setTradesPerDay] = useState("3")
  const [riskPct, setRiskPct] = useState("0.5")
  const [sims, setSims] = useState("2000")
  const [running, setRunning] = useState(false)
  const [out, setOut] = useState<{
    passRate: number; medianDays: number; medianFinalPct: number;
    p10: { day: number; pct: number }[]; p50: { day: number; pct: number }[]; p90: { day: number; pct: number }[];
    failBreakdown: Record<string, number>;
  } | null>(null)

  const template = templates.find(t => t.id === templateId)

  const runSim = () => {
    setRunning(true)
    setOut(null)
    // Defer heavy computation off the render frame
    setTimeout(() => {
      const winP = (Number(winRate) || 0) / 100
      const r = Number(avgR) || 1
      const tpd = Math.max(1, Math.round(Number(tradesPerDay) || 1))
      const risk = (Number(riskPct) || 0.5) / 100
      const nSims = Math.min(5000, Math.max(100, Number(sims) || 2000))
      const startBal = Number(initialBalance) || 100000
      const targetPct = template?.profitTargetPct ?? 10
      const maxDDPct = template?.maxDDPct ?? 10
      const dailyDDPct = template?.dailyDDPct ?? 5
      const minDays = template?.minTradingDays ?? 5
      const maxDays = template?.maxTradingDays ?? 60

      let passes = 0
      const failBreakdown: Record<string, number> = {}
      const dayArrays: number[][] = [] // per-sim arrays of profit% by day (index = day-1)

      for (let s = 0; s < nSims; s++) {
        let bal = startBal
        let peak = startBal
        let profitPct = 0
        const curve: number[] = []

        for (let d = 1; d <= maxDays; d++) {
          let dayPnlFrac = 0
          for (let t = 0; t < tpd; t++) {
            const win = Math.random() < winP
            dayPnlFrac += win ? r : -1
          }
          const dayFrac = dayPnlFrac * risk
          bal *= 1 + dayFrac
          peak = Math.max(peak, bal)
          profitPct = (bal / startBal - 1) * 100
          curve.push(profitPct)

          // Daily drawdown check (relative to day start)
          const dayStart = bal / (1 + dayFrac)
          const dailyDD = dayStart > 0 ? ((dayStart - bal) / dayStart) * 100 : 0
          if (dailyDD > dailyDDPct) {
            failBreakdown["Daily drawdown"] = (failBreakdown["Daily drawdown"] || 0) + 1
            break
          }
          // Max drawdown check (trailing from peak)
          const maxDD = peak > 0 ? ((peak - bal) / peak) * 100 : 0
          if (maxDD > maxDDPct) {
            failBreakdown["Max drawdown"] = (failBreakdown["Max drawdown"] || 0) + 1
            break
          }
          // Pass
          if (d >= minDays && profitPct >= targetPct) {
            passes++
            break
          }
          // Time limit
          if (d === maxDays) {
            failBreakdown["Time limit"] = (failBreakdown["Time limit"] || 0) + 1
          }
        }
        dayArrays.push(curve)
      }

      // Aggregate percentiles
      const maxLen = Math.max(...dayArrays.map(c => c.length))
      const p10: { day: number; pct: number }[] = []
      const p50: { day: number; pct: number }[] = []
      const p90: { day: number; pct: number }[] = []
      for (let d = 0; d < maxLen; d++) {
        const vals: number[] = []
        for (const c of dayArrays) if (d < c.length) vals.push(c[d])
        vals.sort((a, b) => a - b)
        const q = (p: number) => vals[Math.min(vals.length - 1, Math.floor(vals.length * p))]
        p10.push({ day: d + 1, pct: q(0.1) })
        p50.push({ day: d + 1, pct: q(0.5) })
        p90.push({ day: d + 1, pct: q(0.9) })
      }

      const passRate = (passes / nSims) * 100
      const medianFinal = p50[p50.length - 1]?.pct ?? 0
      const medianDays = p50.findIndex(p => p.pct >= targetPct) + 1 || maxLen

      setOut({ passRate, medianDays, medianFinalPct: medianFinal, p10, p50, p90, failBreakdown })
      setRunning(false)
    }, 50)
  }

  const chartData = out ? out.p50.map((p, i) => ({
    day: `D${p.day}`,
    median: +p.pct.toFixed(2),
    low: +(out.p10[i]?.pct ?? p.pct).toFixed(2),
    high: +(out.p90[i]?.pct ?? p.pct).toFixed(2),
  })) : []

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="chart-card" style={{ padding: "1.25rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.9rem" }}>
          <div className="form-group">
            <label className="label">Firm template</label>
            <select className="input select" value={templateId} onChange={e => setTemplateId(e.target.value)}>
              <option value="" disabled>Select a template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.firmName} — {t.programName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Win rate (%)</label>
            <input className="input" type="number" step="0.5" value={winRate} onChange={e => setWinRate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Avg R (reward multiple)</label>
            <input className="input" type="number" step="0.1" value={avgR} onChange={e => setAvgR(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Trades / day</label>
            <input className="input" type="number" min="1" value={tradesPerDay} onChange={e => setTradesPerDay(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Risk / trade (%)</label>
            <input className="input" type="number" step="0.1" min="0.1" max="5" value={riskPct} onChange={e => setRiskPct(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Simulations</label>
            <input className="input" type="number" min="100" max="5000" step="100" value={sims} onChange={e => setSims(e.target.value)} />
          </div>
          <div className="form-group" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={runSim} disabled={running || !template}>
              {running ? "Simulating…" : "Run simulation"}
            </button>
          </div>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.75rem" }}>
          Monte Carlo simulation applying the selected firm&apos;s rules (target, max & daily drawdown, min/max days) to a hypothetical strategy. Expectancy per trade: {(winRate && avgR ? ((Number(winRate) / 100) * Number(avgR) - (1 - Number(winRate) / 100)).toFixed(2) : "0")} R.
        </p>
      </div>

      {out && (
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Metric label="Pass probability" value={`${out.passRate.toFixed(1)}%`} color={out.passRate >= 50 ? "var(--color-profit)" : "var(--color-loss)"} />
            <Metric label="Median time to pass" value={out.medianDays <= (template?.maxTradingDays ?? 60) ? `${out.medianDays} days` : "—"} />
            <Metric label="Median final P&L" value={`${out.medianFinalPct >= 0 ? "+" : ""}${out.medianFinalPct.toFixed(1)}%`} color={out.medianFinalPct >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
            <Metric label="P90 outcome" value={`${out.p90[out.p90.length - 1]?.pct >= 0 ? "+" : ""}${(out.p90[out.p90.length - 1]?.pct ?? 0).toFixed(1)}%`} color="var(--color-profit)" />
            <Metric label="P10 outcome" value={`${(out.p10[out.p10.length - 1]?.pct ?? 0).toFixed(1)}%`} color="var(--color-loss)" />
          </div>

          {Object.keys(out.failBreakdown).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem", fontSize: "0.75rem" }}>
              {Object.entries(out.failBreakdown).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <span key={k} style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", color: "var(--color-gray-400)" }}>
                  Failed: {k} — {v.toLocaleString()} sims
                </span>
              ))}
            </div>
          )}

          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="simMed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} interval={Math.max(1, Math.floor(chartData.length / 15))} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                   formatter={(val, name) => [`${Number(val).toFixed(1)}%`, name === "median" ? "Median" : name === "low" ? "P10 (worst)" : "P90 (best)"]}
                />
                <Area type="monotone" dataKey="high" stroke="none" fill="var(--color-brand-500)" fillOpacity={0.08} />
                <Area type="monotone" dataKey="low" stroke="none" fill="var(--color-gray-900)" />
                <Area type="monotone" dataKey="median" stroke="var(--color-brand-500)" strokeWidth={2} fill="url(#simMed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: "1.15rem", fontWeight: 700, color: color || "var(--color-gray-100)" }}>{value}</div>
    </div>
  )
}
