"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/admin/Badge"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { ArrowLeft, UserX, UserCheck, Trash2, LogIn, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  deletedAt: Date | null
  _count: { accounts: number; backtestSessions: number; dailyJournals: number }
  accounts: { id: string; name: string; broker: string | null; type: string }[]
  adminActionLogs: {
    id: string
    action: string
    reason: string | null
    createdAt: Date
    admin: { email: string; name: string | null }
  }[]
}

export function UserDetailClient({ user }: { user: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [reason, setReason] = useState("")

  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    setLoading(true)
    try {
      if (action === "impersonate") {
        const res = await fetch(`/api/admin/users/${user.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason, ...extra }),
        })
        if (res.ok) {
          const data = await res.json()
          window.location.href = `/dashboard?impersonate=${data.impersonate.userId}`
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, action, reason, ...extra }),
        })
        if (res.ok) {
          router.refresh()
          setConfirmAction(null)
          setReason("")
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = () => {
    switch (confirmAction) {
      case "suspend": return "Suspend User"
      case "activate": return "Activate User"
      case "ban": return "Ban User"
      case "delete": return "Delete User"
      case "impersonate": return "Impersonate User"
      default: return ""
    }
  }

  const getActionMessage = () => {
    switch (confirmAction) {
      case "suspend": return `Suspend ${user.email}? They will not be able to log in.`
      case "activate": return `Reactivate ${user.email}? They will be able to log in again.`
      case "ban": return `Ban ${user.email}? This is a severe action. They will be blocked from logging in.`
      case "delete": return `Soft delete ${user.email}? Their data will be preserved but they won't appear in the platform.`
      case "impersonate": return `You will be logged in as ${user.email} for 30 minutes. This action is logged.`
      default: return ""
    }
  }

  return (
    <div>
      <Link href="/admin/users" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--color-gray-400)", textDecoration: "none", marginBottom: 16, fontSize: "0.8rem" }}>
        <ArrowLeft size={14} /> Back to Users
      </Link>

      {/* Header */}
      <div className="chart-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{user.email}</h1>
            {user.name && <p style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginTop: 4 }}>{user.name}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Badge variant={user.role === "SUPER_ADMIN" ? "warning" : user.role === "ADMIN" ? "info" : "default"}>{user.role}</Badge>
              <Badge variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "warning" : "danger"}>{user.status}</Badge>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user.status === "ACTIVE" ? (
              <button onClick={() => setConfirmAction("suspend")} className="btn btn-outline" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                <UserX size={14} /> Suspend
              </button>
            ) : (
              <button onClick={() => setConfirmAction("activate")} className="btn btn-outline" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
                <UserCheck size={14} /> Activate
              </button>
            )}
            <button onClick={() => setConfirmAction("ban")} className="btn btn-outline" style={{ fontSize: "0.75rem", color: "var(--color-loss)", borderColor: "rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
              <AlertTriangle size={14} /> Ban
            </button>
            <button onClick={() => setConfirmAction("impersonate")} className="btn btn-outline" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 4 }}>
              <LogIn size={14} /> Impersonate
            </button>
            <button onClick={() => setConfirmAction("delete")} className="btn btn-outline" style={{ fontSize: "0.75rem", color: "var(--color-loss)", borderColor: "rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: 4 }}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
        {[
          { label: "Accounts", value: user._count.accounts },
          { label: "Backtests", value: user._count.backtestSessions },
          { label: "Journal Entries", value: user._count.dailyJournals },
        ].map(s => (
          <div key={s.label} className="chart-card" style={{ padding: "1rem" }}>
            <p style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 600, letterSpacing: "0.08em" }}>{s.label}</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-200)", marginTop: 4 }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        {/* Accounts */}
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 12 }}>Trading Accounts</h3>
          {user.accounts.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>No accounts</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {user.accounts.map(acc => (
                <div key={acc.id} style={{ padding: "0.5rem 0.75rem", borderRadius: 6, background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)" }}>
                  <div style={{ fontWeight: 500, color: "var(--color-gray-200)", fontSize: "0.8rem" }}>{acc.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{acc.broker || "—"} · {acc.type}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="chart-card" style={{ padding: "1.25rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 12 }}>Recent Admin Actions</h3>
          {user.adminActionLogs.length === 0 ? (
            <p style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>No actions logged</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {user.adminActionLogs.map(log => (
                <div key={log.id} style={{ padding: "0.5rem 0.75rem", borderRadius: 6, background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 500, color: "var(--color-gray-200)", fontSize: "0.8rem" }}>{log.action}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                    by {log.admin.email} {log.reason && `· ${log.reason}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        title={getActionLabel()}
        message={getActionMessage()}
        confirmLabel={loading ? "Processing..." : "Confirm"}
        variant={confirmAction === "ban" || confirmAction === "delete" ? "danger" : confirmAction === "suspend" ? "warning" : "default"}
        onConfirm={() => confirmAction && handleAction(confirmAction)}
        onCancel={() => { setConfirmAction(null); setReason("") }}
      />

      {/* Reason Input (for suspend/ban) */}
      {confirmAction && (confirmAction === "suspend" || confirmAction === "ban") && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 101, width: "100%", maxWidth: 400, padding: "0 16px" }}>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: 8, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-200)", fontSize: "0.8rem", outline: "none" }}
          />
        </div>
      )}
    </div>
  )
}
