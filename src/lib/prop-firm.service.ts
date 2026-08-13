import { prisma } from "./prisma"
import { PropChallenge, PropChallengeDailySnapshot, PropFirmTemplate, Trade } from "@prisma/client"

export async function evaluateChallenge(challengeId: string) {
  const challenge = await prisma.propChallenge.findUnique({
    where: { id: challengeId },
    include: { template: true, account: true }
  })

  if (!challenge) throw new Error("Challenge not found")
  if (challenge.status === "breached" || challenge.status === "failed") {
    return challenge // Terminal state
  }

  // Get all closed trades sorted by exit time
  const trades = await prisma.trade.findMany({
    where: { accountId: challenge.accountId, status: "closed" },
    orderBy: { exitAt: 'asc' }
  })

  // We are calculating from scratch for the MVP, effectively a recalculate flow.
  let currentBalance = Number(challenge.initialBalance)
  let highestBalance = Number(challenge.initialBalance)
  let highestEquity = Number(challenge.initialBalance)
  let todayStartBalance = Number(challenge.initialBalance)
  let todayResetAt = challenge.todayResetAt || new Date(challenge.startedAt)

  for (const trade of trades) {
    const tradeExit = trade.exitAt!

    // Check if we entered a new day
    if (tradeExit > todayResetAt) {
      todayStartBalance = currentBalance
      // In a real app, todayResetAt should be calculated based on dailyResetTimezone
      // For MVP, simply set it to the next day's reset time relative to the trade
      const nextDay = new Date(tradeExit)
      nextDay.setUTCHours(23, 59, 59, 999) // Mock end of day
      todayResetAt = nextDay
    }

    const pnl = Number(trade.netPnl || 0)
    currentBalance += pnl

    // Update highest marks
    if (challenge.template.drawdownType === 'trailing_balance') {
      highestBalance = Math.max(highestBalance, currentBalance)
    }
    
    // For trailing equity, we approximate it with balance since we only look at post-trade
    if (challenge.template.drawdownType === 'trailing_equity') {
      highestEquity = Math.max(highestEquity, currentBalance)
    }

    // Evaluate breaches
    const maxDdReference = 
      challenge.template.drawdownType === 'static_balance' ? Number(challenge.initialBalance) :
      challenge.template.drawdownType === 'trailing_balance' ? highestBalance :
      highestEquity

    const maxDdThreshold = maxDdReference * (1 - Number(challenge.maxDDPct) / 100)
    const dailyDdThreshold = todayStartBalance * (1 - Number(challenge.dailyDDPct) / 100)

    if (currentBalance <= maxDdThreshold) {
      await markBreached(challenge.id, 'max_dd')
      return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
    }

    if (currentBalance <= dailyDdThreshold) {
      await markBreached(challenge.id, 'daily_dd')
      return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
    }
  }

  // Check Profit Target
  const profitTarget = Number(challenge.initialBalance) * (Number(challenge.profitTargetPct) / 100)
  const currentProfit = currentBalance - Number(challenge.initialBalance)
  
  // Note: Min trading days check is simplified for MVP
  if (currentProfit >= profitTarget) {
    await prisma.propChallenge.update({
      where: { id: challenge.id },
      data: { status: 'passed' }
    })
    return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
  }

  // Update live values if no breach
  const updated = await prisma.propChallenge.update({
    where: { id: challenge.id },
    data: {
      currentBalance,
      currentEquity: currentBalance, // MVP approximation
      highestBalance,
      highestEquity,
      todayStartBalance,
      todayResetAt
    }
  })

  return updated
}

async function markBreached(challengeId: string, reason: string) {
  await prisma.propChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'breached',
      breachReason: reason,
      breachedAt: new Date()
    }
  })
}
