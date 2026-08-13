"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard"
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (!res?.error) {
        router.push(callbackUrl)
      } else {
        setError("Invalid email or password.")
      }
    } catch (err) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  // Utilisation temporaire du mode "Démo" ou Inscription
  const handleDemoLogin = () => {
    setEmail("demo@tradelink.com")
    setPassword("password123")
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
      background: "radial-gradient(circle at top, var(--color-brand-900) 0%, var(--color-gray-950) 40%)"
    }}>
      <div className="card glass" style={{ width: "100%", maxWidth: 400, padding: "2.5rem" }}>
        
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 48, height: 48,
            background: "var(--color-brand-500)",
            borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(124, 58, 237, 0.4)"
          }}>
            <svg width="24" height="24" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L5.5 6.5L8 9L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", marginBottom: "0.5rem" }}>
          Welcome Back
        </h1>
        <p style={{ color: "var(--color-gray-400)", textAlign: "center", fontSize: "0.875rem", marginBottom: "2rem" }}>
          Log in to your trading journal
        </p>

        {error && (
          <div style={{
            background: "var(--color-loss-muted)",
            color: "var(--color-loss)",
            padding: "0.75rem",
            borderRadius: "8px",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-group" style={{ gap: "1.25rem" }}>
          <div className="form-group">
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              className="input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label className="label" htmlFor="password">Password</label>
              <Link href="#" style={{ fontSize: "0.75rem", color: "var(--color-brand-400)", textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              required
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-400)" }}>
            Don't have an account?{" "}
            <Link href="/register" style={{ color: "var(--color-brand-400)", textDecoration: "none", fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-gray-800)", paddingTop: "1rem" }}>
            <button 
              type="button" 
              onClick={handleDemoLogin}
              className="btn btn-ghost btn-sm"
              style={{ width: "100%" }}
            >
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--color-gray-950)" }} />}>
      <LoginContent />
    </Suspense>
  )
}
