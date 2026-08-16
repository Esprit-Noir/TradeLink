import { prisma } from "@/lib/prisma"
import { LogsTable, type Log } from "@/components/admin/LogsTable"

export default async function AdminLogsPage() {
  const logs = await prisma.adminActionLog.findMany({
    include: {
      admin: { select: { id: true, email: true, name: true } },
      targetUser: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">Track all admin actions on the platform</p>
      </div>
      <LogsTable initialLogs={logs as unknown as Log[]} />
    </div>
  )
}
