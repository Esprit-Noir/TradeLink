"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Firm = {
  firmName: string
  logoUrl: string | null
  total: number
  passed: number
  breached: number
  active: number
  payoutsPaid: number
  payoutsPending: number
  cost: number
  roi: number | null
}

type Report = {
  total: number
  active: number
  passed: number
  breached: number
  passRate: number
  totalProfit: number
  payoutsPaid: number
  payoutsPending: number
  totalCost: number
  roi: number | null
  byFirm: Firm[]
}

const csvEscape = (v: string | number) => {
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
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

  if (loading) return <div className="skeleton" style={{ height: 200 }} />
  if (!report || report.total === 0) return null

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ["Metric", "Value"],
      ["Total challenges", report.total],
      ["Active", report.active],
      ["Passed", report.passed],
      ["Breached", report.breached],
      ["Pass rate %", report.passRate],
      ["Open P&L $", report.totalProfit],
      ["Payouts paid $", report.payoutsPaid],
      ["Payouts pending $", report.payoutsPending],
      ["Costs paid $", report.totalCost],
      ["ROI %", report.roi ?? ""],
      [],
      ["Firm", "Challenges", "Passed", "Breached", "Active", "Payouts paid $", "Payouts pending $", "Cost $", "ROI %"],
      ...report.byFirm.map(f => [f.firmName, f.total, f.passed, f.breached, f.active, f.payoutsPaid, f.payoutsPending, f.cost, f.roi ?? ""]),
    ]
    const csv = rows.map(r => r.map(csvEscape).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "prop-firms-global-report.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Report exported")
  }

  return (
    <div className="chart-card" style={{ padding: "1.75rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.25rem", color: "var(--color-gray-100)", letterSpacing: "-0.02em" }}>Global Report</div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>All your prop challenges</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{
            fontSize: "0.8rem", fontWeight: 700, padding: "0.35rem 0.85rem", borderRadius: "8px",
            background: "rgba(139,92,246,0.12)", color: "var(--color-brand-500)", border: "1px solid rgba(139,92,246,0.2)",
            boxShadow: "0 0 10px rgba(139,92,246,0.15)"
          }}>
            {report.passRate}% pass rate
          </span>
          <button
            onClick={exportCsv}
            className="btn btn-secondary"
            style={{ fontSize: "0.8rem" }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
        <Metric label="Challenges" value={String(report.total)} />
        <Metric label="Active" value={String(report.active)} color="var(--color-brand-500)" />
        <Metric label="Passed" value={String(report.passed)} color="var(--color-profit)" />
        <Metric label="Breached" value={String(report.breached)} color="var(--color-loss)" />
        <Metric label="Open P&L" value={`${report.totalProfit >= 0 ? "+" : ""}$${report.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} color={report.totalProfit >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
        <Metric label="Payouts paid" value={`$${report.payoutsPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} color="var(--color-profit)" />
        {report.payoutsPending > 0 && <Metric label="Payouts pending" value={`$${report.payoutsPending.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} color="var(--color-warning)" />}
        {report.totalCost > 0 && <Metric label="Costs paid" value={`$${report.totalCost.toLocaleString("en-US", { minimumFractionDigits: 0 })}`} />}
        {report.roi !== null && (
          <Metric
            label="ROI"
            value={`${report.roi >= 0 ? "+" : ""}${report.roi}%`}
            color={report.roi >= 0 ? "var(--color-profit)" : "var(--color-loss)"}
          />
        )}
      </div>



      {report.byFirm.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gray-400)", marginBottom: "1rem" }}>Per-firm breakdown</div>
          <div className="table-wrapper">
            <table className="data-table comfortable">
              <thead>
                <tr>
                  <th>Firm</th>
                  <th style={{ textAlign: "right" }}>Challenges</th>
                  <th style={{ textAlign: "right" }}>Passed</th>
                  <th style={{ textAlign: "right" }}>Breached</th>
                  <th style={{ textAlign: "right" }}>Active</th>
                  <th style={{ textAlign: "right" }}>Payouts paid</th>
                  <th style={{ textAlign: "right" }}>Cost</th>
                  <th style={{ textAlign: "right" }}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {report.byFirm.map((f) => (
                  <tr key={f.firmName}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        {f.logoUrl ? (
                          <span style={{ position: "relative", width: 20, height: 20, borderRadius: 4, display: "inline-block", overflow: "hidden" }}>
                            <Image src={f.logoUrl} alt={f.firmName} unoptimized fill sizes="100vw" style={{ objectFit: "contain" }} />
                          </span>
                        ) : (
                          <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--color-gray-800)" }} />
                        )}
                        <span style={{ fontWeight: 700, color: "var(--color-gray-100)" }}>{f.firmName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{f.total}</td>
                    <td style={{ textAlign: "right", color: "var(--color-profit)", fontWeight: 600 }}>{f.passed}</td>
                    <td style={{ textAlign: "right", color: "var(--color-loss)", fontWeight: 600 }}>{f.breached}</td>
                    <td style={{ textAlign: "right", color: "var(--color-brand-500)", fontWeight: 600 }}>{f.active}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      ${f.payoutsPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      {f.payoutsPending > 0 && <span style={{ color: "var(--color-warning)", fontSize: "0.7rem", marginLeft: "6px" }}>+{f.payoutsPending.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>}
                    </td>
                    <td style={{ textAlign: "right", color: "var(--color-gray-400)", fontWeight: 500 }}>{f.cost > 0 ? `$${f.cost.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}</td>
                    <td style={{
                      textAlign: "right", fontWeight: 700,
                      color: f.roi === null ? "var(--color-gray-600)" : f.roi >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                    }}>
                      {f.roi === null ? "—" : `${f.roi >= 0 ? "+" : ""}${f.roi}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="card-hover" style={{ background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700, marginBottom: "0.4rem" }}>{label}</div>
      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: color || "var(--color-gray-100)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  )
}
