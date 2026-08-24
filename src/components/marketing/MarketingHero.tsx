"use client"

import { useTranslations } from "next-intl"
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
  const t = useTranslations("Marketing.Hero");
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
        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:bg-white/10 transition-colors cursor-default">
          <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse shadow-[0_0_10px_var(--color-brand-500)]" />
          <span className="text-xs font-semibold text-gray-300 tracking-wider uppercase">{t("badge")}</span>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tighter mb-6 max-w-5xl text-white leading-[1.05]">
          {t("title1")}<br />
          <span className="bg-gradient-to-br from-white via-gray-200 to-[var(--color-brand-500)] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,199,88,0.3)]">{t("title2")}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed mb-10 font-medium">
          {t("subtitle")}
        </motion.p>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
          {isLoggedIn ? (
            <Link href="/dashboard" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-brand-500)] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,199,88,0.4)] hover:shadow-[0_0_40px_rgba(0,199,88,0.6)] hover:-translate-y-1 w-full sm:w-auto overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">Aller au Dashboard <LayoutDashboard size={18} /></span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
          ) : (
            <Link href="/register" className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-brand-500)] text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,199,88,0.4)] hover:shadow-[0_0_40px_rgba(0,199,88,0.6)] hover:-translate-y-1 w-full sm:w-auto overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">Démarrer Gratuitement <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </Link>
          )}
          <Link href="#features" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold rounded-xl transition-all hover:-translate-y-1 w-full sm:w-auto backdrop-blur-md">
            <Play size={16} className="fill-current group-hover:text-[var(--color-brand-500)] transition-colors" />
            {t("howItWorks")}
          </Link>
        </motion.div>

        {/* Social Proof */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-4 mb-20 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=11')" }} />
            <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=12')" }} />
            <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=13')" }} />
            <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-800 bg-cover bg-center shadow-lg" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=14')" }} />
            <div className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">10K+</div>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex gap-1 text-yellow-500 text-sm drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">
              <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
            </div>
            <span className="text-xs text-gray-400 font-medium mt-0.5">{t("rating")}</span>
          </div>
        </motion.div>

        {/* Real Dashboard Visual with 3D effect */}
        <motion.div 
          variants={itemVariants} 
          className="w-full max-w-6xl mx-auto relative perspective-[2000px] mb-32"
        >
          <div className="absolute inset-0 bg-[var(--color-brand-500)]/20 blur-[100px] rounded-full translate-y-10" />
          <motion.div 
            className="rounded-2xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            style={{ transformStyle: 'preserve-3d' }}
            initial={{ rotateX: 10, y: 50, opacity: 0 }}
            animate={{ rotateX: 0, y: 0, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            whileHover={{ scale: 1.02, rotateX: 2, transition: { duration: 0.4 } }}
          >
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />
            <div className="flex items-center px-6 py-4 border-b border-white/5 bg-white/5 relative z-20">
              <div className="flex gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                <div className="w-3.5 h-3.5 rounded-full bg-green-500/80 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </div>
              <div className="flex-1 text-center flex justify-center">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/40 px-6 py-2 rounded-lg border border-white/5 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  app.tradelink.io
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dashboard-screens/dash1.png" alt="TradeLink Dashboard" className="w-full h-auto object-cover opacity-90 relative z-0" />
          </motion.div>
        </motion.div>

        {/* Stats Section with glowing dividers */}
        <motion.div variants={itemVariants} className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-24 max-w-4xl mx-auto">
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter drop-shadow-md"><AnimatedCounter end={120} suffix="M+" /></span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{t("tradesAnalyzed")}</span>
          </div>
          <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter drop-shadow-md"><AnimatedCounter end={98} suffix="%" /></span>
            <span className="text-xs font-bold text-[var(--color-brand-500)] uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(0,199,88,0.4)]">{t("clientRetention")}</span>
          </div>
          <div className="hidden md:block w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter drop-shadow-md"><AnimatedCounter end={15} suffix="K+" /></span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">{t("fundedTraders")}</span>
          </div>
        </motion.div>

        {/* Trusted Logos */}
        <motion.div variants={itemVariants} className="mt-10 border-t border-white/5 pt-10 w-full">
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mb-8 text-center">{t("trustedBy")}</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {/* FTMO Style */}
            <div className="flex items-center gap-2 group cursor-default">
              <span className="text-2xl font-black italic tracking-tighter text-white">FTMO</span>
            </div>
            
            {/* Topstep Style */}
            <div className="flex items-center gap-2 group cursor-default">
              <div className="w-5 h-5 rounded-sm bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center -rotate-12">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Topstep</span>
            </div>
            
            {/* Apex Style */}
            <div className="flex items-center gap-2 group cursor-default">
              <span className="text-xl font-extrabold uppercase tracking-widest text-white flex items-center">
                A<span className="text-red-500">P</span>EX
              </span>
            </div>
            
            {/* The5ers Style */}
            <div className="flex items-center gap-1.5 group cursor-default">
              <div className="w-6 h-6 rounded-full border-[3px] border-yellow-500 text-yellow-500 flex items-center justify-center font-bold text-xs">5</div>
              <span className="text-lg font-bold tracking-tight text-white">The5ers</span>
            </div>
            
            {/* FundedNext Style */}
            <div className="flex items-center gap-2 group cursor-default">
              <div className="flex space-x-0.5">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                <div className="w-1.5 h-6 bg-emerald-400 rounded-full" />
                <div className="w-1.5 h-3 bg-emerald-300 rounded-full" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">FundedNext</span>
            </div>
            
            {/* FundingPips Style */}
            <div className="flex items-center gap-2 group cursor-default">
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 bg-purple-500 rounded-full opacity-50" />
                <div className="absolute inset-1 bg-purple-400 rounded-full" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white lowercase">funding<span className="font-light">pips</span></span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
