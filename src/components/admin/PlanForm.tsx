"use client"

import { useState } from "react"
import { toast } from "sonner"

export function PlanForm({ plan, onClose, onSave }: { plan?: any, onClose: () => void, onSave: (p: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    price: plan?.price || "",
    maxAccounts: plan?.maxAccounts || 1,
    maxTradesPerMonth: plan?.maxTradesPerMonth || "",
    backtestAccess: plan?.backtestAccess || false,
    isActive: plan?.isActive ?? true,
    features: {
      replayAccess: plan?.features?.replayAccess || false,
      propFirmAccess: plan?.features?.propFirmAccess || false,
      advancedStats: plan?.features?.advancedStats || false,
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = plan ? `/api/admin/plans/${plan.id}` : `/api/admin/plans`
      const method = plan ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          maxAccounts: Number(formData.maxAccounts),
          maxTradesPerMonth: formData.maxTradesPerMonth ? Number(formData.maxTradesPerMonth) : null,
        })
      })

      if (!res.ok) throw new Error("Failed to save plan")
      const saved = await res.json()
      toast.success(plan ? "Plan updated" : "Plan created")
      onSave(saved)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleFeature = (key: keyof typeof formData.features) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key]
      }
    }))
  }

  return (
    <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)", marginBottom: "1rem" }}>
        {plan ? "Edit Plan" : "Create New Plan"}
      </h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="label">Plan Name (e.g., Standard, Pro, Elite)</label>
            <input 
              type="text" 
              className="input" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">Monthly Price ($)</label>
            <input 
              type="number" 
              step="0.01"
              className="input" 
              required
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="form-group">
            <label className="label">Max Accounts</label>
            <input 
              type="number" 
              className="input" 
              required
              value={formData.maxAccounts}
              onChange={e => setFormData({ ...formData, maxAccounts: Number(e.target.value) })}
            />
          </div>
          <div className="form-group">
            <label className="label">Max Trades / Month (Leave blank for unlimited)</label>
            <input 
              type="number" 
              className="input" 
              value={formData.maxTradesPerMonth}
              onChange={e => setFormData({ ...formData, maxTradesPerMonth: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="label" style={{ marginBottom: "0.5rem" }}>Access & Features</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={formData.backtestAccess}
                onChange={e => setFormData({ ...formData, backtestAccess: e.target.checked })}
              />
              Backtest Access
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={formData.features.replayAccess}
                onChange={() => toggleFeature("replayAccess")}
              />
              Replay Access (Market Replay)
            </label>
            
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={formData.features.propFirmAccess}
                onChange={() => toggleFeature("propFirmAccess")}
              />
              Prop Firm Manager Access
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={formData.features.advancedStats}
                onChange={() => toggleFeature("advancedStats")}
              />
              Advanced Analytics & Reports
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
            <input 
              type="checkbox" 
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
            />
            Plan is Active (Available for purchase)
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save Plan"}
          </button>
        </div>
      </form>
    </div>
  )
}
