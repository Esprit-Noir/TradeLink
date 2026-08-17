"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/overview"
  
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
      position: "relative",
      background: "radial-gradient(circle at top, var(--color-brand-900) 0%, var(--color-gray-950) 40%)"
    }}>
      <Link 
        href="/"
        className="btn btn-ghost"
        style={{
          position: "absolute",
          top: "2rem",
          left: "2rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          color: "var(--color-gray-300)"
        }}
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="card glass" style={{ width: "100%", maxWidth: 400, padding: "2.5rem" }}>
        
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <img src="/logo-light.png" alt="TradeLink" className="logo-light" style={{ height: "80px", objectFit: "contain" }} />
          <img src="/logo-dark.png" alt="TradeLink" className="logo-dark" style={{ height: "80px", objectFit: "contain" }} />
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
              <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>
                Forgot password?
              </span>
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
