import { prisma } from "@/lib/prisma"
import { PlansManager } from "@/components/admin/PlansManager"

export const metadata = {
  title: "Admin | Plans & Pricing",
}

export default async function AdminPlansPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" }
  })

  const serializedPlans = plans.map(p => ({
    ...p,
    price: p.price.toNumber()
  }))

  return (
    <div>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Plans & Features</h1>
          <p className="page-subtitle">Manage subscription tiers and access features</p>
        </div>
      </div>
      
      {/* Client component to handle CRUD operations on Plans */}
      <PlansManager initialPlans={serializedPlans} />
    </div>
  )
}
