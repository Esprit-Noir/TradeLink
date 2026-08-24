import { AppShell } from "@/components/layout/AppShell"
import { auth } from "@/lib/auth"
import { getActivePlan } from "@/lib/subscriptions"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  let features = {}
  let backtestAccess = false

  if (session?.user?.id) {
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
  }

  return <AppShell initialFeatures={features} initialBacktestAccess={backtestAccess}>{children}</AppShell>
}