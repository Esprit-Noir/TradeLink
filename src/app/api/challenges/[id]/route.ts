import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    const challenge = await prisma.propChallenge.findUnique({
      where: { id },
      include: { account: true },
    })

    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const dataToUpdate: any = {}
    if (body.profitTargetPct !== undefined) dataToUpdate.profitTargetPct = parseFloat(body.profitTargetPct)
    if (body.maxDDPct !== undefined) dataToUpdate.maxDDPct = parseFloat(body.maxDDPct)
    if (body.dailyDDPct !== undefined) dataToUpdate.dailyDDPct = parseFloat(body.dailyDDPct)
    if (body.minTradingDays !== undefined) dataToUpdate.minTradingDays = parseInt(body.minTradingDays)

    if (body.alertConfig !== undefined) {
      const currentAlertConfig = (challenge.alertConfig as any) || {}
      dataToUpdate.alertConfig = {
        stopTradingPct: body.alertConfig.stopTradingPct !== undefined ? Number(body.alertConfig.stopTradingPct) : (currentAlertConfig.stopTradingPct ?? 85),
        profitGoalPct: body.alertConfig.profitGoalPct !== undefined ? Number(body.alertConfig.profitGoalPct) : (currentAlertConfig.profitGoalPct ?? 50),
        enableStopTrading: body.alertConfig.enableStopTrading !== undefined ? Boolean(body.alertConfig.enableStopTrading) : (currentAlertConfig.enableStopTrading ?? false),
        enableProfitGoal: body.alertConfig.enableProfitGoal !== undefined ? Boolean(body.alertConfig.enableProfitGoal) : (currentAlertConfig.enableProfitGoal ?? false),
      }
    }

    const currentMetadata = (challenge.metadata as any) || {}
    const newMetadata = {
      ...currentMetadata,
      steps: body.steps ?? currentMetadata.steps ?? "2",
      phase1Target: body.profitTargetPct !== undefined ? parseFloat(body.profitTargetPct) : (currentMetadata.phase1Target ?? null),
      phase2Target: body.phase2Target !== undefined ? parseFloat(body.phase2Target) : (currentMetadata.phase2Target ?? null),
      fundedTarget: body.fundedTarget !== undefined ? parseFloat(body.fundedTarget) : (currentMetadata.fundedTarget ?? null),
      payoutSplit: body.payoutSplit !== undefined ? body.payoutSplit : (currentMetadata.payoutSplit ?? null),
    }
    dataToUpdate.metadata = newMetadata

    // Update the linked trading account (name / balance)
    if (body.challengeName !== undefined || body.initialBalance !== undefined) {
      const accountData: any = {}
      if (body.challengeName !== undefined) accountData.name = body.challengeName
      if (body.initialBalance !== undefined) accountData.initialBalance = parseFloat(body.initialBalance)
      await prisma.tradingAccount.update({
        where: { id: challenge.accountId },
        data: accountData,
      })
    }

    // Save a new firm logo if provided
    if (body.logoUrl) {
      await prisma.propFirmTemplate.update({
        where: { id: challenge.templateId },
        data: { logoUrl: body.logoUrl },
      })
    }

    const updated = await prisma.propChallenge.update({
      where: { id },
      data: dataToUpdate,
      include: { template: true, account: true },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating challenge:", error)
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
  } catch (error: any) {
    console.error("Error deleting challenge:", error)
    return NextResponse.json({ error: "Failed to delete challenge" }, { status: 500 })
  }
}
