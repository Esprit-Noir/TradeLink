import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const trades = await prisma.trade.findMany({ where: { source: 'backtest' } });
  console.log("Total backtest trades:", trades.length);
  if (trades.length > 0) {
    console.log("Sample trade:", JSON.stringify(trades[0], null, 2));
  }
}

run().catch(console.error).finally(() => { prisma.$disconnect(); pool.end(); });
