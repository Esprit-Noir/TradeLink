"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type CompareChallenge = {
  id: string
  firmName: string
  logoUrl: string | null
  accountName: string
  phase: string
  status: string
  initialBalance: number
  currentBalance: number
  currentProfitPct: number
  targetProgressPct: number
  maxDDPct: number
  ddUsedPct: number
  tradingDays: number
  minTradingDays: number | null
  maxTradingDays: number | null
  daysRemaining: number | null
  lastSnapshotDate: string | null
  lastDailyPnl: number | null
}

const STATUS_COLORS: Record<string, string> = {
  active: "var(--color-brand-500)",
  passed: "var(--color-profit)",
  breached: "var(--color-loss)",
  failed: "var(--color-loss)",
}

export function ChallengeCompare({ challenges }: { challenges: CompareChallenge[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  const selectedChallenges = useMemo(
    () => challenges.filter(c => selected.includes(c.id)),
    [challenges, selected]
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {challenges.length === 0 && (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-gray-500)" }}>
          No challenges yet. <a href="/challenges" style={{ color: "var(--color-brand-500)" }}>Create one</a>.
        </div>
      )}

      {challenges.length > 0 && (
        <div className="card" style={{ padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-gray-500)", marginBottom: "0.75rem" }}>
            Select up to 4 challenges ({selected.length}/4)
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {challenges.map(c => (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                disabled={!selected.includes(c.id) && selected.length >= 4}
                style={{
                  display: "flex", alignItems: "center", gap: "0.45rem",
                  padding: "0.4rem 0.7rem", borderRadius: "8px", cursor: "pointer",
                  border: `1px solid ${selected.includes(c.id) ? "var(--color-brand-500)" : "var(--color-gray-700)"}`,
                  background: selected.includes(c.id) ? "rgba(139,92,246,0.1)" : "var(--color-gray-900)",
                  color: "var(--color-gray-200)", fontSize: "0.8rem",
                  opacity: !selected.includes(c.id) && selected.length >= 4 ? 0.5 : 1,
                }}
              >
                {c.logoUrl && <img src={c.logoUrl} alt="" style={{ width: "14px", height: "14px", objectFit: "contain", borderRadius: "3px" }} />}
                {c.firmName} · {c.phase.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedChallenges.length === 0 && challenges.length > 0 && (
        <div className="card" style={{ padding: "2rem", textAlign: "center", color: "var(--color-gray-500)" }}>
          Select at least one challenge above to compare.
        </div>
      )}

      {selectedChallenges.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(220px, 1fr))`, gap: "1rem" }}>
          {selectedChallenges.map(c => (
            <div
              key={c.id}
              className="card"
              style={{ padding: "1rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.75rem" }}
              onClick={() => router.push(`/challenges/${c.id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  {c.logoUrl && <img src={c.logoUrl} alt="" style={{ width: "22px", height: "22px", objectFit: "contain", borderRadius: "4px" }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.firmName}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.accountName}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                  padding: "0.15rem 0.4rem", borderRadius: "5px",
                  background: "var(--color-gray-800)", color: STATUS_COLORS[c.status] || "var(--color-gray-400)",
                }}>
                  {c.status}
                </span>
              </div>

              {/* Profit target progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>
                  <span>Profit target</span>
                  <span style={{ color: c.targetProgressPct >= 100 ? "var(--color-profit)" : "var(--color-gray-300)" }}>
                    {c.currentProfitPct >= 0 ? "+" : ""}{c.currentProfitPct}%
                  </span>
                </div>
                <div style={{ background: "var(--color-gray-800)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${Math.min(100, Math.max(0, c.targetProgressPct))}%`,
                    borderRadius: "4px",
                    background: c.targetProgressPct >= 100 ? "var(--color-profit)" : "var(--color-brand-500)",
                  }} />
                </div>
              </div>

              {/* Max drawdown */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "var(--color-gray-500)", marginBottom: "0.25rem" }}>
                  <span>Max drawdown ({c.maxDDPct}%)</span>
                  <span style={{ color: c.ddUsedPct >= 80 ? "var(--color-loss)" : c.ddUsedPct >= 60 ? "var(--color-warning)" : "var(--color-gray-300)" }}>
                    {c.ddUsedPct.toFixed(1)}%
                  </span>
                </div>
                <div style={{ background: "var(--color-gray-800)", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${Math.min(100, c.ddUsedPct)}%`, borderRadius: "4px",
                    background: c.ddUsedPct >= 80 ? "var(--color-loss)" : c.ddUsedPct >= 60 ? "var(--color-warning)" : "var(--color-profit)",
                  }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.72rem" }}>
                <div style={{ background: "var(--color-gray-900)", padding: "0.5rem", borderRadius: "8px" }}>
                  <div style={{ color: "var(--color-gray-500)" }}>Balance</div>
                  <div style={{ fontWeight: 600 }}>${c.currentBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}</div>
                </div>
                <div style={{ background: "var(--color-gray-900)", padding: "0.5rem", borderRadius: "8px" }}>
                  <div style={{ color: "var(--color-gray-500)" }}>Trading days</div>
                  <div style={{ fontWeight: 600 }}>{c.tradingDays}{c.minTradingDays ? ` / ${c.minTradingDays}` : ""}</div>
                </div>
                <div style={{ background: "var(--color-gray-900)", padding: "0.5rem", borderRadius: "8px" }}>
                  <div style={{ color: "var(--color-gray-500)" }}>Days left</div>
                  <div style={{ fontWeight: 600 }}>{c.daysRemaining !== null ? c.daysRemaining : "∞"}</div>
                </div>
                <div style={{ background: "var(--color-gray-900)", padding: "0.5rem", borderRadius: "8px" }}>
                  <div style={{ color: "var(--color-gray-500)" }}>Last day</div>
                  <div style={{ fontWeight: 600, color: c.lastDailyPnl != null && c.lastDailyPnl >= 0 ? "var(--color-profit)" : c.lastDailyPnl != null ? "var(--color-loss)" : "inherit" }}>
                    {c.lastDailyPnl != null ? `${c.lastDailyPnl >= 0 ? "+" : ""}$${c.lastDailyPnl.toFixed(2)}` : "—"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
