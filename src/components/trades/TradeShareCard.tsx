"use client"

import { forwardRef } from "react"
import { formatCurrency } from "@/lib/formatters"
import { TrendingUp, TrendingDown, Target, Clock, ArrowRight } from "lucide-react"

type Trade = {
  id: string
  symbol: string
  side: string
  quantity: number
  entryPrice: number
  exitPrice: number | null
  entryAt: string
  exitAt: string | null
  netPnl: number | null
  netPnlUsd?: number | null
  riskAmount?: number | null
  fees: number
  setupTags: string[]
  emotionTags: string[]
  notesPost: string | null
  instrumentType: string
}

interface TradeShareCardProps {
  trade: Trade
}

export const TradeShareCard = forwardRef<HTMLDivElement, TradeShareCardProps>(({ trade }, ref) => {
  const isWin = trade.netPnl !== null && trade.netPnl > 0
  const isLoss = trade.netPnl !== null && trade.netPnl < 0
  
  const pnlColor = isWin ? "text-[var(--color-emerald-400)]" : isLoss ? "text-[var(--color-rose-400)]" : "text-[var(--color-gray-400)]"
  const sideColor = trade.side === "LONG" ? "text-blue-400" : "text-purple-400"
  
  const duration = trade.exitAt ? 
    Math.round((new Date(trade.exitAt).getTime() - new Date(trade.entryAt).getTime()) / 60000) 
    : null

  const formattedPnl = trade.netPnlUsd !== undefined ? trade.netPnlUsd : trade.netPnl

  return (
    <div 
      ref={ref}
      // Fixed size to ensure consistent image aspect ratio (e.g., 800x450)
      className="absolute top-[-9999px] left-[-9999px] w-[800px] h-[450px] bg-[var(--color-gray-950)] text-white overflow-hidden flex flex-col justify-between rounded-xl border border-[var(--color-gray-800)]"
      style={{
        fontFamily: "Inter, sans-serif",
        backgroundImage: "radial-gradient(circle at top right, rgba(30,41,59,1) 0%, rgba(9,9,11,1) 100%)"
      }}
    >
      {/* Top Section */}
      <div className="p-10 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`px-3 py-1 rounded border border-[var(--color-gray-800)] text-sm font-bold tracking-wider ${sideColor}`}>
                {trade.side}
              </div>
              <div className="text-[var(--color-gray-400)] text-sm font-medium tracking-wide flex items-center gap-1">
                <Target size={14} /> {trade.instrumentType}
              </div>
            </div>
            <h1 className="text-6xl font-bold tracking-tight text-white mb-2">
              {trade.symbol}
            </h1>
            <div className="text-[var(--color-gray-400)] text-lg flex items-center gap-2">
              <span>{new Date(trade.entryAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {duration !== null && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--color-gray-600)]" />
                  <span className="flex items-center gap-1"><Clock size={16} /> {duration} min</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[var(--color-gray-400)] text-sm uppercase tracking-widest font-semibold mb-2">Net Result</div>
            <div className={`text-6xl font-black ${pnlColor} flex items-center justify-end gap-2`}>
              {isWin ? <TrendingUp size={48} strokeWidth={3} /> : isLoss ? <TrendingDown size={48} strokeWidth={3} /> : null}
              {trade.netPnl !== null ? formatCurrency(formattedPnl || 0) : "Open"}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Execution */}
      <div className="px-10 py-6">
        <div className="flex items-center gap-8 bg-[var(--color-gray-900)]/50 rounded-xl p-6 border border-[var(--color-gray-800)] shadow-inner">
          <div className="flex-1">
            <div className="text-[var(--color-gray-500)] text-sm uppercase tracking-widest font-medium mb-1">Entry Price</div>
            <div className="text-2xl font-semibold font-mono text-white">{trade.entryPrice}</div>
          </div>
          <div className="text-[var(--color-gray-600)]">
            <ArrowRight size={24} />
          </div>
          <div className="flex-1">
            <div className="text-[var(--color-gray-500)] text-sm uppercase tracking-widest font-medium mb-1">Exit Price</div>
            <div className="text-2xl font-semibold font-mono text-white">{trade.exitPrice || "---"}</div>
          </div>
          <div className="flex-1 border-l border-[var(--color-gray-800)] pl-8">
            <div className="text-[var(--color-gray-500)] text-sm uppercase tracking-widest font-medium mb-1">Quantity</div>
            <div className="text-2xl font-semibold font-mono text-white">{trade.quantity}</div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Setups & Branding */}
      <div className="px-10 py-8 pt-4 flex justify-between items-end">
        <div>
          {trade.setupTags.length > 0 && (
            <div className="flex gap-2">
              {trade.setupTags.map((tag) => (
                <div key={tag} className="px-4 py-2 bg-[var(--color-gray-800)]/80 text-[var(--color-gray-300)] rounded-lg text-sm font-medium border border-[var(--color-gray-700)]">
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold tracking-tight text-white flex items-center justify-end gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-black">TL</div>
            TradeLink
          </div>
          <div className="text-[var(--color-gray-500)] text-sm">Verified Trade Record</div>
        </div>
      </div>
    </div>
  )
})

TradeShareCard.displayName = "TradeShareCard"
