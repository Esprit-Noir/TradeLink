"use client"

import dynamic from "next/dynamic"

export const EquityCurveChart = dynamic(
  () => import("@/components/dashboard/EquityCurveChart").then(m => ({ default: m.EquityCurveChart })),
  { ssr: false }
)

export const SetupBarChart = dynamic(
  () => import("@/components/dashboard/SetupBarChart").then(m => ({ default: m.SetupBarChart })),
  { ssr: false }
)

export const HourHeatmap = dynamic(
  () => import("@/components/dashboard/HourHeatmap").then(m => ({ default: m.HourHeatmap })),
  { ssr: false }
)

export const DailyPnlChart = dynamic(
  () => import("@/components/dashboard/DailyPnlChart").then(m => ({ default: m.DailyPnlChart })),
  { ssr: false }
)

export const WinRateDonut = dynamic(
  () => import("@/components/dashboard/WinRateDonut").then(m => ({ default: m.WinRateDonut })),
  { ssr: false }
)
