"use client"

import React, { useState, useEffect } from "react"
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell, ReferenceLine,
  AreaChart, Area,
} from "recharts"
import { PropFirmGauges } from "./PropFirmGauges"

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
  const daysRemaining = challenge.deadlineAt
    ? Math.ceil((new Date(challenge.deadlineAt).getTime() - Date.now()) / 86400000)
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

  const severityBg = (severity: string) =>
    severity === "critical" ? "rgba(239,68,68,0.12)" :
    severity === "warning" ? "rgba(245,158,11,0.12)" :
    "rgba(16,185,129,0.12)"

  return (
    <div>
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
            {challenge.metadata?.steps === 'master' ? 'Funded' : challenge.metadata?.steps ? `${challenge.metadata.steps} Step(s)` : 'N/A'}
          </div>
        </div>
        <div style={{ flex: 1, background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Deadline</div>
          {daysRemaining !== null && !isBreached ? (
            <>
              <div style={{ fontSize: "1.1rem", fontWeight: 600, color: daysRemaining <= 1 ? "var(--color-loss)" : daysRemaining <= 5 ? "var(--color-warning)" : "var(--color-gray-100)" }}>
                {daysRemaining <= 0 ? "Due today" : `${daysRemaining} day${daysRemaining > 1 ? "s" : ""} left`}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>
                {formatDate(challenge.deadlineAt)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-100)" }}>
              {isBreached ? "—" : "No limit"}
            </div>
          )}
        </div>
      </div>

      <PropFirmGauges challenge={challenge} />

      {snapshots.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Daily Performance</h3>

          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Equity Curve</div>
              <div style={{ display: "flex", gap: "0.9rem", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--color-brand-500)", display: "inline-block" }} /> Equity
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--color-loss)", display: "inline-block" }} /> Max DD level
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--color-profit)", display: "inline-block" }} /> Profit target
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} domain={['auto', 'auto']} width={55} />
                <Tooltip
                  contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                  labelStyle={{ color: "var(--color-gray-300)" }}
                  formatter={(value: any, name: any) => [`$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, name === "endBalance" ? "Equity" : name]}
                />
                <ReferenceLine y={profitTarget} stroke="var(--color-profit)" strokeDasharray="4 4" label={{ value: "Target", fill: "var(--color-profit)", fontSize: 10, position: "insideTopRight" }} />
                <Line type="monotone" dataKey="maxDDLevel" stroke="var(--color-loss)" strokeWidth={1.5} strokeDasharray="5 4" dot={false} opacity={0.7} />
                <Line type="monotone" dataKey="endBalance" stroke="var(--color-brand-500)" strokeWidth={2} dot={{ r: 2, fill: "var(--color-brand-500)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {ddSeries.length > 0 && (
            <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Drawdown used (% of max allowed)</div>
                <div style={{ display: "flex", gap: "0.9rem", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--color-warning)", display: "inline-block" }} /> Drawdown used
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                    <span style={{ width: 10, height: 3, borderRadius: 2, background: "var(--color-loss)", display: "inline-block" }} /> Max allowed
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={ddSeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} interval="preserveStartEnd" minTickGap={30} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} domain={[0, 'auto']} width={40} unit="%" />
                  <Tooltip
                    contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                    labelStyle={{ color: "var(--color-gray-300)" }}
                    formatter={(value: any, name: any) => [name === "Max allowed" ? "100%" : `${Number(value).toFixed(1)}%`, name === "ddUsedPct" ? "Drawdown used" : name]}
                  />
                  <Area type="monotone" dataKey="ddUsedPct" stroke="var(--color-warning)" strokeWidth={2} fill="var(--color-warning)" fillOpacity={0.12} dot={{ r: 2, fill: "var(--color-warning)" }} />
                  <ReferenceLine y={100} stroke="var(--color-loss)" strokeDasharray="4 4" label={{ value: "Max DD", fill: "var(--color-loss)", fontSize: 10, position: "insideTopRight" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginBottom: "0.75rem" }}>Daily P&L</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} interval="preserveStartEnd" minTickGap={30} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} width={55} />
                <Tooltip
                  contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-700)", borderRadius: "8px", fontSize: "0.8rem" }}
                  labelStyle={{ color: "var(--color-gray-300)" }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "P&L"]}
                />
                <Bar dataKey="dailyPnl" radius={[3, 3, 0, 0]}>
                  {series.map((s, i) => (
                    <Cell key={i} fill={Number(s.dailyPnl) >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <ConsistencySection snapshots={snapshots} challenge={challenge} />

      <TimelineSection challenge={challenge} />

      {events.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Alerts & Events</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {events.map((event) => (
              <div key={event.id} style={{
                background: severityBg(event.severity),
                border: `1px solid ${severityColor(event.severity)}40`,
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}>
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: severityColor(event.severity),
                  marginTop: "0.4rem",
                  flexShrink: 0,
                  boxShadow: `0 0 8px ${severityColor(event.severity)}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: severityColor(event.severity) }}>
                      {EVENT_LABELS[event.eventType] || event.eventType.replace(/_/g, " ")}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", flexShrink: 0 }}>
                      {formatEventDate(event.createdAt)}
                    </span>
                  </div>
                  {event.message && (
                    <div style={{ fontSize: "0.85rem", color: "var(--color-gray-300)", marginTop: "0.25rem" }}>
                      {event.message}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Account Statistics</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Initial Balance</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.initialBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Current Equity</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.currentEquity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Highest Balance</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.highestBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", marginBottom: "0.25rem" }}>Highest Equity</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>${Number(challenge.highestEquity).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Rules</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Drawdown Type</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem" }}>{challenge.template.drawdownType.replace(/_/g, " ")}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Daily Reset</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem" }}>{challenge.template.dailyResetTimezone}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Weekend Holding</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem", color: challenge.template.weekendHoldingAllowed ? "var(--color-profit)" : "var(--color-loss)" }}>
              {challenge.template.weekendHoldingAllowed ? "Allowed" : "Not allowed"}
            </div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>News Trading</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem", color: challenge.template.newsTradingAllowed ? "var(--color-profit)" : "var(--color-loss)" }}>
              {challenge.template.newsTradingAllowed ? "Allowed" : "Not allowed"}
            </div>
          </div>
          {challenge.template.consistencyRulePct ? (
            <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Consistency Rule</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem" }}>{challenge.template.consistencyRulePct}% max single day</div>
            </div>
          ) : null}
          {challenge.deadlineAt ? (
            <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Deadline</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem", color: new Date(challenge.deadlineAt) < new Date() ? "var(--color-loss)" : "var(--color-gray-100)" }}>
                {formatDate(challenge.deadlineAt)}
              </div>
            </div>
          ) : null}
          <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Min Trading Days</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem" }}>{challenge.minTradingDays ?? "None"}</div>
          </div>
          <div style={{ background: "var(--color-gray-900)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Max Trading Days</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.2rem" }}>{challenge.maxTradingDays ?? "None"}</div>
          </div>
        </div>
      </div>

      {snapshots.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "var(--color-gray-100)" }}>Daily Breakdown</h3>
            <span style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
              {snapshots.length} day{snapshots.length > 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "var(--color-gray-900)", color: "var(--color-gray-400)", textAlign: "left" }}>
                  <th style={{ padding: "0.6rem 0.75rem" }}>Date</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Start</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>End</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>P&L</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>Trades</th>
                  <th style={{ padding: "0.6rem 0.75rem", textAlign: "right" }}>DD used</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.slice().reverse().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(s => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--color-gray-800)", color: "var(--color-gray-300)" }}>
                    <td style={{ padding: "0.5rem 0.75rem", whiteSpace: "nowrap" }}>{formatDate(s.date)}</td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>${Number(s.startBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>${Number(s.endBalance).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: Number(s.dailyPnl) >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      ${Number(s.dailyPnl) >= 0 ? "+" : ""}{Number(s.dailyPnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right" }}>{s.tradesCount}</td>
                    <td style={{ padding: "0.5rem 0.75rem", textAlign: "right", color: (s.dailyDDUsedPct ?? 0) >= 80 ? "var(--color-warning)" : "var(--color-gray-400)" }}>
                      {s.dailyDDUsedPct != null ? `${Math.round(s.dailyDDUsedPct)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {snapshots.length > PAGE_SIZE && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.75rem" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
                Page {page} / {Math.ceil(snapshots.length / PAGE_SIZE)}
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-outline"
                  style={{ padding: "0.35rem 0.8rem", fontSize: "0.78rem" }}
                >
                  &larr; Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(Math.ceil(snapshots.length / PAGE_SIZE), p + 1))}
                  disabled={page >= Math.ceil(snapshots.length / PAGE_SIZE)}
                  className="btn btn-outline"
                  style={{ padding: "0.35rem 0.8rem", fontSize: "0.78rem" }}
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
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Consistency Analysis</h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div style={{ background: "var(--color-gray-900)", padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Total profit</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: totalPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
            {totalPnl >= 0 ? "+" : ""}${totalPnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Biggest day</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-profit)" }}>
            +${biggestDay.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Biggest day / profit</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: ruleOk ? "var(--color-gray-100)" : "var(--color-loss)" }}>
            {biggestPct.toFixed(1)}%
          </div>
        </div>
        <div style={{ background: "var(--color-gray-900)", padding: "0.9rem 1rem", borderRadius: "10px", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.72rem", color: "var(--color-gray-400)", textTransform: "uppercase" }}>Consistency rule</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: consistencyRule > 0 ? "var(--color-brand-500)" : "var(--color-gray-500)" }}>
            {consistencyRule > 0 ? `max ${consistencyRule}%` : "Not set"}
          </div>
        </div>
      </div>

      {consistencyRule > 0 && (
        <div style={{
          marginBottom: "1.25rem", padding: "0.75rem 1rem", borderRadius: "10px",
          background: ruleOk ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.1)",
          border: `1px solid ${ruleOk ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.3)"}`,
          fontSize: "0.85rem", color: ruleOk ? "var(--color-profit)" : "var(--color-loss)",
        }}>
          {ruleOk
            ? `Your biggest day (${biggestPct.toFixed(1)}%) is within the ${consistencyRule}% consistency rule. You're good to pass.`
            : `Risk: your biggest day (${biggestPct.toFixed(1)}%) exceeds the ${consistencyRule}% consistency rule. A payout would be blocked.`}
        </div>
      )}

      <div style={{ background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginBottom: "0.75rem" }}>Consistency simulator</div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="form-group" style={{ minWidth: 220 }}>
            <label className="label">If your biggest day had been ($)</label>
            <input
              className="input"
              type="number"
              value={simBiggest ?? ""}
              placeholder={biggestDay.toFixed(2)}
              onChange={e => setSimBiggest(e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-gray-300)", paddingBottom: "0.55rem" }}>
            → Biggest day = <strong style={{ color: "var(--color-gray-100)" }}>{simBiggestPct.toFixed(1)}%</strong> of profit
          </div>
          <div style={{
            padding: "0.5rem 0.9rem", borderRadius: "8px", marginBottom: "0.25rem",
            background: simOk ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.12)",
            border: `1px solid ${simOk ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.35)"}`,
            color: simOk ? "var(--color-profit)" : "var(--color-loss)",
            fontSize: "0.82rem", fontWeight: 600,
          }}>
            {simOk ? "Payout OK" : "Payout blocked"}
          </div>
        </div>
        {simBiggest !== null && simBiggest !== biggestDay && (
          <div style={{ marginTop: "0.6rem", fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
            Actual biggest day: ${biggestDay.toFixed(2)} ({biggestPct.toFixed(1)}%). Clear the field to reset.
          </div>
        )}
      </div>

      <div style={{ background: "var(--color-gray-900)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)" }}>Daily P&L heatmap</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
            Less
            {[0.25, 0.5, 0.75, 1].map(a => (
              <span key={a} style={{ width: 12, height: 12, borderRadius: 3, background: `rgba(16,185,129,${a})`, display: "inline-block" }} />
            ))}
            More
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.4rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginRight: "0.25rem" }}>
            {DAYS.map(d => (
              <div key={d} style={{ height: 14, fontSize: "0.62rem", color: "var(--color-gray-500)", lineHeight: "14px" }}>{d}</div>
            ))}
          </div>
          {Array.from({ length: weekSpan }, (_, w) => {
            const weekNum = minWeek + w
            return (
              <div key={w} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {DAYS.map((_, di) => {
                  const cell = cellMap.get(`${weekNum}-${di}`)
                  const pnl = cell ? cell.pnl : null
                  return (
                    <div
                      key={di}
                      title={cell ? `${cell.date}: ${pnl! >= 0 ? "+" : ""}$${pnl!.toFixed(2)}` : "No trading day"}
                      style={{
                        width: 14, height: 14, borderRadius: 4,
                        background: pnl === null ? "transparent" : cellColor(pnl),
                        border: pnl === null ? "1px dashed var(--color-gray-800)" : "none",
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
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
    label: "Challenge started",
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
      label: challenge.status === "passed" ? "Phase passed" : "Challenge failed",
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
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-gray-100)" }}>Timeline</h3>
      <div style={{ background: "var(--color-gray-900)", padding: "1.25rem 1.25rem 0.5rem", borderRadius: "12px", border: "1px solid var(--color-gray-800)" }}>
        <div style={{ position: "relative", paddingLeft: "1.4rem" }}>
          <div style={{ position: "absolute", left: "0.4rem", top: "0.35rem", bottom: "0.35rem", width: "2px", background: "var(--color-gray-700)", borderRadius: "1px" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {milestones.map((m, i) => (
              <div key={i} style={{ position: "relative", display: "flex", gap: "0.9rem" }}>
                <div style={{
                  position: "absolute", left: "-1.4rem", top: "0.25rem",
                  width: "12px", height: "12px", borderRadius: "50%",
                  background: dotColor(m.kind), boxShadow: `0 0 0 3px ${dotColor(m.kind)}22`,
                }} />
                <div style={{ flex: 1, minWidth: 0, paddingBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--color-gray-100)" }}>{m.label}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", flexShrink: 0 }}>{formatEventDate(m.date.toISOString())}</span>
                  </div>
                  {m.sub && <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginTop: "0.15rem" }}>{m.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
