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
    <section className="py-32 bg-[#050505] border-t border-white/5 overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-emerald-500/10 blur-[150px] pointer-events-none rounded-[100%]" />
      
      <motion.div 
        className="max-w-[1200px] mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-20 flex flex-col items-center">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[var(--color-brand-500)] animate-pulse shadow-[0_0_10px_var(--color-brand-500)]" />
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Seamless Sync</span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tighter">
            Your Entire Portfolio,<br />
            <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,199,88,0.3)]">Unified</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Import trades automatically via API or CSV from any platform in seconds.
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="relative w-full max-w-5xl mx-auto overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-32 before:bg-gradient-to-r before:from-[#050505] before:to-transparent before:z-10 after:absolute after:inset-y-0 after:right-0 after:w-32 after:bg-gradient-to-l after:from-[#050505] after:to-transparent after:z-10">
          <div className="flex w-max" style={{ animation: 'marquee 40s linear infinite' }}>
            {[...BROKERS, ...BROKERS].map((name, i) => (
              <div key={`${name}-${i}`} className="flex items-center gap-3 px-8 py-5 mx-4 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 flex-shrink-0 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] transition-all duration-300 cursor-default group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-inner group-hover:border-white/20 transition-colors" />
                <span className="text-base font-bold text-gray-300 group-hover:text-white transition-colors">{name}</span>
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

        <motion.p variants={itemVariants} className="mt-20 text-center text-sm font-medium text-gray-500 flex flex-col items-center gap-3">
          Don&apos;t see your broker? We add new integrations every month.
          <a href="#" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[var(--color-brand-500)] hover:text-emerald-400 font-bold transition-all border border-white/5 hover:border-white/10 hover:shadow-[0_0_15px_rgba(0,199,88,0.2)]">
            Request an integration <ArrowRight size={14} />
          </a>
        </motion.p>
      </motion.div>
    </section>
  )
}
