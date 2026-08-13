"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ImportPage() {
  const router = useRouter()
  const [broker, setBroker] = useState("BINANCE")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [defaultSetupName, setDefaultSetupName] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/setups")
      .then(r => r.json())
      .then((setups: any[]) => {
        const def = setups.find(s => s.isDefault)
        if (def) setDefaultSetupName(def.name)
      })
      .catch(console.error)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
      setError("")
      setSuccess("")
    }
  }

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a file to import.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("broker", broker)

      const res = await fetch("/api/trades/import", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to import trades")
      }

      setSuccess(`Successfully imported ${data.count} trades!`)
      setFile(null)
      
      // Reset input element
      const fileInput = document.getElementById("csv-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Import Trades</h1>
          <p className="page-subtitle">Upload your broker CSV statements to populate your journal</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
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

        {success && (
          <div style={{
            background: "var(--color-profit-muted)",
            color: "var(--color-profit)",
            padding: "0.75rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(16, 185, 129, 0.2)"
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleImport} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="form-group">
            <label className="label">Broker / Exchange</label>
            <select 
              className="input select" 
              value={broker} 
              onChange={(e) => setBroker(e.target.value)}
              disabled={loading}
            >
              <option value="BINANCE">Binance (Trades History CSV)</option>
              <option value="BYBIT">Bybit (Trade History CSV)</option>
              <option value="INTERACTIVE_BROKERS">Interactive Brokers (Activity Flex Query)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="label">CSV File</label>
            <div 
              className={`upload-zone ${file ? 'drag-over' : ''}`}
              onClick={() => document.getElementById('csv-file')?.click()}
            >
              <input 
                id="csv-file"
                type="file" 
                accept=".csv"
                className="sr-only" 
                onChange={handleFileChange}
                disabled={loading}
              />
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📁</div>
              {file ? (
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-gray-200)" }}>{file.name}</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>{(file.size / 1024).toFixed(1)} KB</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-gray-300)" }}>Click to browse</div>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>or drag and drop your CSV file here</div>
                </div>
              )}
            </div>
          </div>

          {defaultSetupName ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.9rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "var(--radius-card)", fontSize: "0.85rem", color: "var(--color-gray-400)" }}>
              <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>🏷️</span>
              <span>
                All imported trades will be tagged with your default setup: {" "}
                <strong style={{ color: "var(--color-gray-200)" }}>"{defaultSetupName}"</strong>.
                Change it in the {" "}
                <a href="/setups" style={{ color: "var(--color-brand-500)", textDecoration: "underline" }}>Setups page</a>.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.9rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "var(--radius-card)", fontSize: "0.85rem", color: "var(--color-gray-500)" }}>
              <span style={{ fontSize: "1.25rem", flexShrink: 0 }}>⚠️</span>
              <span>No default setup defined. Imported trades will have no setup tag. <a href="/setups" style={{ color: "var(--color-brand-500)", textDecoration: "underline" }}>Create one now</a>.</span>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || !file}
            style={{ padding: "0.75rem" }}
          >
            {loading ? "Importing..." : "Import Data"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "2rem", maxWidth: 600 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--color-gray-300)" }}>
          Supported Formats
        </h3>
        <ul style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", paddingLeft: "1.2rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <li><strong>Binance:</strong> Export your "Trade History" from the Orders section. Make sure to select all pairs.</li>
          <li><strong>Bybit:</strong> Download the "Trade History" CSV from your Spot or Derivatives account.</li>
          <li><strong>Interactive Brokers:</strong> Create an Activity Flex Query containing "Trades" and download as CSV.</li>
        </ul>
      </div>
    </div>
  )
}
