"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/formatters"
import { X, UploadCloud } from "lucide-react"

type Trade = {
  id: string
  symbol: string
  side: string
  quantity: number
  entryPrice: number
  exitPrice: number | null
  entryAt: string
  exitAt: string | null
  netPnl: number | null
  netPnlUsd?: number | null
  riskAmount?: number | null
  fees: number
  setupTags: string[]
  emotionTags: string[]
  notesPost: string | null
  screenshots: { id: string; storageUrl: string; fileName: string | null }[]
  instrumentType: string
}

type Setup = { id: string; name: string; isDefault: boolean }

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
  const [availableSetups, setAvailableSetups] = useState<Setup[]>([])

  // Load setups for the edit dropdown
  useEffect(() => {
    if (editMode && availableSetups.length === 0) {
      fetch("/api/setups").then(r => r.json()).then(d => setAvailableSetups(d)).catch(() => toast.error("Failed to load setups"))
    }
  }, [editMode, availableSetups.length])

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
      setUploadError(err.message || "Failed to upload image")
      toast.error(`Upload failed: ${err.message || "Unknown error"}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleDeleteTrade = async () => {
    if (!tradeId) return
    if (!confirm(`Delete this trade (${trade?.symbol || ""})? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete trade")
      toast.success("Trade deleted")
      closeDrawer()
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete trade")
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
      toast.error("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div 
        className="fixed top-0 right-0 h-screen w-[450px] max-w-full bg-[var(--color-gray-950)] border-l border-[var(--color-gray-800)] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="p-6 border-b border-[var(--color-gray-800)] flex justify-between items-center shrink-0">
          <h2 className="text-xl font-semibold">Trade Details</h2>
          <button onClick={closeDrawer} className="bg-transparent border-none text-[var(--color-gray-400)] cursor-pointer hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 pb-16 overflow-y-auto flex-1 flex flex-col gap-8">
          {loading || !trade ? (
            <div className="skeleton h-[200px]" />
          ) : (
            <>
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    {trade.symbol}
                    <span className={`badge ${trade.side === 'LONG' ? 'badge-profit' : 'badge-loss'}`}>{trade.side}</span>
                  </div>
                  <div className="text-[var(--color-gray-400)] text-sm mt-1">{trade.instrumentType}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${Number(trade.netPnl) > 0 ? "text-[var(--color-profit)]" : Number(trade.netPnl) < 0 ? "text-[var(--color-loss)]" : "text-inherit"}`}>
                    {formatCurrency(Number(trade.netPnl), "USD", true, 2)}
                  </div>
                  <div className="text-[var(--color-gray-400)] text-sm mt-1">Net P&L</div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4 bg-[var(--color-gray-900)] p-4 rounded-xl border border-[var(--color-gray-800)]">
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">Entry Date</div>
                  <div className="font-medium">{new Date(trade.entryAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">Exit Date</div>
                  <div className="font-medium">{trade.exitAt ? new Date(trade.exitAt).toLocaleString() : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">Entry Price</div>
                  <div className="font-medium">{formatCurrency(Number(trade.entryPrice), "USD", false, 2)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">Exit Price</div>
                  <div className="font-medium">{trade.exitPrice ? formatCurrency(Number(trade.exitPrice), "USD", false, 2) : "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">Quantity</div>
                  <div className="font-medium">{Number(trade.quantity).toString()}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">Fees</div>
                  <div className="font-medium">{formatCurrency(Number(trade.fees), "USD", true, 2)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">R Multiple</div>
                  <div className={`font-bold ${Number(trade.netPnl) >= 0 ? "text-[var(--color-profit)]" : "text-[var(--color-loss)]"}`}>
                    {trade.riskAmount && Number(trade.riskAmount) > 0
                      ? `${Number(trade.netPnl) / Number(trade.riskAmount) >= 0 ? "+" : ""}${(Number(trade.netPnl) / Number(trade.riskAmount)).toFixed(2)}R`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--color-gray-500)] mb-1">P&L (USD)</div>
                  <div className={`font-medium ${(Number(trade.netPnlUsd ?? trade.netPnl) || 0) > 0 ? "text-[var(--color-profit)]" : (Number(trade.netPnlUsd ?? trade.netPnl) || 0) < 0 ? "text-[var(--color-loss)]" : "text-inherit"}`}>
                    {trade.netPnlUsd != null && trade.netPnlUsd !== trade.netPnl
                      ? formatCurrency(Number(trade.netPnlUsd), "USD", true, 2)
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Analysis (Editable Tags & Notes) */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-[0.95rem]">Analysis</h3>
                  {!editMode ? (
                    <button 
                      onClick={() => setEditMode(true)}
                      className="btn btn-outline py-1 px-3 text-sm h-auto" 
                    >
                      ✏️ Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditMode(false)}
                        className="btn py-1 px-3 text-sm h-auto bg-transparent border border-[var(--color-gray-700)]" 
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveDetails}
                        disabled={saving}
                        className="btn btn-primary py-1 px-3 text-sm h-auto" 
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  )}
                </div>

                {editMode ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm mb-1 text-[var(--color-gray-400)]">
                        Setup
                      </label>
                      <select
                        className="input select"
                        value={editedSetupTags}
                        onChange={e => setEditedSetupTags(e.target.value)}
                      >
                        <option value="">-- No Setup --</option>
                        {availableSetups.map(s => (
                          <option key={s.id} value={s.name}>{s.name}{s.isDefault ? " (Default)" : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-[var(--color-gray-400)]">
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
                      <label className="block text-sm mb-1 text-[var(--color-gray-400)]">
                        Post-Trade Notes
                      </label>
                      <textarea 
                        className="input resize-y"
                        value={editedNotes}
                        onChange={e => setEditedNotes(e.target.value)}
                        rows={4}
                        placeholder="What went well? What could be improved?"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[var(--color-gray-500)]">Setup Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {trade.setupTags && trade.setupTags.length > 0 ? trade.setupTags.map((tag: string) => (
                          <span key={tag} className="badge bg-[var(--color-gray-800)]">{tag}</span>
                        )) : <span className="text-sm text-[var(--color-gray-600)]">No setup tags</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[var(--color-gray-500)]">Emotion Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {trade.emotionTags && trade.emotionTags.length > 0 ? trade.emotionTags.map((tag: string) => (
                          <span key={tag} className="badge bg-[var(--color-gray-800)]">{tag}</span>
                        )) : <span className="text-sm text-[var(--color-gray-600)]">No emotion tags</span>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-sm text-[var(--color-gray-500)]">Post-Trade Notes</span>
                      <div className="bg-[var(--color-gray-900)] p-4 rounded-lg border border-[var(--color-gray-800)] text-sm leading-relaxed text-[var(--color-gray-300)]">
                        {trade.notesPost || <span className="text-[var(--color-gray-600)]">No notes added.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Screenshots */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold text-[var(--color-gray-300)]">Screenshots</h3>
                  <button 
                    className="btn btn-secondary py-1 px-3 text-sm h-auto" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "+ Add"}
                  </button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </div>

                {trade.screenshots?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {trade.screenshots.map((s: any) => (
                      <a key={s.id} href={s.storageUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-[var(--color-gray-800)]">
                        {/* Using standard img tag because next/image requires host config for external URLs */}
                        <img src={s.storageUrl} alt="Screenshot" className="w-full h-[120px] object-cover block" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[var(--color-gray-900)] rounded-xl border border-dashed border-[var(--color-gray-700)]">
                    <UploadCloud className="w-6 h-6 text-[var(--color-gray-500)] mx-auto mb-2" />
                    <div className="text-[var(--color-gray-400)] text-sm">No screenshots uploaded</div>
                  </div>
                )}
              </div>

              {/* Delete */}
              <div className="border-t border-[var(--color-gray-800)] pt-5">
                <button
                  className="btn w-full p-2 bg-transparent border border-red-500/35 text-[var(--color-loss)] hover:bg-red-500/10"
                  onClick={handleDeleteTrade}
                >
                  Delete trade
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

