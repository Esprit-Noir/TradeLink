import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const POSTSchema = z.object({
  content: z.string().min(1),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  const { id } = await params

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      assignedAdmin: { select: { id: true, email: true, name: true } },
      messages: {
        include: { sender: { select: { id: true, email: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  return NextResponse.json({ ticket })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  const { id } = await params
  const body = await request.json()
  const parsed = POSTSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id } })
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  // Add message
  const message = await prisma.supportMessage.create({
    data: {
      ticketId: id,
      senderId: session.user.id,
      content: parsed.data.content,
    },
  })

  // Update ticket status to IN_PROGRESS if OPEN
  if (ticket.status === "OPEN") {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: "IN_PROGRESS", assignedAdminId: session.user.id },
    })
  }

  return NextResponse.json({ message })
}
