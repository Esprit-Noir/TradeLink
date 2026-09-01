import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/formatters"
import { BadgeCheck, Target, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const shareLink = await prisma.shareLink.findUnique({
    where: { id },
  })

  if (!shareLink || !shareLink.isPublic) {
    return { title: "TradeLink - Shared Result Not Found" }
  }

  // The opengraph-image.tsx route handles the dynamic image generation
  return {
    title: "TradeLink — Shared Performance",
    description: "View this verified trading performance on TradeLink.",
    openGraph: {
      title: "TradeLink Verified Performance",
      description: "View this verified trading performance on TradeLink.",
    },
    twitter: {
      card: "summary_large_image",
      title: "TradeLink Verified Performance",
      description: "View this verified trading performance on TradeLink.",
    }
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const shareLink = await prisma.shareLink.findUnique({
    where: { id },
    include: { user: true }
  })

  if (!shareLink || !shareLink.isPublic) {
    notFound()
  }

  // Update view count silently
  await prisma.shareLink.update({
    where: { id },
    data: { views: { increment: 1 } }
  }).catch(() => {})

  let content = null

  if (shareLink.entityType === "challenge") {
    const challenge = await prisma.propChallenge.findUnique({
      where: { id: shareLink.entityId },
      include: { template: true }
    })
    
    if (!challenge) notFound()

    const isPassed = challenge.status === 'passed'
    const isFailed = challenge.status === 'breached' || challenge.status === 'failed'

    content = (
      <div className="max-w-4xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold relative z-10 ${
              isPassed ? 'bg-green-500/20' : isFailed ? 'bg-red-500/20' : 'bg-yellow-500/20'
            }`} style={{ boxShadow: isPassed ? "0 0 60px rgba(0,199,88,0.3)" : isFailed ? "0 0 60px rgba(239,68,68,0.3)" : "0 0 60px rgba(245,158,11,0.3)" }}>
              {isPassed ? <BadgeCheck size={48} className="text-green-400" /> : isFailed ? <AlertTriangle size={48} className="text-red-400" /> : <TrendingUp size={48} className="text-yellow-400" />}
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
            {shareLink.user.name || "A trader"}&apos;s Challenge
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isPassed ? 'bg-green-500' : isFailed ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`} />
            <span className="text-sm">{challenge.template.firmName} — {challenge.template.programName}</span>
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl p-5 text-center border border-gray-800/50"
               style={{ background: "rgba(15,17,23,0.9)" }}>
            <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-[0.15em]">Status</div>
            <span className={`inline-flex items-center px-4 py-1.5 text-sm font-bold rounded-full ${
              isPassed ? 'bg-green-500/20 text-green-400' :
              isFailed ? 'bg-red-500/20 text-red-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {challenge.status.toUpperCase()}
            </span>
          </div>
          <div className="rounded-xl p-5 text-center border border-gray-800/50"
               style={{ background: "rgba(15,17,23,0.9)" }}>
            <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-[0.15em]">Account Size</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(Number(challenge.initialBalance), "USD")}</div>
          </div>
          <div className="rounded-xl p-5 text-center border border-gray-800/50"
               style={{ background: "rgba(15,17,23,0.9)" }}>
            <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-[0.15em]">Current Balance</div>
            <div className={`text-2xl font-bold ${Number(challenge.currentBalance) > Number(challenge.initialBalance) ? 'text-green-400' : 'text-white'}`}>
              {formatCurrency(Number(challenge.currentBalance), "USD")}
            </div>
          </div>
          <div className="rounded-xl p-5 text-center border border-gray-800/50"
               style={{ background: "rgba(15,17,23,0.9)" }}>
            <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-[0.15em]">Phase</div>
            <div className="text-2xl font-bold text-white capitalize">{challenge.phase.replace("_", " ")}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-gray-800/50 p-6 mb-6"
             style={{ background: "linear-gradient(135deg, rgba(15,17,23,0.95), rgba(10,15,12,0.95))" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-white">Profit Progress</div>
            <div className="text-sm text-gray-400">
              {formatCurrency(Number(challenge.currentBalance) - Number(challenge.initialBalance), "USD", true)}
            </div>
          </div>
          <div className="h-4 rounded-full bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
                 style={{
                   width: `${Math.min(100, Math.max(0, ((Number(challenge.currentBalance) - Number(challenge.initialBalance)) / Number(challenge.initialBalance)) * 100 + 50))}%`,
                   background: isPassed ? "linear-gradient(90deg, #00c758, #059669)" : isFailed ? "linear-gradient(90deg, #ef4444, #b91c1c)" : "linear-gradient(90deg, #f59e0b, #d97706)",
                   boxShadow: isPassed ? "0 0 20px rgba(0,199,88,0.4)" : "0 0 20px rgba(245,158,11,0.4)",
                 }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
              <BadgeCheck size={12} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Verified by TradeLink</span>
          </div>
          <div className="text-xs text-gray-600">{new Date(challenge.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </div>
    )
  } else if (shareLink.entityType === "profile") {
    const user = shareLink.user
    const userId = shareLink.entityId

    const trades = await prisma.trade.findMany({
      where: { userId, status: "closed" },
      select: { netPnl: true, entryAt: true, side: true, symbol: true },
      orderBy: { entryAt: "asc" },
    })

    if (trades.length === 0) notFound()

    let grossProfit = 0, grossLoss = 0, wins = 0, totalPnl = 0
    let peak = 0, maxDD = 0, longestWin = 0, currentWin = 0, longestLoss = 0, currentLoss = 0
    const monthPnl: Record<string, number> = {}
    const dayPnl: { date: string; pnl: number }[] = []

    for (const t of trades) {
      const pnl = Number(t.netPnl)
      totalPnl += pnl
      if (pnl > 0) { grossProfit += pnl; wins++; currentWin++; currentLoss = 0; if (currentWin > longestWin) longestWin = currentWin }
      else if (pnl < 0) { grossLoss += Math.abs(pnl); currentLoss++; currentWin = 0; if (currentLoss > longestLoss) longestLoss = currentLoss }
      if (totalPnl > peak) peak = totalPnl
      const dd = peak - totalPnl
      if (dd > maxDD) maxDD = dd
      const mk = new Date(t.entryAt).toLocaleString("en-CA", { year: "numeric", month: "2-digit" })
      monthPnl[mk] = (monthPnl[mk] || 0) + pnl
      const dk = new Date(t.entryAt).toISOString().split("T")[0]
      const existing = dayPnl.find(d => d.date === dk)
      if (existing) existing.pnl += pnl
      else dayPnl.push({ date: dk, pnl })
    }

    const totalTrades = trades.length
    const losses = totalTrades - wins
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0
    const avgWin = wins > 0 ? grossProfit / wins : 0
    const avgLoss = losses > 0 ? grossLoss / losses : 0
    const expectancy = totalTrades > 0 ? (totalPnl / totalTrades) : 0

    const months = Object.entries(monthPnl).sort((a, b) => a[0].localeCompare(b[0]))
    const greenDays = dayPnl.filter(d => d.pnl > 0).length
    const redDays = dayPnl.filter(d => d.pnl < 0).length
    const totalDays = dayPnl.length
    const bestDay = dayPnl.length ? dayPnl.reduce((a, b) => a.pnl > b.pnl ? a : b) : null
    const worstDay = dayPnl.length ? dayPnl.reduce((a, b) => a.pnl < b.pnl ? a : b) : null

    const initials = (user.name || "T").split(/\s+/).map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase()

    content = (
      <div className="max-w-4xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold relative z-10"
                 style={{ background: "linear-gradient(135deg, #00c758, #059669)", color: "#fff", boxShadow: "0 0 60px rgba(0,199,88,0.3)" }}>
              {initials}
            </div>
            <div className="absolute -inset-1 rounded-full opacity-40 blur-lg"
                 style={{ background: "linear-gradient(135deg, #00c758, #7c3aed)" }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
            {user.name || "Anonymous Trader"}
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm">Verified performance on TradeLink</span>
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total P&L", value: `${totalPnl >= 0 ? "+" : ""}${formatCurrency(totalPnl, "USD", true)}`, color: totalPnl >= 0 ? "#00c758" : "#ef4444", glow: totalPnl >= 0 ? "rgba(0,199,88,0.15)" : "rgba(239,68,68,0.15)" },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%`, color: winRate >= 50 ? "#00c758" : "#f59e0b", glow: "rgba(0,199,88,0.1)" },
            { label: "Profit Factor", value: profitFactor === 99 ? "∞" : profitFactor.toFixed(2), color: profitFactor >= 2 ? "#00c758" : "#f59e0b", glow: "rgba(0,199,88,0.1)" },
            { label: "Total Trades", value: totalTrades.toLocaleString(), color: "#fff", glow: "transparent" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-xl p-5 text-center border border-gray-800/50"
                 style={{ background: `linear-gradient(135deg, rgba(15,17,23,0.9), rgba(15,17,23,0.7))`, boxShadow: `0 0 40px ${kpi.glow}` }}>
              <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-[0.15em]">{kpi.label}</div>
              <div className="text-2xl md:text-3xl font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Avg Win", value: formatCurrency(avgWin, "USD", true), color: "#00c758" },
            { label: "Avg Loss", value: formatCurrency(avgLoss, "USD", true), color: "#ef4444" },
            { label: "Max DD", value: `-${(maxDD / (peak || 1) * 100).toFixed(1)}%`, color: "#ef4444" },
            { label: "Best Streak", value: `${longestWin}W`, color: "#00c758" },
            { label: "Worst Streak", value: `${longestLoss}L`, color: "#ef4444" },
            { label: "Expectancy", value: `${expectancy >= 0 ? "+" : ""}${formatCurrency(expectancy, "USD", true)}`, color: expectancy >= 0 ? "#00c758" : "#ef4444" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-lg px-3 py-3 text-center border border-gray-800/30"
                 style={{ background: "rgba(15,17,23,0.6)" }}>
              <div className="text-[9px] text-gray-600 mb-1 font-medium uppercase tracking-wider">{kpi.label}</div>
              <div className="text-sm font-bold" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Monthly Chart */}
        <div className="rounded-2xl border border-gray-800/50 p-6 mb-6"
             style={{ background: "linear-gradient(135deg, rgba(15,17,23,0.95), rgba(10,15,12,0.95))" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-sm font-semibold text-white">Monthly Performance</div>
              <div className="text-xs text-gray-500 mt-0.5">{months.length} months tracked</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Profit</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Loss</span>
            </div>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {months.map(([month, pnl]) => {
              const maxAbs = Math.max(...months.map(([, p]) => Math.abs(p)), 1)
              const h = Math.max(4, (Math.abs(pnl) / maxAbs) * 100)
              const isPositive = pnl >= 0
              return (
                <div key={month} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="absolute -top-8 hidden group-hover:block z-20 px-2 py-1 rounded bg-gray-800 text-[10px] text-white font-medium whitespace-nowrap shadow-lg">
                    {month}: {formatCurrency(pnl, "USD", true)}
                  </div>
                  <div className="w-full rounded-t-sm transition-all duration-200 group-hover:opacity-100 opacity-80"
                       style={{
                         height: h,
                         background: isPositive
                           ? "linear-gradient(180deg, #00c758, #059669)"
                           : "linear-gradient(180deg, #ef4444, #b91c1c)",
                         boxShadow: isPositive ? "0 0 12px rgba(0,199,88,0.3)" : "0 0 12px rgba(239,68,68,0.3)",
                       }} />
                </div>
              )
            })}
          </div>
          <div className="flex gap-1.5 mt-2">
            {months.map(([month]) => (
              <div key={month} className="flex-1 text-center text-[9px] text-gray-600 truncate font-medium">{month.slice(5)}</div>
            ))}
          </div>
        </div>

        {/* Win/Loss + Sessions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-gray-800/50 p-5"
               style={{ background: "rgba(15,17,23,0.7)" }}>
            <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Win / Loss</div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-green-400 font-medium">Wins</span>
                  <span className="text-xs text-green-400 font-bold">{wins}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${winRate}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-red-400 font-medium">Losses</span>
                  <span className="text-xs text-red-400 font-bold">{losses}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div className="h-full rounded-full bg-red-500" style={{ width: `${100 - winRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-800/50 p-5"
               style={{ background: "rgba(15,17,23,0.7)" }}>
            <div className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Best / Worst</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Best day</span>
                <span className="text-sm font-bold text-green-400">
                  {bestDay ? `+${formatCurrency(bestDay.pnl, "USD", true)}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Worst day</span>
                <span className="text-sm font-bold text-red-400">
                  {worstDay ? formatCurrency(worstDay.pnl, "USD", true) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Green days</span>
                <span className="text-sm font-bold text-green-400">{greenDays} <span className="text-gray-600 font-normal">/ {totalDays}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-800/50">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
              <BadgeCheck size={12} className="text-green-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Verified by TradeLink</span>
          </div>
          <div className="text-xs text-gray-600">{new Date(shareLink.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
        </div>
      </div>
    )
  } else {
    content = <div className="text-gray-400">Content type not supported yet.</div>
  }

  return (
    <div className="min-h-screen text-white selection:bg-[var(--color-brand-500)] selection:text-black relative"
         style={{ background: "linear-gradient(180deg, #000000 0%, #0a0f0c 30%, #050a07 70%, #000000 100%)" }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-10"
             style={{ background: "radial-gradient(ellipse, #00c758, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] opacity-5"
             style={{ background: "radial-gradient(ellipse, #7c3aed, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800/50"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(16px)" }}>
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-dark.png" alt="TradeLink" className="h-5" width={1024} height={341} style={{ width: "auto" }} />
          </div>
          <Link href="/" className="text-xs font-medium hover:text-white text-gray-500 transition-colors flex items-center gap-1">
            Create your own <span className="text-[var(--color-brand-500)]">&rarr;</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16 md:py-24 flex justify-center relative z-10">
        {content}
      </main>
    </div>
  )
}
