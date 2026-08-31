import { NextResponse } from "next/server"
import { requireAdminApi, logAdminAction } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const PATCHSchema = z.object({
  userId: z.string().optional(),
  planId: z.string().optional(),
  subscriptionId: z.string().optional(),
  status: z.string().optional(),
})

export async function GET(request: Request) {
  const sessionOrResponse = await requireAdminApi()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const session = sessionOrResponse
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
  const sessionOrResponse = await requireAdminApi()
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
  const session = sessionOrResponse
  const body = await request.json()
  const parsed = PATCHSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { userId, planId, subscriptionId, status } = parsed.data

  // If approving a specific pending subscription
  if (subscriptionId && status === "ACTIVE") {
    const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId }, include: { user: true, plan: true } })
    if (!sub) return NextResponse.json({ error: "Subscription not found" }, { status: 404 })

    // Une souscription ne peut passer ACTIVE que depuis l'état PENDING.
    // Empêche les double-activations et la ré-approbation d'une souscription déjà traitée.
    if (sub.status !== "PENDING") {
      return NextResponse.json({ error: "Subscription is not pending", status: sub.status }, { status: 409 })
    }

    // Cancel other active subs for this user
    await prisma.subscription.updateMany({
      where: { userId: sub.userId, status: "ACTIVE", id: { not: subscriptionId } },
      data: { status: "CANCELED", canceledAt: new Date() }
    })

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "ACTIVE", startDate: new Date() }
    })

    await logAdminAction({
      adminId: session.user.id,
      targetUserId: sub.userId,
      action: "SUBSCRIPTION_APPROVED",
      metadata: { subscriptionId },
    })

    import("@/lib/email").then(({ sendEmail }) => {
      import("@/emails/SubscriptionApprovedEmail").then(({ SubscriptionApprovedEmail }) => {
        sendEmail({
          to: sub.user.email,
          subject: `Your ${sub.plan.name} Subscription is Active! 🎉`,
          react: SubscriptionApprovedEmail({ 
            name: sub.user.name || "Trader", 
            planName: sub.plan.name 
          }),
        }).catch(console.error)
      })
    }).catch(console.error)

    return NextResponse.json({ success: true })
  }

  if (!userId || !planId) {
    return NextResponse.json({ error: "Missing userId or planId" }, { status: 400 })
  }

  const [targetUser, targetPlan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.plan.findUnique({ where: { id: planId } })
  ])

  if (!targetUser || !targetPlan) {
    return NextResponse.json({ error: "User or Plan not found" }, { status: 404 })
  }

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

  // Send Subscription Approved Email asynchronously
  import("@/lib/email").then(({ sendEmail }) => {
    import("@/emails/SubscriptionApprovedEmail").then(({ SubscriptionApprovedEmail }) => {
      sendEmail({
        to: targetUser.email,
        subject: `Your ${targetPlan.name} Subscription is Active! 🎉`,
        react: SubscriptionApprovedEmail({ 
          name: targetUser.name || "Trader", 
          planName: targetPlan.name 
        }),
      }).catch(console.error)
    })
  }).catch(console.error)

  return NextResponse.json({ success: true })
}
