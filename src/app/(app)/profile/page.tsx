import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileManager } from "./ProfileManager"
import { cookies } from "next/headers"

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
      </div>
      <ProfileManager
        user={{ ...user, dailyGoal: user.dailyGoal ? Number(user.dailyGoal) : null } as any}
        initialDensity={uiDensity}
        stats={{ accounts: accountCount, challenges: challengeCount, setups: setupCount, journals: journalCount, trades: tradeCount }}
      />
    </div>
  )
}
