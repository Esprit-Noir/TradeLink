import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function run() {
  const accounts = await prisma.tradingAccount.findMany({ include: { trades: { select: { id: true, source: true } } } });
  accounts.forEach(a => {
    console.log(`Account ${a.id}: type=${a.type}, default=${a.isDefault}, total_trades=${a.trades.length}`);
  });
}
run().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
