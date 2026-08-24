import { prisma } from "@/lib/prisma"
import { SubscriptionsTable, type Subscription, type Plan } from "@/components/admin/SubscriptionsTable"

export default async function AdminSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
      plan: { select: { id: true, name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { price: "asc" } })

  const serializedSubscriptions = subscriptions.map(s => ({
    ...s,
    plan: { ...s.plan, price: s.plan.price.toNumber() }
  }))

  const serializedPlans = plans.map(p => ({
    ...p,
    price: p.price.toNumber()
  }))

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Subscriptions</h1>
        <p className="page-subtitle">Manage user plans and subscriptions</p>
      </div>
      <SubscriptionsTable initialSubscriptions={serializedSubscriptions as unknown as Subscription[]} plans={serializedPlans as unknown as Plan[]} />
    </div>
  )
}
