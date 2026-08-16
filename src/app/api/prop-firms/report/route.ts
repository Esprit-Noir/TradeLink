import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id },
      include: {
        template: { select: { firmName: true, logoUrl: true, drawdownType: true } },
        account: { select: { name: true } },
        payouts: { select: { status: true, amount: true } },
        dailySnapshots: { select: { endBalance: true }, orderBy: { date: "asc" } },
      },
    })

    const total = challenges.length
    const active = challenges.filter(c => c.status === "active").length
    const passed = challenges.filter(c => c.status === "passed").length
    const breached = challenges.filter(c => c.status === "breached" || c.status === "failed").length
    const passRate = total > 0 ? (passed / total) * 100 : 0

    // Sum of current P&L ($) across active challenges
    let totalProfit = 0
    for (const c of challenges) {
      if (c.status === "active") {
        totalProfit += Number(c.currentBalance ?? c.initialBalance) - Number(c.initialBalance)
      }
    }

    const payoutsPaid = challenges.reduce((s, c) =>
      s + c.payouts.filter(p => p.status === "paid").reduce((x, p) => x + Number(p.amount), 0), 0)
    const payoutsPending = challenges.reduce((s, c) =>
      s + c.payouts.filter(p => p.status === "requested" || p.status === "approved").reduce((x, p) => x + Number(p.amount), 0), 0)

    // Business case: total cost of challenges vs payouts received
    const totalCost = challenges.reduce((s, c) => s + (c.cost ? Number(c.cost) : 0), 0)
    const roi = totalCost > 0 ? ((payoutsPaid - totalCost) / totalCost) * 100 : null

    const byFirm = new Map<string, { firmName: string; logoUrl: string | null; total: number; passed: number; breached: number; active: number; payoutsPaid: number; payoutsPending: number; cost: number }>()
    for (const c of challenges) {
      const firmName = c.template?.firmName || "Unknown"
      let f = byFirm.get(firmName)
      if (!f) {
        f = { firmName, logoUrl: c.template?.logoUrl || null, total: 0, passed: 0, breached: 0, active: 0, payoutsPaid: 0, payoutsPending: 0, cost: 0 }
        byFirm.set(firmName, f)
      }
      f.total += 1
      if (c.status === "passed") f.passed += 1
      else if (c.status === "breached" || c.status === "failed") f.breached += 1
      else f.active += 1
      f.payoutsPaid += c.payouts.filter(p => p.status === "paid").reduce((x, p) => x + Number(p.amount), 0)
      f.payoutsPending += c.payouts.filter(p => p.status === "requested" || p.status === "approved").reduce((x, p) => x + Number(p.amount), 0)
      f.cost += c.cost ? Number(c.cost) : 0
    }

    const byFirmOut = [...byFirm.values()]
      .map(f => ({
        ...f,
        payoutsPaid: Math.round(f.payoutsPaid * 100) / 100,
        payoutsPending: Math.round(f.payoutsPending * 100) / 100,
        cost: Math.round(f.cost * 100) / 100,
        roi: f.cost > 0 ? Math.round(((f.payoutsPaid - f.cost) / f.cost) * 100 * 10) / 10 : null,
      }))
      .sort((a, b) => b.total - a.total)

    // Progress of each active challenge toward passing its current phase
    const activeChallenges = challenges
      .filter(c => c.status === "active")
      .map(c => {
        const initial = Number(c.initialBalance)
        const current = Number(c.currentBalance ?? initial)
        const profitTargetPct = Number(c.profitTargetPct || 0)
        const maxDDPct = Number(c.maxDDPct || 0)
        const daysTraded = Number((c.metadata as any)?.tradingDaysCount || 0)
        const minDays = Number(c.minTradingDays || 0)

        const profitPct = initial > 0 ? ((current - initial) / initial) * 100 : 0
        const profitReachedPct = profitTargetPct > 0 ? Math.min(100, (profitPct / profitTargetPct) * 100) : 0

        // Peak reference for drawdown (static balance → initial; trailing → highest seen)
        const peak = c.template?.drawdownType === "static_balance"
          ? initial
          : Math.max(initial, current, ...c.dailySnapshots.map(s => Number(s.endBalance)))
        const ddBudget = peak * (maxDDPct / 100)
        const ddUsedPct = ddBudget > 0 ? Math.min(100, Math.max(0, ((peak - current) / ddBudget) * 100)) : 0

        return {
          id: c.id,
          firmName: c.template?.firmName || "Unknown",
          logoUrl: c.template?.logoUrl || null,
          phase: c.phase,
          accountName: c.account?.name || "",
          currentBalance: Math.round(current * 100) / 100,
          profitPct: Math.round(profitPct * 100) / 100,
          profitTargetPct,
          profitReachedPct: Math.round(profitReachedPct * 10) / 10,
          maxDDPct,
          ddUsedPct: Math.round(ddUsedPct * 10) / 10,
          minTradingDays: minDays,
          daysTraded,
        }
      })
      .sort((a, b) => b.ddUsedPct - a.ddUsedPct)

    return NextResponse.json({
      total,
      active,
      passed,
      breached,
      passRate: Math.round(passRate * 10) / 10,
      totalProfit: Math.round(totalProfit * 100) / 100,
      payoutsPaid: Math.round(payoutsPaid * 100) / 100,
      payoutsPending: Math.round(payoutsPending * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      roi: roi !== null ? Math.round(roi * 10) / 10 : null,
      byFirm: byFirmOut,
      activeChallenges,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
