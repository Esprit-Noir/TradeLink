"use client"

import { GoalWidget } from "./GoalWidget"

type Props = {
  todayPnl: number
  initialGoal: number | null
}

export function DailyGoalWidget({ todayPnl, initialGoal }: Props) {
  return (
    <GoalWidget
      label="Daily Objective"
      currentPnl={todayPnl}
      initialGoal={initialGoal}
      goalKey="dailyGoal"
      placeholder="e.g. 200"
      emptyMessage="Set a daily P&L target to track your progress in real-time."
    />
  )
}
