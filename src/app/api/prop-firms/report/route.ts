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
        template: { select: { firmName: true, logoUrl: true } },
        payouts: { select: { status: true, amount: true } },
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

    const byFirm = new Map<string, { firmName: string; logoUrl: string | null; total: number; passed: number; breached: number; active: number; payoutsPaid: number }>()
    for (const c of challenges) {
      const firmName = c.template?.firmName || "Unknown"
      let f = byFirm.get(firmName)
      if (!f) {
        f = { firmName, logoUrl: c.template?.logoUrl || null, total: 0, passed: 0, breached: 0, active: 0, payoutsPaid: 0 }
        byFirm.set(firmName, f)
      }
      f.total += 1
      if (c.status === "passed") f.passed += 1
      else if (c.status === "breached" || c.status === "failed") f.breached += 1
      else f.active += 1
      f.payoutsPaid += c.payouts.filter(p => p.status === "paid").reduce((x, p) => x + Number(p.amount), 0)
    }

    return NextResponse.json({
      total,
      active,
      passed,
      breached,
      passRate: Math.round(passRate * 10) / 10,
      totalProfit: Math.round(totalProfit * 100) / 100,
      payoutsPaid: Math.round(payoutsPaid * 100) / 100,
      payoutsPending: Math.round(payoutsPending * 100) / 100,
      byFirm: [...byFirm.values()].sort((a, b) => b.total - a.total),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch report" }, { status: 500 })
  }
}
