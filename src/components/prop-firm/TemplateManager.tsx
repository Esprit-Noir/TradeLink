"use client"

import React, { useState } from "react"
import { toast } from "sonner"

const DRAWDOWN_TYPES = ["static_balance", "trailing_balance", "trailing_equity"]

interface Template {
  id: string
  firmName: string
  programName: string
  drawdownType: string
  dailyDDPct: number | null
  maxDDPct: number | null
  dailyResetTimezone: string
  profitTargetPhase1Pct: number | null
  profitTargetPhase2Pct: number | null
  minTradingDays: number | null
  maxTradingDays: number | null
  consistencyRulePct: number | null
  weekendHoldingAllowed: boolean
  newsTradingAllowed: boolean
  isActive: boolean
  logoUrl: string | null
}

export function TemplateManager({
  templates,
  onTemplatesChange,
}: {
  templates: Template[]
  onTemplatesChange: (t: Template[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [firmName, setFirmName] = useState("")
  const [programName, setProgramName] = useState("")
  const [drawdownType, setDrawdownType] = useState("static_balance")
  const [logoUrl, setLogoUrl] = useState("")
  const [dailyResetTimezone, setDailyResetTimezone] = useState("UTC")
  const [dailyDDPct, setDailyDDPct] = useState("")
  const [maxDDPct, setMaxDDPct] = useState("10")
  const [profitTargetPhase1Pct, setProfitTargetPhase1Pct] = useState("")
  const [profitTargetPhase2Pct, setProfitTargetPhase2Pct] = useState("")
  const [minTradingDays, setMinTradingDays] = useState("")
  const [maxTradingDays, setMaxTradingDays] = useState("")
  const [consistencyRulePct, setConsistencyRulePct] = useState("")
  const [weekendHoldingAllowed, setWeekendHoldingAllowed] = useState(true)
  const [newsTradingAllowed, setNewsTradingAllowed] = useState(true)
  const [isActive, setIsActive] = useState(true)

  const uploadLogo = async (file: File): Promise<string> => {
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(`template-logo-${Date.now()}-${file.name}`)}`, {
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
    try {
      const url = await uploadLogo(file)
      setLogoUrl(url)
    } catch {
      toast.error("Failed to upload logo")
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFirmName("")
    setProgramName("")
    setDrawdownType("static_balance")
    setLogoUrl("")
    setDailyResetTimezone("UTC")
    setDailyDDPct("")
    setMaxDDPct("10")
    setProfitTargetPhase1Pct("")
    setProfitTargetPhase2Pct("")
    setMinTradingDays("")
    setMaxTradingDays("")
    setConsistencyRulePct("")
    setWeekendHoldingAllowed(true)
    setNewsTradingAllowed(true)
    setIsActive(true)
    setFormOpen(true)
  }

  const openEdit = (t: Template) => {
    setEditing(t)
    setFirmName(t.firmName)
    setProgramName(t.programName)
    setDrawdownType(t.drawdownType)
    setLogoUrl(t.logoUrl || "")
    setDailyResetTimezone(t.dailyResetTimezone || "UTC")
    setDailyDDPct(t.dailyDDPct?.toString() ?? "")
    setMaxDDPct(t.maxDDPct?.toString() ?? "10")
    setProfitTargetPhase1Pct(t.profitTargetPhase1Pct?.toString() ?? "")
    setProfitTargetPhase2Pct(t.profitTargetPhase2Pct?.toString() ?? "")
    setMinTradingDays(t.minTradingDays?.toString() ?? "")
    setMaxTradingDays(t.maxTradingDays?.toString() ?? "")
    setConsistencyRulePct(t.consistencyRulePct?.toString() ?? "")
    setWeekendHoldingAllowed(t.weekendHoldingAllowed)
    setNewsTradingAllowed(t.newsTradingAllowed)
    setIsActive(t.isActive)
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firmName.trim() || !programName.trim()) return
    setSaving(true)
    try {
      const payload = {
        firmName,
        programName,
        drawdownType,
        logoUrl,
        dailyResetTimezone,
        dailyDDPct,
        maxDDPct,
        profitTargetPhase1Pct,
        profitTargetPhase2Pct,
        minTradingDays,
        maxTradingDays,
        consistencyRulePct,
        weekendHoldingAllowed,
        newsTradingAllowed,
        isActive,
      }
      const res = await fetch(editing ? `/api/templates/${editing.id}` : "/api/templates", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to save template")
      }
      toast.success(editing ? "Template updated" : "Template created")
      setFormOpen(false)
      setEditing(null)
      const list = await fetch("/api/templates")
      const data = await list.json()
      onTemplatesChange(data)
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to delete template")
      }
      toast.success("Template deleted")
      const list = await fetch("/api/templates")
      const data = await list.json()
      onTemplatesChange(data)
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Failed to delete template")
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-outline"
        title="Create, edit or remove the prop firm frameworks (drawdown types) available when creating a challenge"
        style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--color-gray-600)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Firm Templates
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, height: "100vh", width: "100%", maxWidth: "560px",
            background: "var(--color-gray-950)", zIndex: 50, borderLeft: "1px solid var(--color-gray-800)",
            display: "flex", flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Prop Firm Templates</h2>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button onClick={openCreate} className="btn btn-primary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                  + New Template
                </button>
                <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
              </div>
            </div>

            <div style={{ padding: "1.5rem", paddingBottom: "4rem", flex: 1, overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {templates.length === 0 && (
                  <div style={{ color: "var(--color-gray-500)", textAlign: "center", padding: "2rem" }}>No templates yet.</div>
                )}
                {templates.map(t => (
                  <div key={t.id} style={{
                    background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
                    borderRadius: "12px", padding: "1rem", display: "flex", alignItems: "center", gap: "1rem"
                  }}>
                    {t.logoUrl ? (
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
                        background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)",
                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.logoUrl} alt={t.firmName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                    ) : (
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "8px", flexShrink: 0,
                        background: "var(--color-gray-800)", border: "1px dashed var(--color-gray-700)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-600)", fontSize: "0.65rem", textAlign: "center",
                      }}>No logo</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "var(--color-gray-100)" }}>
                        {t.firmName} <span style={{ color: "var(--color-gray-500)", fontWeight: 400 }}>— {t.programName}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginTop: "0.25rem" }}>
                        {t.drawdownType.replace(/_/g, " ")} {t.maxDDPct ? `· Max ${t.maxDDPct}%` : ""} {t.dailyDDPct ? `· Daily ${t.dailyDDPct}%` : ""}
                      </div>
                    </div>
                    <span className={`badge ${t.isActive ? 'badge-profit' : 'badge-loss'}`} style={{ fontSize: "0.65rem" }}>
                      {t.isActive ? "ACTIVE" : "HIDDEN"}
                    </span>
                    <button
                      onClick={() => openEdit(t)}
                      className="btn btn-outline"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="btn btn-outline"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.8rem", color: "var(--color-loss)" }}
                    >
                      {deleting === t.id ? "..." : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {formOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 60 }}
            onClick={() => setFormOpen(false)}
          />
          <div style={{
            position: "fixed", top: 0, right: 0, height: "100vh", width: "100%", maxWidth: "520px",
            background: "var(--color-gray-950)", zIndex: 70, borderLeft: "1px solid var(--color-gray-800)",
            display: "flex", flexDirection: "column",
            boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>{editing ? "Edit Template" : "New Template"}</h2>
              <button onClick={() => setFormOpen(false)} aria-label="Close" style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
            </div>

            <div style={{ padding: "1.5rem", paddingBottom: "4rem", flex: 1, overflowY: "auto" }}>
              <form id="template-form" onSubmit={handleSubmit}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                  <div>
                    <label className="label">Firm Name</label>
                    <input type="text" className="input" value={firmName} onChange={e => setFirmName(e.target.value)} placeholder="e.g. FTMO" required />
                  </div>
                  <div>
                    <label className="label">Program Name</label>
                    <input type="text" className="input" value={programName} onChange={e => setProgramName(e.target.value)} placeholder="e.g. Normal" required />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Drawdown Type</label>
                    <select className="input" value={drawdownType} onChange={e => setDrawdownType(e.target.value)}>
                      {DRAWDOWN_TYPES.map(t => (
                        <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Daily Reset Timezone</label>
                    <input type="text" className="input" value={dailyResetTimezone} onChange={e => setDailyResetTimezone(e.target.value)} placeholder="e.g. Europe/London" />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label className="label">Firm Logo</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    {logoUrl ? (
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "8px", flexShrink: 0,
                        background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                      }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logoUrl} alt="logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </div>
                    ) : (
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "8px", flexShrink: 0,
                        background: "var(--color-gray-900)", border: "1px dashed var(--color-gray-700)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-600)", fontSize: "0.6rem", textAlign: "center",
                      }}>No logo</div>
                    )}
                    <label style={{ flex: 1, cursor: "pointer" }}>
                      <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoChange} style={{ display: "none" }} />
                      <div className="btn btn-outline" style={{ textAlign: "center", fontSize: "0.85rem", padding: "0.5rem" }}>
                        {logoUrl ? "Change logo" : "Upload logo"}
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Max DD (%)</label>
                    <input type="number" step="0.1" className="input" value={maxDDPct} onChange={e => setMaxDDPct(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Daily DD (%)</label>
                    <input type="number" step="0.1" className="input" value={dailyDDPct} onChange={e => setDailyDDPct(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Phase 1 Target (%)</label>
                    <input type="number" step="0.1" className="input" value={profitTargetPhase1Pct} onChange={e => setProfitTargetPhase1Pct(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Phase 2 Target (%)</label>
                    <input type="number" step="0.1" className="input" value={profitTargetPhase2Pct} onChange={e => setProfitTargetPhase2Pct(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Min Trading Days</label>
                    <input type="number" className="input" value={minTradingDays} onChange={e => setMinTradingDays(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Max Trading Days</label>
                    <input type="number" className="input" value={maxTradingDays} onChange={e => setMaxTradingDays(e.target.value)} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label className="label">Consistency Rule (%)</label>
                    <input type="number" step="0.1" className="input" value={consistencyRulePct} onChange={e => setConsistencyRulePct(e.target.value)} placeholder="e.g. 30" />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem", color: "var(--color-gray-300)", fontSize: "0.9rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={weekendHoldingAllowed} onChange={e => setWeekendHoldingAllowed(e.target.checked)} />
                    Weekend holding
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={newsTradingAllowed} onChange={e => setNewsTradingAllowed(e.target.checked)} />
                    News trading
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                    Active
                  </label>
                </div>
              </form>
            </div>

            <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button type="button" onClick={() => setFormOpen(false)} className="btn btn-outline" disabled={saving}>Cancel</button>
              <button type="submit" form="template-form" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
