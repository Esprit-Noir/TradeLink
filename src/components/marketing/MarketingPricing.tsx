"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { Check } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

type DbPlan = {
  id: string; name: string; price: number; maxAccounts: number
  maxTradesPerMonth: number | null; backtestAccess: boolean; features: Record<string, boolean>
}

export function MarketingPricing({ plans = [] }: { plans?: DbPlan[] }) {
  const t = useTranslations("Marketing.Pricing")
  const [annual, setAnnual] = useState(false)

  const items = plans.map(p => {
    const isPro = p.name.toLowerCase() === "pro"
    const monthly = p.price
    const yearly = parseFloat((monthly * 0.6).toFixed(2))
    const price = annual ? yearly : monthly
    return {
      name: p.name,
      price: `$${price.toString().replace(/\.00$/, "")}`,
      period: annual ? "/mo billed annually" : t("period"),
      desc: isPro ? t("descPro") : t("descBasic"),
      popular: isPro,
      features: [
        { text: p.maxAccounts >= 10 ? t("f1Unlimited") : t("f1Limited", { count: p.maxAccounts }), ok: true },
        { text: p.maxTradesPerMonth ? t("f2Limited", { count: p.maxTradesPerMonth }) : t("f2Unlimited"), ok: true },
        { text: t("f3"), ok: true },
        { text: t("f4"), ok: true },
        { text: t("f5"), ok: !!p.features?.advancedStats },
        { text: t("f6"), ok: !!p.features?.replayAccess || p.backtestAccess },
        { text: t("f7"), ok: !!p.features?.propFirmAccess },
      ],
      cta: isPro ? t("ctaPro") : t("ctaBasic"),
    }
  })

  return (
    <section id="pricing" className="py-24 bg-[#0a0a0a] border-t border-white/[0.04]">
      <div className="max-w-[1000px] mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            {t("title1")} <span className="text-[var(--color-brand-500)]">{t("title2")}</span>
          </h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">{t("subtitle")}</p>
          <div className="inline-flex items-center gap-1 p-0.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <button onClick={() => setAnnual(false)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${!annual ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}>Mensuel</button>
            <button onClick={() => setAnnual(true)} className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${annual ? "bg-white text-black" : "text-gray-400 hover:text-white"}`}>
              Annuel <span className="text-[9px] font-semibold text-[var(--color-brand-500)] bg-[var(--color-brand-500)]/10 px-1.5 py-0.5 rounded">-40%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((plan, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
              className={`relative flex flex-col bg-[#050505] border rounded-xl p-6 ${plan.popular ? "border-[var(--color-brand-500)]/25 md:-mt-3 md:mb-[-0.75rem] z-10" : "border-white/[0.06]"}`}>
              {plan.popular && <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-semibold text-[var(--color-brand-500)] bg-[#050505] border border-[var(--color-brand-500)]/20 px-2.5 py-0.5 rounded-full">Popular</span>}
              <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-xs text-gray-500">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">{plan.desc}</p>
              <div className="w-full h-px bg-white/[0.04] mb-5" />
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className={`flex items-center gap-2 text-xs ${f.ok ? "text-gray-300" : "text-gray-600"}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${f.ok ? (plan.popular ? "bg-[var(--color-brand-500)] text-black" : "bg-white/10 text-white") : "border border-white/[0.06] text-gray-600"}`}>
                      <Check size={9} strokeWidth={3} />
                    </div>
                    {f.text}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`flex items-center justify-center w-full py-2.5 rounded-lg font-semibold text-xs transition-colors ${plan.popular ? "bg-[var(--color-brand-500)] text-black hover:bg-[var(--color-brand-400)]" : "bg-white/5 border border-white/[0.06] hover:bg-white/10 text-white"}`}>
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">🛡️ <span className="text-gray-400">Garantie 14 jours</span> — Remboursement complet, sans question</p>
      </div>
    </section>
  )
}
