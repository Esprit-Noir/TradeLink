"use client"

import { Sidebar } from "./Sidebar"
import { PageTransition } from "./PageTransition"

/**
 * Layout for the backtest page: the classic sidebar is replaced by the dynamic
 * watchlist (left column). The nav stays reachable through a slide-over drawer
 * (hamburger) and the mobile top bar.
 */
export function BacktestShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-layout backtest-app-layout watchlist-collapsed">
      <main className="main-content">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}