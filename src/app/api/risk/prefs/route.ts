import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_RISK_PREFS = {
  dailyLossLimit: null as number | null, // $
  maxTradesPerDay: null as number | null,
  maxConsecutiveLosses: null as number | null,
  maxRiskPerTradePct: 1 as number, // % of balance
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { riskPrefs: true },
    })
    const prefs = (user?.riskPrefs as any) || {}
    return NextResponse.json({
      dailyLossLimit: prefs.dailyLossLimit ?? DEFAULT_RISK_PREFS.dailyLossLimit,
      maxTradesPerDay: prefs.maxTradesPerDay ?? DEFAULT_RISK_PREFS.maxTradesPerDay,
      maxConsecutiveLosses: prefs.maxConsecutiveLosses ?? DEFAULT_RISK_PREFS.maxConsecutiveLosses,
      maxRiskPerTradePct: prefs.maxRiskPerTradePct ?? DEFAULT_RISK_PREFS.maxRiskPerTradePct,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch risk preferences" }, { status: 500 })
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
      select: { riskPrefs: true },
    })
    const prev = (existing?.riskPrefs as any) || {}

    const merged = {
      dailyLossLimit: body.dailyLossLimit !== undefined ? (body.dailyLossLimit === "" || body.dailyLossLimit === null ? null : Number(body.dailyLossLimit)) : prev.dailyLossLimit ?? null,
      maxTradesPerDay: body.maxTradesPerDay !== undefined ? (body.maxTradesPerDay === "" || body.maxTradesPerDay === null ? null : Number(body.maxTradesPerDay)) : prev.maxTradesPerDay ?? null,
      maxConsecutiveLosses: body.maxConsecutiveLosses !== undefined ? (body.maxConsecutiveLosses === "" || body.maxConsecutiveLosses === null ? null : Number(body.maxConsecutiveLosses)) : prev.maxConsecutiveLosses ?? null,
      maxRiskPerTradePct: body.maxRiskPerTradePct !== undefined ? (body.maxRiskPerTradePct === "" || body.maxRiskPerTradePct === null ? null : Number(body.maxRiskPerTradePct)) : prev.maxRiskPerTradePct ?? 1,
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { riskPrefs: merged },
    })

    return NextResponse.json(merged)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save risk preferences" }, { status: 500 })
  }
}
