"use client"

import { useMemo } from "react"
import type { SimTrade } from "./types"

interface Props {
  positions: SimTrade[]
  closedTrades: SimTrade[]
  total: number
  currentIndex: number
  onSeek: (index: number) => void
}

interface Marker {
  id: string
  index: number
  side: "long" | "short"
  type: "entry" | "exit"
  pnl: number | null
}

export function TradesTimeline({ positions, closedTrades, total, currentIndex, onSeek }: Props) {
  const markers = useMemo<Marker[]>(() => {
    const list: Marker[] = []
    for (const t of closedTrades) {
      if (t.entryIndex != null) {
        list.push({ id: `${t.id}-e`, index: t.entryIndex, side: t.side, type: "entry", pnl: null })
      }
      if (t.exitIndex != null && t.exitPrice != null) {
        list.push({ id: `${t.id}-x`, index: t.exitIndex, side: t.side, type: "exit", pnl: t.netPnl ?? 0 })
      }
    }
    for (const p of positions) {
      if (p.entryIndex != null) {
        list.push({ id: `${p.id}-e`, index: p.entryIndex, side: p.side, type: "entry", pnl: null })
      }
    }
    return list.sort((a, b) => a.index - b.index)
  }, [positions, closedTrades])

  if (total === 0) return null

  const pct = (i: number) => Math.min(Math.max((i / Math.max(total - 1, 1)) * 100, 0), 100)

  return (
    <div className="bt-timeline">
      <span className="bt-timeline-label">Trades</span>
      <div className="bt-timeline-track">
        <div
          className="bt-timeline-cursor"
          style={{ left: `${pct(currentIndex)}%` }}
        />
        {markers.map((m) => (
          <button
            key={m.id}
            type="button"
            className="bt-timeline-marker"
            style={{ left: `${pct(m.index)}%` }}
            onClick={() => onSeek(m.index)}
            title={m.type === "entry" ? `Entrée ${m.side}` : `Sortie ${m.pnl != null && m.pnl >= 0 ? "+" : ""}${m.pnl?.toFixed(2)}`}
          >
            <span
              className={`bt-timeline-dot ${
                m.type === "entry"
                  ? m.side === "long"
                    ? "buy"
                    : "sell"
                  : (m.pnl ?? 0) >= 0
                    ? "win"
                    : "lose"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
