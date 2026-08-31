import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

interface NotificationPrefs {
  eventTypes?: Record<string, boolean>
  defaults?: {
    stopTradingPct?: number
    profitGoalPct?: number
  }
}

const notificationPrefsSchema = z.object({
  eventTypes: z.record(z.string(), z.boolean()).optional(),
  defaults: z.object({
    stopTradingPct: z.number().min(0).max(100).optional(),
    profitGoalPct: z.number().min(0).max(100).optional(),
  }).optional(),
})

const DEFAULT_EVENT_TYPES: Record<string, boolean> = {
  breached: true,
  target_hit: true,
  alert_80pct: true,
  alert_90pct: true,
  min_days_not_met: false,
  stop_trading: true,
  goal_reached: true,
  deadline_5d: true,
  deadline_1d: true,
}

const DEFAULT_PREFS = {
  eventTypes: DEFAULT_EVENT_TYPES,
  defaults: { stopTradingPct: 85, profitGoalPct: 50 },
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true },
    })

    const prefs = (user?.notificationPrefs as unknown as NotificationPrefs | null) || {}
    return NextResponse.json({
      eventTypes: { ...DEFAULT_EVENT_TYPES, ...(prefs.eventTypes || {}) },
      defaults: { ...DEFAULT_PREFS.defaults, ...(prefs.defaults || {}) },
    })
  } catch (error) {
    console.error("Error fetching notification preferences:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = notificationPrefsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true },
    })
    const prev = (existing?.notificationPrefs as unknown as NotificationPrefs | null) || {}

    const merged = {
      eventTypes: { ...DEFAULT_EVENT_TYPES, ...(prev.eventTypes || {}), ...(parsed.data.eventTypes || {}) },
      defaults: { ...DEFAULT_PREFS.defaults, ...(prev.defaults || {}), ...(parsed.data.defaults || {}) },
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationPrefs: merged },
    })

    return NextResponse.json(merged)
  } catch (error) {
    console.error("Error updating notification preferences:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
