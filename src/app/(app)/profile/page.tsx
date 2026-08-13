import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Profile",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { accounts: true }
  })

  if (!user) return null

  const defaultAccount = user.accounts.find(a => a.isDefault)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account and trading preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1.5rem", maxWidth: "600px" }}>
        
        {/* User Info */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Account Information</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" value={user.email} disabled style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label className="label">Timezone</label>
              <input type="text" className="input" value={user.timezone} disabled style={{ opacity: 0.7 }} />
              <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: "0.25rem" }}>Timezone is set automatically.</p>
            </div>
          </div>
        </div>

        {/* Trading Account */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Default Trading Account</h2>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <label className="label">Account Name</label>
              <input type="text" className="input" value={defaultAccount?.name || "No account found"} disabled style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label className="label">Initial Balance</label>
              <input type="text" className="input" value={defaultAccount?.initialBalance ? `$${Number(defaultAccount.initialBalance).toLocaleString()}` : "$0"} disabled style={{ opacity: 0.7 }} />
            </div>
            <div>
              <label className="label">Base Currency</label>
              <input type="text" className="input" value={defaultAccount?.baseCurrency || "USD"} disabled style={{ opacity: 0.7 }} />
            </div>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-gray-500)", marginTop: "1.5rem", fontStyle: "italic" }}>
            Note: Account editing is disabled in this MVP version.
          </p>
        </div>

      </div>
    </div>
  )
}
