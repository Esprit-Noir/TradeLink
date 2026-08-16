import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ids, action } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0 || !["delete", "open", "close"].includes(action)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }

    const where = { id: { in: ids }, userId: session.user.id }

    let count = 0

    if (action === "delete") {
      const result = await prisma.trade.deleteMany({ where })
      count = result.count
    } else {
      const result = await prisma.trade.updateMany({
        where,
        data: { status: action === "open" ? "open" : "closed" },
      })
      count = result.count
    }

    // Invalidate behavioral snapshot cache
    const accounts = await prisma.trade.findMany({
      where: { id: { in: ids }, userId: session.user.id },
      select: { accountId: true },
      distinct: ["accountId"],
    })
    await prisma.behavioralSnapshot.deleteMany({
      where: { accountId: { in: accounts.map(a => a.accountId) } },
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
