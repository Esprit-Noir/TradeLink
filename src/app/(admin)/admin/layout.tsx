import { requireAdmin } from "@/lib/admin-auth"
import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="app-layout">
      <AdminSidebar />
      <main className="main-content" style={{ background: "var(--color-gray-950)" }}>
        {children}
      </main>
    </div>
  )
}
