import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 })
  }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as Record<string, unknown>).role
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const c = await prisma.propChallenge.findMany({
      where: { userId: session.user.id },
      include: { account: true },
    })
    const snaps = await prisma.propChallengeDailySnapshot.findMany({
      where: { challenge: { userId: session.user.id } },
    })
    return NextResponse.json({ challenges: c, snapshots: snaps })
  } catch (error) {
    console.error("[DEBUG_GET]", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
