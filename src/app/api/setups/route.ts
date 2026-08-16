import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSetupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const setups = await prisma.tradingSetup.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    const trades = await prisma.trade.findMany({
      where: { userId: session.user.id, status: "closed" },
      select: { netPnl: true, netPnlUsd: true, riskAmount: true, setupTags: true, entryAt: true },
      orderBy: { entryAt: "asc" },
    })

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

    const stats: Record<string, { count: number; wins: number; losses: number; pnl: number; pnlUsd: number; winPnl: number; lossPnl: number; rSum: number; rCount: number; best: number; worst: number; recentCount: number; lastTradeAt: string | null; series: number[] }> = {}

    const ensure = (name: string) => {
      const key = name.toLowerCase()
      if (!stats[key]) {
        stats[key] = {
          count: 0, wins: 0, losses: 0, pnl: 0, pnlUsd: 0, winPnl: 0, lossPnl: 0,
          rSum: 0, rCount: 0, best: -Infinity, worst: Infinity, recentCount: 0,
          lastTradeAt: null, series: [],
        }
      }
      return stats[key]
    }

    for (const t of trades) {
      if (!t.setupTags) continue
      const pnl = Number(t.netPnl || 0)
      const pnlUsd = Number(t.netPnlUsd ?? t.netPnl ?? 0)
      const isWin = pnl > 0
      const isLoss = pnl < 0

      for (const tag of t.setupTags) {
        const s = ensure(tag)
        s.count += 1
        if (isWin) s.wins += 1
        if (isLoss) s.losses += 1
        s.pnl += pnl
        s.pnlUsd += pnlUsd
        if (isWin) s.winPnl += pnl
        if (isLoss) s.lossPnl += Math.abs(pnl)
        if (Number(t.riskAmount) > 0) {
          s.rSum += pnl / Number(t.riskAmount)
          s.rCount += 1
        }
        if (pnl > s.best) s.best = pnl
        if (pnl < s.worst) s.worst = pnl
        if (t.entryAt >= thirtyDaysAgo) s.recentCount += 1
        const ts = t.entryAt.getTime()
        if (!s.lastTradeAt || ts > new Date(s.lastTradeAt).getTime()) s.lastTradeAt = t.entryAt.toISOString()
        s.series.push(pnl)
      }
    }

    const downsample = (arr: number[], max = 40) => {
      if (arr.length <= max) return arr
      const bucket = Math.ceil(arr.length / max)
      const out: number[] = []
      for (let i = 0; i < arr.length; i += bucket) {
        out.push(arr.slice(i, i + bucket).reduce((s, v) => s + v, 0))
      }
      return out
    }

    const enrichedSetups = setups.map((s) => {
      const st = stats[s.name.toLowerCase()] || { count: 0, wins: 0, losses: 0, pnl: 0, pnlUsd: 0, winPnl: 0, lossPnl: 0, rSum: 0, rCount: 0, best: 0, worst: 0, recentCount: 0, lastTradeAt: null, series: [] }

      let cum = 0
      const series = downsample(st.series).map(v => Math.round((cum += v) * 100) / 100)

      return {
        ...s,
        count: st.count,
        winRate: st.count > 0 ? (st.wins / st.count) * 100 : 0,
        netPnl: Math.round(st.pnl * 100) / 100,
        netPnlUsd: Math.round(st.pnlUsd * 100) / 100,
        losses: st.losses,
        profitFactor: st.lossPnl > 0 ? st.winPnl / st.lossPnl : st.winPnl > 0 ? 99 : 0,
        avgWin: st.wins > 0 ? st.winPnl / st.wins : 0,
        avgLoss: st.losses > 0 ? st.lossPnl / st.losses : 0,
        avgR: st.rCount > 0 ? st.rSum / st.rCount : 0,
        best: st.best === -Infinity ? 0 : st.best,
        worst: st.worst === Infinity ? 0 : st.worst,
        recentCount: st.recentCount,
        lastTradeAt: st.lastTradeAt,
        series,
      }
    })

    return NextResponse.json(enrichedSetups)
  } catch (error) {
    console.error("[SETUPS_GET]", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const parsed = createSetupSchema.safeParse(data)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { name, description } = parsed.data

    const newSetup = await prisma.tradingSetup.create({
      data: {
        userId: session.user.id,
        name,
        description,
        isDefault: false
      }
    })

    return NextResponse.json(newSetup)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "A setup with this name already exists" }, { status: 400 })
    }
    console.error("Error creating setup", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
