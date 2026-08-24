"use client"

import { ArrowRight, Shield, Clock, CreditCard, LayoutDashboard } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion, Variants } from "framer-motion"

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

export function MarketingCta({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const t = useTranslations("Marketing.Cta")
  return (
    <section className="py-32 bg-black border-t border-white/5 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[var(--color-brand-500)] blur-[120px] opacity-10 pointer-events-none" />
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
          <motion.h2 variants={itemVariants} className="text-5xl md:text-6xl font-bold mb-6 text-white tracking-tight leading-tight">
            {t("title1")} <br />{t("title2")}
          </motion.h2>
          <motion.p variants={itemVariants} className="text-xl text-gray-400 mb-12 leading-relaxed">
            Rejoignez plus de 10 000 traders qui utilisent TradeLink pour analyser leurs performances,
            forger leur discipline et améliorer leur avantage. Démarrez gratuitement dès aujourd'hui.
          </motion.p>

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
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors">
                {t("dashboard")}
                <LayoutDashboard size={18} />
              </Link>
            ) : (
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors">
                {t("startFree")}
                <ArrowRight size={18} />
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
