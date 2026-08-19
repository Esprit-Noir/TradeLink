"use client"

import { Star, BadgeCheck, TrendingUp, Shield } from "lucide-react"
import { motion, Variants } from "framer-motion"

const TESTIMONIALS = [
  {
    name: "Alex M.",
    role: "Futures Trader",
    firm: "FTMO Funded",
    quote:
      "TradeLink's AI identified my revenge trading pattern within the first week. I was losing $500/day after losses. My win rate went from 45% to 62% in 3 months. Passed my FTMO challenge on the first try.",
    rating: 5,
    verified: true,
    metric: "+17% win rate",
  },
  {
    name: "Sarah K.",
    role: "Forex Trader",
    firm: "Independent",
    quote:
      "The calendar view and session analytics showed me I should stop trading after 2pm London time. That single insight saved me thousands per month. I went from break-even to consistently profitable.",
    rating: 5,
    verified: true,
    metric: "$3,200/mo saved",
  },
  {
    name: "Marcus T.",
    role: "Prop Firm Trader",
    firm: "MyForexFunds",
    quote:
      "Passed my FTMO challenge on the first try using TradeLink's prop firm tracking. The drawdown alerts kept me disciplined when it mattered most. The replay feature helped me fix my entry timing.",
    rating: 5,
    verified: true,
    metric: "1st attempt pass",
  },
  {
    name: "Jordan L.",
    role: "Swing Trader",
    firm: "Interactive Brokers",
    quote:
      "Tried TradeZella and TraderSync. TradeLink has the best design, the AI analysis is next level, and the price can't be beaten. The behavioral coaching alone is worth 10x the subscription.",
    rating: 5,
    verified: true,
    metric: "3x ROI in 6mo",
  },
  {
    name: "Chris R.",
    role: "Day Trader",
    firm: "Apex Trader Funding",
    quote:
      "The risk calculator alone is worth the subscription. I now risk exactly 1% per trade, no exceptions. My account has never been healthier. I've passed 3 challenges in a row.",
    rating: 5,
    verified: true,
    metric: "3 challenges passed",
  },
  {
    name: "Emma D.",
    role: "Options Trader",
    firm: "TD Ameritrade",
    quote:
      "Setup tagging completely changed my approach. Discovered my iron condor win rate jumped from 55% to 78% when I stopped trading them on Fridays. TradeLink found patterns I never would have seen.",
    rating: 5,
    verified: true,
    metric: "+23% win rate",
  },
  {
    name: "David K.",
    role: "Scalper",
    firm: "Rithmic",
    quote:
      "The trade replay feature is a game changer. Being able to watch my entries tick-by-tick helped me realize I was entering too early. Fixed that one thing and my P&L doubled.",
    rating: 5,
    verified: true,
    metric: "2x P&L",
  },
  {
    name: "Lisa P.",
    role: "Swing Trader",
    firm: "The5ers",
    quote:
      "I was about to give up on trading after failing 2 prop firm challenges. TradeLink's AI showed me I was overtrading on Mondays. Changed that one behavior and passed my next challenge.",
    rating: 5,
    verified: true,
    metric: "Challenge passed",
  },
  {
    name: "Ahmed R.",
    role: "Forex Trader",
    firm: "FTMO Funded",
    quote:
      "The weekly email reports keep me accountable. Seeing my stats laid out clearly forces me to confront my bad habits. Down 40% on revenge trades since I started.",
    rating: 5,
    verified: true,
    metric: "-40% revenge trades",
  },
]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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

export function MarketingTestimonials() {
  return (
    <section className="py-32 bg-black border-y border-white/5" id="testimonials">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 mb-6 text-[10px] font-bold text-[var(--color-brand-500)] uppercase tracking-widest">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
            Trusted by <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent">10,000+ Traders</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Real results from real traders. See how TradeLink is transforming
            trading careers worldwide.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div variants={itemVariants} key={t.name} className="break-inside-avoid bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                {t.metric && (
                  <span className="px-2 py-1 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] text-[10px] font-bold uppercase tracking-wider rounded-md">
                    {t.metric}
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-400">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                    {t.name}
                    {t.verified && <BadgeCheck size={14} className="text-blue-400" />}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    {t.role} • {t.firm}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
