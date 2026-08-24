"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/admin/Badge"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  content: string
  createdAt: Date
  sender: { id: string; email: string; name: string | null }
}

interface Ticket {
  id: string
  subject: string
  status: string
  priority: string
  createdAt: Date
  user: { id: string; email: string; name: string | null }
  assignedAdmin: { id: string; email: string; name: string | null } | null
  messages: Message[]
}

const STATUS_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "info",
  IN_PROGRESS: "warning",
  RESOLVED: "success",
  CLOSED: "default",
}

export function TicketDetailClient({ ticket }: { ticket: Ticket }) {
  const router = useRouter()
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(ticket.status)

  const handleReply = async () => {
    if (!reply.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply }),
      })
      if (res.ok) {
        setReply("")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Link href="/admin/support" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-gray-400)", textDecoration: "none", marginBottom: 16, fontSize: "0.8rem" }}>
        <ArrowLeft size={14} /> Back to Tickets
      </Link>

      {/* Header */}
      <div className="chart-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{ticket.subject}</h1>
            <p style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginTop: 4 }}>
              by {ticket.user.email} · {new Date(ticket.createdAt).toLocaleString()}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Badge variant={STATUS_VARIANTS[status] || "default"}>{status}</Badge>
              <Badge variant={ticket.priority === "urgent" ? "danger" : ticket.priority === "high" ? "warning" : "default"}>
                {ticket.priority}
              </Badge>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={s === status}
                className="btn btn-outline"
                style={{ fontSize: "0.7rem", opacity: s === status ? 0.5 : 1 }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chart-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 500, overflowY: "auto" }}>
          {ticket.messages.map(msg => {
            const isAdmin = msg.sender.id !== ticket.user.id
            return (
              <div key={msg.id} style={{
                padding: "0.75rem 1rem",
                borderRadius: 8,
                background: isAdmin ? "rgba(139,92,246,0.08)" : "var(--color-gray-950)",
                border: `1px solid ${isAdmin ? "rgba(139,92,246,0.2)" : "var(--color-gray-800)"}`,
                marginLeft: isAdmin ? "2rem" : 0,
                marginRight: isAdmin ? 0 : "2rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: isAdmin ? "#8b5cf6" : "var(--color-gray-300)" }}>
                    {isAdmin ? "Admin" : msg.sender.email}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "var(--color-gray-500)" }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-gray-300)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{msg.content}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reply */}
      <div className="chart-card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 12 }}>Reply</h3>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply..."
          rows={4}
          style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-950)", color: "var(--color-gray-200)", fontSize: "0.8rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button onClick={handleReply} disabled={loading || !reply.trim()} className="btn btn-primary" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
            <Send size={14} /> {loading ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </div>
    </div>
  )
}
