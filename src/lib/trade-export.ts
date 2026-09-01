import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export interface TradeExportItem {
  symbol: string
  side: string
  quantity: number
  entryPrice: number
  exitPrice: number | null
  stopLoss: number | null
  entryAt: Date | string
  exitAt: Date | string | null
  netPnl: number | null
  fees: number
  setupTags: string[]
}

function fmtDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

function fmtPrice(p: number): string {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(2)
  if (p >= 0.01) return p.toFixed(4)
  return p.toFixed(8)
}

export function exportTradesPdf(trades: TradeExportItem[], title?: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const W = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(15, 17, 23)
  doc.rect(0, 0, W, 70, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("TradeLink — Trade Report", 40, 32)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(200, 200, 210)
  const subtitle = title || `${trades.length} trades · ${fmtDate(trades[0]?.entryAt || new Date())} → ${fmtDate(trades[trades.length - 1]?.exitAt || trades[trades.length - 1]?.entryAt || new Date())}`
  doc.text(subtitle, 40, 50)

  // Summary
  const wins = trades.filter(t => (t.netPnl ?? 0) > 0)
  const losses = trades.filter(t => (t.netPnl ?? 0) < 0)
  const totalPnl = trades.reduce((s, t) => s + (t.netPnl ?? 0), 0)
  const grossProfit = wins.reduce((s, t) => s + (t.netPnl ?? 0), 0)
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.netPnl ?? 0), 0)
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0

  doc.setTextColor(30, 30, 40)
  autoTable(doc, {
    startY: 90,
    head: [["Summary", "Value"]],
    body: [
      ["Total Trades", String(trades.length)],
      ["Win Rate", `${winRate.toFixed(1)}%`],
      ["Wins / Losses", `${wins.length} / ${losses.length}`],
      ["Net P&L", `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}`],
      ["Profit Factor", profitFactor === 99 ? "∞" : profitFactor.toFixed(2)],
      ["Total Fees", trades.reduce((s, t) => s + t.fees, 0).toFixed(2)],
    ],
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [15, 17, 23] },
  })

  const yStart =
    ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 0) + 24

  // Trade list
  autoTable(doc, {
    startY: yStart,
    head: [["#", "Symbol", "Side", "Qty", "Entry", "Exit", "P&L", "Fees", "Tags", "Date"]],
    body: trades.map((t, i) => [
      String(i + 1),
      t.symbol,
      t.side.toUpperCase(),
      t.quantity.toFixed(4),
      fmtPrice(t.entryPrice),
      t.exitPrice != null ? fmtPrice(t.exitPrice) : "—",
      t.netPnl != null ? `${t.netPnl >= 0 ? "+" : ""}${t.netPnl.toFixed(2)}` : "—",
      t.fees.toFixed(2),
      t.setupTags.slice(0, 2).join(", ") || "—",
      fmtDate(t.entryAt),
    ]),
    theme: "striped",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [15, 17, 23] },
    columnStyles: {
      6: { halign: "right" },
      7: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.column.index === 6 && data.section === "body" && data.cell.raw) {
        const val = String(data.cell.raw)
        if (val.startsWith("+")) data.cell.styles.textColor = [0, 180, 70]
        else if (val.startsWith("-")) data.cell.styles.textColor = [220, 50, 50]
      }
    },
  })

  doc.save(`tradelink-report-${new Date().toISOString().split("T")[0]}.pdf`)
}
