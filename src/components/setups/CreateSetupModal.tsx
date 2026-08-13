"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X, Plus } from "lucide-react"

type CreateSetupModalProps = {
  onCreated: () => void
}

export function CreateSetupModal({ onCreated }: CreateSetupModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return

    setLoading(true)
    try {
      const res = await fetch("/api/setups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to create setup")
      
      toast.success(`Setup "${name}" created`)
      onCreated()
      setIsOpen(false)
      setName("")
      setDescription("")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setIsOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Plus size={16} /> New Setup
      </button>

      {isOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div className="card" style={{ width: 400, maxWidth: "90vw", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Create New Setup</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Setup Name *</label>
                <input 
                  autoFocus
                  required
                  placeholder="e.g. A+ Breakout"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="input" 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="label">Description (optional)</label>
                <textarea 
                  placeholder="Rules, confluence factors..."
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  className="input" 
                  rows={4}
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading || !name}>
                  {loading ? "Creating..." : "Create Setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
