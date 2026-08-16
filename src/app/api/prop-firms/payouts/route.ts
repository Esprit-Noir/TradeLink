import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payouts = await prisma.propPayout.findMany({
      where: { challenge: { userId: session.user.id } },
      include: {
        challenge: { include: { account: true, template: true } }
      },
      orderBy: { requestedAt: 'desc' }
    })

    const data = payouts.map(p => ({
      id: p.id,
      challengeId: p.challengeId,
      amount: Number(p.amount),
      status: p.status,
      requestedAt: p.requestedAt.toISOString(),
      note: p.note,
      accountName: p.challenge.account.name,
      firmName: p.challenge.template.firmName,
      logoUrl: p.challenge.template.logoUrl || null,
      challengeStatus: p.challenge.status,
      phase: p.challenge.phase,
    }))

    const sum = (statuses: string[]) =>
      data.filter(d => statuses.includes(d.status)).reduce((s, d) => s + d.amount, 0)

    const fundedChallenges = await prisma.propChallenge.findMany({
      where: { userId: session.user.id, phase: 'funded' },
      include: { account: true, template: true },
      orderBy: { startedAt: 'desc' }
    })

    return NextResponse.json({
      payouts: data,
      totals: {
        paid: sum(['paid']),
        approved: sum(['approved']),
        requested: sum(['requested']),
        pending: sum(['requested', 'approved']),
      },
      fundedChallenges: fundedChallenges.map(c => ({
        id: c.id,
        accountName: c.account.name,
        firmName: c.template.firmName,
        logoUrl: c.template.logoUrl || null,
        currentEquity: Number(c.currentEquity || 0),
        status: c.status,
      }))
    })
  } catch (error) {
    console.error("Error fetching payouts:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 })
  }
}
