"use client"

import { useState } from "react"
import Link from "next/link"
import { AdminTable, Column } from "@/components/admin/AdminTable"
import { Badge } from "@/components/admin/Badge"

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: Date
  user: { id: string; email: string; name: string | null }
  assignedAdmin: { id: string; email: string; name: string | null } | null
  _count: { messages: number }
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "default",
}

export function SupportTicketsTable({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets] = useState(initialTickets)
  const [statusFilter, setStatusFilter] = useState("")

  const filteredTickets = statusFilter ? tickets.filter(t => t.status === statusFilter) : tickets

  const columns: Column<Ticket>[] = [
    {
      key: "subject",
      label: "Subject",
      render: (ticket) => (
        <Link href={`/admin/support/${ticket.id}`} style={{ textDecoration: "none" }}>
          <div>
            <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>{ticket.subject}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
              by {ticket.user.email} · {ticket._count.messages} messages
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (ticket) => (
        <Badge variant={STATUS_VARIANTS[ticket.status] || "default"}>
          {ticket.status}
        </Badge>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (ticket) => (
        <Badge variant={ticket.priority === "urgent" ? "danger" : ticket.priority === "high" ? "warning" : "default"}>
          {ticket.priority}
        </Badge>
      ),
    },
    {
      key: "assignedAdmin",
      label: "Assigned To",
      render: (ticket) => ticket.assignedAdmin ? (
        <span style={{ fontSize: "0.8rem" }}>{ticket.assignedAdmin.email}</span>
      ) : (
        <span style={{ color: "var(--color-gray-600)" }}>Unassigned</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (ticket) => (
        <span style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-300)", fontSize: "0.8rem" }}
        >
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={filteredTickets}
        totalItems={filteredTickets.length}
        currentPage={1}
        onPageChange={() => {}}
      />
    </div>
  )
}
