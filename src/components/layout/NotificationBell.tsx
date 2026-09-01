"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Bell } from "lucide-react"

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
  const unreadRef = useRef(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/notifications?limit=30", { signal })
      if (!res.ok) return
      const data = await res.json()
      const nextEvents: PropEvent[] = data.events || []
      const nextUnread = data.unreadCount || 0

      if (
        nextUnread > unreadRef.current &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        localStorage.getItem("tradelink_browser_notifications") === "1"
      ) {
        const fresh = nextEvents.filter(e => !e.readAt)
        const target = fresh[0]
        if (target) {
          const n = new Notification(
            target.challenge.template?.firmName
              ? `${target.challenge.template.firmName} — ${target.message || "Prop event"}`
              : target.message || "New prop-firm event",
            { body: `Status: ${target.challenge.status}. ${target.challenge.account?.name || ""}`.trim() }
          )
          n.onclick = () => {
            window.focus()
            window.location.href = `/challenges/${target.challenge.id}`
          }
        }
      }

      setEvents(nextEvents)
      setUnread(nextUnread)
      unreadRef.current = nextUnread
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    const interval = setInterval(() => {
      const ctrl = new AbortController()
      refresh(ctrl.signal)
    }, 30000)
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDocClick)
    return () => {
      controller.abort()
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
    <div ref={ref} className="notif-wrapper">
      <button
        onClick={() => { setOpen(o => !o); if (!open) refresh() }}
        aria-label="Notifications"
        className="notif-bell"
      >
        <Bell size={18} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="notif-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span className="notif-dropdown-title">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="notif-mark-read">
                Mark all as read
              </button>
            )}
          </div>

          <div className="notif-dropdown-list">
            {loading && (
              <div className="notif-empty">Loading...</div>
            )}
            {!loading && events.length === 0 && (
              <div className="notif-empty">No notifications yet.</div>
            )}
            {events.map(e => (
              <button
                key={e.id}
                onClick={() => openEvent(e)}
                className={`notif-item ${!e.readAt ? "unread" : ""}`}
              >
                <div className="notif-dot" style={{ background: SEVERITY_COLORS[e.severity] || "var(--color-gray-600)" }} />
                <div className="notif-item-content">
                  <div className="notif-item-message">
                    {e.message || `${e.challenge.template?.firmName || "Challenge"} event`}
                  </div>
                  <div className="notif-item-meta">
                    {e.challenge.template?.firmName || "Prop Firm"} · {e.challenge.account?.name || e.challenge.phase || ""} · {timeAgo(e.createdAt)}
                  </div>
                </div>
                {!e.readAt && (
                  <div className="notif-unread-dot" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
