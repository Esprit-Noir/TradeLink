"use client"

import Link from "next/link"
import { ArrowRight, Play, LayoutDashboard } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, Variants } from "framer-motion"
import { MarketingBackground } from "./MarketingBackground"

function AnimatedCounter({ end, suffix = "", duration = 2000, decimals = 0 }: { end: number; suffix?: string; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const value = parseFloat((eased * end).toFixed(decimals))
            setCount(value)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated, decimals])

  return <span ref={ref}>{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

const TRUSTED_LOGOS = [
  "FTMO", "MyForexFunds", "The5ers", "Fidelcrest", "True Forex Funds", "E8 Funding", "Surge Trader", "Apex"
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 15 }
  }
}

export function MarketingHero({ isLoggedIn }: { isLoggedIn?: boolean }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-40 pb-20 overflow-hidden text-center">
      {/* Animated Aurora Background */}
      <MarketingBackground />

      <motion.div 
        className="relative z-10 max-w-[1200px] mx-auto px-6 w-full flex flex-col items-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--color-brand-500)] tracking-wide uppercase">AI-Powered Trading Analytics</span>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-white leading-[1.1]">
          Your Trades Deserve<br />
          <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">Better Than Gut Feeling</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed mb-10">
          TradeLink is the professional trading journal that analyzes every entry, exit, and
          decision you make — then tells you exactly what to fix. Built for funded traders who refuse to fail.
        </motion.p>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-14">
          {isLoggedIn ? (
            <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors">
              Go to Dashboard
              <LayoutDashboard size={18} />
            </Link>
          ) : (
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors">
              Start Free — No Card Needed
              <ArrowRight size={18} />
            </Link>
          )}
          <Link href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-transparent border border-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
            <Play size={16} className="fill-current" />
            See How It Works
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <div className="flex -space-x-2">
            <div className="w-9 h-9 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=11')" }} />
            <div className="w-9 h-9 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=12')" }} />
            <div className="w-9 h-9 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=13')" }} />
            <div className="w-9 h-9 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=14')" }} />
            <div className="w-9 h-9 rounded-full border-2 border-black bg-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-400 z-10">10K+</div>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex gap-0.5 text-yellow-400 text-sm">
              <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
            </div>
            <span className="text-xs text-gray-400">4.9/5 from 2,400+ funded traders</span>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-8 md:gap-16 mb-20">
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-white tracking-tight"><AnimatedCounter end={120} suffix="M+" /></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Trades Analyzed</span>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-800" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-white tracking-tight"><AnimatedCounter end={98} suffix="%" /></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Client Retention</span>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-800" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-white tracking-tight"><AnimatedCounter end={15} suffix="K+" /></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Funded Traders</span>
          </div>
          <div className="hidden md:block w-px h-12 bg-gray-800" />
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl font-bold text-white tracking-tight"><AnimatedCounter end={4.9} suffix="/5" decimals={1} /></span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">Avg. Rating</span>
          </div>
        </motion.div>

        {/* Flat Dashboard Visual */}
        <motion.div variants={itemVariants} className="w-full max-w-4xl mx-auto rounded-xl border border-gray-800 bg-gray-900/80 backdrop-blur-xl overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-gray-800 bg-white/5">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 text-center text-xs font-mono text-gray-500 bg-white/5 mx-8 py-1.5 rounded-md">app.tradelink.io</div>
          </div>
          
          <div className="flex min-h-[320px]">
            {/* Sidebar Mock */}
            <div className="w-16 border-r border-gray-800 p-4 flex flex-col gap-3">
              <div className="h-2 rounded-full bg-[var(--color-brand-500)]" />
              <div className="h-2 rounded-full bg-gray-800" />
              <div className="h-2 rounded-full bg-gray-800" />
              <div className="h-2 rounded-full bg-gray-800" />
            </div>
            
            {/* Main Content Mock */}
            <div className="flex-1 p-6 flex flex-col gap-6">
              {/* KPIs Mock */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-white/5 border border-gray-800 flex flex-col gap-1 text-left">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Win Rate</span>
                  <span className="text-xl font-bold text-white">68.5%</span>
                  <span className="text-xs font-semibold text-[var(--color-brand-500)]">+4.2%</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-gray-800 flex flex-col gap-1 text-left">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Profit Factor</span>
                  <span className="text-xl font-bold text-white">2.41</span>
                  <span className="text-xs font-semibold text-[var(--color-brand-500)]">+0.3</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-gray-800 flex flex-col gap-1 text-left">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Net P&L</span>
                  <span className="text-xl font-bold text-white">+$8,342</span>
                  <span className="text-xs font-semibold text-[var(--color-brand-500)]">+$450</span>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-gray-800 flex flex-col gap-1 text-left">
                  <span className="text-[10px] uppercase tracking-wider text-gray-500">Max Drawdown</span>
                  <span className="text-xl font-bold text-red-500">-$1,205</span>
                  <span className="text-xs font-semibold text-red-500">-2.1%</span>
                </div>
              </div>
              
              {/* Chart Mock */}
              <div className="flex-1 rounded-lg bg-white/[0.02] border border-gray-800 overflow-hidden relative">
                <svg viewBox="0 0 800 200" fill="none" preserveAspectRatio="none" className="w-full h-full absolute inset-0">
                  <defs>
                    <linearGradient id="tzHeroGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 180 L50 160 L100 170 L150 140 L200 150 L250 100 L300 110 L350 80 L400 90 L450 60 L500 70 L550 40 L600 50 L650 30 L700 40 L750 20 L800 10" stroke="var(--color-brand-500)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0 180 L50 160 L100 170 L150 140 L200 150 L250 100 L300 110 L350 80 L400 90 L450 60 L500 70 L550 40 L600 50 L650 30 L700 40 L750 20 L800 10 L800 200 L0 200 Z" fill="url(#tzHeroGrad)" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trusted Logos */}
        <motion.div variants={itemVariants} className="mt-20">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-6">Trusted by funded traders passing challenges at</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {TRUSTED_LOGOS.map((name) => (
              <span key={name} className="text-sm font-semibold text-gray-500 opacity-50 hover:opacity-100 transition-opacity">{name}</span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
