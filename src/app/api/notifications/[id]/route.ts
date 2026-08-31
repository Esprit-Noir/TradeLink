import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const event = await prisma.propChallengeEvent.findUnique({
      where: { id },
      include: { challenge: { select: { userId: true } } },
    })

    if (!event || event.challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    await prisma.propChallengeEvent.update({
      where: { id },
      data: { readAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
