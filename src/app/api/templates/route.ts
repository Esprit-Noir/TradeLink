import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createTemplateSchema = z.object({
  firmName: z.string().min(1).max(100),
  programName: z.string().min(1).max(100),
  drawdownType: z.string().min(1),
  logoUrl: z.union([z.string().url(), z.null()]).optional(),
  dailyDDPct: z.union([z.string(), z.number(), z.null()]).optional(),
  maxDDPct: z.union([z.string(), z.number(), z.null()]).optional(),
  dailyResetTimezone: z.string().max(50).optional(),
  profitTargetPhase1Pct: z.union([z.string(), z.number(), z.null()]).optional(),
  profitTargetPhase2Pct: z.union([z.string(), z.number(), z.null()]).optional(),
  minTradingDays: z.union([z.string(), z.number()]).optional(),
  maxTradingDays: z.union([z.string(), z.number()]).optional(),
  consistencyRulePct: z.union([z.string(), z.number(), z.null()]).optional(),
  weekendHoldingAllowed: z.boolean().optional(),
  newsTradingAllowed: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

function parseOptionalNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templates = await prisma.propFirmTemplate.findMany({
      orderBy: [{ firmName: 'asc' }, { programName: 'asc' }]
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching templates:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth() as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { firmName, programName, drawdownType, logoUrl } = parsed.data

    const template = await prisma.propFirmTemplate.create({
      data: {
        firmName,
        programName,
        drawdownType,
        logoUrl: logoUrl || null,
        dailyDDPct: parseOptionalNumber(parsed.data.dailyDDPct),
        maxDDPct: parseOptionalNumber(parsed.data.maxDDPct) ?? 10,
        dailyResetTimezone: parsed.data.dailyResetTimezone || "UTC",
        profitTargetPhase1Pct: parseOptionalNumber(parsed.data.profitTargetPhase1Pct),
        profitTargetPhase2Pct: parseOptionalNumber(parsed.data.profitTargetPhase2Pct),
        minTradingDays: parsed.data.minTradingDays !== undefined && parsed.data.minTradingDays !== "" ? parseInt(String(parsed.data.minTradingDays)) : null,
        maxTradingDays: parsed.data.maxTradingDays !== undefined && parsed.data.maxTradingDays !== "" ? parseInt(String(parsed.data.maxTradingDays)) : null,
        consistencyRulePct: parseOptionalNumber(parsed.data.consistencyRulePct),
        weekendHoldingAllowed: parsed.data.weekendHoldingAllowed !== false,
        newsTradingAllowed: parsed.data.newsTradingAllowed !== false,
        isActive: parsed.data.isActive !== false,
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error creating template:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
