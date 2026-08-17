"use client"

import Link from "next/link"
import { ArrowRight, Play, LayoutDashboard } from "lucide-react"
import { useState, useEffect, useRef } from "react"

function AnimatedCounter({ end, suffix = "", duration = 2000, decimals = 0 }: { end: number; suffix?: string; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const value = parseFloat((eased * end).toFixed(decimals))
            setCount(value)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, hasAnimated, decimals])

  return <span ref={ref}>{count.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

const TRUSTED_LOGOS = [
  "FTMO", "MyForexFunds", "The5ers", "Fidelcrest", "True Forex Funds", "E8 Funding", "Surge Trader", "Apex"
]

export function MarketingHero({ isLoggedIn }: { isLoggedIn?: boolean }) {
  return (
    <section className="marketing-hero-tz">
      <div className="marketing-hero-tz-bg">
        <div className="marketing-hero-tz-glow" />
        <div className="marketing-hero-tz-grid" />
      </div>

      <div className="marketing-hero-tz-container">
        <div className="marketing-hero-tz-content">
          <div className="marketing-hero-tz-badge" data-animate="fade-up">
            <span className="marketing-hero-tz-badge-dot" />
            <span className="marketing-hero-tz-badge-text">AI-Powered Trading Analytics</span>
          </div>

          <h1 className="marketing-hero-tz-title" data-animate="fade-up" data-delay="1">
            Your Trades Deserve<br />
            <span className="marketing-hero-tz-gradient">Better Than Gut Feeling</span>
          </h1>

          <p className="marketing-hero-tz-subtitle" data-animate="fade-up" data-delay="2">
            TradeLink is the professional trading journal that analyzes every entry, exit, and
            decision you make — then tells you exactly what to fix. AI behavioral coaching, prop firm
            tracking, and 50+ quant reports. Built for funded traders who refuse to fail.
          </p>

          <div className="marketing-hero-tz-actions" data-animate="fade-up" data-delay="3">
            {isLoggedIn ? (
              <Link href="/dashboard" className="marketing-hero-tz-btn-primary">
                Go to Dashboard
                <LayoutDashboard size={18} />
              </Link>
            ) : (
              <Link href="/register" className="marketing-hero-tz-btn-primary">
                Start Free — No Card Needed
                <ArrowRight size={18} />
              </Link>
            )}
            <Link href="#features" className="marketing-hero-tz-btn-secondary">
              <Play size={16} fill="currentColor" />
              See How It Works
            </Link>
          </div>

          <div className="marketing-hero-tz-social" data-animate="fade-up" data-delay="4">
             <div className="marketing-hero-tz-avatars">
                <div className="marketing-hero-tz-avatar" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=11')" }} />
                <div className="marketing-hero-tz-avatar" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=12')" }} />
                <div className="marketing-hero-tz-avatar" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=13')" }} />
                <div className="marketing-hero-tz-avatar" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=14')" }} />
                <div className="marketing-hero-tz-avatar-more">10K+</div>
             </div>
             <div className="marketing-hero-tz-social-text">
                <div className="marketing-hero-tz-stars">
                   <span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span><span>&#9733;</span>
                </div>
                <span>4.9/5 from 2,400+ funded traders</span>
             </div>
          </div>

          <div className="marketing-hero-tz-stats" data-animate="fade-up" data-delay="4">
            <div className="marketing-hero-tz-stat">
              <span className="value"><AnimatedCounter end={120} suffix="M+" /></span>
              <span className="label">Trades Analyzed</span>
            </div>
            <div className="marketing-hero-tz-stat-divider" />
            <div className="marketing-hero-tz-stat">
              <span className="value"><AnimatedCounter end={98} suffix="%" /></span>
              <span className="label">Client Retention</span>
            </div>
            <div className="marketing-hero-tz-stat-divider" />
            <div className="marketing-hero-tz-stat">
              <span className="value"><AnimatedCounter end={15} suffix="K+" /></span>
              <span className="label">Funded Traders</span>
            </div>
            <div className="marketing-hero-tz-stat-divider" />
            <div className="marketing-hero-tz-stat">
              <span className="value"><AnimatedCounter end={4.9} suffix="/5" decimals={1} /></span>
              <span className="label">Avg. Rating</span>
            </div>
          </div>
        </div>

        {/* DASHBOARD VISUAL */}
        <div className="marketing-hero-tz-visual" data-animate="fade-up" data-delay="5">
          <div className="marketing-hero-tz-dashboard">
            <div className="marketing-hero-tz-dash-header">
              <div className="marketing-hero-tz-dash-dots">
                <span /> <span /> <span />
              </div>
              <div className="marketing-hero-tz-dash-url">app.tradelink.io</div>
            </div>

            <div className="marketing-hero-tz-dash-body">
              <div className="marketing-hero-tz-dash-sidebar">
                <div className="marketing-hero-tz-dash-nav-item active" />
                <div className="marketing-hero-tz-dash-nav-item" />
                <div className="marketing-hero-tz-dash-nav-item" />
                <div className="marketing-hero-tz-dash-nav-item" />
                <div className="marketing-hero-tz-dash-nav-item" />
              </div>
              
              <div className="marketing-hero-tz-dash-main">
                <div className="marketing-hero-tz-dash-kpis">
                  <div className="marketing-hero-tz-dash-kpi">
                    <span className="label">Win Rate</span>
                    <span className="value">68.5%</span>
                    <span className="change positive">+4.2%</span>
                  </div>
                  <div className="marketing-hero-tz-dash-kpi">
                    <span className="label">Profit Factor</span>
                    <span className="value">2.41</span>
                    <span className="change positive">+0.3</span>
                  </div>
                  <div className="marketing-hero-tz-dash-kpi">
                    <span className="label">Net P&L</span>
                    <span className="value">+$8,342</span>
                    <span className="change positive">+$450</span>
                  </div>
                  <div className="marketing-hero-tz-dash-kpi">
                    <span className="label">Max Drawdown</span>
                    <span className="value loss">-$1,205</span>
                    <span className="change negative">-2.1%</span>
                  </div>
                </div>

                <div className="marketing-hero-tz-dash-chart">
                  <svg viewBox="0 0 800 200" fill="none" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
                    <defs>
                      <linearGradient id="tzHeroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="tzLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--color-brand-500)" />
                        <stop offset="100%" stopColor="var(--color-brand-400)" />
                      </linearGradient>
                    </defs>
                    <path d="M0 180 L50 160 L100 170 L150 140 L200 150 L250 100 L300 110 L350 80 L400 90 L450 60 L500 70 L550 40 L600 50 L650 30 L700 40 L750 20 L800 10" stroke="url(#tzLineGrad)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M0 180 L50 160 L100 170 L150 140 L200 150 L250 100 L300 110 L350 80 L400 90 L450 60 L500 70 L550 40 L600 50 L650 30 L700 40 L750 20 L800 10 L800 200 L0 200 Z" fill="url(#tzHeroGrad)" />
                    <circle cx="800" cy="10" r="5" fill="var(--color-brand-400)" style={{ filter: "drop-shadow(0 0 8px var(--color-brand-500))" }} />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="marketing-hero-tz-trusted" data-animate="fade-up" data-delay="6">
          <p>Trusted by funded traders passing challenges at</p>
          <div className="marketing-hero-tz-trusted-logos">
            {TRUSTED_LOGOS.map((name) => (
              <span key={name} className="marketing-hero-tz-trusted-logo">{name}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
