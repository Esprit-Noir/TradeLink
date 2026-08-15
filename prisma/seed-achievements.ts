import "dotenv/config"
import * as dotenv from "dotenv"
import * as fs from "node:fs"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

for (const f of [".env.local", ".env"]) {
  if (fs.existsSync(f)) dotenv.config({ path: f })
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const ACHIEVEMENTS = [
  // ── Trading fundamentals ──
  { code: "first_trade", name: "First Trade", description: "Place your first closed trade.", icon: "🎯", category: "trading", target: 1 },
  { code: "first_profit", name: "First Profit", description: "Win your first trade.", icon: "💰", category: "trading", target: 1 },
  { code: "trades_25", name: "Getting Started", description: "Close 25 trades.", icon: "📈", category: "trading", target: 25 },
  { code: "trades_100", name: "Centurion", description: "Close 100 trades.", icon: "🏅", category: "trading", target: 100 },
  { code: "trades_500", name: "Veteran", description: "Close 500 trades.", icon: "🏆", category: "trading", target: 500 },
  { code: "big_r", name: "High R Multiple", description: "Win a trade worth 3R or more.", icon: "🚀", category: "trading", target: 1 },
  { code: "profit_factor_2", name: "Edge Found", description: "Reach a profit factor of 2.0+ (20 trades minimum).", icon: "⚖️", category: "trading", target: 2 },

  // ── Consistency ──
  { code: "streak_5", name: "On Fire", description: "Win 5 trades in a row.", icon: "🔥", category: "consistency", target: 5 },
  { code: "streak_10", name: "Unstoppable", description: "Win 10 trades in a row.", icon: "⚡", category: "consistency", target: 10 },
  { code: "green_week", name: "Green Week", description: "5+ green days in a rolling 7-day window.", icon: "✅", category: "consistency", target: 5 },

  // ── Prop firm ──
  { code: "prop_active", name: "Into the Arena", description: "Start a prop firm challenge.", icon: "🏁", category: "prop", target: 1 },
  { code: "prop_passed", name: "Challenge Completed", description: "Pass a prop firm challenge.", icon: "🎖️", category: "prop", target: 1 },
  { code: "payout_requested", name: "Paid Trader", description: "Request a payout on a funded account.", icon: "💸", category: "prop", target: 1 },

  // ── Journal & discipline ──
  { code: "journal_7", name: "Journaler", description: "Write 7 daily journal entries.", icon: "📔", category: "journal", target: 7 },
  { code: "journal_30", name: "Consistent Writer", description: "Write 30 daily journal entries.", icon: "📚", category: "journal", target: 30 },
  { code: "discipline_perfect", name: "Full Discipline", description: "Check every discipline box on a single day.", icon: "🧘", category: "journal", target: 1 },
]

async function main() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: { name: a.name, description: a.description, icon: a.icon, category: a.category, target: a.target },
      create: a,
    })
  }
  const count = await prisma.achievement.count()
  console.log(`Achievements seeded: ${count} total`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
