"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedKpiCardProps {
  label: string
  value: string
  sub?: string
  type?: "profit" | "loss" | "neutral"
  id: string
  icon?: ReactNode
  size?: "normal" | "large"
}

export function AnimatedKpiCard({
  label, value, sub, type = "neutral", id, icon, size = "normal"
}: AnimatedKpiCardProps) {
  const color = type === "profit" ? "var(--color-profit)" : type === "loss" ? "var(--color-loss)" : "var(--color-gray-100)"

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ y: -2 }}
      className="relative overflow-hidden flex flex-col justify-center kpi-card"
      style={{
        padding: "1.25rem",
        gap: "0.35rem",
        borderRadius: "12px",
        background: "var(--color-gray-900)",
        border: "1px solid var(--color-gray-800)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--color-gray-400)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", position: "relative", zIndex: 10 }}>
        {icon && <span style={{ color }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: size === "large" ? "1.8rem" : "1.3rem", fontWeight: 800, color, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", position: "relative", zIndex: 10 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 500, position: "relative", zIndex: 10 }}>{sub}</div>}
    </motion.div>
  )
}

export function AnimatedEmptyKpiCard({ label, icon, noDataLabel = "No data yet" }: { label: string, icon?: ReactNode, noDataLabel?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden flex flex-col justify-center"
      style={{
        padding: "1.25rem",
        flex: "1 1 180px",
        gap: "0.35rem",
        borderRadius: "12px",
        background: "var(--color-gray-900)",
        border: "1px dashed var(--color-gray-700)",
        opacity: 0.7,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-gray-700)", fontVariantNumeric: "tabular-nums" }}>—</div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", fontWeight: 500 }}>{noDataLabel}</div>
    </motion.div>
  )
}
