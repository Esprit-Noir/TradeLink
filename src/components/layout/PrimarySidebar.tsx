"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  BarChart3,
  CandlestickChart,
  Target,
  User,
  LogOut,
  BookOpen,
} from "lucide-react"

export interface NavCategory {
  id: string
  icon: React.ReactNode
  label: string
  href?: string
}

interface PrimarySidebarProps {
  activeCategory: string
  onCategoryChange: (id: string) => void
  featureFlags: Record<string, boolean>
}

export function PrimarySidebar({ activeCategory, onCategoryChange, featureFlags }: PrimarySidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("Sidebar")

  const categories: NavCategory[] = [
    {
      id: "overview",
      icon: <LayoutDashboard size={20} strokeWidth={1.75} />,
      label: t("dashboard"),
      href: "/overview",
    },
    {
      id: "analytics",
      icon: <BarChart3 size={20} strokeWidth={1.75} />,
      label: "Analytics",
      href: "/stats",
    },
    {
      id: "trading",
      icon: <CandlestickChart size={20} strokeWidth={1.75} />,
      label: t("trades"),
      href: "/trades",
    },
    {
      id: "playbooks",
      icon: <BookOpen size={20} strokeWidth={1.75} />,
      label: "Playbooks",
      href: "/playbooks",
    },
    ...(featureFlags.propFirmAccess
      ? [
          {
            id: "propfirms",
            icon: <Target size={20} strokeWidth={1.75} />,
            label: "Prop Firms",
            href: "/challenges",
          },
        ]
      : []),
  ]

  const isActive = (cat: NavCategory) => {
    if (cat.href) {
      return pathname === cat.href || pathname.startsWith(cat.href)
    }
    return cat.id === activeCategory
  }

  return (
    <aside className="psidebar">
      {/* Logo */}
      <div className="psidebar-logo">
        <Link href="/overview" className="psidebar-logo-link">
          <div className="psidebar-logo-mark">
            <Image src="/icon.png" alt="TradeLink" width={1024} height={1024} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </Link>
      </div>

      {/* Category icons */}
      <nav className="psidebar-nav">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              if (cat.href) {
                router.push(cat.href)
              } else {
                onCategoryChange(cat.id)
              }
            }}
            className={`psidebar-item ${isActive(cat) ? "active" : ""}`}
            title={cat.label}
          >
            {cat.icon}
            {isActive(cat) && <span className="psidebar-indicator" />}
          </button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="psidebar-footer">
        <button
          onClick={() => onCategoryChange("settings")}
          className={`psidebar-item ${activeCategory === "settings" ? "active" : ""}`}
          title="Settings"
        >
          <User size={20} strokeWidth={1.75} />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="psidebar-item"
          title={t("logout")}
        >
          <LogOut size={20} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  )
}
