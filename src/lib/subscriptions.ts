import { prisma } from "@/lib/prisma"
import { cache } from "react"

export type FeatureKey = "replayAccess" | "propFirmAccess" | "advancedStats" | "backtestAccess"

export async function hasFeatureAccess(userId: string, feature: FeatureKey): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    return true
  }

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    include: {
      plan: true
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  if (!activeSubscription) {
    // Basic fallback for free users or if no subscription exists
    return false
  }

  const { plan } = activeSubscription

  // Native column
  if (feature === "backtestAccess") {
    return plan.backtestAccess
  }

  // JSON features
  if (plan.features && typeof plan.features === "object") {
    const featuresMap = plan.features as Record<string, boolean>
    return !!featuresMap[feature]
  }

  return false
}

// Utiliser React.cache() pour dédupliquer les appels dans une même requête HTTP
// (ex: (app)/layout.tsx et sidebar-stats/route.ts appellent la même fonction pour le même userId)
export const getActivePlan = cache(async (userId: string) => {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
    orderBy: { createdAt: "desc" }
  })
  return sub?.plan || null
})
