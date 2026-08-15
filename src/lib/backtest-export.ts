import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import Papa from "papaparse"

export interface BacktestExportTrade {
  side: "long" | "short"
  symbol: string
  entryPrice: number
  exitPrice: number
  stopLoss: number | null
  takeProfit: number | null
  quantity: number
  entryAt: number
  exitAt: number
  netPnl: number
  rMultiple: number | null
}

export interface BacktestExportMeta {
  symbol: string
  timeframe: string
  from: number
  to: number
  strategyName?: string | null
  initialBalance: number
}

function fmtDate(sec: number): string {
  const d = new Date(sec * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  if (p >= 0.01) return p.toFixed(4)
  return p.toFixed(8)
}

export function exportSessionCsv(meta: BacktestExportMeta, trades: BacktestExportTrade[]) {
  const rows = trades.map((t) => ({
    symbol: t.symbol,
    side: t.side.toUpperCase(),
    entry_price: fmtPrice(t.entryPrice),
    exit_price: fmtPrice(t.exitPrice),
    stop_loss: t.stopLoss != null ? fmtPrice(t.stopLoss) : "",
    take_profit: t.takeProfit != null ? fmtPrice(t.takeProfit) : "",
    quantity: t.quantity.toFixed(4),
    entry_at: fmtDate(t.entryAt),
    exit_at: fmtDate(t.exitAt),
    net_pnl: t.netPnl.toFixed(2),
    r_multiple: t.rMultiple != null ? t.rMultiple.toFixed(2) : "",
  }))

  const csv = Papa.unparse(rows, { header: true })
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `backtest-${meta.symbol}-${meta.timeframe}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportSessionPdf(meta: BacktestExportMeta, trades: BacktestExportTrade[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()

  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, W, 70, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text(`TradeLink — Backtest Replay`, 40, 32)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(200, 200, 210)
  doc.text(`${meta.symbol} · ${meta.timeframe} · ${fmtDate(meta.from)} → ${fmtDate(meta.to)}${meta.strategyName ? ` · ${meta.strategyName}` : ""}`, 40, 50)

  const totalPnl = trades.reduce((s, t) => s + t.netPnl, 0)
  const wins = trades.filter((t) => t.netPnl > 0).length
  const winRate = trades.length ? (wins / trades.length) * 100 : 0
  const avgR = trades.length ? trades.reduce((s, t) => s + (t.rMultiple ?? 0), 0) / trades.length : 0

  doc.setTextColor(30, 30, 40)
  autoTable(doc, {
    startY: 90,
    head: [["Summary", "Value"]],
    body: [
      ["Trades", String(trades.length)],
      ["Win rate", `${winRate.toFixed(1)}%`],
      ["Net P&L", `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`],
      ["Avg R", `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}`],
      ["Initial balance", meta.initialBalance.toFixed(2)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 17, 23] },
  })

  // autotable attaches lastAutoTable metadata
  const yStart =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0) + 24
  autoTable(doc, {
    startY: yStart,
    head: [["#", "Side", "Entry", "Exit", "SL", "Qty", "Entry", "Exit", "Net P&L", "R"]],
    body: trades.map((t, i) => [
      String(i + 1),
      t.side.toUpperCase(),
      fmtPrice(t.entryPrice),
      fmtPrice(t.exitPrice),
      t.stopLoss != null ? fmtPrice(t.stopLoss) : "—",
      t.quantity.toFixed(4),
      fmtDate(t.entryAt),
      fmtDate(t.exitAt),
      t.netPnl.toFixed(2),
      t.rMultiple != null ? t.rMultiple.toFixed(2) : "—",
    ]),
    theme: "striped",
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 17, 23] },
    columnStyles: {
      8: { halign: "right" },
      9: { halign: "right" },
    },
  })

  doc.save(`backtest-${meta.symbol}-${meta.timeframe}.pdf`)
}
