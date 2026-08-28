import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const POSTSchema = z.object({
  subject: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { messages: true } },
        assignedAdmin: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Get Tickets Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = POSTSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session.user.id,
        subject: parsed.data.subject,
        priority: parsed.data.priority,
        messages: {
          create: {
            senderId: session.user.id,
            content: parsed.data.content,
          },
        },
      },
      include: { messages: true },
    })

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Create Ticket Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
