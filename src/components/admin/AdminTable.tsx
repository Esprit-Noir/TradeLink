"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface AdminTableProps<T> {
  columns: Column<T>[]
  data: T[]
  totalItems: number
  pageSize?: number
  currentPage: number
  onPageChange: (page: number) => void
  onSearch?: (query: string) => void
  searchPlaceholder?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
}

export function AdminTable<T extends { id: string }>({
  columns,
  data,
  totalItems,
  pageSize = 20,
  currentPage,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  sortBy,
  onSort,
}: AdminTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const totalPages = Math.ceil(totalItems / pageSize)

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  return (
    <div>
      {/* Search */}
      {onSearch && (
        <div style={{ marginBottom: 16, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-gray-500)" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%", maxWidth: 320, padding: "0.5rem 0.75rem 0.5rem 2rem",
              borderRadius: 8, border: "1px solid var(--color-gray-700)",
              background: "var(--color-gray-900)", color: "var(--color-gray-200)",
              fontSize: "0.8rem", outline: "none",
            }}
          />
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--color-gray-800)", borderRadius: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-gray-800)" }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  style={{
                    padding: "0.75rem 1rem", textAlign: "left", fontWeight: 600,
                    color: "var(--color-gray-400)", fontSize: "0.7rem", textTransform: "uppercase",
                    letterSpacing: "0.05em", whiteSpace: "nowrap",
                    cursor: col.sortable ? "pointer" : "default",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {col.sortable && (
                      <ArrowUpDown size={12} style={{ opacity: sortBy === col.key ? 1 : 0.4 }} />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--color-gray-800)" }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: "0.6rem 1rem", color: "var(--color-gray-300)" }}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ padding: "2rem", textAlign: "center", color: "var(--color-gray-500)" }}>
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
          <span>Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: 6, borderRadius: 6, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-300)", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ padding: "0 8px" }}>{currentPage} / {totalPages}</span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: 6, borderRadius: 6, border: "1px solid var(--color-gray-700)", background: "var(--color-gray-900)", color: "var(--color-gray-300)", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
