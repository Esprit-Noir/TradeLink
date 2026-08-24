"use client"

import { useEffect, useState, useMemo } from "react"
import { CreateSetupModal } from "./CreateSetupModal"
import { SetupDetailPanel } from "./SetupDetailPanel"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/formatters"
import { Check, Trash2, Target, TrendingUp, Pencil, X, Save, ArrowDownWideNarrow, Search, Eye } from "lucide-react"

type Setup = {
  id: string
  name: string
  description: string | null
  isDefault: boolean
  count: number
  winRate: number
  netPnl: number
  netPnlUsd: number
  losses: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  avgR: number
  best: number
  worst: number
  recentCount: number
  lastTradeAt: string | null
  series: number[]
}

type SortKey = "pnl" | "winrate" | "trades" | "name"

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "pnl", label: "Best P&L" },
  { key: "winrate", label: "Win rate" },
  { key: "trades", label: "Most trades" },
  { key: "name", label: "Name" },
]

function fmt(v: number, sign = false): string {
  const s = v.toLocaleString("en-US", { minimumFractionDigits: 2 })
  return `${sign && v > 0 ? "+" : ""}$${s}`
}

function Sparkline({ series, positive }: { series: number[]; positive: boolean }) {
  if (series.length < 2) {
    return <div style={{ height: 36 }} />
  }
  const min = Math.min(...series)
  const max = Math.max(...series)
  const range = max - min || 1
  const w = 100
  const h = 36
  const pts = series
    .map((v, i) => `${((i / (series.length - 1)) * w).toFixed(1)},${(h - ((v - min) / range) * (h - 4) - 2).toFixed(1)}`)
    .join(" ")
  const last = series[series.length - 1]
  const color = positive ? "var(--color-profit)" : "var(--color-loss)"
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        vectorEffect="non-scaling-stroke"
        opacity={last >= series[0] ? 1 : 0.85}
      />
    </svg>
  )
}

export function SetupsManager() {
  const [setups, setSetups] = useState<Setup[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("pnl")
  const [query, setQuery] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)

  const loadSetups = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/setups")
      const data = await res.json()
      setSetups(data)
    } catch (err) {
      toast.error("Failed to load setups")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSetups()
  }, [])

  const sorted = useMemo(() => {
    let arr = [...setups]
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      arr = arr.filter(s => s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q))
    }
    switch (sortKey) {
      case "name": return arr.sort((a, b) => a.name.localeCompare(b.name))
      case "winrate": return arr.sort((a, b) => (b.count > 0 ? b.winRate : -1) - (a.count > 0 ? a.winRate : -1))
      case "trades": return arr.sort((a, b) => b.count - a.count)
      default: return arr.sort((a, b) => b.netPnl - a.netPnl)
    }
  }, [setups, sortKey, query])

  const totals = useMemo(() => {
    const withTrades = setups.filter(s => s.count > 0)
    const totalPnl = setups.reduce((sum, s) => sum + s.netPnl, 0)
    const totalTrades = setups.reduce((sum, s) => sum + s.count, 0)
    const best = [...setups].sort((a, b) => b.netPnl - a.netPnl)[0]
    const bestWinRate = withTrades.length > 0 ? [...withTrades].sort((a, b) => b.winRate - a.winRate)[0] : null
    const profitable = setups.filter(s => s.netPnl > 0).length
    return { totalPnl, totalTrades, best, bestWinRate, profitable, total: setups.length, withTrades }
  }, [setups])

  const startEdit = (setup: Setup) => {
    setEditingId(setup.id)
    setEditName(setup.name)
    setEditDescription(setup.description || "")
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/setups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save")
      }
      toast.success("Setup updated")
      cancelEdit()
      loadSetups()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const setAsDefault = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/setups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error("Failed to set default")
      toast.success(`${name} is now your default setup`)
      loadSetups()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteSetup = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the setup "${name}"? This won't delete the tags on your existing trades.`)) return
    try {
      const res = await fetch(`/api/setups/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete setup")
      toast.success(`Setup deleted`)
      loadSetups()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Trading Setups</h1>
          <p className="page-subtitle">Manage your strategies, define rules, and track performance.</p>
        </div>
        <div className="actions">
          <CreateSetupModal onCreated={loadSetups} />
        </div>
      </div>

      {/* Global KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem" }}>
        <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-gray-500)" }}>Combined P&L</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", color: totals.totalPnl > 0 ? "var(--color-profit)" : totals.totalPnl < 0 ? "var(--color-loss)" : "var(--color-gray-100)" }}>
            {fmt(totals.totalPnl, true)}
          </div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-500)" }}>{totals.totalTrades} tagged trades</div>
        </div>
        <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-gray-500)" }}>Setups</div>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", letterSpacing: "-0.02em", color: "var(--color-gray-100)" }}>{totals.total}</div>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-500)" }}>{totals.profitable} profitable</div>
        </div>
        {totals.best?.count > 0 && (
          <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-gray-500)" }}>Top setup</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-brand-500)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.02em" }}>
              {totals.best.name}
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-500)" }}>{fmt(totals.best.netPnl, true)} · {totals.best.count} trades</div>
          </div>
        )}
        {totals.bestWinRate && (
          <div className="card-hover" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.5rem", borderRadius: "12px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)" }}>
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", color: "var(--color-gray-500)" }}>Best win rate</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-profit)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.02em" }}>
              {totals.bestWinRate.winRate.toFixed(0)}%
            </div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-gray-500)" }}>{totals.bestWinRate.name}</div>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      {totals.withTrades.length > 0 && (
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-gray-400)", marginBottom: "1rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Setup Leaderboard
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[...totals.withTrades].sort((a, b) => b.netPnl - a.netPnl).slice(0, 6).map((s, i) => {
              const maxPnl = Math.max(...totals.withTrades.map(x => Math.abs(x.netPnl)), 1)
              const width = Math.max(4, (Math.abs(s.netPnl) / maxPnl) * 100)
              const rankColors = ["#ffd700", "#c0c0c0", "#cd7f32"]
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700,
                    background: i < 3 ? `${rankColors[i]}22` : "var(--color-gray-800)",
                    color: i < 3 ? rankColors[i] : "var(--color-gray-400)",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-gray-100)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: s.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", whiteSpace: "nowrap" }}>
                        {fmt(s.netPnl, true)}
                      </span>
                    </div>
                    <div style={{ background: "var(--color-gray-800)", borderRadius: 3, height: 5, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${width}%`, borderRadius: 3,
                        background: s.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)",
                        opacity: 0.85,
                      }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sort bar */}
      {setups.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "var(--radius-button)", padding: "0.35rem 0.6rem" }}>
            <Search size={14} style={{ color: "var(--color-gray-500)" }} />
            <input
              className="input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search setups…"
              style={{ width: 180, padding: "0", border: "none", background: "transparent", fontSize: "0.82rem", boxShadow: "none", outline: "none" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="btn btn-ghost btn-sm" style={{ padding: "0.35rem" }} title="Clear">
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowDownWideNarrow size={15} style={{ color: "var(--color-gray-500)" }} />
            <select
              className="input"
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              style={{ width: 160, padding: "0.35rem 1.8rem 0.35rem 0.6rem", fontSize: "0.82rem" }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          <div className="skeleton card" style={{ height: "260px" }} />
          <div className="skeleton card" style={{ height: "260px" }} />
        </div>
      ) : setups.length === 0 ? (
        <div className="chart-card" style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-gray-500)" }}>
          <Target size={48} style={{ opacity: 0.5, marginBottom: "1rem", margin: "0 auto" }} />
          <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-gray-300)", marginBottom: "0.5rem" }}>No setups defined</div>
          <p style={{ maxWidth: 400, margin: "0 auto", lineHeight: 1.5 }}>
            Create your first trading setup to start tracking its performance automatically based on your trade tags.
          </p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="chart-card" style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--color-gray-500)" }}>
          <Search size={40} style={{ opacity: 0.5, margin: "0 auto 0.75rem" }} />
          <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-gray-300)" }}>No setups match “{query}”</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
          {sorted.map(setup => {
            const isEditing = editingId === setup.id
            const hasTrades = setup.count > 0
            return (
              <div key={setup.id} className="card-hover" style={{ padding: "1.5rem", borderRadius: "16px", background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", display: "flex", flexDirection: "column", position: "relative", gap: "1rem" }}>
                {setup.isDefault && !isEditing && (
                  <div style={{ position: "absolute", top: "1.5rem", right: "1.5rem", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", background: "var(--color-brand-500)", color: "#000", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                    Default
                  </div>
                )}

                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <input
                      className="input"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Setup name"
                      style={{ fontWeight: 600, fontSize: "1rem" }}
                    />
                    <textarea
                      className="input"
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={3}
                      style={{ resize: "none", fontSize: "0.85rem" }}
                    />
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.4rem 0", paddingRight: "4rem", color: "var(--color-gray-100)" }}>{setup.name}</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-gray-400)", margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "1.3em" }}>
                      {setup.description || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No description provided.</span>}
                    </p>
                  </div>
                )}

                {/* Sparkline */}
                {hasTrades && !isEditing && (
                  <div>
                    <Sparkline series={setup.series} positive={setup.netPnl >= 0} />
                    <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)", textAlign: "right", marginTop: "0.2rem" }}>
                      cumulative P&L
                    </div>
                  </div>
                )}

                {/* Main stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", padding: "1rem 0", borderTop: "1px solid var(--color-gray-800)", borderBottom: "1px solid var(--color-gray-800)" }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 700 }}>Win rate</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: hasTrades ? (setup.winRate >= 50 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-gray-600)" }}>
                      {hasTrades ? `${setup.winRate.toFixed(0)}%` : "—"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)" }}>
                      {hasTrades ? `${setup.winRate >= 50 ? "✔" : "✖"} ${setup.count - setup.losses}W / ${setup.losses}L` : "no data"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 700 }}>Net P&L</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: hasTrades ? (setup.netPnl > 0 ? "var(--color-profit)" : setup.netPnl < 0 ? "var(--color-loss)" : "var(--color-gray-600)") : "var(--color-gray-600)" }}>
                      {hasTrades ? formatCurrency(setup.netPnl, "USD", true, 2) : "—"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)" }}>
                      {hasTrades ? `${setup.count} trade${setup.count > 1 ? "s" : ""}` : "no data"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--color-gray-500)", fontWeight: 700 }}>Profit factor</div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 700, color: hasTrades ? (setup.profitFactor >= 1.5 ? "var(--color-profit)" : setup.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)") : "var(--color-gray-600)" }}>
                      {hasTrades ? (setup.profitFactor === 99 ? "∞" : setup.profitFactor.toFixed(2)) : "—"}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-gray-500)" }}>
                      {hasTrades ? `avg R ${setup.avgR >= 0 ? "+" : ""}${setup.avgR.toFixed(2)}` : "no data"}
                    </div>
                  </div>
                </div>

                {/* Secondary stats */}
                {hasTrades && !isEditing && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1rem", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-gray-500)" }}>Avg win</span>
                      <span style={{ color: "var(--color-profit)", fontWeight: 600 }}>{fmt(setup.avgWin, true)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-gray-500)" }}>Avg loss</span>
                      <span style={{ color: "var(--color-loss)", fontWeight: 600 }}>{fmt(setup.avgLoss, true)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-gray-500)" }}>Best</span>
                      <span style={{ color: "var(--color-profit)", fontWeight: 600 }}>{fmt(setup.best, true)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-gray-500)" }}>Worst</span>
                      <span style={{ color: "var(--color-loss)", fontWeight: 600 }}>{fmt(setup.worst, true)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-gray-500)" }}>Last 30 days</span>
                      <span style={{ color: "var(--color-gray-300)", fontWeight: 600 }}>{setup.recentCount} trades</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "var(--color-gray-500)" }}>Last trade</span>
                      <span style={{ color: "var(--color-gray-300)", fontWeight: 600 }}>
                        {setup.lastTradeAt ? new Date(setup.lastTradeAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                    <button className="btn btn-primary" onClick={() => saveEdit(setup.id)} disabled={saving} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <Save size={14} /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button className="btn btn-outline" onClick={cancelEdit} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => startEdit(setup)}
                      title="Edit"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setDetailId(setup.id)}
                      title="View details"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                    >
                      <Eye size={14} /> Details
                    </button>
                    {!setup.isDefault && (
                      <button
                        className="btn btn-outline"
                        onClick={() => setAsDefault(setup.id, setup.name)}
                        style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                      >
                        <Check size={14} /> Set Default
                      </button>
                    )}
                    <button
                      className="btn btn-outline"
                      onClick={() => deleteSetup(setup.id, setup.name)}
                      style={{ display: "flex", justifyContent: "center", alignItems: "center", color: "var(--color-loss)", borderColor: "rgba(239, 68, 68, 0.2)" }}
                      title="Delete Setup"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <SetupDetailPanel setupId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}
