"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, MailOpen, Circle, Filter, Loader2 } from "lucide-react"
import { toast } from "sonner"

type PropEvent = {
  id: string
  eventType: string
  severity: string
  message: string | null
  readAt: string | null
  createdAt: string
  challenge: {
    id: string
    status: string
    phase: string | null
    account: { name: string } | null
    template: { firmName: string; logoUrl: string | null } | null
  }
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  breached: "Breached",
  target_hit: "Target hit",
  alert_80pct: "Drawdown 80%",
  alert_90pct: "Drawdown 90%",
  min_days_not_met: "Min days not met",
  stop_trading: "Stop trading",
  goal_reached: "Goal reached",
  deadline_5d: "Deadline J-5",
  deadline_1d: "Deadline J-1",
}

const SEVERITY_COLORS: Record<string, string> = {
  info: "var(--color-brand-500)",
  warning: "var(--color-warning)",
  critical: "var(--color-loss)",
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
] as const

export function NotificationsCenter() {
  const router = useRouter()
  const [events, setEvents] = useState<PropEvent[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<(typeof FILTERS)[number]["key"]>("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=200")
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setEvents(data.events || [])
      setUnread(data.unreadCount || 0)
    } catch {
      toast.error("Failed to load notifications")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const types = useCallback(() => {
    const set = new Set<string>()
    events.forEach(e => set.add(e.eventType))
    return [...set].sort()
  }, [events])

  const filtered = events.filter(e => {
    if (statusFilter === "unread" && e.readAt) return false
    if (statusFilter === "read" && !e.readAt) return false
    if (typeFilter !== "all" && e.eventType !== typeFilter) return false
    return true
  })

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    setUnread(0)
    setEvents(prev => prev.map(e => ({ ...e, readAt: new Date().toISOString() })))
    toast.success("All notifications marked as read")
  }

  const toggleRead = async (e: PropEvent) => {
    const nowIso = new Date().toISOString()
    if (e.readAt) {
      // Re-mark as unread is not supported by the API; just navigate.
      await fetch(`/api/notifications/${e.id}`, { method: "PATCH" })
    }
    await fetch(`/api/notifications/${e.id}`, { method: "PATCH" })
    if (!e.readAt) setUnread(prev => Math.max(0, prev - 1))
    setEvents(prev => prev.map(x => (x.id === e.id ? { ...x, readAt: nowIso } : x)))
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return new Date(iso).toLocaleDateString("en-US")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">Challenge and account events.</p>
          </div>
        </div>
        <button className="btn btn-outline" onClick={markAllRead} disabled={unread === 0}>
          <CheckCheck size={15} /> Mark all read
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "0.35rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "10px", padding: "0.25rem" }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: "0.35rem 0.8rem", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "0.8rem",
                fontWeight: 600, transition: "all 150ms ease",
                background: statusFilter === f.key ? "var(--color-gray-700)" : "transparent",
                color: statusFilter === f.key ? "var(--color-gray-100)" : "var(--color-gray-400)",
              }}
            >
              {f.label}
              {f.key === "unread" && unread > 0 && (
                <span style={{ marginLeft: "0.35rem", fontSize: "0.68rem", fontWeight: 700, color: "var(--color-brand-500)" }}>
                  {unread}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Filter size={14} style={{ color: "var(--color-gray-500)" }} />
          <select className="input select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 180 }}>
            <option value="all">All event types</option>
            {types().map(t => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t] || t}</option>
            ))}
          </select>
        </div>

        <span style={{ fontSize: "0.78rem", color: "var(--color-gray-500)", marginLeft: "auto" }}>
          {filtered.length} of {events.length} events
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "3rem", color: "var(--color-gray-500)", fontSize: "0.85rem" }}>
          <Loader2 size={18} className="spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Bell size={32} style={{ color: "var(--color-gray-600)", marginBottom: "0.5rem" }} />
          <div>No notifications match this filter.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {filtered.map(e => {
            const sev = SEVERITY_COLORS[e.severity] || "var(--color-gray-600)"
            const unread_ = !e.readAt
            return (
              <div
                key={e.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "0.8rem", padding: "0.9rem 1rem",
                  borderRadius: "12px", cursor: "pointer", transition: "all 150ms ease",
                  background: unread_ ? "rgba(139,92,246,0.05)" : "var(--color-gray-900)",
                  border: `1px solid ${unread_ ? "rgba(139,92,246,0.25)" : "var(--color-gray-800)"}`,
                }}
                onClick={() => { toggleRead(e); router.push(`/challenges/${e.challenge.id}`) }}
                onMouseEnter={ev => { ev.currentTarget.style.borderColor = "var(--color-gray-700)" }}
                onMouseLeave={ev => { ev.currentTarget.style.borderColor = unread_ ? "rgba(139,92,246,0.25)" : "var(--color-gray-800)" }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: sev, marginTop: "0.25rem", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="badge" style={{ background: `${sev}22`, color: sev, border: `1px solid ${sev}40`, fontSize: "0.66rem" }}>
                      {EVENT_TYPE_LABELS[e.eventType] || e.eventType}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-gray-300)", fontWeight: 600, flex: 1, minWidth: 0 }}>
                      {e.message || `${e.challenge.template?.firmName || "Challenge"} event`}
                    </span>
                    {unread_ && <Circle size={8} fill="var(--color-brand-500)" style={{ color: "var(--color-brand-500)", flexShrink: 0 }} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.3rem", fontSize: "0.72rem", color: "var(--color-gray-500)" }}>
                    {e.challenge.template?.logoUrl && (
                      <span style={{ width: 14, height: 14, borderRadius: 3, overflow: "hidden", background: "var(--color-gray-800)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={e.challenge.template.logoUrl} alt={e.challenge.template?.firmName || "Firm"} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      </span>
                    )}
                    <span>{e.challenge.template?.firmName || "Prop Firm"}</span>
                    <span>·</span>
                    <span>{e.challenge.account?.name || e.challenge.phase || ""}</span>
                    <span>·</span>
                    <span>{timeAgo(e.createdAt)}</span>
                    {e.challenge.status && (
                      <>
                        <span>·</span>
                        <span style={{ color: "var(--color-gray-400)" }}>status: {e.challenge.status}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "0.3rem 0.5rem", flexShrink: 0 }}
                  onClick={ev => { ev.stopPropagation(); toggleRead(e) }}
                  title={unread_ ? "Mark as read" : "Mark as read"}
                >
                  <MailOpen size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
