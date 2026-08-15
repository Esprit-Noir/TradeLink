"use client"

import { useEffect } from "react"
import { Play, Pause, ChevronLeft, ChevronRight, SkipForward, Timer } from "lucide-react"
import { formatDateWithTimezone } from "@/lib/formatters"

export interface ReplayControlsProps {
  playing: boolean
  speed: number // candles per tick
  currentIndex: number
  total: number
  currentTime: number | null
  disabled: boolean
  timezone?: string
  onTogglePlay: () => void
  onStep: (dir: -1 | 1) => void
  onSpeed: (speed: number) => void
  onInstant: () => void
  onScrub: (index: number) => void
}

const SPEEDS = [0.5, 1, 2, 5, 10]

function fmtTime(time: number | null): string {
  if (time == null) return "--:--"
  const d = new Date(time * 1000)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ReplayControls({
  playing,
  speed,
  currentIndex,
  total,
  currentTime,
  disabled,
  timezone = "UTC",
  onTogglePlay,
  onStep,
  onSpeed,
  onInstant,
  onScrub,
}: ReplayControlsProps) {
  // Keyboard shortcuts: Space = play/pause, ←/→ = step, ↑/↓ = speed
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.tagName === "BUTTON" ||
        target.isContentEditable
      ) {
        return
      }
      if (disabled) return
      if (e.code === "Space") {
        e.preventDefault()
        onTogglePlay()
      } else if (e.code === "ArrowLeft") {
        e.preventDefault()
        onStep(-1)
      } else if (e.code === "ArrowRight") {
        e.preventDefault()
        onStep(1)
      } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
        e.preventDefault()
        const idx = SPEEDS.indexOf(speed)
        const next = e.code === "ArrowUp" ? Math.min(idx + 1, SPEEDS.length - 1) : Math.max(idx - 1, 0)
        onSpeed(SPEEDS[Math.max(next, 0)] ?? 1)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [disabled, playing, speed, onTogglePlay, onStep, onSpeed])

  const formattedTime = currentTime != null
    ? formatDateWithTimezone(currentTime * 1000, timezone, true)
    : "--:--"

  return (
    <div className="replay-controls" style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <div className="replay-controls-inner">
        <div className="replay-transport">
          <button
            className="replay-btn replay-btn-step"
            onClick={() => onStep(-1)}
            title="Bougie précédente (←)"
            aria-label="Previous candle"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className={`replay-btn replay-btn-play ${playing ? "playing" : ""}`}
            onClick={onTogglePlay}
            title="Lecture / pause (Espace)"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="replay-btn replay-btn-step"
            onClick={() => onStep(1)}
            title="Bougie suivante (→)"
            aria-label="Next candle"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="replay-btn replay-btn-step"
            onClick={onInstant}
            title="Dérouler jusqu'à la fin"
            aria-label="Skip to end"
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="replay-scrubber">
          <span className="replay-time">{formattedTime}</span>
          <input
            type="range"
            min={0}
            max={Math.max(total - 1, 0)}
            step={1}
            value={currentIndex}
            onChange={(e) => onScrub(Number(e.target.value))}
            className="replay-slider"
            aria-label="Timeline"
          />
          <span className="replay-count">
            {Math.min(currentIndex + 1, total)} / {total}
          </span>
        </div>

        <div className="replay-speeds">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`replay-btn replay-btn-speed ${speed === s ? "active" : ""}`}
              onClick={() => onSpeed(s)}
              title={`Vitesse ${s}x`}
            >
              {s}x
            </button>
          ))}
          <span className="replay-timer-hint">
            <Timer size={12} /> Space · ← → · ↑ ↓
          </span>
        </div>
      </div>
    </div>
  )
}
