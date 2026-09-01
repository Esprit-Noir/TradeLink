"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowRight, LayoutDashboard } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
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
          setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration, done])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

export function MarketingHero({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const t = useTranslations("Marketing.Hero")

  return (
    <section className="bg-transparent">
      <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("badge")}</span>
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.05] mb-6"
        >
          {t("title1")}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-brand-400)] to-[#00f2fe]">{t("title2")}</span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-gray-400 max-w-[560px] mx-auto mb-10 leading-relaxed font-light"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
        >
          {isLoggedIn ? (
            <Link href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-brand-500)] text-black font-bold text-sm rounded-xl hover:bg-[var(--color-brand-400)] transition-all shadow-[0_0_24px_rgba(0,199,88,0.4)] hover:shadow-[0_0_32px_rgba(0,199,88,0.6)] hover:scale-[1.02]">
              {t("dashboard")} <LayoutDashboard size={16} className="transition-transform group-hover:rotate-12" />
            </Link>
          ) : (
            <Link href="/register" className="group inline-flex items-center gap-2 px-8 py-3.5 bg-[var(--color-brand-500)] text-black font-bold text-sm rounded-xl hover:bg-[var(--color-brand-400)] transition-all shadow-[0_0_24px_rgba(0,199,88,0.4)] hover:shadow-[0_0_32px_rgba(0,199,88,0.6)] hover:scale-[1.02]">
              {t("startFree")} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </motion.div>

        {/* 3D Isometric Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-5xl mx-auto relative perspective-[2000px]"
        >
          {/* Subtle glow underneath */}
          <div className="absolute inset-0 bg-[var(--color-brand-500)]/20 blur-[100px] rounded-full transform -translate-y-10 scale-90" />
          
          <motion.div 
            animate={{ 
              rotateX: [10, 12, 10],
              rotateY: [-5, -3, -5],
              y: [0, -10, 0]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)] bg-[#050505] transform-gpu"
          >
            <div className="w-full bg-[#030304] p-3 sm:p-5">
              <div className="rounded-xl overflow-hidden border border-white/[0.04] bg-[#0a0f0c] shadow-inner">
                {/* Top bar */}
                <div className="bg-[#030304] px-5 py-3 flex items-center gap-2 border-b border-white/[0.02]">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]"></span>
                  <span className="w-3 h-3 rounded-full bg-[#28c840]"></span>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[11px] text-gray-500 font-mono bg-white/[0.02] rounded-md px-4 py-1 border border-white/[0.04]">app.tradelink.io/dashboard</span>
                  </div>
                </div>
                <div className="flex bg-[#030304]">
                  {/* Sidebar */}
                  <div className="w-[15%] bg-[#030304] p-4 space-y-3 hidden sm:block border-r border-white/[0.02]">
                    <div className="h-2.5 bg-white/[0.03] rounded w-3/4 mb-6"></div>
                    <div className="h-2 bg-white/[0.05] rounded w-2/3"></div>
                    <div className="h-2 bg-[var(--color-brand-500)]/30 rounded w-4/5"></div>
                    <div className="h-2 bg-white/[0.05] rounded w-3/5"></div>
                    <div className="h-2 bg-white/[0.05] rounded w-2/3"></div>
                    <div className="h-2 bg-white/[0.05] rounded w-1/2 mt-6"></div>
                    <div className="h-2 bg-white/[0.05] rounded w-2/3"></div>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-4 sm:p-6 space-y-4 bg-[#0a0f0c] rounded-tl-2xl border-t border-l border-white/[0.03]">
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Net P&L", value: "+$10,970", color: "text-[var(--color-brand-500)]", sub: "110 trades" },
                        { label: "Win Rate", value: "62.7%", color: "text-[#00f2fe]", sub: "69W / 41L" },
                        { label: "Profit Factor", value: "2.34", color: "text-white", sub: "$18.5K gross" },
                        { label: "Max DD", value: "0.9%", color: "text-red-400", sub: "$890 / 4%" },
                      ].map((kpi) => (
                        <div key={kpi.label} className="bg-[#030304] border border-white/[0.04] rounded-xl p-4 shadow-sm hover:border-white/10 transition-colors">
                          <div className="text-[10px] text-gray-500 tracking-wider font-medium mb-1.5">{kpi.label}</div>
                          <div className={`text-lg sm:text-xl font-extrabold tracking-tight ${kpi.color}`}>{kpi.value}</div>
                          <div className="text-[9px] text-gray-600 mt-1">{kpi.sub}</div>
                        </div>
                      ))}
                    </div>
                    {/* Chart + trades */}
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-[2] bg-[#030304] border border-white/[0.04] rounded-xl p-5 relative overflow-hidden">
                        {/* Soft glow in chart background */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-brand-500)]/10 blur-[50px] rounded-full pointer-events-none" />
                        
                        <div className="text-[10px] text-gray-500 tracking-widest font-medium mb-1">EQUITY CURVE</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-extrabold text-white">$142,800</span>
                          <span className="text-xs font-semibold text-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 px-2 py-0.5 rounded-full">+42.8%</span>
                        </div>
                        <svg viewBox="0 0 400 80" className="w-full h-24 sm:h-32 mt-4" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.25"/>
                              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M0,65 L30,58 L60,60 L90,50 L120,52 L150,42 L180,44 L210,35 L240,37 L270,28 L300,30 L330,22 L360,24 L400,18 L400,80 L0,80 Z" fill="url(#chartGrad)"/>
                          <polyline points="0,65 30,58 60,60 90,50 120,52 150,42 180,44 210,35 240,37 270,28 300,30 330,22 360,24 400,18" fill="none" stroke="var(--color-brand-500)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="flex-1 bg-[#030304] border border-white/[0.04] rounded-xl p-5 hidden md:block">
                        <div className="text-[10px] text-gray-500 tracking-widest font-medium mb-3">RECENT TRADES</div>
                        <div className="space-y-2">
                          {[
                            { side: "LONG", pair: "EUR/USD", pnl: "+$342", green: true },
                            { side: "SHORT", pair: "NQ", pnl: "-$128", green: false },
                            { side: "LONG", pair: "ES", pnl: "+$615", green: true },
                            { side: "LONG", pair: "GC", pnl: "+$892", green: true },
                          ].map((tr, i) => (
                            <div key={i} className="bg-[#0a0f0c] rounded-md px-3 py-2 flex items-center gap-3 border border-white/[0.02]">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${tr.green ? "bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]" : "bg-red-500/10 text-red-400"}`}>{tr.side}</span>
                              <span className="text-[10px] text-gray-300 font-medium flex-1">{tr.pair}</span>
                              <span className={`text-[11px] font-bold ${tr.green ? "text-[var(--color-brand-500)]" : "text-red-400"}`}>{tr.pnl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {[
            { value: 20.2, suffix: "B", label: "Trades journaled" },
            { value: 100, suffix: "K+", label: "Traders" },
            { value: 500, suffix: "+", label: "Brokers" },
            { value: 4.8, suffix: " ★★★★★", label: "Trustpilot" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-lg font-bold text-white"><Counter end={s.value} suffix={s.suffix} /></div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
