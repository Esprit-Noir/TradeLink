import { prisma } from "@/lib/prisma"
import { SupportTicketsTable } from "@/components/admin/SupportTicketsTable"

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { id: true, email: true, name: true } },
      assignedAdmin: { select: { id: true, email: true, name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Support Tickets</h1>
        <p className="page-subtitle">Manage user support requests</p>
      </div>
      <SupportTicketsTable initialTickets={tickets} />
    </div>
  )
}
