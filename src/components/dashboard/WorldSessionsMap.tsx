"use client"

import { useState, useEffect } from "react"

interface Session {
  id: string
  flag: string
  openHour: number
  closeHour: number
  top: string
  left: string
  color: string
}

// Summer hours (UTC), winter hours are +1 for London/NY
const SESSIONS: Session[] = [
  { id: "sydney", flag: "\u{1F1E6}\u{1F1FA}", openHour: 22, closeHour: 7, top: "75%", left: "85%", color: "#8b5cf6" },
  { id: "tokyo", flag: "\u{1F1EF}\u{1F1F5}", openHour: 0, closeHour: 9, top: "40%", left: "82%", color: "#ef4444" },
  { id: "london", flag: "\u{1F1EC}\u{1F1E7}", openHour: 7, closeHour: 16, top: "30%", left: "47%", color: "#38bdf8" },
  { id: "new_york", flag: "\u{1F1FA}\u{1F1F8}", openHour: 12, closeHour: 21, top: "38%", left: "22%", color: "#ec4899" },
]

const SESSION_NAMES: Record<string, string> = {
  sydney: "Sydney",
  tokyo: "Tokyo",
  london: "London",
  new_york: "New York",
}

// Detect DST: check if London is in summer time (UTC+1) or winter (UTC+0)
// DST = last Sunday of March → last Sunday of October (approximation)
function isDST(now: Date): boolean {
  const utc = now.getTime()
  const year = now.getUTCFullYear()
  const marchLast = new Date(Date.UTC(year, 2, 31, 1, 0, 0))
  marchLast.setUTCDate(31 - ((marchLast.getUTCDay() + 6) % 7))
  const octLast = new Date(Date.UTC(year, 9, 31, 1, 0, 0))
  octLast.setUTCDate(31 - ((octLast.getUTCDay() + 6) % 7))
  return utc >= marchLast.getTime() && utc < octLast.getTime()
}

function getSessionHours(session: Session, summer: boolean) {
  if (session.id === "sydney") {
    // Summer: 22:00→07:00 UTC, Winter: 21:00→06:00 UTC
    return { open: summer ? 22 : 21, close: summer ? 7 : 6 }
  }
  if (session.id === "london") {
    // Summer: 07:00→16:00 UTC, Winter: 08:00→17:00 UTC
    return { open: summer ? 7 : 8, close: summer ? 16 : 17 }
  }
  if (session.id === "new_york") {
    // Summer: 12:00→21:00 UTC, Winter: 13:00→22:00 UTC
    return { open: summer ? 12 : 13, close: summer ? 21 : 22 }
  }
  // Tokyo: same all year 00:00→09:00 UTC
  return { open: session.openHour, close: session.closeHour }
}

function isSessionOpen(session: Session, now: Date): boolean {
  const day = now.getUTCDay()
  const utc = now.getUTCHours() + now.getUTCMinutes() / 60
  const summer = isDST(now)
  const h = getSessionHours(session, summer)

  // Weekend check
  if (day === 6) return false
  if (day === 5 && utc >= h.close) return false
  if (day === 0 && utc < h.open) return false

  return h.open < h.close
    ? utc >= h.open && utc < h.close
    : utc >= h.open || utc < h.close
}

function MapPin({ session, now }: { session: Session; now: Date }) {
  const open = isSessionOpen(session, now)
  return (
    <div style={{
      position: "absolute", left: session.left, top: session.top,
      transform: "translate(-50%, -100%)", zIndex: open ? 10 : 1,
    }}>
      <svg width="24" height="32" viewBox="0 0 24 32" fill="none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
        <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20C24 5.37 18.63 0 12 0z" fill="var(--color-gray-800)" stroke="var(--color-gray-700)" strokeWidth="1" />
        <circle cx="12" cy="11" r="5" fill={session.color} opacity={open ? 1 : 0.3} style={open ? { filter: `drop-shadow(0 0 6px ${session.color})` } : {}} />
      </svg>
      <div style={{
        position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
        whiteSpace: "nowrap", fontSize: "0.7rem", fontWeight: 700, color: session.color,
        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
      }}>
        {SESSION_NAMES[session.id]}
      </div>
    </div>
  )
}

export function WorldSessionsMap() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(interval)
  }, [])

  const day = now.getUTCDay()
  const utc = now.getUTCHours() + now.getUTCMinutes() / 60
  const summer = isDST(now)
  const isWeekend = day === 6 || (day === 5 && utc >= 21) || (day === 0 && utc < 0)

  return (
    <div style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isWeekend ? "var(--color-loss)" : "var(--color-profit)" }} />
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)", display: "flex", alignItems: "center", gap: 6 }}>
            Market Sessions
            {isWeekend && (
              <span className="badge badge-loss" style={{ fontSize: "0.55rem" }}>Weekend</span>
            )}
          </h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.7rem", color: "var(--color-gray-400)" }}>
          {SESSIONS.map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isSessionOpen(s, now) ? "var(--color-profit)" : "var(--color-loss)", opacity: isSessionOpen(s, now) ? 1 : 0.5 }} />
              <span>{s.flag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* World Map */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "2/1", background: "var(--color-gray-950)", borderRadius: 8, border: "1px solid var(--color-gray-800)", overflow: "hidden", marginBottom: 12 }}>
        <img src="/world.svg" alt="World Map" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
        {SESSIONS.map(session => (
          <MapPin key={session.id} session={session} now={now} />
        ))}
      </div>

      {/* Session Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
        {SESSIONS.map(session => {
          const open = isSessionOpen(session, now)
          return (
            <div key={session.id} className="card" style={{
              padding: "0.75rem",
              borderColor: open ? "rgba(16,185,129,0.3)" : undefined,
              background: open ? "var(--color-profit-muted)" : undefined,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "1.1rem" }}>{session.flag}</span>
                <span className={`badge ${open ? "badge-profit" : "badge-loss"}`} style={{ fontSize: "0.55rem" }}>
                  {open ? "Open" : "Closed"}
                </span>
              </div>
              <p style={{ fontSize: "0.75rem", fontWeight: 500, color: open ? "var(--color-gray-200)" : "var(--color-gray-400)" }}>{SESSION_NAMES[session.id]}</p>
              <p style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", marginTop: 2 }}>
                {String(getSessionHours(session, summer).open).padStart(2, "0")}:00 – {String(getSessionHours(session, summer).close).padStart(2, "0")}:00 UTC
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
