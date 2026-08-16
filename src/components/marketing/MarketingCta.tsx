import { ArrowRight, Shield, Clock, CreditCard } from "lucide-react"

export function MarketingCta() {
  return (
    <section className="marketing-cta">
      <div className="marketing-section-inner">
        <div className="marketing-cta-card" data-animate="fade-up">
          <h2 className="marketing-cta-title">
            Ready to Transform Your Trading?
          </h2>
          <p className="marketing-cta-subtitle">
            Join 10,000+ traders who use TradeLink to analyze performance,
            build discipline, and improve their edge. Start free today.
          </p>

          <div className="marketing-cta-trust" data-animate="fade-up" data-delay="1">
            <div className="marketing-cta-trust-item">
              <Shield size={16} />
              <span>Free Forever</span>
            </div>
            <div className="marketing-cta-trust-item">
              <CreditCard size={16} />
              <span>No Credit Card</span>
            </div>
            <div className="marketing-cta-trust-item">
              <Clock size={16} />
              <span>2-Minute Setup</span>
            </div>
          </div>

          <a href="/register" className="btn btn-primary btn-lg marketing-cta-button" data-animate="fade-up" data-delay="2">
            Start Free — No Card Required
            <ArrowRight size={18} />
          </a>

          <p className="marketing-cta-note">
            Free forever. No credit card required. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  )
}
