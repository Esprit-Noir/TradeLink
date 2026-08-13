import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function assertOwnership(challengeId: string, userId: string) {
  const challenge = await prisma.propChallenge.findUnique({
    where: { id: challengeId },
    select: { userId: true },
  })
  if (!challenge || challenge.userId !== userId) {
    return false
  }
  return true
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    if (!(await assertOwnership(id, session.user.id))) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const notes = await prisma.propChallengeNote.findMany({
      where: { challengeId: id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(notes)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notes" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id } = await params
    if (!(await assertOwnership(id, session.user.id))) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 })
    }

    const body = await request.json()
    const content = (body.content || "").trim()
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const note = await prisma.propChallengeNote.create({
      data: { challengeId: id, content },
    })
    return NextResponse.json(note, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create note" }, { status: 500 })
  }
}
