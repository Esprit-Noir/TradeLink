"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, Eye, Undo2, AlertTriangle, Download, Loader2, UploadCloud, FileSpreadsheet, Award } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface AccountWithChallenge {
  id: string
  name: string
  type: string
  isDefault: boolean
  propChallenge: {
    firmName: string
    status: string
  } | null
}

const FIELDS = [
  { key: "symbol", label: "Symbol", required: true, hint: "e.g. AAPL, BTCUSDT" },
  { key: "side", label: "Side", required: true, hint: "LONG / SHORT" },
  { key: "entryAt", label: "Entry date", required: true, hint: "e.g. 2026-08-13 14:30" },
  { key: "exitAt", label: "Exit date", hint: "optional" },
  { key: "quantity", label: "Quantity", hint: "optional" },
  { key: "entryPrice", label: "Entry price", hint: "optional" },
  { key: "exitPrice", label: "Exit price", hint: "optional" },
  { key: "fees", label: "Fees", hint: "optional" },
  { key: "netPnl", label: "Net P&L", hint: "or derive from prices" },
  { key: "instrumentType", label: "Instrument", hint: "e.g. STOCK, CRYPTO, FOREX" },
  { key: "status", label: "Status", hint: "open / closed" },
]

type PreviewData = {
  total: number
  duplicates: number
  newRows: number
  previewRows: { symbol: string; side: string; entryAt: string; quantity: number; netPnl: number; fees: number; status: string }[]
  parseErrors: { row: number; message: string }[]
}

export default function ImportPage() {
  const router = useRouter()
  const [broker, setBroker] = useState("BINANCE")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [accounts, setAccounts] = useState<AccountWithChallenge[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState("")

  // Generic CSV mapping
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})

  // Preview + undo
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [undoToken, setUndoToken] = useState<string | null>(null)
  const [undoing, setUndoing] = useState(false)

  useEffect(() => {
    fetch("/api/accounts")
      .then(r => r.json())
      .then((list: AccountWithChallenge[]) => {
        setAccounts(list)
        const def = list.find((a) => a.isDefault) || list[0]
        if (def) setSelectedAccountId(def.id)
      })
      .catch(console.error)
  }, [])

  const isGeneric = broker === "generic"

  const handleBrokerChange = (value: string) => {
    setBroker(value)
    setFile(null)
    setHeaders([])
    setMapping({})
    setError("")
    setSuccess("")
    setPreview(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setError("")
    setSuccess("")
    setPreview(null)
    if (isGeneric) {
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result || "")
        const firstLine = text.split(/\r?\n/).find((l) => l.trim() && !l.startsWith("#")) || ""
        const h = firstLine.split(",").map((x) => x.replace(/"/g, "").trim()).filter(Boolean)
        setHeaders(h)
        setMapping({})
      }
      reader.readAsText(f)
    }
  }

  const autoMap = () => {
    const lower = headers.map((h) => h.toLowerCase())
    const next: Record<string, string> = {}
    for (const f of FIELDS) {
      const found = lower.findIndex((h) =>
        f.key === "symbol" ? /sym|pair|ticker|instrument|coin/.test(h) :
        f.key === "side" ? /side|buy|sell|action|direction/.test(h) :
        f.key === "entryAt" ? /entry.*(time|date)|date.*open|time|open.*time|date/.test(h) :
        f.key === "exitAt" ? /exit.*(time|date)|close.*time|close.*date/.test(h) :
        f.key === "quantity" ? /qty|quantity|amount|volume|size|filled/.test(h) :
        f.key === "entryPrice" ? /entry.*price|avg.*entry|open.*price|price/.test(h) :
        f.key === "exitPrice" ? /exit.*price|avg.*exit|close.*price/.test(h) :
        f.key === "fees" ? /fee|commission|cost/.test(h) :
        f.key === "netPnl" ? /net.*pnl|pnl|realized|profit|gain|pnl.*net/.test(h) :
        f.key === "instrumentType" ? /type|instrument|class|market/.test(h) :
        /status|state/.test(h)
      )
      if (found >= 0 && !Object.values(next).includes(lower[found])) next[f.key] = lower[found]
    }
    setMapping(next)
  }

  const buildFormData = () => {
    const formData = new FormData()
    formData.append("file", file!)
    formData.append("broker", broker)
    if (selectedAccountId) formData.append("accountId", selectedAccountId)
    if (isGeneric) formData.append("mapping", JSON.stringify(mapping))
    return formData
  }

  const runPreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to import.")
      return
    }
    if (isGeneric) {
      const missing = FIELDS.filter(f => f.required && !mapping[f.key])
      if (missing.length > 0) {
        setError(`Please map the required column: ${missing[0].label}.`)
        return
      }
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = buildFormData()
      formData.append("mode", "preview")
      const res = await fetch("/api/trades/import", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to parse file")
      setPreview(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to parse file")
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/trades/import", {
        method: "POST",
        body: buildFormData(),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to import trades")
      }

      const selectedAcc = accounts.find((a) => a.id === selectedAccountId)
      setSuccess(
        selectedAcc
          ? `Successfully imported ${data.count} trades into ${selectedAcc.name}${data.challengeStatus ? ` — status: ${data.challengeStatus}` : ""}!`
          : `Successfully imported ${data.count} trades!`
      )
      setUndoToken(data.token || null)
      setFile(null)
      setHeaders([])
      setMapping({})
      setPreview(null)

      const fileInput = document.getElementById("csv-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to import trades")
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    if (!undoToken) return
    setUndoing(true)
    try {
      const res = await fetch("/api/trades/import/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: undoToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to undo import")
      setUndoToken(null)
      setSuccess(`Rolled back ${data.deleted} imported trade(s).`)
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to undo import")
    } finally {
      setUndoing(false)
    }
  }

  const resetMapping = () => setMapping({})

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "0.5rem" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Importateur de relevés CSV
          </h1>
          <p className="page-subtitle" style={{ fontSize: "0.9rem", color: "var(--color-gray-400)" }}>
            Importez les relevés de votre courtier pour alimenter automatiquement votre journal et évaluer vos challenges.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
        {/* Left Column: Form & Configuration */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="chart-card" style={{ padding: "1.5rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileSpreadsheet size={18} style={{ color: "var(--color-brand-400)" }} />
              Configuration de l&apos;import
            </h2>

            {error && (
              <div style={{
                background: "rgba(239, 68, 68, 0.08)",
                color: "var(--color-loss)",
                padding: "0.85rem",
                borderRadius: "8px",
                fontSize: "0.82rem",
                border: "1px solid rgba(239, 68, 68, 0.25)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.6rem"
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-loss)" }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                background: "var(--profit-muted)",
                color: "var(--color-profit)",
                padding: "0.85rem",
                borderRadius: "8px",
                fontSize: "0.82rem",
                border: "1px solid color-mix(in srgb, var(--color-profit) 25%, transparent)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                  <Check size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{success}</span>
                </div>
                {undoToken && (
                  <button
                    onClick={handleUndo}
                    disabled={undoing}
                    className="btn btn-outline btn-sm"
                    style={{
                      alignSelf: "flex-start",
                      padding: "0.25rem 0.6rem",
                      fontSize: "0.75rem",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      marginTop: "0.25rem",
                      background: "rgba(255,255,255,0.03)"
                    }}
                  >
                    <Undo2 size={12} /> {undoing ? "Annulation…" : "Annuler l'import"}
                  </button>
                )}
              </div>
            )}

            <form onSubmit={runPreview} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="label" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  Broker / Plateforme
                </label>
                <select
                  className="input select"
                  value={broker}
                  onChange={(e) => handleBrokerChange(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%", background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", height: "38px" }}
                >
                  <option value="BINANCE">Binance (Trades History CSV)</option>
                  <option value="BYBIT">Bybit (Trade History CSV)</option>
                  <option value="INTERACTIVE_BROKERS">Interactive Brokers (Activity Flex Query)</option>
                  <option value="metatrader">MetaTrader 4 / 5 (MT4/MT5 CSV Statement)</option>
                  <option value="generic">CSV Générique (mapping manuel de colonnes)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  Importer vers le compte
                </label>
                <select
                  className="input select"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  disabled={loading}
                  style={{ width: "100%", background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", height: "38px" }}
                >
                  {accounts.map(acc => {
                    const typeLabel = acc.type === "prop_firm" ? "Prop Firm" : acc.type === "demo" ? "Démo" : "Personnel"
                    const challengeLabel = acc.propChallenge ? ` — ${acc.propChallenge.firmName || "Challenge"} (${acc.propChallenge.status})` : ""
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({typeLabel}){challengeLabel}
                      </option>
                    )
                  })}
                </select>
                {(() => {
                  const selectedAcc = accounts.find((a) => a.id === selectedAccountId)
                  if (selectedAcc?.propChallenge) {
                    return (
                      <div style={{ fontSize: "0.74rem", color: "var(--color-brand-400)", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Award size={13} />
                        <span>Ce compte est lié à un challenge prop firm. Il sera réévalué automatiquement.</span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>

              <div className="form-group">
                <label className="label" style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.4rem" }}>
                  Fichier CSV de transactions
                </label>
                <div
                  className={`upload-zone ${file ? 'drag-over' : ''}`}
                  onClick={() => document.getElementById('csv-file')?.click()}
                  style={{
                    border: "2px dashed var(--color-gray-800)",
                    borderRadius: "10px",
                    padding: "2rem 1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    background: file ? "color-mix(in srgb, var(--color-profit) 2%, transparent)" : "rgba(3,3,4,0.4)",
                    borderColor: file ? "var(--color-profit-muted)" : "var(--color-gray-800)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <UploadCloud size={32} style={{ color: file ? "var(--color-profit)" : "var(--color-gray-500)", marginBottom: "0.75rem", transition: "color 0.2s" }} />
                  {file ? (
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--color-gray-200)", fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
                        {(file.size / 1024).toFixed(1)} KB · Prêt à être analysé
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--color-gray-200)", fontSize: "0.85rem" }}>
                        Cliquez ou glissez-déposez le fichier
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>
                        Uniquement les fichiers .csv
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generic Mapping controls */}
              {isGeneric && file && headers.length > 0 && (
                <div style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-gray-900)", paddingBottom: "0.5rem" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-gray-200)" }}>
                      Mapping des colonnes
                    </div>
                    <div style={{ display: "flex", gap: "0.35rem" }}>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={autoMap} style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                        Auto-map
                      </button>
                      <button type="button" className="btn btn-ghost btn-xs" onClick={resetMapping} style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                        Reset
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "240px", overflowY: "auto", paddingRight: "0.25rem" }}>
                    {FIELDS.map(f => (
                      <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "0.76rem", fontWeight: 600, color: "var(--color-gray-300)" }}>
                            {f.label} {f.required && <span style={{ color: "var(--color-loss)" }}>*</span>}
                          </span>
                          <span style={{ fontSize: "0.65rem", color: "var(--color-gray-600)" }}>{f.hint}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <select
                            className="input select"
                            value={mapping[f.key] || ""}
                            onChange={(e) => setMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                            style={{ flex: 1, fontSize: "0.78rem", height: "30px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}
                          >
                            <option value="">— Non mappé —</option>
                            {headers.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          {mapping[f.key] && (
                            <Check size={14} style={{ color: "var(--color-profit)", flexShrink: 0 }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-outline"
                disabled={loading || !file || (isGeneric && headers.length === 0)}
                style={{
                  padding: "0.65rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  height: "40px",
                  borderColor: "var(--color-gray-700)"
                }}
              >
                {loading ? <Loader2 size={15} className="spin" /> : <Eye size={15} />}
                {loading ? "Traitement…" : "Prévisualiser les données"}
              </button>
            </form>
          </div>

          {/* Formats info card */}
          <div className="chart-card" style={{ padding: "1.25rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "12px" }}>
            <h3 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-gray-200)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Formats de fichiers supportés
            </h3>
            <ul style={{ fontSize: "0.78rem", color: "var(--color-gray-400)", paddingLeft: "1rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li><strong>Binance:</strong> Fichier CSV exporté depuis &quot;Historique des transactions&quot;.</li>
              <li><strong>Bybit:</strong> Historique de trades spot ou dérivés téléchargé au format CSV.</li>
              <li><strong>Interactive Brokers:</strong> Rapport d&apos;activité généré via une requête Flex CSV.</li>
              <li><strong>MetaTrader 4 / 5:</strong> Relevé d&apos;historique de compte exporté en format CSV.</li>
              <li><strong>Générique:</strong> N&apos;importe quel fichier CSV (mappage manuel des colonnes).</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Preview & Action */}
        <div style={{ height: "100%" }}>
          {preview ? (
            <div className="chart-card" style={{ padding: "1.5rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Eye size={18} style={{ color: "var(--color-brand-400)" }} />
                Aperçu avant importation
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                <div style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "0.6rem 0.85rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>Total trouvés</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-gray-100)", marginTop: "0.15rem" }}>{preview.total}</div>
                </div>
                <div style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "0.6rem 0.85rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>Nouveaux</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--color-profit)", marginTop: "0.15rem" }}>{preview.newRows}</div>
                </div>
                <div style={{ background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", padding: "0.6rem 0.85rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.03em" }}>Doublons</div>
                  <div style={{ fontSize: "1.4rem", fontWeight: 800, color: preview.duplicates > 0 ? "var(--color-warning)" : "var(--color-gray-400)", marginTop: "0.15rem" }}>{preview.duplicates}</div>
                </div>
              </div>

              {preview.duplicates > 0 && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", padding: "0.65rem", borderRadius: "8px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "0.78rem", color: "var(--color-gray-300)" }}>
                  <AlertTriangle size={14} style={{ color: "var(--color-warning)", marginTop: 2, flexShrink: 0 }} />
                  <span>{preview.duplicates} lignes existantes seront ignorées.</span>
                </div>
              )}

              {preview.parseErrors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.65rem", borderRadius: "8px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "0.76rem", color: "var(--color-gray-300)" }}>
                  {preview.parseErrors.slice(0, 3).map((err, idx) => (
                    <div key={idx}>Ligne {err.row} : {err.message}</div>
                  ))}
                </div>
              )}

              {preview.previewRows.length > 0 && (
                <div style={{ overflowX: "auto", border: "1px solid var(--color-gray-800)", borderRadius: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-gray-800)", background: "var(--color-gray-950)", color: "var(--color-gray-500)", textTransform: "uppercase", fontSize: "0.65rem", fontWeight: 700 }}>
                        <th style={{ padding: "0.5rem 0.65rem" }}>Symbole</th>
                        <th style={{ padding: "0.5rem 0.65rem" }}>Sens</th>
                        <th style={{ padding: "0.5rem 0.65rem" }}>Date d&apos;entrée</th>
                        <th style={{ padding: "0.5rem 0.65rem" }}>Taille</th>
                        <th style={{ padding: "0.5rem 0.65rem" }}>Frais</th>
                        <th style={{ padding: "0.5rem 0.65rem" }}>P&L Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.previewRows.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--color-gray-900)" }}>
                          <td style={{ padding: "0.5rem 0.65rem", fontWeight: 600, color: "var(--color-gray-200)" }}>{r.symbol}</td>
                          <td style={{ padding: "0.5rem 0.65rem" }}>
                            <span style={{
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              padding: "0.1rem 0.35rem",
                              borderRadius: "4px",
                              background: r.side === "LONG" ? "var(--profit-muted)" : "var(--loss-muted)",
                              color: r.side === "LONG" ? "var(--color-profit)" : "var(--color-loss)",
                            }}>
                              {r.side}
                            </span>
                          </td>
                          <td style={{ padding: "0.5rem 0.65rem", color: "var(--color-gray-500)" }}>
                            {new Date(r.entryAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td style={{ padding: "0.5rem 0.65rem", fontWeight: 500 }}>{Number(r.quantity).toLocaleString()}</td>
                          <td style={{ padding: "0.5rem 0.65rem", color: "var(--color-gray-500)" }}>
                            {r.fees > 0 ? formatCurrency(r.fees, "USD", true, 2) : formatCurrency(0, "USD", true, 2)}
                          </td>
                          <td style={{ padding: "0.5rem 0.65rem", fontWeight: 700, color: r.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                            {formatCurrency(r.netPnl, "USD", true, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.total > preview.previewRows.length && (
                    <div style={{ fontSize: "0.72rem", color: "var(--color-gray-500)", padding: "0.5rem 0.65rem", borderTop: "1px solid var(--color-gray-800)", background: "var(--color-gray-950)" }}>
                      … et {preview.total - preview.previewRows.length} autres transactions.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={loading || preview.newRows === 0}
                className="btn btn-primary"
                style={{
                  padding: "0.65rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  height: "40px",
                  marginTop: "0.5rem"
                }}
              >
                {loading ? <Loader2 size={15} className="spin" /> : <Download size={15} />}
                {loading ? "Importation…" : `Importer ${preview.newRows} transaction${preview.newRows !== 1 ? "s" : ""}`}
              </button>
            </div>
          ) : (
            <div className="chart-card" style={{ padding: "2.5rem 2rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "12px", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: "360px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-gray-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", marginBottom: "1.25rem" }}>
                📊
              </div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-gray-200)", marginBottom: "0.5rem" }}>
                Aperçu en direct
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--color-gray-500)", maxWidth: "280px", lineHeight: 1.5 }}>
                Configurez votre courtier et chargez un relevé CSV sur le panneau de gauche pour voir l&apos;aperçu des transactions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
