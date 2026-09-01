"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"

export function MarketingHowItWorks() {
  const t = useTranslations("Marketing.HowItWorks")

  const STEPS = [
    { num: "1", title: t("step1Title"), desc: t("step1Desc") },
    { num: "2", title: t("step2Title"), desc: t("step2Desc") },
    { num: "3", title: t("step3Title"), desc: t("step3Desc") },
  ]

  return (
    <section className="py-24 bg-[#0a0a0a] border-y border-white/[0.04]">
      <div className="max-w-[900px] mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-3">
            {t("title1")} <span className="text-[var(--color-brand-500)]">{t("title2")}</span>
          </h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">{t("subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }} className="text-center">
              <div className="w-10 h-10 rounded-full bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/20 flex items-center justify-center text-sm font-bold text-[var(--color-brand-500)] mx-auto mb-4">
                {step.num}
              </div>
              <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[260px] mx-auto">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
