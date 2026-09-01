"use client"

import { motion } from "framer-motion"

const BROKERS = [
  "TradingView", "MetaTrader 4", "MetaTrader 5", "Interactive Brokers",
  "NinjaTrader", "Sierra Chart", "Quantower", "ATAS", "Rithmic", "CQG",
  "FTMO", "TopStep", "Apex", "+ 493 more",
]

export function MarketingIntegrations() {
  return (
    <section className="py-20 bg-[#050505] border-t border-white/[0.04]">
      <div className="max-w-[1000px] mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
            Your Entire Portfolio, <span className="text-[var(--color-brand-500)]">Unified</span>
          </h2>
          <p className="text-xs text-gray-400">Import trades automatically from any platform in seconds.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }} className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {BROKERS.map((b) => (
            <span key={b} className="text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-default">{b}</span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
