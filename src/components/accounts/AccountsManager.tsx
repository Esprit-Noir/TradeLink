"use client"

import { useState, useMemo } from "react"
import { CreateAccountModal } from "./CreateAccountModal"
import { Wallet, Target, Activity, DollarSign, TrendingUp } from "lucide-react"

export function AccountsManager({ accounts }: { accounts: any[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")

  // Global KPIs
  const kpis = useMemo(() => {
    let totalEquity = 0
    let totalPnl = 0
    let fundedCapital = 0
    let activeCount = accounts.length

    accounts.forEach(acc => {
      const eq = acc.propChallenge ? acc.propChallenge.currentEquity : acc.initialBalance + acc.stats.totalPnl
      totalEquity += eq
      totalPnl += acc.stats.totalPnl
      
      if (acc.type === 'prop_firm' && acc.propChallenge?.status === 'passed') {
        fundedCapital += acc.initialBalance
      }
    })

    return { totalEquity, totalPnl, fundedCapital, activeCount }
  }, [accounts])

  // Filtering
  const filteredAccounts = accounts.filter(acc => {
    const type = acc.type || "personal"
    return filterType === "all" || type === filterType
  })

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'prop_firm': return "var(--color-brand-500)"
      case 'demo': return "var(--color-gray-400)"
      default: return "var(--color-profit)"
    }
  }

  const getTypeName = (type: string) => {
    switch(type) {
      case 'prop_firm': return "Prop Firm"
      case 'demo': return "Demo"
      default: return "Personal"
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

      {/* KPIs Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600 }}>
            <Wallet size={16} /> Total Equity
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" }}>
            ${kpis.totalEquity.toLocaleString("en-US", {minimumFractionDigits: 2})}
          </div>
        </div>
        
        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600 }}>
            <TrendingUp size={16} /> Total Net P&L
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: kpis.totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
            {kpis.totalPnl >= 0 ? "+" : ""}${kpis.totalPnl.toLocaleString("en-US", {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600 }}>
            <Target size={16} /> Funded Capital (Prop)
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-brand-400)" }}>
            ${kpis.fundedCapital.toLocaleString("en-US", {minimumFractionDigits: 2})}
          </div>
        </div>

        <div className="kpi-card" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-400)", fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 600 }}>
            <Activity size={16} /> Active Accounts
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text)" }}>
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

      {/* Accounts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.5rem" }}>
        {filteredAccounts.map(acc => {
          const typeColor = getTypeColor(acc.type)
          const currentEquity = acc.propChallenge ? acc.propChallenge.currentEquity : acc.initialBalance + acc.stats.totalPnl
          const returnPct = acc.initialBalance > 0 ? (acc.stats.totalPnl / acc.initialBalance) * 100 : 0

          return (
            <div key={acc.id} className="card" style={{ 
              border: `1px solid ${typeColor}`,
              padding: "1.5rem",
              display: "flex", flexDirection: "column", gap: "1.5rem",
              position: "relative",
            }}>
              
              {/* Top Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: typeColor, boxShadow: `0 0 10px ${typeColor}` }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text)", letterSpacing: "-0.01em" }}>{acc.name}</span>
                    {acc.isDefault && (
                      <span style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, background: "var(--color-gray-800)", color: "var(--color-text)", padding: "0.15rem 0.4rem", borderRadius: "4px", marginLeft: "0.5rem" }}>Default</span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
                    {acc.type === 'prop_firm' && acc.propChallenge ? (
                      <>{acc.propChallenge.firmName} — ${acc.initialBalance.toLocaleString("en-US")} — {acc.propChallenge.phase === 'phase_1' ? "Phase 1" : acc.propChallenge.phase === 'phase_2' ? "Phase 2" : "Funded"}</>
                    ) : (
                      <>{acc.broker || "No broker"} — ${acc.initialBalance.toLocaleString("en-US")}</>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
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
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--color-bg)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-border)", marginTop: "auto" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Equity</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text)" }}>${currentEquity.toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
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
                    {acc.stats.totalPnl >= 0 ? "+" : ""}${acc.stats.totalPnl.toLocaleString("en-US", {minimumFractionDigits: 2})}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trades Executed</div>
                  <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-text)" }}>{acc.stats.tradesCount}</div>
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
