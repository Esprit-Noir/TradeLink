"use client"

import { useTranslations } from "next-intl"
import { motion, Variants } from "framer-motion"
import { Brain, BarChart3, Target, AlertTriangle, Eye, FileText, Activity, Shield, Zap, Sparkles } from "lucide-react"
import { useState, useEffect, useRef } from "react"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 40, damping: 15 }
  }
}

// Mini SVG chart component — animated profit curve
function MiniProfitChart({ color = "#00c758", height = 60 }: { color?: string; height?: number }) {
  const [animated, setAnimated] = useState(false)
  const ref = useRef<SVGSVGElement>(null)

  const points = [
    { x: 0, y: 45 }, { x: 15, y: 38 }, { x: 25, y: 42 }, { x: 40, y: 28 },
    { x: 55, y: 35 }, { x: 65, y: 18 }, { x: 80, y: 22 }, { x: 90, y: 10 }, { x: 100, y: 8 }
  ]
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaD = pathD + ` L 100 ${height} L 0 ${height} Z`

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <svg ref={ref} viewBox={`0 0 100 ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gradient-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <clipPath id={`clip-${color.replace("#","")}`}>
          <motion.rect
            x="0" y="0" height={height}
            initial={{ width: 0 }}
            animate={{ width: animated ? 100 : 0 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          />
        </clipPath>
      </defs>
      <path
        d={areaD}
        fill={`url(#gradient-${color.replace("#","")})`}
        clipPath={`url(#clip-${color.replace("#","")})`}
      />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath={`url(#clip-${color.replace("#","")})`}
      />
    </svg>
  )
}

// Mini bar chart
function MiniBarChart({ color = "#3b82f6" }: { color?: string }) {
  const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95]
  const [animated, setAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex items-end gap-1 h-14 w-full">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-t transition-all duration-700 ease-out" style={{
          height: animated ? `${h}%` : "0%",
          background: color,
          opacity: 0.4 + (i / bars.length) * 0.6,
          transitionDelay: `${i * 60}ms`
        }} />
      ))}
    </div>
  )
}

// Animated behavior pattern detector
function BehaviorDetector() {
  const [tick, setTick] = useState(0)
  const patterns = [
    { label: "Revenge trading", score: 82, color: "#f59e0b" },
    { label: "Overtrading", score: 34, color: "#3b82f6" },
    { label: "FOMO entries", score: 67, color: "#a855f7" },
    { label: "Tilt sessions", score: 19, color: "#ef4444" },
  ]

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 3000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col gap-3 w-full">
      {patterns.map((p) => (
        <div key={p.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-400 w-28 flex-shrink-0 font-medium">{p.label}</span>
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: p.color }}
              initial={{ width: 0 }}
              animate={{ width: `${p.score + (tick % 2 === 0 ? Math.random() * 5 - 2.5 : 0)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs font-bold w-8 text-right" style={{ color: p.color }}>{p.score}%</span>
        </div>
      ))}
    </div>
  )
}

export function MarketingFeatures() {
  const t = useTranslations("Marketing.Features")
  return (
    <section className="py-32 bg-[#050505] relative overflow-hidden" id="features">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[var(--color-brand-500)]/10 blur-[150px] pointer-events-none rounded-[100%]" />
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <Zap size={12} className="text-[var(--color-brand-500)]" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t("badge")}</span>
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tighter">
            {t("title1")} <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,199,88,0.3)]">{t("title2")}</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Du coaching comportemental par IA à la gestion des risques en temps réel — TradeLink donne
            aux traders financés les outils pour réussir les challenges et préserver leurs comptes.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(280px,auto)] gap-6"
        >
          {/* AI Behavioral Coaching - Large */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 md:row-span-2 relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-[var(--color-brand-500)]/50 transition-all duration-500 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_40px_rgba(0,199,88,0.15)]">
             <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute -top-[60%] -right-[40%] w-[400px] h-[400px] rounded-full bg-[var(--color-brand-500)] blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
             
             <div className="relative p-10 h-full flex flex-col">
               <div className="flex items-start justify-between mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)]/20 to-[var(--color-brand-500)]/5 border border-[var(--color-brand-500)]/30 text-[var(--color-brand-500)] flex items-center justify-center shadow-inner shadow-[var(--color-brand-500)]/20">
                   <Brain size={28} />
                 </div>
                 {/* AI Badge */}
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 rounded-full text-[10px] font-bold text-[var(--color-brand-500)] uppercase tracking-widest">
                   <Sparkles size={10} className="animate-pulse" /> IA
                 </span>
               </div>
               <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{t("aiTitle")}</h3>
               <p className="text-gray-400 leading-relaxed mb-6 max-w-lg font-medium text-lg">{t("aiDesc")}</p>
               
               {/* Live Behavior Detector */}
               <div className="bg-black/30 rounded-2xl border border-white/5 p-4 mb-6">
                 <div className="flex items-center justify-between mb-4">
                   <span className="text-xs font-bold text-white uppercase tracking-widest">Analyse comportementale</span>
                   <span className="flex items-center gap-1.5 text-[10px] text-[var(--color-brand-500)] font-bold">
                     <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" /> LIVE
                   </span>
                 </div>
                 <BehaviorDetector />
               </div>
               
               <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><AlertTriangle size={18} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> {t("aiF1")}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><Eye size={18} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {t("aiF2")}</div>
                 <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><FileText size={18} className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" /> {t("aiF3")}</div>
               </div>
             </div>
          </motion.div>

          {/* Deep Analytics - Medium */}
          <motion.div variants={itemVariants} className="col-span-1 md:row-span-2 relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] flex flex-col">
             <div className="absolute inset-0 bg-gradient-to-bl from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute -top-[60%] -right-[40%] w-[400px] h-[400px] rounded-full bg-blue-500 blur-[120px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
             
             <div className="relative p-10 flex flex-col flex-1">
               <div className="flex items-start justify-between mb-8">
                 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner shadow-blue-500/20">
                   <BarChart3 size={28} />
                 </div>
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                   Quant
                 </span>
               </div>
               <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{t("quantTitle")}</h3>
               <p className="text-gray-400 leading-relaxed mb-6 font-medium text-sm">{t("quantDesc")}</p>
               
               {/* Mini Stats */}
               <div className="grid grid-cols-2 gap-3 mb-6">
                 {[
                   { label: "Win Rate", value: "67.3%", delta: "+4.2%", up: true },
                   { label: "Profit Factor", value: "2.41", delta: "+0.3", up: true },
                   { label: "Max DD", value: "3.8%", delta: "-1.2%", up: true },
                   { label: "Avg R/R", value: "1:2.8", delta: "+0.4", up: true },
                 ].map(stat => (
                   <div key={stat.label} className="bg-black/30 rounded-xl p-3 border border-white/5">
                     <div className="text-[10px] text-gray-500 font-medium mb-1">{stat.label}</div>
                     <div className="text-lg font-black text-white tracking-tight">{stat.value}</div>
                     <div className="text-[10px] font-bold text-[var(--color-brand-500)]">{stat.delta}</div>
                   </div>
                 ))}
               </div>
               
               {/* Mini bar chart */}
               <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                 <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">P&L / Jour (30j)</div>
                 <MiniBarChart color="#3b82f6" />
               </div>
             </div>
          </motion.div>

          {/* Accounts & Prop Firms - Wide */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-3 relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]">
             <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <div className="absolute -bottom-[60%] -left-[20%] w-[500px] h-[500px] rounded-full bg-emerald-500 blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
             
             <div className="relative p-10 flex flex-col md:flex-row gap-12 items-center h-full">
               <div className="flex-1 z-20">
                 <div className="flex items-start justify-between mb-8">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner shadow-emerald-500/20">
                     <Target size={28} />
                   </div>
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                     Prop Firms
                   </span>
                 </div>
                 <h3 className="text-3xl font-extrabold text-white mb-4 tracking-tight">{t("propTitle")}</h3>
                 <p className="text-gray-400 leading-relaxed mb-8 font-medium text-lg">{t("propDesc")}</p>
                 <div className="flex flex-col gap-4">
                   <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><Activity size={18} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> {t("propF1")}</div>
                   <div className="flex items-center gap-3 text-sm text-gray-300 font-medium"><Shield size={18} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" /> {t("propF2")}</div>
                 </div>
               </div>
               
               {/* Equity chart preview */}
               <div className="w-full md:w-[55%] rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl bg-black/60 p-6">
                 <div className="flex items-center justify-between mb-4">
                   <div>
                     <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Compte FTMO — Equity</div>
                     <div className="text-2xl font-black text-white tracking-tight">$112,450 <span className="text-sm font-medium text-[var(--color-brand-500)]">+12.4%</span></div>
                   </div>
                   <div className="text-right">
                     <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Drawdown</div>
                     <div className="text-lg font-bold text-emerald-400">2.1% / 10%</div>
                   </div>
                 </div>
                 <div className="h-20">
                   <MiniProfitChart color="#00c758" height={60} />
                 </div>
                 {/* Progress bars */}
                 <div className="mt-4 space-y-2">
                   {[
                     { label: "Profit Target", current: 12.4, target: 10, exceeded: true, color: "#00c758" },
                     { label: "Daily Loss", current: 0.8, target: 5, exceeded: false, color: "#3b82f6" },
                     { label: "Max Drawdown", current: 2.1, target: 10, exceeded: false, color: "#a855f7" },
                   ].map(item => (
                     <div key={item.label} className="flex items-center gap-3">
                       <span className="text-[10px] text-gray-500 w-24 flex-shrink-0">{item.label}</span>
                       <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                         <div
                           className="h-full rounded-full transition-all"
                           style={{
                             width: `${Math.min((item.current / item.target) * 100, 100)}%`,
                             background: item.color
                           }}
                         />
                       </div>
                       <span className="text-[10px] font-bold" style={{ color: item.color }}>{item.current}%</span>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
