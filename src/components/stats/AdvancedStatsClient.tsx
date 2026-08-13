"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { formatCurrency } from "@/lib/formatters"

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function AdvancedStatsClient() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/metrics/advanced")
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {[1,2,3,4].map(i => <div key={i} className="card loading-skeleton" style={{ height: "100px" }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
          <div className="card loading-skeleton" style={{ height: "300px" }} />
          <div className="card loading-skeleton" style={{ height: "300px" }} />
        </div>
      </div>
    )
  }

  if (!data || data.empty) {
    return <div className="empty-state">No trading data available to calculate advanced statistics.</div>
  }

  const { kpis, streaks, drawdown, rrDistribution, dowPerformance, topSymbols, topSetups } = data

  const rrData = Object.entries(rrDistribution).map(([name, value]) => ({ name, value }))
  
  const dowData = dowPerformance.map((pnl: number, index: number) => ({
    name: dayNames[index].substring(0, 3),
    pnl: pnl
  })).filter((d: any, i: number) => !(d.pnl === 0 && (i === 0 || i === 6))) // Remove weekends if 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        
        <div className="kpi-card">
          <div className="kpi-label">Profit Factor</div>
          <div className="kpi-value" style={{ color: kpis.profitFactor >= 2 ? "var(--color-profit)" : kpis.profitFactor >= 1 ? "var(--color-warning)" : "var(--color-loss)" }}>
            {kpis.profitFactor === 99 ? "∞" : kpis.profitFactor.toFixed(2)}
          </div>
          <div className="kpi-sub">Target: {'>'} 2.0</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Expectancy (Per Trade)</div>
          <div className={`kpi-value ${kpis.expectancy >= 0 ? "profit" : "loss"}`}>
            {formatCurrency(kpis.expectancy, "USD", true, 2)}
          </div>
          <div className="kpi-sub">Avg Win: {formatCurrency(kpis.avgWin, "USD", false, 0)} | Avg Loss: {formatCurrency(kpis.avgLoss, "USD", false, 0)}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Max Drawdown</div>
          <div className="kpi-value loss">
            {formatCurrency(drawdown.maxDrawdown, "USD", true, 2)}
          </div>
          <div className="kpi-sub">
            Current: {formatCurrency(drawdown.currentDrawdown, "USD", true, 2)}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Longest Streaks</div>
          <div className="kpi-value">
            <span className="profit">{streaks.longestWinStreak}W</span> / <span className="loss">{streaks.longestLossStreak}L</span>
          </div>
          <div className="kpi-sub">
            Current: {streaks.currentWinStreak > 0 ? `${streaks.currentWinStreak}W` : `${streaks.currentLossStreak}L`}
          </div>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        
        {/* Risk Reward Distribution */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>
            Risk:Reward Distribution (Wins)
          </h3>
          <div style={{ height: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rrData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: "var(--color-gray-800)" }}
                  contentStyle={{ background: "var(--color-gray-900)", border: "1px solid var(--color-gray-800)", borderRadius: "8px", color: "var(--color-gray-100)" }}
                  itemStyle={{ color: "var(--color-brand-500)", fontWeight: 700 }}
                />
                <Bar dataKey="value" name="Trades" fill="var(--color-brand-500)" radius={[0, 4, 4, 0]}>
                  {rrData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--color-brand-500)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of Week Performance */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>
            Day of Week Performance
          </h3>
          <div style={{ height: 250, width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dowData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--color-gray-400)", fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: "var(--color-gray-800)" }}
                  formatter={(val: any) => [formatCurrency(Number(val), "USD", true, 2), "Net P&L"]}
                  labelStyle={{ color: "var(--color-gray-400)" }}
                  contentStyle={{ backgroundColor: "var(--color-gray-900)", borderColor: "var(--color-gray-800)", borderRadius: "8px" }}
                />
                <ReferenceLine y={0} stroke="var(--color-gray-800)" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {dowData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "var(--color-profit)" : "var(--color-loss)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        
        {/* Top Symbols */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Top Symbols</h3>
          {topSymbols.length === 0 ? (
            <div className="empty-state">No data</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topSymbols.map((item: any, i: number) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "var(--color-gray-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-400)" }}>
                      {i + 1}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--color-gray-200)" }}>{item.name}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className={item.pnl >= 0 ? "profit" : "loss"} style={{ fontWeight: 700 }}>
                      {formatCurrency(item.pnl, "USD", true, 2)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{item.count} trades</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Setups */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-gray-100)", marginBottom: "1rem" }}>Top Setups</h3>
          {topSetups.length === 0 ? (
            <div className="empty-state">No data</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topSetups.map((item: any, i: number) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--color-gray-900)", borderRadius: "8px", border: "1px solid var(--color-gray-800)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "var(--color-gray-800)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-gray-400)" }}>
                      {i + 1}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--color-gray-200)" }}>{item.name}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className={item.pnl >= 0 ? "profit" : "loss"} style={{ fontWeight: 700 }}>
                      {formatCurrency(item.pnl, "USD", true, 2)}
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-gray-500)" }}>{item.count} trades</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
