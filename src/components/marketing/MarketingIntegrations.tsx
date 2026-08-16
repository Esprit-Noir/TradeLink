import { ArrowRight } from "lucide-react"

const BROKERS = [
  "TradingView", "MetaTrader 4", "MetaTrader 5", "Interactive Brokers",
  "TD Ameritrade", "NinjaTrader", "Sierra Chart", "Quantower",
  "ATAS", "Bookmap", "Rithmic", "CQG", "FTMO", "MyForexFunds"
]

export function MarketingIntegrations() {
  return (
    <section className="marketing-integrations">
      <div className="marketing-section-inner">
        <div className="marketing-section-header" data-animate="fade-up">
          <span className="marketing-badge">Seamless Sync</span>
          <h2 className="marketing-section-title">
            Connects With <span className="text-gradient">Everything</span>
          </h2>
          <p className="marketing-section-subtitle">
            Import trades automatically via API or CSV from any platform in seconds.
          </p>
        </div>

        <div className="marketing-marquee-wrapper" data-animate="fade-up" data-delay="1">
          <div className="marketing-marquee-track">
            {/* First Set */}
            {BROKERS.map((name) => (
              <div key={`b1-${name}`} className="marketing-marquee-item">
                <div className="broker-logo-placeholder" />
                <span>{name}</span>
              </div>
            ))}
            {/* Duplicated Set for infinite effect */}
            {BROKERS.map((name) => (
              <div key={`b2-${name}`} className="marketing-marquee-item">
                <div className="broker-logo-placeholder" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="marketing-integrations-more" data-animate="fade-up" data-delay="2">
          Don&apos;t see your broker? We add new integrations every month.
          <br />
          <a href="#" className="flex-link">Request an integration <ArrowRight size={14} /></a>
        </p>
      </div>
    </section>
  )
}
