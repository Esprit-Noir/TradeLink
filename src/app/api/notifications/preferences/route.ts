import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const prefs = (user?.notificationPrefs as any) || {}
    return NextResponse.json({
      eventTypes: { ...DEFAULT_EVENT_TYPES, ...(prefs.eventTypes || {}) },
      defaults: { ...DEFAULT_PREFS.defaults, ...(prefs.defaults || {}) },
    })
  } catch (error: any) {
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
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true },
    })
    const prev = (existing?.notificationPrefs as any) || {}

    const merged = {
      eventTypes: { ...DEFAULT_EVENT_TYPES, ...(prev.eventTypes || {}), ...(body.eventTypes || {}) },
      defaults: { ...DEFAULT_PREFS.defaults, ...(prev.defaults || {}), ...(body.defaults || {}) },
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { notificationPrefs: merged },
    })

    return NextResponse.json(merged)
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
