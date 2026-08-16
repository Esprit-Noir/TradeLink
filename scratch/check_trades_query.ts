import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const user = await prisma.user.findFirst();
  const session = { user: { id: user.id } };

  // simulate Trades page without any params
  const whereClause: any = { userId: session.user.id };
  
  const trades = await prisma.trade.findMany({
    where: whereClause,
    orderBy: { entryAt: "desc" },
  });
  
  const backtestTrades = trades.filter(t => t.source === "backtest");
  console.log("Total backtest trades in Trades page query:", backtestTrades.length);

  // simulate AccountDetail page
  const backtestAccount = await prisma.tradingAccount.findFirst({ where: { type: "backtest" } });
  if (backtestAccount) {
    const detailTrades = await prisma.trade.findMany({
      where: { accountId: backtestAccount.id },
      orderBy: { entryAt: "desc" },
      take: 5000,
    });
    console.log("Total backtest trades in AccountDetail query:", detailTrades.length);
  }
}

run().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
