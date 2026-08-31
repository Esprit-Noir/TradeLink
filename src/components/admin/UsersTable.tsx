"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { AdminTable, Column } from "@/components/admin/AdminTable"
import { Badge } from "@/components/admin/Badge"

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  createdAt: Date
  lastLoginAt: Date | null
  _count: { accounts: number }
}

export function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [, setLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "20",
      search,
      sortBy,
      sortOrder,
    })
    if (roleFilter) params.set("role", roleFilter)
    if (statusFilter) params.set("status", statusFilter)

    try {
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.users)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [page, search, sortBy, sortOrder, roleFilter, statusFilter])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
    setTimeout(fetchUsers, 300)
  }

  const handleSort = (key: string) => {
    setSortBy(key)
    setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    setTimeout(fetchUsers, 100)
  }

  const columns: Column<User>[] = [
    {
      key: "email",
      label: "User",
      sortable: true,
      render: (user) => (
        <Link href={`/admin/users/${user.id}`} style={{ textDecoration: "none" }}>
          <div>
            <div style={{ fontWeight: 500, color: "var(--color-gray-200)" }}>{user.email}</div>
            {user.name && <div style={{ fontSize: "0.7rem", color: "var(--color-gray-500)" }}>{user.name}</div>}
          </div>
        </Link>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (user) => <Badge variant={user.role === "SUPER_ADMIN" ? "warning" : user.role === "ADMIN" ? "info" : "default"}>{user.role}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (user) => <Badge variant={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "warning" : "danger"}>{user.status}</Badge>,
    },
    {
      key: "accounts",
      label: "Accounts",
      render: (user) => user._count.accounts,
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      key: "lastLoginAt",
      label: "Last Login",
      sortable: true,
      render: (user) => user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "—",
    },
  ]

  return (
    <div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); setTimeout(fetchUsers, 100) }}
          style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-300)", fontSize: "0.8rem" }}
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setTimeout(fetchUsers, 100) }}
          style={{ padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-300)", fontSize: "0.8rem" }}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="BANNED">BANNED</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        data={users}
        totalItems={users.length}
        currentPage={page}
        onPageChange={setPage}
        onSearch={handleSearch}
        searchPlaceholder="Search by email or name..."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </div>
  )
}
