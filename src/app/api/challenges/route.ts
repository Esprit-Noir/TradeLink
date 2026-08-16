import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createChallengeSchema = z.object({
  templateId: z.string().min(1),
  challengeName: z.string().min(1).max(100),
  initialBalance: z.string().or(z.number()),
  steps: z.string().optional(),
  phase2Target: z.string().optional(),
  fundedTarget: z.string().optional(),
  payoutSplit: z.string().optional(),
  logoUrl: z.string().url().optional(),
  cost: z.string().or(z.number()).optional(),
  profitTargetPct: z.string().optional(),
  dailyDDPct: z.string().optional(),
  maxDDPct: z.string().optional(),
  minTradingDays: z.string().optional(),
  maxTradingDays: z.string().optional(),
  enableStopTrading: z.boolean().optional(),
  enableProfitGoal: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createChallengeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { templateId, challengeName, initialBalance, steps, phase2Target, fundedTarget, payoutSplit, logoUrl, cost } = parsed.data

    // Auto-create a trading account for this challenge
    const balanceDecimal = parseFloat(String(initialBalance))
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

    // Save the firm logo on the template (shared across all challenges of the firm)
    if (logoUrl) {
      await prisma.propFirmTemplate.update({
        where: { id: template.id },
        data: { logoUrl },
      })
    }

    // Create the challenge
    const isMaster = steps === 'master'
    const phase1Target = parsed.data.profitTargetPct !== undefined ? parseFloat(parsed.data.profitTargetPct) : (template.profitTargetPhase1Pct || 0)
    const initialPhase = isMaster ? 'funded' : 'phase_1'
    const initialTarget = isMaster
      ? (fundedTarget ? parseFloat(fundedTarget) : (template.profitTargetPhase2Pct || 0))
      : phase1Target

    // Default alert config from user preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationPrefs: true },
    })
    const prefs = (user?.notificationPrefs as any) || {}
    const alertDefaults = (prefs.defaults as any) || {}
    const alertConfig = {
      stopTradingPct: Number(alertDefaults.stopTradingPct ?? 85),
      profitGoalPct: Number(alertDefaults.profitGoalPct ?? 50),
      enableStopTrading: Boolean(parsed.data.enableStopTrading ?? false),
      enableProfitGoal: Boolean(parsed.data.enableProfitGoal ?? false),
    }

    const maxTradingDays = parsed.data.maxTradingDays !== undefined ? parseInt(parsed.data.maxTradingDays) : (template.maxTradingDays || null)
    const startedAt = new Date()
    const deadlineAt = maxTradingDays ? new Date(startedAt.getTime() + maxTradingDays * 24 * 60 * 60 * 1000) : null

    const challenge = await prisma.propChallenge.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        templateId: template.id,
        initialBalance: account.initialBalance || 0,
        dailyDDPct: parsed.data.dailyDDPct !== undefined ? parseFloat(parsed.data.dailyDDPct) : (template.dailyDDPct || 0),
        maxDDPct: parsed.data.maxDDPct !== undefined ? parseFloat(parsed.data.maxDDPct) : template.maxDDPct,
        profitTargetPct: initialTarget,
        minTradingDays: parsed.data.minTradingDays !== undefined ? parseInt(parsed.data.minTradingDays) : template.minTradingDays,
        maxTradingDays,
        cost: cost !== undefined ? parseFloat(String(cost)) : null,
        phase: initialPhase,
        status: 'active',
        startedAt,
        deadlineAt,
        currentBalance: account.initialBalance || 0,
        currentEquity: account.initialBalance || 0,
        highestBalance: account.initialBalance || 0,
        highestEquity: account.initialBalance || 0,
        todayStartBalance: account.initialBalance || 0,
        alertConfig,
        metadata: {
          steps: steps || '2',
          phase1Target,
          phase2Target: phase2Target ? parseFloat(phase2Target) : null,
          fundedTarget: fundedTarget ? parseFloat(fundedTarget) : null,
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
