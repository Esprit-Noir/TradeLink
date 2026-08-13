"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChallengeDetailView } from "@/components/prop-firm/ChallengeDetailView"
import { PayoutsSection } from "@/components/prop-firm/PayoutsSection"
import { AlertSettings } from "@/components/prop-firm/AlertSettings"
import { NotesSection } from "@/components/prop-firm/NotesSection"
import { ShareCard } from "@/components/prop-firm/ShareCard"
import { CreateChallengeDrawer } from "@/components/prop-firm/CreateChallengeDrawer"

export function ChallengeDetailPage({
  challenge,
  templates,
  accounts,
}: {
  challenge: any
  templates: any[]
  accounts: any[]
}) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resetting, setResetting] = useState(false)

  const isPassed = challenge.status === 'passed'

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/recalculate`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to sync")
      router.refresh()
      toast.success("Challenge re-evaluated")
    } catch (err) {
      toast.error("Failed to sync challenge")
    } finally {
      setSyncing(false)
    }
  }

  const handleUpgrade = async () => {
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/upgrade`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to upgrade")
      router.refresh()
      toast.success(isPassed ? "Upgraded to next phase" : "Challenge upgraded")
    } catch (err) {
      toast.error("Failed to upgrade phase")
    }
  }

  const handleSubmit = async (data: any) => {
    const res = await fetch(`/api/challenges/${challenge.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, id: challenge.id }),
    })
    if (!res.ok) {
      const errData = await res.json()
      throw new Error(errData.error || "Failed to update challenge")
    }
    router.refresh()
  }

  const handleDelete = async () => {
    if (!confirm(`Delete challenge "${challenge.account.name}" and its trading account? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/challenges/${challenge.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Challenge deleted")
      router.push("/challenges")
    } catch (err) {
      toast.error("Failed to delete challenge")
      setDeleting(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/export?format=csv`)
      if (!res.ok) throw new Error("Failed to export")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `challenge-${challenge.account.name.replace(/[^a-z0-9]+/gi, "-")}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Challenge exported")
    } catch {
      toast.error("Failed to export challenge")
    }
  }

  const handleReset = async () => {
    if (!confirm(
      `Reset challenge "${challenge.account.name}" back to ${challenge.metadata?.steps === '1' ? 'funded' : 'phase 1'}?\n\n` +
      `This will DELETE all trades, daily snapshots and events on this challenge and restart the timer. This cannot be undone.`
    )) return
    setResetting(true)
    try {
      const res = await fetch(`/api/challenges/${challenge.id}/reset`, { method: "POST" })
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
    firmName: challenge.template?.firmName || "Prop Firm",
    programName: challenge.template?.programName || "",
    logoUrl: challenge.template?.logoUrl || null,
    accountName: challenge.account.name,
    phase: challenge.phase,
    status: challenge.status,
    initialBalance: Number(challenge.initialBalance),
    currentBalance: Number(challenge.currentBalance || challenge.initialBalance),
    currentProfitPct: Number(challenge.initialBalance) > 0
      ? ((Number(challenge.currentBalance || challenge.initialBalance) - Number(challenge.initialBalance)) / Number(challenge.initialBalance)) * 100
      : 0,
    profitTargetPct: Number(challenge.profitTargetPct),
    targetProgressPct: Number(challenge.profitTargetPct) > 0
      ? ((Number(challenge.currentBalance || challenge.initialBalance) - Number(challenge.initialBalance)) / (Number(challenge.initialBalance) * Number(challenge.profitTargetPct) / 100)) * 100
      : 0,
    maxDDPct: Number(challenge.maxDDPct),
    ddUsedPct: Number(challenge.maxDDPct) > 0
      ? ((Number(challenge.initialBalance) - Number(challenge.currentBalance || challenge.initialBalance)) / (Number(challenge.initialBalance) * Number(challenge.maxDDPct) / 100)) * 100
      : 0,
    tradingDays: Number(challenge.metadata?.tradingDaysCount || 0),
    minTradingDays: challenge.minTradingDays,
    daysRemaining: challenge.deadlineAt
      ? Math.max(0, Math.ceil((new Date(challenge.deadlineAt).getTime() - Date.now()) / 86400000))
      : null,
  }

  return (
    <>
      <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => router.push("/challenges")}
            className="btn btn-outline"
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
          >
            &larr; Back
          </button>
          {challenge.template?.logoUrl && (
            <div style={{
              width: "40px", height: "40px", borderRadius: "8px",
              background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={challenge.template.logoUrl} alt={`${challenge.template.firmName} logo`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          )}
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700 }}>{challenge.account.name}</h1>
            <div style={{ fontSize: "0.85rem", color: "var(--color-gray-400)" }}>
              {challenge.template.firmName} — {challenge.template.programName}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {isPassed && challenge.phase === 'phase_1' && (
            <button onClick={handleUpgrade} className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              {challenge.metadata?.steps === '2' ? "Start Phase 2" : "Get Funded"}
            </button>
          )}
          <button onClick={handleSync} disabled={syncing} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            {syncing ? "Syncing..." : "Sync Engine"}
          </button>
          <button onClick={handleExport} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            Export CSV
          </button>
          <ShareCard data={shareData} />
          <button onClick={() => setEditing(true)} className="btn btn-outline" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
            Edit
          </button>
          {(challenge.status === 'breached' || challenge.status === 'failed') && (
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

      <ChallengeDetailView challenge={challenge} />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1.5rem" }}>
        <AlertSettings challengeId={challenge.id} initialConfig={challenge.alertConfig} />

        {challenge.phase === 'funded' && <PayoutsSection challengeId={challenge.id} />}

        <NotesSection challengeId={challenge.id} />
      </div>

      <CreateChallengeDrawer
        isOpen={editing}
        onClose={() => setEditing(false)}
        accounts={accounts}
        templates={templates}
        challenge={challenge}
        onSubmit={handleSubmit}
      />
    </>
  )
}
