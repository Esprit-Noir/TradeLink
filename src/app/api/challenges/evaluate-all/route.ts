import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { evaluateChallenge } from "@/lib/prop-firm.service"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const active = await prisma.propChallenge.findMany({
      where: { userId: session.user.id, status: 'active' },
      select: { id: true }
    })

    const results: any[] = []
    for (const c of active) {
      try {
        const updated = await evaluateChallenge(c.id)
        results.push({ id: c.id, status: updated?.status ?? 'unknown' })
      } catch (err) {
        console.error(`evaluate-all error for ${c.id}:`, err)
      }
    }

    return NextResponse.json({ evaluated: results.length, results })
  } catch (error) {
    console.error("Error evaluating challenges:", error)
    return NextResponse.json({ error: "Failed to evaluate challenges" }, { status: 500 })
  }
}
