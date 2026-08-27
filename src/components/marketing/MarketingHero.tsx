"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowRight, LayoutDashboard, TrendingUp, TrendingDown, Shield, Zap, Star, Activity, Brain, Target, AlertTriangle } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, useMotionValue, useSpring, animate } from "framer-motion"
import { MarketingBackground } from "./MarketingBackground"

// ─── Live Ticker ──────────────────────────────────────────────────────────────
const TICKER_DATA = [
  { symbol: "EUR/USD", price: "1.0847", change: "+0.12%", up: true },
  { symbol: "BTC/USD", price: "67,234", change: "+2.34%", up: true },
  { symbol: "SPY",     price: "542.18", change: "-0.08%", up: false },
  { symbol: "GBP/USD", price: "1.2634", change: "+0.21%", up: true },
  { symbol: "NQ",      price: "19,842", change: "+1.05%", up: true },
  { symbol: "GLD",     price: "241.30", change: "-0.33%", up: false },
  { symbol: "AAPL",    price: "223.45", change: "+0.57%", up: true },
  { symbol: "XAU/USD", price: "2,312",  change: "+0.44%", up: true },
  { symbol: "USD/JPY", price: "155.42", change: "-0.18%", up: false },
  { symbol: "ES",      price: "5,421",  change: "+0.71%", up: true },
]

function LiveTicker() {
  const [prices, setPrices] = useState(TICKER_DATA)
  useEffect(() => {
    const iv = setInterval(() => {
      setPrices(prev => prev.map(item => {
        const d = (Math.random() - 0.48) * 0.05
        const c = parseFloat(item.price.replace(/,/g, ""))
        const n = c * (1 + d / 100)
        return { ...item, price: n > 999 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(4).slice(0, item.price.length), change: (d > 0 ? "+" : "") + d.toFixed(2) + "%", up: d > 0 }
      }))
    }, 2200)
    return () => clearInterval(iv)
  }, [])
  return (
    <div className="w-full overflow-hidden bg-black/50 backdrop-blur-md border-b border-white/[0.06] relative">
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />
      <div className="flex w-max" style={{ animation: "hero-ticker 55s linear infinite" }}>
        {[...prices, ...prices].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5 px-6 py-2 border-r border-white/[0.05] flex-shrink-0">
            <span className="text-[11px] font-bold text-gray-500 tracking-wider">{item.symbol}</span>
            <span className="text-[11px] font-mono font-semibold text-white tabular-nums">{item.price}</span>
            <span className={`text-[10px] font-bold flex items-center gap-0.5 ${item.up ? "text-[var(--color-brand-500)]" : "text-red-400"}`}>
              {item.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes hero-ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}} />
    </div>
  )
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, prefix = "", suffix = "", duration = 2000, decimals = 0 }: { end: number; prefix?: string; suffix?: string; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done) {
        setDone(true)
        const t0 = Date.now()
        const tick = () => { const p = Math.min((Date.now() - t0) / duration, 1); setCount(parseFloat(((1 - Math.pow(1 - p, 3)) * end).toFixed(decimals))); if (p < 1) requestAnimationFrame(tick) }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [end, duration, done, decimals])
  return <span ref={ref}>{prefix}{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
const EQUITY_POINTS = [
  100000, 98500, 102000, 99800, 105000, 103400, 108200, 106500,
  111000, 109200, 114500, 112800, 118000, 116000, 121500, 119000,
  124000, 122500, 127800, 125000, 130000, 128500, 133000, 131000,
  136500, 134000, 139000, 137500, 142800, 141000,
]

const RECENT_TRADES = [
  { symbol: "EUR/USD", side: "LONG",  pnl: +342.50, rr: "2.3R", time: "09:42" },
  { symbol: "NQ",      side: "SHORT", pnl: -128.00, rr: "-0.8R", time: "10:15" },
  { symbol: "ES",      side: "LONG",  pnl: +615.00, rr: "3.1R", time: "11:03" },
  { symbol: "GBP/USD", side: "SHORT", pnl: +195.25, rr: "1.4R", time: "13:28" },
  { symbol: "BTC",     side: "LONG",  pnl: +920.00, rr: "4.2R", time: "14:55" },
]

const HEATMAP = [
  [1,2,-1,3,0,2,1],
  [0,3,2,-2,4,1,0],
  [-1,1,3,2,0,-1,3],
  [2,0,1,4,-1,2,1],
]

function EquityChart({ animated }: { animated: boolean }) {
  const min = Math.min(...EQUITY_POINTS)
  const max = Math.max(...EQUITY_POINTS)
  const W = 600, H = 120
  const pts = EQUITY_POINTS.map((v, i) => ({
    x: (i / (EQUITY_POINTS.length - 1)) * W,
    y: H - ((v - min) / (max - min)) * H * 0.85 - H * 0.075,
  }))
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = linePath + ` L ${W} ${H} L 0 ${H} Z`

  const pathRef = useRef<SVGPathElement>(null)
  const [pathLen, setPathLen] = useState(0)
  useEffect(() => { if (pathRef.current) setPathLen(pathRef.current.getTotalLength()) }, [])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 100 }}>
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00c758" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00c758" stopOpacity="0" />
        </linearGradient>
        <clipPath id="eq-clip">
          <motion.rect x="0" y="0" height={H} initial={{ width: 0 }} animate={{ width: animated ? W : 0 }} transition={{ duration: 2, ease: "easeOut", delay: 0.3 }} />
        </clipPath>
      </defs>
      <path d={areaPath} fill="url(#eq-fill)" clipPath="url(#eq-clip)" />
      <path
        ref={pathRef}
        d={linePath}
        fill="none"
        stroke="#00c758"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipPath="url(#eq-clip)"
        style={{ filter: "drop-shadow(0 0 4px rgba(0,199,88,0.6))" }}
      />
      {/* Last dot */}
      {animated && (
        <motion.circle
          cx={pts[pts.length - 1].x}
          cy={pts[pts.length - 1].y}
          r="4"
          fill="#00c758"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.3, duration: 0.3 }}
          style={{ filter: "drop-shadow(0 0 6px #00c758)" }}
        />
      )}
    </svg>
  )
}

function DashboardMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.2 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const heatColor = (v: number) => {
    if (v > 3) return "#00c758"
    if (v > 1) return "#34d399"
    if (v > 0) return "#6ee7b7"
    if (v === 0) return "#1f2937"
    return "#ef4444"
  }

  return (
    <div ref={ref} className="w-full rounded-xl overflow-hidden border border-white/10 bg-[#0c0c0c] shadow-[0_30px_80px_rgba(0,0,0,.8)]">
      {/* Browser chrome */}
      <div className="flex items-center px-5 py-3 bg-[#111]/90 border-b border-white/[0.06]">
        <div className="flex gap-2 mr-4">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"    style={{ boxShadow: "0 0 5px rgba(239,68,68,.6)"  }} />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" style={{ boxShadow: "0 0 5px rgba(234,179,8,.6)"  }} />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"  style={{ boxShadow: "0 0 5px rgba(34,197,94,.6)"  }} />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 bg-black/50 border border-white/[0.07] rounded-md px-4 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" style={{ boxShadow: "0 0 5px var(--color-brand-500)" }} />
            <span className="text-[10px] font-mono text-gray-400 tracking-wide">app.tradelink.io/dashboard</span>
          </div>
        </div>
        {/* Right: account badge */}
        <div className="flex items-center gap-2 bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 rounded-md px-3 py-1">
          <span className="text-[10px] font-bold text-[var(--color-brand-500)]">FTMO 100K</span>
          <span className="text-[10px] font-black text-[var(--color-brand-500)]">LIVE</span>
        </div>
      </div>

      {/* Dashboard body */}
      <div className="flex" style={{ minHeight: 400 }}>
        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-44 border-r border-white/[0.05] bg-[#0a0a0a] px-3 py-4 gap-0.5 flex-shrink-0">
          {[
            { icon: Activity,      label: "Overview",   active: false },
            { icon: TrendingUp,    label: "Dashboard",  active: true  },
            { icon: Target,        label: "Trades",     active: false },
            { icon: Brain,         label: "Behavioral", active: false },
            { icon: Shield,        label: "Prop Firms", active: false },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors ${active ? "bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)]" : "text-gray-600 hover:text-gray-400"}`}>
              <Icon size={13} />
              {label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Net P&L",       value: 10970, prefix: "+$", suffix: "",   decimals: 0, sub: "110 trades",   color: "#00c758", up: true  },
              { label: "Win Rate",      value: 62.7,  prefix: "",   suffix: "%",  decimals: 1, sub: "69W / 41L",    color: "#3b82f6", up: true  },
              { label: "Profit Factor", value: 2.34,  prefix: "",   suffix: "",   decimals: 2, sub: "$18.5K gross", color: "#a855f7", up: true  },
              { label: "Max DD",        value: 0.9,   prefix: "",   suffix: "%",  decimals: 1, sub: "$890 / 4%",    color: "#f59e0b", up: true  },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={visible ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1, type: "spring", stiffness: 100 }}
                className="bg-[#111]/60 border border-white/[0.06] rounded-xl p-3"
              >
                <div className="text-[10px] text-gray-500 font-medium mb-1">{kpi.label}</div>
                <div className="text-lg font-black tracking-tight" style={{ color: kpi.color }}>
                  {visible ? <AnimatedCounter end={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} decimals={kpi.decimals} duration={2000} /> : "0"}
                </div>
                <div className="text-[10px] text-gray-600 font-medium mt-0.5">{kpi.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Equity curve + recent trades */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 flex-1">
            {/* Chart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={visible ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-3 bg-[#111]/60 border border-white/[0.06] rounded-xl p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Equity Curve</div>
                  <div className="text-xl font-black text-white tracking-tight">
                    {visible ? <AnimatedCounter end={142800} prefix="$" duration={2500} /> : "$0"}
                    <span className="text-[var(--color-brand-500)] text-sm font-bold ml-2">+42.8%</span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {["1W","1M","3M"].map((p, i) => (
                    <div key={p} className={`px-2 py-1 rounded-md text-[10px] font-bold cursor-default ${i === 2 ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)] border border-[var(--color-brand-500)]/20" : "text-gray-600"}`}>{p}</div>
                  ))}
                </div>
              </div>
              <div className="flex-1 relative">
                <EquityChart animated={visible} />
              </div>
            </motion.div>

            {/* Right column: trades + heatmap */}
            <div className="md:col-span-2 flex flex-col gap-3">
              {/* Recent trades */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={visible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-[#111]/60 border border-white/[0.06] rounded-xl p-4 flex-1"
              >
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Recent Trades</div>
                <div className="flex flex-col gap-2">
                  {RECENT_TRADES.map((trade, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={visible ? { opacity: 1, x: 0, scale: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.6 + i * 0.1, type: "spring", stiffness: 120 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`text-[9px] font-black px-1.5 py-0.5 rounded ${trade.side === "LONG" ? "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-500)]" : "bg-red-500/15 text-red-400"}`}>
                          {trade.side}
                        </div>
                        <span className="text-[11px] font-bold text-gray-300">{trade.symbol}</span>
                        <span className="text-[9px] text-gray-600">{trade.time}</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-[11px] font-black ${trade.pnl > 0 ? "text-[var(--color-brand-500)]" : "text-red-400"}`}>
                          {trade.pnl > 0 ? "+" : ""}{trade.pnl.toFixed(0)}$
                        </div>
                        <div className="text-[9px] text-gray-600">{trade.rr}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* P&L Heatmap */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={visible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-[#111]/60 border border-white/[0.06] rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">P&L Heatmap</div>
                </div>
                <div className="flex gap-0.5">
                  {HEATMAP[0].map((_, col) => (
                    <div key={col} className="flex flex-col gap-0.5 flex-1">
                      {HEATMAP.map((row, r) => (
                        <motion.div
                          key={r}
                          className="rounded-sm"
                          style={{ height: 12, background: heatColor(row[col]), opacity: 0.8 }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={visible ? { opacity: 0.8, scale: 1 } : {}}
                          transition={{ duration: 0.3, delay: 0.75 + (r * 7 + col) * 0.02 }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  {["L","M","M","J","V","S","D"].map((d, i) => (
                    <span key={i} className="flex-1 text-center text-[8px] text-gray-600 font-medium">{d}</span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* AI Insight banner */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl"
          >
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-amber-400 font-semibold">IA détecte : </span>
              <span className="text-[11px] text-gray-400">Votre win rate chute de <strong className="text-white">18%</strong> après 13h00 — évitez les trades l&apos;après-midi.</span>
            </div>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md flex-shrink-0 border border-amber-500/15">NOUVEAU</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Hero ────────────────────────────────────────────────────────────────
export function MarketingHero({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const t = useTranslations("Marketing.Hero")
  const { scrollY } = useScroll()
  const mouseX  = useMotionValue(0)
  const mouseY  = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [4, -4]), { stiffness: 80, damping: 25 })
  const rotateY = useSpring(useTransform(mouseX, [-400, 400], [-4, 4]), { stiffness: 80, damping: 25 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const r = cardRef.current.getBoundingClientRect()
    mouseX.set(e.clientX - r.left - r.width / 2)
    mouseY.set(e.clientY - r.top  - r.height / 2)
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center overflow-hidden">
      <MarketingBackground />

      <div className="absolute top-[68px] left-0 right-0 z-30">
        <LiveTicker />
      </div>

      <motion.div className="relative z-10 w-full flex flex-col items-center text-center">
        <div className="h-[140px]" />

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="relative inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 overflow-hidden cursor-default group"
          style={{ background: "linear-gradient(135deg,rgba(0,199,88,.12),rgba(0,199,88,.03))", border: "1px solid rgba(0,199,88,.25)", boxShadow: "0 0 28px rgba(0,199,88,.08)" }}>
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 pointer-events-none" />
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] shadow-[0_0_10px_var(--color-brand-500)] animate-pulse" />
          <span className="relative z-10 text-[11px] font-bold text-[var(--color-brand-500)] tracking-[0.15em] uppercase">{t("badge")}</span>
        </motion.div>

        {/* Headline */}
        <div className="px-6 mb-6">
          <motion.h1 className="font-black tracking-tighter leading-[1.0] text-white" style={{ fontSize: "clamp(42px,7.5vw,92px)" }}>
            <motion.span className="block" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}>
              {t("title1")}
            </motion.span>
            <motion.span className="block bg-gradient-to-r from-[var(--color-brand-500)] via-emerald-300 to-white bg-clip-text text-transparent"
              style={{ filter: "drop-shadow(0 0 40px rgba(0,199,88,.3))" }}
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}>
              {t("title2")}
            </motion.span>
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.58 }}
          className="text-lg md:text-xl text-gray-400 max-w-[580px] leading-relaxed font-medium mb-10 px-6">
          {t("subtitle")}
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-12 px-6">
          {isLoggedIn ? (
            <Link href="/dashboard" className="group relative inline-flex items-center gap-2.5 px-8 py-4 bg-[var(--color-brand-500)] text-black font-black rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
              style={{ boxShadow: "0 0 28px rgba(0,199,88,.45),0 4px 18px rgba(0,0,0,.3)" }}>
              <span className="relative z-10 flex items-center gap-2">Aller au Dashboard <LayoutDashboard size={18} /></span>
              <div className="absolute inset-0 bg-white/20 -translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
          ) : (
            <Link href="/register" className="group relative inline-flex items-center gap-2.5 px-9 py-4 bg-[var(--color-brand-500)] text-black font-black text-[15px] rounded-2xl overflow-hidden transition-all hover:-translate-y-1"
              style={{ boxShadow: "0 0 28px rgba(0,199,88,.45),0 4px 18px rgba(0,0,0,.3)" }}>
              <span className="relative z-10 flex items-center gap-2.5">Démarrer Gratuitement <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500" />
            </Link>
          )}
          <Link href="#features" className="group inline-flex items-center gap-2.5 px-7 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold text-[15px] rounded-2xl transition-all hover:-translate-y-1 backdrop-blur-md">
            <Zap size={15} className="text-[var(--color-brand-500)] group-hover:rotate-12 transition-transform" />
            Voir les fonctionnalités
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.55, delay: 0.85 }}
          className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl mb-16 bg-white/[0.04] border border-white/8 backdrop-blur-md">
          <div className="flex -space-x-2.5">
            {[11,12,13,14].map(n => <div key={n} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-gray-800 bg-cover bg-center" style={{ backgroundImage: `url('https://i.pravatar.cc/80?img=${n}')` }} />)}
            <div className="w-8 h-8 rounded-full border-2 border-[#050505] bg-zinc-800 flex items-center justify-center text-[9px] font-black text-white">+9K</div>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={11} className="fill-yellow-400 text-yellow-400" />)}</div>
            <span className="text-xs font-bold text-white">4.9</span>
            <span className="text-xs text-gray-500 font-medium">{t("rating")}</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-[var(--color-brand-500)]" />
            <span className="text-xs text-gray-400 font-medium">No card required</span>
          </div>
        </motion.div>

        {/* ── Dashboard Mockup ── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-6xl mx-auto px-6 relative"
          style={{ perspective: "2400px" }}
        >
          {/* Glow halo */}
          <div className="absolute inset-x-4 top-1/3 h-1/2 bg-[var(--color-brand-500)]/10 blur-[90px] pointer-events-none rounded-full" />

          {/* Floating stat cards */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 1.1 }}
            className="absolute left-0 top-8 z-20 hidden lg:flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,.6)]">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-500)]/15 flex items-center justify-center border border-[var(--color-brand-500)]/25">
              <TrendingUp size={16} className="text-[var(--color-brand-500)]" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-0.5">Win Rate</div>
              <div className="text-base font-black text-white leading-none">62.7% <span className="text-[var(--color-brand-500)] text-[10px] font-bold">↑4.2%</span></div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 1.2 }}
            className="absolute right-0 top-8 z-20 hidden lg:flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#0e0e0e]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,.6)]">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center border border-purple-500/25">
              <Brain size={16} className="text-purple-400" />
            </div>
            <div>
              <div className="text-[10px] text-gray-500 font-medium mb-0.5">AI Score</div>
              <div className="text-base font-black text-white leading-none">87<span className="text-purple-400 text-[10px] font-bold">/100</span></div>
            </div>
          </motion.div>

          {/* Mouse parallax wrapper */}
          <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={() => { mouseX.set(0); mouseY.set(0) }}>
            <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
              <DashboardMockup />
            </motion.div>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-20 mb-20 mx-6 w-full max-w-3xl grid grid-cols-3 rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.02] backdrop-blur-md">
          {[
            { value: 120, suffix: "M+", label: t("tradesAnalyzed"),  color: "#ffffff" },
            { value: 98,  suffix: "%",  label: t("clientRetention"), color: "var(--color-brand-500)" },
            { value: 15,  suffix: "K+", label: t("fundedTraders"),   color: "#ffffff" },
          ].map((stat, i) => (
            <div key={i} className={`flex flex-col items-center justify-center py-7 px-4 text-center ${i < 2 ? "border-r border-white/[0.07]" : ""}`}>
              <span className="text-3xl md:text-4xl font-black tracking-tighter mb-1.5" style={{ color: stat.color }}>
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.16em] leading-snug">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Trusted logos */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
          className="w-full px-6 border-t border-white/[0.06] pt-10 pb-20">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.25em] font-bold mb-8 text-center">{t("trustedBy")}</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-40 hover:opacity-75 transition-opacity duration-500">
            <span className="text-xl font-black italic tracking-tighter text-white">FTMO</span>
            <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center -rotate-12"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div><span className="text-base font-bold text-white">Topstep</span></div>
            <span className="text-base font-extrabold uppercase tracking-widest text-white">A<span className="text-red-500">P</span>EX</span>
            <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full border-2 border-yellow-500 flex items-center justify-center font-bold text-yellow-500 text-[10px]">5</div><span className="text-base font-bold text-white">The5ers</span></div>
            <div className="flex items-center gap-2"><div className="flex space-x-0.5"><div className="w-1 h-3.5 bg-emerald-500 rounded-full" /><div className="w-1 h-5 bg-emerald-400 rounded-full" /><div className="w-1 h-2.5 bg-emerald-300 rounded-full" /></div><span className="text-base font-bold text-white">FundedNext</span></div>
            <div className="flex items-center gap-1.5"><div className="relative w-4 h-4"><div className="absolute inset-0 bg-purple-500 rounded-full opacity-50" /><div className="absolute inset-0.5 bg-purple-400 rounded-full" /></div><span className="text-base font-bold text-white lowercase">funding<span className="font-light">pips</span></span></div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2, duration: 0.6 }}
        style={{ opacity: useTransform(scrollY, [0, 160], [1, 0]) }}>
        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.3em]">Scroll</span>
        <div className="w-[22px] h-[36px] rounded-full border border-white/15 flex items-start justify-center pt-1">
          <motion.div className="w-1 h-2.5 rounded-full bg-[var(--color-brand-500)]"
            animate={{ y: [0, 10, 0], opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </motion.div>
    </section>
  )
}
