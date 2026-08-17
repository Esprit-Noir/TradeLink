"use client"

import React, { useState, useEffect } from "react"
import {
  AreaChart, Area,
  BarChart, Bar, Cell,
  ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceLine,
} from "recharts"
import { PropFirmGauges } from "./PropFirmGauges"
import dynamic from "next/dynamic"

const EquityCurveChart = dynamic(
  () => import("@/components/dashboard/EquityCurveChart").then(m => ({ default: m.EquityCurveChart })),
  { ssr: false }
)

const EVENT_LABELS: Record<string, string> = {
  alert_80pct: "80% Drawdown Warning",
  alert_90pct: "90% Drawdown Critical",
  phase_passed: "Phase Passed",
  breached: "Challenge Breached",
  target_hit: "Profit Target Hit",
  min_days_not_met: "Min Trading Days Not Met",
}

function formatEventDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function ChallengeDetailView({ challenge }: { challenge: any }) {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    if (!challenge) {
      setSnapshots([])
      return
    }
    fetch(`/api/challenges/${challenge.id}/snapshots`)
      .then(r => r.json())
      .then(data => setSnapshots(Array.isArray(data) ? data : []))
      .catch(() => setSnapshots([]))
    setPage(1)
  }, [challenge?.id])

  if (!challenge) return null

  const isBreached = challenge.status === 'failed' || challenge.status === 'breached'
  const isPassed = challenge.status === 'passed'
  const now = Date.now()
  const daysRemaining = challenge.deadlineAt
    ? Math.ceil((new Date(challenge.deadlineAt).getTime() - now) / 86400000)
    : null

  const events: any[] = Array.isArray(challenge.events) ? challenge.events : []
  const initial = Number(challenge.initialBalance)
  const maxDDPct = Number(challenge.maxDDPct)
  const targetPct = Number(challenge.profitTargetPct || 0)
  const profitTarget = initial * (1 + targetPct / 100)

  let runningHighBalance = initial
  let runningHighEquity = initial
  const series = snapshots.map(s => {
    const endB = Number(s.endBalance)
    const lowE = Number(s.lowestEquity)
    const anchor = challenge.template?.drawdownType === 'static_balance'
      ? initial
      : challenge.template?.drawdownType === 'trailing_balance' ? runningHighBalance : runningHighEquity
    const ddPct = anchor > 0 ? ((anchor - lowE) / anchor) * 100 : 0
    const ddUsedPct = maxDDPct > 0 ? (ddPct / maxDDPct) * 100 : 0
    const maxDDLevel = anchor * (1 - maxDDPct / 100)
    runningHighBalance = Math.max(runningHighBalance, endB)
    runningHighEquity = Math.max(runningHighEquity, endB, lowE)
    return {
      ...s,
      endBalance: endB,
      lowestEquity: lowE,
      maxDDLevel: Math.round(maxDDLevel * 100) / 100,
      profitTarget,
      ddUsedPct: Math.round(ddUsedPct * 100) / 100,
      ddPct: Math.round(ddPct * 100) / 100,
      cumPnl: endB - initial,
      cumPct: initial > 0 ? ((endB - initial) / initial) * 100 : 0,
      dateLabel: formatDate(s.date),
    }
  })

  const ddSeries = series.filter(s => s.ddUsedPct != null && !isNaN(s.ddUsedPct))

  const severityColor = (severity: string) =>
    severity === "critical" ? "var(--color-loss)" :
    severity === "warning" ? "var(--color-warning)" :
    "var(--color-profit)"

  const tooltipStyle = {
    background: "var(--color-gray-900)",
    border: "1px solid var(--color-gray-800)",
    borderRadius: "8px",
    fontSize: "0.85rem",
  }

  const latestSnapshot = series.length > 0 ? series[series.length - 1] : null
  const todayPnl = latestSnapshot ? latestSnapshot.dailyPnl : 0

  return (
    <div>
      {/* Top Row: Key Statistics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.25rem" }}>Status</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: isBreached ? "var(--color-loss)" : isPassed ? "var(--color-profit)" : "var(--color-brand-500)" }}>
            {challenge.status.toUpperCase()}
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.25rem" }}>Phase</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
            {challenge.phase === 'phase_1' ? "Phase 1" : challenge.phase === 'phase_2' ? "Phase 2" : "Funded"}
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.25rem" }}>Current Equity</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
            ${Number(challenge.currentEquity).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.25rem" }}>Daily P&L (Today)</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: todayPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
            {todayPnl >= 0 ? "+" : ""}${Number(todayPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, marginBottom: "0.25rem" }}>Deadline</div>
          {daysRemaining !== null && !isBreached ? (
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: daysRemaining <= 1 ? "var(--color-loss)" : daysRemaining <= 5 ? "var(--color-warning)" : "var(--color-gray-100)" }}>
              {daysRemaining <= 0 ? "Due today" : `${daysRemaining} days left`}
            </div>
          ) : (
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
              {isBreached ? "—" : "No limit"}
            </div>
          )}
        </div>
      </div>

      {/* Grid Row: Chart (left) and Gauges (right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "stretch" }}>
          <div style={{ flex: "2 1 500px", minWidth: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <EquityCurveChart
                snapshots={snapshots.map(s => ({
                  date: s.date,
                  endBalance: Number(s.endBalance),
                  lowestEquity: Number(s.lowestEquity),
                  dailyPnl: Number(s.dailyPnl || 0),
                }))}
                initialBalance={initial}
                currentBalance={Number(challenge.currentEquity)}
                maxDrawdownPct={maxDDPct}
                profitTarget={profitTarget}
                maxDDLevel={latestSnapshot?.maxDDLevel}
                showMaxDDLine
                showTargetLine
              />
            </div>
          </div>

          <div style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column" }}>
            <PropFirmGauges challenge={challenge} />
          </div>
        </div>
      </div>

      {snapshots.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
          {ddSeries.length > 0 && (
            <div style={{ background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-100)" }}>Drawdown Used</div>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={ddSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} domain={[0, 'auto']} width={40} unit="%" />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ fontWeight: 600 }}
                    labelStyle={{ color: "var(--color-gray-400)", marginBottom: "0.3rem" }}
                    formatter={(value: any, name: any) => [name === "Max allowed" ? "100%" : `${Number(value).toFixed(1)}%`, name === "ddUsedPct" ? "Drawdown used" : name]}
                  />
                  <Area type="monotone" dataKey="ddUsedPct" stroke="var(--color-warning)" strokeWidth={2} fill="var(--color-warning)" fillOpacity={0.15} />
                  <ReferenceLine y={100} stroke="var(--color-loss)" strokeDasharray="4 4" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Daily P&L</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} width={55} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={{ fontWeight: 600 }}
                  labelStyle={{ color: "var(--color-gray-400)", marginBottom: "0.3rem" }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "P&L"]}
                />
                <Bar dataKey="dailyPnl" radius={[2, 2, 0, 0]}>
                  {series.map((s, i) => (
                    <Cell key={i} fill={Number(s.dailyPnl) >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Account Statistics and Rules Side-by-Side Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        
        {/* Statistics */}
        <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem" }}>Account Statistics</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div style={{ paddingLeft: "0.75rem", borderLeft: "3px solid var(--color-brand-500)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Initial Balance</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>${Number(challenge.initialBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ paddingLeft: "0.75rem", borderLeft: "3px solid #10B981" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Highest Balance</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>${Number(challenge.highestBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ paddingLeft: "0.75rem", borderLeft: "3px solid #3B82F6" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Highest Equity</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>${Number(challenge.highestEquity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div style={{ paddingLeft: "0.75rem", borderLeft: "3px solid #8B5CF6" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Steps</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>{challenge.metadata?.steps || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem" }}>Trading Rules</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Drawdown Type</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-brand-500)", background: "rgba(59, 130, 246, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{challenge.template.drawdownType.replace(/_/g, " ")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Daily Reset</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#8B5CF6", background: "rgba(139, 92, 246, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{challenge.template.dailyResetTimezone}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Weekend Holding</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: challenge.template.weekendHoldingAllowed ? "var(--color-profit)" : "var(--color-loss)", background: challenge.template.weekendHoldingAllowed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                {challenge.template.weekendHoldingAllowed ? "Allowed" : "Not allowed"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>News Trading</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: challenge.template.newsTradingAllowed ? "var(--color-profit)" : "var(--color-loss)", background: challenge.template.newsTradingAllowed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                {challenge.template.newsTradingAllowed ? "Allowed" : "Not allowed"}
              </span>
            </div>
            {challenge.template.consistencyRulePct && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Consistency</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#F59E0B", background: "rgba(245, 158, 11, 0.1)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{challenge.template.consistencyRulePct}% max single day</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Max Trading Days</span>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-300)", background: "var(--color-gray-800)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{challenge.maxTradingDays ?? "None"}</span>
            </div>
          </div>
        </div>
      </div>

      <ConsistencySection snapshots={snapshots} challenge={challenge} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginTop: "1.5rem", marginBottom: "1.5rem" }}>
        <TimelineSection challenge={challenge} />

        {events.length > 0 ? (
          <div>
            <div style={{ background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)", padding: "1.5rem", height: "100%", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem", flexShrink: 0 }}>Alerts & Events</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {events.map((event, idx) => (
                  <div key={event.id} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    borderBottom: idx !== events.length - 1 ? "1px solid var(--color-gray-800)" : "none",
                    paddingBottom: idx !== events.length - 1 ? "1.25rem" : 0
                  }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "8px",
                      background: `${severityColor(event.severity)}15`,
                      border: `1px solid ${severityColor(event.severity)}40`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: severityColor(event.severity),
                      flexShrink: 0,
                      fontWeight: 600,
                    }}>
                      {event.severity === "critical" ? "!" : event.severity === "warning" ? "!" : "i"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, marginTop: "0.2rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: severityColor(event.severity) }}>
                          {EVENT_LABELS[event.eventType] || event.eventType.replace(/_/g, " ")}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", flexShrink: 0, fontWeight: 500 }}>
                          {formatEventDate(event.createdAt)}
                        </span>
                      </div>
                      {event.message && (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-gray-300)", marginTop: "0.3rem", lineHeight: 1.4 }}>
                          {event.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : <div />}
      </div>

      {snapshots.length > 0 && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)", overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-gray-800)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-100)", margin: 0 }}>Daily Breakdown</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>
                {snapshots.length} day{snapshots.length > 1 ? "s" : ""}
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--color-gray-950)", color: "var(--color-gray-400)", textAlign: "left", borderBottom: "1px solid var(--color-gray-800)" }}>
                  <th style={{ padding: "1rem", fontWeight: 600 }}>Date</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>Start Balance</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>End Balance</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>P&L</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>Trades</th>
                  <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>DD Used</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.slice().reverse().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: idx === PAGE_SIZE - 1 ? "none" : "1px solid var(--color-gray-800)", color: "var(--color-gray-300)" }}>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap", fontWeight: 500, color: "var(--color-gray-200)" }}>{formatDate(s.date)}</td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>${Number(s.startBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: 500 }}>${Number(s.endBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "1rem", textAlign: "right", color: Number(s.dailyPnl) >= 0 ? "var(--color-profit)" : "var(--color-loss)", fontWeight: 600, textShadow: Number(s.dailyPnl) >= 0 ? "0 0 10px rgba(16,185,129,0.2)" : "none" }}>
                      ${Number(s.dailyPnl) >= 0 ? "+" : ""}{Number(s.dailyPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>{s.tradesCount}</td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <span style={{ 
                        color: (s.dailyDDUsedPct ?? 0) >= 80 ? "var(--color-warning)" : "var(--color-gray-400)", 
                        background: (s.dailyDDUsedPct ?? 0) >= 80 ? "rgba(245, 158, 11, 0.1)" : "transparent",
                        padding: (s.dailyDDUsedPct ?? 0) >= 80 ? "0.2rem 0.5rem" : "0",
                        borderRadius: "4px",
                        fontWeight: (s.dailyDDUsedPct ?? 0) >= 80 ? 600 : 400
                      }}>
                        {s.dailyDDUsedPct != null ? `${Math.round(s.dailyDDUsedPct)}%` : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {snapshots.length > PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>
                Page {page} of {Math.ceil(snapshots.length / PAGE_SIZE)}
              </span>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                >
                  &larr; Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(snapshots.length / PAGE_SIZE), p + 1))}
                  disabled={page >= Math.ceil(snapshots.length / PAGE_SIZE)}
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ConsistencySection({ snapshots, challenge }: { snapshots: any[]; challenge: any }) {
  const [simBiggest, setSimBiggest] = useState<number | null>(null)
  if (!snapshots || snapshots.length === 0) return null

  const totalPnl = snapshots.reduce((s, x) => s + Number(x.dailyPnl || 0), 0)
  const biggestDay = snapshots.reduce((m, x) => Math.max(m, Number(x.dailyPnl || 0)), 0)
  const biggestPct = totalPnl > 0 ? (biggestDay / totalPnl) * 100 : 0
  const consistencyRule = Number(challenge.template?.consistencyRulePct || 0)
  const ruleOk = consistencyRule === 0 || biggestPct <= consistencyRule

  const simBiggestPct = totalPnl > 0 ? ((simBiggest ?? biggestDay) / totalPnl) * 100 : 0
  const simOk = consistencyRule === 0 || simBiggestPct <= consistencyRule

  // Build heatmap grid: weeks × weekdays (Mon..Sun)
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const cells: { key: string; date: string; pnl: number }[] = []
  let minWeek = Infinity
  let maxWeek = -Infinity

  for (const s of snapshots) {
    const d = new Date(`${s.date.slice(0, 10)}T00:00:00Z`)
    const dayIdx = (d.getUTCDay() + 6) % 7 // Mon=0
    const firstMon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dayIdx))
    const weekNum = Math.floor(firstMon.getTime() / (7 * 86400000))
    minWeek = Math.min(minWeek, weekNum)
    maxWeek = Math.max(maxWeek, weekNum)
    cells.push({ key: `${weekNum}-${dayIdx}`, date: s.date.slice(0, 10), pnl: Number(s.dailyPnl || 0) })
  }

  if (minWeek === Infinity) return null
  const weekSpan = maxWeek - minWeek + 1
  const cellMap = new Map(cells.map(c => [c.key, c]))
  const maxAbs = Math.max(...snapshots.map(s => Math.abs(Number(s.dailyPnl || 0))), 1)

  const cellColor = (pnl: number) => {
    if (pnl === 0) return "var(--color-gray-800)"
    const intensity = Math.min(1, Math.abs(pnl) / maxAbs)
    const alpha = 0.25 + intensity * 0.75
    if (pnl > 0) return `rgba(16, 185, 129, ${alpha})`
    return `rgba(239, 68, 68, ${alpha})`
  }

  return (
    <div style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
      <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem" }}>Consistency Analysis</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Total Profit</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", textShadow: totalPnl >= 0 ? "0 0 10px rgba(16,185,129,0.2)" : "none" }}>
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: "1px", background: "var(--color-gray-800)", alignSelf: "stretch", display: "none" }} className="md:block" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Biggest Day</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-profit)", textShadow: "0 0 10px rgba(16,185,129,0.2)" }}>
              +${biggestDay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ width: "1px", background: "var(--color-gray-800)", alignSelf: "stretch", display: "none" }} className="md:block" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Biggest Day / Profit</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: ruleOk ? "#10B981" : "var(--color-loss)" }}>
              {biggestPct.toFixed(1)}%
            </div>
          </div>
          <div style={{ width: "1px", background: "var(--color-gray-800)", alignSelf: "stretch", display: "none" }} className="md:block" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Consistency Rule</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: consistencyRule > 0 ? "var(--color-brand-500)" : "var(--color-gray-500)", textShadow: consistencyRule > 0 ? "0 0 10px rgba(59,130,246,0.2)" : "none" }}>
              {consistencyRule > 0 ? `Max ${consistencyRule}%` : "Not set"}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function TimelineSection({ challenge }: { challenge: any }) {
  const events: any[] = Array.isArray(challenge.events) ? challenge.events : []

  const milestones: { date: Date; label: string; sub: string; kind: string; severity?: string }[] = []

  milestones.push({
    date: new Date(challenge.startedAt),
    label: "Challenge Started",
    sub: `${challenge.template?.firmName || "Prop firm"} — ${challenge.initialBalance ? `$${Number(challenge.initialBalance).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : ""}`.trim(),
    kind: "info",
  })

  const kindForEvent = (e: any) => {
    if (e.eventType === "breached") return "danger"
    if (e.severity === "critical") return "danger"
    if (e.severity === "warning") return "warning"
    return "info"
  }

  for (const e of events) {
    milestones.push({
      date: new Date(e.createdAt),
      label: EVENT_LABELS[e.eventType] || e.eventType.replace(/_/g, " "),
      sub: e.message || "",
      kind: kindForEvent(e),
      severity: e.severity,
    })
  }

  if (challenge.status === "passed" || challenge.status === "breached" || challenge.status === "failed") {
    milestones.push({
      date: new Date(challenge.breachedAt || challenge.updatedAt || Date.now()),
      label: challenge.status === "passed" ? "Phase Passed" : "Challenge Failed",
      sub: challenge.status === "passed"
        ? "Profit target reached — move to the next phase."
        : `Breach: ${challenge.breachReason ? challenge.breachReason.replace(/_/g, " ") : "unknown"}.`,
      kind: challenge.status === "passed" ? "success" : "danger",
    })
  }

  milestones.sort((a, b) => a.date.getTime() - b.date.getTime())

  const dotColor = (kind: string) =>
    kind === "danger" ? "var(--color-loss)" :
    kind === "warning" ? "var(--color-warning)" :
    kind === "success" ? "var(--color-profit)" :
    "var(--color-brand-500)"

  return (
    <div>
      <div style={{ background: "var(--color-gray-900)", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)", height: "100%", maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--color-gray-100)", borderBottom: "1px solid var(--color-gray-800)", paddingBottom: "0.75rem", flexShrink: 0 }}>Timeline</h3>
        <div style={{ position: "relative", paddingLeft: "1.75rem" }}>
          <div style={{ position: "absolute", left: "0.5rem", top: "0.5rem", bottom: "0.5rem", width: "2px", background: "var(--color-gray-800)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ position: "relative", display: "flex", gap: "1.25rem" }}>
                <div style={{
                  position: "absolute", left: "-1.7rem", top: "0.2rem",
                  width: "14px", height: "14px", borderRadius: "50%",
                  background: dotColor(m.kind), border: "3px solid var(--color-gray-900)",
                  boxShadow: `0 0 8px ${dotColor(m.kind)}`
                }} />
                <div style={{ flex: 1, minWidth: 0, marginTop: "-0.1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, color: dotColor(m.kind) }}>{m.label}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", flexShrink: 0, fontWeight: 500 }}>{formatEventDate(m.date.toISOString())}</span>
                  </div>
                  {m.sub && <div style={{ fontSize: "0.8rem", color: "var(--color-gray-300)", marginTop: "0.3rem", lineHeight: 1.4 }}>{m.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
