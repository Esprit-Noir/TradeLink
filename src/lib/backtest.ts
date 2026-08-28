import { prisma } from "@/lib/prisma"

/**
 * Returns (creating it on first use) the dedicated "Backtest" account.
 * All simulated trades attach here so real stats stay clean — the account is
 * hidden from account lists (`broker: "backtest"` is filtered out) and trades
 * are excluded from stats via the `source` filter in the Prisma client.
 *
 * Uses a try/catch to handle race conditions when two concurrent requests
 * try to create the same account.
 */
export async function ensureBacktestAccount(userId: string) {
  const existing = await prisma.tradingAccount.findFirst({
    where: { userId, broker: "backtest" },
  })
  if (existing) return existing

  try {
    return await prisma.tradingAccount.create({
      data: {
        userId,
        name: "Backtest",
        broker: "backtest",
        type: "backtest",
        baseCurrency: "USD",
        initialBalance: 0,
      },
    })
  } catch (error) {
    // Handle race condition: if another request created the account
    // between our findFirst and create, the create will fail with
    // a unique constraint violation. In that case, we just find again.
    const retry = await prisma.tradingAccount.findFirst({
      where: { userId, broker: "backtest" },
    })
    if (retry) return retry
    throw error
  }
}
