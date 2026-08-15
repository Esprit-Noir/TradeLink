import { prisma } from "./prisma"
import { dayKey, nextMidnightInTz } from "@/lib/dates"

type EventSeverity = "info" | "warning" | "critical"

const DEFAULT_PREFS: Record<string, boolean> = {
  breached: true,
  target_hit: true,
  alert_80pct: true,
  alert_90pct: true,
  min_days_not_met: false,
  stop_trading: true,
  goal_reached: true,
  deadline_5d: true,
  deadline_1d: true,
}

function prefEnabled(prefs: any, eventType: string) {
  const map = prefs?.eventTypes
  if (!map || typeof map !== "object") return DEFAULT_PREFS[eventType] ?? true
  if (eventType in map) return Boolean(map[eventType])
  return DEFAULT_PREFS[eventType] ?? true
}

async function logEventIfAbsent(
  challengeId: string,
  eventType: string,
  severity: EventSeverity,
  message: string,
  metadata?: object,
  enabled: boolean = true
) {
  if (!enabled) return
  const existing = await prisma.propChallengeEvent.findFirst({
    where: { challengeId, eventType },
    select: { id: true },
  })
  if (existing) return

  await prisma.propChallengeEvent.create({
    data: { challengeId, eventType, severity, message, metadata: metadata ?? undefined },
  })
}

interface DayAccum {
  date: Date
  startBalance: number
  endBalance: number
  lowestEquity: number
  pnl: number
  count: number
}

export async function evaluateChallenge(challengeId: string) {
  const challenge = await prisma.propChallenge.findUnique({
    where: { id: challengeId },
    include: { template: true, account: true }
  })

  if (!challenge) throw new Error("Challenge not found")
  if (challenge.status === "breached" || challenge.status === "failed") {
    return challenge // Terminal state
  }

  const timezone = challenge.template.dailyResetTimezone || "UTC"

  // User notification preferences (controls which events are created)
  const user = await prisma.user.findUnique({
    where: { id: challenge.userId },
    select: { notificationPrefs: true },
  })
  const prefs = user?.notificationPrefs

  // Time limit check
  if (challenge.deadlineAt && challenge.status === 'active' && new Date() > challenge.deadlineAt) {
    await markFailed(challenge.id, 'time_limit', `Time limit reached. Challenge expired.`, prefs)
    return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
  }

  // Deadline reminders (J-5 and J-1, once each)
  if (challenge.deadlineAt && challenge.status === 'active') {
    const daysRemaining = Math.ceil((challenge.deadlineAt.getTime() - Date.now()) / 86400000)
    if (daysRemaining <= 5) {
      await logEventIfAbsent(
        challenge.id,
        "deadline_5d",
        "warning",
        `Deadline approaching: ${Math.max(0, daysRemaining)} day(s) left (${challenge.deadlineAt.toISOString().slice(0, 10)}).`,
        { daysRemaining: Math.max(0, daysRemaining) },
        prefEnabled(prefs, "deadline_5d")
      )
    }
    if (daysRemaining <= 1) {
      await logEventIfAbsent(
        challenge.id,
        "deadline_1d",
        "critical",
        `Last day! Deadline is ${Math.max(0, daysRemaining) === 0 ? "today" : "tomorrow"}.`,
        { daysRemaining: Math.max(0, daysRemaining) },
        prefEnabled(prefs, "deadline_1d")
      )
    }
  }

  // Get all closed trades sorted by exit time
  const trades = await prisma.trade.findMany({
    where: { accountId: challenge.accountId, status: "closed" },
    orderBy: { exitAt: 'asc' }
  })

  // Log debug information to a local file
  try {
    const fs = require("fs")
    const path = require("path")
    const logPath = path.resolve(process.cwd(), "logs_eval.txt")
    const logMsg = `[${new Date().toISOString()}] Challenge evaluation triggered. ID: ${challengeId}, Account ID: ${challenge.accountId}, Trades found: ${trades.length}\n`
    fs.appendFileSync(logPath, logMsg)
    if (trades.length > 0) {
      fs.appendFileSync(logPath, `Trades details: ${JSON.stringify(trades.map(t => ({ id: t.id, symbol: t.symbol, exitAt: t.exitAt, netPnl: t.netPnl, status: t.status })))}\n`)
    }
  } catch (e) {
    console.error("Failed to write evaluation logs:", e)
  }

  // We are calculating from scratch for the MVP, effectively a recalculate flow.
  let currentBalance = Number(challenge.initialBalance)
  let highestBalance = Number(challenge.initialBalance)
  let highestEquity = Number(challenge.initialBalance)
  let todayStartBalance = Number(challenge.initialBalance)
  let todayResetAt = challenge.todayResetAt || new Date(challenge.startedAt)

  const profitTarget = Number(challenge.initialBalance) * (Number(challenge.profitTargetPct) / 100)

  // Per-trading-day accumulation (keys in the template's reset timezone)
  const days = new Map<string, DayAccum>()

  for (const trade of trades) {
    const tradeExit = trade.exitAt!

    // Check if we entered a new day (reset boundary is midnight in the template's timezone)
    if (tradeExit > todayResetAt) {
      todayStartBalance = currentBalance
      todayResetAt = nextMidnightInTz(tradeExit, timezone)
    }

    const pnl = Number(trade.netPnl || 0)
    currentBalance += pnl

    // Update highest marks for stats
    highestBalance = Math.max(highestBalance, currentBalance)
    highestEquity = Math.max(highestEquity, currentBalance)

    // Accumulate into the trading day
    const key = dayKey(tradeExit, timezone)
    const acc = days.get(key) || {
      date: tradeExit,
      startBalance: currentBalance - pnl,
      endBalance: currentBalance,
      lowestEquity: currentBalance,
      pnl: 0,
      count: 0,
    }
    acc.endBalance = currentBalance
    acc.lowestEquity = Math.min(acc.lowestEquity, currentBalance)
    acc.pnl += pnl
    acc.count += 1
    days.set(key, acc)

    // Evaluate breaches
    const maxDdReference =
      challenge.template.drawdownType === 'static_balance' ? Number(challenge.initialBalance) :
      challenge.template.drawdownType === 'trailing_balance' ? highestBalance :
      highestEquity

    const maxDdThreshold = maxDdReference * (1 - Number(challenge.maxDDPct) / 100)
    const dailyDdThreshold = todayStartBalance * (1 - Number(challenge.dailyDDPct) / 100)

    // Alert thresholds — % of max drawdown used (fire 80% then 90%, once each)
    const ddBudget = maxDdReference * (Number(challenge.maxDDPct) / 100)
    const ddUsedPct = ddBudget > 0 ? ((maxDdReference - currentBalance) / ddBudget) * 100 : 0

    if (ddUsedPct >= 90) {
      await logEventIfAbsent(
        challenge.id,
        "alert_90pct",
        "critical",
        `Drawdown alert: ${Math.round(ddUsedPct)}% of your max drawdown is used.`,
        { ddUsedPct: Math.round(ddUsedPct) },
        prefEnabled(prefs, "alert_90pct")
      )
    }
    if (ddUsedPct >= 80) {
      await logEventIfAbsent(
        challenge.id,
        "alert_80pct",
        "warning",
        `Drawdown alert: ${Math.round(ddUsedPct)}% of your max drawdown is used.`,
        { ddUsedPct: Math.round(ddUsedPct) },
        prefEnabled(prefs, "alert_80pct")
      )
    }

    // Custom alert thresholds (configurable per challenge)
    const alertConfig: any = challenge.alertConfig || {}
    if (alertConfig.enableStopTrading && Number(alertConfig.stopTradingPct) > 0 && ddUsedPct >= Number(alertConfig.stopTradingPct)) {
      await logEventIfAbsent(
        challenge.id,
        "stop_trading",
        "critical",
        `Stop-trading alert: ${Math.round(ddUsedPct)}% of max drawdown used (threshold ${alertConfig.stopTradingPct}%). Consider stopping for the day.`,
        { ddUsedPct: Math.round(ddUsedPct), threshold: Number(alertConfig.stopTradingPct) },
        prefEnabled(prefs, "stop_trading")
      )
    }
    if (alertConfig.enableProfitGoal && Number(alertConfig.profitGoalPct) > 0) {
      const profitGoal = profitTarget * (Number(alertConfig.profitGoalPct) / 100)
      const currentProfit = currentBalance - Number(challenge.initialBalance)
      if (currentProfit >= profitGoal && profitGoal > 0) {
        await logEventIfAbsent(
          challenge.id,
          "goal_reached",
          "info",
          `Profit goal reached: ${Math.round(currentProfit * 100) / 100} (${alertConfig.profitGoalPct}% of target).`,
          { currentProfit: Math.round(currentProfit * 100) / 100 },
          prefEnabled(prefs, "goal_reached")
        )
      }
    }

    if (currentBalance <= maxDdThreshold) {
      await updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, days.size)
      await markBreached(challenge.id, 'max_dd', prefs)
      await writeDailySnapshots(challenge.id, days, Number(challenge.dailyDDPct || 0))
      return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
    }

    if (currentBalance <= dailyDdThreshold) {
      await updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, days.size)
      await markBreached(challenge.id, 'daily_dd', prefs)
      await writeDailySnapshots(challenge.id, days, Number(challenge.dailyDDPct || 0))
      return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
    }
  }

  // Persist daily snapshots for the chart
  await writeDailySnapshots(challenge.id, days, Number(challenge.dailyDDPct || 0))

  // Trading-day bookkeeping for the gauges
  const tradingDays = days.size
  const minTradingDays = Number(challenge.minTradingDays || 0)
  // Check Profit Target
  const currentProfit = currentBalance - Number(challenge.initialBalance)

  if (currentProfit >= profitTarget) {
    // Funded accounts don't "pass" — they become eligible for payouts.
    if (challenge.phase === 'funded') {
      await logEventIfAbsent(
        challenge.id,
        "target_hit",
        "info",
        `Profit target of ${challenge.profitTargetPct}% reached. You are eligible for a payout.`,
        { currentProfit: Math.round(currentProfit * 100) / 100 },
        prefEnabled(prefs, "target_hit")
      )
      return updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, tradingDays)
    }

    // Min trading days gate
    if (tradingDays < minTradingDays) {
      await logEventIfAbsent(
        challenge.id,
        "min_days_not_met",
        "info",
        `Profit target reached but min trading days (${minTradingDays}) not met — ${tradingDays} traded.`,
        { tradingDays, minTradingDays },
        prefEnabled(prefs, "min_days_not_met")
      )
      return updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, tradingDays)
    }

    // Consistency rule gate
    const consistencyPct = Number(challenge.template.consistencyRulePct || 0)
    if (consistencyPct > 0 && currentProfit > 0) {
      let biggestDay = 0
      for (const acc of days.values()) biggestDay = Math.max(biggestDay, acc.pnl)
      const biggestPct = (biggestDay / currentProfit) * 100
      if (biggestPct > consistencyPct) {
        await updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, tradingDays)
        await markFailed(challenge.id, 'consistency', `Consistency rule violated: largest day was ${Math.round(biggestPct)}% of total profit (max ${consistencyPct}%).`, prefs)
        return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
      }
    }

    await logEventIfAbsent(
      challenge.id,
      "target_hit",
      "info",
      `Profit target of ${challenge.profitTargetPct}% reached. Prepare to pass the phase.`,
      { currentProfit: Math.round(currentProfit * 100) / 100 },
      prefEnabled(prefs, "target_hit")
    )
    await updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, tradingDays)
    await prisma.propChallenge.update({
      where: { id: challenge.id },
      data: { status: 'passed' }
    })
    return prisma.propChallenge.findUnique({ where: { id: challenge.id } })
  }

  // Update live values if no breach
  return updateLive(challenge.id, currentBalance, highestBalance, highestEquity, todayStartBalance, todayResetAt, tradingDays)
}

async function updateLive(
  challengeId: string,
  currentBalance: number,
  highestBalance: number,
  highestEquity: number,
  todayStartBalance: number,
  todayResetAt: Date,
  tradingDays: number
) {
  const challenge = await prisma.propChallenge.findUnique({
    where: { id: challengeId },
    select: { metadata: true },
  })
  const metadata = (challenge?.metadata as any) || {}
  return prisma.propChallenge.update({
    where: { id: challengeId },
    data: {
      currentBalance,
      currentEquity: currentBalance, // MVP approximation
      highestBalance,
      highestEquity,
      todayStartBalance,
      todayResetAt,
      metadata: { ...metadata, tradingDaysCount: tradingDays }
    }
  })
}

async function markFailed(challengeId: string, reason: string, message: string, prefs?: any) {
  await prisma.propChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'failed',
      breachReason: reason,
      breachedAt: new Date()
    }
  })
  await logEventIfAbsent(
    challengeId,
    "breached",
    "critical",
    message,
    { reason },
    prefEnabled(prefs, "breached")
  )
}

async function markBreached(challengeId: string, reason: string, prefs?: any) {
  await prisma.propChallenge.update({
    where: { id: challengeId },
    data: {
      status: 'breached',
      breachReason: reason,
      breachedAt: new Date()
    }
  })
  await logEventIfAbsent(
    challengeId,
    "breached",
    "critical",
    `Challenge breached: ${reason.replace('_', ' ')} limit hit.`,
    { reason },
    prefEnabled(prefs, "breached")
  )
}

async function writeDailySnapshots(challengeId: string, days: Map<string, DayAccum>, dailyDDPct: number) {
  // First, delete any existing snapshots that are not in the current evaluation
  // This handles cases where trades were deleted or filtered out.
  const evaluatedDates = Array.from(days.values()).map(acc => acc.date)
  
  if (evaluatedDates.length === 0) {
    await prisma.propChallengeDailySnapshot.deleteMany({
      where: { challengeId }
    })
  } else {
    await prisma.propChallengeDailySnapshot.deleteMany({
      where: {
        challengeId,
        date: { notIn: evaluatedDates }
      }
    })
  }

  for (const acc of days.values()) {
    const key = dayKey(acc.date, "UTC")
    const [y, m, d] = key.split("-").map(Number)
    const date = new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
    const dailyDdAllowed = acc.startBalance * (Number(dailyDDPct) / 100)
    const ddUsed = Math.max(0, acc.startBalance - acc.lowestEquity)
    const dailyDDUsedPct = dailyDdAllowed > 0 ? (ddUsed / dailyDdAllowed) * 100 : null

    await prisma.propChallengeDailySnapshot.upsert({
      where: { challengeId_date: { challengeId, date } },
      update: {
        startBalance: acc.startBalance,
        endBalance: acc.endBalance,
        lowestEquity: acc.lowestEquity,
        dailyPnl: acc.pnl,
        tradesCount: acc.count,
        dailyDDUsedPct,
      },
      create: {
        challengeId,
        date,
        startBalance: acc.startBalance,
        endBalance: acc.endBalance,
        lowestEquity: acc.lowestEquity,
        dailyPnl: acc.pnl,
        tradesCount: acc.count,
        dailyDDUsedPct,
      }
    })
  }
}
