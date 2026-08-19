"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "@/components/ThemeProvider"

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
    return { open: summer ? 22 : 21, close: summer ? 7 : 6 }
  }
  if (session.id === "london") {
    return { open: summer ? 7 : 8, close: summer ? 16 : 17 }
  }
  if (session.id === "new_york") {
    return { open: summer ? 12 : 13, close: summer ? 21 : 22 }
  }
  return { open: session.openHour, close: session.closeHour }
}

function isSessionOpen(session: Session, now: Date): boolean {
  const day = now.getUTCDay()
  const utc = now.getUTCHours() + now.getUTCMinutes() / 60
  const summer = isDST(now)
  const h = getSessionHours(session, summer)

  // Forex weekend check (Closed from Friday 21:00 UTC to Sunday 21:00 UTC)
  if (day === 6) return false
  if (day === 5 && utc >= 21) return false
  if (day === 0 && utc < 21) return false

  return h.open < h.close
    ? utc >= h.open && utc < h.close
    : utc >= h.open || utc < h.close
}

function getSessionProgress(session: Session, now: Date): number {
  if (!isSessionOpen(session, now)) return 0
  const utc = now.getUTCHours() + now.getUTCMinutes() / 60
  const summer = isDST(now)
  const h = getSessionHours(session, summer)
  
  const open = h.open
  const close = h.close < h.open ? h.close + 24 : h.close
  const current = utc < h.open && h.close < h.open ? utc + 24 : utc

  if (current >= open && current < close) {
    return Math.max(0, Math.min(100, ((current - open) / (close - open)) * 100))
  }
  return 0
}

function MapPin({ session, now, summer, isDark }: { session: Session; now: Date; summer: boolean; isDark: boolean }) {
  const open = isSessionOpen(session, now)
  const h = getSessionHours(session, summer)
  return (
    <div style={{
      position: "absolute", left: session.left, top: session.top,
      transform: "translate(-50%, -50%)", zIndex: open ? 10 : 1,
    }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        
        {/* Radar Ping Effect */}
        {open && (
          <>
            <motion.div
              style={{ position: "absolute", borderRadius: "50%", background: session.color, width: 14, height: 14 }}
              animate={{ scale: [1, 6], opacity: [0.7, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              style={{ position: "absolute", borderRadius: "50%", background: session.color, width: 14, height: 14 }}
              animate={{ scale: [1, 6], opacity: [0.7, 0] }}
              transition={{ duration: 2.5, delay: 1.25, repeat: Infinity, ease: "easeOut" }}
            />
          </>
        )}

        {/* Core Dot */}
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          background: open ? session.color : (isDark ? "var(--color-gray-600)" : "var(--color-gray-400)"),
          boxShadow: open ? `0 0 15px 2px ${session.color}, 0 0 30px ${session.color}` : "none",
          position: "relative", zIndex: 10,
        }} />

        {/* Label */}
        <div style={{
          position: "absolute", top: 22, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
          background: isDark ? "rgba(10, 10, 12, 0.85)" : "rgba(255, 255, 255, 0.9)", padding: "4px 8px", borderRadius: 6,
          border: `1px solid ${open ? session.color : (isDark ? 'var(--color-gray-800)' : 'var(--color-gray-200)')}`,
          boxShadow: open ? `0 4px 12px rgba(0,0,0,0.5), 0 0 10px ${session.color}40` : "0 4px 12px rgba(0,0,0,0.1)",
          pointerEvents: "none",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : (isDark ? 0.6 : 0.8),
        }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 800, color: open ? session.color : (isDark ? "var(--color-gray-300)" : "var(--color-gray-700)"), textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {SESSION_NAMES[session.id]}
          </span>
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: open ? (isDark ? "#ffffff" : "#000000") : (isDark ? "var(--color-gray-400)" : "var(--color-gray-500)"), marginTop: -1 }}>
            {String(h.open).padStart(2, "0")}:00 - {String(h.close).padStart(2, "0")}:00
          </span>
        </div>
      </div>
    </div>
  )
}

export function WorldSessionsMap() {
  const [now, setNow] = useState(() => new Date())
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const isDark = mounted ? resolvedTheme === "dark" : true

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const day = now.getUTCDay()
  const utc = now.getUTCHours() + now.getUTCMinutes() / 60
  const summer = isDST(now)
  const isWeekend = day === 6 || (day === 5 && utc >= 21) || (day === 0 && utc < 21)
  
  const currentUtcString = mounted ? now.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false, hour: '2-digit', minute: '2-digit' }) : "--:--"

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, 
            background: isWeekend ? "var(--color-loss-muted)" : "rgba(124, 58, 237, 0.1)", 
            display: "flex", alignItems: "center", justifyContent: "center" 
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isWeekend ? "var(--color-loss)" : "var(--color-brand-500)"} strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: 2 }}>
              Market Sessions
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: "0.65rem", color: "var(--color-gray-400)", fontWeight: 600, letterSpacing: "0.05em" }}>CURRENT TIME (UTC)</span>
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-gray-100)", background: "var(--color-gray-800)", padding: "1px 6px", borderRadius: 4 }}>
                {currentUtcString}
              </span>
              {isWeekend && (
                <span className="badge badge-loss" style={{ fontSize: "0.55rem", padding: "1px 4px" }}>Weekend</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* World Map Area */}
      <div style={{ 
        position: "relative", width: "100%", aspectRatio: "2/1", 
        background: isDark 
          ? "var(--color-gray-950)" 
          : "var(--color-gray-50)", 
        borderRadius: 12, 
        border: `1px solid ${isDark ? "var(--color-gray-800)" : "var(--color-gray-200)"}`, 
        overflow: "hidden", 
        marginBottom: 16 
      }}>
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none", zIndex: 5,
          backgroundImage: `linear-gradient(${isDark ? "var(--color-gray-700)" : "var(--color-gray-300)"} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? "var(--color-gray-700)" : "var(--color-gray-300)"} 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }} />
        
        {/* Colored Map using CSS Mask */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: isDark ? "var(--color-brand-500)" : "var(--color-brand-600)",
          opacity: isDark ? 0.15 : 0.25,
          maskImage: "url(/world.svg)",
          WebkitMaskImage: "url(/world.svg)",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          zIndex: 6
        }} />
        
        {mounted && SESSIONS.map(session => (
          <MapPin key={session.id} session={session} now={now} summer={summer} isDark={isDark} />
        ))}
      </div>

      {/* Session Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
        {mounted && SESSIONS.map(session => {
          const open = isSessionOpen(session, now)
          const h = getSessionHours(session, summer)
          const progress = getSessionProgress(session, now)
          
          return (
            <div key={session.id} className="card" style={{
              padding: "0.85rem",
              borderColor: open ? `${session.color}40` : (isDark ? "var(--color-gray-800)" : "var(--color-gray-200)"),
              background: open ? (isDark ? "var(--color-gray-900)" : "var(--color-brand-50)") : "transparent",
              position: "relative", overflow: "hidden"
            }}>
              {open && (
                <div style={{
                  position: "absolute", top: -20, right: -20, width: 80, height: 80,
                  background: session.color, opacity: 0.1, filter: "blur(20px)", borderRadius: "50%"
                }} />
              )}
              
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "1.2rem" }}>{session.flag}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-gray-100)", textTransform: "uppercase" }}>
                    {SESSION_NAMES[session.id]}
                  </span>
                </div>
                <span className={`badge ${open ? "badge-profit" : "badge-loss"}`} style={{ 
                  fontSize: "0.55rem", background: open ? `${session.color}20` : undefined, color: open ? session.color : undefined 
                }}>
                  {open ? "Open" : "Closed"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: 6 }}>
                <span>{String(h.open).padStart(2, "0")}:00 UTC</span>
                <span>{String(h.close).padStart(2, "0")}:00 UTC</span>
              </div>
              
              {/* Progress Bar */}
              <div style={{ height: 6, width: "100%", background: "var(--color-gray-800)", borderRadius: 4, overflow: "hidden" }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: "100%", background: open ? session.color : "transparent", borderRadius: 4 }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
