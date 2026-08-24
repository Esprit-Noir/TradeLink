"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Check, Sparkles, X } from "lucide-react"
import { motion, Variants } from "framer-motion"

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 50, damping: 15 }
  }
}

type DbPlan = {
  id: string
  name: string
  price: number
  maxAccounts: number
  maxTradesPerMonth: number | null
  backtestAccess: boolean
  features: Record<string, boolean>
}

export function MarketingPricing({ plans = [] }: { plans?: DbPlan[] }) {
  const t = useTranslations("Marketing.Pricing")
  // If no DB plans passed (or empty), you could fallback to static ones, but we assume they are passed
  const displayPlans = plans.map(p => {
    const isPro = p.name.toLowerCase() === "pro"
    const isElite = p.name.toLowerCase() === "elite"
    
    // Map db features to UI feature list
    const featuresList = [
      { text: p.maxAccounts >= 10 ? t("f1Unlimited") : t("f1Limited", { count: p.maxAccounts }), included: true },
      { text: p.maxTradesPerMonth ? t("f2Limited", { count: p.maxTradesPerMonth }) : t("f2Unlimited"), included: true },
      { text: t("f3"), included: true },
      { text: t("f4"), included: true },
      { text: t("f5"), included: !!p.features?.advancedStats },
      { text: t("f6"), included: !!p.features?.replayAccess || p.backtestAccess },
      { text: t("f7"), included: !!p.features?.propFirmAccess },
    ]

    return {
      name: p.name,
      price: `$${p.price.toString().replace(/\.00$/, '')}`,
      period: t("period"),
      description: isElite ? t("descElite") : isPro ? t("descPro") : t("descBasic"),
      features: featuresList,
      cta: isElite ? t("ctaElite") : isPro ? t("ctaPro") : t("ctaBasic"),
      popular: isPro,
    }
  })

  return (
    <section id="pricing" className="py-32 bg-[#050505] relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[500px] bg-[var(--color-brand-500)]/5 blur-[150px] pointer-events-none rounded-full" />
      
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
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch justify-center"
        >
          {displayPlans.map((plan, i) => (
            <motion.div 
              variants={itemVariants}
              key={i} 
              className={`relative flex flex-col bg-[#0a0a0a]/80 backdrop-blur-xl border rounded-3xl p-10 transition-all duration-500 hover:-translate-y-2 group ${plan.popular ? 'border-[var(--color-brand-500)]/50 md:-mt-6 md:mb-[-1.5rem] z-10 shadow-[0_0_50px_rgba(0,199,88,0.15)] bg-gradient-to-b from-[#0a0a0a] to-[var(--color-brand-500)]/5' : 'border-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[var(--color-brand-500)] text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-[0_0_20px_var(--color-brand-500)]">
                    <Sparkles size={14} className="animate-pulse" /> Most Popular
                  </div>
                </div>
              )}
              
              <div className="flex flex-col h-full">
                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-extrabold text-white tracking-tighter">{plan.price}</span>
                  <span className="text-sm font-medium text-gray-400">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mb-8 h-10 font-medium">{plan.description}</p>
                
                <div className="w-full h-px bg-white/10 mb-8" />
                
                <ul className="flex flex-col gap-5 mb-10">
                  {plan.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-4 text-sm font-medium ${f.included ? 'text-gray-200' : 'text-gray-600'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${f.included ? (plan.popular ? 'bg-[var(--color-brand-500)] text-black shadow-[0_0_10px_var(--color-brand-500)]' : 'bg-white/10 text-white') : 'bg-transparent border border-white/5 text-gray-600'}`}>
                        {f.included ? <Check size={14} strokeWidth={3} /> : <X size={14} />}
                      </div>
                      {f.text}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-auto pt-4">
                  <Link 
                    href="/register" 
                    className={`group/btn relative overflow-hidden flex items-center justify-center w-full py-4 px-4 rounded-xl font-bold transition-all duration-300 ${plan.popular ? 'bg-[var(--color-brand-500)] text-black shadow-[0_0_20px_rgba(0,199,88,0.4)] hover:shadow-[0_0_30px_rgba(0,199,88,0.6)] hover:-translate-y-1' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:-translate-y-1'}`}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                    {plan.popular && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />}
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
