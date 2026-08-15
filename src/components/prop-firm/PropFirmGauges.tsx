"use client"

import React, { useState, useEffect } from "react"

interface GaugeProps {
  label: string
  used: number
  total: number
  isBreached: boolean
  formatCurrency?: boolean
  reverseColors?: boolean
}

function NeedleGauge({ label, used, total, isBreached, formatCurrency = true, reverseColors = false }: GaugeProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const pctRaw = total > 0 ? (used / total) * 100 : 0
  const pct = Math.min(Math.max(pctRaw, 0), 100) || 0
  
  const formattedUsed = formatCurrency ? `$${Math.max(0, used).toLocaleString("en-US", {minimumFractionDigits: 2})}` : Math.max(0, used).toString()
  const formattedTotal = formatCurrency ? `$${total.toLocaleString("en-US", {minimumFractionDigits: 2})}` : total.toString()

  const angle = mounted ? ((pct / 100) * 180) - 90 : -90

  // Calculate graduations
  const ticks = [0, 25, 50, 75, 100].map((val) => {
    const angleDeg = 180 - (val / 100) * 180
    const rad = angleDeg * (Math.PI / 180)
    
    // Ticks on the inner edge of the arc
    const r1 = 68
    const r2 = 58
    
    const x1 = 100 + r1 * Math.cos(rad)
    const y1 = 100 - r1 * Math.sin(rad)
    const x2 = 100 + r2 * Math.cos(rad)
    const y2 = 100 - r2 * Math.sin(rad)
    
    // Text positioning further inside
    const textR = 42
    const textX = 100 + textR * Math.cos(rad)
    const textY = 100 - textR * Math.sin(rad) + (val === 0 || val === 100 ? -2 : 4)
    
    return { val, x1, y1, x2, y2, textX, textY }
  })

  const gradientId = reverseColors ? `profit-grad-${label.replace(/\s+/g, '')}` : `dd-grad-${label.replace(/\s+/g, '')}`;

  return (
    <div style={{ background: "var(--color-gray-950)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: "0.5rem", textAlign: "center" }}>{label}</div>
      
      <div style={{ width: "100%", maxWidth: "180px", position: "relative", marginTop: "1rem" }}>
        <svg viewBox="0 0 200 100" style={{ width: "100%", height: "auto", overflow: "visible" }}>
          <defs>
            <linearGradient id={`dd-grad-${label.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient id={`profit-grad-${label.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="needleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-gray-100)" />
              <stop offset="100%" stopColor="var(--color-gray-400)" />
            </linearGradient>
          </defs>
          
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="16"
            strokeLinecap="round"
          />
          
          {/* Graduations */}
          {ticks.map((tick) => (
            <g key={tick.val}>
              <line
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="var(--color-gray-600)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <text
                x={tick.textX}
                y={tick.textY}
                fill="var(--color-gray-500)"
                style={{ fontSize: "10px", fontWeight: 600 }}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {tick.val}
              </text>
            </g>
          ))}
          
          {/* Needle */}
          <g style={{ transformOrigin: '100px 100px', transform: `rotate(${angle}deg)`, transition: 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <polygon
              points="96,100 104,100 100,30"
              fill="url(#needleGradient)"
            />
            <polygon
              points="96,100 104,100 100,30"
              fill="var(--color-gray-100)"
              opacity="0.5"
              filter="blur(4px)"
            />
          </g>

          <circle cx="100" cy="100" r="6" fill="var(--color-gray-200)" />
          <circle cx="100" cy="100" r="2" fill="var(--color-gray-950)" />
        </svg>

        <div style={{ position: "absolute", bottom: "-24px", left: "0", right: "0", textAlign: "center" }}>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-gray-100)", lineHeight: 1 }}>{pct.toFixed(1)}<span style={{ fontSize: "0.85rem", color: "var(--color-gray-500)" }}>%</span></div>
        </div>
      </div>

      <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "space-between", width: "100%", borderTop: "1px solid var(--color-gray-800)", paddingTop: "0.75rem" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.6rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600 }}>Used</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-100)" }}>{formattedUsed}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", textAlign: "right" }}>
          <span style={{ fontSize: "0.6rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600 }}>Limit</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-400)" }}>{formattedTotal}</span>
        </div>
      </div>
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
    <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)", height: "100%", display: "flex", flexDirection: "column" }}>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem", flexShrink: 0 }}>Objectives & Limits</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", flex: 1 }}>
        <NeedleGauge 
          label="Daily Drawdown" 
          used={Math.max(0, dailyDdUsed)} 
          total={dailyDdAllowed} 
          isBreached={dailyDdUsed >= dailyDdAllowed} 
        />
        
        <NeedleGauge 
          label="Max Drawdown" 
          used={Math.max(0, maxDdUsed)} 
          total={maxDdAllowed} 
          isBreached={maxDdUsed >= maxDdAllowed} 
        />
        
        <NeedleGauge 
          label="Profit Target" 
          used={Math.max(0, currentProfit)} 
          total={profitTarget} 
          isBreached={false}
          reverseColors={true}
        />
        
        {challenge.minTradingDays ? (
           <NeedleGauge 
             label="Min Trading Days" 
             used={Number(challenge.metadata?.tradingDaysCount || 0)} 
             total={challenge.minTradingDays} 
             isBreached={false} 
             formatCurrency={false}
             reverseColors={true}
           />
        ) : (
           <NeedleGauge 
             label="Trading Days" 
             used={Number(challenge.metadata?.tradingDaysCount || 0)} 
             total={Math.max(1, Number(challenge.metadata?.tradingDaysCount || 0))} 
             isBreached={false} 
             formatCurrency={false}
             reverseColors={true}
           />
        )}
      </div>
    </div>
  )
}

