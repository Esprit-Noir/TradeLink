import { prisma } from "../src/lib/prisma";
import { computeMetrics } from "../src/lib/metrics";

async function run() {
  const account = await prisma.tradingAccount.findFirst({
    where: { type: "backtest" }
  });
  if (!account) return console.log("No backtest account");
  
  const trades = await prisma.trade.findMany({
    where: { accountId: account.id },
    orderBy: { entryAt: "desc" },
    take: 5000
  });
  
  const closed = trades.filter(t => t.status === "closed");
  console.log("Account:", account.id, "Trades:", trades.length, "Closed:", closed.length);
  
  const metrics = computeMetrics(closed, Number(account.initialBalance || 0), "UTC");
  console.log("Metrics:", metrics);
  
  const recentTrades = closed
      .filter(t => t.exitAt)
      .sort((a, b) => new Date(b.exitAt!).getTime() - new Date(a.exitAt!).getTime())
      .slice(0, 20)
      .map(t => ({
        id: t.id,
        entryAt: t.entryAt,
        exitAt: t.exitAt,
        netPnl: Number(t.netPnl || 0)
      }));
  console.log("Recent Trades:", recentTrades.length);
}

run().catch(console.error);
