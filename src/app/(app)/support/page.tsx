import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { NewTicketForm } from "@/components/support/NewTicketForm"

export default async function SupportPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { messages: true } },
      assignedAdmin: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Support</h1>
        <p className="page-subtitle">Get help with your account</p>
      </div>

      <NewTicketForm />

      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 12 }}>Your Tickets</h2>
        {tickets.length === 0 ? (
          <p style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No tickets yet</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tickets.map(ticket => (
              <div key={ticket.id} className="chart-card" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>{ticket.subject}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: 2 }}>
                      {ticket.status} · {ticket._count.messages} messages · {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {ticket.assignedAdmin && (
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                      Assigned to {ticket.assignedAdmin.name || ticket.assignedAdmin.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
