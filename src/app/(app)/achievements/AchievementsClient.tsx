"use client"

import { useEffect, useState } from "react"
import { Trophy, CheckCircle2, Lock, Medal } from "lucide-react"
import { toast } from "sonner"

type Achievement = {
  id: string
  code: string
  name: string
  description: string
  icon: string
  target: number
  unlocked: boolean
  unlockedAt: string | null
  earned: boolean
  progress: number
}

type AchievementGroup = {
  category: string
  achievements: Achievement[]
}

type AchievementsData = {
  total: number
  unlockedCount: number
  newlyUnlocked: string[]
  groups: AchievementGroup[]
}

export function AchievementsClient() {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch("/api/achievements")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json)
        
        if (json.newlyUnlocked && json.newlyUnlocked.length > 0) {
          json.newlyUnlocked.forEach((code: string) => {
            // Find the achievement to get its name
            for (const group of json.groups) {
              const ach = group.achievements.find((a: any) => a.code === code)
              if (ach) {
                toast.success(`Achievement Unlocked: ${ach.name}! 🏆`, {
                  description: ach.description,
                  duration: 5000,
                })
              }
            }
          })
        }
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-[var(--color-gray-900)] rounded-[var(--radius-card)] border border-[var(--color-gray-800)] text-[var(--color-gray-400)]">
        Failed to load achievements.
      </div>
    )
  }

  const categoryNames: Record<string, string> = {
    trading: "Trading Fundamentals",
    consistency: "Consistency",
    prop: "Prop Firm",
    journal: "Journal & Discipline",
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ─── Overview Stats ────────────────────────────────────────────── */}
      <div className="bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-[var(--radius-card)] p-6">
        <div className="flex flex-wrap gap-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--color-brand-500)]/20 flex items-center justify-center border border-[var(--color-brand-500)]/30">
              <Trophy size={28} className="text-[var(--color-brand-400)]" />
            </div>
            <div>
              <div className="text-3xl font-bold text-[var(--color-gray-100)]">
                {data.unlockedCount} <span className="text-lg text-[var(--color-gray-500)] font-normal">/ {data.total}</span>
              </div>
              <div className="text-sm font-medium text-[var(--color-brand-400)] uppercase tracking-wider mt-1">
                Total Unlocked
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-[200px] max-w-md">
            <div className="flex justify-between text-xs text-[var(--color-gray-400)] mb-2 font-bold uppercase tracking-wider">
              <span>Overall Progress</span>
              <span>{Math.round((data.unlockedCount / data.total) * 100)}%</span>
            </div>
            <div className="h-2.5 bg-[var(--color-gray-800)] rounded-full overflow-hidden border border-[var(--color-gray-700)]">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-brand-600)] to-[var(--color-brand-400)] rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(data.unlockedCount / data.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Categories ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-10">
        {data.groups.map(group => (
          <div key={group.category}>
            <h2 className="text-xl font-bold text-[var(--color-gray-200)] mb-4 flex items-center gap-2">
              <Medal size={20} className="text-[var(--color-brand-500)]" />
              {categoryNames[group.category] || group.category}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.achievements.map(achievement => {
                const isUnlocked = achievement.unlocked
                const progressPct = achievement.target > 0 
                  ? Math.min(100, Math.round((achievement.progress / achievement.target) * 100))
                  : (isUnlocked ? 100 : 0)

                return (
                  <div 
                    key={achievement.id}
                    className={`relative overflow-hidden flex flex-col p-5 rounded-[var(--radius-card)] border transition-all duration-300 ${
                      isUnlocked 
                        ? "bg-[var(--color-gray-900)] border-[var(--color-brand-500)]/40 hover:border-[var(--color-brand-400)] hover:shadow-[0_4px_20px_rgba(139,92,246,0.1)]" 
                        : "bg-[var(--color-gray-900)]/50 border-[var(--color-gray-800)] opacity-70 grayscale-[0.6]"
                    }`}
                  >
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[var(--color-brand-500)]/20 to-transparent rounded-bl-3xl opacity-50 pointer-events-none" />
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl shrink-0 ${
                        isUnlocked 
                          ? "bg-gradient-to-br from-[var(--color-gray-800)] to-[var(--color-gray-900)] border border-[var(--color-brand-500)]/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]" 
                          : "bg-[var(--color-gray-800)] border border-[var(--color-gray-700)]"
                      }`}>
                        {achievement.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-bold truncate ${isUnlocked ? "text-[var(--color-gray-100)]" : "text-[var(--color-gray-300)]"}`}>
                            {achievement.name}
                          </h3>
                          {isUnlocked ? (
                            <CheckCircle2 size={16} className="text-[var(--color-success)] shrink-0" />
                          ) : (
                            <Lock size={14} className="text-[var(--color-gray-500)] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-gray-400)] mt-1.5 leading-relaxed">
                          {achievement.description}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar (only show if target > 1, as target=1 is just binary state) */}
                    {achievement.target > 1 && (
                      <div className="mt-5">
                        <div className="flex justify-between items-end mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-gray-500)]">Progress</span>
                          <span className="text-[10px] font-bold text-[var(--color-gray-300)]">
                            {Math.min(achievement.progress, achievement.target)} / {achievement.target}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-gray-800)] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${isUnlocked ? 'bg-[var(--color-success)]' : 'bg-[var(--color-brand-500)]'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {isUnlocked && achievement.unlockedAt && (
                      <div className="mt-4 text-[9px] text-[var(--color-gray-500)] font-medium uppercase tracking-wider">
                        Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
