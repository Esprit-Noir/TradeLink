import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch setups
  const setups = await prisma.tradingSetup.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  // Fetch all closed trades to compute setup stats
  const trades = await prisma.trade.findMany({
    where: { userId: session.user.id, status: "closed" },
    select: { netPnl: true, setupTags: true },
  })

  // Calculate stats per setup (case-insensitive)
  const stats: Record<string, { count: number; wins: number; pnl: number }> = {}
  
  for (const t of trades) {
    if (!t.setupTags) continue
    const pnl = Number(t.netPnl || 0)
    const isWin = pnl > 0

    for (const tag of t.setupTags) {
      const key = tag.toLowerCase()
      if (!stats[key]) stats[key] = { count: 0, wins: 0, pnl: 0 }
      stats[key].count += 1
      if (isWin) stats[key].wins += 1
      stats[key].pnl += pnl
    }
  }

  const enrichedSetups = setups.map((s) => {
    const sStats = stats[s.name.toLowerCase()] || { count: 0, wins: 0, pnl: 0 }
    return {
      ...s,
      count: sStats.count,
      winRate: sStats.count > 0 ? (sStats.wins / sStats.count) * 100 : 0,
      netPnl: sStats.pnl,
    }
  })

  return NextResponse.json(enrichedSetups)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { name, description } = data

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

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
