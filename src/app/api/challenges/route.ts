import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, challengeName, initialBalance, steps, phase2Target, payoutSplit } = body

    if (!templateId || !challengeName || initialBalance === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Auto-create a trading account for this challenge
    const balanceDecimal = parseFloat(initialBalance)
    const account = await prisma.tradingAccount.create({
      data: {
        userId: session.user.id,
        name: challengeName,
        broker: "Prop Firm",
        type: "prop_firm",
        baseCurrency: "USD",
        initialBalance: balanceDecimal,
        isDefault: false
      }
    })

    // Get template
    const template = await prisma.propFirmTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    // Create the challenge
    const challenge = await prisma.propChallenge.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        templateId: template.id,
        initialBalance: account.initialBalance || 0,
        dailyDDPct: body.dailyDDPct !== undefined ? parseFloat(body.dailyDDPct) : (template.dailyDDPct || 0),
        maxDDPct: body.maxDDPct !== undefined ? parseFloat(body.maxDDPct) : template.maxDDPct,
        profitTargetPct: body.profitTargetPct !== undefined ? parseFloat(body.profitTargetPct) : (template.profitTargetPhase1Pct || 0),
        minTradingDays: body.minTradingDays !== undefined ? parseInt(body.minTradingDays) : template.minTradingDays,
        maxTradingDays: template.maxTradingDays,
        startedAt: new Date(),
        currentBalance: account.initialBalance || 0,
        currentEquity: account.initialBalance || 0,
        highestBalance: account.initialBalance || 0,
        highestEquity: account.initialBalance || 0,
        todayStartBalance: account.initialBalance || 0,
        metadata: {
          steps: steps || '1',
          phase2Target: phase2Target ? parseFloat(phase2Target) : null,
          payoutSplit: payoutSplit || null
        }
      }
    })

    return NextResponse.json(challenge)
  } catch (error: any) {
    console.error("Error creating challenge:", error)
    return NextResponse.json({ error: "Failed to create challenge" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const challenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id },
      include: { template: true, account: true }
    })

    return NextResponse.json(challenges)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch challenges" }, { status: 500 })
  }
}
