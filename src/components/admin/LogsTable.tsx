"use client"

import { useState } from "react"
import { AdminTable, Column } from "@/components/admin/AdminTable"
import { Badge } from "@/components/admin/Badge"

export interface Log {
  id: string
  action: string
  reason: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  admin: { id: string; email: string; name: string | null }
  targetUser: { id: string; email: string; name: string | null } | null
}

const ACTION_VARIANTS: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  ROLE_CHANGED: "info",
  USER_SUSPENDED: "warning",
  USER_ACTIVATED: "success",
  USER_BANNED: "danger",
  USER_DELETED: "danger",
  PLAN_CHANGED: "info",
  IMPERSONATION_STARTED: "warning",
}

export function LogsTable({ initialLogs }: { initialLogs: Log[] }) {
  const [logs] = useState(initialLogs)
  const [actionFilter, setActionFilter] = useState("")

  const filteredLogs = actionFilter ? logs.filter(l => l.action === actionFilter) : logs

  const columns: Column<Log>[] = [
    {
      key: "createdAt",
      label: "Time",
      sortable: true,
      render: (log) => (
        <span style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "admin",
      label: "Admin",
      render: (log) => (
        <span style={{ fontSize: "0.8rem" }}>{log.admin.email}</span>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (log) => (
        <Badge variant={ACTION_VARIANTS[log.action] || "default"}>
          {log.action}
        </Badge>
      ),
    },
    {
      key: "targetUser",
      label: "Target",
      render: (log) => log.targetUser ? (
        <span style={{ fontSize: "0.8rem" }}>{log.targetUser.email}</span>
      ) : (
        <span style={{ color: "var(--color-gray-600)" }}>—</span>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (log) => (
        <span style={{ fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
          {log.reason || "—"}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-300)", fontSize: "0.8rem" }}
        >
          <option value="">All Actions</option>
          <option value="ROLE_CHANGED">Role Changed</option>
          <option value="USER_SUSPENDED">User Suspended</option>
          <option value="USER_ACTIVATED">User Activated</option>
          <option value="USER_BANNED">User Banned</option>
          <option value="USER_DELETED">User Deleted</option>
          <option value="PLAN_CHANGED">Plan Changed</option>
          <option value="IMPERSONATION_STARTED">Impersonation</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={filteredLogs}
        totalItems={filteredLogs.length}
        currentPage={1}
        onPageChange={() => {}}
      />
    </div>
  )
}
