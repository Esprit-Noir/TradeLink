"use client"

import React, { useState, useEffect } from "react"
import { toast } from "sonner"
import { Wallet, CheckCircle2, Clock, Plus } from "lucide-react"

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

export function PayoutsManager() {
  const [payouts, setPayouts] = useState<any[]>([])
  const [totals, setTotals] = useState({ paid: 0, approved: 0, requested: 0, pending: 0 })
  const [fundedChallenges, setFundedChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Register form
  const [challengeId, setChallengeId] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const refresh = async () => {
    try {
      const res = await fetch("/api/prop-firms/payouts")
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts || [])
        setTotals(data.totals || { paid: 0, approved: 0, requested: 0, pending: 0 })
        setFundedChallenges(data.fundedChallenges || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const registerPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeId) {
      toast.error("Select a funded account")
      return
    }
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error("Enter a valid amount")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          requestedAt: date ? `${date}T12:00:00Z` : undefined,
          note,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Failed to register payout")
      toast.success("Payout registered")
      setChallengeId("")
      setAmount("")
      setNote("")
      setModalOpen(false)
      await refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to register payout")
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (p: any, status: string) => {
    if (status === p.status) return
    try {
      const res = await fetch(`/api/challenges/${p.challengeId}/payouts/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update payout")
      toast.success(`Payout marked ${status}`)
      await refresh()
    } catch {
      toast.error("Failed to update payout")
    }
  }

  const deletePayout = async (p: any) => {
    if (!confirm("Delete this payout?")) return
    try {
      const res = await fetch(`/api/challenges/${p.challengeId}/payouts/${p.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete payout")
      toast.success("Payout removed")
      await refresh()
    } catch {
      toast.error("Failed to delete payout")
    }
  }

  const fmt = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2 })}`

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Payouts</h1>
          <p className="page-subtitle">Withdrawals are only available on funded accounts.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Register Payout
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
            <CheckCircle2 size={14} /> Total Paid
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-profit)" }}>{fmt(totals.paid)}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-500)" }}>
            {payouts.filter(p => p.status === 'paid').length} payout{payouts.filter(p => p.status === 'paid').length > 1 ? "s" : ""} paid
          </div>
        </div>
        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
            <Clock size={14} /> Pending
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-warning)" }}>{fmt(totals.pending)}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-500)" }}>
            {payouts.filter(p => p.status === 'requested' || p.status === 'approved').length} awaiting payment
          </div>
        </div>
        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
            <Wallet size={14} /> Approved
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-brand-500)" }}>{fmt(totals.approved)}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-500)" }}>
            {payouts.filter(p => p.status === 'approved').length} approved
          </div>
        </div>
        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>
            <Wallet size={14} /> Funded accounts
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-text)" }}>{fundedChallenges.length}</div>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-500)" }}>
            eligible for payouts
          </div>
        </div>
      </div>

      {/* Register modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }} onClick={() => setModalOpen(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 460, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>Register Payout</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.4rem" }}>&times;</button>
            </div>

            {fundedChallenges.length === 0 ? (
              <div style={{ padding: "1rem 0", fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                No funded accounts yet. Funded accounts are only eligible once a challenge reaches the funded phase.
              </div>
            ) : (
              <form onSubmit={registerPayout} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Funded account</label>
                  <select className="input" value={challengeId} onChange={e => setChallengeId(e.target.value)}>
                    <option value="">Select a funded account…</option>
                    {fundedChallenges.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.firmName} — {c.accountName} — equity {fmt(c.currentEquity)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (USD)</label>
                  <input className="input" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Note (optional)</label>
                  <input className="input" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. monthly withdrawal" />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "..." : "Register"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Payouts table */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-gray-100)" }}>All payouts</h3>
          <span style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
            {payouts.length} total
          </span>
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 120 }} />
        ) : payouts.length === 0 ? (
          <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>💸</div>
            <div style={{ fontWeight: 700, color: "var(--color-gray-200)" }}>No payouts yet</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.35rem" }}>
              Register your first payout from a funded account above.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "var(--color-gray-900)", color: "var(--color-gray-400)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Firm</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Account</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Amount</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Date</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Note</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Status</th>
                  <th style={{ padding: "0.6rem 0.75rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => {
                  const st = PAYOUT_STATUS[p.status] || { label: p.status, color: "var(--color-gray-400)" }
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--color-gray-800)", color: "var(--color-gray-300)" }}>
                      <td style={{ padding: "0.5rem 0.75rem", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                          {p.logoUrl && (
                            <span style={{ width: 18, height: 18, borderRadius: 4, overflow: "hidden", background: "var(--color-gray-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.logoUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                            </span>
                          )}
                          <span style={{ fontWeight: 600, color: "var(--color-gray-100)" }}>{p.firmName}</span>
                        </span>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", whiteSpace: "nowrap" }}>{p.accountName}</td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", fontWeight: 600, color: "var(--color-gray-100)", whiteSpace: "nowrap" }}>{fmt(p.amount)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", whiteSpace: "nowrap", color: "var(--color-gray-400)" }}>{formatDate(p.requestedAt)}</td>
                      <td style={{ padding: "0.5rem 0.75rem", color: "var(--color-gray-400)", maxWidth: 220 }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.note || ""}>{p.note || "—"}</span>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", whiteSpace: "nowrap" }}>
                        <select
                          className="input"
                          value={p.status}
                          onChange={e => updateStatus(p, e.target.value)}
                          style={{ padding: "0.3rem 1.8rem 0.3rem 0.6rem", fontSize: "0.75rem", width: "auto", color: st.color }}
                        >
                          {Object.entries(PAYOUT_STATUS).map(([key, s]) => (
                            <option key={key} value={key} style={{ color: "var(--color-gray-100)" }}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => deletePayout(p)}
                          className="btn btn-outline"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", color: "var(--color-loss)" }}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
