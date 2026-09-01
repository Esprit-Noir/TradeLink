"use client"

import { motion } from "framer-motion"
import { Play } from "lucide-react"

const TESTIMONIALS = [
  { name: "Alex M.", role: "Futures · FTMO", quote: "TradeLink identified my revenge trading pattern within the first week. Win rate went from 45% to 62% in 3 months.", avatar: "AM" },
  { name: "Sarah K.", role: "Forex · Independent", quote: "The calendar view showed me I should stop trading after 2pm London time. That single insight saved me thousands.", avatar: "SK" },
  { name: "Marcus T.", role: "Prop Firm · MFF", quote: "Passed my FTMO challenge on the first try. Drawdown alerts kept me disciplined when it mattered most.", avatar: "MT" },
  { name: "Jordan L.", role: "Swing · IBKR", quote: "Tried TradeZella and TraderSync. TradeLink has the best design, the AI analysis is next level, and the price can't be beaten.", avatar: "JL" },
  { name: "Chris R.", role: "Day · Apex", quote: "The risk calculator alone is worth the subscription. I now risk exactly 1% per trade. Passed 3 challenges in a row.", avatar: "CR" },
  { name: "Emma D.", role: "Options · TDA", quote: "Setup tagging changed my approach. Iron condor win rate jumped from 55% to 78% when I stopped trading them on Fridays.", avatar: "ED" },
]

export function MarketingTestimonials() {
  return (
    <section className="py-24 bg-[#050505] border-t border-white/[0.04]" id="testimonials">
      <div className="max-w-[1000px] mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            Perfect fit for <span className="text-[var(--color-brand-500)]">every trader</span>
          </h2>
          <p className="text-sm text-gray-400">Thousands of traders are using TradeLink.</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}
              className={`bg-[#0a0a0a] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/[0.1] transition-colors group cursor-pointer ${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
              <div className={`relative bg-gradient-to-br from-[#111] to-[#0a0a0a] flex items-center justify-center ${i === 0 ? "h-40 md:h-56" : "h-28"}`}>
                <div className="w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-[11px] font-bold text-white">{t.avatar}</div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"><Play size={14} className="text-white ml-0.5" /></div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-300 leading-relaxed mb-3 line-clamp-3">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.1] flex items-center justify-center text-[8px] font-bold text-white">{t.avatar}</div>
                  <div>
                    <div className="text-[11px] font-semibold text-white">{t.name}</div>
                    <div className="text-[9px] text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }} className="mt-10 flex flex-wrap justify-center gap-8">
          {[{ v: "10K+", l: "Community members" }, { v: "150+", l: "Communities" }, { v: "100+", l: "Webinars" }].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-lg font-bold text-white">{s.v}</div>
              <div className="text-[11px] text-gray-500">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
