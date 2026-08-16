import { Upload, Brain, TrendingUp } from "lucide-react"

const STEPS = [
  {
    number: "01",
    icon: Upload,
    title: "Import Your Trades",
    description:
      "Connect your broker or upload CSV files. We support MetaTrader, TradingView, Interactive Brokers, and 20+ other platforms. Auto-sync your trades in seconds.",
    color: "#3b82f6",
    details: ["CSV/Excel import", "Broker API sync", "MT4 & MT5 support", "Real-time sync"],
  },
  {
    number: "02",
    icon: Brain,
    title: "Get AI-Powered Insights",
    description:
      "Our AI analyzes every aspect of your trading — entry timing, risk management, emotional patterns, and setup performance. Get personalized recommendations.",
    color: "#8b5cf6",
    details: ["Behavioral analysis", "Pattern detection", "Risk scoring", "Setup ranking"],
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Improve Your Edge",
    description:
      "Follow your personalized action plan. Track progress with detailed analytics. Build discipline and consistency that translates to real profits.",
    color: "#22c55e",
    details: ["Action plans", "Progress tracking", "Accountability", "Consistent results"],
  },
]

export function MarketingHowItWorks() {
  return (
    <section className="marketing-how-it-works">
      <div className="marketing-section-inner">
        <div className="marketing-section-header" data-animate="fade-up">
          <span className="marketing-badge">How It Works</span>
          <h2 className="marketing-section-title">
            Three Steps to <span className="text-gradient">Consistent Profits</span>
          </h2>
          <p className="marketing-section-subtitle">
            Stop guessing. Start measuring. Our proven framework helps you identify
            what works, eliminate what doesn&apos;t, and build lasting consistency.
          </p>
        </div>

        <div className="marketing-steps">
          {STEPS.map((step, i) => (
            <div key={step.number} className="marketing-step" data-animate="fade-up" data-delay={String(i + 1)}>
              <div className="marketing-step-connector">
                <div className="marketing-step-number" style={{ borderColor: step.color, color: step.color }}>
                  {step.number}
                </div>
                {i < STEPS.length - 1 && <div className="marketing-step-line" />}
              </div>
              <div className="marketing-step-card glass-card">
                <div className="marketing-step-icon" style={{ background: `${step.color}15`, color: step.color }}>
                  <step.icon size={24} />
                </div>
                <h3 className="marketing-step-title">{step.title}</h3>
                <p className="marketing-step-description">{step.description}</p>
                <ul className="marketing-step-details">
                  {step.details.map((d) => (
                    <li key={d}>
                      <span className="marketing-step-detail-dot" style={{ background: step.color }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
