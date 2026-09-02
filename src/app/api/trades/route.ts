export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getActiveAccount } from "@/lib/active-account"
import { z } from "zod"
import { apiOk, apiError } from "@/lib/api-response"

const tradeSchema = z.object({
  symbol: z.string().min(1).max(20),
  instrumentType: z.string().optional(),
  side: z.enum(["LONG", "SHORT"]),
  quantity: z.string().or(z.number()),
  entryPrice: z.string().or(z.number()),
  exitPrice: z.string().or(z.number()),
  entryAt: z.string(),
  exitAt: z.string().optional(),
  fees: z.string().or(z.number()).optional(),
  setupTags: z.string().optional(),
  emotionTags: z.string().optional(),
  notesPost: z.string().optional(),
  screenshotUrl: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401)
    }

    const body = await request.json()
    const parsed = tradeSchema.safeParse(body)
    if (!parsed.success) {
      return apiError("Invalid input", 400, parsed.error.flatten().fieldErrors)
    }

    const { symbol, instrumentType, side, quantity, entryPrice, exitPrice, entryAt, exitAt, fees, setupTags, emotionTags, notesPost, screenshotUrl } = parsed.data

    if (!symbol || !quantity || !entryPrice || !exitPrice || !entryAt) {
      return apiError("Missing required fields")
    }

    // Retrieve default account
    const account = await getActiveAccount(session.user.id)

    if (!account) {
      return apiError("No trading account found.", 404)
    }

    const isLong = side === "LONG"
    const entry = parseFloat(String(entryPrice))
    const exit = parseFloat(String(exitPrice))
    const qty = parseFloat(String(quantity))
    const f = parseFloat(String(fees || "0"))
    
    const diff = isLong ? exit - entry : entry - exit
    const netPnl = (diff * qty) - f
    const fxRate = Number(account.fxRateToUsd ?? 1)
    const netPnlUsd = Math.round(netPnl * fxRate * 10000) / 10000

    let finalSetupTags = setupTags ? setupTags.split(",").map((s: string) => s.trim()).filter(Boolean) : []
    if (finalSetupTags.length === 0) {
      const defaultSetup = await prisma.tradingSetup.findFirst({
        where: { userId: session.user.id, isDefault: true }
      })
      if (defaultSetup) {
        finalSetupTags = [defaultSetup.name]
      }
    }

    const trade = await prisma.trade.create({
      data: {
        userId: session.user.id,
        accountId: account.id,
        symbol: symbol.toUpperCase(),
        instrumentType,
        side,
        quantity: qty,
        entryPrice: entry,
        exitPrice: exit,
        entryAt: new Date(entryAt),
        exitAt: exitAt ? new Date(exitAt) : null,
        fees: f,
        netPnl,
        netPnlUsd,
        status: "closed",
        setupTags: finalSetupTags,
        emotionTags: emotionTags ? emotionTags.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
        notesPost: notesPost || null,
        screenshots: screenshotUrl ? {
          create: {
            storageUrl: screenshotUrl,
            fileName: screenshotUrl.split('/').pop() || 'screenshot'
          }
        } : undefined
      }
    })

    // Invalidate behavioral snapshot cache
    await prisma.behavioralSnapshot.deleteMany({
      where: { accountId: account.id },
    })

    // If this is a prop firm account, run challenge evaluation asynchronously
    const propChallenge = await prisma.propChallenge.findUnique({
      where: { accountId: account.id }
    })
    
    if (propChallenge) {
      import("@/lib/prop-firm.service").then(({ evaluateChallenge }) => {
        evaluateChallenge(propChallenge.id).catch(console.error)
      }).catch(console.error)
    }

    // Evaluate achievements
    const unlocks = await import("@/lib/achievements.service")
      .then(m => m.evaluateAchievements(session.user?.id || ""))
      .catch(e => { console.error(e); return [] })

    return apiOk({ trade, unlocks })
  } catch (error) {
    console.error("Error creating trade:", error instanceof Error ? error.message : "Unknown error")
    return apiError("Internal Server Error", 500)
  }
}
