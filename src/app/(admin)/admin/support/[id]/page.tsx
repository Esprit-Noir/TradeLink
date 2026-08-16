import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { TicketDetailClient } from "@/components/admin/TicketDetailClient"

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  if (!ticket) notFound()

  return <TicketDetailClient ticket={ticket} />
}
