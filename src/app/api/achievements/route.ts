import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [allAchievements, unlocked, closedTrades, accounts, activeChallenges, passedChallenges, journals, payouts] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { category: "asc" } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { unlockedAt: "desc" },
      }),
      prisma.trade.findMany({
        where: { userId, status: "closed" },
        select: { netPnl: true, exitAt: true },
      }),
      prisma.tradingAccount.findMany({ where: { userId }, select: { id: true } }),
      prisma.propChallenge.findMany({ where: { userId, status: "active" }, select: { id: true } }),
      prisma.propChallenge.findMany({ where: { userId, status: "passed" }, select: { id: true } }),
      prisma.dailyJournal.findMany({ where: { userId }, select: { disciplineChecks: true } }),
      prisma.propPayout.count({ where: { challenge: { userId } } }),
    ])

    const unlockedMap = new Map(unlocked.map(u => [u.achievement.code, u.unlockedAt]))

    // ── Compute progress for each achievement ─────────────────────────────
    const pnl = closedTrades.map(t => Number(t.netPnl || 0))
    const wins = pnl.filter(p => p > 0)
    const losses = pnl.filter(p => p < 0)
    const grossWin = wins.reduce((a, b) => a + b, 0)
    const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
    const profitFactor = losses.length > 0 ? grossWin / grossLoss : grossWin > 0 ? 99 : 0
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0

    // Longest win streak
    let longestStreak = 0
    let cur = 0
    for (const p of pnl) {
      cur = p > 0 ? cur + 1 : 0
      longestStreak = Math.max(longestStreak, cur)
    }

    // Big R multiple
    const bigR = avgLoss > 0 && wins.some(w => w >= 3 * avgLoss)

    // Green week (5+ green days in rolling 7-day window)
    const dayMap = new Map<string, number>()
    for (let i = 0; i < closedTrades.length; i++) {
      if (!closedTrades[i].exitAt) continue
      const key = closedTrades[i].exitAt!.toISOString().slice(0, 10)
      dayMap.set(key, (dayMap.get(key) || 0) + pnl[i])
    }
    const greenDays = [...dayMap.values()].filter(v => v > 0).length
    const greenWeek = greenDays >= 5

    // Full discipline day
    const disciplinePerfect = journals.some(j => {
      const checks = (j.disciplineChecks as Record<string, boolean>) || {}
      const vals = Object.values(checks)
      return vals.length >= 5 && vals.every(Boolean)
    })

    const progress = (code: string): { earned: boolean; progress: number } => {
      switch (code) {
        case "first_trade": return { earned: closedTrades.length >= 1, progress: closedTrades.length }
        case "first_profit": return { earned: wins.length >= 1, progress: wins.length }
        case "trades_25": return { earned: closedTrades.length >= 25, progress: closedTrades.length }
        case "trades_100": return { earned: closedTrades.length >= 100, progress: closedTrades.length }
        case "trades_500": return { earned: closedTrades.length >= 500, progress: closedTrades.length }
        case "big_r": return { earned: bigR, progress: bigR ? 1 : 0 }
        case "profit_factor_2": return { earned: closedTrades.length >= 20 && profitFactor >= 2, progress: Math.round(profitFactor * 100) }
        case "streak_5": return { earned: longestStreak >= 5, progress: longestStreak }
        case "streak_10": return { earned: longestStreak >= 10, progress: longestStreak }
        case "green_week": return { earned: greenWeek, progress: greenDays }
        case "prop_active": return { earned: activeChallenges.length >= 1, progress: activeChallenges.length }
        case "prop_passed": return { earned: passedChallenges.length >= 1, progress: passedChallenges.length }
        case "payout_requested": return { earned: payouts >= 1, progress: payouts }
        case "journal_7": return { earned: journals.length >= 7, progress: journals.length }
        case "journal_30": return { earned: journals.length >= 30, progress: journals.length }
        case "discipline_perfect": return { earned: disciplinePerfect, progress: disciplinePerfect ? 1 : 0 }
        default: return { earned: false, progress: 0 }
      }
    }

    // ── Unlock newly earned ───────────────────────────────────────────────
    const newlyUnlocked: string[] = []
    for (const a of allAchievements) {
      if (!unlockedMap.has(a.code) && progress(a.code).earned) {
        try {
          await prisma.userAchievement.create({
            data: { userId, achievementId: a.id },
          })
          newlyUnlocked.push(a.code)
          unlockedMap.set(a.code, new Date())
        } catch {
          // ignore race
        }
      }
    }

    // ── Build response ─────────────────────────────────────────────────────
    const categories = ["trading", "consistency", "prop", "journal"] as const
    const grouped = categories.map(cat => ({
      category: cat,
      achievements: allAchievements
        .filter(a => a.category === cat)
        .map(a => {
          const p = progress(a.code)
          return {
            id: a.id,
            code: a.code,
            name: a.name,
            description: a.description,
            icon: a.icon,
            target: a.target,
            unlocked: unlockedMap.has(a.code),
            unlockedAt: unlockedMap.get(a.code)?.toISOString() ?? null,
            earned: p.earned,
            progress: p.progress,
          }
        }),
    }))

    return NextResponse.json({
      total: allAchievements.length,
      unlockedCount: unlockedMap.size,
      newlyUnlocked,
      groups: grouped,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
