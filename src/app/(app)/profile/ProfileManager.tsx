"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@prisma/client"
import { User as UserIcon, Settings, Link as LinkIcon, CreditCard, Shield, Save } from "lucide-react"
import { toast } from "sonner"

export function ProfileManager({ user }: { user: User }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")
  const [saving, setSaving] = useState(false)

  // Form State
  const [name, setName] = useState(user.name || "")
  const [baseCurrency, setBaseCurrency] = useState(user.baseCurrency || "USD")
  const [timezone, setTimezone] = useState(user.timezone || "UTC")

  const TABS = [
    { id: "general", label: "General Profile", icon: <UserIcon size={18} /> },
    { id: "preferences", label: "Platform Preferences", icon: <Settings size={18} /> },
    { id: "integrations", label: "Integrations & APIs", icon: <LinkIcon size={18} /> },
    { id: "billing", label: "Billing & Subscription", icon: <CreditCard size={18} /> },
    { id: "security", label: "Security", icon: <Shield size={18} /> },
  ]

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error("Failed to save profile")
      toast.success("Profile saved successfully!")
      router.refresh()
    } catch (err) {
      toast.error("An error occurred while saving your profile.")
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseCurrency, timezone })
      })
      if (!res.ok) throw new Error("Failed to save preferences")
      toast.success("Preferences saved successfully!")
      router.refresh()
    } catch (err) {
      toast.error("An error occurred while saving preferences.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start" }}>
      
      {/* Sidebar Navigation */}
      <div style={{ width: "260px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.85rem 1rem",
              borderRadius: "8px",
              background: activeTab === tab.id ? "var(--color-brand-500)" : "transparent",
              color: activeTab === tab.id ? "#fff" : "var(--color-gray-400)",
              border: "none", cursor: "pointer",
              fontWeight: activeTab === tab.id ? 600 : 500,
              textAlign: "left",
              transition: "all 0.2s ease"
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, maxWidth: "800px" }}>
        
        {activeTab === "general" && (
          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Personal Details</h2>
            
            <form onSubmit={handleSaveGeneral} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-brand-500)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "2rem", fontWeight: 700 }}>
                  {user.email.substring(0, 1).toUpperCase()}
                </div>
                <div>
                  <button type="button" className="btn btn-outline" style={{ marginBottom: "0.5rem" }}>Upload Avatar</button>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-gray-500)" }}>Recommended size: 256x256px. Max 2MB.</p>
                </div>
              </div>

              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. John Doe" />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" value={user.email} disabled style={{ opacity: 0.6 }} />
                <p style={{ fontSize: "0.8rem", color: "var(--color-gray-500)", marginTop: "0.5rem" }}>Contact support to change your email address.</p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Platform Preferences</h2>
            
            <form onSubmit={handleSavePreferences} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
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
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">EST (New York)</option>
                    <option value="Europe/Paris">CET (Paris)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div>
                  <label className="label">Theme</label>
                  <select className="input select" defaultValue="system">
                    <option value="system">System Default</option>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                  </select>
                </div>
                <div>
                  <label className="label">Starting Day of the Week</label>
                  <select className="input select" defaultValue="monday">
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="card" style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Integrations & APIs</h2>
              <span className="badge" style={{ background: "var(--color-brand-500)", color: "#fff" }}>Coming Soon</span>
            </div>
            <p style={{ color: "var(--color-gray-400)", lineHeight: 1.6, marginBottom: "2rem" }}>
              Automatically sync your trades directly from your broker. We are currently building deep integrations with major platforms.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {["TradeLocker", "MetaTrader 5", "cTrader"].map(broker => (
                <div key={broker} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", border: "1px solid var(--color-border)", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--color-bg)", border: "1px solid var(--color-border)" }} />
                    <span style={{ fontWeight: 600 }}>{broker}</span>
                  </div>
                  <button className="btn btn-outline" disabled style={{ opacity: 0.5 }}>Connect</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Billing & Subscription</h2>
            <div style={{ padding: "1.5rem", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="badge" style={{ background: "rgba(34,197,94,0.15)", color: "var(--color-profit)", marginBottom: "0.5rem" }}>Active Plan</span>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem" }}>TradeLink Pro</h3>
                <p style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>Next billing date: <strong>Nov 1st, 2026</strong></p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>$29<span style={{ fontSize: "1rem", color: "var(--color-gray-500)", fontWeight: 500 }}>/mo</span></div>
                <button className="btn btn-outline" style={{ marginTop: "1rem" }}>Manage Billing</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="card" style={{ padding: "2rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem" }}>Security Settings</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); toast.success("Password updated!") }} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label className="label">Current Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">New Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input" placeholder="••••••••" />
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "2rem" }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  Update Password
                </button>
              </div>
            </form>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
              <div>
                <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Two-Factor Authentication (2FA)</h3>
                <p style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>Add an extra layer of security to your account.</p>
              </div>
              <button className="btn btn-outline" onClick={() => toast.success("2FA setup initiated!")}>Enable 2FA</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
