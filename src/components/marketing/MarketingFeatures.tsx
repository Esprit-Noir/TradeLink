"use client"

import {
  Brain, BarChart3, Shield, Zap, Target, Play, Activity, TrendingUp,
  Clock, AlertTriangle, Eye, LineChart, PieChart, Users, FileText
} from "lucide-react"

export function MarketingFeatures() {
  return (
    <section className="marketing-features" id="features">
      <div className="marketing-section-inner">
        <div className="marketing-section-header" data-animate="fade-up">
          <span className="marketing-badge">The Arsenal</span>
          <h2 className="marketing-section-title">
            Everything You Need to<br />
            <span className="text-gradient">Scale Your Edge</span>
          </h2>
          <p className="marketing-section-subtitle">
            From AI-powered behavioral coaching to real-time risk management — TradeLink gives
            funded traders the tools to pass challenges and keep their accounts alive.
          </p>
        </div>

        <div className="marketing-bento-grid">
          {/* AI Behavioral Coaching - Large */}
          <div className="marketing-bento-card large" data-animate="fade-up" data-delay="1">
            <div className="marketing-bento-glow green" />
            <div className="marketing-bento-content">
              <div className="marketing-bento-icon"><Brain size={24} /></div>
              <h3>AI Behavioral Coaching</h3>
              <p>Detects revenge trading, tilt, overtrading, and emotional spirals before they blow your account. Our AI cross-references your entry timing, position sizing, and P&L patterns to identify destructive behaviors — then gives you a personalized action plan to fix them.</p>
              
              <div className="marketing-bento-features">
                <div className="marketing-bento-feature-item">
                  <AlertTriangle size={14} />
                  <span>Real-time tilt detection</span>
                </div>
                <div className="marketing-bento-feature-item">
                  <Eye size={14} />
                  <span>Pattern recognition across 50+ metrics</span>
                </div>
                <div className="marketing-bento-feature-item">
                  <FileText size={14} />
                  <span>Personalized weekly action plans</span>
                </div>
              </div>
              
              <div className="marketing-bento-visual">
                <div className="bento-mockup-alert">
                  <span className="dot red" />
                  <div>
                    <strong>Tilt Warning</strong>
                    <span>You&apos;ve lost 3 trades in 15 mins. Your avg position size just increased 2.4x. Step away.</span>
                  </div>
                </div>
                <div className="bento-mockup-alert" style={{ marginTop: "0.5rem", background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                  <span className="dot" style={{ background: "var(--color-brand-500)" }} />
                  <div>
                    <strong style={{ color: "var(--color-brand-light)" }}>Insight</strong>
                    <span>Your win rate drops 18% after 2pm London. Consider closing positions earlier.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Deep Analytics - Medium */}
          <div className="marketing-bento-card medium" data-animate="fade-up" data-delay="2">
            <div className="marketing-bento-glow blue" />
            <div className="marketing-bento-content">
              <div className="marketing-bento-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa" }}><BarChart3 size={24} /></div>
              <h3>50+ Quant Reports</h3>
              <p>Every metric a professional quant would track — profit factor, expectancy, Sortino ratio, drawdown analysis, hourly performance, day-of-week breakdowns, and more.</p>
              
              <div className="marketing-bento-visual bottom">
                <div className="bento-mockup-chart">
                  <div className="bar" style={{ height: "30%", background: "rgba(59, 130, 246, 0.3)" }} />
                  <div className="bar" style={{ height: "55%", background: "rgba(59, 130, 246, 0.4)" }} />
                  <div className="bar" style={{ height: "45%", background: "rgba(59, 130, 246, 0.35)" }} />
                  <div className="bar" style={{ height: "80%", background: "rgba(59, 130, 246, 0.6)" }} />
                  <div className="bar" style={{ height: "65%", background: "rgba(59, 130, 246, 0.5)" }} />
                  <div className="bar" style={{ height: "95%", background: "var(--color-brand-500)" }} />
                  <div className="bar" style={{ height: "70%", background: "rgba(59, 130, 246, 0.55)" }} />
                  <div className="bar" style={{ height: "50%", background: "rgba(59, 130, 246, 0.4)" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Prop Firm Tracking */}
          <div className="marketing-bento-card small" data-animate="fade-left" data-delay="3">
            <div className="marketing-bento-content centered">
              <div className="marketing-bento-icon large" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#c084fc" }}><Target size={32} /></div>
              <h3>Prop Firm Tracking</h3>
              <p>Real-time drawdown, daily loss, and profit target tracking for FTMO, MyForexFunds, and 10+ firms.</p>
              <div className="marketing-bento-tag">Pass rate: 73%</div>
            </div>
          </div>

          {/* Risk Rules */}
          <div className="marketing-bento-card small" data-animate="fade-left" data-delay="4">
            <div className="marketing-bento-content centered">
              <div className="marketing-bento-icon large"><Shield size={32} /></div>
              <h3>Risk Management</h3>
              <p>Auto-enforced risk rules. Never exceed your max risk per trade or daily loss limit again.</p>
              <div className="marketing-bento-tag">1% risk per trade</div>
            </div>
          </div>

          {/* Trade Replay - Wide */}
          <div className="marketing-bento-card wide" data-animate="fade-up" data-delay="5">
             <div className="marketing-bento-glow purple" />
             <div className="marketing-bento-content row">
               <div className="text-content">
                 <div className="marketing-bento-icon" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#c084fc" }}><Play size={24} /></div>
                 <h3>Trade Replay</h3>
                 <p>Rewatch your entries and exits tick-by-tick on real charts. See exactly where you entered, where you exited, and where you should have held. Learn from mistakes instantly — not months later.</p>
                 <div className="marketing-bento-features" style={{ marginTop: "1rem" }}>
                   <div className="marketing-bento-feature-item">
                     <Activity size={14} />
                     <span>Real candlestick data from Yahoo Finance</span>
                   </div>
                   <div className="marketing-bento-feature-item">
                     <Clock size={14} />
                     <span>Adjustable playback speed</span>
                   </div>
                 </div>
               </div>
               <div className="visual-content">
                 <div className="bento-mockup-video">
                   <div className="play-button"><Play size={20} fill="currentColor" /></div>
                 </div>
               </div>
             </div>
          </div>

          {/* Equity Curve */}
          <div className="marketing-bento-card small" data-animate="fade-up" data-delay="6">
            <div className="marketing-bento-content centered">
              <div className="marketing-bento-icon large" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa" }}><LineChart size={32} /></div>
              <h3>Equity Curve</h3>
              <p>Track your account growth over time. Compare performance across accounts and strategies.</p>
            </div>
          </div>

          {/* Session Analytics */}
          <div className="marketing-bento-card small" data-animate="fade-up" data-delay="6">
            <div className="marketing-bento-content centered">
              <div className="marketing-bento-icon large" style={{ background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24" }}><Clock size={32} /></div>
              <h3>Session Analytics</h3>
              <p>Discover which hours and days you perform best. Stop trading when your edge disappears.</p>
            </div>
          </div>

          {/* Setup Tagging */}
          <div className="marketing-bento-card small" data-animate="fade-up" data-delay="6">
            <div className="marketing-bento-content centered">
              <div className="marketing-bento-icon large" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#f472b6" }}><PieChart size={32} /></div>
              <h3>Setup Tagging</h3>
              <p>Tag every trade with your setup. Rank your setups by profit factor and win rate to find your true edge.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
