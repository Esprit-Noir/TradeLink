"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"

export function NewTicketForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState("normal")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !content.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content, priority }),
      })
      if (res.ok) {
        setOpen(false)
        setSubject("")
        setContent("")
        setPriority("normal")
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-primary" style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 6 }}>
        <Plus size={14} /> New Ticket
      </button>
    )
  }

  return (
    <div className="chart-card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)" }}>New Support Ticket</h3>
        <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer" }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--color-gray-400)", marginBottom: 4, fontWeight: 600 }}>Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-950)", color: "var(--color-gray-200)", fontSize: "0.8rem", outline: "none" }}
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--color-gray-400)", marginBottom: 4, fontWeight: 600 }}>Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-950)", color: "var(--color-gray-200)", fontSize: "0.8rem" }}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.7rem", color: "var(--color-gray-400)", marginBottom: 4, fontWeight: 600 }}>Message</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your issue in detail..."
            rows={5}
            style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-950)", color: "var(--color-gray-200)", fontSize: "0.8rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={() => setOpen(false)} className="btn btn-outline" style={{ fontSize: "0.8rem" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !subject.trim() || !content.trim()} className="btn btn-primary" style={{ fontSize: "0.8rem" }}>
            {loading ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  )
}
