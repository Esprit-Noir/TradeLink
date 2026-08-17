"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Send } from "lucide-react"

export function MarketingFooter() {
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail("")
    }
  }

  return (
    <footer className="marketing-footer">
      <div className="marketing-section-inner">
        <div className="marketing-footer-top">
          <div className="marketing-footer-newsletter glass-card">
            <h3 className="marketing-footer-newsletter-title">Stay Updated</h3>
            <p className="marketing-footer-newsletter-desc">
              Get trading tips, product updates, and market insights delivered weekly.
            </p>
            {subscribed ? (
              <div className="marketing-footer-newsletter-success">
                <Send size={16} />
                <span>You&apos;re subscribed! Check your inbox.</span>
              </div>
            ) : (
              <form className="marketing-footer-newsletter-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="marketing-footer-newsletter-input"
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Send size={14} />
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="marketing-footer-grid">
          <div className="marketing-footer-brand">
            <Link href="/" className="marketing-logo">
              <Image src="/logo-dark.png" alt="TradeLink" width={150} height={36} className="marketing-logo-img" />
            </Link>
            <p className="marketing-footer-tagline">
              The modern trading journal for serious traders.
            </p>
          </div>

          <div className="marketing-footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#testimonials">Reviews</a>
            <a href="/login">Log in</a>
          </div>

          <div className="marketing-footer-col">
            <h4>Resources</h4>
            <a href="#">Documentation</a>
            <a href="#">API</a>
            <a href="#">Blog</a>
            <a href="#">Changelog</a>
          </div>

          <div className="marketing-footer-col">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Careers</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>

        <div className="marketing-footer-bottom">
          <p>&copy; {new Date().getFullYear()} TradeLink. All rights reserved.</p>
          <div className="marketing-footer-socials">
            <a href="#" aria-label="Twitter">𝕏</a>
            <a href="#" aria-label="Discord">Discord</a>
            <a href="#" aria-label="YouTube">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
