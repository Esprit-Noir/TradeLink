"use client"

import { useState, useEffect, useMemo } from "react"
import { Calculator, ShieldAlert, Settings2, AlertTriangle, Info, Save } from "lucide-react"
import { toast } from "sonner"

type RiskStatus = {
  prefs: { dailyLossLimit: number | null; maxTradesPerDay: number | null; maxConsecutiveLosses: number | null; maxRiskPerTradePct: number | null }
  today: { pnl: number; trades: number; consecutiveLosses: number }
  weekPnl: number
  baseCurrency: string
  alerts: { severity: "critical" | "warning" | "info"; message: string }[]
}

export function RiskManager() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [status, setStatus] = useState<RiskStatus | null>(null)

  // Calculator inputs
  const [calcAccount, setCalcAccount] = useState("")
  const [calcBalance, setCalcBalance] = useState("100000")
  const [riskPct, setRiskPct] = useState("1")
  const [entryPrice, setEntryPrice] = useState("")
  const [stopPrice, setStopPrice] = useState("")

  // Limits form
  const [dailyLossLimit, setDailyLossLimit] = useState("")
  const [maxTradesPerDay, setMaxTradesPerDay] = useState("")
  const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState("")
  const [maxRiskPerTradePct, setMaxRiskPerTradePct] = useState("1")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/accounts")
      .then(r => r.json())
      .then(d => {
        if (d.accounts) {
          setAccounts(d.accounts)
          const active = d.accounts.find((a: any) => a.isActive) || d.accounts[0]
          if (active) {
            setCalcAccount(active.id)
            setCalcBalance(String(Number(active.initialBalance ?? 0) || 100000))
          }
        }
      })
      .catch(() => {})

    fetch(`/api/risk/status${window.location.search}`)
      .then(r => r.json())
      .then(d => {
        setStatus(d)
        setDailyLossLimit(d.prefs.dailyLossLimit != null ? String(d.prefs.dailyLossLimit) : "")
        setMaxTradesPerDay(d.prefs.maxTradesPerDay != null ? String(d.prefs.maxTradesPerDay) : "")
        setMaxConsecutiveLosses(d.prefs.maxConsecutiveLosses != null ? String(d.prefs.maxConsecutiveLosses) : "")
        setMaxRiskPerTradePct(d.prefs.maxRiskPerTradePct != null ? String(d.prefs.maxRiskPerTradePct) : "1")
      })
      .catch(() => {})
  }, [])

  const handleAccountChange = (id: string) => {
    setCalcAccount(id)
    const acc = accounts.find(a => a.id === id)
    if (acc) setCalcBalance(String(Number(acc.initialBalance ?? 0) || 100000))
  }

  const calc = useMemo(() => {
    const bal = Number(calcBalance) || 0
    const risk = (Number(riskPct) || 0) / 100
    const riskAmount = bal * risk
    const entry = Number(entryPrice)
    const stop = Number(stopPrice)
    let size: number | null = null
    let stopDist = 0
    let maxRiskPct = 0
    let maxRiskAmount = 0
    if (entry > 0 && stop > 0) {
      stopDist = Math.abs(entry - stop)
      size = stopDist > 0 ? riskAmount / stopDist : null
    }
    const riskLimitPct = status?.prefs.maxRiskPerTradePct ?? 1
    if (bal > 0 && riskLimitPct > 0) {
      maxRiskAmount = bal * (riskLimitPct / 100)
      maxRiskPct = maxRiskAmount > 0 ? (riskAmount / maxRiskAmount) * 100 : 0
    }
    return { riskAmount, size, stopDist, maxRiskAmount, maxRiskPct, bal }
  }, [calcBalance, riskPct, entryPrice, stopPrice, status])

  const savePrefs = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/risk/prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dailyLossLimit: dailyLossLimit,
          maxTradesPerDay: maxTradesPerDay,
          maxConsecutiveLosses: maxConsecutiveLosses,
          maxRiskPerTradePct: maxRiskPerTradePct,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Risk limits saved")
      const s = await fetch(`/api/risk/status${window.location.search}`).then(r => r.json())
      setStatus(s)
    } catch {
      toast.error("Failed to save risk limits")
    } finally {
      setSaving(false)
    }
  }

  const currency = status?.baseCurrency || "USD"
  const fmt = (v: number, sign = false) =>
    `${sign && v > 0 ? "+" : ""}${v.toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2 })}`

  const dailyUsedPct = status?.prefs.dailyLossLimit && status.prefs.dailyLossLimit !== 0
    ? Math.min(100, (Math.max(0, status.today.pnl) / Math.abs(status.prefs.dailyLossLimit)) * 0) || Math.min(100, (Math.abs(Math.min(0, status.today.pnl)) / Math.abs(status.prefs.dailyLossLimit)) * 100)
    : 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Alerts */}
      {status && status.alerts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {status.alerts.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem 1rem", borderRadius: "8px",
                background: a.severity === "critical" ? "rgba(239,68,68,0.08)" : a.severity === "warning" ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                border: `1px solid ${a.severity === "critical" ? "rgba(239,68,68,0.35)" : a.severity === "warning" ? "rgba(245,158,11,0.35)" : "rgba(59,130,246,0.35)"}`,
                fontSize: "0.85rem", color: "var(--color-gray-200)",
              }}
            >
              {a.severity === "critical" ? <ShieldAlert size={16} style={{ color: "var(--color-loss)", marginTop: 1 }} />
                : a.severity === "warning" ? <AlertTriangle size={16} style={{ color: "var(--color-warning)", marginTop: 1 }} />
                : <Info size={16} style={{ color: "var(--color-info)", marginTop: 1 }} />}
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(600px, 1fr))", gap: "1.5rem", alignItems: "start" }}>

        {/* ── Live risk status ── */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <ShieldAlert size={16} style={{ color: "var(--color-brand-500)" }} />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Live Risk Status</h2>
          </div>

          {!status ? (
            <div className="skeleton" style={{ height: 120 }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Daily loss limit */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-400)" }}>Daily loss budget</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: status.prefs.dailyLossLimit != null ? (Math.abs(status.today.pnl) / Math.abs(status.prefs.dailyLossLimit) > 0.7 ? "var(--color-loss)" : "var(--color-gray-200)") : "var(--color-gray-600)" }}>
                    {status.today.pnl <= 0 ? Math.abs(status.today.pnl).toFixed(0) : 0} / {status.prefs.dailyLossLimit != null ? Math.abs(status.prefs.dailyLossLimit) : "∞"} {currency}
                  </span>
                </div>
                <div style={{ background: "var(--color-gray-800)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${dailyUsedPct}%`, borderRadius: 6, transition: "width 400ms ease",
                    background: dailyUsedPct >= 100 ? "var(--color-loss)" : dailyUsedPct >= 70 ? "var(--color-warning)" : "var(--color-profit)",
                  }} />
                </div>
                {status.prefs.dailyLossLimit != null && (
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
                    {status.today.pnl > 0 ? "No losses today yet." : `${Math.round(dailyUsedPct)}% of your daily loss budget used.`}
                  </div>
                )}
              </div>

              {/* Trades today */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <MiniStat label="Trades today" value={`${status.today.trades}`} sub={status.prefs.maxTradesPerDay != null ? `limit ${status.prefs.maxTradesPerDay}` : "no limit"} />
                <MiniStat label="P&L today" value={fmt(status.today.pnl, true)} color={status.today.pnl > 0 ? "var(--color-profit)" : status.today.pnl < 0 ? "var(--color-loss)" : "var(--color-gray-200)"} />
                <MiniStat label="Week P&L" value={fmt(status.weekPnl, true)} color={status.weekPnl > 0 ? "var(--color-profit)" : status.weekPnl < 0 ? "var(--color-loss)" : "var(--color-gray-200)"} />
              </div>

              {/* Consecutive losses */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", borderRadius: "8px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: status.today.consecutiveLosses >= 3 ? "var(--color-loss)" : status.today.consecutiveLosses >= 2 ? "var(--color-warning)" : "var(--color-gray-300)" }}>
                  {status.today.consecutiveLosses}
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--color-gray-400)" }}>Consecutive losses</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                    {status.prefs.maxConsecutiveLosses != null ? `limit ${status.prefs.maxConsecutiveLosses}` : "no limit set"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Risk limits settings ── */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Settings2 size={16} style={{ color: "var(--color-brand-500)" }} />
            <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Daily Risk Limits</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem" }}>
            <div className="form-group">
              <label className="label">Daily loss limit ({currency})</label>
              <input className="input" type="number" value={dailyLossLimit} onChange={e => setDailyLossLimit(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div className="form-group">
              <label className="label">Max trades / day</label>
              <input className="input" type="number" value={maxTradesPerDay} onChange={e => setMaxTradesPerDay(e.target.value)} placeholder="e.g. 5" />
            </div>
            <div className="form-group">
              <label className="label">Max consecutive losses</label>
              <input className="input" type="number" value={maxConsecutiveLosses} onChange={e => setMaxConsecutiveLosses(e.target.value)} placeholder="e.g. 3" />
            </div>
            <div className="form-group">
              <label className="label">Max risk / trade (%)</label>
              <input className="input" type="number" step="0.1" min="0.1" max="5" value={maxRiskPerTradePct} onChange={e => setMaxRiskPerTradePct(e.target.value)} placeholder="e.g. 1" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={savePrefs} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Save size={15} /> {saving ? "Saving…" : "Save limits"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Position size calculator ── */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <Calculator size={16} style={{ color: "var(--color-brand-500)" }} />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Position Size Calculator</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="label">Account</label>
            <select className="input select" value={calcAccount} onChange={e => handleAccountChange(e.target.value)}>
              <option value="" disabled>Select account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Balance ({currency})</label>
            <input className="input" type="number" value={calcBalance} onChange={e => setCalcBalance(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Risk per trade (%)</label>
            <input className="input" type="number" step="0.1" min="0.1" max="5" value={riskPct} onChange={e => setRiskPct(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Entry price</label>
            <input className="input" type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} placeholder="e.g. 100" />
          </div>
          <div className="form-group">
            <label className="label">Stop loss price</label>
            <input className="input" type="number" value={stopPrice} onChange={e => setStopPrice(e.target.value)} placeholder="e.g. 99" />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
          <ResultStat label="Risk amount" value={fmt(calc.riskAmount)} color={calc.maxRiskAmount > 0 && calc.riskAmount > calc.maxRiskAmount ? "var(--color-loss)" : "var(--color-gray-100)"} />
          <ResultStat label="Position size" value={calc.size != null ? calc.size.toFixed(4) : "—"} sub={calc.stopDist > 0 ? `stop distance ${calc.stopDist.toFixed(2)}` : "enter entry & stop"} />
          {status?.prefs.maxRiskPerTradePct != null && (
            <>
              <ResultStat label="Max risk allowed" value={fmt(calc.maxRiskAmount)} color="var(--color-info)" />
              <ResultStat label="Risk usage" value={`${calc.maxRiskPct.toFixed(0)}%`} color={calc.maxRiskPct > 100 ? "var(--color-loss)" : calc.maxRiskPct >= 80 ? "var(--color-warning)" : "var(--color-profit)"} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "0.75rem", borderRadius: "8px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.3rem" }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: color || "var(--color-gray-100)" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-600)" }}>{sub}</div>}
    </div>
  )
}

function ResultStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "0.9rem", borderRadius: "10px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, color: "var(--color-gray-500)", marginBottom: "0.35rem" }}>{label}</div>
      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: color || "var(--color-gray-100)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "var(--color-gray-600)", marginTop: "0.15rem" }}>{sub}</div>}
    </div>
  )
}
