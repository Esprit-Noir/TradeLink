"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { PageTransition } from "./PageTransition"
import { BacktestShell } from "./BacktestShell"
import { NotificationBell } from "./NotificationBell"
import { CommandPalette } from "./CommandPalette"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ChallengeStatusWidget } from "./ChallengeStatusWidget"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"

import { ROINotification } from "@/components/prop-firm/ROINotification"

export function AppShell({ 
  children,
  initialFeatures = {},
  initialBacktestAccess = false,
}: { 
  children: React.ReactNode 
  initialFeatures?: Record<string, boolean>
  initialBacktestAccess?: boolean
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  if (pathname.startsWith("/backtest")) {
    return <BacktestShell>{children}</BacktestShell>
  }

  return (
    <div className="app-layout">
      <ROINotification />
      <Sidebar 
        open={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        initialFeatures={initialFeatures}
        initialBacktestAccess={initialBacktestAccess}
      />
      <main className="main-content">
        <div className="topbar-actions">
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="topbar-spacer">
            <CommandPalette />
          </div>
          <ChallengeStatusWidget />
          <LanguageSwitcher />
          <NotificationBell />
          <ThemeToggle />
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
