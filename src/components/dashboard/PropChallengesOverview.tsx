"use client"

import { useRouter } from "next/navigation"

interface PropChallengeEvent {
  severity: string
  message?: string | null
  eventType: string
}

interface PropChallengeTemplate {
  firmName?: string
  logoUrl?: string | null
  drawdownType: string
}

interface PropChallengeSummary {
  id: string
  phase: string
  status: string
  initialBalance: number | string
  currentEquity: number | string
  highestBalance?: number | string | null
  highestEquity?: number | string | null
  maxDDPct: number | string
  profitTargetPct: number | string
  minTradingDays?: number | null
  tradingDaysCount?: number | null
  deadlineAt?: string | null
  events?: PropChallengeEvent[] | null
  template: PropChallengeTemplate
  account: { name: string }
}

export function PropChallengesOverview({ challenges }: { challenges: PropChallengeSummary[] }) {
  const router = useRouter()
  const now = Date.now()

  if (challenges.length === 0) return null

  return (
    <div className="chart-card" style={{ marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div className="chart-title" style={{ margin: 0 }}>Prop Challenges</div>
        <button
          onClick={() => router.push("/challenges")}
          className="btn btn-outline"
          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
        >
          View all
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
        {challenges.map(c => {
          const maxDdRef = c.template.drawdownType === 'static_balance' ? Number(c.initialBalance) :
                           c.template.drawdownType === 'trailing_balance' ? Number(c.highestBalance) :
                           Number(c.highestEquity)
          const maxDdThreshold = maxDdRef * (1 - Number(c.maxDDPct) / 100)
          const maxDdAllowed = maxDdRef - maxDdThreshold
          const maxDdUsed = Math.max(0, maxDdRef - Number(c.currentEquity))
          const ddPct = maxDdAllowed > 0 ? Math.min((maxDdUsed / maxDdAllowed) * 100, 100) : 0

          const profitTarget = Number(c.initialBalance) * (Number(c.profitTargetPct) / 100)
          const currentProfit = Number(c.currentEquity) - Number(c.initialBalance)
          const profitPct = profitTarget > 0 ? Math.min(Math.max((currentProfit / profitTarget) * 100, 0), 100) : 0
          const profitSign = currentProfit >= 0 ? "+" : ""

          const minDays = Number(c.minTradingDays || 0)
          const daysDone = Math.min(Number(c.tradingDaysCount || 0), Math.max(minDays, 1))
          const daysPct = minDays > 0 ? Math.min((daysDone / minDays) * 100, 100) : 100

          let deadlineLabel: string | null = null
          let deadlineTone = "var(--color-gray-500)"
          if (c.deadlineAt) {
            const rem = Math.ceil((new Date(c.deadlineAt).getTime() - now) / 86400000)
            if (c.status === "active") {
              deadlineLabel = rem <= 0 ? "Due today" : `${rem}d left`
              deadlineTone = rem <= 1 ? "var(--color-loss)" : rem <= 5 ? "var(--color-warning)" : "var(--color-gray-500)"
            }
          }

          const latestEvent = Array.isArray(c.events) && c.events.length > 0 ? c.events[0] : null

          return (
            <div
              key={c.id}
              onClick={() => router.push(`/challenges/${c.id}`)}
              style={{
                background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
                borderRadius: "var(--radius-card)", padding: "1rem", cursor: "pointer",
                transition: "border-color 0.2s ease",
                display: "flex", flexDirection: "column", gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                  {c.template?.logoUrl && (
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                      background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.template.logoUrl} alt={c.template.firmName} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-gray-100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.account.name}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                      {c.phase === 'phase_1' ? "Phase 1" : c.phase === 'phase_2' ? "Phase 2" : "Funded"}
                      {c.template.firmName ? ` · ${c.template.firmName}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem", flexShrink: 0 }}>
                  <span className={`badge ${c.status === 'active' || c.status === 'passed' ? 'badge-profit' : 'badge-loss'}`} style={{ fontSize: "0.7rem" }}>
                    {c.status.toUpperCase()}
                  </span>
                  {deadlineLabel && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: deadlineTone }}>{deadlineLabel}</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>
                  <span>Profit Target</span>
                  <span style={{ color: currentProfit >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {profitSign}{currentProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })} · {Math.round(profitPct)}%
                  </span>
                </div>
                <div className="progress-bar" style={{ marginBottom: "0.25rem" }}>
                  <div className="progress-bar-fill" style={{ width: `${profitPct}%`, background: currentProfit >= 0 ? "var(--color-profit)" : "var(--color-loss)" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>
                  <span>Drawdown Used</span>
                  <span style={{ color: ddPct >= 80 ? "var(--color-warning)" : "var(--color-gray-300)" }}>{Math.round(ddPct)}%</span>
                </div>
                <div className="progress-bar" style={{ marginBottom: "0.25rem" }}>
                  <div className="progress-bar-fill" style={{ width: `${ddPct}%`, background: ddPct >= 80 ? "var(--color-warning)" : "var(--color-brand-500)" }} />
                </div>
              </div>

              {minDays > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>
                    <span>Min Trading Days</span>
                    <span style={{ color: "var(--color-gray-300)" }}>{c.tradingDaysCount ?? 0}/{minDays}</span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: "0.25rem" }}>
                    <div className="progress-bar-fill" style={{ width: `${daysPct}%`, background: "var(--color-gray-400)" }} />
                  </div>
                </div>
              )}

              {latestEvent && (
                <div style={{ fontSize: "0.7rem", color: latestEvent.severity === 'critical' ? "var(--color-loss)" : latestEvent.severity === 'warning' ? "var(--color-warning)" : "var(--color-gray-400)" }}>
                  {latestEvent.message || latestEvent.eventType.replace(/_/g, " ")}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
