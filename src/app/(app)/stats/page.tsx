import { Suspense } from "react"
import { AdvancedStatsClient } from "@/components/stats/AdvancedStatsClient"

export const metadata = {
  title: "Advanced Statistics",
}

export default function StatsPage() {
  return (
    <div>
      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="page-title">Advanced Statistics</h1>
          <p className="page-subtitle">Deep dive into your trading performance metrics.</p>
        </div>
      </div>

      <AdvancedStatsClient />
    </div>
  )
}
