import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AccountsManager } from "@/components/accounts/AccountsManager"
import { headers } from "next/headers"

export const metadata = {
  title: "Accounts | TradeLink",
}

export default async function AccountsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Fetch accounts by calling our API internally or just duplicating the Prisma query
  // Since we are in a server component, it's more efficient to just query Prisma directly
  const dbAccounts = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    include: {
      trades: { select: { id: true, status: true, netPnl: true, netPnlUsd: true } },
      propChallenge: {
        include: { template: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const accounts = dbAccounts.map(acc => {
    const closedTrades = acc.trades.filter(t => t.status === 'closed')
    const totalPnl = closedTrades.reduce((sum, t) => sum + Number(t.netPnl || 0), 0)
    const totalPnlUsd = closedTrades.reduce((sum, t) => sum + Number(t.netPnlUsd ?? (t.netPnl || 0)), 0)
    
    return {
      id: acc.id,
      name: acc.name,
      broker: acc.broker,
      type: acc.propChallenge ? 'prop_firm' : (acc.type || 'personal'),
      baseCurrency: acc.baseCurrency,
      fxRateToUsd: acc.fxRateToUsd ? Number(acc.fxRateToUsd) : 1,
      initialBalance: acc.initialBalance ? Number(acc.initialBalance) : 0,
      isDefault: acc.isDefault,
      createdAt: acc.createdAt,
      propChallenge: acc.propChallenge ? {
        status: acc.propChallenge.status,
        phase: acc.propChallenge.phase,
        currentEquity: acc.propChallenge.currentEquity ? Number(acc.propChallenge.currentEquity) : 0,
        firmName: acc.propChallenge.template.firmName,
        programName: acc.propChallenge.template.programName,
        logoUrl: acc.propChallenge.template.logoUrl || null,
      } : null,
      stats: {
        tradesCount: acc.trades.length,
        totalPnl,
        totalPnlUsd,
      }
    }
  })

  return (
    <div>
      <Suspense fallback={<div className="skeleton" style={{ height: "400px" }} />}>
        <AccountsManager accounts={accounts} />
      </Suspense>
    </div>
  )
}
