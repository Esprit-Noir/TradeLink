"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Brain, BarChart3, Activity, Target, Shield } from "lucide-react"

export function MarketingFeatures() {
  const t = useTranslations("Marketing.Features")

  const features = [
    {
      id: "journal",
      colSpan: "lg:col-span-2",
      icon: Brain,
      tag: "AUTOMATED JOURNALING",
      title: t("aiTitle"),
      desc: t("aiDesc"),
      visual: (
        <div className="absolute -right-4 -bottom-4 w-64 md:w-80 h-auto opacity-70 group-hover:opacity-100 transition-opacity duration-500">
          <div className="bg-[#030304] border border-white/10 rounded-xl p-4 shadow-2xl rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500">
            {["EUR/USD", "NQ", "ES"].map((pair, i) => (
              <div key={pair} className="bg-[#0a0f0c] border border-white/[0.03] rounded-lg px-3 py-2.5 flex items-center gap-3 mb-2 last:mb-0">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${i === 1 ? "bg-red-500/10 text-red-400" : "bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]"}`}>
                  {i === 1 ? "SHORT" : "LONG"}
                </span>
                <span className="text-[11px] text-gray-300 flex-1">{pair}</span>
                <span className={`text-[11px] font-bold ${i === 1 ? "text-red-400" : "text-[var(--color-brand-500)]"}`}>
                  {i === 1 ? "-$120" : "+$450"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "ai",
      colSpan: "lg:col-span-1",
      icon: Target,
      tag: "AI INSIGHTS",
      title: "Find what's costing you.",
      desc: "TradeLink AI reads your trades and surfaces the leaks: time-of-day patterns, tilt cycles.",
      visual: (
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f0c] to-transparent z-10 flex items-end p-6">
          <div className="w-full bg-[#030304]/80 backdrop-blur-md border border-white/10 rounded-lg p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
            <div className="flex items-start gap-2">
              <span className="text-orange-400 text-sm mt-0.5">⚠️</span>
              <div>
                <div className="text-[11px] text-white font-medium mb-1">Tilt Detected</div>
                <div className="text-[10px] text-gray-500 leading-tight">Win rate drops 40% after -$300 losses.</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "replay",
      colSpan: "lg:col-span-1",
      icon: Activity,
      tag: "TRADE REPLAY",
      title: "Replay every trade.",
      desc: "Watch the chart exactly as it printed to spot early exits and hesitation.",
      visual: (
        <div className="absolute -right-6 top-12 w-48 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
          <svg viewBox="0 0 200 100" className="w-full">
            {[35, 48, 22, 38, 45, 30, 42, 28, 50, 33, 40, 25].map((h, i) => {
              const green = i % 3 !== 0
              return <rect key={i} x={i * 16} y={100 - h} width="12" height={h} rx="2" fill={green ? "var(--color-brand-500)" : "#ef4444"} opacity={green ? 0.7 : 0.6}/>
            })}
          </svg>
        </div>
      )
    },
    {
      id: "backtest",
      colSpan: "lg:col-span-2",
      icon: BarChart3,
      tag: "BACKTESTING",
      title: t("quantTitle"),
      desc: t("quantDesc"),
      visual: (
        <div className="absolute right-0 bottom-0 w-2/3 h-2/3">
          <svg viewBox="0 0 300 100" className="w-full h-full opacity-30 group-hover:opacity-80 transition-opacity duration-700" preserveAspectRatio="none">
            <defs>
              <linearGradient id="btGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,80 L40,75 L80,50 L120,60 L160,30 L200,40 L240,20 L300,10 L300,100 L0,100 Z" fill="url(#btGrad2)"/>
            <polyline points="0,80 40,75 80,50 120,60 160,30 200,40 240,20 300,10" fill="none" stroke="#a855f7" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
      )
    },
  ]

  return (
    <section className="py-24 relative" id="features">
      {/* Subtle background glow for the features section */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1100px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] mb-5">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("badge")}</span>
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            {t("title1")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-400)] to-[#00f2fe]">{t("title2")}</span>
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-xl mx-auto font-light leading-relaxed">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl bg-white/[0.01] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-colors ${feature.colSpan}`}
              style={{ minHeight: "320px" }}
            >
              {/* Radial hover effect simulation (CSS only via opacity) */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-20 p-8 flex flex-col h-full pointer-events-none">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-6">
                  <feature.icon size={18} className="text-[var(--color-brand-500)]" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">{feature.desc}</p>
              </div>

              {/* Visual element rendered in the background/corner */}
              {feature.visual}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
