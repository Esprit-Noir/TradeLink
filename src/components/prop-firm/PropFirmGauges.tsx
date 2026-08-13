"use client"

import React from "react"

interface GaugeProps {
  label: string
  used: number
  total: number
  isBreached: boolean
  formatCurrency?: boolean
}

function GaugeBar({ label, used, total, isBreached, formatCurrency = true }: GaugeProps) {
  const pct = Math.min((used / total) * 100, 100)
  
  let colorClass = "bg-brand-500" // Default safe (greenish)
  if (isBreached) colorClass = "bg-red-500"
  else if (pct >= 80) colorClass = "bg-orange-500" // Warning
  
  const formattedUsed = formatCurrency ? `$${used.toLocaleString("en-US", {minimumFractionDigits: 2})}` : used.toString()
  const formattedTotal = formatCurrency ? `$${total.toLocaleString("en-US", {minimumFractionDigits: 2})}` : total.toString()

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.85rem" }}>
        <span style={{ color: "var(--color-gray-300)" }}>{label}</span>
        <span style={{ fontWeight: 600, color: isBreached ? "var(--color-loss)" : "var(--color-gray-100)" }}>
          {formattedUsed} <span style={{ color: "var(--color-gray-500)", fontWeight: 400 }}>/ {formattedTotal}</span>
        </span>
      </div>
      
      <div style={{ width: "100%", height: "8px", background: "var(--color-gray-800)", borderRadius: "4px", overflow: "hidden" }}>
        <div 
          style={{ 
            height: "100%", 
            width: `${pct}%`, 
            transition: "width 0.5s ease-out",
            background: isBreached ? "var(--color-loss)" : (pct >= 80 ? "#f97316" : "var(--color-profit)") 
          }} 
        />
      </div>
      {pct >= 80 && !isBreached && (
        <div style={{ fontSize: "0.75rem", color: "#f97316", marginTop: "0.25rem" }}>Warning: Nearing limit</div>
      )}
      {isBreached && (
        <div style={{ fontSize: "0.75rem", color: "var(--color-loss)", marginTop: "0.25rem" }}>Limit Breached!</div>
      )}
    </div>
  )
}

export function PropFirmGauges({ challenge }: { challenge: any }) {
  if (!challenge) return null

  const maxDdReference = 
    challenge.template.drawdownType === 'static_balance' ? Number(challenge.initialBalance) :
    challenge.template.drawdownType === 'trailing_balance' ? Number(challenge.highestBalance) :
    Number(challenge.highestEquity)
  
  const maxDdThreshold = maxDdReference * (1 - Number(challenge.maxDDPct) / 100)
  const maxDdAllowed = maxDdReference - maxDdThreshold
  const maxDdUsed = maxDdReference - Number(challenge.currentEquity)

  const dailyDdThreshold = Number(challenge.todayStartBalance) * (1 - Number(challenge.dailyDDPct) / 100)
  const dailyDdAllowed = Number(challenge.todayStartBalance) - dailyDdThreshold
  const dailyDdUsed = Number(challenge.todayStartBalance) - Number(challenge.currentEquity)

  const profitTarget = Number(challenge.initialBalance) * (Number(challenge.profitTargetPct) / 100)
  const currentProfit = Number(challenge.currentBalance) - Number(challenge.initialBalance)

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="badge" style={{ background: "var(--color-gray-800)", color: "var(--color-gray-300)" }}>
            {challenge.template.firmName} {challenge.template.programName}
          </span>
          <span className={`badge ${challenge.status === 'active' ? 'badge-profit' : 'badge-loss'}`}>
            {challenge.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 style={{ fontSize: "0.9rem", color: "var(--color-gray-400)", marginBottom: "1rem" }}>Drawdown Limits</h3>
          
          <GaugeBar 
            label="Daily Drawdown" 
            used={Math.max(0, dailyDdUsed)} 
            total={dailyDdAllowed} 
            isBreached={dailyDdUsed >= dailyDdAllowed} 
          />
          
          <GaugeBar 
            label="Max Drawdown" 
            used={Math.max(0, maxDdUsed)} 
            total={maxDdAllowed} 
            isBreached={maxDdUsed >= maxDdAllowed} 
          />
        </div>

        <div>
          <h3 style={{ fontSize: "0.9rem", color: "var(--color-gray-400)", marginBottom: "1rem" }}>Objectives</h3>
          
          <GaugeBar 
            label="Profit Target" 
            used={Math.max(0, currentProfit)} 
            total={profitTarget} 
            isBreached={false} 
          />
          
          {challenge.minTradingDays && (
             <GaugeBar 
               label="Min Trading Days" 
               used={0} // To implement tracking
               total={challenge.minTradingDays} 
               isBreached={false} 
               formatCurrency={false}
             />
          )}
        </div>
      </div>
    </div>
  )
}
