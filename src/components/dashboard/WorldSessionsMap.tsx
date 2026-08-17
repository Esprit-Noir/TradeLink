"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false })

interface Session {
  id: string
  flag: string
  openHour: number
  closeHour: number
  top: string
  left: string
  color: string
  location: [number, number]
}

// Summer hours (UTC), winter hours are +1 for London/NY
const SESSIONS: Session[] = [
  { id: "sydney", flag: "\u{1F1E6}\u{1F1FA}", openHour: 22, closeHour: 7, top: "75%", left: "85%", color: "#8b5cf6", location: [-33.8688, 151.2093] },
  { id: "tokyo", flag: "\u{1F1EF}\u{1F1F5}", openHour: 0, closeHour: 9, top: "40%", left: "82%", color: "#ef4444", location: [35.6762, 139.6503] },
  { id: "london", flag: "\u{1F1EC}\u{1F1E7}", openHour: 7, closeHour: 16, top: "30%", left: "47%", color: "#38bdf8", location: [51.5072, -0.1276] },
  { id: "new_york", flag: "\u{1F1FA}\u{1F1F8}", openHour: 12, closeHour: 21, top: "38%", left: "22%", color: "#ec4899", location: [40.7128, -74.006] },
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

function RealisticGlobe({ now, summer }: { now: Date, summer: boolean }) {
  const globeRef = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      const { offsetWidth, offsetHeight } = containerRef.current
      setDimensions({ width: offsetWidth, height: offsetHeight })
    }
  }, [])

  useEffect(() => {
    if (!globeRef.current) return
    const globe = globeRef.current

    // Set up controls
    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.3
    globe.controls().enableZoom = false
    globe.controls().enablePan = false

    // Point of view
    globe.pointOfView({ lat: 20, lng: -30, altitude: 2.2 })
  }, [])

  // Markers data
  const markers = SESSIONS.map(s => {
    const isOpen = isSessionOpen(s, now)
    return {
      id: s.id,
      lat: s.location[0],
      lng: s.location[1],
      size: isOpen ? 0.35 : 0.18,
      color: isOpen ? s.color : "#555555",
      isOpen,
      session: s,
    }
  })

  const globeSize = Math.min(dimensions.width, dimensions.height)

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Globe
        ref={globeRef}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl=""
        backgroundColor="rgba(0,0,0,0)"
        width={globeSize}
        height={globeSize}
        pointsData={markers}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.02}
        pointRadius="size"
        pointsMerge={false}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.25}
      />
    </div>
  )
}

export function WorldSessionsMap() {
  const [now, setNow] = useState(() => new Date())
  const [mounted, setMounted] = useState(false)

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
        position: "relative", width: "100%", flex: "1 1 0", minHeight: 300,
        borderRadius: 12, overflow: "hidden", marginBottom: 16 
      }}>
        {mounted && <RealisticGlobe now={now} summer={summer} />}
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
              borderColor: open ? `${session.color}40` : "var(--color-gray-800)",
              background: open ? "var(--color-gray-900)" : "transparent",
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
