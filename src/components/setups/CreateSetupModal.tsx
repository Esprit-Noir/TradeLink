"use client"

import { useState, useMemo } from "react"
import { toast } from "sonner"
import { X, Plus, BookOpen, PenTool, Check } from "lucide-react"
import { SETUP_TEMPLATES, SetupTemplate } from "@/lib/setups-templates"

type CreateSetupModalProps = {
  onCreated: () => void
}

export function CreateSetupModal({ onCreated }: CreateSetupModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"template" | "custom">("template")
  const [loading, setLoading] = useState(false)
  
  // Custom mode state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Template mode state
  const [selectedTemplate, setSelectedTemplate] = useState<SetupTemplate | null>(null)
  
  const categories = useMemo(() => Array.from(new Set(SETUP_TEMPLATES.map(t => t.category))), [])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    const finalName = mode === "custom" ? name : selectedTemplate?.name
    const finalDesc = mode === "custom" ? description : selectedTemplate?.description

    if (!finalName) return

    setLoading(true)
    try {
      const res = await fetch("/api/setups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: finalName, description: finalDesc }),
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to create setup")
      
      toast.success(`Setup "${finalName}" added`)
      onCreated()
      setIsOpen(false)
      // reset
      setName("")
      setDescription("")
      setSelectedTemplate(null)
    } catch (err) {
      toast.error((err as { message?: string })?.message || "Failed to create setup")
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
          <div className="chart-card" style={{ width: 550, maxWidth: "90vw", padding: "0", display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-gray-800)" }}>
              <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Add a Setup</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: "flex", padding: "1rem 1.5rem", gap: "0.5rem", borderBottom: "1px solid var(--color-gray-800)", background: "var(--color-gray-950)" }}>
              <button 
                onClick={() => setMode("template")}
                style={{ 
                  flex: 1, padding: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
                  background: mode === "template" ? "var(--color-brand-600)" : "transparent",
                  color: mode === "template" ? "white" : "var(--color-gray-400)"
                }}
              >
                <BookOpen size={16} /> From Templates
              </button>
              <button 
                onClick={() => setMode("custom")}
                style={{ 
                  flex: 1, padding: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
                  background: mode === "custom" ? "var(--color-gray-700)" : "transparent",
                  color: mode === "custom" ? "white" : "var(--color-gray-400)"
                }}
              >
                <PenTool size={16} /> Custom Setup
              </button>
            </div>

            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {mode === "template" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {categories.map(cat => (
                    <div key={cat}>
                      <h3 style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>{cat}</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        {SETUP_TEMPLATES.filter(t => t.category === cat).map(t => (
                          <div 
                            key={t.name}
                            onClick={() => setSelectedTemplate(t)}
                            style={{ 
                              padding: "0.85rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s",
                              border: selectedTemplate?.name === t.name ? "1px solid var(--color-brand-500)" : "1px solid var(--color-gray-800)",
                              background: selectedTemplate?.name === t.name ? "rgba(59, 130, 246, 0.05)" : "var(--color-gray-900)",
                              display: "flex", flexDirection: "column", gap: "0.35rem", position: "relative"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-200)" }}>{t.name}</span>
                              {selectedTemplate?.name === t.name && <Check size={14} style={{ color: "var(--color-brand-500)" }} />}
                            </div>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", lineHeight: 1.4 }}>{t.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <form id="custom-setup-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
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
                </form>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", padding: "1.25rem 1.5rem", borderTop: "1px solid var(--color-gray-800)", background: "var(--color-gray-950)", borderBottomLeftRadius: "12px", borderBottomRightRadius: "12px" }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsOpen(false)}>Cancel</button>
              
              {mode === "template" ? (
                <button type="button" className="btn btn-primary" disabled={loading || !selectedTemplate} onClick={() => handleSubmit()}>
                  {loading ? "Adding..." : "Add Template"}
                </button>
              ) : (
                <button type="submit" form="custom-setup-form" className="btn btn-primary" disabled={loading || !name}>
                  {loading ? "Creating..." : "Create Setup"}
                </button>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}
