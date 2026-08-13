import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    console.error("Error fetching templates:", error)
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { firmName, programName, drawdownType, logoUrl } = body

    if (!firmName || !programName || !drawdownType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const template = await prisma.propFirmTemplate.create({
      data: {
        firmName,
        programName,
        drawdownType,
        logoUrl: logoUrl || null,
        dailyDDPct: parseOptionalNumber(body.dailyDDPct),
        maxDDPct: parseOptionalNumber(body.maxDDPct) ?? 10,
        dailyResetTimezone: body.dailyResetTimezone || "UTC",
        profitTargetPhase1Pct: parseOptionalNumber(body.profitTargetPhase1Pct),
        profitTargetPhase2Pct: parseOptionalNumber(body.profitTargetPhase2Pct),
        minTradingDays: body.minTradingDays !== undefined && body.minTradingDays !== "" ? parseInt(body.minTradingDays) : null,
        maxTradingDays: body.maxTradingDays !== undefined && body.maxTradingDays !== "" ? parseInt(body.maxTradingDays) : null,
        consistencyRulePct: parseOptionalNumber(body.consistencyRulePct),
        weekendHoldingAllowed: body.weekendHoldingAllowed !== false,
        newsTradingAllowed: body.newsTradingAllowed !== false,
        isActive: body.isActive !== false,
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error creating template:", error)
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
