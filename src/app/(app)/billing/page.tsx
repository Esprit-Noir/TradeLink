import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { BillingClient } from "@/components/billing/BillingClient"
import { getActivePlan } from "@/lib/subscriptions"

export const metadata = {
  title: "Billing & Plans | TradeLink",
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ feature?: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  
  const { feature } = await searchParams

  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" }
  })

  const currentPlan = await getActivePlan(session.user.id)

  const serializedPlans = plans.map(p => ({
    ...p,
    price: p.price.toNumber()
  }))
  
  const serializedCurrentPlan = currentPlan ? {
    ...currentPlan,
    price: currentPlan.price.toNumber()
  } : null

  return (
    <div className="main-content" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 className="page-title" style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          Upgrade Your Trading Experience
        </h1>
        <p className="page-subtitle" style={{ fontSize: "1rem" }}>
          {feature === "replay" 
            ? "You need an active plan with Replay Access to use the Market Replay simulator." 
            : "Choose the plan that fits your trading goals."}
        </p>
      </div>

      <BillingClient plans={serializedPlans as any} currentPlanId={serializedCurrentPlan?.id} />
    </div>
  )
}
