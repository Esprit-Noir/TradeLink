"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CreateChallengeDrawer } from "@/components/prop-firm/CreateChallengeDrawer"
import { TemplateManager } from "@/components/prop-firm/TemplateManager"

const BREACH_LABELS: Record<string, string> = {
  max_dd: "MAX DD",
  daily_dd: "DAILY DD",
  consistency: "CONSISTENCY",
  time_limit: "TIME LIMIT",
}

const EVENT_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  alert_90pct: { label: "⚠ 90% DD", color: "var(--color-loss)", bg: "rgba(239,68,68,0.15)" },
  alert_80pct: { label: "⚠ 80% DD", color: "var(--color-warning)", bg: "rgba(245,158,11,0.15)" },
  breached: { label: "BREACHED", color: "var(--color-loss)", bg: "rgba(239,68,68,0.15)" },
  target_hit: { label: "TARGET HIT", color: "var(--color-profit)", bg: "rgba(16,185,129,0.15)" },
  phase_passed: { label: "PHASE PASSED", color: "var(--color-profit)", bg: "rgba(16,185,129,0.15)" },
}

export function ChallengesManager({ 
  accounts, 
  templates, 
  challenges 
}: { 
  accounts: any[]
  templates: any[]
  challenges: any[]
}) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<any | null>(null)
  const [recalculating, setRecalculating] = useState<string | null>(null)
  const [templateList, setTemplateList] = useState<any[]>(templates)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Track previous state to fire notifications on status transitions / new events
  const prevRef = useRef<Record<string, { status: string; lastEvent: string | null }>>({})

  useEffect(() => {
    const prev = prevRef.current
    const firstRun = Object.keys(prev).length === 0
    const next: Record<string, { status: string; lastEvent: string | null }> = {}

    challenges.forEach(c => {
      const lastEvent = Array.isArray(c.events) && c.events.length > 0 ? c.events[0].id : null
      next[c.id] = { status: c.status, lastEvent }

      if (firstRun || !prev[c.id]) return

      const p = prev[c.id]

      if (p.status !== c.status) {
        if (c.status === 'breached' || c.status === 'failed') {
          toast.error(`Challenge breached${c.breachReason ? ` (${c.breachReason.replace(/_/g, ' ')})` : ""}`)
        } else if (c.status === 'passed') {
          toast.success("Challenge passed — ready to upgrade!")
        }
      }

      if (p.lastEvent && lastEvent && p.lastEvent !== lastEvent && Array.isArray(c.events) && c.events.length > 0) {
        const ev = c.events[0]
        const msg = ev.message || "Challenge event"
        if (ev.severity === 'critical') toast.error(msg)
        else if (ev.severity === 'warning') toast.warning(msg)
        else toast.info(msg)
      }
    })

    prevRef.current = next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges])

  // Real-time evaluation: poll the engine for active challenges while the page is visible
  useEffect(() => {
    let cancelled = false
    const hasActive = challenges.some(c => c.status === 'active')
    if (!hasActive) return

    const run = async () => {
      try {
        const res = await fetch("/api/challenges/evaluate-all", { method: "POST" })
        if (res.ok && !cancelled) router.refresh()
      } catch {
        // silent — polling failures shouldn't disrupt the UI
      }
    }

    const interval = setInterval(run, 30000)
    return () => { cancelled = true; clearInterval(interval) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenges])

  const handleCreateSubmit = async (data: any) => {
    const res = await fetch("/api/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || "Failed to create challenge")
    }
    
    router.refresh()
  }

  const handleEditSubmit = async (data: any) => {
    const res = await fetch(`/api/challenges/${data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || "Failed to update challenge")
    }

    router.refresh()
  }

  const handleSubmit = async (data: any) => {
    if (data.id) {
      await handleEditSubmit(data)
    } else {
      await handleCreateSubmit(data)
    }
  }

  const handleRecalculate = async (challengeId: string) => {
    setRecalculating(challengeId)
    try {
      const res = await fetch(`/api/challenges/${challengeId}/recalculate`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to recalculate")
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to recalculate challenge")
    } finally {
      setRecalculating(null)
    }
  }

  const handleUpgrade = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/upgrade`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to upgrade phase")
      router.refresh()
    } catch (err) {
      console.error(err)
      toast.error("Failed to upgrade phase")
    }
  }

  const filteredChallenges = statusFilter === "all"
    ? challenges
    : statusFilter === "breached"
      ? challenges.filter(c => c.status === 'breached' || c.status === 'failed')
      : challenges.filter(c => c.status === statusFilter)

  return (
    <div style={{ padding: "1rem 0" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Prop Challenges</h2>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <TemplateManager templates={templateList} onTemplatesChange={setTemplateList} />
          <button 
            onClick={() => setDrawerOpen(true)} 
            className="btn btn-primary" 
            style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)" }}
          >
            + Start New Challenge
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "passed", label: "Passed" },
          { value: "breached", label: "Breached" },
          { value: "failed", label: "Failed" },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`btn ${statusFilter === f.value ? "btn-primary" : "btn-outline"}`}
            style={{ padding: "0.4rem 0.9rem", fontSize: "0.8rem" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <CreateChallengeDrawer 
        isOpen={drawerOpen} 
        onClose={() => { setDrawerOpen(false); setEditingChallenge(null) }} 
        accounts={accounts} 
        templates={templateList} 
        challenge={editingChallenge}
        onSubmit={handleSubmit} 
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {filteredChallenges.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "4rem 2rem", textAlign: "center", background: "var(--color-gray-900)", borderRadius: "16px", border: "1px dashed var(--color-gray-700)" }}>
            <div style={{ color: "var(--color-gray-400)", fontSize: "1.1rem", marginBottom: "1rem" }}>
              {challenges.length === 0 ? "No active challenges" : "No challenges in this filter"}
            </div>
            <button onClick={() => setDrawerOpen(true)} className="btn btn-outline">Create your first challenge</button>
          </div>
        )}

        {filteredChallenges.map(c => {
          const maxDdRef = c.template.drawdownType === 'static_balance' ? Number(c.initialBalance) :
                           c.template.drawdownType === 'trailing_balance' ? Number(c.highestBalance) :
                           Number(c.highestEquity)
          const maxDdThreshold = maxDdRef * (1 - Number(c.maxDDPct) / 100)
          
          const isBreached = c.status === 'failed' || c.status === 'breached'
          const isPassed = c.status === 'passed'

          const latestEvent = Array.isArray(c.events) && c.events.length > 0 ? c.events[0] : null
          const eventBadge = latestEvent && EVENT_BADGE[latestEvent.eventType]
          
          // Generate a subtle background gradient based on status
          let bgColor = "var(--color-gray-900)"
          let borderColor = "var(--color-gray-800)"
          if (isBreached) {
            borderColor = "var(--color-loss)"
          } else if (isPassed) {
            borderColor = "var(--color-profit)"
          } else {
            borderColor = "var(--color-brand-500)"
          }

          return (
            <div key={c.id} 
              onClick={() => router.push(`/challenges/${c.id}`)}
              style={{ 
              background: bgColor,
              border: `1px solid ${borderColor}`,
              borderRadius: "16px",
              padding: "1.5rem",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              display: "flex", flexDirection: "column", gap: "1.5rem",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease"
            }}>
              {/* Top Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", minWidth: 0 }}>
                  {c.template?.logoUrl && (
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "8px",
                      background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.template.logoUrl} alt={`${c.template.firmName} logo`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isBreached ? "var(--color-loss)" : isPassed ? "var(--color-profit)" : "var(--color-brand-500)", boxShadow: `0 0 10px ${isBreached ? "var(--color-loss)" : isPassed ? "var(--color-profit)" : "var(--color-brand-500)"}` }} />
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{c.account.name}</span>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>
                      {c.template.firmName} — ${Number(c.initialBalance).toLocaleString("en-US")} — {c.phase === 'phase_1' ? "Phase 1" : c.phase === 'phase_2' ? "Phase 2" : "Funded"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                  <span className={`badge ${isBreached ? 'badge-loss' : isPassed ? 'badge-profit' : 'badge-neutral'}`}>
                    {c.status.toUpperCase()}
                  </span>
                  {isBreached && c.breachReason && (
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                      padding: "0.2rem 0.5rem", borderRadius: "4px",
                      background: "rgba(239,68,68,0.15)", color: "var(--color-loss)",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}>
                      {BREACH_LABELS[c.breachReason] || c.breachReason.replace(/_/g, " ")}
                    </span>
                  )}
                  {eventBadge && (
                    <span style={{
                      fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                      padding: "0.2rem 0.5rem", borderRadius: "4px",
                      background: eventBadge.bg, color: eventBadge.color,
                    }}>
                      {eventBadge.label}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--color-gray-800)", padding: "1rem", borderRadius: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Equity</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--color-gray-100)" }}>${Number(c.currentEquity).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profit Target</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--color-profit)" }}>{Number(c.profitTargetPct)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Loss</div>
                  <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-loss)" }}>{Number(c.maxDDPct)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Daily Loss</div>
                  <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-orange-500)" }}>{Number(c.dailyDDPct)}%</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {(() => {
                  const profitTarget = Number(c.initialBalance) * (Number(c.profitTargetPct) / 100)
                  const currentProfit = Number(c.currentEquity) - Number(c.initialBalance)
                  const profitPct = profitTarget > 0 ? Math.min(Math.max((currentProfit / profitTarget) * 100, 0), 100) : 0
                  const maxDdAllowed = maxDdRef - maxDdThreshold
                  const maxDdUsed = Math.max(0, maxDdRef - Number(c.currentEquity))
                  const ddPct = maxDdAllowed > 0 ? Math.min((maxDdUsed / maxDdAllowed) * 100, 100) : 0
                  return (
                    <>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--color-gray-400)", marginBottom: "0.3rem" }}>
                          <span>Profit Target</span>
                          <span style={{ color: "var(--color-profit)" }}>{Math.round(profitPct)}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "var(--color-gray-800)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${profitPct}%`, background: "var(--color-profit)", borderRadius: "4px", transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--color-gray-400)", marginBottom: "0.3rem" }}>
                          <span>Max Drawdown Used</span>
                          <span style={{ color: ddPct >= 80 ? "var(--color-warning)" : "var(--color-gray-300)" }}>{Math.round(ddPct)}%</span>
                        </div>
                        <div style={{ width: "100%", height: "6px", background: "var(--color-gray-800)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${ddPct}%`, background: ddPct >= 80 ? "var(--color-warning)" : "var(--color-brand-500)", borderRadius: "4px", transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", gap: "0.5rem" }}>
                {isPassed && c.phase === 'phase_1' && (c.metadata?.steps === '2' || c.metadata?.steps === '1') && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUpgrade(c.id); }} 
                    className="btn btn-primary" 
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", flex: 1 }}
                  >
                    {c.metadata?.steps === '2' ? "Start Phase 2" : "Get Funded"}
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingChallenge(c); setDrawerOpen(true); }} 
                  className="btn btn-outline" 
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", flex: 1 }}
                >
                  Edit
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleRecalculate(c.id); }} 
                  disabled={recalculating === c.id}
                  className="btn btn-outline" 
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", flex: 1 }}
                >
                  {recalculating === c.id ? "Syncing..." : "Sync Engine"}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
