"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
      { href: "/calendar",  label: "Calendar",  icon: IconCalendar },
      { href: "/behavioral",label: "Behavioral", icon: IconBrain },
    ],
  },
  {
    section: "Trades",
    items: [
      { href: "/trades",      label: "All Trades",  icon: IconList },
      { href: "/trades/new",  label: "Add Trade",   icon: IconPlus },
      { href: "/import",      label: "Import CSV",  icon: IconUpload },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
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
      <div style={{ padding: "0.75rem", borderTop: "1px solid var(--color-gray-800)", marginTop: "auto" }}>
        <Link href="/settings" className="nav-item" style={{ gap: "0.625rem" }}>
          <IconSettings />
          Settings
        </Link>
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

function IconList() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M3 4h10M3 8h10M3 12h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
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
