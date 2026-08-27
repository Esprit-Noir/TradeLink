import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const currentUserId = session.user.id

    // Fetch top 50 active users ordered by their number of unlocked achievements
    const topUsers = await prisma.user.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        _count: {
          select: { achievements: true },
        },
      },
      orderBy: {
        achievements: {
          _count: "desc",
        },
      },
      take: 50,
    })

    // Map the results to the leaderboard format
    const leaderboard = topUsers.map((user, index) => {
      const trophies = user._count.achievements
      const level = Math.floor(trophies / 3) + 1
      return {
        id: user.id,
        name: user.name || "Anonymous Trader",
        level,
        trophies,
        isCurrentUser: user.id === currentUserId,
        rank: index + 1,
      }
    })

    // If the current user is not in the top 50, we might want to append them at the end.
    // For simplicity, we just return the top 50. If they are in it, `isCurrentUser` will be true.
    const currentUserInTop50 = leaderboard.some(u => u.isCurrentUser)

    if (!currentUserInTop50) {
      // Fetch the current user's stats explicitly
      const currentUserStats = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          name: true,
          _count: {
            select: { achievements: true },
          },
        },
      })

      if (currentUserStats) {
        // Since Prisma in this version might not support relation count filtering,
        // we'll just set their rank to "50+" or we can fetch all and sort. 
        // For performance, we'll append them with a rank of `50+` if they aren't in the top 50.
        const userTrophies = currentUserStats._count.achievements

        leaderboard.push({
          id: currentUserStats.id,
          name: currentUserStats.name || "Anonymous Trader",
          level: Math.floor(userTrophies / 3) + 1,
          trophies: userTrophies,
          isCurrentUser: true,
          rank: 999,
        })
      }
    }

    return NextResponse.json(leaderboard)
  } catch (error: any) {
    console.error("Leaderboard API Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
