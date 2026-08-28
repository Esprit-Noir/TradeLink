"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useState } from "react"

import { ThemeToggle } from "@/components/ThemeToggle"
import { AccountSwitcher } from "@/components/layout/AccountSwitcher"
import { useTranslations } from "next-intl"
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
  Trophy,
} from "lucide-react"

type SidebarStats = {
  todayPnl: number
  todayTrades: number
  challengeStatus: "safe" | "warning" | "danger" | null
  challengeName: string | null
  challengePct: number
  features: Record<string, boolean>
  backtestAccess: boolean
}

const iconProps = { size: 18, strokeWidth: 1.75, style: { opacity: 0.9, flexShrink: 0 } }

interface SidebarProps {
  open?: boolean
  onClose?: () => void
  asDrawer?: boolean
  initialFeatures?: Record<string, boolean>
  initialBacktestAccess?: boolean
}

export function Sidebar({ open, onClose, asDrawer = false, initialFeatures = {}, initialBacktestAccess = false }: SidebarProps) {
  const pathname = usePathname()
  
  // Initialize stats with server-provided defaults for instant rendering
  const [stats, setStats] = useState<any>({
    features: initialFeatures,
    backtestAccess: initialBacktestAccess,
  })

  const t = useTranslations("Sidebar")
  
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkMedia = () => {
      setIsMobile(window.innerWidth <= 640)
      setIsTablet(window.innerWidth > 640 && window.innerWidth <= 1024)
    }
    checkMedia()
    window.addEventListener("resize", checkMedia)

    const stored = localStorage.getItem("sidebar_collapsed")
    if (stored === "true") setCollapsed(true)

    return () => window.removeEventListener("resize", checkMedia)
  }, [])

  const effectiveCollapsed = (isMobile || isTablet) ? false : collapsed

  const isOpen = open ?? mobileOpen
  const closeSidebar = () => {
    if (onClose) onClose()
    setMobileOpen(false)
  }

  const closeOnNav = () => {
    if (onClose) onClose()
    setMobileOpen(false)
  }

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(collapsed))
  }, [collapsed])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    fetch("/api/sidebar-stats")
      .then(r => r.json())
      .then(d => setStats((prev: any) => ({ ...prev, ...d })))
      .catch(() => {})
  }, [pathname])

  const navigation = [
    {
      section: "Overview",
      items: [
        { href: "/overview",   label: "Overview",    icon: () => <Eye {...iconProps} /> },
        { href: "/dashboard", label: t("dashboard"), icon: () => <LayoutDashboard {...iconProps} /> },
        { href: "/accounts",  label: "Accounts",  icon: () => <Wallet {...iconProps} /> },
        { href: "/calendar",  label: t("calendar"),  icon: () => <CalendarDays {...iconProps} /> },
        { href: "/achievements", label: "Achievements", icon: () => <Trophy {...iconProps} /> },
        { href: "/report",    label: "Monthly Report", icon: () => <FileText {...iconProps} /> },
        ...(stats?.features?.advancedStats ? [
          { href: "/stats",     label: "Statistics",icon: () => <BarChart3 {...iconProps} /> },
          { href: "/behavioral",label: "Behavioral", icon: () => <Brain {...iconProps} /> },
        ] : []),
        { href: "/notifications", label: "Notifications", icon: () => <Bell {...iconProps} /> },
      ],
    },
    {
      section: "Trades",
      items: [
        { href: "/trades",      label: t("trades"),  icon: () => <List {...iconProps} /> },
        { href: "/setups",      label: "Setups",      icon: () => <Layers {...iconProps} /> },
        { href: "/import",      label: t("import"),  icon: () => <Upload {...iconProps} /> },
        { href: "/risk",        label: t("risk"),        icon: () => <Shield {...iconProps} /> },
        { href: "/calculator",  label: "Calculator",  icon: () => <Calculator {...iconProps} /> },
        ...(stats?.backtestAccess || stats?.features?.replayAccess ? [
          { href: "/backtest",    label: "Replay",      icon: () => <CandlestickChart {...iconProps} /> },
        ] : []),
      ],
    },
    ...(stats?.features?.propFirmAccess ? [{
      section: "Challenges",
      items: [
        { href: "/challenges",  label: "Prop Firms",  icon: () => <Target {...iconProps} /> },
        { href: "/payouts",     label: "Payouts",     icon: () => <HandCoins {...iconProps} /> },
        { href: "/challenges/compare", label: "Compare", icon: () => <GitCompare {...iconProps} /> },
        { href: "/challenges/backtest", label: "Backtest", icon: () => <FlaskConical {...iconProps} /> },
      ],
    }] : []),
  ]

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <aside {...(asDrawer ? { role: "dialog", "aria-modal": "true" } : {})} className={`sidebar ${effectiveCollapsed ? "sidebar--collapsed" : ""} ${asDrawer ? "sidebar--drawer" : ""} ${isOpen ? "open" : ""}`}>
        {/* Mobile close */}
        <button className="sidebar-close" onClick={closeSidebar} aria-label="Close navigation">
          <X size={18} />
        </button>

        {/* Logo + collapse toggle */}
        <div className="sidebar-logo">
          {!effectiveCollapsed ? (
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
            aria-label={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {effectiveCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Account Switcher - hide when collapsed */}
        {!effectiveCollapsed && <div className="sidebar-account-switcher"><AccountSwitcher /></div>}



        {/* Nav */}
        <nav className="sidebar-nav">
          {navigation.map((section) => (
            <div key={section.section}>
              {!effectiveCollapsed && <div className="nav-section-label">{section.section}</div>}
              {effectiveCollapsed && <div style={{ height: 8 }} />}
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
                    title={effectiveCollapsed ? item.label : undefined}
                  >
                    <Icon />
                    {!effectiveCollapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <Link href="/profile" onClick={closeOnNav} className={`nav-item ${pathname === "/profile" ? "active" : ""}`} title={effectiveCollapsed ? t("settings") : undefined}>
            <Settings {...iconProps} />
            {!effectiveCollapsed && <span>{t("settings")}</span>}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="nav-item"
            title={effectiveCollapsed ? t("logout") : undefined}
            style={{ color: "var(--color-gray-400)" }}
          >
            <LogOut {...iconProps} />
            {!effectiveCollapsed && <span>{t("logout")}</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
