"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import createGlobe from "cobe"

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

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [1, 1, 1];
}

function CobeGlobe({ now, summer }: { now: Date, summer: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [wrapper, setWrapper] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    let phi = 0
    if (!canvasRef.current) return
    
    // Fallback to a fixed width if offsetWidth is 0
    const w = Math.min(canvasRef.current.offsetWidth, canvasRef.current.offsetHeight) || 400
    
    // Initial markers for setup
    const initialMarkers = SESSIONS.map(s => {
      const isOpen = isSessionOpen(s, now)
      return {
        id: s.id,
        location: s.location as [number, number],
        size: isOpen ? 0.08 : 0.05,
        color: isOpen ? hexToRgb(s.color) : [0.5, 0.5, 0.5] as [number, number, number]
      }
    })
    
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: w * 2,
      height: w * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 20000,
      mapBrightness: 6,
      baseColor: [0.15, 0.15, 0.3],
      markerColor: [1, 1, 1],
      glowColor: [0.2, 0.2, 0.6],
      markers: initialMarkers,
    } as any)
    
    let animationId: number
    const render = () => {
      phi += 0.005
      
      const currentTime = new Date()
      // Create animated markers for pulsating effect
      const animatedMarkers = SESSIONS.map(s => {
        const isOpen = isSessionOpen(s, currentTime)
        // Pulsate between 0.05 and 0.11 size for active sessions
        const size = isOpen 
          ? 0.08 + Math.sin(Date.now() / 250) * 0.03
          : 0.04
          
        return {
          id: s.id,
          location: s.location as [number, number],
          size: size,
          color: isOpen ? hexToRgb(s.color) : [0.4, 0.4, 0.4] as [number, number, number]
        }
      })
      
      if (globe && typeof globe.update === 'function') {
        globe.update({ phi: phi, markers: animatedMarkers })
      }
      
      animationId = requestAnimationFrame(render)
    }
    render()
    
    // The canvas parent becomes the cobe-created relative div (Z in source)
    setWrapper(canvasRef.current.parentElement)
    
    return () => {
      cancelAnimationFrame(animationId)
      if (globe) globe.destroy()
    }
  }, [now, summer])
  
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
      {/* Subtle blue ocean background light */}
      <div style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,100,200,0.12) 0%, rgba(20,60,140,0.04) 50%, transparent 100%)', filter: 'blur(25px)', zIndex: 0 }} />
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }}
      />
      
      {wrapper && createPortal(
        <>
          <style>{`
            ${SESSIONS.map(s => `
              .marker-label-${s.id} {
                position: absolute;
                position-anchor: --cobe-${s.id};
                bottom: anchor(top);
                left: anchor(center);
                opacity: var(--cobe-visible-${s.id}, 0);
                transform: translate(-50%, -10px);
                transition: opacity 0.3s ease;
                background: rgba(10, 10, 12, 0.85);
                border: 1px solid var(--color-gray-800);
                padding: 6px 10px;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                pointer-events: none;
                z-index: 20;
                backdrop-filter: blur(4px);
              }
              .marker-label-${s.id}.is-open {
                border-color: rgba(255, 255, 255, 0.2);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
              }
            `).join('\n')}
            @keyframes live-pulse {
              0% { transform: scale(0.95); opacity: 1; }
              50% { transform: scale(1.6); opacity: 0.5; }
              100% { transform: scale(0.95); opacity: 1; }
            }
          `}</style>
          
          {SESSIONS.map(s => {
            const isOpen = isSessionOpen(s, now)
            const h = getSessionHours(s, summer)
            return (
              <div key={s.id} className={`marker-label-${s.id} ${isOpen ? 'is-open' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                  {isOpen && <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}`, animation: 'live-pulse 2s infinite' }} />}
                  <span style={{ color: isOpen ? s.color : 'var(--color-gray-400)' }}>{SESSION_NAMES[s.id].toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-gray-500)', fontWeight: 500 }}>
                  {h.open.toString().padStart(2, '0')}:00 - {h.close.toString().padStart(2, '0')}:00 UTC
                </div>
              </div>
            )
          })}
        </>,
        wrapper
      )}
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
        position: "relative", width: "100%", aspectRatio: "2/1", 
        background: "radial-gradient(ellipse at center, #0c1a3a 0%, #060e1f 70%, #030810 100%)", borderRadius: 12, 
        border: "1px solid var(--color-gray-800)", overflow: "hidden", 
        marginBottom: 16 
      }}>
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none", zIndex: 5,
          backgroundImage: "linear-gradient(var(--color-gray-700) 1px, transparent 1px), linear-gradient(90deg, var(--color-gray-700) 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }} />
        
        {mounted && (
          <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
            <CobeGlobe now={now} summer={summer} />
          </div>
        )}
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
