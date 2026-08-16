import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileManager } from "./ProfileManager"
import { AchievementsSection } from "@/components/achievements/AchievementsSection"
import { DangerZone } from "./DangerZone"
import { cookies } from "next/headers"
import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata = {
  title: "Profile",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) return null

  const role = (session.user as unknown as Record<string, unknown>).role as string | undefined
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN"

  const accountIds = await prisma.tradingAccount.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  })

  const [accountCount, challengeCount, setupCount, journalCount, tradeCount] = await Promise.all([
    prisma.tradingAccount.count({ where: { userId: session.user.id } }),
    prisma.propChallenge.count({ where: { userId: session.user.id } }),
    prisma.tradingSetup.count({ where: { userId: session.user.id } }),
    prisma.dailyJournal.count({ where: { userId: session.user.id } }),
    prisma.trade.count({ where: { accountId: { in: accountIds.map(a => a.id) } } }),
  ])

  const cookieStore = await cookies()
  const uiDensity = cookieStore.get("ui_density")?.value || "comfortable"

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account and preferences.</p>
        </div>
        {isAdmin && (
          <Link href="/admin" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem" }}>
            <Shield size={14} /> Admin Panel
          </Link>
        )}
      </div>
      <ProfileManager
        user={{ ...user, dailyGoal: user.dailyGoal ? Number(user.dailyGoal) : null, monthlyGoal: user.monthlyGoal ? Number(user.monthlyGoal) : null } as any}
        initialDensity={uiDensity}
        stats={{ accounts: accountCount, challenges: challengeCount, setups: setupCount, journals: journalCount, trades: tradeCount }}
      />
      <div style={{ marginTop: "1.5rem" }}>
        <AchievementsSection />
      </div>
      <div style={{ marginTop: "1.5rem" }}>
        <DangerZone />
      </div>
    </div>
  )
}
