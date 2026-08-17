"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react"
import Image from "next/image"

export function MarketingNav({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="marketing-nav">
      <div className="marketing-nav-inner">
        <Link href="/" className="marketing-logo">
          <Image src="/logo-light.png" alt="TradeLink" width={150} height={50} priority className="marketing-logo-img logo-light" />
          <Image src="/logo-dark.png" alt="TradeLink" width={150} height={50} priority className="marketing-logo-img logo-dark" />
        </Link>

        <div className="marketing-nav-links">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Reviews</a>
        </div>

        <div className="marketing-nav-actions">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="btn btn-ghost"><LayoutDashboard size={16} /> Dashboard</Link>
              <Link href="/api/auth/signout" className="btn btn-primary"><LogOut size={16} /> Log Out</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/register" className="btn btn-primary">Start Free</Link>
            </>
          )}
        </div>

        <button className="marketing-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="marketing-mobile-menu">
          <a href="#features" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="#testimonials" onClick={() => setMobileOpen(false)}>Reviews</a>
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <Link href="/api/auth/signout" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Log Out</Link>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
              <Link href="/register" className="btn btn-primary" onClick={() => setMobileOpen(false)}>Start Free</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
