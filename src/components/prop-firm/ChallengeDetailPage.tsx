"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChallengeDetailView } from "@/components/prop-firm/ChallengeDetailView"
import { PayoutsSection } from "@/components/prop-firm/PayoutsSection"
import { AlertSettings } from "@/components/prop-firm/AlertSettings"
import { NotesSection } from "@/components/prop-firm/NotesSection"
import { ShareCard } from "@/components/prop-firm/ShareCard"
import { ExportPdfButton } from "@/components/prop-firm/ExportPdfButton"
import { CreateChallengeDrawer } from "@/components/prop-firm/CreateChallengeDrawer"

interface AlertConfig {
  stopTradingPct?: number
  profitGoalPct?: number
  enableStopTrading?: boolean
  enableProfitGoal?: boolean
}

interface ChallengeTemplate {
  firmName?: string
  programName?: string
  logoUrl?: string | null
  drawdownType: string
  dailyDDPct?: number | string | null
  maxDDPct: number | string
  dailyResetTimezone: string
  profitTargetPhase1Pct?: number | string | null
  profitTargetPhase2Pct?: number | string | null
  minTradingDays?: number | null
  maxTradingDays?: number | null
  consistencyRulePct?: number | string | null
  weekendHoldingAllowed: boolean
  newsTradingAllowed: boolean
}

interface ChallengeEvent {
  id: string
  eventType: string
  severity: string
  message?: string | null
  createdAt: string
}

interface Challenge {
  id: string
  userId: string
  accountId: string
  templateId: string
  initialBalance: number
  dailyDDPct: number
  maxDDPct: number
  profitTargetPct: number
  minTradingDays?: number | null
  maxTradingDays?: number | null
  cost?: number | null
  phase: string
  status: string
  startedAt: string
  deadlineAt?: string | null
  breachedAt?: string | null
  breachReason?: string | null
  currentBalance?: number | null
  currentEquity?: number | null
  highestBalance?: number | null
  highestEquity?: number | null
  todayStartBalance?: number | null
  todayResetAt?: string | null
  createdAt: string
  updatedAt: string
  metadata?: { steps?: string; tradingDaysCount?: number } | null
  alertConfig?: AlertConfig | null
  template: ChallengeTemplate
  account: { name: string }
  events?: ChallengeEvent[]
}

interface TemplateSummary {
  id: string
  firmName: string
  programName: string
  logoUrl?: string | null
  drawdownType: string
  dailyDDPct?: number | null
  maxDDPct: number
  profitTargetPhase1Pct?: number | null
  profitTargetPhase2Pct?: number | null
  minTradingDays?: number | null
  maxTradingDays?: number | null
  consistencyRulePct?: number | null
}

interface AccountSummary {
  id: string
  name: string
}

interface ChallengeEditPayload {
  id?: string
  challengeName?: string
  initialBalance?: string
  templateId?: string
  profitTargetPct?: string
  phase2Target?: string
  fundedTarget?: string
  maxDDPct?: string
  dailyDDPct?: string
  minTradingDays?: string
  cost?: string
  steps?: string
  payoutSplit?: string
  logoUrl?: string
}

export function ChallengeDetailPage({
  challenge,
  templates,
  accounts,
}: {
  challenge: unknown
  templates: TemplateSummary[]
  accounts: AccountSummary[]
}) {
  const c = challenge as Challenge
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resetting, setResetting] = useState(false)

  const isPassed = c.status === 'passed'

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/challenges/${c.id}/recalculate`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to sync")
      router.refresh()
      toast.success("Challenge re-evaluated")
    } catch {
      toast.error("Failed to sync challenge")
    } finally {
      setSyncing(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch(`/api/challenges/${c.id}/upgrade`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to upgrade")
      router.refresh()
      toast.success(isPassed ? "Upgraded to next phase" : "Challenge upgraded")
    } catch {
      toast.error("Failed to upgrade phase")
    }
  }

  const handleSubmit = async (data: ChallengeEditPayload) => {
    const res = await fetch(`/api/challenges/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, id: c.id }),
    })
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || "Failed to update challenge")
    }
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete challenge "${c.account.name}" and its trading account? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/challenges/${c.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Challenge deleted")
      router.push("/challenges")
    } catch {
      toast.error("Failed to delete challenge")
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/challenges/${c.id}/export?format=csv`)
      if (!res.ok) throw new Error("Failed to export")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `challenge-${c.account.name.replace(/[^a-z0-9]+/gi, "-")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Challenge exported")
    } catch {
      toast.error("Failed to export challenge")
    }
  }

  const handleReset = async () => {
    if (!confirm(
      `Reset challenge "${c.account.name}" back to ${c.metadata?.steps === '1' ? 'funded' : 'phase 1'}?\n\n` +
      `This will DELETE all trades, daily snapshots and events on this challenge and restart the timer. This cannot be undone.`
    )) return
    setResetting(true)
    try {
      const res = await fetch(`/api/challenges/${c.id}/reset`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to reset")
      toast.success("Challenge reset")
      router.refresh()
    } catch {
      toast.error("Failed to reset challenge")
    } finally {
      setResetting(false)
    }
  }

  const shareData = {
    challengeId: c.id,
    firmName: c.template?.firmName || "Prop Firm",
    programName: c.template?.programName || "",
    logoUrl: c.template?.logoUrl || null,
    accountName: c.account.name,
    phase: c.phase,
    status: c.status,
    initialBalance: Number(c.initialBalance),
    currentBalance: Number(c.currentBalance || c.initialBalance),
    currentProfitPct: Number(c.initialBalance) > 0
      ? ((Number(c.currentBalance || c.initialBalance) - Number(c.initialBalance)) / Number(c.initialBalance)) * 100
      : 0,
    profitTargetPct: Number(c.profitTargetPct),
    targetProgressPct: Number(c.profitTargetPct) > 0
      ? ((Number(c.currentBalance || c.initialBalance) - Number(c.initialBalance)) / (Number(c.initialBalance) * Number(c.profitTargetPct) / 100)) * 100
      : 0,
    maxDDPct: Number(c.maxDDPct),
    ddUsedPct: Number(c.maxDDPct) > 0
      ? ((Number(c.initialBalance) - Number(c.currentBalance || c.initialBalance)) / (Number(c.initialBalance) * Number(c.maxDDPct) / 100)) * 100
      : 0,
    tradingDays: Number(c.metadata?.tradingDaysCount || 0),
    minTradingDays: c.minTradingDays ?? null,
    daysRemaining: c.deadlineAt
      ? Math.max(0, Math.ceil((new Date(c.deadlineAt).getTime() - Date.now()) / 86400000))
      : null,
  }

  return (
    <>
      <div style={{ 
        padding: "1.25rem 1.5rem", borderRadius: "8px", marginBottom: "2rem", 
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", 
        background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)"
      }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <button
            onClick={() => router.push("/challenges")}
            className="btn btn-outline"
            style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "var(--color-gray-300)" }}
            title="Back to Challenges"
          >
            &larr; Back
          </button>
          {c.template?.logoUrl && (
            <div style={{
              width: "44px", height: "44px", borderRadius: "6px",
              background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden"
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.template.logoUrl} alt={`${c.template.firmName} logo`} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-gray-100)" }}>{c.account.name}</h1>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>{c.template.firmName}</span>
              <span style={{ color: "var(--color-gray-600)" }}>&bull;</span>
              <span>{c.template.programName}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {isPassed && c.phase === 'phase_1' && (
            <button onClick={handleUpgrade} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              {c.metadata?.steps === '2' ? "Start Phase 2" : "Get Funded"}
            </button>
          )}
          <button onClick={handleSync} disabled={syncing} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            {syncing ? "Syncing..." : "Sync Engine"}
          </button>
          <button onClick={handleExport} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            Export CSV
          </button>
          <ExportPdfButton challengeId={c.id} accountName={c.account.name} />
          <ShareCard data={shareData} />
          <button onClick={() => setEditing(true)} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            Edit
          </button>
          {(c.status === 'breached' || c.status === 'failed') && (
            <button
              onClick={handleReset}
              disabled={resetting}
              className="btn btn-outline"
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--color-brand-500)" }}
            >
              {resetting ? "Resetting..." : "Reset"}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-outline"
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", color: "var(--color-loss)" }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      <ChallengeDetailView challenge={c} />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1.5rem" }}>
        <AlertSettings challengeId={c.id} initialConfig={c.alertConfig} />

        {c.phase === 'funded' && <PayoutsSection challengeId={c.id} />}

        <NotesSection challengeId={c.id} />
      </div>

      <CreateChallengeDrawer
        isOpen={editing}
        onClose={() => setEditing(false)}
        accounts={accounts}
        templates={templates}
        challenge={c}
        onSubmit={handleSubmit}
      />
    </>
  )
}
