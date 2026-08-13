import { prisma } from "../src/lib/prisma"

async function main() {
  const accounts = await prisma.tradingAccount.findMany({
    include: { trades: { where: { netPnlUsd: null }, select: { id: true, netPnl: true } } },
  })

  let updated = 0
  for (const account of accounts) {
    if (account.trades.length === 0) continue
    const rate = Number(account.fxRateToUsd ?? 1)
    await prisma.$transaction(
      account.trades.map((t) =>
        prisma.trade.update({
          where: { id: t.id },
          data: { netPnlUsd: Math.round(Number(t.netPnl) * rate * 10000) / 10000 },
        })
      )
    )
    updated += account.trades.length
  }

  console.log(`Backfilled netPnlUsd for ${updated} trades across ${accounts.length} accounts.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
