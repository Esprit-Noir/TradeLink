import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const riskPrefsSchema = z.object({
  dailyLossLimit: z.union([z.string(), z.number(), z.null()]).optional(),
  maxTradesPerDay: z.union([z.string(), z.number(), z.null()]).optional(),
  maxConsecutiveLosses: z.union([z.string(), z.number(), z.null()]).optional(),
  maxRiskPerTradePct: z.union([z.string(), z.number(), z.null()]).optional(),
})

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
  } catch (error) {
    console.error("Error fetching risk preferences:", error instanceof Error ? error.message : "Unknown error")
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
    const parsed = riskPrefsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { riskPrefs: true },
    })
    const prev = (existing?.riskPrefs as any) || {}

    const merged = {
      dailyLossLimit: parsed.data.dailyLossLimit !== undefined ? (parsed.data.dailyLossLimit === "" || parsed.data.dailyLossLimit === null ? null : Number(parsed.data.dailyLossLimit)) : prev.dailyLossLimit ?? null,
      maxTradesPerDay: parsed.data.maxTradesPerDay !== undefined ? (parsed.data.maxTradesPerDay === "" || parsed.data.maxTradesPerDay === null ? null : Number(parsed.data.maxTradesPerDay)) : prev.maxTradesPerDay ?? null,
      maxConsecutiveLosses: parsed.data.maxConsecutiveLosses !== undefined ? (parsed.data.maxConsecutiveLosses === "" || parsed.data.maxConsecutiveLosses === null ? null : Number(parsed.data.maxConsecutiveLosses)) : prev.maxConsecutiveLosses ?? null,
      maxRiskPerTradePct: parsed.data.maxRiskPerTradePct !== undefined ? (parsed.data.maxRiskPerTradePct === "" || parsed.data.maxRiskPerTradePct === null ? null : Number(parsed.data.maxRiskPerTradePct)) : prev.maxRiskPerTradePct ?? 1,
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { riskPrefs: merged },
    })

    return NextResponse.json(merged)
  } catch (error) {
    console.error("Error updating risk preferences:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
