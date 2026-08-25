import { AppShell } from "@/components/layout/AppShell"
import { auth } from "@/lib/auth"
import { getActivePlan } from "@/lib/subscriptions"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Suspense } from "react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}><div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%" }} /></div>}>
      <AppLayoutLoader>{children}</AppLayoutLoader>
    </Suspense>
  )
}

async function AppLayoutLoader({ children }: { children: React.ReactNode }) {
  const session = await auth()
  let features = {}
  let backtestAccess = false

  // Guard : rediriger les utilisateurs non authentifiés
  if (!session?.user?.id) {
    redirect("/login")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true }
  })

  if (user && !user.onboarded) {
    redirect("/onboarding")
  }

  const plan = await getActivePlan(session.user.id)
  const userRole = (session.user as any).role
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN"

  const baseFeatures = plan?.features as Record<string, boolean> | undefined || {}
  features = isAdmin
    ? { replayAccess: true, propFirmAccess: true, advancedStats: true, backtestAccess: true }
    : baseFeatures
  backtestAccess = isAdmin ? true : !!plan?.backtestAccess

  return <AppShell initialFeatures={features} initialBacktestAccess={backtestAccess}>{children}</AppShell>
}