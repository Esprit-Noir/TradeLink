import React, { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

export function CreateChallengeDrawer({
  isOpen,
  onClose,
  accounts,
  templates,
  challenge,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  accounts: any[]
  templates: any[]
  challenge?: any | null
  onSubmit: (data: any) => Promise<void>
}) {
  const isEditing = Boolean(challenge)

  const [challengeName, setChallengeName] = useState("")
  const [initialBalance, setInitialBalance] = useState("25000")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")

  // Per-phase targets
  const [steps, setSteps] = useState("2") // 1, 2, or master
  const [profitTargetPct, setProfitTargetPct] = useState("10") // Phase 1
  const [phase2Target, setPhase2Target] = useState("6") // Phase 2
  const [fundedTarget, setFundedTarget] = useState("5") // Funded
  const [maxDDPct, setMaxDDPct] = useState("12")
  const [dailyDDPct, setDailyDDPct] = useState("4")
  const [minTradingDays, setMinTradingDays] = useState("0")
  const [cost, setCost] = useState("")
  const [payoutSplit, setPayoutSplit] = useState("Bi-Weekly Up to 95%")

  const [logoUrl, setLogoUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const logoTouched = useRef(false)
  const skipTemplateSync = useRef(false)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Prefill when editing, reset when creating
  useEffect(() => {
    if (!isOpen) return

    if (challenge) {
      skipTemplateSync.current = true
      setChallengeName(challenge.account?.name || "")
      setInitialBalance(String(challenge.initialBalance ?? ""))
      setSelectedTemplateId(challenge.templateId || "")
      setProfitTargetPct(challenge.metadata?.phase1Target?.toString() ?? String(challenge.profitTargetPct ?? ""))
      setPhase2Target(challenge.metadata?.phase2Target?.toString() ?? "")
      setFundedTarget(challenge.metadata?.fundedTarget?.toString() ?? "")
      setMaxDDPct(String(challenge.maxDDPct ?? ""))
      setDailyDDPct(String(challenge.dailyDDPct ?? ""))
      setMinTradingDays(challenge.minTradingDays != null ? String(challenge.minTradingDays) : "0")
      setCost(challenge.cost != null ? String(challenge.cost) : "")
      setSteps(challenge.metadata?.steps || "2")
      setPayoutSplit(challenge.metadata?.payoutSplit || "")
      setLogoUrl(challenge.template?.logoUrl || "")
      setLogoFile(null)
      logoTouched.current = false
    } else {
      skipTemplateSync.current = false
      setChallengeName("")
      setInitialBalance("25000")
      setSelectedTemplateId("")
      setProfitTargetPct("10")
      setPhase2Target("6")
      setFundedTarget("5")
      setMaxDDPct("12")
      setDailyDDPct("4")
      setMinTradingDays("0")
      setCost("")
      setSteps("2")
      setPayoutSplit("Bi-Weekly Up to 95%")
      setLogoUrl("")
      setLogoFile(null)
      logoTouched.current = false
    }
  }, [isOpen, challenge])

  // Sync template defaults when template changes (skipped while prefilling an edit)
  useEffect(() => {
    if (skipTemplateSync.current) return
    if (selectedTemplateId) {
      const t = templates.find(t => t.id === selectedTemplateId)
      if (t) {
        setProfitTargetPct(t.profitTargetPhase1Pct?.toString() || "10")
        setPhase2Target(t.profitTargetPhase2Pct?.toString() || "5")
        setMaxDDPct(t.maxDDPct?.toString() || "10")
        setDailyDDPct(t.dailyDDPct?.toString() || "5")
        setMinTradingDays(t.minTradingDays?.toString() || "0")
        if (!logoTouched.current) setLogoUrl(t.logoUrl || "")
      }
    }
  }, [selectedTemplateId, templates])

  const uploadLogo = async (file: File): Promise<string> => {
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(`logo-${Date.now()}-${file.name}`)}`, {
      method: "POST",
      body: file,
    })
    if (!res.ok) throw new Error("Failed to upload logo")
    const blob = await res.json()
    return blob.url
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    logoTouched.current = true
    setLogoFile(file)
    try {
      const url = await uploadLogo(file)
      setLogoUrl(url)
    } catch (err) {
      toast.error("Failed to upload logo")
      setLogoFile(null)
    }
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    skipTemplateSync.current = false
    setSelectedTemplateId(e.target.value)
  }

  const handleStepsChange = (value: string) => {
    setSteps(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeName || !selectedTemplateId || !initialBalance) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        id: challenge?.id,
        challengeName,
        initialBalance,
        templateId: selectedTemplateId,
        profitTargetPct,
        phase2Target,
        fundedTarget,
        maxDDPct,
        dailyDDPct,
        minTradingDays,
        cost,
        steps,
        payoutSplit,
        logoUrl
      })
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to save challenge")
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
        position: "fixed", top: 0, right: 0, height: "100vh", width: "100%", maxWidth: "500px",
        background: "var(--color-gray-950)", zIndex: 50, borderLeft: "1px solid var(--color-gray-800)",
        display: "flex", flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{isEditing ? "Edit Challenge" : "Create Prop Challenge"}</h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
        </div>

        <div style={{ padding: "1.5rem", paddingBottom: "4rem", flex: 1, overflowY: "auto" }}>
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
              <select className="input" value={selectedTemplateId} onChange={handleTemplateChange} required>
                <option value="" disabled>Select a base framework...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.firmName} ({t.drawdownType.replace('_', ' ')})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="label">Prop Firm Logo</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                {logoUrl ? (
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "10px",
                    background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0,
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logoUrl} alt="Prop firm logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "10px",
                    background: "var(--color-gray-900)", border: "1px dashed var(--color-gray-700)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-600)", flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "0.65rem", textAlign: "center", lineHeight: 1.2 }}>No logo</span>
                  </div>
                )}
                <label style={{ flex: 1, cursor: "pointer" }}>
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoChange} style={{ display: "none" }} />
                  <div className="btn btn-outline" style={{ textAlign: "center", fontSize: "0.85rem", padding: "0.5rem" }}>
                    {logoFile ? "Replace logo" : logoUrl ? "Change logo" : "Upload logo"}
                  </div>
                </label>
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--color-gray-600)", marginTop: "0.4rem" }}>PNG, JPG, SVG or WebP — max 5MB.</p>
            </div>

            <h3 style={{ fontSize: "0.95rem", color: "var(--color-gray-300)", marginBottom: "1rem", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.5rem" }}>Phases & Targets</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label className="label">Structure</label>
                <select className="input" value={steps} onChange={e => handleStepsChange(e.target.value)}>
                  <option value="1">1 Phase (to Funded)</option>
                  <option value="2">2 Phases</option>
                  <option value="master">Master / Directly Funded</option>
                </select>
              </div>
              <div>
                <label className="label">Payout Split</label>
                <input type="text" className="input" value={payoutSplit} onChange={e => setPayoutSplit(e.target.value)} placeholder="e.g. 95%" />
              </div>
            </div>

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
              {steps === "master" && (
                <div>
                  <label className="label">Funded Target (%)</label>
                  <input type="number" step="0.1" className="input" value={fundedTarget} onChange={e => setFundedTarget(e.target.value)} />
                </div>
              )}
            </div>

            {steps === "1" && (
              <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1rem" }}>
                Single-phase challenge — once the Phase 1 target is hit, the account moves directly to funded.
              </p>
            )}

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
              <div>
                <label className="label">Challenge Cost ($)</label>
                <input
                  type="number"
                  className="input"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  placeholder="e.g. 89"
                />
              </div>
            </div>

          </form>
        </div>

        <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>Cancel</button>
          <button type="submit" form="create-challenge-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Start Challenge"}
          </button>
        </div>
      </div>
    </>
  )
}
