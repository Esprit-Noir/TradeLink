import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one trade ID required").max(100, "Too many trades"),
  action: z.enum(["delete", "open", "close"]),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bulkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { ids, action } = parsed.data
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
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
