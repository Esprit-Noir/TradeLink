import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { UserDetailClient } from "@/components/admin/UserDetailClient"

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      deletedAt: true,
      _count: {
        select: {
          accounts: true,
          backtestSessions: true,
          dailyJournals: true,
        },
      },
      accounts: {
        select: { id: true, name: true, broker: true, type: true },
      },
      adminActionLogs: {
        where: { targetUserId: id },
        include: { admin: { select: { email: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!user) notFound()

  return <UserDetailClient user={user} />
}
