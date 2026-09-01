"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GitCompare, ArrowLeft } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"

interface CompareData {
  period: string
  totalTrades: number
  winRate: number
  netPnl: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  expectancy: number
  maxDrawdown: number
}

interface CompareModeProps {
  dataA: CompareData
  dataB: CompareData
  onPeriodAChange: (period: string) => void
  onPeriodBChange: (period: string) => void
  onExit: () => void
}

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "1y", label: "Last 12 months" },
  { value: "all", label: "All time" },
]

function CompareKpi({ label, valueA, valueB, format = "number" }: {
  label: string; valueA: number; valueB: number; format?: "number" | "currency" | "percent"
}) {
  const formatValue = (v: number) => {
    if (format === "currency") return formatCurrency(v, "USD", true)
    if (format === "percent") return `${v.toFixed(1)}%`
    return v.toFixed(2)
  }

  const diff = valueB - valueA
  const diffPct = valueA !== 0 ? ((diff / Math.abs(valueA)) * 100) : 0
  const isPositive = diff > 0
  const isZero = Math.abs(diff) < 0.01

  return (
    <div style={{
      padding: "0.75rem 1rem", borderRadius: 10,
      background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)",
    }}>
      <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-200)", fontVariantNumeric: "tabular-nums" }}>
          {formatValue(valueA)}
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>vs</span>
        <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-200)", fontVariantNumeric: "tabular-nums" }}>
          {formatValue(valueB)}
        </span>
      </div>
      {!isZero && (
        <div style={{ marginTop: 6, fontSize: "0.72rem", fontWeight: 600, color: isPositive ? "var(--color-profit)" : "var(--color-loss)" }}>
          {isPositive ? "+" : ""}{diffPct.toFixed(1)}%
        </div>
      )}
    </div>
  )
}

export function CompareMode({ dataA, dataB, onPeriodAChange, onPeriodBChange, onExit }: CompareModeProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onExit}
            className="topbar-btn"
            style={{ width: 32, height: 32 }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GitCompare size={18} style={{ color: "var(--color-brand-500)" }} />
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)" }}>Compare Periods</h2>
          </div>
        </div>
      </div>

      {/* Period Selectors */}
      <div className="compare-container">
        <div className="compare-divider" />

        {/* Period A */}
        <div className="compare-panel">
          <div className="compare-header">
            <span className="compare-label">Period A</span>
            <select
              className="compare-select"
              value={dataA.period}
              onChange={(e) => onPeriodAChange(e.target.value)}
            >
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <CompareKpi label="Total Trades" valueA={dataA.totalTrades} valueB={dataB.totalTrades} format="number" />
          <CompareKpi label="Win Rate" valueA={dataA.winRate} valueB={dataB.winRate} format="percent" />
          <CompareKpi label="Net P&L" valueA={dataA.netPnl} valueB={dataB.netPnl} format="currency" />
          <CompareKpi label="Profit Factor" valueA={dataA.profitFactor} valueB={dataB.profitFactor} format="number" />
          <CompareKpi label="Avg Win" valueA={dataA.avgWin} valueB={dataB.avgWin} format="currency" />
          <CompareKpi label="Avg Loss" valueA={dataA.avgLoss} valueB={dataB.avgLoss} format="currency" />
          <CompareKpi label="Expectancy" valueA={dataA.expectancy} valueB={dataB.expectancy} format="currency" />
          <CompareKpi label="Max Drawdown" valueA={dataA.maxDrawdown} valueB={dataB.maxDrawdown} format="currency" />
        </div>

        {/* Period B */}
        <div className="compare-panel">
          <div className="compare-header">
            <span className="compare-label">Period B</span>
            <select
              className="compare-select"
              value={dataB.period}
              onChange={(e) => onPeriodBChange(e.target.value)}
            >
              {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <CompareKpi label="Total Trades" valueA={dataB.totalTrades} valueB={dataA.totalTrades} format="number" />
          <CompareKpi label="Win Rate" valueA={dataB.winRate} valueB={dataA.winRate} format="percent" />
          <CompareKpi label="Net P&L" valueA={dataB.netPnl} valueB={dataA.netPnl} format="currency" />
          <CompareKpi label="Profit Factor" valueA={dataB.profitFactor} valueB={dataA.profitFactor} format="number" />
          <CompareKpi label="Avg Win" valueA={dataB.avgWin} valueB={dataA.avgWin} format="currency" />
          <CompareKpi label="Avg Loss" valueA={dataB.avgLoss} valueB={dataA.avgLoss} format="currency" />
          <CompareKpi label="Expectancy" valueA={dataB.expectancy} valueB={dataA.expectancy} format="currency" />
          <CompareKpi label="Max Drawdown" valueA={dataB.maxDrawdown} valueB={dataA.maxDrawdown} format="currency" />
        </div>
      </div>
    </motion.div>
  )
}
