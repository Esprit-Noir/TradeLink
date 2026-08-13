"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line, ReferenceLine, ComposedChart,
} from "recharts"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import { Download, FileText } from "lucide-react"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

function fmtMoney(v: number, sign = false): string {
  const s = v.toLocaleString("en-US", { minimumFractionDigits: 2 })
  return `${sign && v > 0 ? "+" : ""}$${s}`
}

const P_STATUS: Record<string, { label: string; color: string }> = {
  requested: { label: "Requested", color: "var(--color-warning)" },
  approved: { label: "Approved", color: "var(--color-brand-500)" },
  paid: { label: "Paid", color: "var(--color-profit)" },
  rejected: { label: "Rejected", color: "var(--color-loss)" },
}

export function MonthlyReport() {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (m: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/monthly?month=${m}`)
      if (!res.ok) throw new Error("Failed to load")
      setData(await res.json())
    } catch {
      toast.error("Failed to load report")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(month)
  }, [month, load])

  const exportCsv = () => {
    if (!data) return
    const rows = [
      ["date", "pnl", "pnl_usd", "trades"],
      ...data.daily.filter((d: any) => d.trades > 0).map((d: any) => [d.date, d.pnl, d.pnlUsd, d.trades]),
    ]
    const csv = rows.map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${month}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    if (!data) return
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
    const W = doc.internal.pageSize.getWidth()

    doc.setFillColor(15, 17, 23)
    doc.rect(0, 0, W, 70, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text(`TradeLink — Monthly Report`, 40, 32)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(200, 200, 210)
    doc.text(monthLabel(month), 40, 50)

    doc.setTextColor(30, 30, 40)
    let y = 90
    const t = data.trades

    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text("Performance Summary", 40, y)
    y += 8
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value", "Metric", "Value"]],
      body: [
        ["Net P&L", fmtMoney(t.totalPnl, true), "P&L (USD)", fmtMoney(t.totalPnlUsd, true)],
        ["Trades", String(t.total), "Win rate", `${t.winRate.toFixed(1)}%`],
        ["Wins / Losses", `${t.wins} / ${t.losses}`, "Profit factor", t.profitFactor === 99 ? "∞" : t.profitFactor.toFixed(2)],
        ["Expectancy", fmtMoney(t.expectancy, true), "Avg R", t.avgR.toFixed(2)],
        ["Avg win", fmtMoney(t.avgWin, true), "Avg loss", fmtMoney(t.avgLoss, true)],
        ["Best trade", fmtMoney(t.best, true), "Worst trade", fmtMoney(t.worst, true)],
        ["Trading days", String(t.tradingDays), "Avg trades / day", t.avgTradesPerDay.toFixed(1)],
      ],
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: [80, 70, 229], textColor: 255 },
      columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 210 }, 2: { cellWidth: 130 }, 3: { cellWidth: 210 } },
    })

    y = (doc as any).lastAutoTable.finalY + 22

    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.text("Daily P&L", 40, y)
    y += 8
    const dayRows = data.daily
      .filter((d: any) => d.trades > 0)
      .map((d: any) => [
        d.date,
        `${d.pnl >= 0 ? "+" : ""}$${d.pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `${d.cumPnl >= 0 ? "+" : ""}$${d.cumPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        String(d.trades),
      ])
    autoTable(doc, {
      startY: y,
      head: [["Date", "P&L", "Cumulative", "Trades"]],
      body: dayRows,
      theme: "striped",
      styles: { fontSize: 8.5, cellPadding: 4 },
      headStyles: { fillColor: [80, 70, 229], textColor: 255 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 150, halign: "right" }, 2: { cellWidth: 150, halign: "right" }, 3: { cellWidth: 70, halign: "right" } },
    })

    y = (doc as any).lastAutoTable.finalY + 22

    if (data.setups.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Top Setups", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Setup", "Trades", "Wins", "P&L"]],
        body: data.setups.map((s: any) => [s.name, String(s.count), String(s.wins), fmtMoney(s.pnl, true)]),
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 220 }, 1: { cellWidth: 90, halign: "right" }, 2: { cellWidth: 90, halign: "right" }, 3: { cellWidth: 130, halign: "right" } },
      })
      y = (doc as any).lastAutoTable.finalY + 22
    }

    if (data.payouts.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Payouts", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Firm", "Account", "Amount", "Status", "Date"]],
        body: data.payouts.map((p: any) => [
          p.firmName,
          p.accountName,
          fmtMoney(p.amount),
          p.status,
          new Date(p.requestedAt).toLocaleDateString("en-US"),
        ]),
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 160 }, 1: { cellWidth: 160 }, 2: { cellWidth: 110, halign: "right" }, 3: { cellWidth: 90 }, 4: { cellWidth: 90 } },
      })
    }

    doc.save(`tradelink-report-${month}.pdf`)
    toast.success("PDF report downloaded")
  }

  const t = data?.trades
  const daily = data?.daily || []
  const dayShort = (daily as any[]).map(d => ({
    ...d,
    label: d.date.slice(5),
  }))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Monthly Report</h1>
          <p className="page-subtitle">Performance summary for a single month.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="month"
            className="input"
            value={month}
            onChange={e => e.target.value && setMonth(e.target.value)}
            style={{ width: 170 }}
          />
          <button className="btn btn-outline" onClick={exportCsv} disabled={!data}>
            <Download size={15} /> CSV
          </button>
          <button className="btn btn-outline" onClick={exportPdf} disabled={!data}>
            <FileText size={15} /> PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 300 }} />
      ) : !data ? (
        <div className="empty-state">Unable to load report.</div>
      ) : (
        <>
          {/* Month title */}
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
            {monthLabel(month)}
            <span style={{ fontSize: "0.85rem", fontWeight: 400, color: "var(--color-gray-500)", marginLeft: "0.75rem" }}>
              {t.total} trades · {t.tradingDays} trading days
            </span>
          </div>

          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="kpi-label">Net P&L</div>
              <div className="kpi-value" style={{ color: t.totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                {fmtMoney(t.totalPnl, true)}
              </div>
              <div className="kpi-sub">in USD: {fmtMoney(t.totalPnlUsd, true)}</div>
            </div>
            <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="kpi-label">Win rate</div>
              <div className="kpi-value">{t.winRate.toFixed(1)}%</div>
              <div className="kpi-sub">{t.wins}W / {t.losses}L / {t.breakeven} BE</div>
            </div>
            <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="kpi-label">Profit factor</div>
              <div className="kpi-value" style={{ color: t.profitFactor >= 2 ? "var(--color-profit)" : t.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)" }}>
                {t.profitFactor === 99 ? "∞" : t.profitFactor.toFixed(2)}
              </div>
              <div className="kpi-sub">avg R: {t.avgR.toFixed(2)}</div>
            </div>
            <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="kpi-label">Expectancy / trade</div>
              <div className="kpi-value" style={{ color: t.expectancy >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                {fmtMoney(t.expectancy, true)}
              </div>
              <div className="kpi-sub">avg win {fmtMoney(t.avgWin, true)} · avg loss {fmtMoney(t.avgLoss, true)}</div>
            </div>
            <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div className="kpi-label">Best / Worst</div>
              <div className="kpi-value" style={{ fontSize: "1.1rem", color: t.best >= 0 ? "var(--color-profit)" : "var(--color-gray-100)" }}>
                {fmtMoney(t.best, true)}
              </div>
              <div className="kpi-sub" style={{ color: t.worst <= 0 ? "var(--color-loss)" : "var(--color-gray-500)" }}>
                {fmtMoney(t.worst, true)}
              </div>
            </div>
          </div>

          {/* Daily chart */}
          <div className="chart-card">
            <div className="chart-title">Daily P&L and cumulative</div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={dayShort} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--color-gray-500)" }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis yAxisId="pnl" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} width={60} />
                <YAxis yAxisId="cum" orientation="right" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} width={60} />
                <Tooltip
                  contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                  labelStyle={{ color: "var(--color-gray-300)" }}
                  formatter={(value: any, name: any) => [
                    fmtMoney(Number(value), true),
                    name === "cumPnl" ? "Cumulative" : "Daily P&L",
                  ]}
                />
                <ReferenceLine yAxisId="pnl" y={0} stroke="var(--color-gray-600)" />
                <Bar yAxisId="pnl" dataKey="pnl" radius={[3, 3, 0, 0]}>
                  {dayShort.map((d, i) => (
                    <Cell key={i} fill={d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
                <Line yAxisId="cum" type="monotone" dataKey="cumPnl" stroke="var(--color-brand-500)" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Setups + Symbols */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <div className="chart-card">
              <div className="chart-title">Top Setups</div>
              {data.setups.length === 0 ? (
                <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No setups this month.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {data.setups.slice(0, 8).map((s: any) => (
                    <div key={s.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-gray-300)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.name}
                        <span style={{ color: "var(--color-gray-500)", marginLeft: "0.35rem", fontSize: "0.75rem" }}>
                          {s.count} · {s.wins}W
                        </span>
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: s.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", whiteSpace: "nowrap" }}>
                        {fmtMoney(s.pnl, true)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="chart-card">
              <div className="chart-title">Top Symbols</div>
              {data.symbols.length === 0 ? (
                <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No symbols this month.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {data.symbols.slice(0, 8).map((s: any) => (
                    <div key={s.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-gray-300)", whiteSpace: "nowrap" }}>
                        {s.symbol}
                        <span style={{ color: "var(--color-gray-500)", marginLeft: "0.35rem", fontSize: "0.75rem" }}>{s.count} trades</span>
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: s.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", whiteSpace: "nowrap" }}>
                        {fmtMoney(s.pnl, true)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Challenges + Payouts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <div className="chart-card">
              <div className="chart-title">Challenges</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <div className="kpi-label">Started</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{data.challenges.startedCount}</div>
                  {data.challenges.startedCost > 0 && (
                    <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>cost {fmtMoney(data.challenges.startedCost)}</div>
                  )}
                </div>
                <div>
                  <div className="kpi-label">Passed</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-profit)" }}>{data.challenges.passed}</div>
                </div>
                <div>
                  <div className="kpi-label">Breached</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-loss)" }}>{data.challenges.breached}</div>
                </div>
                <div>
                  <div className="kpi-label">Still active</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-brand-500)" }}>{data.challenges.active}</div>
                </div>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">Payouts</div>
              {data.payouts.length === 0 ? (
                <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No payouts this month.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div style={{ display: "flex", gap: "1.25rem", marginBottom: "0.25rem" }}>
                    <div>
                      <div className="kpi-label">Total</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{fmtMoney(data.payoutsTotals.amount)}</div>
                    </div>
                    <div>
                      <div className="kpi-label">Paid</div>
                      <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-profit)" }}>{fmtMoney(data.payoutsTotals.paidAmount)}</div>
                    </div>
                  </div>
                  {data.payouts.slice(0, 6).map((p: any, i: number) => {
                    const st = P_STATUS[p.status] || { label: p.status, color: "var(--color-gray-400)" }
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-gray-300)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.logoUrl && (
                            <span style={{ width: 16, height: 16, borderRadius: 3, overflow: "hidden", background: "var(--color-gray-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.logoUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                            </span>
                          )}
                          {p.firmName} — {p.accountName}
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          <span style={{ fontWeight: 600, color: "var(--color-gray-100)" }}>{fmtMoney(p.amount)}</span>
                          <span className="badge" style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}40` }}>
                            {st.label}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
