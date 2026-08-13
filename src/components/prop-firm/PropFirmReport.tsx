"use client"

import { useEffect, useState } from "react"

type Report = {
  total: number
  active: number
  passed: number
  breached: number
  passRate: number
  totalProfit: number
  payoutsPaid: number
  payoutsPending: number
  byFirm: { firmName: string; logoUrl: string | null; total: number; passed: number; breached: number; active: number; payoutsPaid: number }[]
}

export function PropFirmReport() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/prop-firms/report")
      .then(r => r.json())
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null
  if (!report || report.total === 0) return null

  return (
    <div className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Global Report</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>All your prop challenges</div>
        </div>
        <span style={{
          fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "6px",
          background: "rgba(139,92,246,0.12)", color: "var(--color-brand-500)",
        }}>
          {report.passRate}% pass rate
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
        <Metric label="Challenges" value={String(report.total)} />
        <Metric label="Active" value={String(report.active)} color="var(--color-brand-500)" />
        <Metric label="Passed" value={String(report.passed)} color="var(--color-profit)" />
        <Metric label="Breached" value={String(report.breached)} color="var(--color-loss)" />
        <Metric label="Open P&L" value={`${report.totalProfit >= 0 ? "+" : ""}$${report.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} color={report.totalProfit >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
        <Metric label="Payouts paid" value={`$${report.payoutsPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} color="var(--color-profit)" />
        {report.payoutsPending > 0 && <Metric label="Payouts pending" value={`$${report.payoutsPending.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} color="var(--color-warning)" />}
      </div>

      {report.byFirm.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginTop: "1rem" }}>
          {report.byFirm.map(f => (
            <div key={f.firmName} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.7rem", borderRadius: "8px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", fontSize: "0.75rem" }}>
              {f.logoUrl && <img src={f.logoUrl} alt="" style={{ width: "14px", height: "14px", objectFit: "contain", borderRadius: "3px" }} />}
              <span style={{ color: "var(--color-gray-300)" }}>{f.firmName}</span>
              <span style={{ color: "var(--color-gray-500)" }}>·</span>
              <span style={{ color: "var(--color-profit)" }}>{f.passed}✓</span>
              <span style={{ color: "var(--color-loss)" }}>{f.breached}✗</span>
              {f.payoutsPaid > 0 && <span style={{ color: "var(--color-profit)" }}>· ${f.payoutsPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "var(--color-gray-900)", padding: "0.7rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 700, color: color || "var(--color-gray-100)" }}>{value}</div>
    </div>
  )
}
