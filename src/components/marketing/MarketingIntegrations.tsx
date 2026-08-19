"use client"

import { ArrowRight } from "lucide-react"
import { motion, Variants } from "framer-motion"

const BROKERS = [
  "TradingView", "MetaTrader 4", "MetaTrader 5", "Interactive Brokers",
  "TD Ameritrade", "NinjaTrader", "Sierra Chart", "Quantower",
  "ATAS", "Bookmap", "Rithmic", "CQG", "FTMO", "MyForexFunds"
]

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

export function MarketingIntegrations() {
  return (
    <section className="py-32 bg-black border-t border-white/5 overflow-hidden">
      <motion.div 
        className="max-w-[1200px] mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-16 flex flex-col items-center">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
            <span className="text-xs font-semibold text-[var(--color-brand-500)] tracking-wide uppercase">Seamless Sync</span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Connects With <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">Everything</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Import trades automatically via API or CSV from any platform in seconds.
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="relative w-full max-w-5xl mx-auto overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-32 before:bg-gradient-to-r before:from-black before:to-transparent before:z-10 after:absolute after:inset-y-0 after:right-0 after:w-32 after:bg-gradient-to-l after:from-black after:to-transparent after:z-10">
          <div className="flex w-max" style={{ animation: 'marquee 40s linear infinite' }}>
            {[...BROKERS, ...BROKERS].map((name, i) => (
              <div key={`${name}-${i}`} className="flex items-center gap-3 px-8 py-4 mx-4 rounded-xl bg-gray-900/40 backdrop-blur-md border border-gray-800/50 flex-shrink-0 hover:bg-gray-800 hover:border-gray-700 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all">
                <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10" />
                <span className="text-sm font-semibold text-gray-300">{name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}} />

        <motion.p variants={itemVariants} className="mt-16 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
          Don&apos;t see your broker? We add new integrations every month.
          <a href="#" className="inline-flex items-center gap-1 text-[var(--color-brand-500)] hover:text-[var(--color-brand-400)] font-medium transition-colors">
            Request an integration <ArrowRight size={14} />
          </a>
        </motion.p>
      </motion.div>
    </section>
  )
}
