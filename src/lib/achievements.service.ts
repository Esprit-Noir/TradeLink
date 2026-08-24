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

  // Evaluate Trading Achievements
  const trades = await prisma.trade.findMany({
    where: { userId, status: 'closed' },
    orderBy: { exitAt: 'asc' }
  })

  if (trades.length > 0) {
    await unlock('first_trade')
    
    if (trades.length >= 25) await unlock('trades_25')
    if (trades.length >= 100) await unlock('trades_100')
    if (trades.length >= 500) await unlock('trades_500')

    const hasWin = trades.some(t => Number(t.netPnl) > 0)
    if (hasWin) await unlock('first_profit')

    const hasBigR = trades.some(t => {
      if (!t.riskAmount || Number(t.riskAmount) <= 0) return false
      return (Number(t.netPnl) / Number(t.riskAmount)) >= 3
    })
    if (hasBigR) await unlock('big_r')

    // Streaks
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

    // Profit Factor (20 trades min)
    if (trades.length >= 20) {
      const grossProfit = trades.filter(t => Number(t.netPnl) > 0).reduce((sum, t) => sum + Number(t.netPnl), 0)
      const grossLoss = trades.filter(t => Number(t.netPnl) < 0).reduce((sum, t) => sum + Math.abs(Number(t.netPnl)), 0)
      const pf = grossLoss === 0 ? grossProfit : grossProfit / grossLoss
      if (pf >= 2.0) await unlock('profit_factor_2')
    }
  }

  // Evaluate Journal Achievements
  const journals = await prisma.dailyJournal.findMany({
    where: { userId }
  })
  
  if (journals.length >= 7) await unlock('journal_7')
  if (journals.length >= 30) await unlock('journal_30')

  const hasPerfectDiscipline = journals.some(j => {
    if (!j.disciplineChecks) return false
    const checks = typeof j.disciplineChecks === 'string' ? JSON.parse(j.disciplineChecks as string) : j.disciplineChecks as Record<string, boolean>
    // Assuming a perfect day means all checks are true and there are checks.
    if (!checks || Object.keys(checks).length === 0) return false
    return Object.values(checks).every(val => val === true)
  })
  if (hasPerfectDiscipline) await unlock('discipline_perfect')

  // Evaluate Prop Firm Achievements
  const challenges = await prisma.propChallenge.findMany({
    where: { userId }
  })
  if (challenges.length > 0) await unlock('prop_active')
  if (challenges.some(c => c.status === 'passed' || c.phase === 'funded')) await unlock('prop_passed')

  const payouts = await prisma.propPayout.count({
    where: { challenge: { userId } }
  })
  if (payouts > 0) await unlock('payout_requested')

  return newUnlocks
}
