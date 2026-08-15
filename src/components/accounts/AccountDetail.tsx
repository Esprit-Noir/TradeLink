"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Cell,
} from "recharts"
import { ArrowLeft, Wallet, TrendingUp, Target, Activity, Pencil, Check } from "lucide-react"
import { formatCurrency } from "@/lib/formatters"
import { toast } from "sonner"

export function AccountDetail({ accountId }: { accountId: string }) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/accounts/${accountId}/detail`)
      if (res.status === 404) {
        setNotFound(true)
        return
      }
      if (!res.ok) throw new Error("Failed")
      setData(await res.json())
    } catch {
      toast.error("Failed to load account")
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    load()
  }, [load])

  const setActive = async () => {
    try {
      await fetch("/api/accounts/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      })
      toast.success("Set as active account")
      load()
    } catch {
      toast.error("Failed to set active account")
    }
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          initialBalance: editForm.initialBalance,
          fxRateToUsd: editForm.fxRateToUsd,
          isDefault: editForm.isDefault,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success("Account updated")
      setEditing(false)
      load()
    } catch {
      toast.error("Failed to update account")
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 220 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    )
  }

  if (notFound || !data) {
    return <div className="empty-state">Account not found.</div>
  }

  const { account, challenge, stats, equityCurve, daily, symbols, setups, recentTrades } = data
  const ccy = account.baseCurrency || "USD"

  const openEdit = () =>
    setEditForm({
      name: account.name,
      initialBalance: String(account.initialBalance),
      fxRateToUsd: String(account.fxRateToUsd),
      isDefault: account.isDefault,
    })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <button className="btn btn-ghost" onClick={() => router.push("/accounts")} style={{ padding: "0.4rem" }} aria-label="Back">
            <ArrowLeft size={17} />
          </button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <h1 className="page-title" style={{ margin: 0 }}>{account.name}</h1>
              {account.isDefault && (
                <span className="badge" style={{ background: "var(--color-gray-800)", color: "var(--color-gray-300)" }}>Default</span>
              )}
              {challenge && (
                <span className="badge" style={{ background: "rgba(139,92,246,0.12)", color: "var(--color-brand-400)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  {challenge.firmName} · {challenge.status}
                </span>
              )}
            </div>
            <p className="page-subtitle" style={{ margin: "0.2rem 0 0" }}>
              {account.broker || "No broker"} · {ccy} · created {new Date(account.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {!account.isDefault && (
            <button className="btn btn-outline" onClick={setActive}>
              <Check size={15} /> Set active
            </button>
          )}
          <button className="btn btn-outline" onClick={openEdit}>
            <Pencil size={15} /> Edit
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem" }}>
        <div className="kpi-card">
          <div className="kpi-label"><Wallet size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Current Equity</div>
          <div className="kpi-value">{formatCurrency(stats.currentEquity, ccy, false, 2)}</div>
          <div className="kpi-sub">initial {formatCurrency(account.initialBalance, ccy, false, 0)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><TrendingUp size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Net P&L</div>
          <div className="kpi-value" style={{ color: stats.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
            {formatCurrency(stats.netPnl, ccy, true, 2)}
          </div>
          <div className="kpi-sub">{stats.returnPct >= 0 ? "+" : ""}{stats.returnPct.toFixed(2)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><Activity size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Max Drawdown</div>
          <div className="kpi-value" style={{ color: "var(--color-loss)" }}>{stats.maxDrawdownPct.toFixed(2)}%</div>
          <div className="kpi-sub">{formatCurrency(stats.maxDrawdown, ccy, true, 0)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><Target size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Win rate</div>
          <div className="kpi-value">{stats.winRate.toFixed(1)}%</div>
          <div className="kpi-sub">PF {stats.profitFactor === 99 ? "∞" : stats.profitFactor.toFixed(2)} · avg R {stats.avgRR.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><TrendingUp size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} /> Expectancy</div>
          <div className="kpi-value" style={{ color: stats.expectancy >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
            {formatCurrency(stats.expectancy, ccy, true, 2)}
          </div>
          <div className="kpi-sub">per trade · {stats.totalTrades} trades</div>
        </div>
      </div>

      {/* Equity curve */}
      <div className="chart-card">
        <div className="chart-title">Equity Curve</div>
        {equityCurve.length <= 1 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <p style={{ fontSize: "0.85rem" }}>No closed trades on this account yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={equityCurve} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--color-gray-500)" }} tickLine={false} axisLine={false} tickFormatter={(d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} tickLine={false} axisLine={false} width={52} domain={["auto", "auto"]} tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)", borderRadius: 8, fontSize: 12, color: "var(--color-gray-200)" }}
                formatter={(value: any) => [`${formatCurrency(Number(value), ccy, false, 2)}`, "Equity"]}
              />
              <ReferenceLine y={account.initialBalance} stroke="var(--color-gray-700)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="equity" stroke={stats.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Daily P&L */}
      <div className="chart-card">
        <div className="chart-title">Daily P&L</div>
        {daily.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <p style={{ fontSize: "0.85rem" }}>No daily data.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-gray-800)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--color-gray-500)" }} tickLine={false} axisLine={false} tickFormatter={(d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`} />
              <YAxis tick={{ fontSize: 10, fill: "var(--color-gray-500)" }} tickLine={false} axisLine={false} width={52} />
              <Tooltip contentStyle={{ background: "var(--color-gray-800)", border: "1px solid var(--color-gray-700)", borderRadius: 8, fontSize: 12, color: "var(--color-gray-200)" }} />
              <ReferenceLine y={0} stroke="var(--color-gray-600)" />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
                {daily.map((d: any, i: number) => (
                  <Cell key={i} fill={d.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Symbols + Setups */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.5rem" }}>
        <div className="chart-card">
          <div className="chart-title">Symbols</div>
          {symbols.length === 0 ? (
            <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No trades yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {symbols.slice(0, 10).map((s: any) => (
                <div key={s.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--color-gray-300)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.symbol}
                    <span style={{ color: "var(--color-gray-500)", marginLeft: "0.35rem", fontSize: "0.72rem" }}>{s.count} · {s.wins}W</span>
                  </span>
                  <span style={{ fontWeight: 600, color: s.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", whiteSpace: "nowrap" }}>
                    {formatCurrency(s.pnl, ccy, true, 2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="chart-card">
          <div className="chart-title">Setups</div>
          {setups.length === 0 ? (
            <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No setups yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {setups.slice(0, 10).map((s: any) => (
                <div key={s.tag} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--color-gray-300)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {s.tag}
                    <span style={{ color: "var(--color-gray-500)", marginLeft: "0.35rem", fontSize: "0.72rem" }}>{s.count} · {(s.winRate * 100).toFixed(0)}%</span>
                  </span>
                  <span style={{ fontWeight: 600, color: s.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)", whiteSpace: "nowrap" }}>
                    {formatCurrency(s.pnl, ccy, true, 2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent trades */}
      <div className="card" style={{ padding: "1.25rem" }}>
        <div className="chart-title" style={{ marginBottom: "0.75rem" }}>Recent trades</div>
        {recentTrades.length === 0 ? (
          <div style={{ color: "var(--color-gray-500)", fontSize: "0.85rem" }}>No closed trades yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Exit</th>
                  <th>R</th>
                  <th>Setups</th>
                  <th style={{ textAlign: "right" }}>Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.symbol}</td>
                    <td>
                      <span className="badge" style={{ background: t.side === "long" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: t.side === "long" ? "var(--color-profit)" : "var(--color-loss)" }}>
                        {t.side}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-gray-400)", fontSize: "0.8rem" }}>
                      {t.exitAt ? new Date(t.exitAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                    </td>
                    <td style={{ color: t.rMultiple != null ? (t.rMultiple >= 0 ? "var(--color-profit)" : "var(--color-loss)") : "var(--color-gray-500)" }}>
                      {t.rMultiple != null ? `${t.rMultiple >= 0 ? "+" : ""}${t.rMultiple.toFixed(2)}R` : "—"}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--color-gray-400)" }}>{(t.setupTags || []).slice(0, 2).join(", ")}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: t.netPnl >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
                      {formatCurrency(t.netPnl, ccy, true, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ marginTop: "0.75rem", textAlign: "right" }}>
          <Link className="btn btn-outline" style={{ fontSize: "0.82rem" }} href={`/trades?accountId=${account.id}`}>
            View all trades →
          </Link>
        </div>
      </div>

      {/* Edit modal */}
      {editing && editForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={() => setEditing(false)}>
          <div className="card" style={{ width: "100%", maxWidth: 440, padding: "1.5rem" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1.05rem" }}>Edit Account</h3>
              <button onClick={() => setEditing(false)} style={{ background: "transparent", border: "none", color: "var(--color-gray-400)", cursor: "pointer", fontSize: "1.4rem" }}>&times;</button>
            </div>
            <form onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Account Name</label>
                <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Initial Balance</label>
                <input className="input" type="number" value={editForm.initialBalance} onChange={e => setEditForm({ ...editForm, initialBalance: e.target.value })} />
              </div>
              <div>
                <label className="label">FX Rate to USD</label>
                <input className="input" type="number" step="0.0001" value={editForm.fxRateToUsd} onChange={e => setEditForm({ ...editForm, fxRateToUsd: e.target.value })} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-gray-300)", cursor: "pointer" }}>
                <input type="checkbox" checked={!!editForm.isDefault} onChange={e => setEditForm({ ...editForm, isDefault: e.target.checked })} />
                Set as default account
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
