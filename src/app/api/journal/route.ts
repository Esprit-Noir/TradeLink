import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // Optional YYYY-MM
    
    const whereClause: any = { userId: session.user.id }
    if (month) {
      whereClause.date = { startsWith: month }
    }

    const journals = await prisma.dailyJournal.findMany({
      where: whereClause,
      select: { date: true },
    })

    const dates = journals.map(j => j.date)

    return NextResponse.json({ dates })
  } catch (error) {
    console.error("[JOURNAL_LIST_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
