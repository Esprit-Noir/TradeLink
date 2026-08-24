"use client"

import { Upload, Brain, TrendingUp } from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, Variants } from "framer-motion"



const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 15 }
  }
}

export function MarketingHowItWorks() {
  const t = useTranslations("Marketing.HowItWorks")

  const STEPS = [
    {
      number: "1",
      icon: Upload,
      title: t("step1Title"),
      description: t("step1Desc"),
      color: "#3b82f6",
      details: [t("step1D1"), t("step1D2"), t("step1D3"), t("step1D4")],
    },
    {
      number: "2",
      icon: Brain,
      title: t("step2Title"),
      description: t("step2Desc"),
      color: "#8b5cf6",
      details: [t("step2D1"), t("step2D2"), t("step2D3"), t("step2D4")],
    },
    {
      number: "3",
      icon: TrendingUp,
      title: t("step3Title"),
      description: t("step3Desc"),
      color: "#00c758",
      details: [t("step3D1"), t("step3D2"), t("step3D3"), t("step3D4")],
    },
  ]
  return (
    <section className="py-32 bg-[#050505] relative border-y border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-0 w-1/3 h-1/2 bg-blue-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-1/3 h-1/2 bg-emerald-500/5 blur-[150px] pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20 flex flex-col items-center"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 shadow-[0_0_15px_rgba(255,255,255,0.05)] backdrop-blur-md">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t("badge")}</span>
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tighter">
            {t("title1")} <span className="bg-gradient-to-br from-[var(--color-brand-500)] to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,199,88,0.3)]">{t("title2")}</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Arrêtez de deviner. Commencez à mesurer. Notre cadre éprouvé vous aide à identifier
            ce qui fonctionne, à éliminer ce qui ne fonctionne pas, et à bâtir une régularité durable.
          </p>
        </motion.div>

        <div className="relative">
          {/* Glowing connecting line (hidden on mobile) */}
          <div className="hidden md:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/0 via-white/10 to-emerald-500/0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/20 to-emerald-500/0 blur-[2px]" />
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
          >
            {STEPS.map((step) => (
              <motion.div variants={itemVariants} key={step.number} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 flex flex-col hover:-translate-y-2 transition-all duration-500 relative overflow-hidden group shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_40px_rgba(255,255,255,0.05)]" style={{ borderColor: `${step.color}30` }}>
                <div className="absolute top-0 right-0 p-6 text-9xl font-black opacity-[0.02] group-hover:opacity-[0.04] group-hover:scale-110 transition-all duration-700 select-none -mt-8 -mr-4" style={{ color: step.color }}>
                  {step.number}
                </div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(to bottom right, ${step.color}, transparent)` }} />
                
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 z-10 shadow-inner" style={{ background: `${step.color}15`, color: step.color, boxShadow: `inset 0 0 20px ${step.color}20` }}>
                  <step.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 z-10 tracking-tight">{step.title}</h3>
                <p className="text-gray-400 text-base leading-relaxed mb-10 z-10 font-medium">{step.description}</p>
                
                <ul className="flex flex-col gap-4 mt-auto z-10">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-[0_0_5px_currentColor]" style={{ background: step.color, color: step.color }} />
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
