"use client"

import { useState, useRef, useCallback, ReactNode, useEffect } from "react"
import { GripVertical, Settings, X, Maximize2, Minimize2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export interface WidgetConfig {
  id: string
  label: string
  colSpan: 1 | 2 | 3
  visible: boolean
}

interface WidgetGridProps {
  widgets: WidgetConfig[]
  onOrderChange: (order: string[]) => void
  onToggleWidget: (id: string, visible: boolean) => void
  onResize?: (id: string, colSpan: 1 | 2 | 3) => void
  children: ReactNode[]
}

const COL_SPAN_CLASS: Record<number, string> = {
  1: "wg-span-1",
  2: "wg-span-2",
  3: "wg-span-3",
}

export function WidgetGrid({ widgets, onOrderChange, onToggleWidget, onResize, children }: WidgetGridProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [order, setOrder] = useState<string[]>(() => widgets.map(w => w.id))
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const dragRef = useRef<{ id: string; startX: number; startY: number; ghost: HTMLElement | null }>({ id: "", startX: 0, startY: 0, ghost: null })

  useEffect(() => {
    setOrder(widgets.map(w => w.id))
  }, [widgets])

  const visibleWidgets = order.filter(id => widgets.find(w => w.id === id)?.visible)

  const handlePointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault()
    const el = (e.target as HTMLElement).closest(".wg-cell") as HTMLElement
    if (!el) return

    const rect = el.getBoundingClientRect()
    const ghost = el.cloneNode(true) as HTMLElement
    ghost.style.position = "fixed"
    ghost.style.left = `${rect.left}px`
    ghost.style.top = `${rect.top}px`
    ghost.style.width = `${rect.width}px`
    ghost.style.height = `${rect.height}px`
    ghost.style.zIndex = "9999"
    ghost.style.pointerEvents = "none"
    ghost.style.opacity = "0.85"
    ghost.style.transform = "scale(1.02)"
    ghost.style.boxShadow = "0 20px 60px rgba(0,0,0,0.5)"
    ghost.style.transition = "none"
    document.body.appendChild(ghost)

    dragRef.current = { id, startX: e.clientX, startY: e.clientY, ghost }
    setDragId(id)
    el.style.opacity = "0.3"

    let dropTarget: string | null = null

    const onMove = (ev: PointerEvent) => {
      if (!dragRef.current.ghost) return
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      dragRef.current.ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.02)`

      const cells = document.querySelectorAll(".wg-cell")
      let bestId: string | null = null
      let bestDist = Infinity
      cells.forEach(cell => {
        const r = cell.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy)
        const cid = cell.getAttribute("data-widget-id")
        if (cid && cid !== dragRef.current.id && dist < bestDist) {
          bestDist = dist
          bestId = cid
        }
      })
      dropTarget = bestId
      setOverId(dropTarget)
    }

    const onUp = () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      if (dragRef.current.ghost) {
        dragRef.current.ghost.remove()
        dragRef.current.ghost = null
      }
      if (dropTarget && dropTarget !== dragRef.current.id) {
        const newOrder = [...order]
        const fromIdx = newOrder.indexOf(dragRef.current.id)
        const toIdx = newOrder.indexOf(dropTarget)
        newOrder.splice(fromIdx, 1)
        newOrder.splice(toIdx, 0, dragRef.current.id)
        setOrder(newOrder)
        onOrderChange(newOrder)
      }
      setOverId(null)
      setDragId(null)
      document.querySelectorAll(".wg-cell").forEach(c => (c as HTMLElement).style.opacity = "")
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [order, onOrderChange])

  const cycleSize = useCallback((id: string) => {
    if (!onResize) return
    const w = widgets.find(w => w.id === id)
    if (!w) return
    const next = w.colSpan === 1 ? 2 : w.colSpan === 2 ? 3 : 1
    onResize(id, next)
  }, [widgets, onResize])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 14px", borderRadius: 8,
            background: showSettings ? "var(--color-brand-500)" : "var(--color-gray-800)",
            border: "none", color: showSettings ? "#000" : "var(--color-gray-300)",
            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <Settings size={14} />
          Customize
        </button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{
              padding: "0.75rem 1rem", borderRadius: 12,
              background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
              display: "flex", flexWrap: "wrap", gap: 6,
            }}>
              {widgets.map(w => (
                <button
                  key={w.id}
                  onClick={() => onToggleWidget(w.id, !w.visible)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 6,
                    background: w.visible ? "rgba(0,199,88,0.12)" : "var(--color-gray-800)",
                    border: `1px solid ${w.visible ? "rgba(0,199,88,0.3)" : "var(--color-gray-700)"}`,
                    color: w.visible ? "var(--color-brand-400)" : "var(--color-gray-500)",
                    fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {w.visible ? <span style={{ fontSize: 9 }}>&#10003;</span> : <X size={9} />}
                  {w.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="wg-grid">
        {visibleWidgets.map(id => {
          const widget = widgets.find(w => w.id === id)
          if (!widget) return null
          const child = children[order.indexOf(id)]
          const spanClass = COL_SPAN_CLASS[widget.colSpan]
          const isDragging = dragId === id
          const isOver = overId === id

          return (
            <div
              key={id}
              data-widget-id={id}
              className={`wg-cell ${spanClass} ${isDragging ? "wg-dragging" : ""} ${isOver ? "wg-over" : ""}`}
              style={{ opacity: isDragging ? 0.3 : 1 }}
            >
              <div className="wg-handle" onPointerDown={e => handlePointerDown(e, id)}>
                <GripVertical size={12} />
              </div>
              {onResize && (
                <button className="wg-resize" onClick={() => cycleSize(id)} title="Resize">
                  {widget.colSpan === 3 ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                </button>
              )}
              {child}
            </div>
          )
        })}
      </div>
    </div>
  )
}
