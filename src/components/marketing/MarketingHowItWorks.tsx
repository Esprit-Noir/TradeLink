"use client"

import { Upload, Brain, TrendingUp } from "lucide-react"
import { motion, Variants } from "framer-motion"

const STEPS = [
  {
    number: "1",
    icon: Upload,
    title: "Import Your Trades",
    description:
      "Connect your broker or upload CSV files. We support MetaTrader, TradingView, Interactive Brokers, and 20+ other platforms. Auto-sync your trades in seconds.",
    color: "#3b82f6",
    details: ["CSV/Excel import", "Broker API sync", "MT4 & MT5 support", "Real-time sync"],
  },
  {
    number: "2",
    icon: Brain,
    title: "Get AI-Powered Insights",
    description:
      "Our AI analyzes every aspect of your trading — entry timing, risk management, emotional patterns, and setup performance. Get personalized recommendations.",
    color: "#8b5cf6",
    details: ["Behavioral analysis", "Pattern detection", "Risk scoring", "Setup ranking"],
  },
  {
    number: "3",
    icon: TrendingUp,
    title: "Improve Your Edge",
    description:
      "Follow your personalized action plan. Track progress with detailed analytics. Build discipline and consistency that translates to real profits.",
    color: "#22c55e",
    details: ["Action plans", "Progress tracking", "Accountability", "Consistent results"],
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 15 }
  }
}

export function MarketingHowItWorks() {
  return (
    <section className="py-32 bg-[#0a0a0a] border-y border-white/5">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-6 text-[10px] font-bold text-[var(--color-brand-500)] uppercase tracking-widest">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Three Steps to <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">Consistent Profits</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop guessing. Start measuring. Our proven framework helps you identify
            what works, eliminate what doesn&apos;t, and build lasting consistency.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {STEPS.map((step) => (
            <motion.div variants={itemVariants} key={step.number} className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 flex flex-col hover:-translate-y-1 hover:border-gray-700 transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 text-8xl font-black opacity-[0.03] group-hover:opacity-[0.05] transition-opacity select-none -mt-4 -mr-4" style={{ color: step.color }}>
                {step.number}
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 z-10" style={{ background: `${step.color}15`, color: step.color }}>
                <step.icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3 z-10">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 z-10">{step.description}</p>
              <ul className="flex flex-col gap-3 mt-auto z-10">
                {step.details.map((d) => (
                  <li key={d} className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: step.color }} />
                    {d}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
