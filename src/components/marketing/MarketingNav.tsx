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
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex justify-center px-4 mt-4">
      <div className={`w-full max-w-[1100px] transition-all duration-300 rounded-xl ${scrolled ? 'bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.06] shadow-[0_2px_16px_rgba(0,0,0,0.3)]' : 'bg-transparent border-transparent'}`}>
        <div className="px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo-dark.png" alt="TradeLink" width={160} height={40} className="h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-7">
            <a href="#features" className="text-xs text-gray-400 hover:text-white transition-colors">{t("features")}</a>
            <a href="#pricing" className="text-xs text-gray-400 hover:text-white transition-colors">{t("pricing")}</a>
            <a href="#testimonials" className="text-xs text-gray-400 hover:text-white transition-colors">{t("reviews")}</a>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[var(--color-brand-500)] text-black font-semibold text-xs rounded-lg transition-colors hover:bg-[var(--color-brand-400)]">
                  {t("dashboard")} <LayoutDashboard size={13} />
                </Link>
                <Link href="/api/auth/signout" className="inline-flex items-center gap-1.5 px-4 py-1.5 text-gray-400 hover:text-white text-xs transition-colors">
                  <LogOut size={13} /> {t("logout")}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-colors">
                  {t("login")}
                </Link>
                <Link href="/register" className="px-4 py-1.5 bg-[var(--color-brand-500)] text-black font-semibold text-xs rounded-lg transition-colors hover:bg-[var(--color-brand-400)]">
                  {t("startFree")}
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-1.5 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden flex flex-col px-5 pb-5 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] rounded-b-xl">
            <a href="#features" className="py-3 text-xs text-gray-400 border-b border-white/[0.04] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t("features")}</a>
            <a href="#pricing" className="py-3 text-xs text-gray-400 border-b border-white/[0.04] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t("pricing")}</a>
            <a href="#testimonials" className="py-3 text-xs text-gray-400 border-b border-white/[0.04] hover:text-white transition-colors" onClick={() => setMobileOpen(false)}>{t("reviews")}</a>
            <div className="py-3 border-b border-white/[0.04] flex justify-between items-center text-gray-400 text-xs">
              {t("language")} <LanguageSwitcher />
            </div>
            <div className="pt-4 flex flex-col gap-2">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--color-brand-500)] text-black font-semibold text-xs rounded-lg" onClick={() => setMobileOpen(false)}>
                    {t("dashboard")} <LayoutDashboard size={13} />
                  </Link>
                  <Link href="/api/auth/signout" className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-gray-400 text-xs" onClick={() => setMobileOpen(false)}>
                    <LogOut size={13} /> {t("logout")}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="inline-flex items-center justify-center px-4 py-2 bg-white/5 border border-white/[0.06] text-white text-xs rounded-lg" onClick={() => setMobileOpen(false)}>{t("login")}</Link>
                  <Link href="/register" className="inline-flex items-center justify-center px-4 py-2 bg-[var(--color-brand-500)] text-black font-semibold text-xs rounded-lg" onClick={() => setMobileOpen(false)}>{t("startFree")}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
