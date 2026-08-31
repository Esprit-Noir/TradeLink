"use client"

import { Star, BadgeCheck } from "lucide-react"
import { motion } from "framer-motion"

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
    color: "#00c758",
    avatar: "AM",
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
    color: "#3b82f6",
    avatar: "SK",
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
    color: "#a855f7",
    avatar: "MT",
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
    color: "#f59e0b",
    avatar: "JL",
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
    color: "#ef4444",
    avatar: "CR",
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
    color: "#06b6d4",
    avatar: "ED",
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
    color: "#00c758",
    avatar: "DK",
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
    color: "#8b5cf6",
    avatar: "LP",
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
    color: "#f97316",
    avatar: "AR",
  },
]

function TestimonialCard({ t, style }: { t: typeof TESTIMONIALS[0], style?: React.CSSProperties }) {
  return (
    <div
      className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 group relative overflow-hidden flex-shrink-0 w-[340px] md:w-[380px]"
      style={style}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-10 pointer-events-none" style={{ background: t.color }} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-1">
            {Array.from({ length: t.rating }).map((_, j) => (
              <Star key={j} size={14} className="fill-yellow-500 text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
            ))}
          </div>
          {t.metric && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-inner" style={{
              background: `${t.color}15`,
              color: t.color,
              borderColor: `${t.color}30`
            }}>
              {t.metric}
            </span>
          )}
        </div>
        <p className="text-gray-300 text-sm leading-relaxed mb-6 font-medium">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${t.color}60, ${t.color}20)`, border: `1px solid ${t.color}40` }}
          >
            {t.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white tracking-tight">
              {t.name}
              {t.verified && <BadgeCheck size={14} className="text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {t.role} • {t.firm}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Infinite marquee row
function TestimonialRow({ items, reverse = false }: { items: typeof TESTIMONIALS, reverse?: boolean }) {
  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex w-max gap-6"
        style={{ animation: `marquee-testimonials${reverse ? '-reverse' : ''} 40s linear infinite` }}
      >
        {[...items, ...items].map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  )
}

export function MarketingTestimonials() {
  const row1 = TESTIMONIALS.slice(0, 5)
  const row2 = TESTIMONIALS.slice(4)

  return (
    <section className="py-32 bg-[#050505] border-y border-white/5 relative overflow-hidden" id="testimonials">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-0 w-1/4 h-1/2 bg-[var(--color-brand-500)]/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-1/4 h-1/2 bg-blue-500/5 blur-[150px] pointer-events-none" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-testimonials {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-testimonials-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}} />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10 mb-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Testimonials</span>
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tighter">
            Trusted by <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,199,88,0.3)]">10,000+ Traders</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Real results from real traders. See how TradeLink is transforming
            trading careers worldwide.
          </p>
        </motion.div>
      </div>

      {/* Edge fades */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 md:w-48 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-48 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

        <div className="flex flex-col gap-6">
          <TestimonialRow items={row1} />
          <TestimonialRow items={row2} reverse />
        </div>
      </div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-[1200px] mx-auto px-6 mt-16"
      >
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: "4.9/5", label: "Note moyenne", sub: "sur 2,400+ avis" },
            { value: "91%", label: "Recommandent", sub: "à leurs collègues" },
            { value: "15K+", label: "Traders actifs", sub: "dans 80+ pays" },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <span className="text-3xl font-black text-white tracking-tighter mb-1">{stat.value}</span>
              <span className="text-sm font-bold text-[var(--color-brand-500)] mb-0.5">{stat.label}</span>
              <span className="text-xs text-gray-500 font-medium">{stat.sub}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
