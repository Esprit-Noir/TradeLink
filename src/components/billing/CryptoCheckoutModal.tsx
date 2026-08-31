"use client"

import { useState } from "react"
import { toast } from "sonner"
import { X, Copy, CheckCircle2 } from "lucide-react"

type Plan = { id: string; name: string; price: number | string }

export function CryptoCheckoutModal({ plan, onClose }: { plan: Plan, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<"pay" | "confirm" | "success">("pay")
  const [txHash, setTxHash] = useState("")

  // Mock addresses for MVP
  const USDT_TRC20 = "T9yD14Nj9j7xAB4dbGeiX9h8unkgU4mQY9"

  const handleCopy = () => {
    navigator.clipboard.writeText(USDT_TRC20)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success("Address copied to clipboard")
  }

  const handleSubmit = async () => {
    if (!txHash) {
      toast.error("Please enter the transaction hash")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          cryptoTxId: txHash,
        })
      })
      if (!res.ok) throw new Error("Failed to submit subscription request")
      
      setStep("success")
    } catch (err: unknown) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.95)" }}>
      <div className="card" style={{ width: "100%", maxWidth: 450, background: "var(--color-gray-950)", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Upgrade to {plan.name}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: "0.5rem" }}><X size={20} /></button>
        </div>

        {step === "pay" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ color: "var(--color-gray-400)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Total to pay</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-brand-400)" }}>
                ${Number(plan.price).toFixed(2)} <span style={{ fontSize: "1rem", color: "var(--color-gray-500)" }}>USDT</span>
              </div>
            </div>

            <div>
              <label className="label">Send exactly ${Number(plan.price).toFixed(2)} USDT (TRC20) to:</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input type="text" className="input" value={USDT_TRC20} readOnly style={{ fontFamily: "monospace" }} />
                <button onClick={handleCopy} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                  {copied ? <CheckCircle2 size={18} color="var(--color-brand-500)" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <button onClick={() => setStep("confirm")} className="btn btn-primary" style={{ marginTop: "1rem", width: "100%" }}>
              I have made the payment
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ color: "var(--color-gray-300)", fontSize: "0.9rem" }}>
              Please provide the transaction hash (TxID) of your payment so our team can verify it.
            </p>
            <div className="form-group">
              <label className="label">Transaction Hash (TxID)</label>
              <input 
                type="text" 
                className="input" 
                placeholder="e.g. 8d3...9f1" 
                value={txHash}
                onChange={e => setTxHash(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button onClick={() => setStep("pay")} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
              <button onClick={handleSubmit} disabled={loading || !txHash} className="btn btn-primary" style={{ flex: 2 }}>
                {loading ? "Submitting..." : "Submit Verification"}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
              <CheckCircle2 size={64} color="var(--color-brand-500)" />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Payment Submitted!</h3>
            <p style={{ color: "var(--color-gray-400)", marginBottom: "2rem" }}>
              Your transaction has been submitted. An admin will review and activate your {plan.name} plan shortly.
            </p>
            <button onClick={onClose} className="btn btn-secondary" style={{ width: "100%" }}>
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
