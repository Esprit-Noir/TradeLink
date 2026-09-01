import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const PLAYBOOKS = [
  {
    name: "Breakout Long",
    description: "Buy when price breaks above a key resistance level with strong volume confirmation.",
    tags: ["breakout", "long", "trend"],
    entryRules: {
      condition: "price > daily_high_20d AND volume > avg_volume_20d * 1.5",
      timeframe: "15m or 1h",
      confirmation: "close above resistance + volume spike",
    },
    exitRules: {
      takeProfit: "2R",
      stopLoss: "below breakout candle low",
      trailingStop: "move to breakeven at 1R",
    },
    riskRules: {
      maxRisk: "1% per trade",
      maxDailyLoss: "3%",
      maxConcurrentTrades: 2,
    },
  },
  {
    name: "EMA Pullback Trend",
    description: "Enter on pullback to EMA 20 in an established uptrend.",
    tags: ["trend", "pullback", "swing"],
    entryRules: {
      condition: "price > EMA200 AND price touches EMA20 AND RSI > 40",
      timeframe: "1h or 4h",
      confirmation: "bullish engulfing or pin bar at EMA20",
    },
    exitRules: {
      takeProfit: "prev swing high or 3R",
      stopLoss: "below EMA20 by 5 pips",
    },
    riskRules: {
      maxRisk: "1.5% per trade",
      maxDailyLoss: "4%",
    },
  },
  {
    name: "London Open Scalp",
    description: "Quick scalp at London session open using range breakout.",
    tags: ["scalping", "session", "breakout"],
    entryRules: {
      condition: "price breaks Asia range high/low during first 30min of London",
      timeframe: "5m",
      confirmation: "15m candle close outside range + momentum",
      session: "London open (8:00-9:00 GMT)",
    },
    exitRules: {
      takeProfit: "1.5x Asia range",
      stopLoss: "opposite side of Asia range",
      maxDuration: "60 minutes",
    },
    riskRules: {
      maxRisk: "0.5% per trade",
      maxDailyLoss: "2%",
      maxTradesPerSession: 3,
    },
  },
  {
    name: "Reversal Divergence",
    description: "Counter-trend play on RSI divergence at key support/resistance zones.",
    tags: ["reversal", "divergence", "counter-trend"],
    entryRules: {
      condition: "price at major support/resistance AND RSI bearish/bullish divergence",
      timeframe: "1h",
      confirmation: "double bottom/top or head & shoulders pattern",
    },
    exitRules: {
      takeProfit: "mid-range or 2R",
      stopLoss: "beyond the swing high/low by 10 pips",
    },
    riskRules: {
      maxRisk: "1% per trade",
      maxDailyLoss: "3%",
      note: "Only take with confluence of 2+ factors",
    },
  },
  {
    name: "Gold Breakout",
    description: "Specialized breakout strategy for XAUUSD during high-impact news.",
    tags: ["breakout", "gold", "xauusd"],
    entryRules: {
      condition: "XAUUSD breaks key level during NFP or CPI release",
      timeframe: "15m",
      confirmation: "volume surge + strong candle body",
      filters: "avoid if spread > 30 pips",
    },
    exitRules: {
      takeProfit: "3R or next major level",
      stopLoss: "below breakout candle",
      trailingStop: "20 pips after 2R",
    },
    riskRules: {
      maxRisk: "0.75% per trade",
      maxDailyLoss: "2.5%",
      note: "Only trade during London or NY overlap",
    },
  },
]

async function main() {
  const userId = process.argv[2]
  if (!userId) {
    console.log("Usage: npx tsx scripts/seed-playbooks.ts <userId>")
    process.exit(1)
  }

  for (const data of PLAYBOOKS) {
    const existing = await prisma.playbook.findFirst({
      where: { userId, name: data.name },
    })
    if (existing) {
      console.log(`Skip (exists): ${data.name}`)
      continue
    }
    await prisma.playbook.create({ data: { userId, ...data } })
    console.log(`Created: ${data.name}`)
  }

  console.log("Done!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
