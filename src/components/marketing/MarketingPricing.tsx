import Link from "next/link"
import { Check, Sparkles, X } from "lucide-react"

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For beginners finding their footing. No credit card required.",
    features: [
      { text: "1 trading account", included: true },
      { text: "Basic P&L analytics", included: true },
      { text: "Calendar view", included: true },
      { text: "Manual trade entry", included: true },
      { text: "CSV import", included: true },
      { text: "AI Behavioral Coaching", included: false },
      { text: "Trade Replay", included: false },
      { text: "Prop Firm Tracking", included: false },
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro Trader",
    price: "$29",
    period: "/month",
    description: "The full arsenal for serious traders. Pass your challenge faster.",
    features: [
      { text: "Unlimited accounts & brokers", included: true },
      { text: "AI Behavioral Coaching", included: true },
      { text: "Trade Replay on real charts", included: true },
      { text: "Prop Firm Tracking", included: true },
      { text: "Advanced Risk Simulator", included: true },
      { text: "50+ Quant Reports", included: true },
      { text: "Monte Carlo Simulations", included: true },
      { text: "Priority Support", included: true },
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
  },
  {
    name: "Team & Firm",
    price: "$79",
    period: "/month",
    description: "For prop firms, mentors, and trading communities.",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 20 team members", included: true },
      { text: "Team Dashboard & Leaderboards", included: true },
      { text: "Mentor review tools", included: true },
      { text: "Custom branding", included: true },
      { text: "API Access", included: true },
      { text: "Dedicated Account Manager", included: true },
      { text: "SSO & Admin Controls", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export function MarketingPricing() {
  return (
    <section id="pricing" className="marketing-pricing-tz">
      <div className="marketing-section-inner">
        <div className="marketing-section-header" data-animate="fade-up">
          <span className="marketing-badge">Pricing</span>
          <h2 className="marketing-section-title">
            An Investment in Your <span className="text-gradient">Trading Edge</span>
          </h2>
          <p className="marketing-section-subtitle">
            Cheaper than a single stop-loss hit. Cancel anytime, no contracts.
          </p>
        </div>

        <div className="marketing-pricing-tz-grid">
          {PLANS.map((plan, i) => (
            <div 
              key={i} 
              className={`marketing-pricing-tz-card ${plan.popular ? "popular" : ""}`} 
              data-animate="fade-up" 
              data-delay={String(i + 1)}
            >
              {plan.popular && <div className="marketing-pricing-tz-glow" />}
              
              <div className="marketing-pricing-tz-content">
                {plan.popular && (
                  <div className="marketing-pricing-tz-badge">
                    <Sparkles size={14} /> Most Popular
                  </div>
                )}
                
                <h3 className="marketing-pricing-tz-name">{plan.name}</h3>
                <div className="marketing-pricing-tz-price">
                  <span className="amount">{plan.price}</span>
                  <span className="period">{plan.period}</span>
                </div>
                <p className="marketing-pricing-tz-desc">{plan.description}</p>
                
                <div className="marketing-pricing-tz-divider" />
                
                <ul className="marketing-pricing-tz-features">
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ opacity: f.included ? 1 : 0.4 }}>
                      <div className={`check-icon ${f.included ? (plan.popular ? "green" : "") : "check-icon.excluded"}`}>
                        {f.included ? <Check size={14} /> : <X size={14} />}
                      </div>
                      {f.text}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto pt-8">
                  <Link href="/register" className={plan.popular ? "marketing-hero-tz-btn-primary w-full justify-center" : "marketing-hero-tz-btn-secondary w-full justify-center"}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="marketing-pricing-note" data-animate="fade-up" data-delay="4">
          All paid plans include a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  )
}
