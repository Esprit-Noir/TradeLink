"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

const FAQS = [
  {
    question: "Is TradeLink really free to start?",
    answer:
      "Yes. The Free plan includes 1 trading account, basic analytics, P&L calendar, CSV import, and a full trading journal. No credit card required, no time limit. Upgrade to Pro when you need advanced features.",
  },
  {
    question: "How does the AI behavioral analysis work?",
    answer:
      "Our AI analyzes your trade history to detect patterns like revenge trading, overtrading, tilt, and emotional decision-making. It cross-references your entry/exit timing, position sizing, and P&L patterns to identify destructive behaviors before they cost you money.",
  },
  {
    question: "Which brokers and platforms do you support?",
    answer:
      "We support 20+ platforms including MetaTrader 4 & 5, TradingView, Interactive Brokers, NinjaTrader, Sierra Chart, Quantower, ATAS, and more. You can also import trades via CSV/Excel from any broker.",
  },
  {
    question: "Is my trading data secure?",
    answer:
      "Absolutely. We use bank-level AES-256 encryption, SOC 2 Type II compliant infrastructure, and never sell your data. Your trades are private — we only analyze them to provide your personal insights.",
  },
  {
    question: "Can I use TradeLink for prop firm challenges?",
    answer:
      "Yes. We have dedicated prop firm tracking for FTMO, MyForexFunds, The5ers, and others. Track drawdown limits, daily loss limits, profit targets, and get pass/fail probability projections in real-time.",
  },
  {
    question: "How is TradeLink different from TradeZella?",
    answer:
      "TradeLink offers AI-powered behavioral analysis, real-time risk management, and a modern interface at a lower price point. We also support more broker integrations and provide Monte Carlo simulations on all paid plans.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, cancel anytime from your account settings. No contracts, no cancellation fees. If you cancel Pro, you keep access until the end of your billing period, then your account reverts to the Free plan.",
  },
  {
    question: "Do you offer team or prop firm plans?",
    answer:
      "Yes. Our Team plan ($49/month) supports up to 20 members with a team dashboard, performance leaderboards, mentor review tools, and custom branding. For larger organizations, contact us for enterprise pricing.",
  },
]

export function MarketingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="marketing-faq">
      <div className="marketing-section-inner">
        <div className="marketing-section-header" data-animate="fade-up">
          <span className="marketing-badge">FAQ</span>
          <h2 className="marketing-section-title">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="marketing-section-subtitle">
            Everything you need to know about TradeLink.
          </p>
        </div>

        <div className="marketing-faq-list">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className={`marketing-faq-item glass-card ${openIndex === i ? "open" : ""}`}
              data-animate="fade-up"
              data-delay={String(Math.min(i + 1, 4))}
            >
              <button
                className="marketing-faq-question"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span>{faq.question}</span>
                <ChevronDown
                  size={18}
                  className={`marketing-faq-chevron ${openIndex === i ? "rotated" : ""}`}
                />
              </button>
              <div className={`marketing-faq-answer ${openIndex === i ? "open" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
