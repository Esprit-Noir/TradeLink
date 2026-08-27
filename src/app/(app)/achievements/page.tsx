import { Metadata } from "next"
import { AchievementsClient } from "./AchievementsClient"

export const metadata: Metadata = {
  title: "Achievements | TradeLink",
  description: "Track your trading achievements and milestones",
}

export default function AchievementsPage() {
  return (
    <div className="w-full h-full min-h-screen pb-20">
      <AchievementsClient />
    </div>
  )
}
