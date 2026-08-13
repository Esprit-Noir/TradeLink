import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date } = await params
    
    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    const journal = await prisma.dailyJournal.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
    })

    return NextResponse.json({ journal })
  } catch (error) {
    console.error("[JOURNAL_GET]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { date } = await params
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 })
    }

    const body = await req.json()
    const { mood, macroContext, sessionPlan, endOfDaySummary, rating } = body

    const journal = await prisma.dailyJournal.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date,
        },
      },
      update: {
        mood,
        macroContext,
        sessionPlan,
        endOfDaySummary,
        rating: rating !== undefined ? Number(rating) : null,
      },
      create: {
        userId: session.user.id,
        date,
        mood,
        macroContext,
        sessionPlan,
        endOfDaySummary,
        rating: rating !== undefined ? Number(rating) : null,
      },
    })

    return NextResponse.json({ journal })
  } catch (error) {
    console.error("[JOURNAL_POST]", error)
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
