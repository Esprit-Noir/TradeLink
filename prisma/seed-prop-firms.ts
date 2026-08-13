import { prisma } from "../src/lib/prisma"

async function main() {
  console.log("Seeding Prop Firm Templates...")

  // FTMO Normal Phase 1
  await prisma.propFirmTemplate.create({
    data: {
      firmName: "FTMO",
      programName: "Normal",
      drawdownType: "trailing_equity", // They used to do balance, now equity for highest point
      dailyDDPct: 5.0,
      maxDDPct: 10.0,
      dailyResetTimezone: "Europe/Prague",
      profitTargetPhase1Pct: 10.0,
      profitTargetPhase2Pct: 5.0,
      minTradingDays: 4,
    }
  })

  // Topstep 50k Combine
  await prisma.propFirmTemplate.create({
    data: {
      firmName: "Topstep",
      programName: "50k Combine",
      drawdownType: "trailing_balance", // End of day drawdown
      dailyDDPct: 2.0, // DLL of 1k on 50k
      maxDDPct: 4.0, // MLL of 2k on 50k
      dailyResetTimezone: "America/Chicago",
      profitTargetPhase1Pct: 6.0,
      minTradingDays: 2,
    }
  })

  console.log("Prop Firm templates seeded.")
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
