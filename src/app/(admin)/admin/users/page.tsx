import { prisma } from "@/lib/prisma"
import { UsersTable } from "@/components/admin/UsersTable"

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { accounts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Manage platform users</p>
      </div>
      <UsersTable initialUsers={users} />
    </div>
  )
}
