import { NextResponse } from "next/server"
import { requireAdmin, logAdminAction } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const PATCHSchema = z.object({
  userId: z.string(),
  planId: z.string(),
})

export async function GET(request: Request) {
  const session = await requireAdmin()
  const { searchParams } = new URL(request.url)

  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "20")

  const [subscriptions, total, plans] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        user: { select: { id: true, email: true, name: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.subscription.count(),
    prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } }),
  ])

  return NextResponse.json({ subscriptions, total, plans, page, pageSize })
}

export async function PATCH(request: Request) {
  const session = await requireAdmin()
  const body = await request.json()
  const parsed = PATCHSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { userId, planId } = parsed.data

  // Upsert subscription
  const existing = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
  })

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { planId, status: "ACTIVE" },
    })
  } else {
    await prisma.subscription.create({
      data: { userId, planId, status: "ACTIVE" },
    })
  }

  await logAdminAction({
    adminId: session.user.id,
    targetUserId: userId,
    action: "PLAN_CHANGED",
    metadata: { planId },
  })

  return NextResponse.json({ success: true })
}
