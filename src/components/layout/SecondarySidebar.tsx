"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

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
  Target,
  GitCompare,
  FlaskConical,
  CandlestickChart,
  HandCoins,
  FileText,
  Bell,
  Settings,
  Trophy,
  Calculator,
  Eye,
} from "lucide-react"

const iconProps = { size: 16, strokeWidth: 1.75, style: { opacity: 0.9, flexShrink: 0 } as React.CSSProperties }

interface SecondarySidebarProps {
  activeCategory: string
  featureFlags: Record<string, boolean>
  backtestAccess: boolean
}

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export function SecondarySidebar({ activeCategory, featureFlags, backtestAccess }: SecondarySidebarProps) {
  const pathname = usePathname()
  const t = useTranslations("Sidebar")

  const getNavigation = (): NavSection[] => {
    switch (activeCategory) {
      case "overview":
        return [
          {
            items: [
              { href: "/overview", label: "Overview", icon: <Eye {...iconProps} /> },
              { href: "/dashboard", label: t("dashboard"), icon: <LayoutDashboard {...iconProps} /> },
              { href: "/accounts", label: "Accounts", icon: <Wallet {...iconProps} /> },
              { href: "/calendar", label: t("calendar"), icon: <CalendarDays {...iconProps} /> },
              { href: "/achievements", label: "Achievements", icon: <Trophy {...iconProps} /> },
              { href: "/report", label: "Monthly Report", icon: <FileText {...iconProps} /> },
            ],
          },
        ]

      case "analytics":
        return [
          {
            title: "Performance",
            items: [
              { href: "/stats", label: "Statistics", icon: <BarChart3 {...iconProps} /> },
              { href: "/behavioral", label: "Behavioral", icon: <Brain {...iconProps} /> },
            ],
          },
          {
            title: "Alerts",
            items: [
              { href: "/notifications", label: "Notifications", icon: <Bell {...iconProps} /> },
            ],
          },
        ]

      case "trading":
        return [
          {
            title: "Manage",
            items: [
              { href: "/trades", label: t("trades"), icon: <List {...iconProps} /> },
              { href: "/setups", label: "Setups", icon: <Layers {...iconProps} /> },
              { href: "/import", label: t("import"), icon: <Upload {...iconProps} /> },
            ],
          },
          {
            title: "Tools",
            items: [
              { href: "/risk", label: t("risk"), icon: <Shield {...iconProps} /> },
              { href: "/calculator", label: "Calculator", icon: <Calculator {...iconProps} /> },
              ...(backtestAccess || featureFlags.replayAccess
                ? [{ href: "/backtest", label: "Replay", icon: <CandlestickChart {...iconProps} /> }]
                : []),
            ],
          },
        ]

      case "propfirms":
        return [
          {
            items: [
              { href: "/challenges", label: "Prop Firms", icon: <Target {...iconProps} /> },
              { href: "/payouts", label: "Payouts", icon: <HandCoins {...iconProps} /> },
              { href: "/challenges/compare", label: "Compare", icon: <GitCompare {...iconProps} /> },
              { href: "/challenges/backtest", label: "Backtest", icon: <FlaskConical {...iconProps} /> },
            ],
          },
        ]

      case "settings":
        return [
          {
            items: [
              { href: "/profile", label: t("settings"), icon: <Settings {...iconProps} /> },
            ],
          },
        ]

      default:
        return []
    }
  }

  const navigation = getNavigation()

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case "overview": return "Overview"
      case "analytics": return "Analytics"
      case "trading": return "Trading"
      case "propfirms": return "Prop Firms"
      case "settings": return "Settings"
      default: return ""
    }
  }

  return (
    <aside className="ssidebar">
      {/* Header */}
      <div className="ssidebar-header">
        <div className="ssidebar-title">{getCategoryTitle()}</div>
      </div>

      {/* Account Switcher */}
      <div className="ssidebar-account">
        <AccountSwitcher />
      </div>

      {/* Navigation */}
      <nav className="ssidebar-nav" key={activeCategory}>
        {navigation.map((section, si) => (
          <div key={si} className="ssidebar-section">
            {section.title && (
              <div className="ssidebar-section-label">{section.title}</div>
            )}
            {section.items.map((item) => {
              const isActive =
                item.href === "/challenges"
                  ? pathname === item.href
                  : pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ssidebar-link ${isActive ? "active" : ""}`}
                >
                  <span className="ssidebar-link-icon">{item.icon}</span>
                  <span className="ssidebar-link-label">{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
