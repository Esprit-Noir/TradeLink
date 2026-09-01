"use client"

import { useState, useRef, useCallback, ReactNode, useEffect } from "react"
import { GripVertical, Settings, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export interface WidgetConfig {
  id: string
  label: string
  defaultSize: "sm" | "md" | "lg" | "full"
  visible: boolean
}

interface WidgetGridProps {
  widgets: WidgetConfig[]
  onOrderChange: (order: string[]) => void
  onToggleWidget: (id: string, visible: boolean) => void
  children: ReactNode[]
}

const SIZE_CLASSES: Record<string, string> = {
  sm: "widget-sm",
  md: "widget-md",
  lg: "widget-lg",
  full: "widget-full",
}

export function WidgetGrid({ widgets, onOrderChange, onToggleWidget, children }: WidgetGridProps) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const dragOverItem = useRef<string | null>(null)
  const [order, setOrder] = useState<string[]>(() => widgets.map(w => w.id))

  useEffect(() => {
    setOrder(widgets.map(w => w.id))
  }, [widgets])

  const handleDragStart = useCallback((id: string) => {
    setDragging(id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault()
    dragOverItem.current = id
  }, [])

  const handleDrop = useCallback((id: string) => {
    if (!dragging || dragging === id) { setDragging(null); return }
    const newOrder = [...order]
    const fromIdx = newOrder.indexOf(dragging)
    const toIdx = newOrder.indexOf(id)
    newOrder.splice(fromIdx, 1)
    newOrder.splice(toIdx, 0, dragging)
    setOrder(newOrder)
    onOrderChange(newOrder)
    setDragging(null)
  }, [dragging, order, onOrderChange])

  const visibleWidgets = order.filter(id => widgets.find(w => w.id === id)?.visible)

  return (
    <div style={{ position: "relative" }}>
      {/* Settings Toggle */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          position: "absolute", top: -40, right: 0,
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8,
          background: showSettings ? "var(--color-brand-500)" : "var(--color-gray-800)",
          border: "none", color: showSettings ? "#fff" : "var(--color-gray-300)",
          fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
          transition: "all 0.2s",
          zIndex: 20,
        }}
      >
        <Settings size={14} />
        Customize
      </button>

      {/* Widget Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: 16 }}
          >
            <div style={{
              padding: "1rem", borderRadius: 12,
              background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
              display: "flex", flexWrap: "wrap", gap: 8,
            }}>
              {widgets.map(w => (
                <button
                  key={w.id}
                  onClick={() => onToggleWidget(w.id, !w.visible)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    background: w.visible ? "rgba(0,199,88,0.12)" : "var(--color-gray-800)",
                    border: `1px solid ${w.visible ? "rgba(0,199,88,0.3)" : "var(--color-gray-700)"}`,
                    color: w.visible ? "var(--color-brand-400)" : "var(--color-gray-500)",
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {w.visible ? <span style={{ fontSize: 10 }}>&#10003;</span> : <X size={10} />}
                  {w.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Grid */}
      <div className="widget-grid">
        {visibleWidgets.map(id => {
          const widget = widgets.find(w => w.id === id)
          if (!widget) return null
          const child = children[order.indexOf(id)]
          return (
            <div
              key={id}
              className={`widget-cell ${SIZE_CLASSES[widget.defaultSize]} ${dragging === id ? "dragging" : ""}`}
              draggable
              onDragStart={() => handleDragStart(id)}
              onDragOver={(e) => handleDragOver(e, id)}
              onDrop={() => handleDrop(id)}
              onDragEnd={() => setDragging(null)}
            >
              <div className="widget-drag-handle">
                <GripVertical size={12} />
              </div>
              {child}
            </div>
          )
        })}
      </div>
    </div>
  )
}
