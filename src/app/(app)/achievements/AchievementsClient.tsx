"use client"

import { useEffect, useState, useRef } from "react"
import { Trophy, CheckCircle2, Lock, Medal, Target, Flame, Star, Zap, Crown, TrendingUp, DollarSign, Rocket, Scale, Flag, Award, Banknote, Book, Library, BrainCircuit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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

const achievementIcons: Record<string, React.ReactNode> = {
  first_trade: <Target size={26} />,
  first_profit: <DollarSign size={26} />,
  trades_25: <TrendingUp size={26} />,
  trades_100: <Medal size={26} />,
  trades_500: <Trophy size={26} />,
  big_r: <Rocket size={26} />,
  profit_factor_2: <Scale size={26} />,
  streak_5: <Flame size={26} />,
  streak_10: <Zap size={26} />,
  green_week: <CheckCircle2 size={26} />,
  prop_active: <Flag size={26} />,
  prop_passed: <Award size={26} />,
  payout_requested: <Banknote size={26} />,
  journal_7: <Book size={26} />,
  journal_30: <Library size={26} />,
  discipline_perfect: <BrainCircuit size={26} />,
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(false)
  
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done) {
        setDone(true)
        const t0 = Date.now()
        const tick = () => {
          const p = Math.min((Date.now() - t0) / duration, 1)
          // easeOutCubic
          const easeOut = 1 - Math.pow(1 - p, 3)
          setCount(Math.round(easeOut * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration, done])
  
  return <span ref={ref}>{count}</span>
}

// ─── Circular Progress SVG ──────────────────────────────────────────────────
function CircularProgress({ value, total }: { value: number; total: number }) {
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const percent = total > 0 ? (value / total) * 100 : 0
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Background circle */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-[var(--color-gray-800)]" />
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {/* Animated progress circle */}
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          filter="url(#glow)"
        />
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-500)" />
            <stop offset="100%" stopColor="var(--color-brand-400)" />
          </linearGradient>
        </defs>
      </svg>
      {/* Inner content */}
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-black text-[var(--color-gray-100)] leading-none">
          <AnimatedCounter end={value} />
        </span>
        <span className="text-[10px] font-bold text-[var(--color-gray-500)] uppercase tracking-widest mt-1">/ {total}</span>
      </div>
    </div>
  )
}

// ─── Achievement Card ─────────────────────────────────────────────────────────
const cardVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
}

function AchievementCard({ ach }: { ach: Achievement }) {
  const isUnlocked = ach.unlocked
  const progressPct = ach.target > 0 ? Math.min(100, Math.round((ach.progress / ach.target) * 100)) : (isUnlocked ? 100 : 0)

  return (
    <motion.div
      variants={cardVariants}
      whileHover={isUnlocked ? { y: -4, scale: 1.01 } : {}}
      className={`relative overflow-hidden flex flex-col p-5 rounded-2xl border transition-colors duration-300 ${
        isUnlocked 
          ? "bg-[var(--color-gray-900)]/80 backdrop-blur-xl border-[var(--color-brand-500)]/30 shadow-[0_8px_30px_rgba(0,199,88,0.05)] hover:border-[var(--color-brand-500)]/60 hover:shadow-[0_8px_40px_rgba(0,199,88,0.15)]" 
          : "bg-[var(--color-gray-900)]/50 backdrop-blur-md border-[var(--color-gray-800)] grayscale-[0.5] opacity-60"
      }`}
    >
      {/* Glow background for unlocked */}
      {isUnlocked && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--color-brand-500)]/15 to-transparent rounded-bl-full opacity-60 pointer-events-none" />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`flex items-center justify-center shrink-0 transition-all duration-500 ${
          isUnlocked 
            ? "w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)]/20 to-[var(--color-brand-500)]/5 border border-[var(--color-brand-500)]/40 shadow-[inset_0_0_20px_rgba(0,199,88,0.1),0_0_15px_rgba(0,199,88,0.2)] text-3xl" 
            : "w-12 h-12 rounded-xl bg-[var(--color-gray-800)]/50 border border-[var(--color-gray-700)] text-2xl grayscale"
        }`}>
          {isUnlocked ? (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="text-[var(--color-brand-500)] drop-shadow-[0_0_8px_rgba(0,199,88,0.8)]">
              {achievementIcons[ach.code] || <Trophy size={26} />}
            </motion.span>
          ) : (
            <span className="opacity-50 text-[var(--color-gray-500)]">
              {achievementIcons[ach.code] || <Trophy size={26} />}
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-black tracking-tight truncate ${isUnlocked ? "text-[var(--color-gray-100)]" : "text-[var(--color-gray-400)]"}`}>
              {ach.name}
            </h3>
            {isUnlocked ? (
              <CheckCircle2 size={16} className="text-[var(--color-brand-500)] shrink-0 drop-shadow-[0_0_8px_rgba(0,199,88,0.8)]" />
            ) : (
              <Lock size={14} className="text-[var(--color-gray-500)] shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-[var(--color-gray-400)] mt-1.5 leading-relaxed font-medium">
            {ach.description}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {ach.target > 1 && (
        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-gray-500)]">Progress</span>
            <span className="text-[10px] font-black text-[var(--color-gray-300)] tabular-nums">
              {Math.min(ach.progress, ach.target)} / {ach.target}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--color-gray-800)] rounded-full overflow-hidden border border-[var(--color-gray-700)]">
            <motion.div 
              className={`h-full rounded-full ${isUnlocked ? 'bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-400)] shadow-[0_0_10px_rgba(0,199,88,0.5)]' : 'bg-[var(--color-gray-600)]'}`}
              initial={{ width: 0 }}
              whileInView={{ width: `${progressPct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        </div>
      )}
      
      {isUnlocked && ach.unlockedAt && (
        <div className="mt-4 text-[9px] text-[var(--color-gray-500)] font-bold uppercase tracking-[0.2em] relative z-10">
          Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </motion.div>
  )
}

// ─── Leaderboard Section ────────────────────────────────────────────────────────
type LeaderboardUser = {
  id: string
  name: string
  level: number
  trophies: number
  isCurrentUser: boolean
  rank: number | string
}

function LeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(data => {
        setLeaderboard(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="mt-16 mb-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/20 flex items-center justify-center border border-yellow-500/30">
            <Crown className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--color-gray-100)] tracking-tight">Global Leaderboard</h2>
            <p className="text-sm font-medium text-[var(--color-gray-400)]">Rank against the best traders on TradeLink</p>
          </div>
        </div>
      </div>
      
      <div className="bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-brand-500)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-gray-800)] text-xs font-bold text-[var(--color-gray-500)] uppercase tracking-wider bg-[var(--color-gray-900)]/50">
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Trader</th>
                  <th className="p-4 text-center w-32">Level</th>
                  <th className="p-4 text-right pr-6 w-40">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.05 }}
                    className={`border-b border-[var(--color-gray-800)] last:border-0 transition-colors ${
                      user.isCurrentUser ? "bg-[var(--color-brand-500)]/10" : "hover:bg-[var(--color-gray-800)]/30"
                    }`}
                  >
                    <td className="p-4 text-center font-bold">
                      <div className="flex justify-center">
                        {user.rank === 1 ? <Crown size={22} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" /> :
                         user.rank === 2 ? <Crown size={22} className="text-gray-300 drop-shadow-[0_0_8px_rgba(209,213,219,0.8)]" /> :
                         user.rank === 3 ? <Crown size={22} className="text-amber-700 drop-shadow-[0_0_8px_rgba(180,83,9,0.8)]" /> :
                         <span className="text-[var(--color-gray-400)] text-lg">{user.rank === 999 ? "50+" : user.rank}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          user.isCurrentUser ? "bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] text-white shadow-[0_0_10px_rgba(0,199,88,0.4)]" : "bg-[var(--color-gray-800)] text-[var(--color-gray-300)] border border-[var(--color-gray-700)]"
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`font-bold truncate max-w-[150px] md:max-w-none ${user.isCurrentUser ? "text-[var(--color-brand-500)]" : "text-[var(--color-gray-100)]"}`}>
                          {user.name}
                          {user.isCurrentUser && <span className="ml-2 text-[10px] bg-[var(--color-brand-500)]/20 text-[var(--color-brand-500)] px-2 py-0.5 rounded-full border border-[var(--color-brand-500)]/30 hidden md:inline-block">YOU</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <Star size={14} className="text-amber-500 hidden md:block" />
                        <span className="font-bold text-[var(--color-gray-300)] tabular-nums">{user.level}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        <span className="font-black text-[var(--color-gray-100)] tabular-nums">{user.trophies}</span>
                        <Trophy size={16} className="text-yellow-500 opacity-90 drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]" />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


// ─── Main Component ───────────────────────────────────────────────────────────
export function AchievementsClient() {
  const [data, setData] = useState<AchievementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("All")

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await fetch("/api/achievements")
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json)
        
        if (json.newlyUnlocked && json.newlyUnlocked.length > 0) {
          json.newlyUnlocked.forEach((code: string) => {
            for (const group of json.groups) {
              const ach = group.achievements.find((a: any) => a.code === code)
              if (ach) {
                toast.success(`Achievement Unlocked: ${ach.name}! 🏆`, {
                  description: ach.description,
                  duration: 5000,
                  icon: ach.icon
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
      <div className="p-8 mx-auto flex flex-col gap-8">
        <div className="h-48 rounded-3xl bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] animate-pulse" />
        <div className="flex gap-3"><div className="h-10 w-24 bg-[var(--color-gray-800)] rounded-full animate-pulse" /><div className="h-10 w-32 bg-[var(--color-gray-800)] rounded-full animate-pulse" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 rounded-2xl bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <div className="p-8 text-center text-[var(--color-loss)] font-bold">Failed to load achievements.</div>
  }

  // Calculate Trader Level (1 level per 3 achievements)
  const level = Math.floor(data.unlockedCount / 3) + 1
  const levelProgress = data.unlockedCount % 3
  
  const categoryNames: Record<string, string> = {
    trading: "Trading Fundamentals",
    consistency: "Consistency",
    prop: "Prop Firm",
    journal: "Journal & Discipline",
  }

  const tabs = ["All", ...data.groups.map(g => g.category)]
  
  // Filter achievements based on active tab
  const displayedAchievements = activeTab === "All" 
    ? data.groups.flatMap(g => g.achievements)
    : data.groups.find(g => g.category === activeTab)?.achievements || []

  return (
    <div className="w-full px-4 md:px-8 pt-8 pb-20 flex flex-col gap-10">
      
      {/* ─── Gamified Hero Header ───────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-3xl p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10"
      >
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[var(--color-brand-500)]/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex items-center gap-8 relative z-10">
          <CircularProgress value={data.unlockedCount} total={data.total} />
          
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black text-[var(--color-gray-100)] tracking-tight flex items-center gap-3">
              Achievements
              <Trophy className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" size={36} />
            </h1>
            <p className="text-[var(--color-gray-400)] font-medium text-sm md:text-base max-w-md">
              Unlock milestones by maintaining consistency, following your rules, and mastering the markets.
            </p>
          </div>
        </div>

        {/* Trader Level Widget */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-[var(--color-gray-900)] border border-[var(--color-gray-800)] rounded-2xl backdrop-blur-md min-w-[200px]">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Star size={14} className="fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Trader Level</span>
            <Star size={14} className="fill-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          </div>
          <div className="text-4xl font-black text-[var(--color-gray-100)] tracking-tighter mb-3">
            Lv. {level}
          </div>
          <div className="w-full flex flex-col gap-1.5">
            <div className="flex justify-between text-[9px] font-bold text-[var(--color-gray-500)] uppercase tracking-wider">
              <span>Next Level</span>
              <span>{levelProgress} / 3</span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className="h-1.5 flex-1 rounded-full bg-[var(--color-gray-800)] border border-[var(--color-gray-700)] overflow-hidden">
                  {slot < levelProgress && (
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.5, delay: 0.5 + slot * 0.2 }}
                      className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Category Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === tab ? "text-[var(--color-gray-100)]" : "text-[var(--color-gray-400)] hover:text-[var(--color-gray-200)]"
            }`}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-[var(--color-gray-800)] border border-[var(--color-gray-700)] rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab === "All" ? "All Achievements" : categoryNames[tab] || tab}</span>
          </button>
        ))}
      </div>

      {/* ─── Achievements Grid ────────────────────────────────────────── */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {displayedAchievements.map((ach) => (
            <AchievementCard key={ach.id} ach={ach} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* ─── Leaderboard ──────────────────────────────────────────────── */}
      <LeaderboardSection />

    </div>
  )
}
