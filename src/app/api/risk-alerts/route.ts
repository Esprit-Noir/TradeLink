import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { dayKey, nextMidnightInTz } from "@/lib/dates"

type Alert = {
  type: string
  severity: "info" | "warning" | "critical"
  message: string
  challengeId?: string
  challengeName?: string
  value?: string
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true, timezone: true },
    })
    const prefs = (user?.notificationPrefs as any) || {}
    const eventMap = prefs.eventTypes || {}

    const activeChallenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id, status: "active" },
      include: { template: true },
      orderBy: { startedAt: "asc" },
    })

    const alerts: Alert[] = []

    // ── Per-challenge risk alerts ─────────────────────────────────────────
    for (const c of activeChallenges) {
      const timezone = c.template.dailyResetTimezone || "UTC"
      const initialBalance = Number(c.initialBalance)
      const profitTargetPct = Number(c.profitTargetPct)
      const maxDDPct = Number(c.maxDDPct)
      const dailyDDPct = Number(c.dailyDDPct)

      const trades = await prisma.trade.findMany({
        where: { accountId: c.accountId, status: "closed" },
        orderBy: { exitAt: "asc" },
      })

      let currentBalance = initialBalance
      let highestBalance = initialBalance
      let todayStartBalance = initialBalance
      let todayResetAt = c.todayResetAt || new Date(c.startedAt)

      for (const t of trades) {
        const exit = t.exitAt!
        if (exit > todayResetAt) {
          todayStartBalance = currentBalance
          todayResetAt = nextMidnightInTz(exit, timezone)
        }
        const pnl = Number(t.netPnl || 0)
        currentBalance += pnl
        if (c.template.drawdownType === "trailing_balance") {
          highestBalance = Math.max(highestBalance, currentBalance)
        }
      }

      const maxDdReference =
        c.template.drawdownType === "static_balance" ? initialBalance :
        c.template.drawdownType === "trailing_balance" ? highestBalance :
        highestBalance

      const ddBudget = maxDdReference * (maxDDPct / 100)
      const ddUsedPct = ddBudget > 0 ? ((maxDdReference - currentBalance) / ddBudget) * 100 : 0
      const dailyUsedPct = todayStartBalance > 0 ? ((todayStartBalance - currentBalance) / todayStartBalance / (dailyDDPct / 100)) * 100 : 0
      const currentProfit = currentBalance - initialBalance
      const targetAmount = initialBalance * (profitTargetPct / 100)
      const profitProgressPct = targetAmount > 0 ? (currentProfit / targetAmount) * 100 : 0
      const daysLeft = c.deadlineAt ? Math.max(0, Math.ceil((c.deadlineAt.getTime() - Date.now()) / 86400000)) : null

      const name = `${c.template.firmName} — ${c.template.programName}`

      if (ddUsedPct >= 90 && eventMap.alert_90pct !== false) {
        alerts.push({ type: "dd_90", severity: "critical", challengeId: c.id, challengeName: name, message: `${Math.round(ddUsedPct)}% of max drawdown used.`, value: `${Math.round(ddUsedPct)}%` })
      } else if (ddUsedPct >= 80 && eventMap.alert_80pct !== false) {
        alerts.push({ type: "dd_80", severity: "warning", challengeId: c.id, challengeName: name, message: `${Math.round(ddUsedPct)}% of max drawdown used.`, value: `${Math.round(ddUsedPct)}%` })
      }

      const stopPct = Number((c.alertConfig as any)?.stopTradingPct ?? 85)
      if ((c.alertConfig as any)?.enableStopTrading !== false && ddUsedPct >= stopPct && eventMap.stop_trading !== false) {
        alerts.push({ type: "stop_trading", severity: "critical", challengeId: c.id, challengeName: name, message: `Stop-trading threshold reached (${stopPct}% of max DD used). Consider stopping for the day.`, value: `${Math.round(ddUsedPct)}%` })
      }

      if (dailyUsedPct >= 70) {
        alerts.push({ type: "daily_dd", severity: "warning", challengeId: c.id, challengeName: name, message: `${Math.round(dailyUsedPct)}% of today's daily drawdown budget used.`, value: `${Math.round(dailyUsedPct)}%` })
      }

      const goalPct = Number((c.alertConfig as any)?.profitGoalPct ?? 50)
      if (profitProgressPct >= goalPct && eventMap.goal_reached !== false) {
        alerts.push({ type: "goal", severity: "info", challengeId: c.id, challengeName: name, message: `${Math.round(profitProgressPct)}% of profit target reached.`, value: `${Math.round(profitProgressPct)}%` })
      }

      if (daysLeft !== null && daysLeft <= 5 && eventMap.deadline_5d !== false) {
        alerts.push({ type: "deadline", severity: daysLeft <= 1 ? "critical" : "warning", challengeId: c.id, challengeName: name, message: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left before deadline.`, value: `${daysLeft}d` })
      }
    }

    // ── Recent stop violations (last 7 days) ──────────────────────────────
    const stopViolations = await prisma.trade.findMany({
      where: {
        userId: session.user.id,
        status: "closed",
        exitAt: { gte: new Date(Date.now() - 7 * 86400000) },
        AND: [{ netPnl: { lt: 0 } }],
      },
      orderBy: { exitAt: "desc" },
      take: 20,
    })

    const avgLoserPct = (() => {
      if (stopViolations.length === 0) return 0
      const sum = stopViolations.reduce((acc, t) => acc + Math.abs(Number(t.netPnl || 0)), 0)
      return sum / stopViolations.length
    })()
    const consecutiveLosingDays = (() => {
      const days = new Set(stopViolations.map(t => dayKey(t.exitAt!, "UTC")))
      let count = 0
      const today = new Date()
      for (let i = 0; i < 7; i++) {
        const d = new Date(today.getTime() - i * 86400000)
        if (days.has(dayKey(d, "UTC"))) count++
        else break
      }
      return count
    })()

    if (consecutiveLosingDays >= 3) {
      alerts.push({ type: "losing_streak", severity: "warning", message: `${consecutiveLosingDays} consecutive losing days this week. Consider stepping back.`, value: `${consecutiveLosingDays}d` })
    }
    if (stopViolations.length >= 10) {
      alerts.push({ type: "many_losses", severity: "warning", message: `${stopViolations.length} losing trades in the last 7 days.`, value: `${stopViolations.length}` })
    }

    // Order: critical first, then warning, then info
    const order = { critical: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => order[a.severity] - order[b.severity])

    return NextResponse.json({ alerts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch risk alerts" }, { status: 500 })
  }
}
