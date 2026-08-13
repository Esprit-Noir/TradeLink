import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function CreateAccountModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [type, setType] = useState("personal")
  const [broker, setBroker] = useState("")
  const [initialBalance, setInitialBalance] = useState("10000")
  const [baseCurrency, setBaseCurrency] = useState("USD")
  const [fxRateToUsd, setFxRateToUsd] = useState("1")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          broker: broker || null,
          initialBalance,
          baseCurrency,
          fxRateToUsd,
        })
      })

      if (!res.ok) throw new Error("Failed to create account")
      
      router.refresh()
      onClose()
      
      // Reset form
      setName("")
      setBroker("")
      setType("personal")
      setInitialBalance("10000")
      setBaseCurrency("USD")
      setFxRateToUsd("1")
    } catch (error) {
      toast.error("Error creating account")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0" 
        style={{ background: "rgba(0,0,0,0.6)", zIndex: 40 }} 
        onClick={onClose} 
      />
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 50, padding: "1rem" }}>
        <div style={{
          background: "var(--color-gray-950)",
          width: "100%", maxWidth: "450px",
          borderRadius: "16px",
          border: "1px solid var(--color-gray-800)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
        }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Create New Account</h2>
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
          </div>
          
          <form onSubmit={handleSubmit} style={{ padding: "1.5rem" }}>
            
            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Account Type</label>
              <select className="input" value={type} onChange={e => setType(e.target.value)} required>
                <option value="personal">Personal Account</option>
                <option value="demo">Demo Account</option>
                {/* Prop Firm omitted intentionally, created via Challenges page */}
              </select>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="label">Account Name</label>
              <input type="text" className="input" placeholder="e.g. Main Swing Portfolio" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label className="label">Broker (Optional)</label>
                <input type="text" className="input" placeholder="e.g. Interactive Brokers" value={broker} onChange={e => setBroker(e.target.value)} />
              </div>
              <div>
                <label className="label">Initial Balance</label>
                <input type="number" className="input" placeholder="10000" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label className="label">Base Currency</label>
                <select className="input" value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
                  {["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">FX Rate to USD</label>
                <input type="number" step="0.000001" min="0" className="input" placeholder="1" value={fxRateToUsd} onChange={e => setFxRateToUsd(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
