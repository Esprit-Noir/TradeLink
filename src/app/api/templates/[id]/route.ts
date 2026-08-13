import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function parseOptionalNumber(value: any): number | null {
  if (value === undefined || value === null || value === "") return null
  const n = parseFloat(value)
  return isNaN(n) ? null : n
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.propFirmTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const data: any = {}
    if (body.firmName !== undefined) data.firmName = body.firmName
    if (body.programName !== undefined) data.programName = body.programName
    if (body.drawdownType !== undefined) data.drawdownType = body.drawdownType
    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl || null
    if (body.dailyResetTimezone !== undefined) data.dailyResetTimezone = body.dailyResetTimezone
    if (body.dailyDDPct !== undefined) data.dailyDDPct = parseOptionalNumber(body.dailyDDPct)
    if (body.maxDDPct !== undefined) data.maxDDPct = parseOptionalNumber(body.maxDDPct) ?? 10
    if (body.profitTargetPhase1Pct !== undefined) data.profitTargetPhase1Pct = parseOptionalNumber(body.profitTargetPhase1Pct)
    if (body.profitTargetPhase2Pct !== undefined) data.profitTargetPhase2Pct = parseOptionalNumber(body.profitTargetPhase2Pct)
    if (body.minTradingDays !== undefined) data.minTradingDays = body.minTradingDays === "" ? null : parseInt(body.minTradingDays)
    if (body.maxTradingDays !== undefined) data.maxTradingDays = body.maxTradingDays === "" ? null : parseInt(body.maxTradingDays)
    if (body.consistencyRulePct !== undefined) data.consistencyRulePct = parseOptionalNumber(body.consistencyRulePct)
    if (body.weekendHoldingAllowed !== undefined) data.weekendHoldingAllowed = body.weekendHoldingAllowed
    if (body.newsTradingAllowed !== undefined) data.newsTradingAllowed = body.newsTradingAllowed
    if (body.isActive !== undefined) data.isActive = body.isActive

    const template = await prisma.propFirmTemplate.update({
      where: { id },
      data
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating template:", error)
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.propFirmTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const challengeCount = await prisma.propChallenge.count({
      where: { templateId: id }
    })
    if (challengeCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete: template is used by active challenges" },
        { status: 400 }
      )
    }

    await prisma.propFirmTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting template:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
