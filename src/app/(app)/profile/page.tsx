import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProfileManager } from "./ProfileManager"
import { NotificationPreferences } from "@/components/prop-firm/NotificationPreferences"
import { cookies } from "next/headers"

export const metadata = {
  title: "Profile",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) return null

  const cookieStore = await cookies()
  const uiDensity = cookieStore.get("ui_density")?.value || "comfortable"

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, preferences, and subscriptions.</p>
        </div>
      </div>
      <ProfileManager user={user as any} initialDensity={uiDensity} />
      <div style={{ marginTop: "1.5rem" }}>
        <NotificationPreferences />
      </div>
    </div>
  )
}
