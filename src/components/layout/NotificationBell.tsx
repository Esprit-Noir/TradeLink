"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

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

const SEVERITY_COLORS: Record<string, string> = {
  info: "var(--color-brand-500)",
  warning: "var(--color-warning)",
  critical: "var(--color-loss)",
}

export function NotificationBell() {
  const router = useRouter()
  const [events, setEvents] = useState<PropEvent[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=30")
      if (!res.ok) return
      const data = await res.json()
      setEvents(data.events || [])
      setUnread(data.unreadCount || 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30000)
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => {
      clearInterval(interval)
      document.removeEventListener("mousedown", onDocClick)
    }
  }, [refresh])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    setUnread(0)
    setEvents(prev => prev.map(e => ({ ...e, readAt: new Date().toISOString() })))
  }

  const openEvent = async (e: PropEvent) => {
    if (!e.readAt) {
      await fetch(`/api/notifications/${e.id}`, { method: "PATCH" })
      setUnread(prev => Math.max(0, prev - 1))
      setEvents(prev => prev.map(x => (x.id === e.id ? { ...x, readAt: new Date().toISOString() } : x)))
    }
    setOpen(false)
    router.push(`/challenges/${e.challenge.id}`)
  }

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) refresh() }}
        aria-label="Notifications"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--color-gray-400)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: "7px",
          position: "relative",
          transition: "all 200ms ease",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--color-gray-800)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <svg viewBox="0 0 16 16" fill="none" width="17" height="17">
          <path d="M8 1.5a4 4 0 00-4 4v2.3L3 10.5h10l-1-2.7V5.5a4 4 0 00-4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M6.5 13a1.8 1.8 0 003 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 15,
            height: 15,
            borderRadius: "8px",
            background: "var(--color-loss)",
            color: "white",
            fontSize: "0.6rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: 34,
          left: 0,
          width: 320,
          maxWidth: "85vw",
          background: "var(--color-gray-900)",
          border: "1px solid var(--color-gray-700)",
          borderRadius: "12px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          zIndex: 100,
          overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.6rem 0.8rem", borderBottom: "1px solid var(--color-gray-800)",
          }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-gray-300)" }}>
              Notifications
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  fontSize: "0.7rem", color: "var(--color-brand-500)", background: "transparent",
                  border: "none", cursor: "pointer",
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {loading && (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.78rem", color: "var(--color-gray-500)" }}>Loading…</div>
            )}
            {!loading && events.length === 0 && (
              <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.78rem", color: "var(--color-gray-500)" }}>
                No notifications yet.
              </div>
            )}
            {events.map(e => (
              <button
                key={e.id}
                onClick={() => openEvent(e)}
                style={{
                  display: "flex", gap: "0.6rem", padding: "0.65rem 0.8rem", width: "100%",
                  background: e.readAt ? "transparent" : "rgba(139,92,246,0.06)",
                  border: "none", borderBottom: "1px solid var(--color-gray-800)",
                  cursor: "pointer", textAlign: "left", alignItems: "flex-start",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: SEVERITY_COLORS[e.severity] || "var(--color-gray-600)", marginTop: "0.3rem", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-gray-200)", lineHeight: 1.35 }}>
                    {e.message || `${e.challenge.template?.firmName || "Challenge"} event`}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>
                    {e.challenge.template?.firmName || "Prop Firm"} · {e.challenge.account?.name || e.challenge.phase || ""} · {timeAgo(e.createdAt)}
                  </div>
                </div>
                {!e.readAt && (
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--color-brand-500)", flexShrink: 0, marginTop: "0.3rem" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
