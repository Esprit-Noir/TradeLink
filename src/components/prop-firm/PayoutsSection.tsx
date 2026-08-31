"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"

const PAYOUT_STATUS: Record<string, { label: string; color: string }> = {
  requested: { label: "Requested", color: "var(--color-warning)" },
  approved: { label: "Approved", color: "var(--color-brand-500)" },
  paid: { label: "Paid", color: "var(--color-profit)" },
  rejected: { label: "Rejected", color: "var(--color-loss)" },
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

interface SectionPayout {
  id: string
  status: string
  amount: number | string
  requestedAt: string
  note?: string | null
}

export function PayoutsSection({ challengeId }: { challengeId: string }) {
  const [payouts, setPayouts] = useState<SectionPayout[]>([])
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutDate, setPayoutDate] = useState("")

  useEffect(() => {
    setPayoutDate(new Date().toISOString().slice(0, 10))
  }, [])
  const [payoutNote, setPayoutNote] = useState("")
  const [savingPayout, setSavingPayout] = useState(false)

  const refresh = async () => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/payouts`)
      if (res.ok) setPayouts(await res.json())
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  const requestPayout = async () => {
    if (!payoutAmount || isNaN(parseFloat(payoutAmount))) {
      toast.error("Enter a valid amount")
      return
    }
    setSavingPayout(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(payoutAmount),
          requestedAt: payoutDate ? `${payoutDate}T12:00:00Z` : undefined,
          note: payoutNote,
        }),
      })
      if (!res.ok) throw new Error("Failed to request payout")
      setPayoutAmount("")
      setPayoutNote("")
      await refresh()
      toast.success("Payout requested")
    } catch {
      toast.error("Failed to request payout")
    } finally {
      setSavingPayout(false)
    }
  }

  const updatePayoutStatus = async (payoutId: string, status: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update payout")
      await refresh()
    } catch {
      toast.error("Failed to update payout")
    }
  }

  const deletePayout = async (payoutId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/payouts/${payoutId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete payout")
      setPayouts(payouts.filter(p => p.id !== payoutId))
      toast.success("Payout removed")
    } catch {
      toast.error("Failed to delete payout")
    }
  }

  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-gray-100)" }}>Payouts</h3>
      <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "1rem" }}>
        Total paid: <span style={{ color: "var(--color-profit)", fontWeight: 600 }}>${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="number"
            className="input"
            value={payoutAmount}
            onChange={e => setPayoutAmount(e.target.value)}
            placeholder="Amount (USD)"
            style={{ flex: 1 }}
          />
          <input
            type="date"
            className="input"
            value={payoutDate}
            onChange={e => setPayoutDate(e.target.value)}
            style={{ width: 170 }}
          />
          <button onClick={requestPayout} disabled={savingPayout} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            {savingPayout ? "..." : "Request"}
          </button>
        </div>
        <input
          type="text"
          className="input"
          value={payoutNote}
          onChange={e => setPayoutNote(e.target.value)}
          placeholder="Note (optional)"
        />
      </div>

      {payouts.length === 0 ? (
        <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem", padding: "1rem 0" }}>
          No payouts yet. Funded accounts can request withdrawals here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {payouts.map(p => {
            const st = PAYOUT_STATUS[p.status] || { label: p.status, color: "var(--color-gray-400)" }
            return (
              <div key={p.id} style={{
                background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
                borderRadius: "10px", padding: "0.75rem 1rem",
                display: "flex", alignItems: "center", gap: "0.75rem",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "var(--color-gray-100)" }}>${Number(p.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{formatDate(p.requestedAt)}</div>
                  {p.note && (
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", marginTop: "0.2rem" }}>{p.note}</div>
                  )}
                </div>
                <span className="badge" style={{ background: `${st.color}22`, color: st.color, border: `1px solid ${st.color}40` }}>
                  {st.label.toUpperCase()}
                </span>
                {p.status !== 'paid' && (
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    {p.status === 'requested' && (
                      <button
                        onClick={() => updatePayoutStatus(p.id, p.status)}
                        className="btn btn-outline"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        Approve
                      </button>
                    )}
                    {p.status === 'approved' && (
                      <button
                        onClick={() => updatePayoutStatus(p.id, p.status)}
                        className="btn btn-outline"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        Mark Paid
                      </button>
                    )}
                    <button
                      onClick={() => updatePayoutStatus(p.id, 'rejected')}
                      className="btn btn-outline"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "var(--color-loss)" }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {p.status === 'rejected' && (
                  <button
                    onClick={() => updatePayoutStatus(p.id, 'requested')}
                    className="btn btn-outline"
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                  >
                    Reopen
                  </button>
                )}
                <button
                  onClick={() => deletePayout(p.id)}
                  aria-label="Delete payout"
                  className="btn btn-outline"
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", color: "var(--color-loss)" }}
                >
                  &times;
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
