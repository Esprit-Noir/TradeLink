"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CFD_SYMBOLS } from "@/lib/market/symbols"

export function AddTradeModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [setups, setSetups] = useState<any[]>([])

  useEffect(() => {
    if (isOpen && setups.length === 0) {
      fetch("/api/setups").then(r => r.json()).then(data => setSetups(data)).catch(() => toast.error("Failed to load setups"))
    }
  }, [isOpen, setups.length])

  const [formData, setFormData] = useState({
    symbol: "",
    instrumentType: "stock",
    side: "LONG",
    quantity: "",
    entryPrice: "",
    exitPrice: "",
    entryAt: "",
    exitAt: "",
    fees: "0",
    setupTags: "",
    emotionTags: "",
    notesPost: "",
  })

  useEffect(() => {
    setFormData(prev => {
      if (prev.entryAt) return prev
      const now = new Date().toISOString().slice(0, 16)
      return { ...prev, entryAt: now, exitAt: now }
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      let screenshotUrl = ""

      // Upload file if selected
      if (file) {
        const uploadRes = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
          method: "POST",
          body: file,
        })
        if (!uploadRes.ok) {
          throw new Error("Failed to upload screenshot")
        }
        const blob = await uploadRes.json()
        screenshotUrl = blob.url
      }

      const payload = { ...formData, screenshotUrl }

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to add trade")
      }

      setIsOpen(false)
      router.refresh() // Refresh the Server Component to show the new trade
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button 
        className="btn btn-primary" 
        onClick={() => setIsOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Add Trade
      </button>

      {isOpen && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem"
        }}>
          <div className="card glass animate-in" style={{ width: "100%", maxWidth: 650, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "none",
                border: "none",
                color: "var(--color-gray-400)",
                cursor: "pointer"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div style={{ marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-gray-100)" }}>Manual Trade Entry</h2>
              <p style={{ fontSize: "0.875rem", color: "var(--color-gray-400)" }}>Record a trade that isn't in your CSV imports.</p>
            </div>

            {error && (
              <div style={{
                background: "var(--color-loss-muted)",
                color: "var(--color-loss)",
                padding: "0.75rem",
                borderRadius: "8px",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
                border: "1px solid rgba(239, 68, 68, 0.2)"
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Symbol</label>
                  <select name="symbol" value={formData.symbol} onChange={handleChange} className="input select" required>
                    <option value="">Choose a symbol</option>
                    {CFD_SYMBOLS.map(s => (
                      <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Instrument Type</label>
                  <select name="instrumentType" value={formData.instrumentType} onChange={handleChange} className="input select">
                    <option value="stock">Stocks</option>
                    <option value="forex">Forex</option>
                    <option value="crypto">Crypto</option>
                    <option value="futures">Futures</option>
                    <option value="options">Options</option>
                    <option value="indices">Indices</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Side</label>
                  <select name="side" value={formData.side} onChange={handleChange} className="input select">
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Quantity</label>
                  <input name="quantity" type="number" step="any" value={formData.quantity} onChange={handleChange} className="input" required />
                </div>
                <div className="form-group">
                  <label className="label">Entry Price</label>
                  <input name="entryPrice" type="number" step="any" value={formData.entryPrice} onChange={handleChange} className="input" required />
                </div>
                <div className="form-group">
                  <label className="label">Exit Price</label>
                  <input name="exitPrice" type="number" step="any" value={formData.exitPrice} onChange={handleChange} className="input" required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Entry Date</label>
                  <input name="entryAt" type="datetime-local" value={formData.entryAt} onChange={handleChange} className="input" required />
                </div>
                <div className="form-group">
                  <label className="label">Exit Date</label>
                  <input name="exitAt" type="datetime-local" value={formData.exitAt} onChange={handleChange} className="input" required />
                </div>
                <div className="form-group">
                  <label className="label">Fees</label>
                  <input name="fees" type="number" step="any" value={formData.fees} onChange={handleChange} className="input" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                <div className="form-group">
                  <label className="label">Setup</label>
                  <select name="setupTags" value={formData.setupTags} onChange={handleChange} className="input select">
                    <option value="">-- Auto-apply Default Setup --</option>
                    {setups.map(s => (
                      <option key={s.id} value={s.name}>{s.name} {s.isDefault ? "(Default)" : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Emotion Tags (comma separated)</label>
                  <input name="emotionTags" value={formData.emotionTags} onChange={handleChange} className="input" placeholder="e.g. FOMO, Patient" />
                </div>
              </div>
              
              <div className="form-group">
                <label className="label">Trade Notes</label>
                <textarea name="notesPost" value={formData.notesPost} onChange={(e: any) => handleChange(e)} className="input" placeholder="What happened in this trade?" style={{ minHeight: "80px", resize: "vertical" }} />
              </div>

              <div className="form-group">
                <label className="label">Screenshot (Optional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="input" 
                  style={{ padding: "0.4rem" }} 
                />
              </div>

              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
