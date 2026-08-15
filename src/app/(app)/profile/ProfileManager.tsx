"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Save, Wallet, Target, List, LayoutList, BookOpenText } from "lucide-react"
import { toast } from "sonner"
import { NotificationPreferences } from "@/components/prop-firm/NotificationPreferences"

type ProfileStats = {
  accounts: number
  challenges: number
  setups: number
  journals: number
  trades: number
}

export function ProfileManager({
  user,
  initialDensity = "comfortable",
  stats,
}: {
  user: any
  initialDensity?: string
  stats: ProfileStats
}) {
  const router = useRouter()

  const [name, setName] = useState(user.name || "")
  const [baseCurrency, setBaseCurrency] = useState(user.baseCurrency || "USD")
  const [timezone, setTimezone] = useState(user.timezone || "UTC")
  const [uiDensity, setUiDensity] = useState(initialDensity)
  const [dailyGoal, setDailyGoal] = useState(user.dailyGoal ? String(user.dailyGoal) : "")

  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const initials = (user.name || user.email)
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPersonal(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Profile updated")
      router.refresh()
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPrefs(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseCurrency,
          timezone,
          dailyGoal: dailyGoal === "" ? null : parseFloat(dailyGoal),
        }),
      })
      if (!res.ok) throw new Error("Failed to save")

      const densityRes = await fetch("/api/preferences/density", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ density: uiDensity }),
      })
      if (!densityRes.ok) throw new Error("Failed to save density")

      toast.success("Preferences saved")
      router.refresh()
    } catch {
      toast.error("Failed to save preferences")
    } finally {
      setSavingPrefs(false)
    }
  }


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ─── Profile header ─────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "1.5rem", display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
        <div style={{
          width: "76px", height: "76px", borderRadius: "50%", flexShrink: 0,
          background: "linear-gradient(135deg, var(--color-brand-500), #7c3aed)",
          color: "#fff", fontSize: "1.7rem", fontWeight: 800,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 6px 20px rgba(139,92,246,0.35)",
        }}>
          {initials || user.email[0].toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-gray-100)" }}>
            {user.name || "Trader"}
          </h2>
          <div style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "0.15rem" }}>{user.email}</div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-gray-500)", marginTop: "0.2rem" }}>
            Member since {memberSince}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <StatChip icon={<Wallet size={15} />} value={stats.accounts} label="Accounts" />
          <StatChip icon={<Target size={15} />} value={stats.challenges} label="Challenges" />
          <StatChip icon={<List size={15} />} value={stats.trades} label="Trades" />
          <StatChip icon={<LayoutList size={15} />} value={stats.setups} label="Setups" />
          <StatChip icon={<BookOpenText size={15} />} value={stats.journals} label="Journals" />
        </div>
      </div>

      {/* ─── Personal details ───────────────────────────────────────────── */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>Personal Details</div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
          Basic information about your account.
        </div>

        <form onSubmit={handleSavePersonal} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label className="label">Full Name</label>
            <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" className="input" value={user.email} disabled style={{ opacity: 0.6 }} />
            <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.4rem" }}>
              Email changes require contacting support.
            </p>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={savingPersonal}>
              <Save size={15} /> {savingPersonal ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Preferences ────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.25rem" }}>Preferences</div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginBottom: "1.25rem" }}>
          Currency, timezone, and trading defaults.
        </div>

        <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div>
              <label className="label">Base Currency</label>
              <select className="input select" value={baseCurrency} onChange={e => setBaseCurrency(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="label">Timezone</label>
              <select className="input select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/Paris">Europe/Paris (CET)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>
            <div>
              <label className="label">UI Density</label>
              <select className="input select" value={uiDensity} onChange={e => setUiDensity(e.target.value)}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
            <div>
              <label className="label">Daily Goal ($)</label>
              <input
                type="number"
                className="input"
                value={dailyGoal}
                onChange={e => setDailyGoal(e.target.value)}
                placeholder="e.g. 250"
              />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={savingPrefs}>
              <Save size={15} /> {savingPrefs ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Notifications ──────────────────────────────────────────────── */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <NotificationPreferences />
      </div>

    </div>
  )
}

function StatChip({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem",
      padding: "0.6rem 0.9rem", borderRadius: "10px",
      background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)",
      minWidth: 84,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--color-brand-500)" }}>
        {icon}
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--color-gray-100)" }}>{value}</span>
      </div>
      <span style={{ fontSize: "0.62rem", color: "var(--color-gray-500)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </span>
    </div>
  )
}
