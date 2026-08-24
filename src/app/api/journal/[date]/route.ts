import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const journalEntrySchema = z.object({
  mood: z.string().max(50).optional(),
  macroContext: z.string().max(5000).optional(),
  sessionPlan: z.string().max(5000).optional(),
  endOfDaySummary: z.string().max(5000).optional(),
  rating: z.union([z.string(), z.number()]).optional(),
  sleepHours: z.union([z.string(), z.number()]).optional(),
  disciplineChecks: z.any().optional(),
  nightReflection: z.string().max(5000).optional(),
})

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
    console.error("[JOURNAL_GET]", error instanceof Error ? error.message : "Unknown error")
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
    const parsed = journalEntrySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { mood, macroContext, sessionPlan, endOfDaySummary, rating, sleepHours, disciplineChecks, nightReflection } = parsed.data

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
        sleepHours: sleepHours !== undefined ? Number(sleepHours) : null,
        disciplineChecks: disciplineChecks !== undefined ? disciplineChecks : undefined,
        nightReflection: nightReflection !== undefined ? nightReflection : undefined,
      },
      create: {
        userId: session.user.id,
        date,
        mood,
        macroContext,
        sessionPlan,
        endOfDaySummary,
        rating: rating !== undefined ? Number(rating) : null,
        sleepHours: sleepHours !== undefined ? Number(sleepHours) : null,
        disciplineChecks: disciplineChecks !== undefined ? disciplineChecks : undefined,
        nightReflection: nightReflection !== undefined ? nightReflection : undefined,
      },
    })

    const unlocks = await import("@/lib/achievements.service")
      .then(m => m.evaluateAchievements(session.user?.id || ""))
      .catch(e => { console.error(e); return [] })

    return NextResponse.json({ journal, unlocks })
  } catch (error) {
    console.error("[JOURNAL_POST]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Error" }, { status: 500 })
  }
}
