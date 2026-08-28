import { prisma } from "./prisma"

export async function evaluateAchievements(userId: string) {
  const newUnlocks: string[] = []

  // Get all achievements and currently unlocked achievements
  const allAchievements = await prisma.achievement.findMany()
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true, achievement: { select: { code: true } } }
  })
  const unlockedCodes = new Set(unlocked.map(u => u.achievement.code))

  const unlock = async (code: string) => {
    if (unlockedCodes.has(code)) return
    const achievement = allAchievements.find(a => a.code === code)
    if (!achievement) return

    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
      }
    })
    unlockedCodes.add(code)
    newUnlocks.push(code)
  }

  // Evaluate Trading Achievements — use count() instead of loading all trades
  const tradeCount = await prisma.trade.count({
    where: { userId, status: 'closed' }
  })

  if (tradeCount > 0) {
    await unlock('first_trade')
    
    if (tradeCount >= 25) await unlock('trades_25')
    if (tradeCount >= 100) await unlock('trades_100')
    if (tradeCount >= 500) await unlock('trades_500')

    // Check for first win — use findFirst instead of loading all trades
    const hasWin = await prisma.trade.findFirst({
      where: { userId, status: 'closed', netPnl: { gt: 0 } },
      select: { id: true }
    })
    if (hasWin) await unlock('first_profit')

    // Check for big R trade — use findFirst
    const hasBigR = await prisma.trade.findFirst({
      where: {
        userId,
        status: 'closed',
        riskAmount: { gt: 0 },
        netPnl: { gte: 0 }
      },
      select: { id: true, netPnl: true, riskAmount: true }
    })
    if (hasBigR && Number(hasBigR.netPnl) / Number(hasBigR.riskAmount) >= 3) {
      await unlock('big_r')
    }

    // Streaks — only need trades for streak calculation
    const trades = await prisma.trade.findMany({
      where: { userId, status: 'closed' },
      orderBy: { exitAt: 'asc' },
      select: { netPnl: true }
    })
    
    let currentStreak = 0
    let maxStreak = 0
    for (const t of trades) {
      if (Number(t.netPnl) > 0) {
        currentStreak++
        if (currentStreak > maxStreak) maxStreak = currentStreak
      } else if (Number(t.netPnl) < 0) {
        currentStreak = 0
      }
    }
    if (maxStreak >= 5) await unlock('streak_5')
    if (maxStreak >= 10) await unlock('streak_10')

    // Profit Factor (20 trades min) — use aggregates
    if (tradeCount >= 20) {
      const [winSum, lossSum] = await Promise.all([
        prisma.trade.aggregate({
          where: { userId, status: 'closed', netPnl: { gt: 0 } },
          _sum: { netPnl: true }
        }),
        prisma.trade.aggregate({
          where: { userId, status: 'closed', netPnl: { lt: 0 } },
          _sum: { netPnl: true }
        })
      ])
      const grossProfit = Number(winSum._sum.netPnl || 0)
      const grossLoss = Math.abs(Number(lossSum._sum.netPnl || 0))
      const pf = grossLoss === 0 ? grossProfit : grossProfit / grossLoss
      if (pf >= 2.0) await unlock('profit_factor_2')
    }
  }

  // Evaluate Journal Achievements — use count()
  const journalCount = await prisma.dailyJournal.count({
    where: { userId }
  })
  
  if (journalCount >= 7) await unlock('journal_7')
  if (journalCount >= 30) await unlock('journal_30')

  // Check for perfect discipline — use findFirst
  const perfectJournal = await prisma.dailyJournal.findFirst({
    where: { userId, disciplineChecks: { not: undefined } },
    select: { disciplineChecks: true }
  })
  if (perfectJournal?.disciplineChecks) {
    const checks = typeof perfectJournal.disciplineChecks === 'string'
      ? JSON.parse(perfectJournal.disciplineChecks as string)
      : perfectJournal.disciplineChecks as Record<string, boolean>
    if (checks && Object.keys(checks).length > 0 && Object.values(checks).every(val => val === true)) {
      await unlock('discipline_perfect')
    }
  }

  // Evaluate Prop Firm Achievements — use count() and findFirst
  const challengeCount = await prisma.propChallenge.count({
    where: { userId }
  })
  if (challengeCount > 0) await unlock('prop_active')

  const passedChallenge = await prisma.propChallenge.findFirst({
    where: { userId, OR: [{ status: 'passed' }, { phase: 'funded' }] },
    select: { id: true }
  })
  if (passedChallenge) await unlock('prop_passed')

  const payoutCount = await prisma.propPayout.count({
    where: { challenge: { userId } }
  })
  if (payoutCount > 0) await unlock('payout_requested')

  return newUnlocks
}
