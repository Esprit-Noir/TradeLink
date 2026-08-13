import React from "react"
import { PropFirmGauges } from "./PropFirmGauges"

export function ChallengeDetailsDrawer({
  challenge,
  onClose
}: {
  challenge: any
  onClose: () => void
}) {
  if (!challenge) return null

  const isBreached = challenge.status === 'failed' || challenge.status === 'breached'
  const isPassed = challenge.status === 'passed'

  return (
    <>
      <div 
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} 
        onClick={onClose}
      />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "600px",
        background: "var(--color-gray-950)", zIndex: 50, borderLeft: "1px solid var(--color-gray-800)",
        display: "flex", flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)"
      }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 600 }}>Challenge Details</h2>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginTop: "0.25rem" }}>
              {challenge.account.name} — {challenge.template.firmName}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.5rem" }}>&times;</button>
        </div>

        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }}>
          
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ flex: 1, background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Status</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: isBreached ? "var(--color-loss)" : isPassed ? "var(--color-profit)" : "var(--color-brand-500)" }}>
                {challenge.status.toUpperCase()}
              </div>
            </div>
            <div style={{ flex: 1, background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Phase</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>
                {challenge.phase === 'phase_1' ? "Phase 1" : challenge.phase === 'phase_2' ? "Phase 2" : "Funded"}
              </div>
            </div>
            <div style={{ flex: 1, background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Steps</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>
                {challenge.metadata?.steps === 'master' ? 'Funded' : `${challenge.metadata?.steps} Step(s)`}
              </div>
            </div>
          </div>

          <PropFirmGauges challenge={challenge} />

          <div style={{ marginTop: "2rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Account Statistics</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Initial Balance</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.initialBalance).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
              </div>
              <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Current Equity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.currentEquity).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
              </div>
              <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Highest Balance</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.highestBalance).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
              </div>
              <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Highest Equity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.highestEquity).toLocaleString("en-US", {minimumFractionDigits: 2})}</div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  )
}
