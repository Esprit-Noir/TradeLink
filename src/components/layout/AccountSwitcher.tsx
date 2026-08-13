"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function AccountSwitcher() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<any[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/accounts")
      .then(r => r.json())
      .then(data => {
        if (data.accounts) {
          setAccounts(data.accounts)
          // Find the one marked active from cookies, or the default one
          // We can determine activeId by reading a cookie value if we could, but client side we can't easily read HttpOnly cookies.
          // Wait, the API can tell us which is active.
          // For now, we will add an endpoint or just rely on a non-HttpOnly cookie, OR have the API return `isActive: true`.
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // A quick fetch to know the active account from the server
    fetch("/api/accounts/active/get")
      .then(r => r.json())
      .then(data => {
        if (data.activeAccountId) setActiveId(data.activeAccountId)
      })
  }, [])

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const accountId = e.target.value
    setActiveId(accountId)
    await fetch("/api/accounts/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    })
    router.refresh()
  }

  if (loading || accounts.length === 0) return null

  return (
    <div style={{ padding: "0 1.25rem", marginBottom: "1rem" }}>
      <select 
        className="input select" 
        value={activeId}
        onChange={handleChange}
        style={{ 
          background: "var(--color-gray-800)", 
          borderColor: "var(--color-gray-700)",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--color-brand-400)"
        }}
      >
        {accounts.map(acc => (
          <option key={acc.id} value={acc.id}>
            {acc.name} ({acc.type === 'demo' ? 'Demo' : acc.type === 'prop_firm' ? 'Prop' : 'Live'})
          </option>
        ))}
      </select>
    </div>
  )
}
