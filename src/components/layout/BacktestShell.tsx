"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "./Sidebar"
import { WatchlistPanel } from "./WatchlistPanel"
import { PageTransition } from "./PageTransition"

/**
 * Layout for the backtest page: the classic sidebar is replaced by the dynamic
 * watchlist (left column). The nav stays reachable through a slide-over drawer
 * (hamburger) and the mobile top bar.
 */
export function BacktestShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false)
  const [watchlistCollapsed, setWatchlistCollapsed] = useState(false)

  useEffect(() => {
    const handleToggle = () => setWatchlistCollapsed((v) => !v)
    window.addEventListener("toggle-watchlist", handleToggle)
    return () => window.removeEventListener("toggle-watchlist", handleToggle)
  }, [])

  return (
    <>
      <div className={`app-layout backtest-app-layout ${watchlistCollapsed ? "watchlist-collapsed" : ""}`}>
        {!watchlistCollapsed && (
          <div className="backtest-left">
            <WatchlistPanel onOpenNav={() => setNavOpen(true)} />
          </div>
        )}
        <main className="main-content">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      {navOpen && <div className="sidebar-backdrop sidebar-backdrop--drawer" onClick={() => setNavOpen(false)} />}
      <Sidebar open={navOpen ? true : undefined} onClose={() => setNavOpen(false)} asDrawer />
    </>
  )
}