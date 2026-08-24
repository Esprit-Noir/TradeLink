"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"

export function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const t = useTranslations("Marketing.Nav")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-center mt-4 px-4 transition-all duration-500">
      <div className={`w-full max-w-[1200px] transition-all duration-500 rounded-2xl ${scrolled ? 'bg-[#0a0a0a]/70 backdrop-blur-xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent border-transparent'}`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center text-white font-bold">
            <Image src="/logo-dark.png" alt="TradeLink" width={200} height={48} priority className="h-10 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide">{t("features")}</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide">{t("pricing")}</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium tracking-wide">{t("reviews")}</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_var(--color-brand-500)] hover:shadow-[0_0_25px_var(--color-brand-500)] hover:-translate-y-0.5 text-sm">
                  {t("dashboard")}
                  <LayoutDashboard size={16} />
                </Link>
                <Link href="/api/auth/signout" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all hover:-translate-y-0.5 text-sm">
                  <LogOut size={16} />
                  {t("logout")}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:text-white text-gray-400 font-medium transition-colors text-sm">
                  {t("login")}
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(0,199,88,0.4)] hover:shadow-[0_0_25px_rgba(0,199,88,0.6)] hover:-translate-y-0.5 text-sm">
                  {t("startFree")}
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden flex flex-col px-6 pb-6 bg-[#0a0a0a]/95 backdrop-blur-3xl border-t border-white/10 rounded-b-2xl mt-2">
            <a href="#features" className="py-4 text-gray-400 border-b border-white/10 hover:text-white transition-colors font-medium" onClick={() => setMobileOpen(false)}>{t("features")}</a>
            <a href="#pricing" className="py-4 text-gray-400 border-b border-white/10 hover:text-white transition-colors font-medium" onClick={() => setMobileOpen(false)}>{t("pricing")}</a>
            <a href="#testimonials" className="py-4 text-gray-400 border-b border-white/10 hover:text-white transition-colors font-medium" onClick={() => setMobileOpen(false)}>{t("reviews")}</a>
            <div className="py-4 border-b border-white/10 flex justify-between items-center text-gray-400 font-medium">
              {t("language")}
              <LanguageSwitcher />
            </div>
            <div className="pt-6 flex flex-col gap-4">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand-500)] text-black font-semibold rounded-xl text-sm" onClick={() => setMobileOpen(false)}>
                    {t("dashboard")}
                  <LayoutDashboard size={16} />
                  </Link>
                  <Link href="/api/auth/signout" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl text-sm" onClick={() => setMobileOpen(false)}>
                    <LogOut size={16} />
                  {t("logout")}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white/5 border border-white/10 text-white font-medium rounded-xl text-sm" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[var(--color-brand-500)] text-black font-semibold rounded-xl text-sm shadow-[0_0_15px_rgba(0,199,88,0.4)]" onClick={() => setMobileOpen(false)}>{t("startFree")}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
