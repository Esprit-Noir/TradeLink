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

  // FundingPips 2-Step
  await prisma.propFirmTemplate.create({
    data: {
      firmName: "FundingPips",
      programName: "Two-Step",
      drawdownType: "static_balance",
      dailyDDPct: 5.0,
      maxDDPct: 10.0,
      dailyResetTimezone: "Europe/London",
      profitTargetPhase1Pct: 8.0,
      profitTargetPhase2Pct: 5.0,
      minTradingDays: 0,
    }
  })

  // FundedNext Evaluation 2-Step
  await prisma.propFirmTemplate.create({
    data: {
      firmName: "FundedNext",
      programName: "Evaluation 2-Step",
      drawdownType: "static_balance",
      dailyDDPct: 5.0,
      maxDDPct: 10.0,
      dailyResetTimezone: "UTC",
      profitTargetPhase1Pct: 10.0,
      profitTargetPhase2Pct: 5.0,
      minTradingDays: 0,
    }
  })

  // FundedFast 2-Step
  await prisma.propFirmTemplate.create({
    data: {
      firmName: "FundedFast",
      programName: "Two-Step",
      drawdownType: "static_balance",
      dailyDDPct: 5.0,
      maxDDPct: 10.0,
      dailyResetTimezone: "UTC",
      profitTargetPhase1Pct: 10.0,
      profitTargetPhase2Pct: 5.0,
      minTradingDays: 0,
    }
  })

  // Goat Funded Trader 2-Step
  await prisma.propFirmTemplate.create({
    data: {
      firmName: "Goat Funded Trader",
      programName: "2-Step",
      drawdownType: "static_balance",
      dailyDDPct: 5.0,
      maxDDPct: 10.0,
      dailyResetTimezone: "UTC",
      profitTargetPhase1Pct: 8.0,
      profitTargetPhase2Pct: 5.0,
      minTradingDays: 0,
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
