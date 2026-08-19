"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, Variants } from "framer-motion"

const FAQS = [
  {
    question: "Is TradeLink really free to start?",
    answer: "Yes. The Free plan includes 1 trading account, basic analytics, P&L calendar, CSV import, and a full trading journal. No credit card required, no time limit. Upgrade to Pro when you need advanced features.",
  },
  {
    question: "How does the AI behavioral analysis work?",
    answer: "Our AI analyzes your trade history to detect patterns like revenge trading, overtrading, tilt, and emotional decision-making. It cross-references your entry/exit timing, position sizing, and P&L patterns to identify destructive behaviors before they cost you money.",
  },
  {
    question: "Which brokers and platforms do you support?",
    answer: "We support 20+ platforms including MetaTrader 4 & 5, TradingView, Interactive Brokers, NinjaTrader, Sierra Chart, Quantower, ATAS, and more. You can also import trades via CSV/Excel from any broker.",
  },
  {
    question: "Is my trading data secure?",
    answer: "Absolutely. We use bank-level AES-256 encryption, SOC 2 Type II compliant infrastructure, and never sell your data. Your trades are private — we only analyze them to provide your personal insights.",
  },
  {
    question: "Can I use TradeLink for prop firm challenges?",
    answer: "Yes. We have dedicated prop firm tracking for FTMO, MyForexFunds, The5ers, and others. Track drawdown limits, daily loss limits, profit targets, and get pass/fail probability projections in real-time.",
  },
  {
    question: "How is TradeLink different from TradeZella?",
    answer: "TradeLink offers AI-powered behavioral analysis, real-time risk management, and a modern interface at a lower price point. We also support more broker integrations and provide Monte Carlo simulations on all paid plans.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, cancel anytime from your account settings. No contracts, no cancellation fees. If you cancel Pro, you keep access until the end of your billing period, then your account reverts to the Free plan.",
  },
  {
    question: "Do you offer team or prop firm plans?",
    answer: "Yes. Our Team plan ($49/month) supports up to 20 members with a team dashboard, performance leaderboards, mentor review tools, and custom branding. For larger organizations, contact us for enterprise pricing.",
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
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

export function MarketingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-32 bg-[#0a0a0a] border-t border-white/5">
      <motion.div 
        className="max-w-[800px] mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="text-center mb-16 flex flex-col items-center">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulse" />
            <span className="text-xs font-semibold text-[var(--color-brand-500)] tracking-wide uppercase">FAQ</span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Frequently Asked <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">Questions</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg text-gray-400 mx-auto leading-relaxed">
            Everything you need to know about TradeLink.
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`bg-gray-900 border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'border-[var(--color-brand-500)]/30 shadow-[0_0_15px_rgba(var(--color-brand-rgb),0.1)]' : 'border-gray-800 hover:border-gray-700'}`}
              >
                <button
                  className="w-full flex items-center justify-between p-6 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className={`font-semibold transition-colors duration-300 ${isOpen ? 'text-[var(--color-brand-500)]' : 'text-white'}`}>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`transition-all duration-300 ${isOpen ? "rotate-180 text-[var(--color-brand-500)]" : "text-gray-400"}`}
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="p-6 pt-0 text-gray-400 text-sm leading-relaxed border-t border-gray-800/50 mt-2">
                    <p className="pt-4">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}
