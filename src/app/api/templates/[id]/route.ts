import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateTemplateSchema = z.object({
  firmName: z.string().max(100).optional(),
  programName: z.string().max(100).optional(),
  drawdownType: z.string().optional(),
  logoUrl: z.union([z.string().url(), z.null()]).optional(),
  dailyResetTimezone: z.string().max(50).optional(),
  dailyDDPct: z.union([z.string(), z.number(), z.null()]).optional(),
  maxDDPct: z.union([z.string(), z.number(), z.null()]).optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = updateTemplateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const existing = await prisma.propFirmTemplate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const data: any = {}
    if (parsed.data.firmName !== undefined) data.firmName = parsed.data.firmName
    if (parsed.data.programName !== undefined) data.programName = parsed.data.programName
    if (parsed.data.drawdownType !== undefined) data.drawdownType = parsed.data.drawdownType
    if (parsed.data.logoUrl !== undefined) data.logoUrl = parsed.data.logoUrl || null
    if (parsed.data.dailyResetTimezone !== undefined) data.dailyResetTimezone = parsed.data.dailyResetTimezone
    if (parsed.data.dailyDDPct !== undefined) data.dailyDDPct = parseOptionalNumber(parsed.data.dailyDDPct)
    if (parsed.data.maxDDPct !== undefined) data.maxDDPct = parseOptionalNumber(parsed.data.maxDDPct) ?? 10
    if (parsed.data.profitTargetPhase1Pct !== undefined) data.profitTargetPhase1Pct = parseOptionalNumber(parsed.data.profitTargetPhase1Pct)
    if (parsed.data.profitTargetPhase2Pct !== undefined) data.profitTargetPhase2Pct = parseOptionalNumber(parsed.data.profitTargetPhase2Pct)
    if (parsed.data.minTradingDays !== undefined) data.minTradingDays = parsed.data.minTradingDays === "" || parsed.data.minTradingDays === null ? null : parseInt(String(parsed.data.minTradingDays))
    if (parsed.data.maxTradingDays !== undefined) data.maxTradingDays = parsed.data.maxTradingDays === "" || parsed.data.maxTradingDays === null ? null : parseInt(String(parsed.data.maxTradingDays))
    if (parsed.data.consistencyRulePct !== undefined) data.consistencyRulePct = parseOptionalNumber(parsed.data.consistencyRulePct)
    if (parsed.data.weekendHoldingAllowed !== undefined) data.weekendHoldingAllowed = parsed.data.weekendHoldingAllowed
    if (parsed.data.newsTradingAllowed !== undefined) data.newsTradingAllowed = parsed.data.newsTradingAllowed
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive

    const template = await prisma.propFirmTemplate.update({
      where: { id },
      data
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Error updating template:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as any
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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
    console.error("Error deleting template:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
