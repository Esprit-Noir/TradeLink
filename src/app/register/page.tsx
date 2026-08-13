"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // 1. Create user
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to register")
      }

      // 2. Sign in automatically
      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (!signInRes?.error) {
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
          Create an Account
        </h1>
        <p style={{ color: "var(--color-gray-400)", textAlign: "center", fontSize: "0.875rem", marginBottom: "2rem" }}>
          Start tracking your edge today
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
            <label className="label" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              required
              className="input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

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
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              className="input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.75rem", marginTop: "0.5rem" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", color: "var(--color-gray-400)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--color-brand-400)", textDecoration: "none", fontWeight: 500 }}>
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
