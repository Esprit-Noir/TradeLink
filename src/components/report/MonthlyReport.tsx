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

interface DailyItem {
  date: string
  pnl: number
  pnlUsd: number
  cumPnl: number
  trades: number
}

interface SetupItem {
  name: string
  count: number
  wins: number
  pnl: number
}

interface SymbolItem {
  symbol: string
  count: number
  pnl: number
}

interface HourItem {
  hour: number
  count: number
  wins: number
  pnl: number
}

interface DowItem {
  dow: string
  name: string
  count: number
  wins: number
  pnl: number
}

interface PayoutItem {
  firmName: string
  accountName: string
  amount: number
  status: string
  requestedAt: string
  logoUrl: string
}

interface ChallengeSummary {
  startedCount: number
  startedCost: number
  passed: number
  breached: number
  active: number
}

interface PayoutsTotals {
  amount: number
  paidAmount: number
}

interface TradeSummary {
  totalPnl: number
  totalPnlUsd: number
  total: number
  winRate: number
  wins: number
  losses: number
  breakeven: number
  profitFactor: number
  expectancy: number
  avgR: number
  avgWin: number
  avgLoss: number
  best: number
  worst: number
  tradingDays: number
  avgTradesPerDay: number
}

interface MonthlyReportData {
  trades: TradeSummary
  daily: DailyItem[]
  setups: SetupItem[]
  symbols: SymbolItem[]
  hours: HourItem[]
  dow: DowItem[]
  payouts: PayoutItem[]
  challenges: ChallengeSummary
  payoutsTotals: PayoutsTotals
}

interface JspdfWithAutoTable {
  lastAutoTable: { finalY: number }
}

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

const PDF_SECTIONS = [
  { key: "summary", label: "Summary" },
  { key: "daily", label: "Daily P&L" },
  { key: "setups", label: "Top setups" },
  { key: "symbols", label: "Top Symbols" },
  { key: "hours", label: "Hourly Performance" },
  { key: "dow", label: "Day of Week" },
  { key: "payouts", label: "Payouts" },
] as const

type PdfSection = (typeof PDF_SECTIONS)[number]["key"]

export function MonthlyReport() {
  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState<MonthlyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfSections, setPdfSections] = useState<PdfSection[]>(PDF_SECTIONS.map(s => s.key))
  const [showPdfOptions, setShowPdfOptions] = useState(false)

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
      ...data.daily.filter((d: DailyItem) => d.trades > 0).map((d: DailyItem) => [d.date, d.pnl, d.pnlUsd, d.trades]),
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
    const incl = (k: PdfSection) => pdfSections.includes(k)

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

    if (incl("summary")) {
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

      y = (doc as unknown as JspdfWithAutoTable).lastAutoTable.finalY + 22
    }

    if (incl("daily")) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Daily P&L", 40, y)
      y += 8
      const dayRows = data.daily
        .filter((d: DailyItem) => d.trades > 0)
        .map((d: DailyItem) => [
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

      y = (doc as unknown as JspdfWithAutoTable).lastAutoTable.finalY + 22
    }

    if (incl("setups") && data.setups.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Top Setups", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Setup", "Trades", "Wins", "Win rate", "P&L"]],
        body: data.setups.map((s: SetupItem) => [s.name, String(s.count), String(s.wins), s.count > 0 ? `${((s.wins / s.count) * 100).toFixed(0)}%` : "—", fmtMoney(s.pnl, true)]),
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 70, halign: "right" }, 2: { cellWidth: 70, halign: "right" }, 3: { cellWidth: 70, halign: "right" }, 4: { cellWidth: 110, halign: "right" } },
      })
      y = (doc as unknown as JspdfWithAutoTable).lastAutoTable.finalY + 22
    }

    if (incl("symbols") && data.symbols.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Top Symbols", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Symbol", "Trades", "P&L"]],
        body: data.symbols.map((s: SymbolItem) => [s.symbol, String(s.count), fmtMoney(s.pnl, true)]),
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 90, halign: "right" }, 2: { cellWidth: 130, halign: "right" } },
      })
      y = (doc as unknown as JspdfWithAutoTable).lastAutoTable.finalY + 22
    }

    if (incl("hours") && data.hours.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Performance by Hour", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Hour", "Trades", "Wins", "P&L"]],
        body: data.hours.map((h: HourItem) => [`${h.hour}:00`, String(h.count), String(h.wins), fmtMoney(h.pnl, true)]),
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90, halign: "right" }, 2: { cellWidth: 90, halign: "right" }, 3: { cellWidth: 130, halign: "right" } },
      })
      y = (doc as unknown as JspdfWithAutoTable).lastAutoTable.finalY + 22
    }

    if (incl("dow") && data.dow.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Performance by Day", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Day", "Trades", "Wins", "P&L"]],
        body: data.dow.map((d: DowItem) => [d.name, String(d.count), String(d.wins), fmtMoney(d.pnl, true)]),
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 90, halign: "right" }, 2: { cellWidth: 90, halign: "right" }, 3: { cellWidth: 130, halign: "right" } },
      })
      y = (doc as unknown as JspdfWithAutoTable).lastAutoTable.finalY + 22
    }

    if (incl("payouts") && data.payouts.length > 0) {
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Payouts", 40, y)
      y += 8
      autoTable(doc, {
        startY: y,
        head: [["Firm", "Account", "Amount", "Status", "Date"]],
        body: data.payouts.map((p: PayoutItem) => [
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

  const togglePdfSection = (k: PdfSection) => {
    setPdfSections(prev => (prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]))
  }

  const t = data!.trades
  const daily = data?.daily || []
  const dayShort = (daily as DailyItem[]).map(d => ({
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
          <div style={{ position: "relative" }}>
            <button className="btn btn-outline" onClick={() => setShowPdfOptions(v => !v)} disabled={!data}>
              <FileText size={15} /> PDF
            </button>
            {showPdfOptions && (
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 40,
                  background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)",
                  borderRadius: "10px", padding: "0.75rem", minWidth: 180, boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                }}
              >
                <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--color-gray-500)", marginBottom: "0.5rem" }}>
                  Include in PDF
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {PDF_SECTIONS.map(s => (
                    <label key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pdfSections.includes(s.key)}
                        onChange={() => togglePdfSection(s.key)}
                        style={{ accentColor: "var(--color-brand-500)" }}
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: "0.6rem", width: "100%" }}
                  onClick={() => { setShowPdfOptions(false); exportPdf() }}
                  disabled={pdfSections.length === 0}
                >
                  <FileText size={14} /> Download
                </button>
              </div>
            )}
          </div>
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
                  formatter={(value, name) => [
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
                  {data.setups.slice(0, 8).map((s: SetupItem) => (
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
                  {data.symbols.slice(0, 8).map((s: SymbolItem) => (
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

          {/* Hours + Days of week */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            <div className="chart-card">
              <div className="chart-title">Performance by hour</div>
              {data.hours.length === 0 ? (
                <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No trades this month.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.hours} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "var(--color-gray-500)" }} tickFormatter={(v: number) => `${v}:00`} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} width={52} />
                    <Tooltip
                      contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                      labelStyle={{ color: "var(--color-gray-300)" }}
                      labelFormatter={(v) => `${v}:00`}
                      formatter={(value, name) => [fmtMoney(Number(value), true), name === "wins" ? "Wins" : "P&L"]}
                    />
                    <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                      {data.hours.map((h: HourItem, i: number) => (
                        <Cell key={i} fill={h.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="chart-card">
              <div className="chart-title">Performance by day of week</div>
              {data.dow.length === 0 ? (
                <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No trades this month.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {data.dow.map((d: DowItem) => (
                    <div key={d.dow} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ width: 90, fontSize: "0.85rem", color: "var(--color-gray-300)", flexShrink: 0 }}>{d.name}</span>
                      <div style={{ flex: 1, height: 16, background: "var(--color-gray-800)", borderRadius: 4, overflow: "hidden", position: "relative" }}>
                        <div
                          style={{
                            height: "100%", borderRadius: 4,
                            width: `${Math.max(2, Math.min(100, (Math.abs(d.pnl) / Math.max(...data.dow.map((x: DowItem) => Math.abs(x.pnl)))) * 100))}%`,
                            background: d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      <span style={{ width: 90, fontSize: "0.82rem", fontWeight: 600, textAlign: "right", color: d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", flexShrink: 0 }}>
                        {fmtMoney(d.pnl, true)}
                      </span>
                      <span style={{ width: 46, fontSize: "0.75rem", color: "var(--color-gray-500)", textAlign: "right", flexShrink: 0 }}>{d.count} tr</span>
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
                  {data.payouts.slice(0, 6).map((p: PayoutItem, i: number) => {
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
