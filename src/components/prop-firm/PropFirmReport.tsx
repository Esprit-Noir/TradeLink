"use client"

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

  if (loading) return null
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
    <div style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-gray-100)" }}>Global Report</div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>All your prop challenges</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{
            fontSize: "0.7rem", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "4px",
            background: "rgba(139,92,246,0.12)", color: "var(--color-brand-500)", border: "1px solid rgba(139,92,246,0.2)"
          }}>
            {report.passRate}% pass rate
          </span>
          <button
            onClick={exportCsv}
            style={{ 
              background: "transparent", border: "1px solid var(--color-gray-700)", color: "var(--color-gray-300)",
              padding: "0.35rem 0.75rem", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "var(--color-gray-800)"; e.currentTarget.style.color = "var(--color-gray-100)" }}
            onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-gray-300)" }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem" }}>
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

      {report.totalCost > 0 && (
        <div style={{
          marginTop: "1.25rem", padding: "0.75rem 1rem", borderRadius: "6px",
          background: (report.roi ?? 0) >= 0 ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.05)",
          border: `1px solid ${(report.roi ?? 0) >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
          fontSize: "0.82rem",
          color: (report.roi ?? 0) >= 0 ? "var(--color-profit)" : "var(--color-loss)",
          lineHeight: "1.5"
        }}>
          {`You spent $${report.totalCost.toLocaleString("en-US", { minimumFractionDigits: 0 })} on challenges and received $${report.payoutsPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })} in payouts — `}
          <strong>{report.roi! >= 0 ? `net +${report.roi}% ROI.` : `net ${report.roi}% ROI (still in the red).`}</strong>
          {` Set the challenge cost when creating or editing a challenge to refine this.`}
        </div>
      )}

      {report.byFirm.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-gray-300)", marginBottom: "0.75rem" }}>Per-firm breakdown</div>
          <div style={{ overflowX: "auto", borderRadius: "8px", border: "1px solid var(--color-gray-800)", background: "var(--color-gray-900)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
              <thead>
                <tr style={{ background: "var(--color-gray-950)", color: "var(--color-gray-400)", textAlign: "left", borderBottom: "1px solid var(--color-gray-800)" }}>
                  <th style={{ padding: "0.6rem 0.85rem", fontWeight: 600 }}>Firm</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>Challenges</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>Passed</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>Breached</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>Active</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>Payouts paid</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>Cost</th>
                  <th style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600 }}>ROI</th>
                </tr>
              </thead>
              <tbody>
                {report.byFirm.map((f, i) => (
                  <tr key={f.firmName} style={{ borderBottom: i === report.byFirm.length - 1 ? "none" : "1px solid var(--color-gray-800)", color: "var(--color-gray-300)" }}>
                    <td style={{ padding: "0.6rem 0.85rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {f.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.logoUrl} alt="" style={{ width: 16, height: 16, objectFit: "contain", borderRadius: 2 }} />
                        ) : (
                          <div style={{ width: 16, height: 16, borderRadius: 2, background: "var(--color-gray-800)" }} />
                        )}
                        <span style={{ fontWeight: 600, color: "var(--color-gray-100)" }}>{f.firmName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 500 }}>{f.total}</td>
                    <td style={{ padding: "0.6rem 0.85rem", textAlign: "right", color: "var(--color-profit)", fontWeight: 500 }}>{f.passed}</td>
                    <td style={{ padding: "0.6rem 0.85rem", textAlign: "right", color: "var(--color-loss)", fontWeight: 500 }}>{f.breached}</td>
                    <td style={{ padding: "0.6rem 0.85rem", textAlign: "right", color: "var(--color-brand-500)", fontWeight: 500 }}>{f.active}</td>
                    <td style={{ padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 500 }}>
                      ${f.payoutsPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      {f.payoutsPending > 0 && <span style={{ color: "var(--color-warning)", fontSize: "0.68rem", marginLeft: "4px" }}>+{f.payoutsPending.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>}
                    </td>
                    <td style={{ padding: "0.6rem 0.85rem", textAlign: "right", color: "var(--color-gray-400)" }}>{f.cost > 0 ? `$${f.cost.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}</td>
                    <td style={{
                      padding: "0.6rem 0.85rem", textAlign: "right", fontWeight: 600,
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
    <div style={{ background: "var(--color-gray-900)", padding: "0.85rem", borderRadius: "6px", border: "1px solid var(--color-gray-800)" }}>
      <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: "0.25rem" }}>{label}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: color || "var(--color-gray-100)" }}>{value}</div>
    </div>
  )
}
