"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import Image from "next/image"

export function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
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
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b ${scrolled ? 'bg-black/80 backdrop-blur-xl border-white/10' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center text-white font-bold">
          <Image src="/logo-dark.png" alt="TradeLink" width={200} height={48} priority className="h-12 w-auto object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
          <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
          <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Reviews</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors text-sm">
                Dashboard
                <LayoutDashboard size={16} />
              </Link>
              <Link href="/api/auth/signout" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent border border-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm">
                <LogOut size={16} />
                Log Out
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent hover:text-white text-gray-400 font-medium transition-colors text-sm">
                Log in
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors text-sm">
                Start Free
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden p-2 text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden flex flex-col px-6 pb-6 bg-black/95 backdrop-blur-xl border-b border-white/10">
          <a href="#features" className="py-3 text-gray-400 border-b border-white/10" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#pricing" className="py-3 text-gray-400 border-b border-white/10" onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="#testimonials" className="py-3 text-gray-400 border-b border-white/10" onClick={() => setMobileOpen(false)}>Reviews</a>
          <div className="pt-4 flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors text-sm" onClick={() => setMobileOpen(false)}>
                  Dashboard
                  <LayoutDashboard size={16} />
                </Link>
                <Link href="/api/auth/signout" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent border border-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm" onClick={() => setMobileOpen(false)}>
                  <LogOut size={16} />
                  Log Out
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent border border-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm" onClick={() => setMobileOpen(false)}>Log in</Link>
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-400)] text-black font-semibold rounded-lg transition-colors text-sm" onClick={() => setMobileOpen(false)}>Start Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
