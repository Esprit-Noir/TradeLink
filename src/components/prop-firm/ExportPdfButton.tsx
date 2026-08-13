"use client"

import { useState } from "react"
import { jsPDF } from "jspdf"
import { autoTable } from "jspdf-autotable"
import { toast } from "sonner"

export function ExportPdfButton({ challengeId, accountName }: { challengeId: string; accountName: string }) {
  const [busy, setBusy] = useState(false)

  const exportPdf = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/export?format=json`)
      if (!res.ok) throw new Error("Failed to load data")
      const c = await res.json()

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
      const W = doc.internal.pageSize.getWidth()

      // Header
      doc.setFillColor(15, 17, 23)
      doc.rect(0, 0, W, 70, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text(`${c.template?.firmName || "Prop Firm"} — Challenge Report`, 40, 32)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.setTextColor(200, 200, 210)
      doc.text(`${c.account?.name || ""} · ${c.phase.replace("_", " ")} · ${c.status}`, 40, 50)

      doc.setTextColor(30, 30, 40)
      let y = 90

      // Summary
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Summary", 40, y)
      y += 8
      const summaryRows = [
        ["Firm", c.template?.firmName || "—", "Status", c.status],
        ["Account", c.account?.name || "—", "Phase", c.phase.replace("_", " ")],
        ["Initial balance", `$${Number(c.initialBalance).toLocaleString("en-US")}`, "Current balance", `$${Number(c.currentBalance ?? c.initialBalance).toLocaleString("en-US")}`],
        ["Profit target", `${Number(c.profitTargetPct)}%`, "Max drawdown", `${Number(c.maxDDPct)}%`],
        ["Daily drawdown", `${Number(c.dailyDDPct)}%`, "Trading days", `${Number(c.metadata?.tradingDaysCount || 0)} / ${c.minTradingDays || 0}`],
        ["Started", new Date(c.startedAt).toLocaleDateString("en-US"), "Deadline", c.deadlineAt ? new Date(c.deadlineAt).toLocaleDateString("en-US") : "No limit"],
      ]
      autoTable(doc, {
        startY: y,
        head: [["Key", "Value", "Key", "Value"]],
        body: summaryRows,
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 5 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 220 }, 2: { cellWidth: 120 }, 3: { cellWidth: 220 } },
      })

      y = (doc as any).lastAutoTable.finalY + 22

      // Daily breakdown
      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.text("Daily Breakdown", 40, y)
      y += 8
      const snapRows = (c.dailySnapshots || []).map((s: any) => [
        s.date.slice(0, 10),
        `$${Number(s.startBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `$${Number(s.endBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        `${Number(s.dailyPnl) >= 0 ? "+" : ""}$${Number(s.dailyPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        String(s.tradesCount),
        s.dailyDDUsedPct != null ? `${Math.round(Number(s.dailyDDUsedPct))}%` : "—",
      ])
      autoTable(doc, {
        startY: y,
        head: [["Date", "Start", "End", "P&L", "Trades", "DD used"]],
        body: snapRows,
        theme: "striped",
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [80, 70, 229], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 120, halign: "right" },
          2: { cellWidth: 120, halign: "right" },
          3: { cellWidth: 130, halign: "right" },
          4: { cellWidth: 70, halign: "right" },
          5: { cellWidth: 80, halign: "right" },
        },
      })

      y = (doc as any).lastAutoTable.finalY + 22

      // Events
      if ((c.events || []).length > 0) {
        doc.setFontSize(13)
        doc.setFont("helvetica", "bold")
        doc.text("Events", 40, y)
        y += 8
        const eventRows = c.events.map((e: any) => [
          new Date(e.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }),
          e.eventType.replace(/_/g, " "),
          e.severity,
          e.message || "",
        ])
        autoTable(doc, {
          startY: y,
          head: [["Date", "Type", "Severity", "Message"]],
          body: eventRows,
          theme: "striped",
          styles: { fontSize: 8, cellPadding: 4 },
          headStyles: { fillColor: [80, 70, 229], textColor: 255 },
          columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 130 }, 2: { cellWidth: 80 }, 3: { cellWidth: 400 } },
        })
      }

      doc.save(`${accountName.replace(/[^a-z0-9]+/gi, "-")}-report.pdf`)
      toast.success("PDF report downloaded")
    } catch {
      toast.error("Failed to generate PDF")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button onClick={exportPdf} disabled={busy} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
      {busy ? "Generating…" : "Export PDF"}
    </button>
  )
}
