"use client"

import { LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export function DangerZone() {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="card" style={{ padding: "1.5rem", border: "1px solid rgba(239,68,68,0.25)" }}>
      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-loss)", marginBottom: "0.25rem" }}>
        Danger Zone
      </div>
      <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1rem" }}>
        Log out of your session on this device.
      </div>
      <button onClick={handleLogout} className="btn btn-outline" style={{ color: "var(--color-loss)", borderColor: "rgba(239,68,68,0.35)" }}>
        <LogOut size={15} /> Log out
      </button>
    </div>
  )
}
