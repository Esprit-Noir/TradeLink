import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { toast } from "sonner"

interface DrawerAccount {
  id: string
  name: string
}

interface DrawerTemplate {
  id: string
  firmName: string
  logoUrl?: string | null
  drawdownType: string
  profitTargetPhase1Pct?: number | null
  profitTargetPhase2Pct?: number | null
  maxDDPct?: number | null
  dailyDDPct?: number | null
  minTradingDays?: number | null
}

interface DrawerChallenge {
  id: string
  account?: { name?: string } | null
  initialBalance?: number | null
  templateId?: string
  profitTargetPct?: number | null
  maxDDPct?: number | null
  dailyDDPct?: number | null
  minTradingDays?: number | null
  cost?: number | null
  metadata?: Record<string, unknown> | null
  template?: { logoUrl?: string | null }
}

export function CreateChallengeDrawer({
  isOpen,
  onClose,
  templates,
  challenge,
  onSubmit
}: {
  isOpen: boolean
  onClose: () => void
  accounts: DrawerAccount[]
  templates: DrawerTemplate[]
  challenge?: DrawerChallenge | null
  onSubmit: (data: Record<string, unknown>) => Promise<void>
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
      const meta = challenge.metadata
      const metaVal = (k: string) => (meta ? (meta[k] as number | string | undefined) : undefined)
      setProfitTargetPct(metaVal("phase1Target")?.toString() ?? String(challenge.profitTargetPct ?? ""))
      setPhase2Target(metaVal("phase2Target")?.toString() ?? "")
      setFundedTarget(metaVal("fundedTarget")?.toString() ?? "")
      setMaxDDPct(String(challenge.maxDDPct ?? ""))
      setDailyDDPct(String(challenge.dailyDDPct ?? ""))
      setMinTradingDays(challenge.minTradingDays != null ? String(challenge.minTradingDays) : "0")
      setCost(challenge.cost != null ? String(challenge.cost) : "")
      setSteps(metaVal("steps")?.toString() || "2")
      setPayoutSplit(metaVal("payoutSplit")?.toString() || "")
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
    } catch {
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
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Failed to save challenge")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div role="dialog" aria-modal="true" className="fixed top-0 right-0 h-screen w-full max-w-[500px] bg-[var(--color-gray-950)] z-50 border-l border-[var(--color-gray-800)] flex flex-col shadow-2xl transition-transform">
        <div className="p-6 border-b border-[var(--color-gray-800)] flex justify-between items-center">
          <h2 className="text-xl font-semibold">{isEditing ? "Edit Challenge" : "Create Prop Challenge"}</h2>
          <button onClick={onClose} aria-label="Close" className="bg-transparent border-none text-[var(--color-gray-400)] cursor-pointer text-2xl hover:text-white">&times;</button>
        </div>

        <div className="p-6 pb-16 flex-1 overflow-y-auto">
          <form id="create-challenge-form" onSubmit={handleSubmit}>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="label">Challenge Name</label>
                <input type="text" className="input" value={challengeName} onChange={e => setChallengeName(e.target.value)} placeholder="e.g. Stellar 25k" required />
              </div>
              <div>
                <label className="label">Challenge Amount</label>
                <input type="number" className="input" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} placeholder="e.g. 25000" required />
              </div>
            </div>

            <div className="mb-6">
              <label className="label">Challenge Framework (Drawdown Type)</label>
              <select className="input" value={selectedTemplateId} onChange={handleTemplateChange} required>
                <option value="" disabled>Select a base framework...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.firmName} ({t.drawdownType.replace('_', ' ')})</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="label">Prop Firm Logo</label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="w-14 h-14 rounded-lg bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] flex items-center justify-center overflow-hidden shrink-0 relative">
                    <Image src={logoUrl} alt="Prop firm logo" unoptimized fill sizes="100vw" style={{ objectFit: "contain" }} />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[var(--color-gray-900)] border border-dashed border-[var(--color-gray-700)] flex items-center justify-center text-[var(--color-gray-600)] shrink-0">
                    <span className="text-[0.65rem] text-center leading-[1.2]">No logo</span>
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoChange} className="hidden" />
                  <div className="btn btn-outline text-center text-[0.85rem] p-2">
                    {logoFile ? "Replace logo" : logoUrl ? "Change logo" : "Upload logo"}
                  </div>
                </label>
              </div>
              <p className="text-[0.7rem] text-[var(--color-gray-600)] mt-1.5">PNG, JPG, SVG or WebP — max 5MB.</p>
            </div>

            <h3 className="text-[0.95rem] text-[var(--color-gray-300)] mb-4 border-b border-[var(--color-gray-800)] pb-2">Phases & Targets</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
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

            <div className="grid grid-cols-2 gap-4 mb-4">
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
              <p className="text-xs text-[var(--color-gray-500)] mb-4">
                Single-phase challenge — once the Phase 1 target is hit, the account moves directly to funded.
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Max Loss (%)</label>
                <input type="number" step="0.1" className="input" value={maxDDPct} onChange={e => setMaxDDPct(e.target.value)} required />
              </div>
              <div>
                <label className="label">Daily Loss (%)</label>
                <input type="number" step="0.1" className="input" value={dailyDDPct} onChange={e => setDailyDDPct(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
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

        <div className="p-6 border-t border-[var(--color-gray-800)] flex justify-end gap-4 bg-[var(--color-gray-950)]">
          <button type="button" onClick={onClose} className="btn btn-outline" disabled={isSubmitting}>Cancel</button>
          <button type="submit" form="create-challenge-form" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Start Challenge"}
          </button>
        </div>
      </div>
    </>
  )
}
