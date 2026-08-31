import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateNoteSchema = z.object({
  content: z.string().min(1).max(5000),
})

async function assertOwnership(noteId: string, userId: string) {
  const note = await prisma.propChallengeNote.findUnique({
    where: { id: noteId },
    include: { challenge: { select: { userId: true } } },
  })
  if (!note || note.challenge.userId !== userId) return null
  return note
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { noteId } = await params
    const note = await assertOwnership(noteId, session.user.id)
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateNoteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { content } = parsed.data

    const updated = await prisma.propChallengeNote.update({
      where: { id: noteId },
      data: { content },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { noteId } = await params
    const note = await assertOwnership(noteId, session.user.id)
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.propChallengeNote.delete({ where: { id: noteId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
