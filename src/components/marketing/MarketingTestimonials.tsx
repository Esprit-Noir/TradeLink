import { Star, BadgeCheck, TrendingUp, Shield } from "lucide-react"

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

export function MarketingTestimonials() {
  return (
    <section className="marketing-testimonials" id="testimonials">
      <div className="marketing-section-inner">
        <div className="marketing-section-header" data-animate="fade-up">
          <span className="marketing-badge">Testimonials</span>
          <h2 className="marketing-section-title">
            Trusted by <span className="text-gradient">10,000+ Traders</span>
          </h2>
          <p className="marketing-section-subtitle">
            Real results from real traders. See how TradeLink is transforming
            trading careers worldwide.
          </p>
        </div>

        <div className="marketing-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="marketing-testimonial-card glass-card" data-animate="fade-up" data-delay={String((i % 3) + 1)}>
              <div className="marketing-testimonial-top">
                <div className="marketing-testimonial-stars">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={14} fill="#facc15" color="#facc15" />
                  ))}
                </div>
                {t.metric && (
                  <span className="marketing-testimonial-metric">{t.metric}</span>
                )}
              </div>
              <p className="marketing-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="marketing-testimonial-author">
                <div className="marketing-testimonial-avatar">
                  {t.name.charAt(0)}
                </div>
                <div className="marketing-testimonial-info">
                  <div className="marketing-testimonial-name">
                    {t.name}
                    {t.verified && (
                      <BadgeCheck size={14} className="marketing-testimonial-verified" />
                    )}
                  </div>
                  <span className="marketing-testimonial-role">{t.role}</span>
                  <span className="marketing-testimonial-firm">{t.firm}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
