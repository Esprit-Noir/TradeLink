import { Suspense } from "react"
import { AdvancedStatsClient } from "@/components/stats/AdvancedStatsClient"
import { PropFirmStatsClient } from "@/components/stats/PropFirmStatsClient"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Advanced Statistics",
}

export default async function StatsPage() {
  const session = await auth()

  // Prop firm stats (only when authenticated)
  let propStats = null
  if (session?.user?.id) {
    const challenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id },
      include: {
        template: { select: { firmName: true } },
        payouts: { select: { status: true, amount: true } },
      },
    })

    const byFirm = new Map<string, { firmName: string; total: number; passed: number; failed: number; active: number; totalPaid: number }>()
    for (const c of challenges) {
      const firmName = c.template?.firmName || "Unknown"
      let f = byFirm.get(firmName)
      if (!f) {
        f = { firmName, total: 0, passed: 0, failed: 0, active: 0, totalPaid: 0 }
        byFirm.set(firmName, f)
      }
      f.total += 1
      if (c.status === 'passed') f.passed += 1
      else if (c.status === 'breached' || c.status === 'failed') f.failed += 1
      else f.active += 1
      const paid = c.payouts.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0)
      f.totalPaid += paid
    }

    const firms = [...byFirm.values()].sort((a, b) => b.total - a.total)
    const total = challenges.length
    const passed = challenges.filter(c => c.status === 'passed').length
    const failed = challenges.filter(c => c.status === 'breached' || c.status === 'failed').length
    const active = challenges.filter(c => c.status === 'active').length
    const totalPaid = challenges.reduce((s, c) => s + c.payouts.filter(p => p.status === 'paid').reduce((x, p) => x + Number(p.amount), 0), 0)
    const passRate = total > 0 ? (passed / total) * 100 : 0

    propStats = { firms, totals: { total, passed, failed, active, passRate, totalPaid } }
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Advanced Statistics</h1>
          <p className="page-subtitle">Deep dive into your trading performance metrics.</p>
        </div>
      </div>

      <Suspense fallback={null}>
        {propStats && <PropFirmStatsClient firms={propStats.firms} totals={propStats.totals} />}
      </Suspense>

      <AdvancedStatsClient />
    </div>
  )
}
