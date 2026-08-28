"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { CreateAccountModal } from "./CreateAccountModal"
import { Wallet, Target, Activity, TrendingUp, Pencil, Trash2, ExternalLink } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { toast } from "sonner"

export function AccountsManager({ accounts }: { accounts: any[] }) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [editing, setEditing] = useState<any>(null)

  // Global KPIs
  const kpis = useMemo(() => {
    let totalEquity = 0
    let totalPnl = 0
    let totalPnlUsd = 0
    let fundedCapital = 0
    const activeCount = accounts.length

    accounts.forEach(acc => {
      const eq = acc.propChallenge ? acc.propChallenge.currentEquity : acc.initialBalance + acc.stats.totalPnl
      totalEquity += eq
      totalPnl += acc.stats.totalPnl
      totalPnlUsd += acc.stats.totalPnlUsd || 0

      if (acc.type === 'prop_firm' && acc.propChallenge?.status === 'passed') {
        fundedCapital += acc.initialBalance
      }
    })

    return { totalEquity, totalPnl, totalPnlUsd, fundedCapital, activeCount }
  }, [accounts])

  const filteredAccounts = accounts.filter(acc => {
    const type = acc.type || "personal"
    return filterType === "all" || type === filterType
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prop_firm': return "var(--color-brand-500)"
      case 'demo': return "var(--color-gray-400)"
      default: return "var(--color-profit)"
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'prop_firm': return "Prop Firm"
      case 'demo': return "Demo"
      default: return "Personal"
    }
  }

  const openAccount = async (acc: any) => {
    if (acc.propChallenge?.id) {
      router.push(`/challenges/${acc.propChallenge.id}`)
      return
    }
    router.push(`/accounts/${acc.id}`)
  }

  const handleDelete = async (acc: any) => {
    if (!confirm(`Delete account "${acc.name}" and all its trades? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/accounts/${acc.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to delete")
      }
      toast.success("Account deleted")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account")
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      const res = await fetch(`/api/accounts/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editing.name,
          initialBalance: editing.initialBalance,
          fxRateToUsd: editing.fxRateToUsd,
          isDefault: editing.isDefault,
        }),
      })
      if (!res.ok) throw new Error("Failed to update account")
      toast.success("Account updated")
      setEditing(null)
      router.refresh()
    } catch {
      toast.error("Failed to update account")
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">Manage your personal, demo, and prop firm capital</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Add Account
        </button>
      </div>

      <CreateAccountModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Edit modal */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        }} onClick={() => setEditing(null)}>
          <div className="chart-card" style={{ width: "100%", maxWidth: 440, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>Edit Account</h3>
              <button onClick={() => setEditing(null)} aria-label="Close" style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.4rem" }}>&times;</button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Account Name</label>
                <input className="input" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Initial Balance</label>
                <input className="input" type="number" value={editing.initialBalance} onChange={e => setEditing({ ...editing, initialBalance: e.target.value })} />
              </div>
              <div>
                <label className="label">FX Rate to USD</label>
                <input className="input" type="number" step="0.0001" value={editing.fxRateToUsd} onChange={e => setEditing({ ...editing, fxRateToUsd: e.target.value })} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
                <input type="checkbox" checked={!!editing.isDefault} onChange={e => setEditing({ ...editing, isDefault: e.target.checked })} />
                Set as default account
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPIs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-gray-500)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            <Wallet size={16} /> Total Equity
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>
            {formatCurrency(kpis.totalEquity, "USD", false, 2)}
          </div>
        </div>

        <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-gray-500)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            <TrendingUp size={16} /> Total Net P&L
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: kpis.totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>
            {formatCurrency(kpis.totalPnlUsd, "USD", true, 2)}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-500)" }}>in USD equivalent</div>
        </div>

        <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-gray-500)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            <Target size={16} /> Funded Capital (Prop)
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-brand-400)", letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>
            {formatCurrency(kpis.fundedCapital, "USD", false, 2)}
          </div>
        </div>

        <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--color-gray-500)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
            <Activity size={16} /> Active Accounts
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>
            {kpis.activeCount}
          </div>
        </div>
      </div>

      {/* Toolbar (Filters) */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "1rem" }}>
        {["all", "personal", "prop_firm", "demo"].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: filterType === type ? "var(--color-gray-800)" : "transparent",
              color: filterType === type ? "var(--color-text)" : "var(--color-gray-500)",
              border: "none"
            }}
          >
            {type === "all" ? "All Accounts" : getTypeName(type)}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredAccounts.length === 0 && (
        <div className="chart-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🏦</div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-gray-200)" }}>
            {accounts.length === 0 ? "No accounts yet" : "No accounts of this type"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.4rem", marginBottom: "1.25rem" }}>
            {accounts.length === 0
              ? "Add a personal, demo, or prop-firm account to start tracking your performance."
              : "Try a different filter."}
          </div>
          {accounts.length === 0 && (
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Add Account</button>
          )}
        </div>
      )}

      {/* Accounts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.5rem" }}>
        {filteredAccounts.map(acc => {
          const typeColor = getTypeColor(acc.type)
          const currentEquity = acc.propChallenge ? acc.propChallenge.currentEquity : acc.initialBalance + acc.stats.totalPnl
          const returnPct = acc.initialBalance > 0 ? (acc.stats.totalPnl / acc.initialBalance) * 100 : 0

          return (
            <div
              key={acc.id}
              className="card-hover account-type-card"
              onClick={() => openAccount(acc)}
              style={{
                border: `1px solid ${typeColor}40`,
                padding: "1.5rem",
                borderRadius: "16px",
                display: "flex", flexDirection: "column", gap: "1.5rem",
                position: "relative",
                cursor: "pointer",
                ["--account-type-color" as string]: typeColor,
              }}
            >
              {/* Top Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: typeColor, boxShadow: `0 0 10px ${typeColor}` }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.name}</span>
                    {acc.isDefault && (
                      <span style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, background: "var(--color-gray-800)", color: "var(--color-text)", padding: "0.15rem 0.4rem", borderRadius: "4px", flexShrink: 0 }}>Default</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                    {acc.type === 'prop_firm' && acc.propChallenge ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {acc.propChallenge.logoUrl && (
                          <span style={{ width: "18px", height: "18px", borderRadius: "4px", overflow: "hidden", background: "var(--color-gray-800)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={acc.propChallenge.logoUrl} alt={acc.broker || "Broker"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                          </span>
                        )}
                        <span>{acc.propChallenge.firmName}</span>
                        <span> — {formatCurrency(Number(acc.initialBalance), acc.baseCurrency, false, 0)} — {acc.propChallenge.phase === 'phase_1' ? "Phase 1" : acc.propChallenge.phase === 'phase_2' ? "Phase 2" : "Funded"}</span>
                      </span>
                    ) : (
                      <>{acc.broker || "No broker"} — {formatCurrency(Number(acc.initialBalance), acc.baseCurrency, false, 0)}</>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", flexShrink: 0 }}>
                  <span className="badge" style={{ background: "var(--color-bg)", border: `1px solid var(--color-border)`, color: "var(--color-text)" }}>
                    {getTypeName(acc.type)}
                  </span>
                  {acc.type === 'prop_firm' && acc.propChallenge && (
                    <span style={{
                      fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", padding: "0.2rem 0.4rem", borderRadius: "4px",
                      background: acc.propChallenge.status === 'passed' ? 'rgba(34,197,94,0.15)' : acc.propChallenge.status === 'breached' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                      color: acc.propChallenge.status === 'passed' ? 'var(--color-profit)' : acc.propChallenge.status === 'breached' ? 'var(--color-loss)' : 'var(--color-brand-500)'
                    }}>
                      {acc.propChallenge.status}
                    </span>
                  )}
                  {/* actions */}
                  <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.25rem" }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setEditing({
                        id: acc.id, name: acc.name,
                        initialBalance: String(acc.initialBalance),
                        fxRateToUsd: acc.fxRateToUsd || "1",
                        isDefault: acc.isDefault,
                      })}
                      title="Edit account"
                      style={{ background: "var(--color-gray-800)", border: "none", color: "var(--color-gray-300)", width: 28, height: 28, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(acc)}
                      title="Delete account"
                      style={{ background: "var(--color-gray-800)", border: "none", color: "var(--color-loss)", width: 28, height: 28, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => openAccount(acc)}
                      title="Open"
                      style={{ background: "var(--color-gray-800)", border: "none", color: "var(--color-gray-300)", width: 28, height: 28, borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--color-bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-border)", marginTop: "auto" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Equity</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text)" }}>{formatCurrency(currentEquity, acc.baseCurrency, false, 2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Net Return</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600, color: returnPct >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total P&L</div>
                  <div style={{ fontSize: "1rem", fontWeight: 500, color: acc.stats.totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {formatCurrency(acc.stats.totalPnl, acc.baseCurrency, true, 2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trades Executed</div>
                  <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-text)" }}>{acc.stats.tradesCount}</div>
                </div>
                {acc.fxRateToUsd && Number(acc.fxRateToUsd) !== 1 && (
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>P&L (USD)</div>
                    <div style={{ fontSize: "1rem", fontWeight: 500, color: (acc.stats.totalPnlUsd || 0) >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {formatCurrency(acc.stats.totalPnlUsd || 0, "USD", true, 2)}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--color-gray-600)" }}>fx {Number(acc.fxRateToUsd).toFixed(4)}</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
