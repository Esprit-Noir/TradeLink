import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { evaluateChallenge } from "@/lib/prop-firm.service"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const challenge = await prisma.propChallenge.findUnique({
      where: { id }
    })

    if (!challenge || challenge.userId !== session.user.id) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const updatedChallenge = await evaluateChallenge(id)

    return NextResponse.json(updatedChallenge)
  } catch (error: any) {
    console.error("Error recalculating challenge:", error)
    return NextResponse.json({ error: "Failed to recalculate" }, { status: 500 })
  }
}
