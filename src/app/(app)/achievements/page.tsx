import { Metadata } from "next"
import { AchievementsClient } from "./AchievementsClient"

export const metadata: Metadata = {
  title: "Achievements | TradeLink",
  description: "Track your trading achievements and milestones",
}

export default function AchievementsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">🏆 Achievements</h1>
          <p className="page-subtitle">Track your progress, build consistency, and unlock trading milestones.</p>
        </div>
      </div>
      
      <AchievementsClient />
    </div>
  )
}
