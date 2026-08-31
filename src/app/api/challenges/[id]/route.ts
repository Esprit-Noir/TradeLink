import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

interface AlertConfig {
  stopTradingPct?: number
  profitGoalPct?: number
  enableStopTrading?: boolean
  enableProfitGoal?: boolean
}

interface ChallengeMetadata {
  steps?: string
  phase1Target?: number | null
  phase2Target?: number | null
  fundedTarget?: number | null
  payoutSplit?: string | null
  [key: string]: unknown
}

const alertConfigSchema = z.object({
  stopTradingPct: z.union([z.string(), z.number()]).optional(),
  profitGoalPct: z.union([z.string(), z.number()]).optional(),
  enableStopTrading: z.boolean().optional(),
  enableProfitGoal: z.boolean().optional(),
}).optional()

const updateChallengeSchema = z.object({
  profitTargetPct: z.string().optional(),
  maxDDPct: z.string().optional(),
  dailyDDPct: z.string().optional(),
  minTradingDays: z.string().optional(),
  cost: z.union([z.string(), z.number(), z.null()]).optional(),
  alertConfig: alertConfigSchema,
  steps: z.string().optional(),
  phase2Target: z.string().optional(),
  fundedTarget: z.string().optional(),
  payoutSplit: z.string().optional(),
  challengeName: z.string().optional(),
  initialBalance: z.union([z.string(), z.number()]).optional(),
  logoUrl: z.string().url().optional(),
})

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
    const parsed = updateChallengeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const challenge = await prisma.propChallenge.findUnique({
      where: { id },
      include: { account: true },
    })

    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const dataToUpdate: Prisma.PropChallengeUpdateInput = {}
    if (parsed.data.profitTargetPct !== undefined) dataToUpdate.profitTargetPct = parseFloat(parsed.data.profitTargetPct)
    if (parsed.data.maxDDPct !== undefined) dataToUpdate.maxDDPct = parseFloat(parsed.data.maxDDPct)
    if (parsed.data.dailyDDPct !== undefined) dataToUpdate.dailyDDPct = parseFloat(parsed.data.dailyDDPct)
    if (parsed.data.minTradingDays !== undefined) dataToUpdate.minTradingDays = parseInt(parsed.data.minTradingDays)
    if (parsed.data.cost !== undefined) dataToUpdate.cost = parsed.data.cost === null || parsed.data.cost === "" ? null : parseFloat(String(parsed.data.cost))

    if (parsed.data.alertConfig !== undefined) {
      const currentAlertConfig = (challenge.alertConfig as AlertConfig) || {}
      dataToUpdate.alertConfig = {
        stopTradingPct: parsed.data.alertConfig.stopTradingPct !== undefined ? Number(parsed.data.alertConfig.stopTradingPct) : (currentAlertConfig.stopTradingPct ?? 85),
        profitGoalPct: parsed.data.alertConfig.profitGoalPct !== undefined ? Number(parsed.data.alertConfig.profitGoalPct) : (currentAlertConfig.profitGoalPct ?? 50),
        enableStopTrading: parsed.data.alertConfig.enableStopTrading !== undefined ? Boolean(parsed.data.alertConfig.enableStopTrading) : (currentAlertConfig.enableStopTrading ?? false),
        enableProfitGoal: parsed.data.alertConfig.enableProfitGoal !== undefined ? Boolean(parsed.data.alertConfig.enableProfitGoal) : (currentAlertConfig.enableProfitGoal ?? false),
      }
    }

    const currentMetadata = (challenge.metadata as ChallengeMetadata) || {}
    const newMetadata = {
      ...currentMetadata,
      steps: parsed.data.steps ?? currentMetadata.steps ?? "2",
      phase1Target: parsed.data.profitTargetPct !== undefined ? parseFloat(parsed.data.profitTargetPct) : (currentMetadata.phase1Target ?? null),
      phase2Target: parsed.data.phase2Target !== undefined ? parseFloat(parsed.data.phase2Target) : (currentMetadata.phase2Target ?? null),
      fundedTarget: parsed.data.fundedTarget !== undefined ? parseFloat(parsed.data.fundedTarget) : (currentMetadata.fundedTarget ?? null),
      payoutSplit: parsed.data.payoutSplit !== undefined ? parsed.data.payoutSplit : (currentMetadata.payoutSplit ?? null),
    }
    dataToUpdate.metadata = newMetadata

    // Update the linked trading account (name / balance)
    if (parsed.data.challengeName !== undefined || parsed.data.initialBalance !== undefined) {
      const accountData: Prisma.TradingAccountUpdateInput = {}
      if (parsed.data.challengeName !== undefined) accountData.name = parsed.data.challengeName
      if (parsed.data.initialBalance !== undefined) accountData.initialBalance = parseFloat(String(parsed.data.initialBalance))
      await prisma.tradingAccount.update({
        where: { id: challenge.accountId },
        data: accountData,
      })
    }

    // Save a new firm logo if provided
    if (parsed.data.logoUrl) {
      await prisma.propFirmTemplate.update({
        where: { id: challenge.templateId },
        data: { logoUrl: parsed.data.logoUrl },
      })
    }

    const updated = await prisma.propChallenge.update({
      where: { id },
      data: dataToUpdate,
      include: { template: true, account: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating challenge:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update challenge" }, { status: 500 })
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

    const challenge = await prisma.propChallenge.findUnique({
      where: { id },
      include: { account: true },
    })

    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    // Deleting the account cascades to its trades, the challenge,
    // and the challenge's events/snapshots/payouts (DB-level onDelete: Cascade).
    await prisma.tradingAccount.delete({
      where: { id: challenge.accountId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting challenge:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 })
  }
}
