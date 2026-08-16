import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DEFAULT_WATCHLIST, sanitizeSymbol, symbolName } from "@/lib/market/symbols"

export interface WatchlistRow {
  id: string
  symbol: string
  name: string
}

const addSchema = z.object({ symbol: z.string().trim().min(2).max(24) })
const delSchema = z.object({ symbol: z.string().trim().min(2).max(24) })

async function rowsFor(userId: string): Promise<WatchlistRow[]> {
  const items = await prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  })
  return items.map((i) => ({ id: i.id, symbol: i.symbol, name: i.displayName ?? symbolName(i.symbol) }))
}

async function seedDefaults(userId: string): Promise<void> {
  const count = await prisma.watchlistItem.count({ where: { userId } })
  if (count > 0) return
  await prisma.watchlistItem.createMany({
    data: DEFAULT_WATCHLIST.map((symbol, idx) => ({
      userId,
      symbol,
      displayName: symbolName(symbol),
      sortOrder: idx,
    })),
  })
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    await seedDefaults(session.user.id)
    return NextResponse.json({ items: await rowsFor(session.user.id) })
  } catch (error) {
    const message = "Internal Server Error"
    console.error("Watchlist list error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = addSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Symbole invalide" }, { status: 400 })

    const symbol = sanitizeSymbol(parsed.data.symbol)
    if (!symbol) return NextResponse.json({ error: "Symbole invalide" }, { status: 400 })

    const count = await prisma.watchlistItem.count({ where: { userId: session.user.id } })
    if (count >= 50) {
      return NextResponse.json({ error: "Watchlist pleine (max 50 symboles)" }, { status: 400 })
    }

    await prisma.watchlistItem.upsert({
      where: { userId_symbol: { userId: session.user.id, symbol } },
      create: { userId: session.user.id, symbol, displayName: symbolName(symbol), sortOrder: count },
      update: {},
    })

    return NextResponse.json({ success: true, items: await rowsFor(session.user.id) })
  } catch (error) {
    const message = "Internal Server Error"
    console.error("Watchlist add error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const parsed = delSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams))
    if (!parsed.success) return NextResponse.json({ error: "Symbole invalide" }, { status: 400 })

    const symbol = parsed.data.symbol.trim().toUpperCase()
    await prisma.watchlistItem.deleteMany({ where: { userId: session.user.id, symbol } })

    return NextResponse.json({ success: true, items: await rowsFor(session.user.id) })
  } catch (error) {
    const message = "Internal Server Error"
    console.error("Watchlist delete error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}