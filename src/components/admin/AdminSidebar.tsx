"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ScrollText,
  LifeBuoy,
  LogOut,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"

const iconProps = { size: 18, strokeWidth: 1.75, style: { opacity: 0.9, flexShrink: 0 } }

const navigation = [
  { href: "/admin", label: "Dashboard", icon: () => <LayoutDashboard {...iconProps} /> },
  { href: "/admin/users", label: "Users", icon: () => <Users {...iconProps} /> },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: () => <CreditCard {...iconProps} /> },
  { href: "/admin/logs", label: "Audit Logs", icon: () => <ScrollText {...iconProps} /> },
  { href: "/admin/support", label: "Support", icon: () => <LifeBuoy {...iconProps} /> },
]

export function AdminSidebar() {
  const pathname = usePathname()
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

    const stored = localStorage.getItem("admin_sidebar_collapsed")
    if (stored === "true") setCollapsed(true)

    return () => window.removeEventListener("resize", checkMedia)
  }, [])

  const effectiveCollapsed = (isMobile || isTablet) ? false : collapsed

  const handleToggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("admin_sidebar_collapsed", String(next))
  }

  return (
    <aside className={`sidebar ${effectiveCollapsed ? "sidebar--collapsed" : ""}`} style={{ borderRight: "1px solid var(--color-gray-800)", background: "var(--color-gray-900)" }}>
      {/* Logo */}
      <div className="sidebar-logo">
        {!effectiveCollapsed ? (
          <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{
              width: 30, height: 30, minWidth: 30,
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={16} color="white" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem", letterSpacing: "-0.02em", color: "var(--color-gray-100)", whiteSpace: "nowrap" }}>
                Admin
              </span>
              <span style={{ fontSize: "0.6rem", color: "var(--color-gray-500)", whiteSpace: "nowrap" }}>
                TradeLink Panel
              </span>
            </div>
          </Link>
        ) : <div />}
        <button
          onClick={handleToggle}
          className="sidebar-collapse-btn"
          style={{ marginLeft: "auto" }}
          title={effectiveCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {effectiveCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {/* Admin Badge */}
      {!effectiveCollapsed && (
        <div style={{ margin: "0 0.5rem", padding: "0.4rem 0.6rem", borderRadius: 6, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", gap: 6 }}>
          <Shield size={12} style={{ color: "#8b5cf6" }} />
          <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Admin Mode
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="sidebar-nav" style={{ marginTop: "0.5rem" }}>
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
              title={effectiveCollapsed ? item.label : undefined}
            >
              <Icon />
              {!effectiveCollapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link href="/dashboard" className="nav-item" title={effectiveCollapsed ? "Back to App" : undefined}>
          <LayoutDashboard {...iconProps} />
          {!effectiveCollapsed && <span>Back to App</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="nav-item"
          title={effectiveCollapsed ? "Logout" : undefined}
          style={{ color: "var(--color-gray-400)" }}
        >
          <LogOut {...iconProps} />
          {!effectiveCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
