import { prisma } from "@/lib/prisma"

/**
 * Returns (creating it on first use) the dedicated "Backtest" account.
 * All simulated trades attach here so real stats stay clean — the account is
 * hidden from account lists (`broker: "backtest"` is filtered out) and trades
 * are excluded from stats via the `source` filter in the Prisma client.
 */
export async function ensureBacktestAccount(userId: string) {
  const existing = await prisma.tradingAccount.findFirst({
    where: { userId, broker: "backtest" },
  })
  if (existing) return existing
  return prisma.tradingAccount.create({
    data: {
      userId,
      name: "Backtest",
      broker: "backtest",
      type: "backtest",
      baseCurrency: "USD",
      initialBalance: 0,
    },
  })
}
