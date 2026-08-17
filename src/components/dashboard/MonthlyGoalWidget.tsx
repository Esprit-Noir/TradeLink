"use client"

import { GoalWidget } from "./GoalWidget"

type Props = {
  monthPnl: number
  initialGoal: number | null
  monthLabel: string
}

export function MonthlyGoalWidget({ monthPnl, initialGoal, monthLabel }: Props) {
  return (
    <GoalWidget
      label={`Monthly Objective — ${monthLabel}`}
      currentPnl={monthPnl}
      initialGoal={initialGoal}
      goalKey="monthlyGoal"
      placeholder="e.g. 2000"
      emptyMessage="Set a monthly P&L target to track your progress."
    />
  )
}
