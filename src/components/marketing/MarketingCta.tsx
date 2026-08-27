"use client"

import { ArrowRight, Shield, Clock, CreditCard, LayoutDashboard, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { useState, useEffect } from "react"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
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

// Live micro stats - simulates real-time activity
function LiveMicroStats() {
  const [joinedToday, setJoinedToday] = useState(23)
  const [activeNow, setActiveNow] = useState(347)

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increment
      if (Math.random() > 0.6) setJoinedToday(v => v + 1)
      setActiveNow(v => v + Math.round((Math.random() - 0.3) * 5))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-wrap justify-center gap-6 mb-10">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse shadow-[0_0_8px_var(--color-brand-500)]" />
        <span className="text-sm font-bold text-white">{joinedToday}</span>
        <span className="text-sm text-gray-400 font-medium">traders ont rejoint aujourd&apos;hui</span>
      </div>
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
        <Users size={14} className="text-blue-400" />
        <span className="text-sm font-bold text-white">{activeNow.toLocaleString()}</span>
        <span className="text-sm text-gray-400 font-medium">actifs en ce moment</span>
      </div>
    </div>
  )
}

export function MarketingCta({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const t = useTranslations("Marketing.Cta")
  return (
    <section className="py-32 bg-black border-t border-white/5 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[var(--color-brand-500)] blur-[120px] opacity-10 pointer-events-none" />
      {/* Secondary glow */}
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500 blur-[150px] opacity-5 pointer-events-none" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-20" 
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 70%)'
        }}
      />
      
      <motion.div 
        className="relative z-10 max-w-[1200px] mx-auto px-6 text-center"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--color-brand-500)] uppercase tracking-widest">Rejoignez la communauté</span>
            </span>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-white tracking-tighter leading-[1.0]">
            {t("title1")} <br />
            <span className="bg-gradient-to-br from-[var(--color-brand-500)] via-emerald-300 to-white bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,199,88,0.4)]">{t("title2")}</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
            Rejoignez plus de 10 000 traders qui utilisent TradeLink pour analyser leurs performances,
            forger leur discipline et améliorer leur avantage.
          </motion.p>

          {/* Live stats */}
          <motion.div variants={itemVariants}>
            <LiveMicroStats />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Shield size={16} className="text-[var(--color-brand-500)]" />
              <span>{t("f1")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <CreditCard size={16} className="text-[var(--color-brand-500)]" />
              <span>{t("f2")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <Clock size={16} className="text-[var(--color-brand-500)]" />
              <span>{t("f3")}</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            {isLoggedIn ? (
              <Link href="/dashboard" className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-[var(--color-brand-500)] text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(0,199,88,0.5)] hover:shadow-[0_0_60px_rgba(0,199,88,0.7)] hover:-translate-y-1 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  {t("dashboard")}
                  <LayoutDashboard size={20} />
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out" />
              </Link>
            ) : (
              <Link href="/register" className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 bg-[var(--color-brand-500)] text-black font-black text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(0,199,88,0.5)] hover:shadow-[0_0_60px_rgba(0,199,88,0.7)] hover:-translate-y-1 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  {t("startFree")}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-in-out" />
              </Link>
            )}
          </motion.div>

          <motion.p variants={itemVariants} className="mt-8 text-sm text-gray-500 font-medium">
            {t("disclaimer")}
          </motion.p>
        </div>
      </motion.div>
    </section>
  )
}
