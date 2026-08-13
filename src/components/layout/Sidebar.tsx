"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { AccountSwitcher } from "@/components/layout/AccountSwitcher"
import { NotificationBell } from "@/components/layout/NotificationBell"
import { 
  LayoutDashboard, 
  Wallet, 
  CalendarDays, 
  BarChart3, 
  Brain, 
  List, 
  Layers, 
  Upload, 
  Shield, 
  Settings,
  LogOut,
  Target,
  GitCompare,
  FlaskConical
} from "lucide-react"

type SidebarStats = {
  todayPnl: number
  todayTrades: number
  challengeStatus: "safe" | "warning" | "danger" | null
  challengeName: string | null
  challengePct: number // % toward max drawdown used
}

// Basic props for all sidebar icons to look consistent and professional
const iconProps = { size: 18, strokeWidth: 1.75, style: { opacity: 0.9, flexShrink: 0 } }

export function Sidebar() {
  const pathname = usePathname()
  const [stats, setStats] = useState<SidebarStats | null>(null)

  useEffect(() => {
    fetch("/api/sidebar-stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [pathname]) // Refresh on navigation

  const navigation = [
    {
      section: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: () => <LayoutDashboard {...iconProps} /> },
        { href: "/accounts",  label: "Accounts",  icon: () => <Wallet {...iconProps} /> },
        { href: "/calendar",  label: "Calendar",  icon: () => <CalendarDays {...iconProps} /> },
        { href: "/stats",     label: "Statistics",icon: () => <BarChart3 {...iconProps} /> },
        { href: "/behavioral",label: "Behavioral", icon: () => <Brain {...iconProps} /> },
      ],
    },
    {
      section: "Trades",
      items: [
        { href: "/trades",      label: "All Trades",  icon: () => <List {...iconProps} /> },
        { href: "/setups",      label: "Setups",      icon: () => <Layers {...iconProps} /> },
        { href: "/import",      label: "Import CSV",  icon: () => <Upload {...iconProps} /> },
      ],
    },
    {
      section: "Challenges",
      items: [
        { href: "/challenges",  label: "Prop Firms",  icon: () => <Target {...iconProps} /> },
        { href: "/challenges/compare", label: "Compare", icon: () => <GitCompare {...iconProps} /> },
        { href: "/challenges/backtest", label: "Backtest", icon: () => <FlaskConical {...iconProps} /> },
      ],
    },
  ]

  const todayPnlPositive = stats && stats.todayPnl > 0
  const todayPnlNegative = stats && stats.todayPnl < 0

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: 28, height: 28,
            background: "var(--color-brand-500)",
            borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "-0.02em", color: "var(--color-gray-100)" }}>
            TradeLink
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>

      <AccountSwitcher />

      {/* Today's P&L Widget */}
      {stats !== null && (
        <div style={{
          margin: "0 0.5rem",
          padding: "0.75rem",
          borderRadius: "var(--radius-card)",
          background: todayPnlPositive
            ? "rgba(16, 185, 129, 0.08)"
            : todayPnlNegative
            ? "rgba(239, 68, 68, 0.08)"
            : "var(--color-gray-900)",
          border: `1px solid ${todayPnlPositive ? "rgba(16,185,129,0.2)" : todayPnlNegative ? "rgba(239,68,68,0.2)" : "var(--color-gray-800)"}`,
          transition: "all 300ms ease",
        }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-gray-500)", marginBottom: "0.35rem" }}>
            Today&apos;s P&L
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
            <span style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: todayPnlPositive ? "var(--color-profit)" : todayPnlNegative ? "var(--color-loss)" : "var(--color-gray-400)",
              fontVariantNumeric: "tabular-nums",
            }}>
              {stats.todayPnl >= 0 ? "+" : ""}${stats.todayPnl.toFixed(2)}
            </span>
            {stats.todayTrades > 0 && (
              <span style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>
                {stats.todayTrades} trade{stats.todayTrades > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {stats.todayTrades === 0 && (
            <div style={{ fontSize: "0.7rem", color: "var(--color-gray-600)", marginTop: "0.15rem" }}>No trades yet</div>
          )}
        </div>
      )}

      {/* Challenge Status Widget */}
      {stats?.challengeStatus && (
        <div style={{
          margin: "0.5rem 0.5rem 0",
          padding: "0.6rem 0.75rem",
          borderRadius: "var(--radius-card)",
          background: "var(--color-gray-900)",
          border: `1px solid ${
            stats.challengeStatus === "danger" ? "rgba(239,68,68,0.35)"
            : stats.challengeStatus === "warning" ? "rgba(245,158,11,0.3)"
            : "var(--color-gray-800)"
          }`,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-gray-500)" }}>
              {stats.challengeName || "Challenge"}
            </span>
            <span style={{
              fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.4rem", borderRadius: "4px",
              background: stats.challengeStatus === "danger" ? "rgba(239,68,68,0.15)"
                : stats.challengeStatus === "warning" ? "rgba(245,158,11,0.15)"
                : "rgba(16,185,129,0.1)",
              color: stats.challengeStatus === "danger" ? "var(--color-loss)"
                : stats.challengeStatus === "warning" ? "var(--color-warning)"
                : "var(--color-profit)",
            }}>
              {stats.challengeStatus === "danger" ? "⚠ RISK" : stats.challengeStatus === "warning" ? "CAUTION" : "SAFE"}
            </span>
          </div>
          {/* Drawdown progress bar */}
          <div style={{ background: "var(--color-gray-800)", borderRadius: "3px", height: "4px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(stats.challengePct, 100)}%`,
              borderRadius: "3px",
              background: stats.challengeStatus === "danger" ? "var(--color-loss)"
                : stats.challengeStatus === "warning" ? "var(--color-warning)"
                : "var(--color-profit)",
              transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
            }} />
          </div>
          <div style={{ fontSize: "0.65rem", color: "var(--color-gray-500)", marginTop: "0.35rem", textAlign: "right" }}>
            {stats.challengePct.toFixed(1)}% drawdown used
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav">
        {navigation.map((section) => (
          <div key={section.section}>
            <div className="nav-section-label">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = item.href === "/challenges"
                ? pathname === item.href
                : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--color-gray-800)", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <Link href="/profile" className={`nav-item ${pathname === "/profile" ? "active" : ""}`} style={{ gap: "0.625rem" }}>
          <Settings {...iconProps} />
          Profile
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item" 
          style={{ gap: "0.625rem", color: "var(--color-gray-400)", width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none" }}
        >
          <LogOut {...iconProps} />
          Logout
        </button>
      </div>
    </aside>
  )
}
