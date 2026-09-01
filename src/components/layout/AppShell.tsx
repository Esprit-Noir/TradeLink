"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { PrimarySidebar } from "./PrimarySidebar"
import { SecondarySidebar } from "./SecondarySidebar"
import { PageTransition } from "./PageTransition"
import { BacktestShell } from "./BacktestShell"
import { NotificationBell } from "./NotificationBell"
import { CommandPalette } from "./CommandPalette"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ChallengeStatusWidget } from "./ChallengeStatusWidget"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { ROINotification } from "@/components/prop-firm/ROINotification"

function getCategoryFromPath(pathname: string): string {
  if (pathname.startsWith("/stats") || pathname.startsWith("/behavioral") || pathname.startsWith("/notifications")) return "analytics"
  if (pathname.startsWith("/trades") || pathname.startsWith("/setups") || pathname.startsWith("/import") || pathname.startsWith("/risk") || pathname.startsWith("/calculator") || pathname.startsWith("/backtest")) return "trading"
  if (pathname.startsWith("/challenges") || pathname.startsWith("/payouts")) return "propfirms"
  if (pathname.startsWith("/profile")) return "settings"
  return "overview"
}

export function AppShell({
  children,
  initialFeatures = {},
  initialBacktestAccess = false,
}: {
  children: React.ReactNode
  initialFeatures?: Record<string, boolean>
  initialBacktestAccess?: boolean
}) {
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState(() => getCategoryFromPath(pathname))
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setActiveCategory(getCategoryFromPath(pathname))
  }, [pathname])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileDrawerOpen])

  if (pathname.startsWith("/backtest")) {
    return <BacktestShell>{children}</BacktestShell>
  }

  return (
    <div className="app-layout">
      <ROINotification />

      {/* Mobile backdrop */}
      {mobileDrawerOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setMobileDrawerOpen(false)} />
      )}

      {/* Primary + Secondary Sidebar */}
      <div className={`mobile-drawer ${mobileDrawerOpen ? "open" : ""}`}>
        <PrimarySidebar
          activeCategory={activeCategory}
          onCategoryChange={(id) => {
            setActiveCategory(id)
            if (isMobile) setMobileDrawerOpen(false)
          }}
          featureFlags={initialFeatures}
        />
        <SecondarySidebar
          activeCategory={activeCategory}
          featureFlags={initialFeatures}
          backtestAccess={initialBacktestAccess}
        />
      </div>

      {/* Main content */}
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu-btn"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="topbar-breadcrumb">
              <span className="topbar-breadcrumb-category">{getCategoryTitle(activeCategory)}</span>
            </div>
          </div>

          <div className="topbar-right">
            <ChallengeStatusWidget />
            <LanguageSwitcher />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>

        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}

function getCategoryTitle(category: string): string {
  switch (category) {
    case "overview": return "Overview"
    case "analytics": return "Analytics"
    case "trading": return "Trading"
    case "propfirms": return "Prop Firms"
    case "settings": return "Settings"
    default: return ""
  }
}
