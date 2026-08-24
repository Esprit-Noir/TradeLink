import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseCurrency, timezone, dailyGoal, monthlyGoal, riskPrefs } = await req.json()

    // Validation (basic)
    if (!baseCurrency || !timezone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        baseCurrency,
        timezone,
        dailyGoal: dailyGoal ? Number(dailyGoal) : null,
        monthlyGoal: monthlyGoal ? Number(monthlyGoal) : null,
        riskPrefs: riskPrefs || {},
        onboarded: true,
      },
    })

    // Also update the default trading account if it exists to match the base currency
    await prisma.tradingAccount.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: {
        baseCurrency,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    console.error("Onboarding failed:", error)
    return NextResponse.json({ error: "Onboarding failed" }, { status: 500 })
  }
}
