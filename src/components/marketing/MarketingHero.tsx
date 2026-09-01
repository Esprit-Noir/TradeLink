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
    <section className="bg-[#050505]">
      <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)]" />
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("badge")}</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.1] mb-5"
        >
          {t("title1")}<br />
          <span className="text-[var(--color-brand-500)]">{t("title2")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-base text-gray-400 max-w-[480px] mx-auto mb-8 leading-relaxed"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
        >
          {isLoggedIn ? (
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-500)] text-black font-semibold text-sm rounded-lg hover:bg-[var(--color-brand-400)] transition-colors">
              {t("dashboard")} <LayoutDashboard size={14} />
            </Link>
          ) : (
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-500)] text-black font-semibold text-sm rounded-lg hover:bg-[var(--color-brand-400)] transition-colors">
              {t("startFree")} <ArrowRight size={14} />
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="max-w-4xl mx-auto"
        >
          <div className="rounded-xl overflow-hidden border border-white/[0.04] shadow-[0_0_80px_rgba(0,199,88,0.08)]">
            <div className="w-full bg-[#060806] p-2 sm:p-4">
              <div className="rounded-lg overflow-hidden border border-white/[0.03]">
                {/* Top bar */}
                <div className="bg-[#0a0c0a] px-4 py-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
                  <div className="flex-1 flex justify-center">
                    <span className="text-[10px] text-gray-600 font-mono bg-[#0e100e] rounded px-3 py-0.5 border border-white/[0.03]">app.tradelink.io/dashboard</span>
                  </div>
                </div>
                <div className="flex bg-[#080a08]">
                  {/* Sidebar */}
                  <div className="w-[14%] bg-[#060806] p-3 space-y-2.5 hidden sm:block border-r border-white/[0.03]">
                    <div className="h-2 bg-[#121512] rounded w-3/4"></div>
                    <div className="h-2 bg-[#121512] rounded w-2/3"></div>
                    <div className="h-2 bg-[#00c758]/25 rounded w-4/5"></div>
                    <div className="h-2 bg-[#121512] rounded w-3/5"></div>
                    <div className="h-2 bg-[#121512] rounded w-2/3"></div>
                    <div className="h-2 bg-[#121512] rounded w-1/2 mt-4"></div>
                    <div className="h-2 bg-[#121512] rounded w-2/3"></div>
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-3 sm:p-4 space-y-3">
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Net P&L", value: "+$10,970", color: "text-[#00c758]", sub: "110 trades" },
                        { label: "Win Rate", value: "62.7%", color: "text-[#3b82f6]", sub: "69W / 41L" },
                        { label: "Profit Factor", value: "2.34", color: "text-[#a855f7]", sub: "$18.5K gross" },
                        { label: "Max DD", value: "0.9%", color: "text-[#f59e0b]", sub: "$890 / 4%" },
                      ].map((kpi) => (
                        <div key={kpi.label} className="bg-[#0a0c0a] border border-white/[0.04] rounded-lg p-3">
                          <div className="text-[9px] text-gray-600 mb-1">{kpi.label}</div>
                          <div className={`text-sm sm:text-base font-bold ${kpi.color}`}>{kpi.value}</div>
                          <div className="text-[8px] text-gray-700 mt-0.5">{kpi.sub}</div>
                        </div>
                      ))}
                    </div>
                    {/* Chart + trades */}
                    <div className="flex gap-2">
                      <div className="flex-[2] bg-[#0a0c0a] border border-white/[0.04] rounded-lg p-3">
                        <div className="text-[9px] text-gray-600 tracking-widest mb-1">EQUITY CURVE</div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base sm:text-lg font-bold text-white">$142,800</span>
                          <span className="text-[10px] text-[#00c758]">+42.8%</span>
                        </div>
                        <svg viewBox="0 0 400 80" className="w-full h-16 sm:h-24 mt-2" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00c758" stopOpacity="0.2"/>
                              <stop offset="100%" stopColor="#00c758" stopOpacity="0"/>
                            </linearGradient>
                          </defs>
                          <path d="M0,65 L30,58 L60,60 L90,50 L120,52 L150,42 L180,44 L210,35 L240,37 L270,28 L300,30 L330,22 L360,24 L400,18 L400,80 L0,80 Z" fill="url(#chartGrad)"/>
                          <polyline points="0,65 30,58 60,60 90,50 120,52 150,42 180,44 210,35 240,37 270,28 300,30 330,22 360,24 400,18" fill="none" stroke="#00c758" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex-1 bg-[#0a0c0a] border border-white/[0.04] rounded-lg p-3 hidden md:block">
                        <div className="text-[9px] text-gray-600 tracking-widest mb-2">RECENT TRADES</div>
                        <div className="space-y-1.5">
                          {[
                            { side: "LONG", pair: "EUR/USD", pnl: "+$342", green: true },
                            { side: "SHORT", pair: "NQ", pnl: "-$128", green: false },
                            { side: "LONG", pair: "ES", pnl: "+$615", green: true },
                            { side: "LONG", pair: "GC", pnl: "+$892", green: true },
                          ].map((tr, i) => (
                            <div key={i} className="bg-[#060806] rounded px-2 py-1.5 flex items-center gap-2 border border-white/[0.03]">
                              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${tr.green ? "bg-[#00c758]/10 text-[#00c758]" : "bg-red-500/10 text-red-400"}`}>{tr.side}</span>
                              <span className="text-[9px] text-gray-300 flex-1">{tr.pair}</span>
                              <span className={`text-[9px] font-semibold ${tr.green ? "text-[#00c758]" : "text-red-400"}`}>{tr.pnl}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Bottom row */}
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#0a0c0a] border border-white/[0.04] rounded-lg p-3">
                        <div className="text-[9px] text-gray-600 tracking-widest mb-2">P&L HEATMAP</div>
                        <div className="grid grid-cols-6 gap-1">
                          {["bg-[#00c758]/70","bg-[#00c758]/50","bg-red-400/60","bg-[#00c758]/30","bg-[#34d399]/50","bg-[#00c758]/60",
                            "bg-[#34d399]/40","bg-[#00c758]/70","bg-[#00c758]/30","bg-red-400/40","bg-[#00c758]/60","bg-[#34d399]/40",
                            "bg-[#00c758]/50","bg-red-400/25","bg-[#00c758]/70","bg-[#34d399]/50","bg-[#6ee7b7]/30","bg-[#00c758]/60",
                          ].map((c, i) => (
                            <div key={i} className={`aspect-square rounded-sm ${c}`}></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 bg-[#0a0c0a] border border-white/[0.04] rounded-lg p-3 flex items-center gap-2 hidden sm:flex">
                        <span className="w-6 h-6 rounded bg-[#f59e0b]/10 flex items-center justify-center text-[#f59e0b] text-[10px] font-bold flex-shrink-0">!</span>
                        <span className="text-[10px] text-gray-400">AI Insight: Win rate drops 18% after 1pm — avoid afternoon trades.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
