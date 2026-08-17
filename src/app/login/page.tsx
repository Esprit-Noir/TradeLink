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

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--color-gray-800)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--color-gray-800)" }} />
        </div>

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="btn btn-outline"
          style={{ width: "100%", padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

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
