"use client"

import { Upload, Brain, TrendingUp, Check, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"

export function MarketingHowItWorks() {
  const t = useTranslations("Marketing.HowItWorks")

  const STEPS = [
    {
      number: "01",
      icon: Upload,
      title: t("step1Title"),
      description: t("step1Desc"),
      color: "#3b82f6",
      details: [t("step1D1"), t("step1D2"), t("step1D3"), t("step1D4")],
      preview: (
        <div className="flex flex-col gap-2 w-full">
          {/* Import progress simulation */}
          {[
            { name: "trades_2024_Q1.csv", size: "12.4 KB", done: true },
            { name: "mt5_export.csv", size: "38.1 KB", done: true },
            { name: "ib_history.csv", size: "5.2 KB", done: false, progress: 72 },
          ].map((f) => (
            <div key={f.name} className="flex items-center gap-3 px-4 py-3 bg-black/40 rounded-xl border border-white/5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.done ? "bg-[#3b82f6]" : "bg-[#3b82f6] animate-pulse"}`} />
              <span className="text-xs font-mono text-gray-400 flex-1 truncate">{f.name}</span>
              <span className="text-[10px] text-gray-600">{f.size}</span>
              {f.done ? (
                <Check size={12} className="text-[#3b82f6] flex-shrink-0" />
              ) : (
                <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                  <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${f.progress}%` }} />
                </div>
              )}
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="text-[10px] text-gray-500 font-medium">3 fichiers · 1,247 trades importés</span>
            <span className="text-[10px] font-bold text-[#3b82f6]">En cours…</span>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      icon: Brain,
      title: t("step2Title"),
      description: t("step2Desc"),
      color: "#8b5cf6",
      details: [t("step2D1"), t("step2D2"), t("step2D3"), t("step2D4")],
      preview: (
        <div className="flex flex-col gap-2 w-full">
          {/* AI insights cards */}
          {[
            { label: "🔴 Revenge trading détecté", sub: "Perte de $340 après drawdown", severity: "high" },
            { label: "🟡 Overtrade lundi matin", sub: "Win rate -18% avant 9h30", severity: "mid" },
            { label: "🟢 Setup breakout optimal", sub: "+2.4R moyen sur 67% de win", severity: "good" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 px-4 py-3 bg-black/40 rounded-xl border border-white/5 group hover:border-[#8b5cf6]/20 transition-colors">
              <div className={`w-1 h-full min-h-[24px] rounded-full flex-shrink-0 mt-0.5 ${item.severity === "high" ? "bg-red-500" : item.severity === "mid" ? "bg-amber-500" : "bg-[var(--color-brand-500)]"}`} />
              <div>
                <div className="text-xs font-semibold text-gray-200">{item.label}</div>
                <div className="text-[10px] text-gray-500 font-medium mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      number: "03",
      icon: TrendingUp,
      title: t("step3Title"),
      description: t("step3Desc"),
      color: "#00c758",
      details: [t("step3D1"), t("step3D2"), t("step3D3"), t("step3D4")],
      preview: (
        <div className="flex flex-col gap-3 w-full">
          {/* Progress metrics */}
          {[
            { label: "Win Rate", before: 45, after: 62, unit: "%" },
            { label: "Profit Factor", before: 1.2, after: 2.4, unit: "" },
            { label: "Avg R/R", before: 1.1, after: 2.8, unit: ":1" },
          ].map((m) => (
            <div key={m.label} className="px-4 py-3 bg-black/40 rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.label}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600">{m.before}{m.unit}</span>
                  <ArrowRight size={10} className="text-[#00c758]" />
                  <span className="font-black text-[#00c758]">{m.after}{m.unit}</span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((m.after / (m.after * 1.3)) * 100, 100)}%`,
                    background: "linear-gradient(90deg, #00c758, #34d399)"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <section className="py-32 bg-[#050505] relative border-y border-white/5 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-0 w-1/3 h-1/2 bg-blue-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-1/3 h-1/2 bg-emerald-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t("badge")}</span>
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 text-white tracking-tighter">
            {t("title1")}{" "}
            <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,199,88,0.3)]">
              {t("title2")}
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl leading-relaxed font-medium">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col gap-8 md:gap-6">
          {STEPS.map((step, idx) => (
            <StepCard key={step.number} step={step} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  )
}

type StepType = {
  number: string
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  title: string
  description: string
  color: string
  details: string[]
  preview: React.ReactNode
}

function StepCard({ step, idx }: { step: StepType; idx: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })
  const isEven = idx % 2 === 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
      className="group relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/8 rounded-3xl overflow-hidden hover:border-white/15 transition-all duration-500 hover:shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      style={{ borderColor: `${step.color}15` }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at ${isEven ? "30% 50%" : "70% 50%"}, ${step.color}08, transparent 60%)` }}
      />

      {/* Step number watermark */}
      <div
        className="absolute top-0 right-0 text-[160px] font-black leading-none opacity-[0.025] select-none pointer-events-none"
        style={{ color: step.color, lineHeight: 0.85 }}
      >
        {step.number}
      </div>

      <div className={`relative z-10 flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0`}>
        {/* Left / Right: Text content */}
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-center">
          {/* Step tag */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${step.color}25, ${step.color}08)`,
                border: `1px solid ${step.color}35`,
                boxShadow: `0 0 20px ${step.color}15`,
              }}
            >
              <step.icon size={22} style={{ color: step.color }} />
            </div>
            <span
              className="text-[10px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full"
              style={{ color: step.color, background: `${step.color}12`, border: `1px solid ${step.color}25` }}
            >
              Étape {parseInt(step.number)}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            {step.title}
          </h3>
          <p className="text-gray-400 leading-relaxed font-medium mb-8 max-w-md">
            {step.description}
          </p>

          {/* Details list */}
          <ul className="flex flex-col gap-3">
            {step.details.map((d) => (
              <li key={d} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${step.color}20`, border: `1px solid ${step.color}35` }}
                >
                  <Check size={10} style={{ color: step.color }} strokeWidth={3} />
                </div>
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div
          className="hidden md:block w-px self-stretch mx-0"
          style={{ background: `linear-gradient(to bottom, transparent, ${step.color}20, transparent)` }}
        />

        {/* Right / Left: Preview widget */}
        <div className="flex-1 p-10 md:p-12 flex flex-col justify-center">
          <div className="relative">
            {/* Widget header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: step.color, boxShadow: `0 0 8px ${step.color}` }} />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                {idx === 0 ? "Import en cours" : idx === 1 ? "Analyse IA — Rapport" : "Progression — 30 jours"}
              </span>
            </div>
            {/* Preview content */}
            <div
              className="rounded-2xl p-4 border"
              style={{
                background: `linear-gradient(135deg, ${step.color}06, transparent)`,
                borderColor: `${step.color}15`,
              }}
            >
              {step.preview}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}


