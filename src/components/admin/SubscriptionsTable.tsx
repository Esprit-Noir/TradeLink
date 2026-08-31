"use client"

import { useState } from "react"
import { AdminTable, Column } from "@/components/admin/AdminTable"
import { Badge } from "@/components/admin/Badge"

export interface Subscription {
  id: string
  status: string
  startDate: Date
  renewalDate: Date | null
  user: { id: string; email: string; name: string | null }
  plan: { id: string; name: string; price: number }
  cryptoTxId: string | null
}

export interface Plan {
  id: string
  name: string
  price: number
}

export function SubscriptionsTable({ initialSubscriptions, plans }: { initialSubscriptions: Subscription[]; plans: Plan[] }) {
  const [subscriptions] = useState(initialSubscriptions)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [isApproving, setIsApproving] = useState<string | null>(null)

  const handleApprove = async (subscriptionId: string) => {
    setIsApproving(subscriptionId)
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId, status: "ACTIVE" }),
      })
      if (res.ok) {
        window.location.reload()
      }
    } catch {
      setIsApproving(null)
    }
  }

  const handleAssignPlan = async (userId: string) => {
    if (!selectedPlanId) return

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, planId: selectedPlanId }),
      })
      if (res.ok) {
        setEditingUserId(null)
        setSelectedPlanId("")
        window.location.reload()
      }
    } catch {
      // silent
    }
  }

  const columns: Column<Subscription>[] = [
    {
      key: "user",
      label: "User",
      render: (sub) => (
        <div>
          <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>{sub.user.email}</div>
          {sub.user.name && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{sub.user.name}</div>}
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (sub) => editingUserId === sub.user.id ? (
        <div style={{ display: "flex", gap: 4 }}>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            style={{ padding: "0.3rem 0.5rem", borderRadius: 4, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-200)", fontSize: "0.75rem" }}
          >
            <option value="">Select plan</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
            ))}
          </select>
          <button onClick={() => handleAssignPlan(sub.user.id)} className="btn btn-primary" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>Save</button>
          <button onClick={() => setEditingUserId(null)} className="btn btn-outline" style={{ fontSize: "0.65rem", padding: "0.2rem 0.5rem" }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{sub.plan.name}</span>
          <button
            onClick={() => { setEditingUserId(sub.user.id); setSelectedPlanId(sub.plan.id) }}
            style={{ fontSize: "0.65rem", color: "var(--color-brand-500)", background: "transparent", border: "none", cursor: "pointer" }}
          >
            Change
          </button>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (sub) => (
        <Badge variant={sub.status === "ACTIVE" ? "success" : sub.status === "CANCELED" ? "warning" : "default"}>
          {sub.status}
        </Badge>
      ),
    },
    {
      key: "startDate",
      label: "Start Date",
      render: (sub) => new Date(sub.startDate).toLocaleDateString(),
    },
    {
      key: "renewalDate",
      label: "Renewal",
      render: (sub) => sub.renewalDate ? new Date(sub.renewalDate).toLocaleDateString() : "—",
    },
    {
      key: "crypto",
      label: "Crypto Payment",
      render: (sub) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150 }}>
          {sub.cryptoTxId ? (
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", wordBreak: "break-all" }}>
              <span style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>TxID:</span> {sub.cryptoTxId}
            </div>
          ) : (
            <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>No TxID</span>
          )}
          {sub.status === "PENDING" && (
            <button
              onClick={() => handleApprove(sub.id)}
              disabled={isApproving === sub.id}
              className="btn btn-primary"
              style={{ fontSize: "0.7rem", padding: "0.3rem 0.5rem", width: "fit-content" }}
            >
              {isApproving === sub.id ? "Approving..." : "Approve Payment"}
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AdminTable
      columns={columns}
      data={subscriptions}
      totalItems={subscriptions.length}
      currentPage={1}
      onPageChange={() => {}}
    />
  )
}
