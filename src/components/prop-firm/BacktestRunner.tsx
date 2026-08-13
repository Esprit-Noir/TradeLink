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
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const resultColor = result?.result === "passed" ? "var(--color-profit)" : result?.result === "failed" ? "var(--color-loss)" : "var(--color-warning)"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="card" style={{ padding: "1.25rem" }}>
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
        <div className="card" style={{ padding: "1rem", border: "1px solid var(--color-loss)", color: "var(--color-loss)" }}>
          {error}
        </div>
      )}

      {result && (
        <div className="card" style={{ padding: "1.25rem" }}>
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
