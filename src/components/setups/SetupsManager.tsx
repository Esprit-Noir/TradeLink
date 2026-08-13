"use client"

import { useEffect, useState } from "react"
import { CreateSetupModal } from "./CreateSetupModal"
import { toast } from "sonner"
import { Check, Trash2, Target, TrendingUp, Pencil, X, Save } from "lucide-react"

type Setup = {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  count: number
  winRate: number
  netPnl: number
}

export function SetupsManager() {
  const [setups, setSetups] = useState<Setup[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const loadSetups = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/setups")
      const data = await res.json()
      setSetups(data)
    } catch (err) {
      toast.error("Failed to load setups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSetups()
  }, [])

  const startEdit = (setup: Setup) => {
    setEditingId(setup.id)
    setEditName(setup.name)
    setEditDescription(setup.description || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/setups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }
      toast.success("Setup updated")
      cancelEdit()
      loadSetups()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setAsDefault = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/setups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error("Failed to set default")
      toast.success(`${name} is now your default setup`)
      loadSetups()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteSetup = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the setup "${name}"? This won't delete the tags on your existing trades.`)) return
    try {
      const res = await fetch(`/api/setups/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete setup")
      toast.success(`Setup deleted`)
      loadSetups()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const bestSetup = [...setups].sort((a, b) => b.netPnl - a.netPnl)[0]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Trading Setups</h1>
          <p className="page-subtitle">Manage your strategies, define rules, and track performance.</p>
        </div>
        <div className="actions">
          <CreateSetupModal onCreated={loadSetups} />
        </div>
      </div>

      {bestSetup && bestSetup.netPnl > 0 && (
        <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--color-profit)", background: "rgba(34, 197, 94, 0.05)", display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ padding: "1rem", background: "rgba(34, 197, 94, 0.1)", borderRadius: "50%", color: "var(--color-profit)" }}>
            <TrendingUp size={32} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gray-400)", fontWeight: 700, marginBottom: "0.25rem" }}>
              Most Performant Setup
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
              {bestSetup.name} <span style={{ color: "var(--color-profit)" }}>(+${bestSetup.netPnl.toFixed(2)})</span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <div className="skeleton card" style={{ height: "220px" }} />
          <div className="skeleton card" style={{ height: "220px" }} />
        </div>
      ) : setups.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-gray-500)" }}>
          <Target size={48} style={{ opacity: 0.5, marginBottom: "1rem", margin: "0 auto" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-gray-300)", marginBottom: "0.5rem" }}>No setups defined</div>
          <p style={{ maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
            Create your first trading setup to start tracking its performance automatically based on your trade tags.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {setups.map(setup => {
            const isEditing = editingId === setup.id
            return (
              <div key={setup.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", position: "relative" }}>
                {setup.isDefault && !isEditing && (
                  <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", background: "var(--color-brand-500)", color: "#000", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                    Default
                  </div>
                )}
                
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1rem" }}>
                    <input
                      className="input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Setup name"
                      style={{ fontWeight: 600, fontSize: "1rem" }}
                    />
                    <textarea
                      className="input"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={3}
                      style={{ resize: "none", fontSize: "0.85rem" }}
                    />
                  </div>
                ) : (
                  <div style={{ marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", paddingRight: "4rem" }}>{setup.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {setup.description || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No description provided.</span>}
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", padding: "1rem 0", borderTop: "1px solid var(--color-gray-800)", borderBottom: "1px solid var(--color-gray-800)" }}>
                  <div>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 700 }}>Win Rate</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: setup.count > 0 ? "var(--color-gray-100)" : "var(--color-gray-600)" }}>
                      {setup.count > 0 ? `${setup.winRate.toFixed(0)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 700 }}>Net P&L</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: setup.netPnl > 0 ? "var(--color-profit)" : setup.netPnl < 0 ? "var(--color-loss)" : "var(--color-gray-600)" }}>
                      {setup.count > 0 ? `${setup.netPnl > 0 ? "+" : ""}$${setup.netPnl.toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 700 }}>Trades</div>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: setup.count > 0 ? "var(--color-gray-100)" : "var(--color-gray-600)" }}>
                      {setup.count}
                    </div>
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                    <button className="btn btn-primary" onClick={() => saveEdit(setup.id)} disabled={saving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <Save size={14} /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button className="btn btn-outline" onClick={cancelEdit} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => startEdit(setup)}
                      title="Edit"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    {!setup.isDefault && (
                      <button 
                        className="btn btn-outline" 
                        onClick={() => setAsDefault(setup.id, setup.name)}
                        style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                      >
                        <Check size={14} /> Set Default
                      </button>
                    )}
                    <button 
                      className="btn btn-outline" 
                      onClick={() => deleteSetup(setup.id, setup.name)}
                      style={{ display: "flex", justifyContent: "center", alignItems: "center", color: "var(--color-loss)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                      title="Delete Setup"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
