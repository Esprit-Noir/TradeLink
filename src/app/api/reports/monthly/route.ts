import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const month = url.searchParams.get("month")
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: "Invalid month. Use YYYY-MM." }, { status: 400 })
    }

    const [y, m] = month.split("-").map(Number)
    const start = new Date(Date.UTC(y, m - 1, 1))
    const end = new Date(Date.UTC(y, m, 1))

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { timezone: true },
    })
    const timezone = user?.timezone || "UTC"

    const trades = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        status: "closed",
        entryAt: { gte: start, lt: end },
      },
      select: {
        symbol: true,
        side: true,
        setupTags: true,
        netPnl: true,
        netPnlUsd: true,
        riskAmount: true,
        entryAt: true,
      },
      orderBy: { entryAt: "asc" },
    })

    const dayKey = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d)

    let wins = 0
    let losses = 0
    let breakeven = 0
    let totalPnl = 0
    let totalPnlUsd = 0
    let grossProfit = 0
    let grossLoss = 0
    let totalWin = 0
    let totalLoss = 0
    let best = -Infinity
    let worst = Infinity
    let rSum = 0
    let rCount = 0

    const dayMap = new Map<string, { date: string; pnl: number; pnlUsd: number; trades: number }>()
    const setupMap = new Map<string, { name: string; count: number; pnl: number; wins: number }>()
    const symbolMap = new Map<string, { symbol: string; count: number; pnl: number }>()
    const hourMap = new Map<number, { hour: number; count: number; pnl: number; wins: number }>()
    const dowMap = new Map<number, { dow: number; count: number; pnl: number; wins: number }>()

    const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    for (const t of trades) {
      const pnl = Number(t.netPnl || 0)
      const pnlUsd = Number(t.netPnlUsd ?? t.netPnl ?? 0)
      totalPnl += pnl
      totalPnlUsd += pnlUsd

      if (pnl > 0) { wins++; totalWin += pnl; grossProfit += pnl }
      else if (pnl < 0) { losses++; totalLoss += Math.abs(pnl); grossLoss += Math.abs(pnl) }
      else breakeven++

      if (pnl > best) best = pnl
      if (pnl < worst) worst = pnl

      if (Number(t.riskAmount) > 0) {
        rSum += pnl / Number(t.riskAmount)
        rCount++
      }

      const key = dayKey(t.entryAt)
      const d = dayMap.get(key)
      if (d) {
        d.pnl += pnl
        d.pnlUsd += pnlUsd
        d.trades++
      } else {
        dayMap.set(key, { date: key, pnl, pnlUsd, trades: 1 })
      }

      for (const tag of t.setupTags || []) {
        const s = setupMap.get(tag)
        if (s) {
          s.count++
          s.pnl += pnl
          if (pnl > 0) s.wins++
        } else {
          setupMap.set(tag, { name: tag, count: 1, pnl, wins: pnl > 0 ? 1 : 0 })
        }
      }

      const sym = symbolMap.get(t.symbol)
      if (sym) {
        sym.count++
        sym.pnl += pnl
      } else {
        symbolMap.set(t.symbol, { symbol: t.symbol, count: 1, pnl })
      }

      const localParts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        hour12: false,
        weekday: "long",
      }).formatToParts(t.entryAt)
      const hourPart = localParts.find(p => p.type === "hour")
      const dowPart = localParts.find(p => p.type === "weekday")
      const hour = hourPart ? Number(hourPart.value) % 24 : 0
      const dowName = dowPart?.value || "Sunday"
      const dow = DOW_NAMES.indexOf(dowName)

      const h = hourMap.get(hour)
      if (h) {
        h.count++
        h.pnl += pnl
        if (pnl > 0) h.wins++
      } else {
        hourMap.set(hour, { hour, count: 1, pnl, wins: pnl > 0 ? 1 : 0 })
      }

      const w = dowMap.get(dow)
      if (w) {
        w.count++
        w.pnl += pnl
        if (pnl > 0) w.wins++
      } else {
        dowMap.set(dow, { dow, count: 1, pnl, wins: pnl > 0 ? 1 : 0 })
      }
    }

    // Fill every calendar day of the month
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
    const daily: { date: string; pnl: number; pnlUsd: number; trades: number; cumPnl: number }[] = []
    let cum = 0
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = new Date(Date.UTC(y, m - 1, day, 12))
      const key = dayKey(iso)
      const d = dayMap.get(key) || { date: key, pnl: 0, pnlUsd: 0, trades: 0 }
      cum += d.pnl
      daily.push({ ...d, cumPnl: Math.round(cum * 100) / 100 })
    }

    const total = trades.length
    const tradingDays = [...dayMap.values()].filter(d => d.trades > 0).length

    // Challenges & payouts for the month
    const challenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id },
      include: { template: { select: { firmName: true, logoUrl: true } } },
    })

    const started = challenges.filter(c => c.startedAt >= start && c.startedAt < end)
    const resolved = challenges.filter(
      c =>
        (c.status === 'passed' || c.status === 'breached' || c.status === 'failed') &&
        c.breachedAt &&
        c.breachedAt >= start &&
        c.breachedAt < end
    )

    const payouts = await prisma.propPayout.findMany({
      where: { challenge: { userId: session.user.id }, requestedAt: { gte: start, lt: end } },
      include: {
        challenge: {
          select: { account: { select: { name: true } }, template: { select: { firmName: true, logoUrl: true } } }
        }
      },
      orderBy: { requestedAt: "asc" },
    })

    return NextResponse.json({
      month,
      trades: {
        total,
        wins,
        losses,
        breakeven,
        winRate: total > 0 ? (wins / total) * 100 : 0,
        totalPnl: Math.round(totalPnl * 100) / 100,
        totalPnlUsd: Math.round(totalPnlUsd * 100) / 100,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0,
        expectancy: total > 0 ? totalPnl / total : 0,
        avgWin: wins > 0 ? totalWin / wins : 0,
        avgLoss: losses > 0 ? totalLoss / losses : 0,
        avgR: rCount > 0 ? rSum / rCount : 0,
        best: best === -Infinity ? 0 : best,
        worst: worst === Infinity ? 0 : worst,
        tradingDays,
        avgTradesPerDay: tradingDays > 0 ? total / tradingDays : 0,
      },
      daily,
      setups: [...setupMap.values()].sort((a, b) => b.pnl - a.pnl),
      symbols: [...symbolMap.values()].sort((a, b) => b.pnl - a.pnl),
      hours: [...hourMap.values()].sort((a, b) => a.hour - b.hour),
      dow: [...dowMap.values()]
        .sort((a, b) => a.dow - b.dow)
        .map(d => ({ ...d, name: DOW_NAMES[d.dow] })),
      challenges: {
        startedCount: started.length,
        startedCost: started.reduce((s, c) => s + Number(c.cost || 0), 0),
        passed: resolved.filter(c => c.status === 'passed').length,
        breached: resolved.filter(c => c.status === 'breached' || c.status === 'failed').length,
        active: challenges.filter(c => c.status === 'active').length,
      },
      payouts: payouts.map(p => ({
        firmName: p.challenge.template.firmName,
        logoUrl: p.challenge.template.logoUrl || null,
        accountName: p.challenge.account.name,
        amount: Number(p.amount),
        status: p.status,
        requestedAt: p.requestedAt.toISOString(),
      })),
      payoutsTotals: {
        count: payouts.length,
        amount: payouts.reduce((s, p) => s + Number(p.amount), 0),
        paidAmount: payouts.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0),
      },
    })
  } catch (error) {
    console.error("Error generating monthly report:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
