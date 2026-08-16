"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { AccountSwitcher } from "@/components/layout/AccountSwitcher"
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
  FlaskConical,
  CandlestickChart,
  HandCoins,
  FileText,
  Bell,
  Menu,
  X,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
  Calculator,
} from "lucide-react"

type SidebarStats = {
  todayPnl: number
  todayTrades: number
  challengeStatus: "safe" | "warning" | "danger" | null
  challengeName: string | null
  challengePct: number
}

const iconProps = { size: 18, strokeWidth: 1.75, style: { opacity: 0.9, flexShrink: 0 } }

export function Sidebar({
  open,
  onClose,
  asDrawer = false,
}: { open?: boolean; onClose?: () => void; asDrawer?: boolean } = {}) {
  const pathname = usePathname()
  const [stats, setStats] = useState<SidebarStats | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true"
    }
    return false
  })

  const isOpen = open ?? mobileOpen
  const closeSidebar = () => {
    if (onClose) onClose()
    setMobileOpen(false)
  }

  const closeOnNav = () => setMobileOpen(false)

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(collapsed))
  }, [collapsed])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  useEffect(() => {
    fetch("/api/sidebar-stats")
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
  }, [pathname])

  const navigation = [
    {
      section: "Overview",
      items: [
        { href: "/overview",   label: "Overview",    icon: () => <Eye {...iconProps} /> },
        { href: "/dashboard", label: "Dashboard", icon: () => <LayoutDashboard {...iconProps} /> },
        { href: "/accounts",  label: "Accounts",  icon: () => <Wallet {...iconProps} /> },
        { href: "/calendar",  label: "Calendar",  icon: () => <CalendarDays {...iconProps} /> },
        { href: "/report",    label: "Monthly Report", icon: () => <FileText {...iconProps} /> },
        { href: "/stats",     label: "Statistics",icon: () => <BarChart3 {...iconProps} /> },
        { href: "/behavioral",label: "Behavioral", icon: () => <Brain {...iconProps} /> },
        { href: "/notifications", label: "Notifications", icon: () => <Bell {...iconProps} /> },
      ],
    },
    {
      section: "Trades",
      items: [
        { href: "/trades",      label: "All Trades",  icon: () => <List {...iconProps} /> },
        { href: "/setups",      label: "Setups",      icon: () => <Layers {...iconProps} /> },
        { href: "/import",      label: "Import CSV",  icon: () => <Upload {...iconProps} /> },
        { href: "/risk",        label: "Risk",        icon: () => <Shield {...iconProps} /> },
        { href: "/calculator",  label: "Calculator",  icon: () => <Calculator {...iconProps} /> },
        { href: "/backtest",    label: "Replay",      icon: () => <CandlestickChart {...iconProps} /> },
      ],
    },
    {
      section: "Challenges",
      items: [
        { href: "/challenges",  label: "Prop Firms",  icon: () => <Target {...iconProps} /> },
        { href: "/payouts",     label: "Payouts",     icon: () => <HandCoins {...iconProps} /> },
        { href: "/challenges/compare", label: "Compare", icon: () => <GitCompare {...iconProps} /> },
        { href: "/challenges/backtest", label: "Backtest", icon: () => <FlaskConical {...iconProps} /> },
      ],
    },
  ]

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <div className="mobile-actions">
          <button className="mobile-hamburger" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""} ${asDrawer ? "sidebar--drawer" : ""} ${isOpen ? "open" : ""}`}>
        {/* Mobile close */}
        <button className="sidebar-close" onClick={closeSidebar} aria-label="Close navigation">
          <X size={18} />
        </button>

        {/* Logo + collapse toggle */}
        <div className="sidebar-logo">
          {!collapsed ? (
            <Link href="/overview" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <img src="/logo-light.png" alt="TradeLink" className="logo-light" style={{ height: "42px", objectFit: "contain" }} />
              <img src="/logo-dark.png" alt="TradeLink" className="logo-dark" style={{ height: "42px", objectFit: "contain" }} />
            </Link>
          ) : (
            <Link href="/overview" style={{ display: "flex", alignItems: "center", textDecoration: "none", overflow: "hidden", width: "36px", height: "36px" }}>
              <img src="/logo-light.png" alt="TradeLink" className="logo-light" style={{ height: "36px", width: "140px", maxWidth: "none", objectFit: "cover", objectPosition: "left" }} />
              <img src="/logo-dark.png" alt="TradeLink" className="logo-dark" style={{ height: "36px", width: "140px", maxWidth: "none", objectFit: "cover", objectPosition: "left" }} />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-collapse-btn"
            style={{ marginLeft: "auto" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Account Switcher - hide when collapsed */}
        {!collapsed && <AccountSwitcher />}

        {/* Challenge Status Widget - hide when collapsed */}
        {!collapsed && stats?.challengeStatus && (
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
                {stats.challengeStatus === "danger" ? "RISK" : stats.challengeStatus === "warning" ? "CAUTION" : "SAFE"}
              </span>
            </div>
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
              {!collapsed && <div className="nav-section-label">{section.section}</div>}
              {collapsed && <div style={{ height: 8 }} />}
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = item.href === "/challenges"
                  ? pathname === item.href
                  : pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeOnNav}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link href="/profile" onClick={closeOnNav} className={`nav-item ${pathname === "/profile" ? "active" : ""}`} title={collapsed ? "Profile" : undefined}>
            <Settings {...iconProps} />
            {!collapsed && <span>Profile</span>}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="nav-item"
            title={collapsed ? "Logout" : undefined}
            style={{ color: "var(--color-gray-400)" }}
          >
            <LogOut {...iconProps} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
