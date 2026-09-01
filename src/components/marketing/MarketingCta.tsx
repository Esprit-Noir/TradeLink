"use client"

import { ArrowRight, Shield, CreditCard, Clock } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { motion } from "framer-motion"

export function MarketingCta({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const t = useTranslations("Marketing.Cta")
  return (
    <section className="py-24 bg-[#050505] border-t border-white/[0.04]">
      <div className="max-w-[640px] mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            {t("title1")} <span className="text-[var(--color-brand-500)]">{t("title2")}</span>
          </h2>
          <p className="text-sm text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">{t("subtitle")}</p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[{ icon: Shield, text: t("f1") }, { icon: CreditCard, text: t("f2") }, { icon: Clock, text: t("f3") }].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-xs text-gray-400"><Icon size={12} className="text-[var(--color-brand-500)]" />{text}</span>
            ))}
          </div>

          {isLoggedIn ? (
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-500)] text-black font-semibold text-sm rounded-lg hover:bg-[var(--color-brand-400)] transition-colors">
              {t("dashboard")} <ArrowRight size={14} />
            </Link>
          ) : (
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-500)] text-black font-semibold text-sm rounded-lg hover:bg-[var(--color-brand-400)] transition-colors">
              {t("startFree")} <ArrowRight size={14} />
            </Link>
          )}

          <p className="mt-5 text-[11px] text-gray-600">{t("disclaimer")}</p>
        </motion.div>
      </div>
    </section>
  )
}
