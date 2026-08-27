"use client"

import { ArrowRight } from "lucide-react"
import { motion, Variants } from "framer-motion"

// Broker data with brand colors and icon letters
const BROKERS = [
  { name: "TradingView", color: "#2962FF", letter: "T" },
  { name: "MetaTrader 4", color: "#0EA5E9", letter: "M" },
  { name: "MetaTrader 5", color: "#0284C7", letter: "M" },
  { name: "Interactive Brokers", color: "#EF4444", letter: "IB" },
  { name: "TD Ameritrade", color: "#22C55E", letter: "TD" },
  { name: "NinjaTrader", color: "#F59E0B", letter: "N" },
  { name: "Sierra Chart", color: "#8B5CF6", letter: "SC" },
  { name: "Quantower", color: "#06B6D4", letter: "Q" },
  { name: "ATAS", color: "#F97316", letter: "A" },
  { name: "Bookmap", color: "#EC4899", letter: "B" },
  { name: "Rithmic", color: "#10B981", letter: "R" },
  { name: "CQG", color: "#6366F1", letter: "C" },
  { name: "FTMO", color: "#14B8A6", letter: "F" },
  { name: "MyForexFunds", color: "#A855F7", letter: "MFF" },
  { name: "TopStep", color: "#3B82F6", letter: "TS" },
  { name: "Apex", color: "#EF4444", letter: "AP" },
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

function BrokerCard({ broker }: { broker: typeof BROKERS[0] }) {
  return (
    <div className="flex items-center gap-3 px-6 py-4 mx-3 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 flex-shrink-0 hover:bg-white/5 hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all duration-300 cursor-default group">
      {/* Colored icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0 shadow-inner transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${broker.color}80, ${broker.color}30)`,
          border: `1px solid ${broker.color}40`,
          boxShadow: `0 0 12px ${broker.color}20`,
        }}
      >
        {broker.letter}
      </div>
      <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">{broker.name}</span>
    </div>
  )
}

export function MarketingIntegrations() {
  const row1 = BROKERS.slice(0, 8)
  const row2 = BROKERS.slice(8)

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
            Import trades automatically via API ou CSV depuis n&apos;importe quelle plateforme en quelques secondes.
          </motion.p>
        </div>

        {/* Double marquee rows */}
        <div className="relative">
          {/* Edge fades */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

          {/* Row 1 — left to right */}
          <div className="overflow-hidden mb-4">
            <div className="flex w-max" style={{ animation: 'marquee-brokers 35s linear infinite' }}>
              {[...row1, ...row1, ...row1, ...row1].map((broker, i) => (
                <BrokerCard key={`r1-${broker.name}-${i}`} broker={broker} />
              ))}
            </div>
          </div>

          {/* Row 2 — right to left */}
          <div className="overflow-hidden">
            <div className="flex w-max" style={{ animation: 'marquee-brokers-reverse 40s linear infinite' }}>
              {[...row2, ...row2, ...row2, ...row2].map((broker, i) => (
                <BrokerCard key={`r2-${broker.name}-${i}`} broker={broker} />
              ))}
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee-brokers {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-brokers-reverse {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
        `}} />

        <motion.p variants={itemVariants} className="mt-16 text-center text-sm font-medium text-gray-500 flex flex-col items-center gap-3">
          Vous ne voyez pas votre broker ? On ajoute de nouvelles intégrations chaque mois.
          <a href="#" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-[var(--color-brand-500)] hover:text-emerald-400 font-bold transition-all border border-white/5 hover:border-white/10 hover:shadow-[0_0_15px_rgba(0,199,88,0.2)]">
            Demander une intégration <ArrowRight size={14} />
          </a>
        </motion.p>
      </motion.div>
    </section>
  )
}
