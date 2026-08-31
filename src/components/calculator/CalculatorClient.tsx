"use client"

import { useState, useMemo } from "react"
import { Calculator, AlertTriangle, TrendingUp, Info } from "lucide-react"

interface CalculatorResult {
  positionSize: number
  riskAmount: number
  potentialProfit: number
  riskRewardRatio: number
  pipValue: number
  pipsAtRisk: number
  marginRequired: number
}

function formatNumber(n: number, decimals = 2): string {
  if (isNaN(n) || !isFinite(n)) return "—"
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function CalculatorClient() {
  const [accountBalance, setAccountBalance] = useState<string>("10000")
  const [riskPercent, setRiskPercent] = useState<string>("1")
  const [entryPrice, setEntryPrice] = useState<string>("")
  const [stopLoss, setStopLoss] = useState<string>("")
  const [takeProfit, setTakeProfit] = useState<string>("")
  const [instrumentType, setInstrumentType] = useState<string>("forex")
  const [lotSize, setLotSize] = useState<string>("0.10")
  const [accountCurrency, setAccountCurrency] = useState<string>("USD")

  const result = useMemo<CalculatorResult | null>(() => {
    const balance = parseFloat(accountBalance)
    const entry = parseFloat(entryPrice)
    const sl = parseFloat(stopLoss)
    const tp = parseFloat(takeProfit)
    const lots = parseFloat(lotSize) || 0

    if (!balance || !entry || !sl || entry === sl || lots <= 0) return null

    // Price difference to stop loss
    const slDiff = Math.abs(entry - sl)
    const pipsAtRisk = instrumentType === "forex" ? slDiff * 10000 : slDiff

    // Pip value per lot (simplified)
    let pipValuePerLot: number
    if (instrumentType === "forex") {
      pipValuePerLot = 10
    } else if (instrumentType === "crypto") {
      pipValuePerLot = 1
    } else {
      pipValuePerLot = 1
    }

    // Actual risk amount for the given lot size
    const riskAmount = lots * slDiff * pipValuePerLot * (instrumentType === "forex" ? 10000 : 1)

    // Potential profit
    let tpDiff = 0
    if (takeProfit) {
      tpDiff = Math.abs(tp - entry)
    }
    const potentialProfit = tpDiff > 0 ? lots * tpDiff * pipValuePerLot * (instrumentType === "forex" ? 10000 : 1) : 0

    // Risk/Reward ratio
    const riskRewardRatio = tpDiff > 0 ? tpDiff / slDiff : 0

    // Pip value for the position
    const pipValue = lots * pipValuePerLot

    // Margin required (approximate: 1% margin for forex)
    const marginRequired = instrumentType === "forex" ? lots * 100000 * entry * 0.01 : lots * entry * 0.1

    return {
      positionSize: lots,
      riskAmount,
      potentialProfit,
      riskRewardRatio,
      pipValue,
      pipsAtRisk,
      marginRequired,
    }
  }, [accountBalance, riskPercent, entryPrice, stopLoss, takeProfit, instrumentType, lotSize])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Calculator Form */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem" }}>
        {/* Inputs */}
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Calculator size={18} style={{ color: "var(--color-brand-500)" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-200)" }}>Trade Parameters</h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Account */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Account Balance ({accountCurrency})</label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  style={inputStyle}
                  min="0"
                />
              </div>
              <div>
                <label style={labelStyle}>Risk per Trade (%)</label>
                <input
                  type="number"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                  style={inputStyle}
                  min="0.01"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>

            {/* Instrument */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Instrument Type</label>
                <select value={instrumentType} onChange={(e) => setInstrumentType(e.target.value)} style={inputStyle}>
                  <option value="forex">Forex</option>
                  <option value="crypto">Crypto</option>
                  <option value="indices">Indices</option>
                  <option value="stocks">Stocks</option>
                  <option value="futures">Futures</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Lot Size</label>
                <input
                  type="number"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                  style={inputStyle}
                  min="0.01"
                  step="0.01"
                  placeholder="0.10"
                />
              </div>
              <div>
                <label style={labelStyle}>Currency</label>
                <select value={accountCurrency} onChange={(e) => setAccountCurrency(e.target.value)} style={inputStyle}>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Prices */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Entry Price</label>
                <input
                  type="number"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                  style={inputStyle}
                  placeholder="0.00000"
                  step="any"
                />
              </div>
              <div>
                <label style={labelStyle}>Stop Loss</label>
                <input
                  type="number"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  style={{ ...inputStyle, borderColor: stopLoss ? "rgba(239,68,68,0.3)" : undefined }}
                  placeholder="0.00000"
                  step="any"
                />
              </div>
              <div>
                <label style={labelStyle}>Take Profit</label>
                <input
                  type="number"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                  style={{ ...inputStyle, borderColor: takeProfit ? "rgba(16,185,129,0.3)" : undefined }}
                  placeholder="0.00000"
                  step="any"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="chart-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <TrendingUp size={18} style={{ color: "var(--color-brand-500)" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-gray-200)" }}>Results</h3>
          </div>

          {!result ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-gray-500)", fontSize: "0.85rem" }}>
              <AlertTriangle size={24} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p>Enter entry price and stop loss to calculate</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Risk Amount - Hero */}
              <div style={{ padding: "1rem", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", textAlign: "center" }}>
                <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gray-400)", fontWeight: 600, marginBottom: 4 }}>
                  Risk Amount
                </p>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                  {accountCurrency} {formatNumber(result.riskAmount)}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--color-gray-500)", marginTop: 4 }}>
                  {formatNumber((result.riskAmount / parseFloat(accountBalance || "1")) * 100)}% of balance
                </p>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <MetricCard
                  label="Position Size"
                  value={`${formatNumber(result.positionSize)} lots`}
                  color="var(--color-brand-500)"
                />
                <MetricCard
                  label="Potential Profit"
                  value={takeProfit ? `${accountCurrency} ${formatNumber(result.potentialProfit)}` : "—"}
                  color="var(--color-profit)"
                />
                <MetricCard
                  label="Risk/Reward"
                  value={takeProfit ? `1 : ${formatNumber(result.riskRewardRatio)}` : "—"}
                  color={result.riskRewardRatio >= 2 ? "var(--color-profit)" : result.riskRewardRatio >= 1 ? "var(--color-warning)" : "var(--color-loss)"}
                />
                <MetricCard
                  label="Pips at Risk"
                  value={formatNumber(result.pipsAtRisk, 1)}
                  color="var(--color-warning)"
                />
              </div>

              {/* Risk Reward Visual */}
              {takeProfit && (
                <div style={{ padding: "0.75rem", borderRadius: 8, background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-gray-500)", marginBottom: 8 }}>Risk/Reward Visualization</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--color-loss)", opacity: 0.3 }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>1</span>
                    <div style={{ flex: result.riskRewardRatio, height: 6, borderRadius: 3, background: "var(--color-profit)", opacity: 0.3 }} />
                    <span style={{ fontSize: "0.7rem", color: "var(--color-gray-400)" }}>{formatNumber(result.riskRewardRatio)}</span>
                  </div>
                </div>
              )}

              {/* Warning */}
              {result.riskRewardRatio < 1 && result.riskRewardRatio > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0.6rem 0.8rem", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <Info size={14} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--color-warning)" }}>
                    Risk/Reward ratio below 1:1. Consider adjusting your take profit.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Reference */}
      <div className="chart-card" style={{ padding: "1.25rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-gray-200)", marginBottom: 12 }}>Quick Reference</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, fontSize: "0.75rem", color: "var(--color-gray-400)" }}>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-gray-300)", marginBottom: 4 }}>Risk Rules</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 2 }}>• Max 1-2% risk per trade</li>
              <li style={{ marginBottom: 2 }}>• Max 5% daily loss limit</li>
              <li>• Max 10% weekly loss limit</li>
            </ul>
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-gray-300)", marginBottom: 4 }}>Lot Sizes</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 2 }}>• Standard = 100,000 units</li>
              <li style={{ marginBottom: 2 }}>• Mini = 10,000 units</li>
              <li>• Micro = 1,000 units</li>
            </ul>
          </div>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-gray-300)", marginBottom: 4 }}>Forex Pips</p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: 2 }}>• 1 pip = 0.0001 (EUR/USD)</li>
              <li style={{ marginBottom: 2 }}>• 1 pip = 0.01 (USD/JPY)</li>
              <li>• 1 standard lot = $10/pip</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "0.6rem 0.8rem", borderRadius: 8, background: "var(--color-gray-950)", border: "1px solid var(--color-gray-800)" }}>
      <p style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-gray-500)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: "0.9rem", fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{value}</p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-gray-400)",
  fontWeight: 600,
  marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: 8,
  border: "1px solid var(--color-gray-700)",
  background: "var(--color-gray-950)",
  color: "var(--color-gray-200)",
  fontSize: "0.85rem",
  fontVariantNumeric: "tabular-nums",
  outline: "none",
}
