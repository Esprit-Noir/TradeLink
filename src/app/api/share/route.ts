import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { entityType, entityId } = await req.json()
    if (!entityType || !entityId) {
      return NextResponse.json({ error: "Missing entityType or entityId" }, { status: 400 })
    }

    // Verify ownership of the entity
    if (entityType === "challenge") {
      const challenge = await prisma.propChallenge.findUnique({
        where: { id: entityId },
      })
      if (!challenge || challenge.userId !== session.user.id) {
        return NextResponse.json({ error: "Challenge not found or not owned by user" }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: "Unsupported entity type" }, { status: 400 })
    }

    // Upsert ShareLink (one per entity per user)
    let shareLink = await prisma.shareLink.findFirst({
      where: {
        userId: session.user.id,
        entityType,
        entityId,
      }
    })

    if (!shareLink) {
      shareLink = await prisma.shareLink.create({
        data: {
          userId: session.user.id,
          entityType,
          entityId,
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
  } catch (error: any) {
    console.error("Failed to generate share link", error)
    return NextResponse.json({ error: "Failed to generate share link" }, { status: 500 })
  }
}
