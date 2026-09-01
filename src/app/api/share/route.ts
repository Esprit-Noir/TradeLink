import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const shareSchema = z.object({
  entityType: z.enum(["challenge", "profile"]),
  entityId: z.string().min(1).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = shareSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { entityType, entityId } = parsed.data

    // Verify ownership of the entity
    if (entityType === "challenge") {
      const challenge = await prisma.propChallenge.findUnique({
        where: { id: entityId },
      })
      if (!challenge || challenge.userId !== session.user.id) {
        return NextResponse.json({ error: "Challenge not found or not owned by user" }, { status: 404 })
      }
    }

    // Upsert ShareLink (one per entity per user)
    const effectiveEntityId = entityType === "profile" ? session.user.id : entityId!
    let shareLink = await prisma.shareLink.findFirst({
      where: {
        userId: session.user.id,
        entityType,
        entityId: effectiveEntityId,
      }
    })

    if (!shareLink) {
      shareLink = await prisma.shareLink.create({
        data: {
          userId: session.user.id,
          entityType,
          entityId: effectiveEntityId,
          isPublic: true,
        }
      })
    } else if (!shareLink.isPublic) {
      shareLink = await prisma.shareLink.update({
        where: { id: shareLink.id },
        data: { isPublic: true }
      })
    }

    return NextResponse.json({ url: `/share/${shareLink.id}` })
  } catch (error) {
    console.error("Failed to generate share link", error)
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 })
  }
}
