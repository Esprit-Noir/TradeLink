import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params

    const challenge = await prisma.propChallenge.findUnique({
      where: { id },
      include: {
        template: true,
        account: true,
        dailySnapshots: { orderBy: { date: "asc" } },
        events: { orderBy: { createdAt: "asc" } },
        payouts: { orderBy: { requestedAt: "asc" } },
        notes: { orderBy: { createdAt: "asc" } },
      },
    })

    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get("format") || "csv"

    if (format === "json") {
      return NextResponse.json(challenge)
    }

    // CSV: summary section + daily snapshots
    const lines: string[] = []
    lines.push("SECTION,KEY,VALUE")
    lines.push(`SUMMARY,firm,${escapeCsv(challenge.template.firmName)}`)
    lines.push(`SUMMARY,account,${escapeCsv(challenge.account.name)}`)
    lines.push(`SUMMARY,phase,${challenge.phase}`)
    lines.push(`SUMMARY,status,${challenge.status}`)
    lines.push(`SUMMARY,initialBalance,${Number(challenge.initialBalance).toFixed(2)}`)
    lines.push(`SUMMARY,currentBalance,${Number(challenge.currentBalance ?? challenge.initialBalance).toFixed(2)}`)
    lines.push(`SUMMARY,profitTargetPct,${challenge.profitTargetPct}`)
    lines.push(`SUMMARY,maxDDPct,${challenge.maxDDPct}`)
    lines.push(`SUMMARY,dailyDDPct,${challenge.dailyDDPct}`)
    lines.push(`SUMMARY,minTradingDays,${challenge.minTradingDays ?? ""}`)
    lines.push(`SUMMARY,maxTradingDays,${challenge.maxTradingDays ?? ""}`)
    lines.push(`SUMMARY,startedAt,${challenge.startedAt.toISOString()}`)
    if (challenge.deadlineAt) lines.push(`SUMMARY,deadlineAt,${challenge.deadlineAt.toISOString()}`)
    if (challenge.breachReason) lines.push(`SUMMARY,breachReason,${challenge.breachReason}`)
    lines.push("")
    lines.push("DAILY,date,startBalance,endBalance,lowestEquity,dailyPnl,tradesCount,dailyDDUsedPct")
    for (const s of challenge.dailySnapshots) {
      lines.push(
        `DAILY,${s.date.toISOString().slice(0, 10)},${Number(s.startBalance).toFixed(2)},${Number(s.endBalance).toFixed(2)},${Number(s.lowestEquity).toFixed(2)},${Number(s.dailyPnl).toFixed(2)},${s.tradesCount},${s.dailyDDUsedPct != null ? Number(s.dailyDDUsedPct).toFixed(2) : ""}`
      )
    }
    lines.push("")
    lines.push("EVENT,createdAt,severity,eventType,message")
    for (const e of challenge.events) {
      lines.push(
        `EVENT,${e.createdAt.toISOString()},${e.severity},${e.eventType},${escapeCsv(e.message ?? "")}`
      )
    }
    if (challenge.payouts.length > 0) {
      lines.push("")
      lines.push("PAYOUT,requestedAt,status,amount")
      for (const p of challenge.payouts) {
        lines.push(`PAYOUT,${p.requestedAt.toISOString()},${p.status},${Number(p.amount).toFixed(2)}`)
      }
    }

    const csv = "\uFEFF" + lines.join("\r\n")
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="challenge-${id}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to export challenge" }, { status: 500 })
  }
}

function escapeCsv(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
