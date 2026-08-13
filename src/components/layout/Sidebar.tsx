"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { AccountSwitcher } from "@/components/layout/AccountSwitcher"

type SidebarStats = {
  todayPnl: number
  todayTrades: number
  challengeStatus: "safe" | "warning" | "danger" | null
  challengeName: string | null
  challengePct: number // % toward max drawdown used
}

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
        { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
        { href: "/accounts",  label: "Accounts",  icon: IconWallet },
        { href: "/calendar",  label: "Calendar",  icon: IconCalendar },
        { href: "/stats",     label: "Statistics",icon: IconChart },
        { href: "/behavioral",label: "Behavioral", icon: IconBrain },
      ],
    },
    {
      section: "Trades",
      items: [
        { href: "/trades",      label: "All Trades",  icon: IconList },
        { href: "/setups",      label: "Setups",      icon: IconLayers },
        { href: "/import",      label: "Import CSV",  icon: IconUpload },
      ],
    },
    {
      section: "Challenges",
      items: [
        { href: "/challenges",  label: "Prop Firms",  icon: IconTarget },
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
        <ThemeToggle />
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
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
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
          <IconSettings />
          Profile
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item" 
          style={{ gap: "0.625rem", color: "var(--color-gray-400)", width: "100%", textAlign: "left", cursor: "pointer", background: "transparent", border: "none" }}
        >
          <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
            <path d="M6 14H3.5C2.67157 14 2 13.3284 2 12.5V3.5C2 2.67157 2.67157 2 3.5 2H6M11.5 11.5L15 8M15 8L11.5 4.5M15 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}

// ── Inline SVG Icons ────────────────────────────────────────────────────────
function IconDashboard() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  )
}

function IconChart() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M2 14H14M3.5 10L6.5 6L9.5 9L13.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M5 1v3M11 1v3M1.5 6.5h13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconBrain() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M8 2C5.5 2 3.5 3.8 3.5 6c0 1.2.6 2.2 1.5 2.9V13h2v-1h2v1h2V8.9c.9-.7 1.5-1.7 1.5-2.9C12.5 3.8 10.5 2 8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M6 8.5v-2M8 8.5V6M10 8.5v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconWallet() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16">
      <path d="M14.5 11.5C14.5 12.3284 13.8284 13 13 13H3C2.17157 13 1.5 12.3284 1.5 11.5V4.5C1.5 3.67157 2.17157 3 3 3H13C13.8284 3 14.5 3.67157 14.5 4.5V11.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 8H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5 6.5H1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconList() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconUpload() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.5 11v1.5A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.3 3.3l.9.9M11.8 11.8l.9.9M3.3 12.7l.9-.9M11.8 4.2l.9-.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconTarget() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
    </svg>
  )
}

function IconLayers() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M1.5 5.5L8 2l6.5 3.5L8 9l-6.5-3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 8.5L8 12l6.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 11.5L8 15l6.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
