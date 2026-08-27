import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { YearHeatmap } from "@/components/journal/YearHeatmap"
import { dayKey } from "@/lib/dates"
import { getTranslations } from "next-intl/server"

export const metadata = {
  title: "Trading Journal",
}

export default async function JournalPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const t = await getTranslations("Journal")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { timezone: true }
  })
  
  const timezone = user?.timezone ?? "UTC"

  // Fetch all closed trades for this year
  const currentYear = new Date().getFullYear()
  const startDate = new Date(`${currentYear}-01-01T00:00:00Z`)
  
  const trades = await prisma.trade.findMany({
    where: { 
      userId: session.user.id, 
      status: "closed",
      exitAt: { gte: startDate }
    },
    select: {
      exitAt: true,
      netPnl: true,
    },
  })

  // Aggregate P&L
  const dailyPnl: Record<string, number> = {}
  for (const trade of trades) {
    if (!trade.exitAt) continue
    const dateStr = dayKey(new Date(trade.exitAt), timezone)
    if (!dailyPnl[dateStr]) dailyPnl[dateStr] = 0
    dailyPnl[dateStr] += Number(trade.netPnl)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Trading Journal</h1>
          <p className="page-subtitle">Track your daily performance and psychological state.</p>
        </div>
      </div>

      <div className="chart-card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          {currentYear} Performance Heatmap
        </h2>
        <YearHeatmap dailyPnl={dailyPnl} year={currentYear} />
      </div>
    </div>
  )
}
