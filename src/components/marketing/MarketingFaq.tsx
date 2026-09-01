"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"

const FAQS = [
  { q: "Is TradeLink really free to start?", a: "Yes. The Free plan includes 1 trading account, basic analytics, P&L calendar, CSV import, and a full trading journal. No credit card required." },
  { q: "How does the AI behavioral analysis work?", a: "Our AI analyzes your trade history to detect patterns like revenge trading, overtrading, tilt, and emotional decision-making." },
  { q: "Which brokers do you support?", a: "We support 20+ platforms including MetaTrader 4 & 5, TradingView, Interactive Brokers, NinjaTrader, Sierra Chart, Quantower, ATAS, and more." },
  { q: "Is my trading data secure?", a: "Absolutely. We use bank-level AES-256 encryption, SOC 2 Type II compliant infrastructure, and never sell your data." },
  { q: "Can I use TradeLink for prop firm challenges?", a: "Yes. We have dedicated prop firm tracking for FTMO, MyForexFunds, The5ers, and others with real-time rule monitoring." },
  { q: "How is TradeLink different from TradeZella?", a: "TradeLink offers AI-powered behavioral analysis, real-time risk management, and a modern interface at a lower price point." },
  { q: "Can I cancel my subscription anytime?", a: "Yes, cancel anytime. No contracts, no cancellation fees. You keep access until the end of your billing period." },
]

export function MarketingFaq() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="py-24 bg-[#0a0a0a] border-t border-white/[0.04]">
      <div className="max-w-[640px] mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">FAQ</h2>
          <p className="text-sm text-gray-400">Everything you need to know about TradeLink.</p>
        </motion.div>

        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className={`bg-transparent border rounded-lg overflow-hidden transition-colors ${open === i ? "border-white/[0.1]" : "border-white/[0.04] hover:border-white/[0.08]"}`}>
              <button className="w-full flex items-center justify-between px-5 py-3.5 text-left" onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-sm font-medium text-gray-200">{faq.q}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ml-3 text-gray-500 flex-shrink-0 ${open === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${open === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-5 pb-3.5 text-xs text-gray-400 leading-relaxed border-t border-white/[0.04] pt-3">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
