import React, { useState, useEffect } from "react"
import { toast } from "sonner"

export function CreateChallengeDrawer({
  isOpen,
  onClose,
  accounts,
  templates,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
  templates: any[]
  onSubmit: (data: any) => Promise<void>
}) {
  const [challengeName, setChallengeName] = useState("")
  const [initialBalance, setInitialBalance] = useState("25000")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  
  // Custom Overrides
  const [profitTargetPct, setProfitTargetPct] = useState("10")
  const [maxDDPct, setMaxDDPct] = useState("12")
  const [dailyDDPct, setDailyDDPct] = useState("4")
  const [minTradingDays, setMinTradingDays] = useState("0")
  
  // Visual/Metadata fields
  const [steps, setSteps] = useState("2") // 1, 2, or Master
  const [phase2Target, setPhase2Target] = useState("6")
  const [payoutSplit, setPayoutSplit] = useState("Bi-Weekly Up to 95%")
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync template defaults when template changes
  useEffect(() => {
    if (selectedTemplateId) {
      const t = templates.find(t => t.id === selectedTemplateId)
      if (t) {
        setProfitTargetPct(t.profitTargetPhase1Pct?.toString() || "10")
        setPhase2Target(t.profitTargetPhase2Pct?.toString() || "5")
        setMaxDDPct(t.maxDDPct?.toString() || "10")
        setDailyDDPct(t.dailyDDPct?.toString() || "5")
        setMinTradingDays(t.minTradingDays?.toString() || "0")
      }
    }
  }, [selectedTemplateId, templates])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeName || !selectedTemplateId || !initialBalance) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        challengeName,
        initialBalance,
        templateId: selectedTemplateId,
        profitTargetPct,
        maxDDPct,
        dailyDDPct,
        minTradingDays,
        steps,
        phase2Target,
        payoutSplit
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div 
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} 
        onClick={onClose}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "500px",
        background: "var(--color-gray-950)", zIndex: 50, borderLeft: "1px solid var(--color-gray-800)",
        display: "flex", flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Create Prop Challenge</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
        </div>

        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          <form id="create-challenge-form" onSubmit={handleSubmit}>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label className="label">Challenge Name</label>
                <input type="text" className="input" value={challengeName} onChange={e => setChallengeName(e.target.value)} placeholder="e.g. Stellar 25k" required />
              </div>
              <div>
                <label className="label">Challenge Amount</label>
                <input type="number" className="input" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="e.g. 25000" required />
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Challenge Framework (Drawdown Type)</label>
              <select className="input" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} required>
                <option value="" disabled>Select a base framework...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.firmName} ({t.drawdownType.replace('_', ' ')})</option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <label className="label">Steps</label>
                <select className="input" value={steps} onChange={e => setSteps(e.target.value)}>
                  <option value="1">1 Step</option>
                  <option value="2">2 Steps</option>
                  <option value="master">Master / Funded</option>
                </select>
              </div>
              <div>
                <label className="label">Payout Split</label>
                <input type="text" className="input" value={payoutSplit} onChange={e => setPayoutSplit(e.target.value)} placeholder="e.g. 95%" />
              </div>
            </div>

            <h3 style={{ fontSize: "0.95rem", color: "var(--color-gray-300)", marginBottom: "1rem", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.5rem" }}>Custom Rules</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Phase 1 Target (%)</label>
                <input type="number" step="0.1" className="input" value={profitTargetPct} onChange={e => setProfitTargetPct(e.target.value)} required />
              </div>
              {steps === "2" && (
                <div>
                  <label className="label">Phase 2 Target (%)</label>
                  <input type="number" step="0.1" className="input" value={phase2Target} onChange={e => setPhase2Target(e.target.value)} />
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Max Loss (%)</label>
                <input type="number" step="0.1" className="input" value={maxDDPct} onChange={e => setMaxDDPct(e.target.value)} required />
              </div>
              <div>
                <label className="label">Daily Loss (%)</label>
                <input type="number" step="0.1" className="input" value={dailyDDPct} onChange={e => setDailyDDPct(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Min Trading Days</label>
                <input type="number" className="input" value={minTradingDays} onChange={e => setMinTradingDays(e.target.value)} required />
              </div>
            </div>

          </form>
        </div>

        <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>Cancel</button>
          <button type="submit" form="create-challenge-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Start Challenge"}
          </button>
        </div>
      </div>
    </>
  )
}
