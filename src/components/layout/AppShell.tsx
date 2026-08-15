"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { PageTransition } from "./PageTransition"
import { BacktestShell } from "./BacktestShell"
import { NotificationBell } from "./NotificationBell"
import { ThemeToggle } from "@/components/ThemeToggle"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname.startsWith("/backtest")) {
    return <BacktestShell>{children}</BacktestShell>
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar-actions">
          <NotificationBell />
          <ThemeToggle />
        </div>
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
