import { prisma } from "../src/lib/prisma"

async function main() {
  console.log("Starting seed...")

  // Find the first user
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log("No user found. Please register an account first.")
    return
  }

  // Find or create a trading account for this user
  let account = await prisma.tradingAccount.findFirst({
    where: { userId: user.id }
  })
  if (!account) {
    account = await prisma.tradingAccount.create({
      data: {
        userId: user.id,
        name: "Mock Account",
        isDefault: true,
        initialBalance: 10000,
      }
    })
  }

  // Clear existing trades for this account
  await prisma.trade.deleteMany({
    where: { accountId: account.id }
  })

  const trades = []
  const symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "EUR/USD", "AAPL"]
  const setups = ["Breakout", "Pullback", "Reversal", "Trend Following", "News"]
  const sessions = ["london", "ny_open", "asia"]
  
  let currentEquity = 10000
  const now = new Date()

  // Generate 50 mock trades over the last 60 days
  for (let i = 0; i < 50; i++) {
    const isWin = Math.random() > 0.45 // 55% win rate
    
    // Risk amount 1% of equity ~ $100
    const risk = currentEquity * 0.01 
    
    // Win is roughly 1.5x to 2.5x risk, loss is 0.8x to 1.2x risk
    const pnl = isWin 
      ? risk * (1.5 + Math.random()) 
      : -risk * (0.8 + (Math.random() * 0.4))
      
    currentEquity += pnl

    const daysAgo = Math.floor(Math.random() * 60)
    const entryDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000))
    // Random hour between 8 and 18
    entryDate.setHours(8 + Math.floor(Math.random() * 10))
    
    const exitDate = new Date(entryDate.getTime() + (Math.random() * 4 * 60 * 60 * 1000)) // 0-4 hours later

    const isLong = Math.random() > 0.5
    const entryPrice = 100 + (Math.random() * 1000)
    const exitPrice = isLong 
      ? entryPrice * (1 + (pnl / 10000)) 
      : entryPrice * (1 - (pnl / 10000))

    trades.push({
      userId: user.id,
      accountId: account.id,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      instrumentType: "CRYPTO",
      side: isLong ? "LONG" : "SHORT",
      quantity: 1.5,
      entryPrice,
      exitPrice,
      entryAt: entryDate,
      exitAt: exitDate,
      netPnl: pnl,
      fees: Math.random() * 5,
      status: "closed",
      setupTags: [setups[Math.floor(Math.random() * setups.length)]],
      session: sessions[Math.floor(Math.random() * sessions.length)],
      riskAmount: risk,
      isRevengeTrade: Math.random() > 0.85,
      isOvertrading: Math.random() > 0.9,
    })
  }

  // Insert all trades
  await prisma.trade.createMany({
    data: trades
  })

  console.log(`Successfully seeded ${trades.length} mock trades for user ${user.email}.`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
