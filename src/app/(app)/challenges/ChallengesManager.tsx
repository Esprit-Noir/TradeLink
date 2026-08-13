"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CreateChallengeDrawer } from "@/components/prop-firm/CreateChallengeDrawer"
import { ChallengeDetailsDrawer } from "@/components/prop-firm/ChallengeDetailsDrawer"

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
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null)
  const [recalculating, setRecalculating] = useState<string | null>(null)

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

  return (
    <div style={{ padding: "1rem 0" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Active Prop Challenges</h2>
        <button 
          onClick={() => setDrawerOpen(true)} 
          className="btn btn-primary" 
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem", boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)" }}
        >
          + Start New Challenge
        </button>
      </div>

      <CreateChallengeDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        accounts={accounts} 
        templates={templates} 
        onSubmit={handleCreateSubmit} 
      />

      <ChallengeDetailsDrawer 
        challenge={selectedChallenge} 
        onClose={() => setSelectedChallenge(null)} 
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {challenges.length === 0 && (
          <div style={{ gridColumn: "1 / -1", padding: "4rem 2rem", textAlign: "center", background: "var(--color-gray-900)", borderRadius: "16px", border: "1px dashed var(--color-gray-700)" }}>
            <div style={{ color: "var(--color-gray-400)", fontSize: "1.1rem", marginBottom: "1rem" }}>No active challenges</div>
            <button onClick={() => setDrawerOpen(true)} className="btn btn-outline">Create your first challenge</button>
          </div>
        )}

        {challenges.map(c => {
          const maxDdRef = c.template.drawdownType === 'static_balance' ? Number(c.initialBalance) :
                           c.template.drawdownType === 'trailing_balance' ? Number(c.highestBalance) :
                           Number(c.highestEquity)
          const maxDdThreshold = maxDdRef * (1 - Number(c.maxDDPct) / 100)
          
          const isBreached = c.status === 'failed' || c.status === 'breached'
          const isPassed = c.status === 'passed'
          
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
              onClick={() => setSelectedChallenge(c)}
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
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isBreached ? "var(--color-loss)" : isPassed ? "var(--color-profit)" : "var(--color-brand-500)", boxShadow: `0 0 10px ${isBreached ? "var(--color-loss)" : isPassed ? "var(--color-profit)" : "var(--color-brand-500)"}` }} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{c.account.name}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>
                    {c.template.firmName} — ${Number(c.initialBalance).toLocaleString("en-US")} — {c.phase === 'phase_1' ? "Phase 1" : c.phase === 'phase_2' ? "Phase 2" : "Funded"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className={`badge ${isBreached ? 'badge-loss' : isPassed ? 'badge-profit' : ''}`} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {c.status.toUpperCase()}
                  </span>
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

              {/* Action */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto", gap: "0.5rem" }}>
                {isPassed && c.phase === 'phase_1' && c.metadata?.steps === '2' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUpgrade(c.id); }} 
                    className="btn btn-primary" 
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", flex: 1 }}
                  >
                    Start Phase 2
                  </button>
                )}
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
