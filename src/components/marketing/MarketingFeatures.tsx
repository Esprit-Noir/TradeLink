"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, BarChart3, Activity, Target, Shield, Check } from "lucide-react"

const TABS = [
  { id: "journal", icon: Brain, label: "Journaling" },
  { id: "backtest", icon: BarChart3, label: "Backtesting" },
  { id: "replay", icon: Activity, label: "Trade Replay" },
  { id: "ai", icon: Target, label: "AI Insights" },
  { id: "prop", icon: Shield, label: "Prop Firm Sync" },
]

function JournalPreview() {
  return (
    <div className="bg-[#060806] border border-white/[0.04] rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#00c758]"></div>
        <span className="text-[9px] text-gray-500 tracking-widest">TRADE JOURNAL</span>
      </div>
      {["EUR/USD", "NQ", "ES", "GC", "CL"].map((pair, i) => (
        <div key={pair} className="bg-[#0a0c0a] border border-white/[0.03] rounded px-3 py-2 flex items-center gap-3">
          <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${i % 3 === 2 ? "bg-red-500/10 text-red-400" : "bg-[#00c758]/10 text-[#00c758]"}`}>
            {i % 3 === 2 ? "SHORT" : "LONG"}
          </span>
          <span className="text-[10px] text-gray-300 flex-1">{pair}</span>
          <span className="text-[10px] font-mono text-gray-600">14:32</span>
          <span className={`text-[10px] font-semibold ${i % 3 === 2 ? "text-red-400" : "text-[#00c758]"}`}>
            {i % 3 === 2 ? "-$" + (30 + i * 20) : "+$" + (150 + i * 80)}
          </span>
        </div>
      ))}
    </div>
  )
}

function BacktestPreview() {
  return (
    <div className="bg-[#060806] border border-white/[0.04] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#a855f7]"></div>
        <span className="text-[9px] text-gray-500 tracking-widest">BACKTEST RESULTS</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[
          { label: "Total Trades", val: "1,247" },
          { label: "Win Rate", val: "58.4%" },
          { label: "Sharpe", val: "1.82" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a0c0a] border border-white/[0.03] rounded p-2 text-center">
            <div className="text-[8px] text-gray-600">{s.label}</div>
            <div className="text-[11px] font-bold text-white">{s.val}</div>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 300 60" className="w-full h-12" preserveAspectRatio="none">
        <defs>
          <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d="M0,50 L20,45 L40,48 L60,40 L80,42 L100,35 L120,38 L140,30 L160,32 L180,25 L200,28 L220,20 L240,22 L260,15 L280,18 L300,10 L300,60 L0,60 Z" fill="url(#btGrad)"/>
        <polyline points="0,50 20,45 40,48 60,40 80,42 100,35 120,38 140,30 160,32 180,25 200,28 220,20 240,22 260,15 280,18 300,10" fill="none" stroke="#a855f7" strokeWidth="2"/>
      </svg>
    </div>
  )
}

function ReplayPreview() {
  return (
    <div className="bg-[#060806] border border-white/[0.04] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
        <span className="text-[9px] text-gray-500 tracking-widest">TRADE REPLAY</span>
      </div>
      <div className="bg-[#0a0c0a] border border-white/[0.03] rounded p-3 mb-2">
        <svg viewBox="0 0 300 50" className="w-full h-10" preserveAspectRatio="none">
          {Array.from({ length: 20 }).map((_, i) => {
            const h = 8 + Math.random() * 30
            const y = 45 - h
            const green = i % 3 !== 0
            return <rect key={i} x={i * 15} y={y} width="10" height={h} rx="1" fill={green ? "#00c758" : "#ef4444"} opacity={green ? 0.6 : 0.5}/>
          })}
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#3b82f6]/15 flex items-center justify-center">
          <span className="text-[#3b82f6] text-[8px]">&#9654;</span>
        </div>
        <div className="flex-1 h-1 bg-[#0a0c0a] rounded-full overflow-hidden">
          <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: "45%" }}></div>
        </div>
        <span className="text-[8px] text-gray-600">2:34 / 5:12</span>
      </div>
    </div>
  )
}

function AiPreview() {
  return (
    <div className="bg-[#060806] border border-white/[0.04] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
        <span className="text-[9px] text-gray-500 tracking-widest">AI ANALYSIS</span>
      </div>
      <div className="space-y-2">
        <div className="bg-[#0a0c0a] border border-white/[0.03] rounded p-2.5 flex items-start gap-2">
          <span className="text-[#f59e0b] text-[10px] mt-0.5">&#9888;</span>
          <div>
            <div className="text-[9px] text-white font-medium mb-0.5">Revenge Trading Detected</div>
            <div className="text-[8px] text-gray-500">You took 5 trades in 8 minutes after a -$340 loss. Average entry quality dropped 40%.</div>
          </div>
        </div>
        <div className="bg-[#0a0c0a] border border-white/[0.03] rounded p-2.5 flex items-start gap-2">
          <span className="text-[#00c758] text-[10px] mt-0.5">&#10003;</span>
          <div>
            <div className="text-[9px] text-white font-medium mb-0.5">Best Setup: London Breakout</div>
            <div className="text-[8px] text-gray-500">78% win rate, 2.8 profit factor on EUR/USD 15min opens.</div>
          </div>
        </div>
        <div className="bg-[#0a0c0a] border border-white/[0.03] rounded p-2.5 flex items-start gap-2">
          <span className="text-[#3b82f6] text-[10px] mt-0.5">&#9733;</span>
          <div>
            <div className="text-[9px] text-white font-medium mb-0.5">Time-of-Day Pattern</div>
            <div className="text-[8px] text-gray-500">Win rate drops 18% after 1pm EST. Consider stopping at lunch.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PropPreview() {
  return (
    <div className="bg-[#060806] border border-white/[0.04] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-[#00c758]"></div>
        <span className="text-[9px] text-gray-500 tracking-widest">PROP FIRM DASHBOARD</span>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { firm: "FTMO", status: "Passing", progress: 72, color: "#00c758" },
          { firm: "Apex", status: "Phase 2", progress: 45, color: "#3b82f6" },
          { firm: "TopStep", status: "Funded", progress: 100, color: "#00c758" },
          { firm: "The5ers", status: "At Risk", progress: 88, color: "#ef4444" },
        ].map((p) => (
          <div key={p.firm} className="bg-[#0a0c0a] border border-white/[0.03] rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-semibold text-white">{p.firm}</span>
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded" style={{ color: p.color, backgroundColor: `${p.color}15` }}>{p.status}</span>
            </div>
            <div className="h-1 bg-[#121512] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.color }}></div>
            </div>
            <div className="text-[7px] text-gray-600 mt-1">{p.progress}% complete</div>
          </div>
        ))}
      </div>
      <div className="bg-[#0a0c0a] border border-[#00c758]/10 rounded p-2 flex items-center gap-2">
        <span className="text-[#00c758] text-[10px]">&#10003;</span>
        <span className="text-[8px] text-gray-400">All daily loss limits within safe range. 2 accounts on track for funding.</span>
      </div>
    </div>
  )
}

const PREVIEWS: Record<string, () => React.JSX.Element> = {
  journal: JournalPreview,
  backtest: BacktestPreview,
  replay: ReplayPreview,
  ai: AiPreview,
  prop: PropPreview,
}

export function MarketingFeatures() {
  const t = useTranslations("Marketing.Features")
  const [active, setActive] = useState("journal")

  const CONTENT: Record<string, { tag: string; title: string; desc: string; bullets: string[] }> = {
    journal: {
      tag: "AUTOMATED JOURNALING",
      title: t("aiTitle"),
      desc: t("aiDesc"),
      bullets: [t("aiF1"), t("aiF2"), t("aiF3"), "Real-time sync"],
    },
    backtest: {
      tag: "BACKTESTING",
      title: t("quantTitle"),
      desc: t("quantDesc"),
      bullets: ["Tick-level data", "Bar-by-bar replay", "Multi-strategy comparison", "Playbook library"],
    },
    replay: {
      tag: "TRADE REPLAY",
      title: "Replay every trade, bar by bar.",
      desc: "Re-watch the chart exactly as it printed. Spot the hesitation, the early exit, the level you should have respected.",
      bullets: ["Synced with your fills", "Variable playback speed", "Drawing tools", "Share with your space"],
    },
    ai: {
      tag: "AI INSIGHTS",
      title: "Find what's costing you.",
      desc: "TradeLink AI reads your trades and surfaces the leaks: time-of-day patterns, tilt cycles, the setups that quietly print.",
      bullets: ["Trained on 20.2B trades", "Behavior & tilt detection", "Plain-English Q&A", "Weekly digest"],
    },
    prop: {
      tag: "PROP FIRM SYNC",
      title: t("propTitle"),
      desc: t("propDesc"),
      bullets: [t("propF1"), t("propF2"), "Pass-rate forecasting", "Multi-account dashboards"],
    },
  }

  const content = CONTENT[active]
  const Preview = PREVIEWS[active]

  return (
    <section className="py-24 bg-[#050505] border-t border-white/[0.04]" id="features">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] mb-4">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("badge")}</span>
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            {t("title1")} <span className="text-[var(--color-brand-500)]">{t("title2")}</span>
          </h2>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">{t("subtitle")}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                active === tab.id ? "bg-white text-black" : "text-gray-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
          >
            <div>
              <span className="text-[10px] font-semibold text-[var(--color-brand-500)] uppercase tracking-wider mb-2 block">{content.tag}</span>
              <h3 className="text-2xl font-bold text-white mb-3">{content.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{content.desc}</p>
              <ul className="space-y-2.5">
                {content.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-300">
                    <Check size={12} className="text-[var(--color-brand-500)] flex-shrink-0" strokeWidth={3} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <Preview />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
