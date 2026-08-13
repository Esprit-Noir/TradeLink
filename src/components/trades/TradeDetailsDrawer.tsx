"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Trade = any // Using any for brevity in this MVP, ideally type it

export function TradeDetailsDrawer() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tradeId = searchParams?.get("tradeId")
  
  const [trade, setTrade] = useState<Trade | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit Mode States
  const [editMode, setEditMode] = useState(false)
  const [editedSetupTags, setEditedSetupTags] = useState("")
  const [editedEmotionTags, setEditedEmotionTags] = useState("")
  const [editedNotes, setEditedNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const isOpen = !!tradeId

  useEffect(() => {
    if (tradeId) {
      setLoading(true)
      setUploadError(null)
      setEditMode(false) // Reset edit mode on new trade
      fetch(`/api/trades/${tradeId}`)
        .then(r => r.json())
        .then(data => {
          setTrade(data)
          setEditedSetupTags(data.setupTags?.join(", ") || "")
          setEditedEmotionTags(data.emotionTags?.join(", ") || "")
          setEditedNotes(data.notesPost || "")
          setLoading(false)
        })
        .catch(() => setLoading(false))
    } else {
      setTrade(null)
    }
  }, [tradeId])

  const closeDrawer = () => {
    const params = new URLSearchParams(searchParams as any)
    params.delete("tradeId")
    router.push(`?${params.toString()}`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !tradeId) return
    const file = e.target.files[0]
    setUploading(true)
    setUploadError(null)

    try {
      // 1. Upload to blob storage
      const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      })
      const blob = await res.json()

      if (blob.url) {
        // 2. Save screenshot URL to DB
        const dbRes = await fetch(`/api/trades/${tradeId}/screenshots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storageUrl: blob.url,
            fileName: file.name
          })
        })
        const dbData = await dbRes.json()
        
        if (dbData.error) {
          throw new Error(dbData.error)
        }
        
        // 3. Refresh trade data
        const tRes = await fetch(`/api/trades/${tradeId}`)
        const tData = await tRes.json()
        setTrade(tData)
        
        // Refresh router to update table indicator
        router.refresh()
      } else if (blob.error) {
        throw new Error(blob.error)
      }
    } catch (err: any) {
      console.error("Upload failed", err)
      setUploadError(err.message || "Failed to upload image")
      alert(`Upload failed: ${err.message || "Unknown error"}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveDetails = async () => {
    if (!tradeId) return
    setSaving(true)
    try {
      const payload = {
        setupTags: editedSetupTags.split(",").map(s => s.trim()).filter(Boolean),
        emotionTags: editedEmotionTags.split(",").map(s => s.trim()).filter(Boolean),
        notesPost: editedNotes
      }

      const res = await fetch(`/api/trades/${tradeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error("Failed to update trade")
      
      const updatedTrade = await res.json()
      // Preserve screenshots which might not be returned in the PATCH if not included
      setTrade({ ...updatedTrade, screenshots: trade?.screenshots || [] })
      setEditMode(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to save details", error)
      alert("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 40,
        }}
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div 
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "450px", maxWidth: "100%",
          backgroundColor: "var(--color-gray-950)",
          borderLeft: "1px solid var(--color-gray-800)",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.5)",
          zIndex: 50,
          display: "flex", flexDirection: "column",
          animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Trade Details</h2>
          <button onClick={closeDrawer} style={{ background: "none", border: "none", color: "var(--gray-400)", cursor: "pointer" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "2rem" }}>
          {loading || !trade ? (
            <div className="skeleton" style={{ height: 200 }} />
          ) : (
            <>
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {trade.symbol}
                    <span className={`badge ${trade.side === 'LONG' ? 'badge-profit' : 'badge-loss'}`}>{trade.side}</span>
                  </div>
                  <div style={{ color: "var(--gray-400)", fontSize: "0.9rem", marginTop: "0.25rem" }}>{trade.instrumentType}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, color: Number(trade.netPnl) > 0 ? "var(--color-profit)" : Number(trade.netPnl) < 0 ? "var(--color-loss)" : "inherit" }}>
                    {Number(trade.netPnl) > 0 ? "+" : ""}${Number(trade.netPnl).toFixed(2)}
                  </div>
                  <div style={{ color: "var(--gray-400)", fontSize: "0.9rem", marginTop: "0.25rem" }}>Net P&L</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "var(--gray-900)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--gray-800)" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Entry Date</div>
                  <div style={{ fontWeight: 500 }}>{new Date(trade.entryAt).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Exit Date</div>
                  <div style={{ fontWeight: 500 }}>{trade.exitAt ? new Date(trade.exitAt).toLocaleString() : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Entry Price</div>
                  <div style={{ fontWeight: 500 }}>${Number(trade.entryPrice).toString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Exit Price</div>
                  <div style={{ fontWeight: 500 }}>{trade.exitPrice ? "$" + Number(trade.exitPrice).toString() : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Quantity</div>
                  <div style={{ fontWeight: 500 }}>{Number(trade.quantity).toString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", marginBottom: "0.25rem" }}>Fees</div>
                  <div style={{ fontWeight: 500 }}>${Number(trade.fees).toFixed(2)}</div>
                </div>
              </div>

              {/* Analysis (Editable Tags & Notes) */}
              <div style={{ marginTop: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontWeight: 600, fontSize: "0.95rem" }}>Analysis</h3>
                  {!editMode ? (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="btn btn-outline" 
                      style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem", height: "auto" }}
                    >
                      ✏️ Edit
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => setEditMode(false)}
                        className="btn" 
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem", height: "auto", background: "transparent", border: "1px solid var(--color-gray-700)" }}
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveDetails}
                        disabled={saving}
                        className="btn btn-primary" 
                        style={{ padding: "0.25rem 0.75rem", fontSize: "0.85rem", height: "auto" }}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "var(--color-gray-400)" }}>
                        Setup Tags (comma separated)
                      </label>
                      <input 
                        type="text" 
                        className="input"
                        value={editedSetupTags}
                        onChange={e => setEditedSetupTags(e.target.value)}
                        placeholder="e.g. Breakout, Pullback"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "var(--color-gray-400)" }}>
                        Emotion Tags (comma separated)
                      </label>
                      <input 
                        type="text" 
                        className="input"
                        value={editedEmotionTags}
                        onChange={e => setEditedEmotionTags(e.target.value)}
                        placeholder="e.g. FOMO, Patient"
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem", color: "var(--color-gray-400)" }}>
                        Post-Trade Notes
                      </label>
                      <textarea 
                        className="input"
                        value={editedNotes}
                        onChange={e => setEditedNotes(e.target.value)}
                        rows={4}
                        placeholder="What went well? What could be improved?"
                        style={{ resize: "vertical" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>Setup Tags</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {trade.setupTags && trade.setupTags.length > 0 ? trade.setupTags.map(tag => (
                          <span key={tag} className="badge" style={{ background: "var(--color-gray-800)" }}>{tag}</span>
                        )) : <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)" }}>No setup tags</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>Emotion Tags</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {trade.emotionTags && trade.emotionTags.length > 0 ? trade.emotionTags.map(tag => (
                          <span key={tag} className="badge" style={{ background: "var(--color-gray-800)" }}>{tag}</span>
                        )) : <span style={{ fontSize: "0.85rem", color: "var(--color-gray-600)" }}>No emotion tags</span>}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>Post-Trade Notes</span>
                      <div style={{ 
                        background: "var(--color-gray-900)", 
                        padding: "1rem", 
                        borderRadius: "8px", 
                        border: "1px solid var(--color-gray-800)",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                        color: "var(--color-gray-300)"
                      }}>
                        {trade.notesPost || <span style={{ color: "var(--color-gray-600)" }}>No notes added.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Screenshots */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--gray-300)" }}>Screenshots</h3>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "+ Add"}
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: "none" }} 
                    onChange={handleFileUpload} 
                  />
                </div>

                {trade.screenshots?.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {trade.screenshots.map((s: any) => (
                      <a key={s.id} href={s.storageUrl} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--gray-800)" }}>
                        {/* Using standard img tag because next/image requires host config for external URLs */}
                        <img src={s.storageUrl} alt="Screenshot" style={{ width: "100%", height: "120px", objectFit: "cover", display: "block" }} />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "2rem", textAlign: "center", background: "var(--gray-900)", borderRadius: "12px", border: "1px dashed var(--gray-700)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--gray-500)", margin: "0 auto 0.5rem" }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                    <div style={{ color: "var(--gray-400)", fontSize: "0.9rem" }}>No screenshots uploaded</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  )
}
